import React, { useMemo } from "react";
import { useSyncStore } from "../store";
import { WrapTextIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";
import { SyncAlignmentSubword } from "../types";

interface SplitLineBySubwordButtonProps {
  subword: SyncAlignmentSubword;
}
export function SplitLineBySubwordButton({
  subword,
}: SplitLineBySubwordButtonProps) {
  const { t } = useTranslation();
  const splitLine = useSyncStore((state) => state.splitLine);
  const selectedWords = useSyncStore((state) => state.selectedWords);

  const disabled = useMemo(() => selectedWords.length !== 1, [selectedWords]);

  function handleClick() {
    splitLine(subword.wordId);
  }

  return (
    <ActionButton
      onClick={handleClick}
      Icon={WrapTextIcon}
      tooltip={t("Split Line")}
      disabled={disabled}
      shortcut="Ctrl+L"
    />
  );
}
