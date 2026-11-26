"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { clearAdminSession, loadAdminSessionStatus } from "@/lib/api";
const EditModeContext = createContext(null);
export function EditModeProvider({ children }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);
    const [editor, setEditor] = useState(null);
    useEffect(() => {
        let isActive = true;
        void loadAdminSessionStatus()
            .then((status) => {
            if (!isActive) {
                return;
            }
            setIsEditMode(status.authenticated);
        })
            .catch(() => {
            if (!isActive) {
                return;
            }
            setIsEditMode(false);
        });
        return () => {
            isActive = false;
        };
    }, []);
    const enableEditMode = () => {
        setIsEditMode(true);
        setIsUnlockOpen(false);
    };
    const disableEditMode = async () => {
        try {
            await clearAdminSession();
        }
        finally {
            setIsEditMode(false);
            setEditor(null);
        }
    };
    return (<EditModeContext.Provider value={{
            isEditMode,
            isUnlockOpen,
            editor,
            requestUnlock: () => setIsUnlockOpen(true),
            closeUnlock: () => setIsUnlockOpen(false),
            enableEditMode,
            disableEditMode,
            openEditor: (section, itemId) => setEditor({ section, itemId }),
            closeEditor: () => setEditor(null),
        }}>
      {children}
    </EditModeContext.Provider>);
}
export function useEditMode() {
    const context = useContext(EditModeContext);
    if (!context) {
        throw new Error("useEditMode must be used within EditModeProvider");
    }
    return context;
}
export function EditButton({ section, itemId = null, label = "Edit", className = "", }) {
    const { isEditMode, openEditor } = useEditMode();
    if (!isEditMode) {
        return null;
    }
    return (<button type="button" onClick={() => openEditor(section, itemId)} className={`edit-button ${className}`.trim()}>
      <span aria-hidden="true">+</span>
      <span>{label}</span>
    </button>);
}
