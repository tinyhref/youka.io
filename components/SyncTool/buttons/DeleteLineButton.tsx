import React from "react";
import { TrashIcon } from "lucide-react";
import { useSyncStore } from "../store";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function DeleteLineButton() {
  const { t } = useTranslation();
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const deleteLines = useSyncStore((state) => state.deleteLines);
  const disabled = !selectedLines.length;
  return (
    <ActionButton
      onClick={() => deleteLines(selectedLines)}
      disabled={disabled}
      tooltip={t("Delete Line")}
      Icon={TrashIcon}
      shortcut="Del"
    />
  );
}
