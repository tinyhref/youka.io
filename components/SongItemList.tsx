import React from "react";
import { useTranslation } from "react-i18next";
import { Playlist, Song } from "@/types";
import { Virtuoso } from "react-virtuoso";
import { SongItem } from "@/components/SongItem";
import { usePlayerStore } from "@/stores/player";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { faFolderMusic, faListMusic, faWandMagicSparkles } from "@/icons";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDrop } from "react-dnd";
import { SongItemLibrary } from "./SongItemLibrary";

interface Props {
  songs: Array<Song | Playlist>;
  variant: "search" | "library" | "queue" | "related";
  next?: () => Promise<void>;
}

const Footer = () => {
  return (
    <div
      className={cn(
        "flex flex-row text-center w-full items-center justify-center bg-secondary p-2 cursor-default opacity-50"
      )}
    >
      Loading
      <FontAwesomeIcon icon={faSpinner} spin className="ml-2" />
    </div>
  );
};

export default function SongItemList({ songs, variant, next }: Props) {
  const [, drop] = useDrop(() => ({
    accept: "queue",
  }));
  const { t } = useTranslation();
  const [songId, jobs, song2job, qid, storeSongs] = usePlayerStore((state) => [
    state.songId,
    state.jobs,
    state.song2job,
    state.qid,
    state.songs,
  ]);
  const navigate = useNavigate();

  function handleClickSong(song: Song) {
    let url;

    if (variant === "queue") {
      if (song.status === "processed") {
        url = `/player?sid=${song.id}&qid=${song.qid}&random=${Math.random()}`;
      } else {
        url = `/player?sid=${song.id}&qid=${song.qid}`;
      }
    } else {
      if (song.status === "processed") {
        url = `/player?sid=${song.id}&random=${Math.random()}`;
      } else {
        url = `/player?sid=${song.id}`;
      }
    }
    navigate(url);
  }

  if (!songs.length) {
    let icon: IconDefinition;
    let text: string;

    switch (variant) {
      case "search":
        icon = faSearch;
        text = t("No results");
        break;
      case "library":
        icon = faFolderMusic;
        text = t("No songs in library");
        break;
      case "queue":
        icon = faListMusic;
        text = t("No songs in queue");
        break;
      case "related":
        icon = faWandMagicSparkles;
        text = t("No results");
        break;
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
        <FontAwesomeIcon icon={icon} size="4x" />
        <div className="p-2">{text}</div>
      </div>
    );
  }

  return (
    <div className="h-full" ref={variant === "queue" ? drop : null}>
      <Virtuoso
        className="h-full"
        data={songs}
        endReached={next}
        overscan={200}
        itemContent={(_, song) => {
          if (song.type === "playlist") {
            return null;
          }
          const key = variant === "queue" ? song.qid : song.id;
          const song2 =
            variant === "queue"
              ? { ...storeSongs[song.id], qid: song.qid }
              : song;
          const current =
            variant === "queue" ? song.qid === qid : songId === song.id;
          const variant2 = variant === "queue" ? "queue" : "default";

          if (variant === "library") {
            return <SongItemLibrary key={key} song={song2} current={current} />;
          }
          return (
            <SongItem
              key={key}
              song={song2}
              job={jobs[song2job[song.id]]}
              current={current}
              onClick={() => handleClickSong(song)}
              variant={variant2}
            ></SongItem>
          );
        }}
        components={{ Footer: next ? Footer : undefined }}
      />
    </div>
  );
}
