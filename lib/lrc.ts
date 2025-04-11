import {
  Alignment2,
  Alignment2Line,
  Alignment2Subword,
  Alignment2Word,
  IAlignmentItemLine,
  IAlignmentItemSubword,
} from "@/types";
import rollbar from "./rollbar";
import { randomUUID } from "node:crypto";
import { alignment2ToAlignment3 } from "./alignment";
import { splitStringToChunks } from "./utils";

interface SimpleLine {
  start: number;
  text: string;
}

interface TimeMatch {
  time: number;
  start: number;
  end: number;
}

interface TextMatch {
  start: number;
  end: number;
  text: string;
  eow: boolean;
}

export function parseText(s: string): TextMatch | undefined {
  const textRegex = /(.*?)<\d+:\d+\.\d+>(.*)/;
  const textMatch = textRegex.exec(s);
  if (!textMatch) return;

  const eow = textMatch[1].endsWith(" ") || textMatch[2].startsWith(" ");
  const text = textMatch[1].trim();

  const obj = {
    eow,
    text,
    start: 0,
    end: textMatch[1].length,
  };

  return obj;
}

export function parseLineTime(s: string): TimeMatch | undefined {
  const timeRegex = /^\[(\d+):(\d+\.\d+)\]/;
  const timeMatch = timeRegex.exec(s);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10);
    const seconds = parseFloat(timeMatch[2]);
    const time = minutes * 60 + seconds;

    return {
      time,
      start: timeMatch.index,
      end: timeMatch.index + timeMatch[0].length,
    };
  }
}

export function parseWordTime(s: string): TimeMatch | undefined {
  const wordRegex = /^<(\d+):(\d+\.\d+)>/;
  const timeMatch = wordRegex.exec(s);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10);
    const seconds = parseFloat(timeMatch[2]);
    const time = minutes * 60 + seconds;
    return {
      time,
      start: timeMatch.index,
      end: timeMatch.index + timeMatch[0].length,
    };
  }
}

function removeMatch(s: string, match: TimeMatch | TextMatch): string {
  return s.substring(match.end || 0); // .trim();
}
export function parseLrcToAlignments(lyric: string): Alignment2 | undefined {
  const extendedRegex = /<(\d+):(\d+\.\d+)>/;
  const isExtended = extendedRegex.test(lyric);

  if (isExtended) {
    return parseExtendedLrcToAlignments(lyric);
  } else {
    return parseSimpleLrcToAlignments(lyric);
  }
}

export function parseExtendedLrcToAlignments(
  lyric: string
): Alignment2Subword | undefined {
  const lines = lyric.split("\n").filter((line) => line.trim() !== "");
  const alignments: IAlignmentItemSubword[] = [];

  lines.forEach((lineContent, lineIndex) => {
    let wordIndex = 0;
    let subwordIndex = 0;
    let counter = 0;
    while (lineContent) {
      counter++;
      if (lineContent.trim() === "") break;
      if (counter > 100) {
        rollbar.debug("parseLrcToAlignments: too many iterations", {
          lyric,
          lineContent,
        });
        break;
      }

      let start = -1;
      let end = -1;
      let text = "";

      const lineMatch = parseLineTime(lineContent);
      if (lineMatch) {
        lineContent = removeMatch(lineContent, lineMatch);
      }
      const wordStartMatch = parseWordTime(lineContent);
      if (wordStartMatch) {
        lineContent = removeMatch(lineContent, wordStartMatch);
      }

      if (wordStartMatch) {
        start = wordStartMatch.time;
      } else if (lineMatch) {
        start = lineMatch.time;
      }

      const textMatch = parseText(lineContent);
      if (!textMatch) {
        continue;
      }
      if (textMatch && textMatch.text === "") {
        lineContent = removeMatch(lineContent, textMatch);
        continue;
      }

      text = textMatch.text;
      lineContent = removeMatch(lineContent, textMatch);

      const wordEndMatch = parseWordTime(lineContent);
      if (!wordEndMatch) {
        lineContent = removeMatch(lineContent, textMatch);
        continue;
      }

      end = wordEndMatch.time;

      if (end < start) {
        const prevAlignment = alignments[alignments.length - 1];
        if (prevAlignment) {
          const prevDuration = prevAlignment.end - prevAlignment.start;
          end = prevAlignment.start + prevDuration;
        } else {
          end = start + 0.3;
        }
      }

      if (text === "" || text === "_") {
        continue;
      }

      const alignment = {
        line: lineIndex + 1,
        word: wordIndex + 1,
        subword: subwordIndex + 1,
        start,
        end,
        text,
      };
      alignments.push(alignment);
      if (textMatch.eow) {
        wordIndex++;
        subwordIndex = 0;
      } else {
        subwordIndex++;
      }
    }
  });

  alignments.forEach((alignment, index) => {
    const nextAlignment = alignments[index + 1];
    if (nextAlignment && alignment.line < nextAlignment.line) {
      const lineitems = alignments.filter((a) => a.line === alignment.line);
      if (lineitems.length > 0) {
        const lineStart = lineitems[0].start;
        const lineEnd = lineitems[lineitems.length - 1].end;
        const lineDuration = lineEnd - lineStart;
        const lineLength = lineitems
          .map((r) => r.text.length)
          .reduce((a, b) => a + b, 0);
        const avgDuration = lineDuration / lineLength;
        const newEnd = parseFloat(
          (alignment.start + avgDuration * alignment.text.length).toFixed(2)
        );

        if (newEnd <= nextAlignment.start) {
          alignment.end = newEnd;
        }
      }
    }
  });

  if (alignments.length === 0) {
    const lrc = splitStringToChunks(lyric, 500);
    rollbar.warn("failed to parse lrc", { lrc });
    return;
  }

  return {
    id: randomUUID(),
    mode: "subword",
    modelId: "imported",
    createdAt: new Date().toISOString(),
    alignment: alignments,
  };
}

export function parseSimpleLrcToAlignments(
  lyric: string
): Alignment2Line | undefined {
  const lines = lyric.split("\n").filter((line) => line.trim() !== "");
  const alignments: IAlignmentItemLine[] = [];

  lines.forEach((lineContent, lineIndex) => {
    const lineMatch = parseSimpleLrcLine(lineContent);
    if (!lineMatch) {
      return;
    }
    const nextLine = lines[lineIndex + 1];
    let end = -1;
    if (nextLine) {
      const nextLineMatch = parseSimpleLrcLine(nextLine);
      if (nextLineMatch) {
        end = nextLineMatch.start;
      }
    }
    if (end === -1) {
      end = lineMatch.start + 2;
    }
    const alignment = {
      line: lineIndex + 1,
      start: lineMatch.start,
      end,
      text: lineMatch.text,
    };
    alignments.push(alignment);
  });

  if (alignments.length === 0) {
    const lrc = splitStringToChunks(lyric, 500);
    rollbar.warn("failed to parse lrc", { lrc });
    return;
  }

  return {
    id: randomUUID(),
    modelId: "imported",
    mode: "line",
    createdAt: new Date().toISOString(),
    alignment: alignments,
  };
}

export function parseSimpleLrcLine(line: string): SimpleLine | undefined {
  const lineRegex = /^\[(\d+):(\d+\.\d+)\](.*)/;
  const lineMatch = lineRegex.exec(line);
  if (lineMatch) {
    let text = lineMatch[3].trim();
    if (text.endsWith("\\")) {
      text = text.slice(0, -1);
    }
    const minutes = parseInt(lineMatch[1], 10);
    const seconds = parseFloat(lineMatch[2]);
    const time = minutes * 60 + seconds;

    return { start: time, text };
  }
}

export function alignment2Lrc(alignment: Alignment2) {
  switch (alignment.mode) {
    case "line":
      return lineAlignment2Lrc(alignment);
    case "word":
      return wordAlignment2Lrc(alignment);
    case "subword":
      return subwordAlignment2Lrc(alignment);
  }
}

export function parseSecondsToLrcTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${secondsLeft
    .toFixed(2)
    .padStart(5, "0")}`;
}

export function subwordAlignment2Lrc(alignment: Alignment2Subword): string {
  const alignment3 = alignment2ToAlignment3(alignment);
  let lrc = "";
  alignment3.lines.forEach((line) => {
    lrc += `[${parseSecondsToLrcTime(line.start)}]`;
    line.words.forEach((word) => {
      word.subwords.forEach((subword) => {
        lrc += `<${parseSecondsToLrcTime(subword.start)}>${
          subword.text
        }<${parseSecondsToLrcTime(subword.end)}>`;
      });
      lrc += " ";
    });
    lrc = lrc.trim();
    lrc += "\n";
  });
  return lrc;
}

export function wordAlignment2Lrc(alignment: Alignment2Word): string {
  const alignment3 = alignment2ToAlignment3(alignment);
  let lrc = "";
  alignment3.lines.forEach((line) => {
    lrc += `[${parseSecondsToLrcTime(line.start)}]`;
    line.words.forEach((word) => {
      lrc += `<${parseSecondsToLrcTime(word.start)}>${
        word.text
      } <${parseSecondsToLrcTime(word.end)}>`;
    });
    lrc += "\n";
  });
  return lrc;
}

export function lineAlignment2Lrc(alignment: Alignment2Line): string {
  let lrc = "";
  alignment.alignment.forEach((line) => {
    lrc += `[${parseSecondsToLrcTime(line.start)}]${line.text}\n`;
  });
  return lrc;
}
