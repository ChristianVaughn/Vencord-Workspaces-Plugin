/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy, findStoreLazy } from "@webpack";
import { GuildChannelStore, GuildStore, ReadStateStore, SelectedGuildStore } from "@webpack/common";

import { CustomTab, getCustomTabs, settings } from "./settings";

// Simple pub/sub for panel state - provides proper React reactivity
type Listener = () => void;
const panelListeners = new Set<Listener>();

export const panelStore = {
    getOpen: () => settings.store.panelOpen,
    toggle() {
        settings.store.panelOpen = !settings.store.panelOpen;
        panelListeners.forEach(l => l());
    },
    setOpen(open: boolean) {
        settings.store.panelOpen = open;
        panelListeners.forEach(l => l());
    },
    subscribe(listener: Listener) {
        panelListeners.add(listener);
        return () => { panelListeners.delete(listener); };
    },
};

// Stores for folder management
export const ExpandedGuildFolderStore = findStoreLazy("ExpandedGuildFolderStore");
export const SortedGuildStore = findStoreLazy("SortedGuildStore");

// Utility for toggling folders
export const FolderUtils = findByPropsLazy("move", "toggleGuildFolderExpand");

export interface GuildFolder {
    folderId: string | null;
    folderName?: string;
    folderColor?: number;
    guildIds: string[];
}

export interface GuildUnreadInfo {
    unreadCount: number;
    mentionCount: number;
    hasUnread: boolean;
}

/**
 * Get unread/mention counts for a guild by aggregating from all channels
 */
export function getGuildUnreadInfo(guildId: string): GuildUnreadInfo {
    const channels = GuildChannelStore.getChannels(guildId);
    let unreadCount = 0;
    let mentionCount = 0;

    if (channels?.SELECTABLE) {
        for (const { channel } of channels.SELECTABLE) {
            if (ReadStateStore.hasUnread(channel.id)) {
                unreadCount++;
            }
            mentionCount += ReadStateStore.getMentionCount(channel.id);
        }
    }

    return {
        unreadCount,
        mentionCount,
        hasUnread: unreadCount > 0 || mentionCount > 0,
    };
}

/**
 * Get all guild folders from Discord's sorted store
 */
export function getGuildFolders(): GuildFolder[] {
    return SortedGuildStore.getGuildFolders() ?? [];
}

/**
 * Get expanded folder IDs
 */
export function getExpandedFolders(): Set<string> {
    return ExpandedGuildFolderStore.getExpandedFolders() ?? new Set();
}

/**
 * Check if a folder is expanded
 */
export function isFolderExpanded(folderId: string): boolean {
    return ExpandedGuildFolderStore.isFolderExpanded(folderId);
}

/**
 * Toggle folder expansion
 */
export function toggleFolderExpand(folderId: string) {
    FolderUtils.toggleGuildFolderExpand(folderId);
}

/**
 * Get servers filtered by tab and search query
 */
export function getFilteredGuilds(
    activeTab: string,
    searchQuery: string
): { guilds: string[]; folders: GuildFolder[] } {
    const allFolders = getGuildFolders();
    const allGuilds = GuildStore.getGuilds();
    const customTabs = getCustomTabs();

    // Search mode: filter all guilds by name
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchingGuildIds = Object.values(allGuilds)
            .filter(guild => guild.name.toLowerCase().includes(query))
            .map(guild => guild.id);
        return { guilds: matchingGuildIds, folders: [] };
    }

    // "All" tab: return default folder structure
    if (activeTab === "all") {
        return { guilds: [], folders: allFolders };
    }

    // Custom tab: filter by selected servers and folders
    const tab = customTabs.find(t => t.id === activeTab);
    if (!tab) {
        return { guilds: [], folders: allFolders };
    }

    // Get all guilds from selected folders
    const guildIdsFromFolders = new Set<string>();
    const tabFolders: GuildFolder[] = [];

    for (const folder of allFolders) {
        if (folder.folderId && tab.folderIds.includes(folder.folderId)) {
            tabFolders.push(folder);
            folder.guildIds.forEach(id => guildIdsFromFolders.add(id));
        }
    }

    // Add individually selected servers (not in folders)
    const standaloneGuilds = tab.serverIds.filter(id => !guildIdsFromFolders.has(id));

    return { guilds: standaloneGuilds, folders: tabFolders };
}

/**
 * Get the currently selected guild ID
 */
export function getSelectedGuildId(): string | null {
    return SelectedGuildStore.getGuildId();
}
