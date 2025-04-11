import React from "react";
import { useSyncStore } from "../store";
import { RedoIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function RedoButton() {
  const { t } = useTranslation();
  const redo = useSyncStore((state) => state.redo);
  const redoStack = useSyncStore((state) => state.redoStack);

  const disabled = redoStack.length === 0;

  return (
    <ActionButton
      onClick={redo}
      Icon={RedoIcon}
      tooltip={t("Redo")}
      disabled={disabled}
      shortcut="Ctrl+Y"
    />
  );
}
