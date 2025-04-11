import {
  IStyleOptions,
  Alignment3,
  AlignmentV2Line,
  AssRendererSettingsBase,
  Resolution,
} from "@/types";
import {
  Ass,
  AssRenderer,
  Dialogue,
  Events,
  Position,
  ScriptInfo,
  Style,
  Styles,
} from "./ass";
import { getStyleOptions, karaokeTag, shouldAddSpace } from "./ass/utils";

export interface Ass4SubtitlesPosition {
  upperFirstLine: Position;
  upperSecondLine: Position;
  lowerFirstLine: Position;
  lowerSecondLine: Position;
}

export interface Ass4Settings extends AssRendererSettingsBase {
  id: "ass4";
  subtitlesPosition: Ass4SubtitlesPosition;
  fadeInMs: number;
  fadeOutMs: number;
}

export interface AssSong4Options {
  alignment: Alignment3;
  styleOptionsMapping: Record<number, IStyleOptions>;
  assSettings: Ass4Settings;
  rtl: boolean;
  resolution: Resolution;
  offset?: number;
}

export interface AssLineOptions {
  start: number;
  end: number;
  style: IStyleOptions;
  words: AssWord[];
  alignment?: AlignmentV2Line;
  position?: Position;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface AssWordOptions {
  start: number;
  end: number;
  text: string;
  subwords: AssSubword[];
}

export interface AssSubwordOptions {
  start: number;
  end: number;
  text: string;
}

export interface AssOptions {
  title?: string;
  rtl?: boolean;
}

interface LineGroup {
  upper: boolean;
  firstLine: AssLine;
  secondLine?: AssLine;
}

export class Ass4Renderer implements AssRenderer {
  private alignment: Alignment3;
  private rtl: boolean;
  private styleOptionsMapping: Record<number, IStyleOptions>;
  private assSettings: Ass4Settings;
  private offset: number;
  private resolution: Resolution;

  constructor({
    alignment,
    rtl,
    styleOptionsMapping,
    assSettings,
    offset,
    resolution,
  }: AssSong4Options) {
    this.alignment = alignment;
    this.rtl = rtl;
    this.styleOptionsMapping = styleOptionsMapping;
    this.assSettings = assSettings;
    this.offset = offset || 0;
    this.resolution = resolution;
  }

  ass() {
    const dialogues = this.getDialogues();
    const styles = Object.values(this.styleOptionsMapping).map(
      (s) => new Style(s)
    );
    const ass = new Ass({
      scriptInfo: new ScriptInfo({
        playResX: this.resolution.width,
        playResY: this.resolution.height,
      }),
      styles: new Styles(styles),
      events: new Events(dialogues),
    });
    return ass;
  }

  getDialogues() {
    const ds: Dialogue[] = [];
    const assLines: AssLine[] = [];

    this.alignment.lines.forEach((l) => {
      const singer = l.singer ?? 0;
      let style = getStyleOptions(this.styleOptionsMapping, singer);

      const words: AssWord[] = [];
      l.words.forEach((w) => {
        if (!w.text.trim()) return;
        const newStart = w.start - this.offset;
        const newEnd = w.end - this.offset;
        if (newStart < 0) {
          return;
        }
        const text = style.uppercase ? w.text.toUpperCase() : w.text;
        const subwords: AssSubword[] = [];
        if (w.subwords) {
          w.subwords.forEach((s) => {
            subwords.push(
              new AssSubword({
                start: s.start - this.offset,
                end: s.end - this.offset,
                text: s.text,
              })
            );
          });
        }
        const word = new AssWord({
          start: newStart,
          end: newEnd,
          text,
          subwords,
        });
        words.push(word);
      });

      if (!words.length) {
        return;
      }

      const line = new AssLine({
        start: words[0].start,
        end: words[words.length - 1].end,
        words,
        style,
        alignment: l,
        fadeInMs: this.assSettings.fadeInMs,
        fadeOutMs: this.assSettings.fadeOutMs,
      });
      assLines.push(line);
    });

    const groups: LineGroup[] = [];
    const MAX_GAP_SECONDS = 5;
    let i = 0;

    let upper = true;
    while (i < assLines.length) {
      const firstLine = assLines[i];
      const secondLine = assLines[i + 1];

      // If this is the last line
      if (i === assLines.length - 1) {
        groups.push({
          upper,
          firstLine,
        });
        upper = !upper;
        break;
      }

      // Check gap between first and second line
      const gap = secondLine.start - firstLine.end;
      if (gap > MAX_GAP_SECONDS) {
        // Create group with only the first line
        groups.push({
          upper,
          firstLine,
        });
        upper = true;
        i++; // Move to next line
      } else {
        // Create group with both lines
        groups.push({
          upper,
          firstLine,
          secondLine,
        });
        upper = !upper;
        i += 2; // Skip both lines
      }
    }

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const prevGroup = groups[i - 1];
      let groupStart;
      const currGroupStart = group.firstLine.start;
      const prevGroupEnd =
        prevGroup?.secondLine?.end ?? prevGroup?.firstLine.end;
      const isLargeGap =
        prevGroupEnd && currGroupStart - prevGroupEnd > MAX_GAP_SECONDS;
      if (i === 0) {
        groupStart = group.firstLine.start - 3;
      } else if (!isLargeGap && prevGroup?.firstLine.firstWord?.start) {
        groupStart = prevGroup.firstLine.firstWord.start;
      } else {
        groupStart = group.firstLine.start - 3;
      }
      if (groupStart < 0) {
        groupStart = 0;
      }

      const groupEnd = group.secondLine
        ? Math.max(group.firstLine.end, group.secondLine.end)
        : group.firstLine.end;

      group.firstLine.start = groupStart;
      group.firstLine.end = groupEnd;

      if (group.secondLine) {
        group.secondLine.start = groupStart;
        group.secondLine.end = groupEnd;
      }

      if (group.upper) {
        group.firstLine.position = this.assSettings.subtitlesPosition.upperFirstLine;
        if (group.secondLine) {
          group.secondLine.position = this.assSettings.subtitlesPosition.upperSecondLine;
        }
      } else {
        group.firstLine.position = this.assSettings.subtitlesPosition.lowerFirstLine;
        if (group.secondLine) {
          group.secondLine.position = this.assSettings.subtitlesPosition.lowerSecondLine;
        }
      }
    }

    const newLines: AssLine[] = [];
    for (const group of groups) {
      newLines.push(group.firstLine);
      if (group.secondLine) {
        newLines.push(group.secondLine);
      }
    }

    newLines.forEach((assLine) => {
      assLine.karaoke(this.rtl);
      ds.push(assLine.dialogue);
    });

    return ds;
  }
}

export class AssLine {
  private words: AssWord[];
  private style: IStyleOptions;
  position?: Position;
  start: number;
  end: number;
  private text = "";
  private alignment?: AlignmentV2Line;
  private done = false;
  private fadeInMs?: number;
  private fadeOutMs?: number;

  constructor({
    start,
    end,
    style,
    words,
    alignment,
    position,
    fadeInMs,
    fadeOutMs,
  }: AssLineOptions) {
    this.start = start;
    this.end = end;
    this.style = style;
    this.words = words;
    this.alignment = alignment;
    this.position = position;
    this.fadeInMs = fadeInMs;
    this.fadeOutMs = fadeOutMs;
  }

  get firstWord(): AssWord | undefined {
    return this.words[0];
  }

  get lastWord(): AssWord | undefined {
    return this.words[this.words.length - 1];
  }

  karaoke(rtl: boolean) {
    if (this.done) return this;

    if (!this.firstWord) return this;

    if (this.position) {
      this.text += `{\\pos(${this.position.x},${this.position.y})}`;
    }

    if (this.start < this.firstWord.start) {
      const gap = this.firstWord.start - this.start;
      this.text += karaokeTag(gap);
    }

    this.words.forEach((word, wordIdx) => {
      word.karaoke(rtl, this.words[wordIdx - 1]);
    });

    this.done = true;
    return this;
  }

  get dialogue() {
    if (!this.firstWord || !this.lastWord) throw new Error("No words");

    let text = this.text;
    this.words.forEach((word, wordIdx) => {
      const nextWord = this.words[wordIdx + 1];
      text += word.text;
      word.subwords.forEach((subword) => {
        text += subword.text;
      });
      if (shouldAddSpace(word.originalText, nextWord?.originalText)) {
        text += " ";
      }
    });

    return new Dialogue({
      start: this.start,
      end: this.end,
      text: text.trim(),
      style: this.style.name,
      plugin: "karaoke",
      alignment: this.alignment,
    });
  }
}

export class AssWord {
  subwords: AssSubword[];
  start: number;
  end: number;
  text: string;
  originalText: string;
  done = false;

  constructor({ start, end, text, subwords }: AssWordOptions) {
    this.start = start;
    this.end = end;
    this.text = text;
    this.subwords = subwords;
    this.originalText = text;
  }

  karaoke(rtl: boolean, prevWord?: AssWord) {
    if (this.done) return this;

    const gap = prevWord ? this.start - prevWord.end : 0;
    let prevTag = "";
    if (gap > 0) {
      prevTag = karaokeTag(gap);
    }

    this.text = prevTag;

    this.subwords.forEach((subword, subwordIdx) => {
      subword.karaoke(rtl, this.subwords[subwordIdx - 1]);
    });

    this.done = true;

    return this;
  }
}

export class AssSubword {
  start: number;
  end: number;
  text: string;
  done = false;

  constructor({ start, end, text }: AssSubwordOptions) {
    this.start = start;
    this.end = end;
    this.text = text;
  }

  karaoke(rtl: boolean, prevSubword?: AssSubword) {
    if (this.done) return this;
    const gap = prevSubword ? this.start - prevSubword.end : 0;
    let prevTag = "";
    if (gap > 0) {
      prevTag = karaokeTag(gap);
    }
    const durationSeconds = this.end - this.start;
    const tag = karaokeTag(durationSeconds, rtl);
    this.text = `${prevTag}${tag}${this.text}`;
    this.done = true;
    return this;
  }
}
