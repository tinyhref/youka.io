import React, { useEffect, useMemo, useState } from "react";
import { useSyncStore } from "./store";
import { SyncAlignmentLine, SyncAlignmentSubword } from "./types";
import { SyncAlignmentWord } from "./types";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ResizableTime } from "./ResizableTime";
import { GripVerticalIcon } from "lucide-react";
import { getTimeFromClick } from "./utils";

interface SubwordProps {
  line: SyncAlignmentLine;
  word: SyncAlignmentWord;
  subword: SyncAlignmentSubword;
}

export const Subword: React.FC<SubwordProps> = ({ line, word, subword }) => {
  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);
  const selectSubword = useSyncStore((state) => state.selectSubword);
  const updateSubwordTimes = useSyncStore((state) => state.updateSubwordTimes);
  const setCurrentTime = useSyncStore((state) => state.setCurrentTime);
  const pause = useSyncStore((state) => state.pause);

  const [start, setStart] = useState(subword.start);
  const [end, setEnd] = useState(subword.end);

  useEffect(() => {
    setStart(subword.start);
    setEnd(subword.end);
  }, [subword.start, subword.end]);

  const isSelected = useSyncStore((state) =>
    state.selectedSubwords.includes(subword.subwordId)
  );

  const isResizable = useSyncStore(
    (state) =>
      !state.isShiftPressed &&
      state.selectedSubwords.length === 1 &&
      state.selectedSubwords.includes(subword.subwordId)
  );
  const isDraggable = useSyncStore(
    (state) =>
      state.selectedSubwords.length === 1 &&
      state.selectedSubwords.includes(subword.subwordId)
  );
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: subword.subwordId,
    disabled: !isDraggable,
    data: {
      line,
      subword,
    },
  });

  const widthPx = useMemo(() => {
    const duration = end - start;
    return duration * pixelsPerSecond;
  }, [end, start, pixelsPerSecond]);

  const leftPx = useMemo(() => {
    const leftPx = (start - word.start) * pixelsPerSecond;
    return leftPx;
  }, [word.start, start, pixelsPerSecond]);

  function handleSubwordClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    pause();
    const localTime = getTimeFromClick(e, pixelsPerSecond);
    const time = localTime + subword.start;
    const multi = e.shiftKey;
    selectSubword(subword.subwordId, multi);
    setCurrentTime(time);
  }

  function handleResize(newStart: number, newEnd: number) {
    setStart(newStart);
    setEnd(newEnd);
  }

  function handleResizeEnd(newStart: number, newEnd: number) {
    updateSubwordTimes(subword.subwordId, newStart, newEnd);
  }

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  };

  return (
    <div
      className={cn(
        "absolute h-full hover:border-2 hover:border-blue-500 hover:rounded",
        isSelected && "border-2 border-blue-500 rounded",
        !isSelected && "border-x border-gray-200"
      )}
      style={{
        width: `${widthPx}px`,
        left: `${leftPx}px`,
        zIndex: isSelected ? 5 : 4,
        fontSize: `${pixelsPerSecond / 10}px`,
        ...style,
      }}
      onClick={handleSubwordClick}
    >
      <ResizableTime
        start={start}
        end={end}
        pixelsPerSecond={pixelsPerSecond}
        onChange={handleResize}
        disabled={!isResizable}
        onResizeEnd={handleResizeEnd}
      >
        <div className="h-full w-full flex flex-col items-center justify-center">
          <div className="absolute top-2 left-2">
            {isDraggable && (
              <div {...attributes} {...listeners} ref={setNodeRef}>
                <GripVerticalIcon className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="text-center select-none">{subword.text}</div>
        </div>
      </ResizableTime>
    </div>
  );
};
