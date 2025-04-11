import React, { useMemo } from "react";
import { useSyncStore } from "../store";
import { PlusIcon } from "lucide-react";
import { isLineAtTime } from "../utils";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";
export const NewLineButton = () => {
  const { t } = useTranslation();
  const addLine = useSyncStore((state) => state.addLine);
  const currentTime = useSyncStore((state) => state.currentTime);
  const alignment = useSyncStore((state) => state.alignment);

  const disabled = useMemo(() => {
    return isLineAtTime(alignment, currentTime);
  }, [alignment, currentTime]);

  function handleClick() {
    addLine(currentTime, currentTime + 1, "<>");
  }

  return (
    <ActionButton
      onClick={handleClick}
      Icon={PlusIcon}
      tooltip={t("Add Line")}
      disabled={disabled}
      shortcut="Ctrl+N"
    />
  );
};
