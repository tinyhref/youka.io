import {
  IStyleOptions,
  Alignment3,
  AlignmentV2Line,
  AssRendererSettingsBase,
  Resolution,
  LineAlignment,
} from "@/types";
import {
  Ass,
  AssRenderer,
  Dialogue,
  Events,
  ScriptInfo,
  Style,
  Styles,
} from "./ass";
import {
  getSingersFromAlignment,
  getStyleOptions,
  isEven,
  karaokeTag,
} from "./ass/utils";
import { ALL_SINGERS_ID } from "@/consts";
import { shouldAddSpace } from "./ass/utils";

export interface Ass2Settings extends AssRendererSettingsBase {
  id: "ass2";
  subtitlesPosition: {
    duetSplit: boolean;
    firstSinger: {
      marginV: number;
      alignment: LineAlignment;
    };
    secondSinger: {
      marginV: number;
      alignment: LineAlignment;
    };
    bothSinger: {
      marginV: number;
      alignment: LineAlignment;
    };
  };
}

export interface AssSong2Options {
  alignment: Alignment3;
  styleOptionsMapping: Record<number, IStyleOptions>;
  assSettings: Ass2Settings;
  resolution: Resolution;
  rtl: boolean;
  offset?: number;
}

export interface AssLineOptions {
  start: number;
  end: number;
  style: IStyleOptions;
  words: AssWord[];
  alignment?: AlignmentV2Line;
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

export class Ass2Renderer implements AssRenderer {
  private alignment: Alignment3;
  private rtl: boolean;
  private styleOptionsMapping: Record<number, IStyleOptions>;
  private assSettings: Ass2Settings;
  private offset: number;
  private resolution: Resolution;

  constructor({
    alignment,
    rtl,
    styleOptionsMapping,
    assSettings,
    offset,
    resolution,
  }: AssSong2Options) {
    this.alignment = alignment;
    this.rtl = rtl;
    this.styleOptionsMapping = styleOptionsMapping;
    this.assSettings = assSettings;
    this.offset = offset || 0;
    this.resolution = resolution;
  }

  ass() {
    const dialogues = this.getDialogues();
    const styles = Object.entries(this.styleOptionsMapping).map(
      ([singer, style]) => {
        let newStyle = structuredClone(style);
        if (Number(singer) === ALL_SINGERS_ID) {
          newStyle.marginV = this.assSettings.subtitlesPosition.bothSinger.marginV;
          newStyle.alignment = this.assSettings.subtitlesPosition.bothSinger.alignment;
        } else if (isEven(Number(singer))) {
          newStyle.marginV = this.assSettings.subtitlesPosition.firstSinger.marginV;
          newStyle.alignment = this.assSettings.subtitlesPosition.firstSinger.alignment;
        } else {
          newStyle.marginV = this.assSettings.subtitlesPosition.secondSinger.marginV;
          newStyle.alignment = this.assSettings.subtitlesPosition.secondSinger.alignment;
        }
        return new Style(newStyle);
      }
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
    const singers = getSingersFromAlignment(this.alignment);

    this.alignment.lines.forEach((l) => {
      const singer = l.singer ?? 0;
      let style = getStyleOptions(this.styleOptionsMapping, singer);

      const isAllSingers = singer === ALL_SINGERS_ID;

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

      if (this.assSettings.subtitlesPosition.duetSplit && isAllSingers) {
        for (const singer of singers) {
          if (singer === ALL_SINGERS_ID) continue;
          const style = getStyleOptions(this.styleOptionsMapping, singer);

          const line = new AssLine({
            start: words[0].start,
            end: words[words.length - 1].end,
            words,
            style,
            alignment: l,
          });
          assLines.push(line);
        }
      } else {
        const line = new AssLine({
          start: words[0].start,
          end: words[words.length - 1].end,
          words,
          style,
          alignment: l,
        });
        assLines.push(line);
      }
    });

    assLines.forEach((assLine) => {
      assLine.karaoke(this.rtl);
      ds.push(assLine.dialogue);
    });

    return ds;
  }
}

export class AssLine {
  private words: AssWord[];
  private style: IStyleOptions;
  start: number;
  end: number;
  private text = "";
  private alignment?: AlignmentV2Line;
  constructor({ start, end, style, words, alignment }: AssLineOptions) {
    this.start = start;
    this.end = end;
    this.style = style;
    this.words = words;
    this.alignment = alignment;
  }

  get firstWord(): AssWord | undefined {
    return this.words[0];
  }

  get lastWord(): AssWord | undefined {
    return this.words[this.words.length - 1];
  }

  karaoke(rtl: boolean) {
    this.words.forEach((word, wordIdx) => {
      word.karaoke(rtl, this.words[wordIdx - 1]);
    });

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
