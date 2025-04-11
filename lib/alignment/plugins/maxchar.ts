import { Alignment3, AlignmentV2Line, AlignmentV2Word } from "@/types";
import { AlignmentPlugin } from "../types";

export interface AlignmentMaxCharPluginOptions {
  id: "maxchar";
  enabled: boolean;
  limit: number;
}

export const DefaultAlignmentMaxCharPluginOptions: AlignmentMaxCharPluginOptions = {
  id: "maxchar",
  enabled: true,
  limit: 25,
};

export class AlignmentMaxCharPlugin implements AlignmentPlugin {
  id = "maxchar";
  enabled: boolean;

  private limit: number;

  constructor({ enabled, limit }: AlignmentMaxCharPluginOptions) {
    this.enabled = enabled;
    this.limit = limit;
  }

  apply(alignment: Alignment3): Alignment3 {
    if (!this.enabled) return alignment;

    const newAlignment: Alignment3 = { ...alignment, lines: [] };

    alignment.lines.forEach((line) => {
      const words = line.words || [];

      if (words.length === 0) {
        // Handle line without words by splitting the text
        this.processLineText(line, newAlignment);
      } else {
        // Process words while preserving words array structure
        this.processWordsLine(line, newAlignment);
      }
    });

    return newAlignment;
  }

  private processWordsLine(
    originalLine: AlignmentV2Line,
    newAlignment: Alignment3
  ) {
    const words = originalLine.words!;
    const totalCharCount = words.reduce(
      (sum, word) => sum + this.getWordLength(word),
      0
    );
    const numParts = Math.ceil(totalCharCount / this.limit);

    if (numParts <= 1) {
      // Line is within limit, add it as is
      newAlignment.lines.push(originalLine);
      return;
    }

    // Find the best partition of words to balance character counts
    const partitions = this.partitionWords(words, numParts);

    // Create new lines based on partitions
    partitions.forEach((lineWords) => {
      const newLine: AlignmentV2Line = {
        ...originalLine,
        start: lineWords[0].start,
        end: lineWords[lineWords.length - 1].end,
        text: lineWords.map((w) => w.text).join(" "),
        words: lineWords,
      };
      newAlignment.lines.push(newLine);
    });
  }

  private processLineText(
    originalLine: AlignmentV2Line,
    newAlignment: Alignment3
  ) {
    const words = originalLine.text.split(/\s+/);
    const totalCharCount = words.reduce((sum, word) => sum + word.length, 0);
    const numParts = Math.ceil(totalCharCount / this.limit);

    if (numParts <= 1) {
      // Line is within limit, add it as is
      newAlignment.lines.push(originalLine);
      return;
    }

    // Find the best partition of words to balance character counts
    const partitions = this.partitionTextWords(words, numParts);

    // Create new lines based on partitions
    partitions.forEach((lineWords) => {
      const text = lineWords.join(" ");
      const newLine: AlignmentV2Line = {
        ...originalLine,
        text: text,
        words: [],
      };
      newAlignment.lines.push(newLine);
    });
  }

  private getWordLength(word: AlignmentV2Word): number {
    if (word.subwords && word.subwords.length > 0) {
      // Count length by subword texts
      return word.subwords.reduce(
        (sum, subword) => sum + subword.text.length,
        0
      );
    } else {
      // Use word text length
      return word.text.length;
    }
  }

  private partitionWords(
    words: AlignmentV2Word[],
    numParts: number
  ): AlignmentV2Word[][] {
    const wordLengths = words.map((word) => this.getWordLength(word));
    const totalLength = wordLengths.reduce((sum, len) => sum + len, 0);
    const targetLengthPerPart = totalLength / numParts;

    const partitions: AlignmentV2Word[][] = [];
    let currentPartition: AlignmentV2Word[] = [];
    let currentLength = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = wordLengths[i];

      if (
        currentPartition.length > 0 &&
        Math.abs(currentLength + wordLength - targetLengthPerPart) >
          Math.abs(currentLength - targetLengthPerPart)
      ) {
        // Current word would make the partition less balanced, start a new partition
        partitions.push(currentPartition);
        currentPartition = [];
        currentLength = 0;
      }

      currentPartition.push(word);
      currentLength += wordLength;
    }

    if (currentPartition.length > 0) {
      partitions.push(currentPartition);
    }

    // If we have fewer partitions than numParts, adjust by distributing words
    while (partitions.length < numParts) {
      // Find the longest partition and split it
      let maxPartitionIndex = 0;
      let maxPartitionLength = 0;

      partitions.forEach((partition, index) => {
        const length = partition.reduce(
          (sum, word) => sum + this.getWordLength(word),
          0
        );
        if (length > maxPartitionLength) {
          maxPartitionLength = length;
          maxPartitionIndex = index;
        }
      });

      const partitionToSplit = partitions[maxPartitionIndex];
      if (partitionToSplit.length <= 1) {
        // Cannot split further
        break;
      }

      // Split the partition in half
      const middleIndex = Math.floor(partitionToSplit.length / 2);
      const newPartition1 = partitionToSplit.slice(0, middleIndex);
      const newPartition2 = partitionToSplit.slice(middleIndex);

      // Replace the old partition with the two new ones
      partitions.splice(maxPartitionIndex, 1, newPartition1, newPartition2);
    }

    return partitions;
  }

  private partitionTextWords(words: string[], numParts: number): string[][] {
    const wordLengths = words.map((word) => word.length);
    const totalLength = wordLengths.reduce((sum, len) => sum + len + 1, -1); // Including spaces
    const targetLengthPerPart = totalLength / numParts;

    const partitions: string[][] = [];
    let currentPartition: string[] = [];
    let currentLength = -1; // Start at -1 because the first word doesn't have a leading space

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = word.length + 1; // Including space

      if (
        currentPartition.length > 0 &&
        Math.abs(currentLength + wordLength - targetLengthPerPart) >
          Math.abs(currentLength - targetLengthPerPart)
      ) {
        // Current word would make the partition less balanced, start a new partition
        partitions.push(currentPartition);
        currentPartition = [];
        currentLength = -1;
      }

      currentPartition.push(word);
      currentLength += wordLength;
    }

    if (currentPartition.length > 0) {
      partitions.push(currentPartition);
    }

    // If we have fewer partitions than numParts, adjust by distributing words
    while (partitions.length < numParts) {
      // Find the longest partition and split it
      let maxPartitionIndex = 0;
      let maxPartitionLength = 0;

      partitions.forEach((partition, index) => {
        const length = partition.reduce(
          (sum, word) => sum + word.length + 1,
          -1
        );
        if (length > maxPartitionLength) {
          maxPartitionLength = length;
          maxPartitionIndex = index;
        }
      });

      const partitionToSplit = partitions[maxPartitionIndex];
      if (partitionToSplit.length <= 1) {
        // Cannot split further
        break;
      }

      // Split the partition in half
      const middleIndex = Math.floor(partitionToSplit.length / 2);
      const newPartition1 = partitionToSplit.slice(0, middleIndex);
      const newPartition2 = partitionToSplit.slice(middleIndex);

      // Replace the old partition with the two new ones
      partitions.splice(maxPartitionIndex, 1, newPartition1, newPartition2);
    }

    return partitions;
  }
}
