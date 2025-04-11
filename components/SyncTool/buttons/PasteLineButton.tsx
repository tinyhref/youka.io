import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "../store";
import { ClipboardCheckIcon, ClipboardPaste } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { isLineAtTime } from "../utils";
import { useTranslation } from "react-i18next";
export function PasteLineButton() {
  const { t } = useTranslation();
  const alignment = useSyncStore((state) => state.alignment);
  const currentTime = useSyncStore((state) => state.currentTime);
  const pasteLines = useSyncStore((state) => state.pasteLines);
  const copiedLines = useSyncStore((state) => state.copiedLines);
  const [hasPasted, setHasPasted] = useState(false);

  function handlePaste() {
    pasteLines(currentTime, copiedLines);
    setHasPasted(true);
  }

  useEffect(() => {
    setTimeout(() => {
      setHasPasted(false);
    }, 2000);
  }, [hasPasted]);

  const disabled = useMemo(
    () => copiedLines.length === 0 || isLineAtTime(alignment, currentTime),
    [copiedLines, alignment, currentTime]
  );

  return (
    <ActionButton
      onClick={handlePaste}
      Icon={hasPasted ? ClipboardCheckIcon : ClipboardPaste}
      tooltip={t("Paste Line")}
      disabled={disabled}
      shortcut="Ctrl+V"
    />
  );
}
