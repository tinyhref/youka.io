import React, { useMemo } from "react";
import { useSyncStore } from "../store";
import { TextSelectionIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { SyncAlignmentSubword } from "../types";
import { useTranslation } from "react-i18next";
interface SelectLineButtonProps {
  subword: SyncAlignmentSubword;
}

export function SelectLineButton({ subword }: SelectLineButtonProps) {
  const { t } = useTranslation();
  const selectLine = useSyncStore((state) => state.selectLine);
  const selectedSubwords = useSyncStore((state) => state.selectedSubwords);

  const disabled = useMemo(() => selectedSubwords.length !== 1, [
    selectedSubwords,
  ]);

  function handleClick() {
    selectLine(subword.lineId);
  }

  return (
    <ActionButton
      onClick={handleClick}
      Icon={TextSelectionIcon}
      tooltip={t("Select Line")}
      disabled={disabled}
      shortcut="Ctrl+a"
    />
  );
}
