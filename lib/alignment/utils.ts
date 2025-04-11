import { SyncAlignment } from "@/components/SyncTool/types";
import {
  Alignment2,
  Alignment2Line,
  Alignment2Subword,
  Alignment2Word,
  Alignment3,
  AlignmentItemUnion,
  AlignmentV2Line,
  AlignmentV2Subword,
  AlignmentV2Word,
  IAlignmentItemSubword,
  IAlignmentItemWord,
} from "@/types";

export function makeAlignment({
  start,
  end,
  paragraph,
  line,
  word,
  text,
}: any): AlignmentItemUnion {
  return { start, end, line, word, text };
}

export function alignmentsFromJSON(
  s: string
): AlignmentItemUnion[] | undefined {
  const obj = JSON.parse(s);
  if (!obj || !obj.length) return;
  return obj.map(makeAlignment);
}

export function alignmentsLine2alignments3(
  alignment: Alignment2Line
): Alignment3 {
  let lines: AlignmentV2Line[] = [];
  alignment.alignment.forEach((alignment) => {
    const line: AlignmentV2Line = {
      singer: alignment.singer,
      text: alignment.text,
      start: alignment.start,
      end: alignment.end,
      words: [
        {
          text: alignment.text,
          start: alignment.start,
          end: alignment.end,
          subwords: [
            {
              text: alignment.text,
              start: alignment.start,
              end: alignment.end,
            },
          ],
        },
      ],
    };
    lines.push(line);
  });
  const text = alignment.alignment.map((a) => a.text).join("\n");
  return {
    id: alignment.id,
    modelId: alignment.modelId,
    createdAt: alignment.createdAt,
    lines,
    text,
  };
}

export function alignmentsWord2alignments3(
  alignment: Alignment2Word
): Alignment3 {
  let lines: AlignmentV2Line[] = [];
  let currentLine = -1;
  let lineStart: number = -1;
  let lineEnd: number = -1;
  let lineSinger: number | undefined = undefined;
  let lineWords: AlignmentV2Word[] = [];

  alignment.alignment.forEach((item) => {
    if (item.line !== currentLine) {
      if (currentLine !== -1) {
        const line: AlignmentV2Line = {
          singer: lineSinger,
          start: lineStart,
          end: lineEnd,
          text: lineWords
            .map((word) => word.text)
            .join(" ")
            .trim(),
          words: lineWords,
        };
        lines.push(line);
      }
      currentLine = item.line;
      lineStart = item.start;
      lineSinger = item.singer;
      lineWords = [];
    }

    lineEnd = item.end;
    lineWords.push({
      start: item.start,
      end: item.end,
      text: item.text.trim(),
      vocals: item.vocals,
      subwords: [
        {
          text: item.text.trim(),
          start: item.start,
          end: item.end,
        },
      ],
    });
  });

  // Push the last line
  if (lineWords.length > 0) {
    lines.push({
      singer: lineSinger,
      start: lineStart,
      end: lineEnd,
      text: lineWords.map((word) => word.text).join(" "),
      words: lineWords,
    });
  }

  const text = lines.map((line) => line.text).join("\n");

  return {
    id: alignment.id,
    modelId: alignment.modelId,
    createdAt: alignment.createdAt,
    text,
    lines,
  };
}

export function alignmentsSubword2alignments3(
  alignment2Subword: Alignment2Subword
): Alignment3 {
  const { id, modelId, createdAt, alignment } = alignment2Subword;

  // Group alignment items by line number
  const linesMap = new Map<number, IAlignmentItemSubword[]>();
  for (const item of alignment) {
    if (!linesMap.has(item.line)) {
      linesMap.set(item.line, []);
    }
    linesMap.get(item.line)!.push(item);
  }

  // Build the lines array
  const lines: AlignmentV2Line[] = [];

  // Sort line numbers to maintain order
  const lineNumbers = Array.from(linesMap.keys()).sort((a, b) => a - b);

  for (const lineNumber of lineNumbers) {
    const items = linesMap.get(lineNumber)!;

    // Sort items by word number and subword number
    items.sort((a, b) => {
      if (a.word !== b.word) {
        return a.word - b.word;
      } else {
        return a.subword - b.subword;
      }
    });

    // Group items by word number
    const wordsMap = new Map<number, IAlignmentItemSubword[]>();
    for (const item of items) {
      if (!wordsMap.has(item.word)) {
        wordsMap.set(item.word, []);
      }
      wordsMap.get(item.word)!.push(item);
    }

    // Build words array
    const words: AlignmentV2Word[] = [];

    // Sort word numbers to maintain order
    const wordNumbers = Array.from(wordsMap.keys()).sort((a, b) => a - b);

    for (const wordNumber of wordNumbers) {
      const subwordItems = wordsMap.get(wordNumber)!;

      // Sort subword items by subword number
      subwordItems.sort((a, b) => a.subword - b.subword);

      // Collect subwords
      const subwords: AlignmentV2Subword[] = subwordItems.map(
        (subwordItem) => ({
          start: subwordItem.start,
          end: subwordItem.end,
          text: subwordItem.text,
          vocals: subwordItem.vocals,
        })
      );

      // Determine word's start, end, and text
      const wordStart = subwordItems[0].start;
      const wordEnd = subwordItems[subwordItems.length - 1].end;
      const wordText = subwordItems
        .map((subwordItem) => subwordItem.text)
        .join("");

      const word: AlignmentV2Word = {
        start: wordStart,
        end: wordEnd,
        text: wordText,
        subwords: subwords,
      };

      words.push(word);
    }

    // Determine line's start, end, text, and singer
    const lineStart = items.reduce(
      (min, item) => Math.min(min, item.start),
      Infinity
    );
    const lineEnd = items.reduce(
      (max, item) => Math.max(max, item.end),
      -Infinity
    );
    const lineText = words.map((word) => word.text).join(" ");
    const lineSinger = items[0].singer;

    const line: AlignmentV2Line = {
      start: lineStart,
      end: lineEnd,
      text: lineText,
      singer: lineSinger,
      words: words,
    };

    lines.push(line);
  }

  const text = lines.map((line) => line.text).join("\n");

  // Build the Alignment3 object
  const alignment3: Alignment3 = {
    id,
    modelId,
    createdAt,
    text,
    lines,
  };

  return alignment3;
}

export function alignment2ToAlignment3(alignment: Alignment2): Alignment3 {
  switch (alignment.mode) {
    case "line":
      return alignmentsLine2alignments3(alignment);
    case "subword":
      return alignmentsSubword2alignments3(alignment);
    case "word":
      return alignmentsWord2alignments3(alignment);
    default:
      return alignmentsWord2alignments3(alignment);
  }
}

export function alignment3ToAlignment2(alignment3: Alignment3): Alignment2 {
  return {
    id: alignment3.id,
    modelId: alignment3.modelId,
    createdAt: alignment3.createdAt,
    groupId: alignment3.groupId,
    alignment: alignments3LinesToSubwords(alignment3.lines),
    mode: "subword",
  };
}

export function alignments3LinesToSubwords(
  lines: AlignmentV2Line[]
): IAlignmentItemSubword[] {
  const subwords: IAlignmentItemSubword[] = [];

  lines.forEach((line, lineIdx) => {
    line.words.forEach((word, wordIdx) => {
      word.subwords.forEach((subword, subwordIdx) => {
        const alignment = {
          line: lineIdx + 1,
          word: wordIdx + 1,
          subword: subwordIdx + 1,
          text: subword.text,
          start: subword.start,
          end: subword.end,
          singer: line.singer,
          vocals: subword.vocals,
        };
        subwords.push(alignment);
      });
    });
  });

  return subwords;
}

export function alignments3LinesToWords(
  lines: AlignmentV2Line[]
): IAlignmentItemWord[] {
  const words: IAlignmentItemWord[] = [];

  lines.forEach((line, lineIdx) => {
    line.words.forEach((word, wordIdx) => {
      const alignment = {
        line: lineIdx + 1,
        word: wordIdx + 1,
        text: word.text,
        start: word.start,
        end: word.end,
        singer: line.singer,
        vocals: word.vocals,
      };
      words.push(alignment);
    });
  });

  return words;
}

export function syncAlignmentToAlignment2(
  syncAlignment: SyncAlignment,
  alignment2: Alignment2
): Alignment2 {
  const alignment: IAlignmentItemSubword[] = [];
  syncAlignment.lines.forEach((line, lineIdx) => {
    line.words.forEach((word, wordIdx) => {
      word.subwords.forEach((subword, subwordIdx) => {
        alignment.push({
          line: lineIdx + 1,
          word: wordIdx + 1,
          subword: subwordIdx + 1,
          text: subword.text,
          start: subword.start,
          end: subword.end,
          singer: line.singer,
          vocals: subword.vocals,
        });
      });
    });
  });

  const newAlignment2: Alignment2 = {
    id: alignment2.id,
    modelId: alignment2.modelId,
    createdAt: alignment2.createdAt,
    groupId: alignment2.groupId,
    mode: "subword",
    alignment,
  };

  return newAlignment2;
}
