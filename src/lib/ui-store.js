"use client";
import { create } from "zustand";
const initialCursorState = {
    clicking: false,
    visible: false,
    x: 72,
    y: 360,
};
export const usePortfolioUiStore = create((set) => ({
    activeProjectId: null,
    cursorState: initialCursorState,
    isGuideActive: false,
    lastExpandedWindowMode: "normal",
    windowMode: "normal",
    closeProjectWindow: () => set({
        activeProjectId: null,
        lastExpandedWindowMode: "normal",
        windowMode: "normal",
    }),
    maximizeProjectWindow: () => set((current) => ({
        lastExpandedWindowMode: current.windowMode === "maximized" ? "normal" : "maximized",
        windowMode: current.windowMode === "maximized" ? "normal" : "maximized",
    })),
    minimizeProjectWindow: () => set((current) => ({
        lastExpandedWindowMode: current.windowMode === "minimized" ? current.lastExpandedWindowMode : current.windowMode,
        windowMode: "minimized",
    })),
    openProjectWindow: (projectId) => set({
        activeProjectId: projectId,
        lastExpandedWindowMode: "maximized",
        windowMode: "maximized",
    }),
    resetPointer: () => set({
        cursorState: initialCursorState,
        isGuideActive: false,
    }),
    restoreProjectWindow: () => set((current) => ({
        lastExpandedWindowMode: current.windowMode === "maximized" ? "normal" : current.lastExpandedWindowMode,
        windowMode: current.windowMode === "minimized" ? current.lastExpandedWindowMode : "normal",
    })),
    setCursorState: (cursorState) => set((current) => ({
        cursorState: typeof cursorState === "function" ? cursorState(current.cursorState) : cursorState,
    })),
    setGuideActive: (isGuideActive) => set({
        isGuideActive,
    }),
}));
