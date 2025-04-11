import React, { useMemo } from "react";
import { useSyncStore } from "./store";

interface TimelineProps {
  duration: number;
}

export function Timeline({ duration }: TimelineProps) {
  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);
  const widthPx = useMemo(() => duration * pixelsPerSecond, [
    duration,
    pixelsPerSecond,
  ]);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return "0";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes
      .toString()
      .padStart(1, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Generate markers for each 100ms
  const markers = useMemo(() => {
    const totalMarkers = duration * 10; // 10 markers per second (every 100ms)
    return Array.from({ length: totalMarkers }).map((_, index) => {
      const time = index / 10; // Convert to seconds
      const isFull = index % 10 === 0; // Every second (10 * 100ms)
      const isHalf = index % 5 === 0; // Every 500ms

      return (
        <div
          key={index}
          className="absolute text-muted-foreground select-none"
          style={{
            left: `${(index / 10) * pixelsPerSecond}px`,
            height: isFull ? "12px" : isHalf ? "8px" : "4px",
            width: "1px",
            backgroundColor: isFull ? "currentColor" : "currentColor",
            opacity: isFull ? 1 : isHalf ? 0.75 : 0.5,
            top: 0,
          }}
        >
          {isFull && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-xs">
              {formatTime(time)}
            </div>
          )}
        </div>
      );
    });
  }, [duration, pixelsPerSecond]);

  return (
    <div
      className="relative h-8 border-t border-border"
      style={{ width: `${widthPx}px` }}
    >
      {markers}
    </div>
  );
}
