import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  SyncAlignmentLine,
  SyncAlignmentSubword,
  SyncAlignmentWord,
} from "./types";
import { useSyncStore } from "./store";
import { findLineByTime, formatTime } from "./utils";
import { ContextMenuSong } from "./ContextMenuSong";

export function LinesMenu() {
  const selectLine = useSyncStore((state) => state.selectLine);
  const selectWord = useSyncStore((state) => state.selectWord);
  const selectSubword = useSyncStore((state) => state.selectSubword);
  const isShiftPressed = useSyncStore((state) => state.isShiftPressed);
  const alignment = useSyncStore((state) => state.alignment);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const selectedSubwords = useSyncStore((state) => state.selectedSubwords);
  const currentTime = useSyncStore((state) => state.currentTime);
  const rtl = useSyncStore((state) => state.rtl);
  const [activeLine, setActiveLine] = useState<SyncAlignmentLine | null>(null);

  const handleClickLine = (e: React.MouseEvent, line: SyncAlignmentLine) => {
    e.stopPropagation();
    selectLine(line.lineId, isShiftPressed);
  };

  const handleClickWord = (e: React.MouseEvent, word: SyncAlignmentWord) => {
    e.stopPropagation();
    selectWord(word.wordId, isShiftPressed);
  };

  const handleClickSubword = (
    e: React.MouseEvent,
    subword: SyncAlignmentSubword
  ) => {
    e.stopPropagation();
    selectSubword(subword.subwordId, isShiftPressed);
  };

  useEffect(() => {
    if (selectedSubwords.length > 0) {
      const el = document.getElementById(selectedSubwords[0]);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedSubwords]);

  useEffect(() => {
    const line = findLineByTime(alignment, currentTime);
    if (line) {
      setActiveLine(line);
      const el = document.getElementById(line.lineId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [alignment, currentTime]);

  return (
    <ContextMenuSong>
      <div
        dir={rtl ? "rtl" : "ltr"}
        className="h-full w-full overflow-y-auto border-2 border-muted select-none"
      >
        {alignment.lines.map((line) => (
          <div
            className={cn(
              "flex flex-row items-center border border-transparent rounded"
            )}
            id={line.lineId}
            key={line.lineId}
            onClick={(e) => handleClickLine(e, line)}
          >
            <span className="text-sm text-muted-foreground mr-2">
              {formatTime(line.start)}
            </span>
            <div
              className={cn(
                "flex flex-row gap-1 border-2 border-transparent hover:border-2 hover:border-purple-500 p-1 rounded",
                selectedLines.includes(line.lineId) &&
                  "border-2 border-purple-500",
                !selectedLines.includes(line.lineId) &&
                  activeLine?.lineId === line.lineId &&
                  "border-2 border-primary"
              )}
            >
              {line.words.map((word) => (
                <span
                  onClick={(e) => handleClickWord(e, word)}
                  key={word.wordId}
                >
                  {word.subwords.map((subword) => {
                    const isSubwordSelected = selectedSubwords.includes(
                      subword.subwordId
                    );
                    return (
                      <span
                        id={subword.subwordId}
                        key={subword.subwordId}
                        onClick={(e) => handleClickSubword(e, subword)}
                        className={cn(
                          isSubwordSelected
                            ? "border-2 border-primary border-blue-500"
                            : "border-2 border-transparent",
                          "hover:border-2 hover:border-blue-500 rounded cursor-pointer"
                        )}
                      >
                        {subword.text}
                      </span>
                    );
                  })}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ContextMenuSong>
  );
}
