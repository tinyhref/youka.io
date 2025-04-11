import React from "react";
import { useSyncStore } from "../store";
import { PauseIcon } from "lucide-react";
import { PlayIcon } from "lucide-react";
import { ActionButton } from "../ActionButton";
import { useTranslation } from "react-i18next";

export const PlayButton = () => {
  const { t } = useTranslation();

  const isPlaying = useSyncStore((state) => state.isPlaying);
  const togglePlay = useSyncStore((state) => state.togglePlay);

  return (
    <ActionButton
      onClick={togglePlay}
      Icon={isPlaying ? PauseIcon : PlayIcon}
      tooltip={t("Play")}
      shortcut="Space"
    />
  );
};
