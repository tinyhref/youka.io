import React, { useMemo } from "react";
import { useSyncStore } from "../store";
import { ArrowRightIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function ShiftLineForwardButton() {
  const { t } = useTranslation();
  const shiftSelectedLines = useSyncStore((state) => state.shiftSelectedLines);
  const shiftStep = useSyncStore((state) => state.shiftStep);
  const selectedLines = useSyncStore((state) => state.selectedLines);

  const disabled = useMemo(() => selectedLines.length === 0, [selectedLines]);

  if (disabled) return null;

  return (
    <ActionButton
      onClick={() => shiftSelectedLines(shiftStep)}
      tooltip={t("Shift Line Forward")}
      Icon={ArrowRightIcon}
      shortcut="Shift+Right"
    />
  );
}
