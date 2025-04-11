import React, { useState } from "react";
import { IPlaylist2, ISongProcessed, IPlaylist2Item } from "@/types";
import Title from "@/components/Title";
import { cn } from "@/lib/utils";
import { SongImage } from "./SongImage";
import { usePlayerStore } from "@/stores/player";
import { PlaylistSongItemMenu } from "./PlaylistSongItemMenu";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripLines } from "@fortawesome/free-solid-svg-icons";

interface Props {
  song: ISongProcessed;
  playlist: IPlaylist2;
  playlistItem: IPlaylist2Item;
  current?: boolean;
}

export function Playlist2SongItem({
  song,
  playlist,
  playlistItem,
  current,
}: Props) {
  const [playPlaylistItem] = usePlayerStore((state) => [
    state.playPlaylistItem,
  ]);
  const [isHovering, setIsHovering] = useState(false);

  function handleClick() {
    playPlaylistItem(playlist.id, playlistItem.id);
  }
  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex flex-row items-center group cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-muted w-full",
        current ? "bg-slate-100 dark:bg-muted" : ""
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <FontAwesomeIcon icon={faGripLines} size="sm" className="mr-2" />
      <div className="min-w-[100px] rounded-lg pr-2">
        <SongImage song={song} />
      </div>
      <div className="truncate w-full">
        <Title
          title={song.songTitle || song.title}
          artists={song.artists || []}
        />
      </div>
      {isHovering && (
        <div className="z-10">
          <PlaylistSongItemMenu
            song={song}
            playlist={playlist}
            playlistItem={playlistItem}
          />
        </div>
      )}
    </div>
  );
}
