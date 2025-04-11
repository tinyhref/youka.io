import { Alignment3, AlignmentV2Line } from "@/types";
import { AlignmentPlugin } from "../types";

export interface AlignmentAutoBreakPluginOptions {
  id: "autobreak";
  enabled: boolean;
  extraBuffer: number;
}

export const DefaultAlignmentAutoBreakPluginOptions: AlignmentAutoBreakPluginOptions = {
  id: "autobreak",
  enabled: true,
  extraBuffer: 0.3,
};

export class AlignmentAutoBreakPlugin implements AlignmentPlugin {
  id = "autobreak";
  enabled: boolean;
  extraBuffer: number;

  constructor({ enabled, extraBuffer }: AlignmentAutoBreakPluginOptions) {
    this.enabled = enabled;
    this.extraBuffer = extraBuffer;
  }

  apply(alignment: Alignment3): Alignment3 {
    if (!this.enabled) return alignment;

    const newLines: AlignmentV2Line[] = [];

    for (const line of alignment.lines) {
      const words = line.words;
      const singer = line.singer;

      if (words.length === 0) {
        newLines.push(line);
        continue;
      }

      // Calculate gaps between words within this line
      const gaps: number[] = [];
      for (let i = 0; i < words.length - 1; i++) {
        const gap = words[i + 1].start - words[i].end;
        gaps.push(gap);
      }

      if (gaps.length === 0) {
        // Only one word in the line, add it as is
        newLines.push(line);
        continue;
      }

      // Compute mean gap for this line
      const sumOfGaps = gaps.reduce((sum, gap) => sum + gap, 0);
      const meanGap = sumOfGaps / gaps.length;

      // Define extra buffer (can be adjusted as needed)
      const threshold = meanGap + this.extraBuffer;

      // Find indices where the gap exceeds the threshold
      const splitPoints: number[] = [];
      for (let i = 0; i < gaps.length; i++) {
        if (gaps[i] > threshold) {
          splitPoints.push(i + 1);
        }
      }

      // Build split indices, including start and end points
      const splitIndices = [0, ...splitPoints, words.length];

      // Create new lines based on the split indices
      for (let i = 0; i < splitIndices.length - 1; i++) {
        const startIdx = splitIndices[i];
        const endIdx = splitIndices[i + 1];

        const newWords = words.slice(startIdx, endIdx);
        const newLineStart = newWords[0].start;
        const newLineEnd = newWords[newWords.length - 1].end;
        const newLineText = newWords.map((w) => w.text).join(" ");

        const newLine: AlignmentV2Line = {
          singer: singer,
          start: newLineStart,
          end: newLineEnd,
          text: newLineText,
          words: newWords,
        };

        newLines.push(newLine);
      }
    }

    // Post-processing: Merge single-word lines based on mean gaps of adjacent lines
    const mergedLines: AlignmentV2Line[] = [];
    let i = 0;
    while (i < newLines.length) {
      const currentLine = newLines[i];

      if (currentLine.words.length === 1) {
        const word = currentLine.words[0];
        let merged = false;

        // Calculate mean gap of the previous line, if it exists
        let prevMeanGap = null;
        if (mergedLines.length > 0) {
          const prevLine = mergedLines[mergedLines.length - 1];
          const prevGaps: number[] = [];
          for (let j = 0; j < prevLine.words.length - 1; j++) {
            const gap = prevLine.words[j + 1].start - prevLine.words[j].end;
            prevGaps.push(gap);
          }
          if (prevGaps.length > 0) {
            const sumPrevGaps = prevGaps.reduce((sum, gap) => sum + gap, 0);
            prevMeanGap = sumPrevGaps / prevGaps.length;
          }
        }

        // Calculate mean gap of the next line, if it exists
        let nextMeanGap = null;
        if (i + 1 < newLines.length) {
          const nextLine = newLines[i + 1];
          const nextGaps: number[] = [];
          for (let j = 0; j < nextLine.words.length - 1; j++) {
            const gap = nextLine.words[j + 1].start - nextLine.words[j].end;
            nextGaps.push(gap);
          }
          if (nextGaps.length > 0) {
            const sumNextGaps = nextGaps.reduce((sum, gap) => sum + gap, 0);
            nextMeanGap = sumNextGaps / nextGaps.length;
          }
        }

        // Try to merge with the previous line if gap is acceptable
        if (prevMeanGap !== null && mergedLines.length > 0) {
          const prevLine = mergedLines[mergedLines.length - 1];
          const gapToPrev = word.start - prevLine.end;

          if (gapToPrev <= prevMeanGap + 0.3) {
            // Merge with previous line
            prevLine.words.push(word);
            prevLine.end = word.end;
            prevLine.text += " " + word.text;
            merged = true;
          }
        }

        // If not merged with previous, try to merge with next line
        if (!merged && nextMeanGap !== null) {
          const nextLine = newLines[i + 1];
          const gapToNext = nextLine.start - word.end;

          if (gapToNext <= nextMeanGap + 0.3) {
            // Merge with next line
            const mergedWords = [word, ...nextLine.words];
            const mergedText = mergedWords.map((w) => w.text).join(" ");
            const mergedLine: AlignmentV2Line = {
              singer: currentLine.singer,
              start: word.start,
              end: nextLine.end,
              text: mergedText,
              words: mergedWords,
            };

            mergedLines.push(mergedLine);
            i++; // Skip the next line since we've merged it
            merged = true;
          }
        }

        // If not merged with either, add as is
        if (!merged) {
          mergedLines.push(currentLine);
        }
      } else {
        // For lines with more than one word, add as is
        mergedLines.push(currentLine);
      }

      i++;
    }

    // Construct new alignment with merged lines
    const newAlignment: Alignment3 = {
      ...alignment,
      lines: mergedLines,
    };

    return newAlignment;
  }
}
