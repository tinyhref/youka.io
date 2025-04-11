import React, { useState } from "react";
import { Song } from "@/types";
import Title from "@/components/Title";
import { cn } from "@/lib/utils";
import { SongImage } from "./SongImage";
import { useNavigate } from "react-router-dom";
import { SongItemLibraryMenu } from "./SongItemLibraryMenu";

interface Props {
  song: Song;
  current?: boolean;
}

export function SongItemLibrary({ song, current }: Props) {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  function handleClickSong() {
    navigate(`/player?sid=${song.id}`);
  }

  return (
    <div
      className={cn(
        "flex flex-row items-center group cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-muted w-full",
        current ? "bg-slate-100 dark:bg-muted" : ""
      )}
      onClick={handleClickSong}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
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
        <div onClick={(e) => e.stopPropagation()}>
          <SongItemLibraryMenu song={song} />
        </div>
      )}
    </div>
  );
}
