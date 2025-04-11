import React, { useEffect, useMemo, useRef } from "react";
import { useSyncStore } from "./store";
import { Line } from "./Line";
import {
  SyncAlignment,
  SyncAlignmentLine,
  SyncAlignmentSubword,
} from "./types";
import { DndContext, rectIntersection, DragEndEvent } from "@dnd-kit/core";
import { ProgressLine } from "./ProgressLine";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { getTimeFromClick } from "./utils";
import { ContextMenuSong } from "./ContextMenuSong";
import { useWavesurfer } from "@wavesurfer/react";
import { Theme } from "@/types";
interface SongProps {
  duration: number;
  alignment: SyncAlignment;
  audioUrl?: string;
  peaks?: number[][];
  theme: Theme;
}

export const Song: React.FC<SongProps> = ({
  duration,
  alignment,
  peaks,
  audioUrl,
  theme,
}) => {
  const containerRef = useRef(null);

  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);
  const updateSubwordTimes = useSyncStore((state) => state.updateSubwordTimes);
  const updateLineTimes = useSyncStore((state) => state.updateLineTimes);
  const setCurrentTime = useSyncStore((state) => state.setCurrentTime);
  const clearSelected = useSyncStore((state) => state.clearSelected);
  const pause = useSyncStore((state) => state.pause);

  const widthPx = useMemo(() => {
    return duration * pixelsPerSecond;
  }, [duration, pixelsPerSecond]);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    peaks,
    url: audioUrl,
    height: "auto",
    width: widthPx,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    autoCenter: false,
    waveColor: theme === "dark" ? "#2A163A" : "#ECE3F3",
    progressColor: theme === "dark" ? "#3A234E" : "#D1C1DF",
    cursorColor: theme === "dark" ? "#A188B7" : "#555",
  });

  useEffect(() => {
    return () => {
      wavesurfer?.destroy();
    };
  }, [wavesurfer]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    const subword = active.data.current?.subword as SyncAlignmentSubword;
    let line: SyncAlignmentLine | undefined;
    if (over) {
      line = over.data.current?.line as SyncAlignmentLine;
    } else {
      line = active.data.current?.line as SyncAlignmentLine;
    }

    if (!line && !subword) return;

    // Convert delta.x to seconds
    const shiftSeconds = delta.x / pixelsPerSecond;

    // update line
    if (!subword) {
      updateLineTimes(line.lineId, shiftSeconds);
      return;
    }

    // update subword
    const newStart = subword.start + shiftSeconds;
    const newEnd = subword.end + shiftSeconds;

    updateSubwordTimes(subword.subwordId, newStart, newEnd);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    pause();
    const time = getTimeFromClick(e, pixelsPerSecond);
    setCurrentTime(time);
    clearSelected();
  };

  return (
    <DndContext
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
      collisionDetection={rectIntersection}
    >
      <ContextMenuSong>
        <div
          onClick={handleClick}
          className="relative border-t h-full"
          style={{
            width: `${widthPx}px`,
            zIndex: 2,
          }}
        >
          <div ref={containerRef} className="absolute h-full w-full"></div>
          <ProgressLine />
          {alignment.lines.map((line) => (
            <Line key={line.lineId} line={line} />
          ))}
        </div>
      </ContextMenuSong>
    </DndContext>
  );
};
