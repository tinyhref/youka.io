import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "../store";
import { ClipboardCheckIcon, ScissorsIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function CutLinesButton() {
  const { t } = useTranslation();
  const cutLines = useSyncStore((state) => state.cutLines);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const [hasCut, setHasCut] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHasCut(false);
    }, 2000);
  }, [hasCut]);

  function handleCut() {
    cutLines(selectedLines);
    setHasCut(true);
  }

  const isDisabled = useMemo(() => selectedLines.length === 0, [selectedLines]);

  return (
    <ActionButton
      onClick={handleCut}
      Icon={hasCut ? ClipboardCheckIcon : ScissorsIcon}
      tooltip={t("Cut Line")}
      disabled={isDisabled}
      shortcut="Ctrl+X"
    />
  );
}
