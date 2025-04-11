import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "../store";
import { ClipboardPaste } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";
import { SyncAlignmentSubword } from "../types";

interface PasteWordBySubwordButtonProps {
  subword: SyncAlignmentSubword;
}
export function PasteWordBySubwordButton({
  subword,
}: PasteWordBySubwordButtonProps) {
  const pasteWords = useSyncStore((state) => state.pasteWords);
  const copiedWords = useSyncStore((state) => state.copiedWords);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const { t } = useTranslation();
  const [hasPasted, setHasPasted] = useState(false);

  function handlePaste() {
    pasteWords(subword.end + 0.01, copiedWords);
    setHasPasted(true);
  }

  useEffect(() => {
    setTimeout(() => {
      setHasPasted(false);
    }, 2000);
  }, [hasPasted]);

  const disabled = useMemo(
    () => copiedWords.length === 0 || selectedLines.length !== 1,
    [copiedWords, selectedLines]
  );

  return (
    <ActionButton
      onClick={handlePaste}
      Icon={ClipboardPaste}
      tooltip={t("Paste Word")}
      disabled={disabled}
      shortcut="Ctrl+V"
    />
  );
}
