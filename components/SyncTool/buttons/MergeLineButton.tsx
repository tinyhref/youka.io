import React from "react";
import { useSyncStore } from "../store";
import { MergeIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

interface MergeLineButtonProps {
  lineId: string;
}
export function MergeLineButton({ lineId }: MergeLineButtonProps) {
  const { t } = useTranslation();
  const mergeLineWithNextLine = useSyncStore(
    (state) => state.mergeLineWithNextLine
  );

  function handleClick() {
    mergeLineWithNextLine(lineId);
  }

  return (
    <ActionButton
      onClick={handleClick}
      Icon={MergeIcon}
      tooltip={t("Merge Line")}
      shortcut="Ctrl+M"
    />
  );
}
