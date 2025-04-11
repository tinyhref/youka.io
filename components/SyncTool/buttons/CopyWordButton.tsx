import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "../store";
import { ClipboardCheckIcon, ClipboardCopyIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function CopyWordButton() {
  const { t } = useTranslation();
  const copyWords = useSyncStore((state) => state.copyWords);
  const selectedWords = useSyncStore((state) => state.selectedWords);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  function handleCopy() {
    copyWords(selectedWords);
    setHasCopied(true);
  }

  const disabled = useMemo(() => selectedWords.length === 0, [selectedWords]);

  return (
    <ActionButton
      disabled={disabled}
      onClick={handleCopy}
      tooltip={t("Copy Word")}
      Icon={hasCopied ? ClipboardCheckIcon : ClipboardCopyIcon}
      shortcut="Ctrl+C"
    />
  );
}
