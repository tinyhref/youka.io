import React from "react";
import { useSyncStore } from "../store";
import { PauseIcon } from "lucide-react";
import { PlayIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export const PlayLineButton = () => {
  const { t } = useTranslation();
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const isPlaying = useSyncStore((state) => state.isPlaying);
  const playLine = useSyncStore((state) => state.playLine);
  const pause = useSyncStore((state) => state.pause);

  const disabled = selectedLines.length !== 1;

  const togglePlay = () => {
    if (isPlaying) {
      pause();
      return;
    }
    if (selectedLines.length === 1) {
      const lineId = selectedLines[0];
      if (!lineId) return;
      playLine(lineId);
    }
  };

  return (
    <ActionButton
      onClick={togglePlay}
      Icon={isPlaying ? PauseIcon : PlayIcon}
      tooltip={t("Play Line")}
      disabled={disabled}
      shortcut="Space"
    />
  );
};
