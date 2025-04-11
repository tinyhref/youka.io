import React, { useMemo } from "react";
import { ActionButton } from "../ActionButton";
import { useSyncStore } from "../store";
import { SyncAlignmentSubword } from "../types";
import { ArrowRightToLineIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrimSubwordEndButtonProps {
  currentTime: number;
  subword: SyncAlignmentSubword;
}
export function TrimSubwordEndButton({
  subword,
  currentTime,
}: TrimSubwordEndButtonProps) {
  const { t } = useTranslation();
  const updateSubwordTimes = useSyncStore((state) => state.updateSubwordTimes);

  function handleClick() {
    if (currentTime < subword.start) return;
    updateSubwordTimes(subword.subwordId, subword.start, currentTime);
  }

  const disabled = useMemo(
    () => currentTime < subword.start || currentTime === subword.end,
    [currentTime, subword]
  );

  return (
    <ActionButton
      onClick={handleClick}
      Icon={ArrowRightToLineIcon}
      tooltip={t("Trim End")}
      disabled={disabled}
    />
  );
}
