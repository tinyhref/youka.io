import React from "react";
import { useTranslation } from "react-i18next";
import {
  IJobStateChangeBackground,
  IJobStateCreateKaraoke,
  IJobStateSyncLyrics,
  IJobStateTrim,
  IJobStateSplit,
  Song,
  IJobStateImportSubtitles,
  IJobStateImportKaraoke,
  IJobStateResizeVideo,
  IJobStateImportStem,
  IJobStateAddKaraokeIntro,
} from "@/types";
import { SongItem } from "./SongItem";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/stores/player";

interface Props {
  job:
    | IJobStateCreateKaraoke
    | IJobStateSyncLyrics
    | IJobStateChangeBackground
    | IJobStateTrim
    | IJobStateSplit
    | IJobStateImportSubtitles
    | IJobStateImportKaraoke
    | IJobStateResizeVideo
    | IJobStateImportStem
    | IJobStateAddKaraokeIntro;
}

export function ListItemJobGenerate({ job }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedAlignment] = usePlayerStore((state) => [
    state.selectedAlignment,
  ]);

  function handleClickPlay(song: Song) {
    navigate(
      `/player?sid=${song.id}&random=${Date.now()}&aid=${selectedAlignment?.id}`
    );
  }

  function handleClick() {
    if (!job.output) return;
    switch (job.type) {
      case "import-subtitles":
        handleClickPlay(job.input.song);
        break;
      case "sync-lyrics":
      case "change-background":
      case "trim":
      case "split":
      case "import-karaoke":
      case "resize-video":
      case "import-stem":
        handleClickPlay(job.output.song);
        break;
      default:
        handleClickPlay(job.output.song);
    }
  }

  return (
    <SongItem
      song={job.input.song}
      job={job}
      variant="notification"
      // @ts-ignore
      subtitle={t(job.name) || job.name}
    >
      {job.output && (
        <Button variant="outline" onClick={handleClick}>
          {t("Play")}
        </Button>
      )}
    </SongItem>
  );
}
