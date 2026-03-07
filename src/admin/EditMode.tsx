"use client";

import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

import type { EditableSection, EditorState } from "@/lib/types";

type EditModeContextValue = {
  isEditMode: boolean;
  isUnlockOpen: boolean;
  editor: EditorState;
  requestUnlock: () => void;
  closeUnlock: () => void;
  enableEditMode: () => void;
  disableEditMode: () => void;
  openEditor: (section: EditableSection, itemId?: string | null) => void;
  closeEditor: () => void;
};

const EDIT_MODE_SESSION_KEY = "interactive-storytelling-portfolio:edit-mode";

const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({ children }: PropsWithChildren) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsEditMode(window.sessionStorage.getItem(EDIT_MODE_SESSION_KEY) === "enabled");
  }, []);

  const enableEditMode = () => {
    setIsEditMode(true);
    setIsUnlockOpen(false);

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(EDIT_MODE_SESSION_KEY, "enabled");
    }
  };

  const disableEditMode = () => {
    setIsEditMode(false);
    setEditor(null);

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(EDIT_MODE_SESSION_KEY);
    }
  };

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        isUnlockOpen,
        editor,
        requestUnlock: () => setIsUnlockOpen(true),
        closeUnlock: () => setIsUnlockOpen(false),
        enableEditMode,
        disableEditMode,
        openEditor: (section, itemId) => setEditor({ section, itemId }),
        closeEditor: () => setEditor(null),
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);

  if (!context) {
    throw new Error("useEditMode must be used within EditModeProvider");
  }

  return context;
}

type EditButtonProps = {
  section: EditableSection;
  itemId?: string | null;
  label?: string;
  className?: string;
};

export function EditButton({
  section,
  itemId = null,
  label = "Edit",
  className = "",
}: EditButtonProps) {
  const { isEditMode, openEditor } = useEditMode();

  if (!isEditMode) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openEditor(section, itemId)}
      className={`edit-button ${className}`.trim()}
    >
      <span aria-hidden="true">+</span>
      <span>{label}</span>
    </button>
  );
}
