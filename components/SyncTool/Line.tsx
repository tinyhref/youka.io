import React, { useMemo } from "react";
import { Word } from "./Word";
import { useSyncStore } from "./store";
import { SyncAlignmentLine } from "./types";
import { cn } from "@/lib/utils";
import { getTimeFromClick } from "./utils";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVerticalIcon } from "lucide-react";

interface LineProps {
  line: SyncAlignmentLine;
}

export const Line: React.FC<LineProps> = ({ line }) => {
  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const selectLine = useSyncStore((state) => state.selectLine);
  const setCurrentTime = useSyncStore((state) => state.setCurrentTime);
  const isShiftPressed = useSyncStore((state) => state.isShiftPressed);
  const currentTime = useSyncStore((state) => state.currentTime);
  const pause = useSyncStore((state) => state.pause);
  const isDraggable = useSyncStore(
    (state) =>
      state.selectedLines.length === 1 &&
      state.selectedLines.includes(line.lineId) &&
      !state.selectedSubwords.length
  );
  const { setNodeRef } = useDroppable({
    id: line.lineId,
    data: {
      line,
    },
  });

  const isSelected = useMemo(() => selectedLines.includes(line.lineId), [
    selectedLines,
    line.lineId,
  ]);

  const isActive = useMemo(() => {
    return currentTime >= line.start && currentTime <= line.end;
  }, [currentTime, line.start, line.end]);

  const widthPx = useMemo(() => {
    const duration = line.end - line.start;
    return duration * pixelsPerSecond;
  }, [line, pixelsPerSecond]);

  const leftPx = useMemo(() => {
    return line.start * pixelsPerSecond;
  }, [line, pixelsPerSecond]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    pause();
    const localTime = getTimeFromClick(e, pixelsPerSecond);
    const time = localTime + line.start;
    selectLine(line.lineId, isShiftPressed);
    setCurrentTime(time);
  };

  const {
    attributes,
    listeners,
    setNodeRef: setLineRef,
    transform,
  } = useDraggable({
    id: line.lineId,
    disabled: !isDraggable,
    data: {
      line,
    },
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={cn(
        "absolute h-full rounded group",
        isSelected && "border-2 border-purple-500",
        !isSelected && isActive && "border-2 border-primary"
      )}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx + 4}px`,
        zIndex: 3,
        ...style,
      }}
    >
      {isDraggable && (
        <div
          className="absolute top-2 left-2 z-20"
          {...attributes}
          {...listeners}
          ref={setLineRef}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </div>
      )}

      {line.words.map((word) => (
        <Word key={word.wordId} line={line} word={word} />
      ))}

      {isDraggable && (
        <div
          className="absolute top-2 right-2 z-20"
          {...attributes}
          {...listeners}
          ref={setLineRef}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
