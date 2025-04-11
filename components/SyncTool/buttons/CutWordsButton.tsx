import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "../store";
import { ClipboardCheckIcon, ScissorsIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export function CutWordsButton() {
  const { t } = useTranslation();
  const cutWords = useSyncStore((state) => state.cutWords);
  const selectedWords = useSyncStore((state) => state.selectedWords);
  const [hasCut, setHasCut] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHasCut(false);
    }, 2000);
  }, [hasCut]);

  function handleCut() {
    cutWords(selectedWords);
    setHasCut(true);
  }

  const isDisabled = useMemo(() => selectedWords.length === 0, [selectedWords]);

  return (
    <ActionButton
      onClick={handleCut}
      Icon={hasCut ? ClipboardCheckIcon : ScissorsIcon}
      tooltip={t("Cut Word")}
      disabled={isDisabled}
      shortcut="Ctrl+X"
    />
  );
}
