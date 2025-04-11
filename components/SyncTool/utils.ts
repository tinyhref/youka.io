import { randomUUID } from "crypto";
import {
  SyncAlignment,
  SyncAlignmentLine,
  SyncAlignmentSubword,
  SyncAlignmentWord,
} from "./types";
import { Alignment2, Alignment3, IAlignmentItemSubword } from "@/types";

export function updateSubwordTimes(
  alignment: SyncAlignment,
  subwordId: string,
  newStart: number,
  newEnd: number
) {
  const newAlignment = structuredClone(alignment);
  for (const line of newAlignment.lines) {
    for (const word of line.words) {
      for (const subword of word.subwords) {
        if (subword.subwordId === subwordId) {
          subword.start = newStart;
          subword.end = newEnd;
          return fixAlignment(newAlignment);
        }
      }
    }
  }
}

export function findWord(
  alignment: SyncAlignment,
  wordId: string
): { lineIndex: number; word: SyncAlignmentWord } | undefined {
  for (let lineIndex = 0; lineIndex < alignment.lines.length; lineIndex++) {
    const line = alignment.lines[lineIndex];
    const word = line.words.find((word) => word.wordId === wordId);
    if (word) {
      return { lineIndex, word };
    }
  }
}

export function findSubword(
  alignment: SyncAlignment,
  subwordId: string
): SyncAlignmentSubword | undefined {
  return alignment.lines
    .flatMap((line) => line.words)
    .flatMap((word) => word.subwords)
    .find((subword) => subword.subwordId === subwordId);
}

export function findLine(alignment: SyncAlignment, lineId: string) {
  return alignment.lines.find((line) => line.lineId === lineId);
}

export function findLineIndex(alignment: SyncAlignment, lineId: string) {
  return alignment.lines.findIndex((line) => line.lineId === lineId);
}

export function deleteByIds(
  alignment: SyncAlignment,
  ids: string[]
): SyncAlignment {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines = newAlignment.lines.filter(
    (line: SyncAlignmentLine) => !ids.includes(line.lineId)
  );
  newAlignment.lines.forEach((line: SyncAlignmentLine) => {
    line.words = line.words.filter(
      (word: SyncAlignmentWord) => !ids.includes(word.wordId)
    );
    line.words.forEach((word: SyncAlignmentWord) => {
      word.subwords = word.subwords.filter(
        (subword: SyncAlignmentSubword) => !ids.includes(subword.subwordId)
      );
    });
  });
  return fixAlignment(newAlignment);
}

export function lineText(line: SyncAlignmentLine) {
  return line.words
    .map((word) => word.subwords.map((subword) => subword.text).join(""))
    .join(" ");
}

export function updateSubwordText(
  alignment: SyncAlignment,
  subwordId: string,
  text: string
) {
  const newAlignment = structuredClone(alignment);
  const subword = findSubword(newAlignment, subwordId);
  if (subword) {
    subword.text = text;
  }
  return newAlignment;
}

export function findLineIndexByTime(alignment: SyncAlignment, time: number) {
  return alignment.lines.findIndex(
    (line) => line.start <= time && line.end >= time
  );
}

export function pasteWords(
  alignment: SyncAlignment,
  time: number,
  wordIds: string[],
  isCut?: boolean
) {
  const newAlignment = structuredClone(alignment);
  let words = findWordsById(alignment, wordIds);

  if (words.length === 0) return newAlignment;

  const lineIndex = findLineIndexByTime(newAlignment, time);
  if (lineIndex !== -1) {
    const indent = time - words[0].start;
    words = resetWordsIds(words);
    words = indentWords(words, indent);
    newAlignment.lines[lineIndex].words.push(...words);
    newAlignment.lines[lineIndex].words = sortWords(
      newAlignment.lines[lineIndex].words
    );

    if (isCut) {
      newAlignment.lines[lineIndex].words = newAlignment.lines[
        lineIndex
      ].words.filter(
        (word: SyncAlignmentWord) => !wordIds.includes(word.wordId)
      );
    }
  }

  return fixAlignment(newAlignment);
}

export function deleteSubwords(alignment: SyncAlignment, subwordIds: string[]) {
  const newAlignment = structuredClone(alignment);
  for (const line of newAlignment.lines) {
    for (const word of line.words) {
      word.subwords = word.subwords.filter(
        (subword: SyncAlignmentSubword) =>
          !subwordIds.includes(subword.subwordId)
      );
    }
  }
  return fixAlignment(newAlignment);
}

export function fixAlignment(alignment: SyncAlignment) {
  const newAlignment = structuredClone(alignment);
  return cleanEmptyArrays(
    sortAlignment(recalculateAlignmentTimes(newAlignment))
  );
}

export function deleteLines(alignment: SyncAlignment, lineIds: string[]) {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines = newAlignment.lines.filter(
    (line: SyncAlignmentLine) => !lineIds.includes(line.lineId)
  );
  return fixAlignment(newAlignment);
}

export function deleteWords(alignment: SyncAlignment, wordIds: string[]) {
  const newAlignment = structuredClone(alignment);
  for (const line of newAlignment.lines) {
    line.words = line.words.filter(
      (word: SyncAlignmentWord) => !wordIds.includes(word.wordId)
    );
  }
  return fixAlignment(newAlignment);
}

export function pasteLines(
  alignment: SyncAlignment,
  time: number,
  lineIds: string[],
  isCut?: boolean
) {
  let newAlignment = structuredClone(alignment);

  let newLines: SyncAlignmentLine[] = [];
  alignment.lines.forEach((line) => {
    if (lineIds.includes(line.lineId)) {
      newLines.push(structuredClone(line));
    }
  });

  if (newLines.length === 0) return;

  if (isCut) {
    newAlignment.lines = newAlignment.lines.filter(
      (line: SyncAlignmentLine) => !lineIds.includes(line.lineId)
    );
  }

  const indent = time - newLines[0].start;
  newLines = indentLines(newLines, indent);
  newLines = resetLinesIds(newLines);
  newAlignment.lines.push(...newLines);

  newAlignment = fixAlignment(newAlignment);

  return { newAlignment, newLines };
}

export function indentAlignment(alignment: SyncAlignment, indent: number) {
  const newAlignment = structuredClone(alignment);
  for (const line of newAlignment.lines) {
    line.start += indent;
    line.end += indent;
    line.words.forEach((word: SyncAlignmentWord) => {
      word.start += indent;
      word.end += indent;
      word.subwords.forEach((subword: SyncAlignmentSubword) => {
        subword.start += indent;
        subword.end += indent;
      });
    });
  }
  return newAlignment;
}

export function indentLines(lines: SyncAlignmentLine[], indent: number) {
  const newLines = structuredClone(lines);
  for (const line of newLines) {
    line.start += indent;
    line.end += indent;
    line.words.forEach((word: SyncAlignmentWord) => {
      word.start += indent;
      word.end += indent;
      word.subwords.forEach((subword: SyncAlignmentSubword) => {
        subword.start += indent;
        subword.end += indent;
      });
    });
  }
  return newLines;
}

export function indentWords(words: SyncAlignmentWord[], indent: number) {
  const newWords = structuredClone(words);
  for (const word of newWords) {
    word.start += indent;
    word.end += indent;
    word.subwords.forEach((subword: SyncAlignmentSubword) => {
      subword.start += indent;
      subword.end += indent;
    });
  }
  return newWords;
}

export function resetAlignmentIds(alignment: SyncAlignment) {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines.forEach((line: SyncAlignmentLine) => {
    line.lineId = randomUUID();
    line.words.forEach((word: SyncAlignmentWord) => {
      word.wordId = randomUUID();
      word.subwords.forEach((subword: SyncAlignmentSubword) => {
        subword.subwordId = randomUUID();
      });
    });
  });
  return newAlignment;
}

export function resetLinesIds(lines: SyncAlignmentLine[]) {
  const newLines = structuredClone(lines);
  newLines.forEach((line: SyncAlignmentLine) => {
    line.lineId = randomUUID();
    line.words.forEach((word: SyncAlignmentWord) => {
      word.wordId = randomUUID();
      word.subwords.forEach((subword: SyncAlignmentSubword) => {
        subword.subwordId = randomUUID();
      });
    });
  });
  return newLines;
}

export function resetWordsIds(words: SyncAlignmentWord[]) {
  const newWords = structuredClone(words);
  newWords.forEach((word: SyncAlignmentWord) => {
    word.wordId = randomUUID();
    word.subwords.forEach((subword: SyncAlignmentSubword) => {
      subword.subwordId = randomUUID();
    });
  });
  return newWords;
}

export function sortLines(lines: SyncAlignmentLine[]) {
  return lines.sort((a, b) => a.start - b.start);
}

export function sortWords(words: SyncAlignmentWord[]) {
  return words.sort((a, b) => a.start - b.start);
}

export function sortSubwords(subwords: SyncAlignmentSubword[]) {
  return subwords.sort((a, b) => a.start - b.start);
}

export function sortAlignment(alignment: SyncAlignment) {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines = sortLines(newAlignment.lines);
  newAlignment.lines.forEach((line: SyncAlignmentLine) => {
    line.words = sortWords(line.words);
    line.words.forEach((word: SyncAlignmentWord) => {
      word.subwords = sortSubwords(word.subwords);
    });
  });
  return newAlignment;
}

export function findLinesById(
  alignment: SyncAlignment,
  lineIds: string[]
): SyncAlignmentLine[] {
  return alignment.lines.filter((line) => lineIds.includes(line.lineId));
}

export function findWordsById(
  alignment: SyncAlignment,
  wordIds: string[]
): SyncAlignmentWord[] {
  return alignment.lines
    .flatMap((line) => line.words)
    .filter((word) => wordIds.includes(word.wordId));
}

export function findSubwordsById(
  alignment: SyncAlignment,
  subwordIds: string[]
): SyncAlignmentSubword[] {
  return alignment.lines
    .flatMap((line) => line.words)
    .flatMap((word) => word.subwords)
    .filter((subword) => subwordIds.includes(subword.subwordId));
}

export function recalculateAlignmentTimes(alignment: SyncAlignment) {
  const newAlignment = structuredClone(alignment);
  for (const line of newAlignment.lines) {
    if (line.words.length === 0) continue;

    for (const word of line.words) {
      if (word.subwords.length === 0) continue;
      word.start = word.subwords[0].start;
      word.end = word.subwords[word.subwords.length - 1].end;
    }

    line.start = line.words[0].start;
    line.end = line.words[line.words.length - 1].end;
  }
  return newAlignment;
}

export function getTimeFromClick(
  e: React.MouseEvent<HTMLDivElement>,
  pixelsPerSecond: number,
  offset: number = 0
) {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const time = (x + offset) / pixelsPerSecond;
  return time;
}

export function cleanEmptyArrays(alignment: SyncAlignment) {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines = newAlignment.lines.filter(
    (line: SyncAlignmentLine) => line.words.length > 0
  );
  newAlignment.lines.forEach((line: SyncAlignmentLine) => {
    line.words = line.words.filter(
      (word: SyncAlignmentWord) => word.subwords.length > 0
    );
    line.words.forEach((word: SyncAlignmentWord) => {
      word.subwords = word.subwords.filter(
        (subword: SyncAlignmentSubword) => subword.text.length > 0
      );
    });
  });
  return newAlignment;
}

export function splitLine(alignment: SyncAlignment, wordId: string) {
  const wordResult = findWord(alignment, wordId);
  if (!wordResult) throw new Error("Word not found");

  const { lineIndex } = wordResult;

  const line = alignment.lines[lineIndex];
  if (line.words.length < 2) return;
  let newAlignment = structuredClone(alignment);
  const newLine = structuredClone(line);

  const splitIndex = line.words.findIndex(
    (word: SyncAlignmentWord) => word.wordId === wordId
  );
  const linePart1 = {
    ...newLine,
    lineId: randomUUID(),
    words: newLine.words.slice(0, splitIndex),
  };
  const linePart2 = {
    ...newLine,
    lineId: randomUUID(),
    words: newLine.words.slice(splitIndex),
  };
  newAlignment.lines.splice(lineIndex, 1);
  newAlignment.lines.splice(lineIndex, 0, linePart1);
  newAlignment.lines.splice(lineIndex + 1, 0, linePart2);
  newAlignment = fixAlignment(newAlignment);

  return { newAlignment, linePart1, linePart2 };
}

export function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function addLine(
  alignment: SyncAlignment,
  start: number,
  end: number,
  text: string
) {
  let newAlignment = structuredClone(alignment);
  const lineId = randomUUID();
  const wordId = randomUUID();
  const subwordId = randomUUID();

  const newLine = {
    lineId,
    start,
    end,
    words: [
      {
        wordId,
        lineId,
        start,
        end,
        subwords: [
          {
            lineId,
            wordId,
            subwordId,
            start,
            end,
            text,
          },
        ],
      },
    ],
  };

  newAlignment.lines.push(newLine);
  newAlignment = sortAlignment(newAlignment);

  return { newAlignment, newLine };
}

export function isLineAtTime(alignment: SyncAlignment, time: number) {
  return alignment.lines.some((line) => line.start <= time && line.end >= time);
}

export function addWord(
  alignment: SyncAlignment,
  lineId: string,
  start: number,
  end: number,
  text: string
) {
  let newAlignment = structuredClone(alignment);
  const wordId = randomUUID();
  const subwordId = randomUUID();

  const newWord = {
    lineId,
    wordId,
    start,
    end,
    subwords: [
      {
        lineId,
        wordId,
        subwordId,
        start,
        end,
        text,
      },
    ],
  };

  const lineIndex = findLineIndex(newAlignment, lineId);
  if (lineIndex === -1) return;

  newAlignment.lines[lineIndex].words.push(newWord);

  newAlignment = fixAlignment(newAlignment);

  return { newAlignment, newWord };
}

export function addSubword(
  alignment: SyncAlignment,
  lineId: string,
  wordId: string,
  start: number,
  end: number,
  text: string
) {
  let newAlignment = structuredClone(alignment);
  const subwordId = randomUUID();

  const newSubword = {
    lineId,
    wordId,
    subwordId,
    start,
    end,
    text,
  };

  const lineIndex = findLineIndex(newAlignment, lineId);
  if (lineIndex === -1) return;

  const wordIndex = findWordIndex(newAlignment.lines[lineIndex].words, wordId);
  if (wordIndex === -1) return;

  newAlignment.lines[lineIndex].words[wordIndex].subwords.push(newSubword);

  newAlignment = fixAlignment(newAlignment);

  return { newAlignment, newSubword };
}

export function findWordIndex(words: SyncAlignmentWord[], wordId: string) {
  return words.findIndex((word) => word.wordId === wordId);
}

export function findNextSubword(alignment: SyncAlignment, subwordId: string) {
  let found = false;
  for (const line of alignment.lines) {
    for (const word of line.words) {
      for (const subword of word.subwords) {
        if (found) {
          return subword;
        }
        if (subword.subwordId === subwordId) {
          found = true;
        }
      }
    }
  }
}

export function findNextSubwordByTime(alignment: SyncAlignment, time: number) {
  return alignment.lines
    .flatMap((line) => line.words)
    .flatMap((word) => word.subwords)
    .find((subword) => subword.start > time);
}

export function findLineByTime(alignment: SyncAlignment, time: number) {
  return alignment.lines.find((line) => line.start <= time && line.end >= time);
}

export function convertAlignmentToAlignment3(
  alignment: SyncAlignment
): Alignment3 {
  return {
    id: randomUUID(),
    modelId: "default",
    createdAt: new Date().toISOString(),
    text: alignment.lines
      .map((line) =>
        line.words
          .map((word) => word.subwords.map((subword) => subword.text).join(""))
          .join(" ")
      )
      .join(" "),
    lines: alignment.lines.map((line) => ({
      // id: line.lineId,
      text: line.words
        .map((word) => word.subwords.map((subword) => subword.text).join(""))
        .join(" "),
      start: line.start,
      end: line.end,
      singer: line.singer,
      words: line.words.map((word) => ({
        start: word.start,
        end: word.end,
        vocals: word.vocals,
        text: word.subwords.map((subword) => subword.text).join(" "),
        subwords: word.subwords.map((subword) => ({
          start: subword.start,
          end: subword.end,
          text: subword.text,
          vocals: subword.vocals,
        })),
      })),
    })),
  };
}

export function convertAlignmentToAlignment2(
  alignment: SyncAlignment
): Alignment2 {
  const subwords: IAlignmentItemSubword[] = [];
  alignment.lines.forEach((line, lineIndex) => {
    line.words.forEach((word, wordIndex) => {
      word.subwords.forEach((subword, subwordIndex) => {
        subwords.push({
          line: lineIndex + 1,
          word: wordIndex + 1,
          subword: subwordIndex + 1,
          text: subword.text,
          start: subword.start,
          end: subword.end,
          vocals: subword.vocals,
          singer: line.singer,
        });
      });
    });
  });

  return {
    id: randomUUID(),
    modelId: "default",
    createdAt: new Date().toISOString(),
    mode: "subword",
    alignment: subwords,
  };
}

export function getNewWordTime(alignment: SyncAlignment, currentTime: number) {
  const MAX_WORD_DURATION = 0.2;
  let start, end;

  const nextSubword = findNextSubwordByTime(alignment, currentTime);
  if (nextSubword) {
    start = currentTime;
    end = nextSubword.start - 0.01;
  } else {
    start = currentTime;
    end = currentTime + MAX_WORD_DURATION;
  }

  const duration = end - start;
  if (duration > MAX_WORD_DURATION) {
    end = start + MAX_WORD_DURATION;
  }

  return { start, end };
}

export function getNewWordTimeBySubword(subword: SyncAlignmentSubword) {
  const duration = subword.end - subword.start;
  const start = subword.end + 0.01;
  const end = start + duration;

  return { start, end };
}

export function mergeLineWithNextLine(
  alignment: SyncAlignment,
  lineId: string
) {
  const lineIndex = findLineIndex(alignment, lineId);
  if (lineIndex === -1) return;

  const nextLineIndex = lineIndex + 1;
  if (nextLineIndex >= alignment.lines.length) return;

  const line = alignment.lines[lineIndex];
  const nextLine = alignment.lines[nextLineIndex];
  if (!line || !nextLine) return;

  let newAlignment = structuredClone(alignment);
  newAlignment.lines[nextLineIndex].words.push(...line.words);
  newAlignment.lines.splice(lineIndex, 1);
  newAlignment = fixAlignment(newAlignment);

  return { newAlignment, line, nextLine };
}

export function shiftAlignment(alignment: SyncAlignment, time: number) {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines.forEach((line: SyncAlignmentLine) => {
    line.start += time;
    line.end += time;
    line.words.forEach((word: SyncAlignmentWord) => {
      word.start += time;
      word.end += time;
      word.subwords.forEach((subword: SyncAlignmentSubword) => {
        subword.start += time;
        subword.end += time;
      });
    });
  });
  return fixAlignment(newAlignment);
}

export function shiftLines(
  alignment: SyncAlignment,
  lineIds: string[],
  time: number
) {
  const newAlignment = structuredClone(alignment);
  newAlignment.lines.forEach((line: SyncAlignmentLine) => {
    if (lineIds.includes(line.lineId)) {
      line.start += time;
      line.end += time;
      line.words.forEach((word: SyncAlignmentWord) => {
        word.start += time;
        word.end += time;
        word.subwords.forEach((subword: SyncAlignmentSubword) => {
          subword.start += time;
          subword.end += time;
        });
      });
    }
  });
  return fixAlignment(newAlignment);
}
