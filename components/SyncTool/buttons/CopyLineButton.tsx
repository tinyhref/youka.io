import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "../store";
import { ClipboardCheckIcon, ClipboardCopyIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function CopyLineButton() {
  const { t } = useTranslation();
  const copyLines = useSyncStore((state) => state.copyLines);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  function handleCopy() {
    copyLines(selectedLines);
    setHasCopied(true);
  }

  const disabled = useMemo(() => selectedLines.length === 0, [selectedLines]);

  if (disabled) return null;

  return (
    <ActionButton
      onClick={handleCopy}
      tooltip={t("Copy Line")}
      Icon={hasCopied ? ClipboardCheckIcon : ClipboardCopyIcon}
      shortcut="Ctrl+C"
    />
  );
}
