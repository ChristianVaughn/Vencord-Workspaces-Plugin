/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { findByPropsLazy } from "@webpack";
import { Button, Forms, GuildStore, TextInput, useState } from "@webpack/common";

import { CustomTab, getCustomTabs, setCustomTabs, settings } from "../settings";
import { SortedGuildStore } from "../stores";

const FolderUtils = findByPropsLazy("move", "toggleGuildFolderExpand");

function getGuildIconUrl(guildId: string, icon: string | null, size = 40): string | null {
    if (!icon) return null;
    const format = icon.startsWith("a_") ? "gif" : "webp";
    return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${format}?size=${size}`;
}

// Force the guild list to re-render by toggling a folder
function forceGuildListUpdate() {
    const folders = SortedGuildStore.getGuildFolders();
    const folderWithId = folders.find((f: any) => f.folderId);

    if (folderWithId && FolderUtils) {
        const folderId = folderWithId.folderId;
        // Toggle folder expand to trigger re-render
        FolderUtils.toggleGuildFolderExpand(folderId);
        // Toggle back to restore state
        setTimeout(() => {
            FolderUtils.toggleGuildFolderExpand(folderId);
        }, 10);
    }
}

function ServerTabsModalContent({ onClose, transitionState }: ModalProps) {
    const [tabs, setTabsState] = useState<CustomTab[]>(getCustomTabs);
    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const guilds = Object.values(GuildStore.getGuilds());
    const selectedTab = selectedTabId ? tabs.find(t => t.id === selectedTabId) : null;

    const saveTabs = (newTabs: CustomTab[]) => {
        setTabsState(newTabs);
        setCustomTabs(newTabs);
    };

    const createTab = () => {
        if (tabs.length >= 10) return;
        const newTab: CustomTab = {
            id: `tab-${Date.now()}`,
            name: `Tab ${tabs.length + 1}`,
            serverIds: [],
            folderIds: [],
        };
        saveTabs([...tabs, newTab]);
        setSelectedTabId(newTab.id);
        setEditName(newTab.name);
    };

    const deleteTab = (tabId: string) => {
        saveTabs(tabs.filter(t => t.id !== tabId));
        if (settings.store.activeTab === tabId) {
            settings.store.activeTab = "all";
            forceGuildListUpdate();
        }
        if (selectedTabId === tabId) {
            setSelectedTabId(null);
        }
    };

    const selectTab = (tab: CustomTab) => {
        setSelectedTabId(tab.id);
        setEditName(tab.name);
    };

    const saveEdit = () => {
        if (!selectedTab) return;
        saveTabs(tabs.map(t => t.id === selectedTab.id ? { ...t, name: editName } : t));
    };

    const toggleServer = (guildId: string) => {
        if (!selectedTab) return;
        const has = selectedTab.serverIds.includes(guildId);
        const updated = {
            ...selectedTab,
            serverIds: has
                ? selectedTab.serverIds.filter(id => id !== guildId)
                : [...selectedTab.serverIds, guildId]
        };
        saveTabs(tabs.map(t => t.id === updated.id ? updated : t));
    };

    const isServerSelected = (guildId: string) => {
        return selectedTab?.serverIds.includes(guildId) ?? false;
    };

    return (
        <ModalRoot transitionState={transitionState} size={ModalSize.MEDIUM}>
            <ModalHeader className="vc-st-modal-header">
                <Forms.FormTitle tag="h2" style={{ margin: 0 }}>
                    Workspaces
                </Forms.FormTitle>
                <ModalCloseButton onClick={onClose} />
            </ModalHeader>

            <ModalContent className="vc-st-modal-content">
                <div className="vc-st-modal-layout">
                    {/* Left Panel - Tab List */}
                    <div className="vc-st-modal-tabs">
                        <div className="vc-st-modal-tabs-list">
                            {tabs.map(tab => (
                                <div
                                    key={tab.id}
                                    className="vc-st-modal-tab"
                                    data-selected={selectedTabId === tab.id}
                                    onClick={() => selectTab(tab)}
                                >
                                    <span className="vc-st-modal-tab-name">{tab.name}</span>
                                    <span className="vc-st-modal-tab-count">{tab.serverIds.length}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            className="vc-st-modal-new-btn"
                            onClick={createTab}
                            disabled={tabs.length >= 10}
                        >
                            + New
                        </button>
                    </div>

                    {/* Right Panel - Edit Area */}
                    {selectedTab ? (
                        <div className="vc-st-modal-edit">
                            <div className="vc-st-modal-edit-header">
                                <span className="vc-st-modal-edit-title">Edit Workspace</span>
                                <Button
                                    size={Button.Sizes.TINY}
                                    color={Button.Colors.RED}
                                    onClick={() => deleteTab(selectedTab.id)}
                                >
                                    Delete
                                </Button>
                            </div>

                            <div className="vc-st-modal-edit-content">
                                <div className="vc-st-modal-edit-name">
                                    <TextInput
                                        value={editName}
                                        onChange={setEditName}
                                        onBlur={saveEdit}
                                        placeholder="Workspace name..."
                                    />
                                </div>

                                <div className="vc-st-modal-servers-label">Select Servers</div>
                                <div className="vc-st-modal-servers">
                                    {guilds.map(guild => {
                                        const iconUrl = getGuildIconUrl(guild.id, guild.icon);
                                        const selected = isServerSelected(guild.id);
                                        return (
                                            <div
                                                key={guild.id}
                                                className="vc-st-server-item"
                                                data-selected={selected}
                                                onClick={() => toggleServer(guild.id)}
                                            >
                                                <div className="vc-st-server-icon">
                                                    {iconUrl ? (
                                                        <img src={iconUrl} alt="" />
                                                    ) : (
                                                        <span>{guild.name.slice(0, 2)}</span>
                                                    )}
                                                </div>
                                                <span className="vc-st-server-name">{guild.name}</span>
                                                <div className="vc-st-check" data-checked={selected}>
                                                    {selected && "✓"}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="vc-st-modal-empty">
                            <div className="vc-st-modal-empty-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zM6 7h5v5H6V7zm7 0h5v2h-5V7zm0 4h5v2h-5v-2zm0 4h5v2h-5v-2zm-7 0h5v2H6v-2z"/>
                                </svg>
                            </div>
                            <div className="vc-st-modal-empty-text">
                                {tabs.length === 0
                                    ? "Create a workspace to get started"
                                    : "Select a workspace to edit"
                                }
                            </div>
                        </div>
                    )}
                </div>
            </ModalContent>

            <ModalFooter className="vc-st-modal-footer">
                <Button onClick={onClose}>Close</Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export function openServerTabsModal() {
    openModal(props => <ServerTabsModalContent {...props} />);
}
