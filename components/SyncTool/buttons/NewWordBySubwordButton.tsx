import React from "react";
import { useSyncStore } from "../store";
import { PlusIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { SyncAlignmentSubword } from "../types";
import { useTranslation } from "react-i18next";
import { getNewWordTimeBySubword } from "../utils";
interface NewWordBySubwordButtonProps {
  subword: SyncAlignmentSubword;
}

export const NewWordBySubwordButton = ({
  subword,
}: NewWordBySubwordButtonProps) => {
  const { t } = useTranslation();
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const addWord = useSyncStore((state) => state.addWord);

  function handleClick() {
    const lineId = selectedLines[0];
    if (!lineId) return;

    const { start, end } = getNewWordTimeBySubword(subword);

    addWord(lineId, start, end, "<>");
  }

  return (
    <ActionButton
      onClick={handleClick}
      Icon={PlusIcon}
      tooltip={t("Add Word")}
      shortcut="Ctrl+N"
    />
  );
};
