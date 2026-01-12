/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export interface CustomTab {
    id: string;
    name: string;
    serverIds: string[];
    folderIds: string[];
}

export const settings = definePluginSettings({
    sidebarAnim: {
        type: OptionType.BOOLEAN,
        description: "Animate opening the tab sidebar",
        default: true,
    },
    activeTab: {
        type: OptionType.STRING,
        description: "Currently active tab",
        default: "all",
        hidden: true,
    },
    customTabs: {
        type: OptionType.STRING,
        description: "Custom tab configuration (JSON)",
        default: "[]",
        hidden: true,
    },
    panelOpen: {
        type: OptionType.BOOLEAN,
        description: "Whether the tab panel is open",
        default: false,
        hidden: true,
    },
});

export function getCustomTabs(): CustomTab[] {
    try {
        return JSON.parse(settings.store.customTabs);
    } catch {
        return [];
    }
}

export function setCustomTabs(tabs: CustomTab[]) {
    settings.store.customTabs = JSON.stringify(tabs);
}
