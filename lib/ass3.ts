import {
  IStyleOptions,
  Alignment3,
  AlignmentV2Line,
  SubtitlesPosition,
  AssRendererSettingsBase,
  Resolution,
} from "@/types";
import {
  Ass,
  AssPlugin,
  AssRenderer,
  Dialogue,
  Events,
  ScriptInfo,
  Style,
  Styles,
  TwoLinePosition,
} from "./ass";
import {
  assColor,
  getSingersFromAlignment,
  getStyleOptions,
  isEven,
  karaokeTag,
} from "./ass/utils";
import { ALL_SINGERS_ID } from "@/consts";
import { shouldAddSpace } from "./ass/utils";

export interface Ass3Settings extends AssRendererSettingsBase {
  id: "ass3";
  waitingLineEnabled: boolean;
  waitingLineGap: number;
  waitingLineDuration: number;
  waitingLineFadeInMs?: number;
  waitingLineFadeOutMs?: number;
  activeLineFadeInMs?: number;
  activeLineFadeOutMs?: number;
  activeLineEndExtraSeconds: number;
  subtitlesPosition: SubtitlesPosition;
}

export interface AssSong3Options {
  alignment: Alignment3;
  styleOptionsMapping: Record<number, IStyleOptions>;
  rtl: boolean;
  offset?: number;
  assSettings: Ass3Settings;
  resolution: Resolution;
}

export interface AssLineOptions {
  start: number;
  end: number;
  style: IStyleOptions;
  words: AssWord[];
  active: boolean;
  top: boolean;
  alignment?: AlignmentV2Line;
  twoLinePosition?: TwoLinePosition;
  assSettings: Ass3Settings;
}

export interface AssWordOptions {
  start: number;
  end: number;
  text: string;
  subwords: AssSubword[];
  line: AlignmentV2Line;
}

export interface OutlineOptions {
  activeColor: string;
  inactiveColor: string;
}

export interface AssSubwordOptions {
  start: number;
  end: number;
  text: string;
  lineStart: number;
  outlineOptions?: OutlineOptions;
}

export interface AssOptions {
  title?: string;
  rtl?: boolean;
  plugins?: AssPlugin[];
}

export class Ass3Renderer implements AssRenderer {
  private alignment: Alignment3;
  private rtl: boolean;
  private styleOptionsMapping: Record<number, IStyleOptions>;
  private offset: number;
  private assSettings: Ass3Settings;
  private resolution: Resolution;
  constructor({
    alignment,
    rtl,
    styleOptionsMapping,
    offset,
    assSettings,
    resolution,
  }: AssSong3Options) {
    this.alignment = alignment;
    this.rtl = rtl;
    this.styleOptionsMapping = styleOptionsMapping;
    this.offset = offset || 0;
    this.assSettings = assSettings;
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
    const dialogues: Dialogue[] = [];
    const assLines: AssLine[] = [];
    let displayOnTop = true;

    const singers = getSingersFromAlignment(this.alignment);

    this.alignment.lines.forEach((line, index) => {
      const words = this.createWordList(line);
      if (words.length === 0 || !this.assSettings.subtitlesPosition) return;

      const prevLine = this.alignment.lines[index - 1];
      let hasLongGap = false;
      if (prevLine) {
        const gap = line.start - prevLine.end;
        hasLongGap = gap > 5;
      }

      if (hasLongGap) {
        displayOnTop = true;
      }

      const currLineSinger = line.singer ?? 0;
      const currLineStyle = getStyleOptions(
        this.styleOptionsMapping,
        currLineSinger
      );

      const isAllSinger = currLineSinger === ALL_SINGERS_ID;

      const collectedLines: AssLine[] = [];

      if (this.assSettings.subtitlesPosition.duetSplit && isAllSinger) {
        for (const singer of singers) {
          if (singer === ALL_SINGERS_ID) continue;
          const style = getStyleOptions(this.styleOptionsMapping, singer);

          const position =
            !singer || isEven(singer)
              ? this.assSettings.subtitlesPosition.firstSinger
              : this.assSettings.subtitlesPosition.secondSinger;

          if (this.assSettings.waitingLineEnabled) {
            const waitingLine1 = this.addWaitingLineIfNeeded(
              index,
              {
                ...line,
                singer,
              },
              words,
              style,
              position,
              displayOnTop,
              this.assSettings
            );
            if (waitingLine1) collectedLines.push(waitingLine1);

            const activeLine1 = this.addActiveLine(
              {
                ...line,
                singer,
              },
              this.createWordList(line, style),
              style,
              position,
              displayOnTop,
              this.assSettings
            );
            collectedLines.push(activeLine1);
          }
        }
      } else {
        let primaryPosition;

        if (isAllSinger) {
          primaryPosition = this.assSettings.subtitlesPosition.bothSinger;
        } else if (!line.singer || isEven(line.singer)) {
          primaryPosition = this.assSettings.subtitlesPosition.firstSinger;
        } else {
          primaryPosition = this.assSettings.subtitlesPosition.secondSinger;
        }

        if (this.assSettings.waitingLineEnabled) {
          const waitingLine = this.addWaitingLineIfNeeded(
            index,
            line,
            words,
            currLineStyle,
            primaryPosition,
            displayOnTop,
            this.assSettings
          );
          if (waitingLine) collectedLines.push(waitingLine);
        }

        const activeLine = this.addActiveLine(
          line,
          this.createWordList(line, currLineStyle),
          currLineStyle,
          primaryPosition,
          displayOnTop,
          this.assSettings
        );
        collectedLines.push(activeLine);
      }

      assLines.push(...collectedLines);
      displayOnTop = !displayOnTop;
    });

    // Finalize dialogues
    assLines.forEach((assLine) => {
      assLine.karaoke(this.rtl);
      dialogues.push(assLine.dialogue);
    });

    return dialogues;
  }

  private createWordList(
    line: AlignmentV2Line,
    style?: IStyleOptions
  ): AssWord[] {
    let outlineOptions: OutlineOptions | undefined;

    if (style && style.activeOutlineColor) {
      outlineOptions = {
        activeColor: style.activeOutlineColor,
        inactiveColor: style.outlineColour,
      };
    }

    return line.words
      .filter((word) => word.text.trim())
      .map((word) => {
        const adjustedStart = word.start - this.offset;
        const adjustedEnd = word.end - this.offset;
        if (adjustedStart < 0) return null;

        const subwords =
          word.subwords?.map(
            (sub) =>
              new AssSubword({
                start: sub.start - this.offset,
                end: sub.end - this.offset,
                text: sub.text,
                lineStart: line.start,
                outlineOptions,
              })
          ) || [];

        return new AssWord({
          start: adjustedStart,
          end: adjustedEnd,
          text: word.text,
          subwords,
          line: line,
        });
      })
      .filter(Boolean) as AssWord[];
  }

  private addWaitingLineIfNeeded(
    index: number,
    line: any,
    words: AssWord[],
    style: IStyleOptions,
    twoLinePosition: TwoLinePosition | undefined,
    displayOnTop: boolean,
    settings: Ass3Settings
  ): AssLine | undefined {
    const previousLine = this.alignment.lines[index - 1];
    if (previousLine) {
      const hasLongGap =
        words[0].start - previousLine.end > settings.waitingLineGap;
      const start = hasLongGap
        ? words[0].start - settings.waitingLineDuration
        : previousLine.start + settings.activeLineEndExtraSeconds;

      return new AssLine({
        start,
        end: words[0].start,
        words,
        style,
        active: false,
        top: displayOnTop,
        alignment: line,
        twoLinePosition,
        assSettings: settings,
      });
    } else if (index === 0) {
      return new AssLine({
        start: words[0].start - settings.waitingLineDuration,
        end: words[0].start,
        words,
        style,
        active: false,
        top: displayOnTop,
        alignment: line,
        twoLinePosition,
        assSettings: settings,
      });
    }

    return undefined;
  }

  private addActiveLine(
    line: any,
    words: AssWord[],
    style: any,
    twoLinePosition: TwoLinePosition | undefined,
    displayOnTop: boolean,
    settings: Ass3Settings
  ): AssLine {
    return new AssLine({
      start: words[0].start,
      end: words[words.length - 1].end + settings.activeLineEndExtraSeconds,
      active: true,
      words,
      style,
      top: displayOnTop,
      alignment: line,
      twoLinePosition,
      assSettings: settings,
    });
  }
}

export class AssLine {
  words: AssWord[];
  style: IStyleOptions;
  start: number;
  end: number;
  text = "";
  done = false;
  active = false;
  top = false;
  assSettings: Ass3Settings;
  alignment?: AlignmentV2Line;
  twoLinePosition?: TwoLinePosition;

  constructor({
    start,
    end,
    style,
    words,
    active,
    top,
    alignment,
    twoLinePosition,
    assSettings,
  }: AssLineOptions) {
    this.start = start;
    this.end = end;
    this.style = style;
    this.words = words;
    this.active = active;
    this.top = top;
    this.alignment = alignment;
    this.twoLinePosition = twoLinePosition;
    this.assSettings = assSettings;
  }

  get firstWord(): AssWord | undefined {
    return this.words[0];
  }

  get lastWord(): AssWord | undefined {
    return this.words[this.words.length - 1];
  }

  karaoke(rtl: boolean) {
    if (this.done) return this;

    if (this.active) {
      this.words.forEach((word, wordIdx) => {
        word.karaoke(rtl, this.words[wordIdx - 1]);
      });
    }

    this.done = true;

    return this;
  }

  get dialogue() {
    if (!this.firstWord || !this.lastWord) throw new Error("No words");

    let text = this.text;

    if (this.twoLinePosition) {
      if (this.top) {
        text += `{\\pos(${this.twoLinePosition.top.x},${this.twoLinePosition.top.y})}`;
      } else {
        text += `{\\pos(${this.twoLinePosition.bottom.x},${this.twoLinePosition.bottom.y})}`;
      }
    }

    if (this.style.blur) {
      text += `{\\blur${this.style.blur}}`;
    }

    if (this.active) {
      if (
        this.assSettings.activeLineFadeInMs ||
        this.assSettings.activeLineFadeOutMs
      ) {
        text += `{\\fad(${this.assSettings.activeLineFadeInMs ?? 0},${
          this.assSettings.activeLineFadeOutMs ?? 0
        })}`;
      }

      const color = assColor(this.style.activeColour);
      text += `{\\2c${color}}`;
      this.words.forEach((w, wordIdx) => {
        text += w.text;
        w.subwords.forEach((s) => {
          text += this.style.uppercase ? s.text.toUpperCase() : s.text;
        });
        const nextWord = this.words[wordIdx + 1];
        if (shouldAddSpace(w.originalText, nextWord?.originalText)) {
          text += " ";
        }
      });
    } else {
      if (
        this.assSettings.waitingLineFadeInMs ||
        this.assSettings.waitingLineFadeOutMs
      ) {
        text += `{\\fad(${this.assSettings.waitingLineFadeInMs ?? 0},${
          this.assSettings.waitingLineFadeOutMs ?? 0
        })}`;
      }

      const color = assColor(this.style.secondaryColour);
      text += `{\\c${color}}`;

      this.words.forEach((w, wordIdx) => {
        text += this.style.uppercase ? w.text.toUpperCase() : w.text;
        const nextWord = this.words[wordIdx + 1];
        if (shouldAddSpace(w.originalText, nextWord?.originalText)) {
          text += " ";
        }
      });
    }

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

export function cleanAssTags(text?: string) {
  if (!text) return "";
  return text.trim().replace(/{\\.*?}/g, "");
}

export class AssWord {
  line: AlignmentV2Line;
  subwords: AssSubword[];
  start: number;
  end: number;
  text: string;
  originalText: string;
  done = false;

  constructor({ start, end, text, subwords, line }: AssWordOptions) {
    this.start = start;
    this.end = end;
    this.text = text;
    this.subwords = subwords;
    this.originalText = text;
    this.line = line;
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
  lineStart: number;
  outlineOptions?: OutlineOptions;
  done = false;

  constructor({
    start,
    end,
    text,
    lineStart,
    outlineOptions,
  }: AssSubwordOptions) {
    this.start = start;
    this.end = end;
    this.text = text;
    this.lineStart = lineStart;
    this.outlineOptions = outlineOptions;
  }

  karaoke(rtl: boolean, prevSubword?: AssSubword) {
    if (this.done) return this;
    const gap = prevSubword ? this.start - prevSubword.end : 0;
    let prevTag = "";
    if (gap > 0) {
      prevTag = karaokeTag(gap);
    }

    if (
      this.outlineOptions &&
      this.outlineOptions.activeColor !== this.outlineOptions.inactiveColor
    ) {
      this.text = karaokeAndOutlineTag(
        this.text,
        this.outlineOptions.inactiveColor,
        this.outlineOptions.activeColor,
        this.lineStart,
        this.start,
        this.end,
        rtl
      );
      this.text = `${prevTag}${this.text}`;
    } else {
      const durationSeconds = this.end - this.start;
      const tag = karaokeTag(durationSeconds, rtl);
      this.text = `${prevTag}${tag}${this.text}`;
    }

    this.done = true;
    return this;
  }
}

export function karaokeAndOutlineTag(
  text: string,
  startColor: string,
  endColor: string,
  lineStart: number,
  subwordStart: number,
  subwordEnd: number,
  rtl?: boolean
): string {
  const rtlPrefix = rtl ? "\\frz180\\frx180\\fry180" : "";

  // Total duration of the subword in milliseconds
  const durationMs = (subwordEnd - subwordStart) * 1000;
  // Duration per character in milliseconds
  const durationPerCharMs = durationMs / text.length;
  // Duration per character in centiseconds for the \K tag
  const durationPerCharCs = Math.round(durationPerCharMs / 10);

  // Relative start time of the subword in milliseconds
  const relativeStartMs = (subwordStart - lineStart) * 1000;

  // Initialize an array to hold the tagged characters
  const taggedChars = [];
  const assStartColor = assColor(startColor);
  const assEndColor = assColor(endColor);

  // Loop through each character and assign tags
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // Start and end times for the animation of the current character
    const charStartMs = relativeStartMs + i * durationPerCharMs;
    const charEndMs = charStartMs + durationPerCharMs;

    // Create the tagged character with \K, \3c, and \t for smooth outline transition
    const taggedChar = `{${rtlPrefix}\\K${durationPerCharCs}}{\\3c${assStartColor}\\t(${Math.round(
      charStartMs
    )},${Math.round(charEndMs)},1,\\3c${assEndColor})}${char}`;

    taggedChars.push(taggedChar);
  }

  // Join the tagged characters into a single string
  return taggedChars.join("");
}
