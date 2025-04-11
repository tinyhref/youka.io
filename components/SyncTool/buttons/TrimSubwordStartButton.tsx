import React, { useMemo } from "react";
import { ActionButton } from "../ActionButton";
import { useSyncStore } from "../store";
import { SyncAlignmentSubword } from "../types";
import { ArrowLeftToLineIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrimSubwordStartButtonProps {
  currentTime: number;
  subword: SyncAlignmentSubword;
}
export function TrimSubwordStartButton({
  subword,
  currentTime,
}: TrimSubwordStartButtonProps) {
  const { t } = useTranslation();
  const updateSubwordTimes = useSyncStore((state) => state.updateSubwordTimes);

  function handleClick() {
    if (currentTime > subword.end) return;
    updateSubwordTimes(subword.subwordId, currentTime, subword.end);
  }

  const disabled = useMemo(
    () => currentTime > subword.end || currentTime === subword.start,
    [currentTime, subword]
  );

  return (
    <ActionButton
      onClick={handleClick}
      Icon={ArrowLeftToLineIcon}
      tooltip={t("Trim Start")}
      disabled={disabled}
    />
  );
}
