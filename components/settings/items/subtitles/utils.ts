import {
  Alignment3,
  AlignmentPluginOptions,
  AssPluginOptions,
  SubtitlesPreset,
} from "@/types";

export const DefaultDuration = 10;

export const EmptyAlignment: Alignment3 = {
  id: "empty",
  modelId: "empty",
  createdAt: "",
  text: "",
  lines: [],
};

export const DefaultAlignment: Alignment3 = {
  id: "default",
  modelId: "default",
  createdAt: "",
  text: "This is the first line",
  lines: [
    {
      start: 3,
      end: 6,
      text: "This is the first line",
      words: [
        {
          start: 3,
          end: 3.5,
          text: "This",
          subwords: [{ start: 3, end: 3.5, text: "This" }],
        },
        {
          start: 3.5,
          end: 4,
          text: "is",
          subwords: [{ start: 3.5, end: 4, text: "is" }],
        },
        {
          start: 4,
          end: 4.5,
          text: "the",
          subwords: [{ start: 4, end: 4.5, text: "the" }],
        },
        {
          start: 4.5,
          end: 5,
          text: "first",
          subwords: [{ start: 4.5, end: 5, text: "first" }],
        },
        {
          start: 5,
          end: 5.5,
          text: "line",
          subwords: [{ start: 5, end: 5.5, text: "line" }],
        },
      ],
    },
    {
      start: 7,
      end: 10,
      text: "This is the second line",
      words: [
        {
          start: 7,
          end: 7.5,
          text: "This",
          subwords: [{ start: 7, end: 7.5, text: "This" }],
        },
        {
          start: 7.5,
          end: 8,
          text: "is",
          subwords: [{ start: 7.5, end: 8, text: "is" }],
        },
        {
          start: 8,
          end: 8.5,
          text: "the",
          subwords: [{ start: 8, end: 8.5, text: "the" }],
        },
        {
          start: 8.5,
          end: 9,
          text: "second",
          subwords: [{ start: 8.5, end: 9, text: "second" }],
        },
        {
          start: 9,
          end: 9.5,
          text: "line",
          subwords: [{ start: 9, end: 9.5, text: "line" }],
        },
      ],
    },
  ],
};

interface GenerateAlignmentProps {
  start?: number;
  wordDuration?: number;
  gapBetweenWords?: number;
  gapBetweenLines?: number;
  singer?: number;
  numberOfLines?: number;
}
export function generateAlignment(
  options?: GenerateAlignmentProps
): Alignment3 {
  const start = options?.start || 0;
  const wordDuration = options?.wordDuration || 0.5;
  const gapBetweenWords = options?.gapBetweenWords || 0.1;
  const gapBetweenLines = options?.gapBetweenLines || 0.5;
  const singer = options?.singer;
  const numberOfLines = options?.numberOfLines || 2;
  const numberToString: Record<number, string> = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
  };
  const linesText = Array.from(
    { length: numberOfLines },
    (_, index) => `This is the ${numberToString[index + 1]} line`
  );

  let currentTime = start;
  const lines = linesText.map((lineText, index) => {
    const wordsText = lineText.split(" ");
    const words = wordsText.map((wordText) => {
      const wordStart = currentTime;
      const wordEnd = currentTime + wordDuration;
      const subwords = [
        {
          start: wordStart,
          end: wordEnd,
          text: wordText,
        },
      ];

      currentTime = wordEnd + gapBetweenWords; // Add gap after each word

      return {
        start: wordStart,
        end: wordEnd,
        text: wordText,
        subwords: subwords,
      };
    });

    const lineStart = words[0].start;
    const lineEnd = words[words.length - 1].end;

    // Add gap after each line
    currentTime = lineEnd + gapBetweenLines;

    return {
      start: lineStart,
      end: lineEnd,
      text: lineText,
      words: words,
      singer,
    };
  });

  return {
    id: "default",
    modelId: "default",
    createdAt: new Date().toISOString(),
    text: linesText.join("\n"),
    lines: lines,
  };
}

export function generateAlignmentWithSingers(
  start: number,
  wordDuration: number = 0.5,
  gapBetweenWords: number = 0.1,
  gapBetweenLines: number = 0.5
) {
  const linesTextTemplate = [
    "This is singer $(singer) in line $(line)",
    "This is singer $(singer) in line $(line)",
  ];

  const lines: any[] = [];

  for (let singer = 0; singer <= 1; singer++) {
    let currentTime = start; // Reset currentTime for each singer

    linesTextTemplate.forEach((templateText, lineIndex) => {
      let lineText = templateText.replace(
        "$(line)",
        (lineIndex + 1).toString()
      );
      lineText = lineText.replace("$(singer)", (singer + 1).toString());
      const wordsText = lineText.split(" ");

      // Calculate line start time based on the current singer and reset for parallel timing
      const words = wordsText.map((wordText) => {
        const wordStart = currentTime;
        const wordEnd = wordStart + wordDuration;
        const subwords = [
          {
            start: wordStart,
            end: wordEnd,
            text: wordText,
          },
        ];

        currentTime = wordEnd + gapBetweenWords; // Add gap after each word

        return {
          start: wordStart,
          end: wordEnd,
          text: wordText,
          subwords: subwords,
        };
      });

      const lineStart = words[0].start;
      const lineEnd = words[words.length - 1].end;

      // Push the line for the current singer
      lines.push({
        singer: singer,
        start: lineStart,
        end: lineEnd,
        text: lineText,
        words: words,
      });

      // Reset currentTime to start for the next line for both singers
      currentTime =
        start +
        (lineIndex + 1) *
          (gapBetweenLines + words.length * (wordDuration + gapBetweenWords));
    });
  }

  return {
    id: "default",
    modelId: "default",
    createdAt: new Date().toISOString(),
    text: lines.map((line) => line.text).join("\n"),
    lines: lines,
  };
}

export function getSubtitlesPresetWithAssPlugins(
  subtitlesPreset: SubtitlesPreset,
  assPlugins: AssPluginOptions[]
): SubtitlesPreset {
  return {
    ...subtitlesPreset,
    assPlugins,
  };
}

export function getSubtitlesPresetWithAlignmentPlugins(
  subtitlesPreset: SubtitlesPreset,
  alignmentPlugins: AlignmentPluginOptions[]
): SubtitlesPreset {
  return {
    ...subtitlesPreset,
    alignmentPlugins,
  };
}
