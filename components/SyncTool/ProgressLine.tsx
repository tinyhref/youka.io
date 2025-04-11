import React, { useEffect, useRef } from "react";
import { useSyncStore } from "./store";

export function ProgressLine() {
  const {
    videoElement,
    pixelsPerSecond,
    isPlaying,
    currentTime,
  } = useSyncStore((state) => ({
    videoElement: state.videoElement,
    pixelsPerSecond: state.pixelsPerSecond,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
  }));

  const lineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!videoElement || !lineRef.current) return;

    const updatePosition = () => {
      if (!isPlaying) return;

      const currentTime = videoElement.currentTime;
      const leftPx = currentTime * pixelsPerSecond;
      lineRef.current!.style.left = `${leftPx}px`;
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    };

    // Start animation loop only when playing
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    } else if (lineRef.current) {
      // Update position when paused
      lineRef.current.style.left = `${currentTime * pixelsPerSecond}px`;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoElement, pixelsPerSecond, isPlaying, currentTime]);

  return (
    <div
      ref={lineRef}
      id="progress-line"
      className="absolute z-50 h-full bg-red-500"
      style={{ left: `${currentTime * pixelsPerSecond}px`, width: "1px" }}
    ></div>
  );
}
