import React, { useMemo } from "react";
import { Subword } from "./Subword";
import { SyncAlignmentLine } from "./types";
import { SyncAlignmentWord } from "./types";
import { useSyncStore } from "./store";

interface WordProps {
  line: SyncAlignmentLine;
  word: SyncAlignmentWord;
}

export const Word: React.FC<WordProps> = ({ line, word }) => {
  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);

  const widthPx = useMemo(() => {
    const duration = word.end - word.start;
    return duration * pixelsPerSecond;
  }, [word.end, word.start, pixelsPerSecond]);

  const leftPx = useMemo(() => {
    const leftPx = (word.start - line.start) * pixelsPerSecond;
    return leftPx;
  }, [line.start, word.start, pixelsPerSecond]);

  return (
    <div
      className="absolute h-full"
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
      }}
    >
      {word.subwords.map((subword) => (
        <Subword
          key={subword.subwordId}
          line={line}
          word={word}
          subword={subword}
        />
      ))}
    </div>
  );
};
