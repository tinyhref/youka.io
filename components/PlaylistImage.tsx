import React from "react";
import { IPlaylist2 } from "@/types";
import { AspectRatio } from "./ui/aspect-ratio";

interface Props {
  playlist: IPlaylist2;
}

export const PlaylistImage = ({ playlist }: Props) => {
  return (
    <div className="relative w-full">
      <AspectRatio ratio={16 / 9}>
        <img
          src={playlist.image}
          alt=""
          className="object-cover w-full h-full"
        />
      </AspectRatio>
    </div>
  );
};
