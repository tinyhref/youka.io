import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Song } from "@/types";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  song: Song;
}

export default function TitleComp({ song, ...props }: Props) {
  if (!song) return null;

  if (song.songTitle) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col" {...props}>
            <div className="text-xl font-medium truncate block select-none">
              {song.songTitle}
            </div>
            <div className="text-sm dark:text-gray-400 truncate block select-none">
              {song.artists?.join(" • ")}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-lg truncate block select-none">{song.title}</div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col" {...props}>
          <div className="text-lg truncate block select-none">{song.title}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-lg truncate block select-none">{song.title}</div>
      </TooltipContent>
    </Tooltip>
  );
}
