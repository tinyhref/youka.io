import React, { useState } from "react";
import { IPlaylist2 } from "@/types";
import Title from "@/components/Title";
import { cn } from "@/lib/utils";
import { PlaylistImage } from "./PlaylistImage";
import { PlaylistMenu } from "./PlaylistMenu";
import { useTranslation } from "react-i18next";

interface Props {
  playlist: IPlaylist2;
}

export function Playlist2Item({ playlist }: Props) {
  const [isHovering, setIsHovering] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn(
          "flex flex-row items-center group cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-muted w-full"
        )}
      >
        <div className="min-w-[100px] rounded-lg pr-2">
          <PlaylistImage playlist={playlist} />
        </div>
        <div className="truncate w-full">
          <Title
            title={playlist.title}
            artists={[`${playlist.items.length} ${t("songs")}`]}
          />
        </div>

        {isHovering && (
          <div onClick={(e) => e.stopPropagation()}>
            <PlaylistMenu playlist={playlist} />
          </div>
        )}
      </div>
    </>
  );
}
