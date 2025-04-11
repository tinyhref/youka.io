import React from "react";
import { UndoIcon } from "lucide-react";
import { useSyncStore } from "../store";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function UndoButton() {
  const { t } = useTranslation();
  const undo = useSyncStore((state) => state.undo);
  const undoStack = useSyncStore((state) => state.undoStack);

  const disabled = undoStack.length === 0;

  return (
    <ActionButton
      onClick={undo}
      Icon={UndoIcon}
      tooltip={t("Undo")}
      disabled={disabled}
      shortcut="Ctrl+Z"
    />
  );
}
