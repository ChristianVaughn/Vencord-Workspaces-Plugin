/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { findByPropsLazy } from "@webpack";
import { Animations, ChannelRTCStore, Tooltip, useEffect, useState, useStateFromStores } from "@webpack/common";
import type { CSSProperties } from "react";

import { getCustomTabs, settings } from "../settings";
import { panelStore, SortedGuildStore } from "../stores";
import { openServerTabsModal } from "./ServerTabsModal";

const FolderUtils = findByPropsLazy("move", "toggleGuildFolderExpand");

// Discord-like folder color palette for auto-assigning to tabs
const TAB_COLORS = [
    "#5865F2", // Blurple (for "All Servers")
    "#3BA55C", // Green
    "#FAA61A", // Yellow/Orange
    "#ED4245", // Red
    "#9B59B6", // Purple
    "#E91E63", // Pink
    "#1ABC9C", // Teal
    "#E67E22", // Orange
];

// Force the guild list to re-render
function forceGuildListUpdate() {
    const folders = SortedGuildStore.getGuildFolders();
    const folderWithId = folders.find((f: any) => f.folderId);

    if (folderWithId && FolderUtils) {
        const folderId = folderWithId.folderId;
        FolderUtils.toggleGuildFolderExpand(folderId);
        setTimeout(() => {
            FolderUtils.toggleGuildFolderExpand(folderId);
        }, 10);
    }
}

function TabSidebarContent({ activeTab, onTabClick, onOpenSettings, onClose }: {
    activeTab: string;
    onTabClick: (tabId: string) => void;
    onOpenSettings: () => void;
    onClose: () => void;
}) {
    const tabs = getCustomTabs();

    return (
        <div className="vc-st-sidebar-inner">
            <div className="vc-st-sidebar-header">
                <span>Workspaces</span>
                <button className="vc-st-sidebar-close" onClick={onClose}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
                    </svg>
                </button>
            </div>

            <div className="vc-st-sidebar-content">
                {/* All Servers */}
                <div
                    className="vc-st-sidebar-item"
                    data-active={activeTab === "all"}
                    onClick={() => onTabClick("all")}
                    style={{ "--tab-color": TAB_COLORS[0] } as React.CSSProperties}
                >
                    <Tooltip text="All Servers" position="right">
                        {tooltipProps => (
                            <div {...tooltipProps} className="vc-st-sidebar-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
                                </svg>
                            </div>
                        )}
                    </Tooltip>
                    <span className="vc-st-sidebar-name">All Servers</span>
                </div>

                {/* Custom Tabs */}
                {tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        className="vc-st-sidebar-item"
                        data-active={activeTab === tab.id}
                        onClick={() => onTabClick(tab.id)}
                        style={{ "--tab-color": TAB_COLORS[(index + 1) % TAB_COLORS.length] } as React.CSSProperties}
                    >
                        <Tooltip text={tab.name} position="right">
                            {tooltipProps => (
                                <div {...tooltipProps} className="vc-st-sidebar-icon">
                                    <span>{tab.name.slice(0, 2).toUpperCase()}</span>
                                </div>
                            )}
                        </Tooltip>
                        <span className="vc-st-sidebar-name">{tab.name}</span>
                        <span className="vc-st-sidebar-count">{tab.serverIds.length}</span>
                    </div>
                ))}

                {/* Settings */}
                <div
                    className="vc-st-sidebar-item vc-st-sidebar-settings"
                    onClick={onOpenSettings}
                >
                    <Tooltip text="Manage Workspaces" position="right">
                        {tooltipProps => (
                            <div {...tooltipProps} className="vc-st-sidebar-icon vc-st-settings-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                                </svg>
                            </div>
                        )}
                    </Tooltip>
                    <span className="vc-st-sidebar-name">Manage Workspaces</span>
                </div>
            </div>
        </div>
    );
}

export default ErrorBoundary.wrap((props: { className?: string; }) => {
    // Use our custom store for panel state (provides proper reactivity)
    const [panelOpen, setPanelOpen] = useState(panelStore.getOpen);

    useEffect(() => {
        return panelStore.subscribe(() => setPanelOpen(panelStore.getOpen()));
    }, []);

    const activeTab = useStateFromStores(
        [SortedGuildStore],
        () => settings.store.activeTab || "all"
    );
    const isFullscreen = useStateFromStores(
        [ChannelRTCStore],
        () => ChannelRTCStore.isFullscreenInContext()
    );

    const handleTabClick = (tabId: string) => {
        settings.store.activeTab = tabId;
        forceGuildListUpdate();
    };

    const handleOpenSettings = () => {
        panelStore.setOpen(false);
        openServerTabsModal();
    };

    const handleClose = () => {
        panelStore.setOpen(false);
    };

    // Get guilds bar element for width reference
    const guilds = props.className
        ? document.querySelector(props.className.split(" ").map(c => `.${c}`).join(""))
        : null;

    // Style: hide in fullscreen, flex otherwise (like BetterFolders)
    const sidebarStyle = {
        display: isFullscreen ? "none" : "flex"
    } satisfies CSSProperties;

    const content = (
        <TabSidebarContent
            activeTab={activeTab}
            onTabClick={handleTabClick}
            onOpenSettings={handleOpenSettings}
            onClose={handleClose}
        />
    );

    // If no guilds element found or animation disabled, render without animation
    if (!guilds || !settings.store.sidebarAnim) {
        return panelOpen
            ? <div className="vc-st-sidebar" style={sidebarStyle}>{content}</div>
            : null;
    }

    // Animated version (like BetterFolders)
    return (
        <Animations.Transition
            items={panelOpen}
            from={{ width: 0 }}
            enter={{ width: guilds.getBoundingClientRect().width }}
            leave={{ width: 0 }}
            config={{ duration: 200 }}
        >
            {(animationStyle: any, show: any) =>
                show && (
                    <Animations.animated.div
                        className="vc-st-sidebar"
                        style={{ ...animationStyle, ...sidebarStyle }}
                    >
                        {content}
                    </Animations.animated.div>
                )
            }
        </Animations.Transition>
    );
}, { noop: true });
