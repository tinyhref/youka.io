import React from "react";
import { JobStateUnion, Playlist, Song } from "@/types";
import { AspectRatio } from "./ui/aspect-ratio";
import { JobStatus } from "./JobStatus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons";

interface Props {
  song?: Song | Playlist;
  job?: JobStateUnion;
}

export const SongImage = ({ song, job }: Props) => {
  if (!song)
    return (
      <AspectRatio
        className="flex flex-col items-center justify-center border"
        ratio={16 / 9}
      >
        <FontAwesomeIcon icon={faPlayCircle} size="4x" />
      </AspectRatio>
    );

  return (
    <div className="relative w-full">
      <AspectRatio ratio={16 / 9}>
        <img src={song.image} alt="" className="object-cover w-full h-full" />
        {job && (
          <div className="absolute inset-0 flex items-center justify-center">
            <JobStatus job={job} size="4x" />
          </div>
        )}
      </AspectRatio>
    </div>
  );
};
