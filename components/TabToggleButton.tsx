/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Tooltip, useEffect, useState } from "@webpack/common";

import { panelStore } from "../stores";

export function TabToggleButton() {
    const [panelOpen, setPanelOpen] = useState(panelStore.getOpen);

    useEffect(() => {
        return panelStore.subscribe(() => setPanelOpen(panelStore.getOpen()));
    }, []);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        panelStore.toggle();
    };

    return (
        <Tooltip text="Workspaces" position="right">
            {tooltipProps => (
                <button
                    {...tooltipProps}
                    className="vc-st-toggle-btn"
                    onClick={handleClick}
                    data-active={panelOpen}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H4V5h16v14zM6 7h5v5H6V7zm7 0h5v2h-5V7zm0 4h5v2h-5v-2zm0 4h5v2h-5v-2zm-7 0h5v2H6v-2z"/>
                    </svg>
                </button>
            )}
        </Tooltip>
    );
}
