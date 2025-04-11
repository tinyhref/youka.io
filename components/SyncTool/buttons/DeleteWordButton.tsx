import React from "react";
import { TrashIcon } from "lucide-react";
import { useSyncStore } from "../store";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function DeleteWordButton() {
  const { t } = useTranslation();
  const selectedWords = useSyncStore((state) => state.selectedWords);
  const deleteWords = useSyncStore((state) => state.deleteWords);
  const disabled = !selectedWords.length;

  return (
    <ActionButton
      onClick={() => deleteWords(selectedWords)}
      tooltip={t("Delete Word")}
      Icon={TrashIcon}
      disabled={disabled}
      shortcut="Del"
    />
  );
}
