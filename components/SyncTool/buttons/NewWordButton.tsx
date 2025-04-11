import React, { useMemo } from "react";
import { useSyncStore } from "../store";
import { PlusIcon } from "lucide-react";
import { getNewWordTime } from "../utils";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export const NewWordButton = () => {
  const { t } = useTranslation();
  const alignment = useSyncStore((state) => state.alignment);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const currentTime = useSyncStore((state) => state.currentTime);
  const addWord = useSyncStore((state) => state.addWord);

  const disabled = useMemo(() => {
    return selectedLines.length !== 1;
  }, [selectedLines]);

  function handleClick() {
    const lineId = selectedLines[0];
    if (!lineId) return;

    const { start, end } = getNewWordTime(alignment, currentTime);

    addWord(lineId, start, end, "<>");
  }

  if (disabled) return null;

  return (
    <ActionButton
      onClick={handleClick}
      Icon={PlusIcon}
      tooltip={t("Add Word")}
      disabled={disabled}
      shortcut="Ctrl+N"
    />
  );
};
