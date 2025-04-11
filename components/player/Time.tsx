import { cn } from "@/lib/utils";
import React from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  duration: number;
  time: number;
  className?: string;
}

export function Time({ className, time, duration, ...props }: Props) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return hours > 0
      ? `${hours}:${minutes
          .toString()
          .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${minutes}:${secs.toString().padStart(2, "0")}`;
  };
  return (
    <div
      className={cn("flex flex-row text-white select-none nowrap", className)}
      {...props}
    >
      <span>{formatTime(time)}</span> / <span>{formatTime(duration)}</span>
    </div>
  );
}
