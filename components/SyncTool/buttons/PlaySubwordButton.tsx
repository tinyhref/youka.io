import React from "react";
import { useSyncStore } from "../store";
import { PauseIcon } from "lucide-react";
import { PlayIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { findSubword } from "../utils";
import { useTranslation } from "react-i18next";

export const PlaySubwordButton = () => {
  const { t } = useTranslation();

  const selectedSubwords = useSyncStore((state) => state.selectedSubwords);
  const disabled = selectedSubwords.length !== 1;
  const isPlaying = useSyncStore((state) => state.isPlaying);
  const alignment = useSyncStore((state) => state.alignment);
  const playSubword = useSyncStore((state) => state.playSubword);
  const pause = useSyncStore((state) => state.pause);

  const togglePlay = () => {
    if (isPlaying) {
      pause();
      return;
    }
    if (selectedSubwords.length === 1) {
      const subwordId = selectedSubwords[0];
      if (!subwordId) return;
      const subword = findSubword(alignment, subwordId);
      if (!subword) return;
      playSubword(subword);
    }
  };

  return (
    <ActionButton
      onClick={togglePlay}
      Icon={isPlaying ? PauseIcon : PlayIcon}
      tooltip={t("Play Word")}
      disabled={disabled}
      shortcut="Space"
    />
  );
};
