/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { ReactNode } from "react";

import TabSidebar from "./components/TabSidebar";
import { TabToggleButton } from "./components/TabToggleButton";
import { getCustomTabs, settings } from "./settings";
import { getGuildFolders } from "./stores";

// Get the set of visible guild IDs based on active tab
function getVisibleGuildIds(): Set<string> | null {
    const activeTabId = settings.store.activeTab;

    // If "all" or no active tab, show everything (return null means no filtering)
    if (!activeTabId || activeTabId === "all") {
        return null;
    }

    const tabs = getCustomTabs();
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return null;

    // Get all guild IDs that should be visible
    const visibleGuildIds = new Set<string>(activeTab.serverIds);

    // Add guilds from selected folders
    const folders = getGuildFolders();
    for (const folder of folders) {
        if (folder.folderId && activeTab.folderIds.includes(folder.folderId)) {
            folder.guildIds.forEach(id => visibleGuildIds.add(id));
        }
    }

    return visibleGuildIds;
}

// Get visible folder IDs
function getVisibleFolderIds(): Set<string> | null {
    const activeTabId = settings.store.activeTab;

    if (!activeTabId || activeTabId === "all") {
        return null;
    }

    const tabs = getCustomTabs();
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return null;

    return new Set(activeTab.folderIds);
}

// Force guild list to update
export function forceGuildListUpdate() {
    // Dispatch events that might trigger re-render
    FluxDispatcher.dispatch({ type: "GUILD_SETTINGS_LOADED_INTEGRATIONS", guildId: "0", integrations: [] });
}

const GRID_STYLE_NAME = "vc-serverTabs-sidebar-grid";

export default definePlugin({
    name: "Workspaces",
    description: "Organize your servers into custom workspaces for quick switching",
    authors: [{ name: "simplyemu", id: 0n }],
    dependencies: ["ServerListAPI"],

    settings,

    // Wrapped component for server list
    renderToggleButton: ErrorBoundary.wrap(TabToggleButton, { noop: true }),

    patches: [
        // Patch GuildsBar to wrap guild nodes (same approach as betterFolders)
        {
            find: '("guildsnav")',
            replacement: {
                // Wrap the guild node component to conditionally hide it
                match: /switch\((\i)\.type\){.+?default:return null}/,
                replace: "return $self.wrapGuildNode($1,()=>{$&});"
            }
        },
        // Inject our sidebar into Discord's layout (like BetterFolders)
        {
            find: "APPLICATION_LIBRARY,render:",
            group: true,
            replacement: [
                {
                    // Render the Workspaces sidebar next to the guilds bar
                    match: /(?<=[[,])((?:!?\i&&)+)\(.{0,50}({className:\i\.\i,themeOverride:\i})\)/g,
                    replace: (m, conditions, props) => `${m},${conditions}$self.TabSidebar(${props})`
                },
                {
                    // Add grid styles to fix alignment
                    match: /(?<=className:)\i\.\i(?=,"data-fullscreen")/,
                    replace: `"${GRID_STYLE_NAME} "+$&`
                }
            ]
        }
    ],

    start() {
        addServerListElement(ServerListRenderPosition.Above, this.renderToggleButton);
        // Ensure panel is closed on start
        settings.store.panelOpen = false;
    },

    stop() {
        removeServerListElement(ServerListRenderPosition.Above, this.renderToggleButton);
        settings.store.panelOpen = false;
    },

    // Wrap guild/folder nodes to hide them if not in active tab
    wrapGuildNode(node: any, originalComponent: () => ReactNode) {
        const visibleGuildIds = getVisibleGuildIds();
        const visibleFolderIds = getVisibleFolderIds();

        // If no filtering active, show everything
        if (visibleGuildIds === null) {
            return originalComponent();
        }

        // Check if this node should be visible
        if (node.type === "guild") {
            if (visibleGuildIds.has(node.id)) {
                return originalComponent();
            }
            // Use display:none wrapper to preserve scroll behavior
            return (
                <div style={{ display: "none" }} key={node.id}>
                    {originalComponent()}
                </div>
            );
        }

        if (node.type === "folder") {
            // Check if folder itself is selected
            const folderSelected = visibleFolderIds?.has(node.id);

            // Check which children are visible
            const visibleChildren = node.children?.filter((child: any) =>
                child.type === "guild" && visibleGuildIds.has(child.id)
            ) || [];

            // If no visible children and folder not selected, hide completely
            if (!folderSelected && visibleChildren.length === 0) {
                return (
                    <div style={{ display: "none" }} key={node.id}>
                        {originalComponent()}
                    </div>
                );
            }

            // If folder is selected, show it normally
            if (folderSelected) {
                return originalComponent();
            }

            // If only some servers in folder are selected (not the folder itself),
            // show the folder but it will only contain the visible servers
            return originalComponent();
        }

        // Other node types (like guild-folder-divider) - show them
        return originalComponent();
    },

    TabSidebar,
});
