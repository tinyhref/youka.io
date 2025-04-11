import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Props {
  playing: boolean;
  ready: boolean;
  onClick: () => void;
  className?: string;
}

export function PlayPause({ ready, playing, onClick, className }: Props) {
  if (!ready) {
    return (
      <Loader2 className="animate-spin mr-7 w-[20px] h-[20px]" color="white" />
    );
  }
  return (
    <FontAwesomeIcon
      onClick={onClick}
      icon={playing ? faPause : faPlay}
      className={cn(
        className,
        "cursor-pointer w-[20px] h-[20px] text-white bg-opacity-60"
      )}
    />
  );
}
