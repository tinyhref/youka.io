import { AlignmentV2Line, IStyleOptions } from "@/types";
import { assColor } from "./utils";
import { DefaultStyleOptions1 } from "@/consts";

export class Ass {
  scriptInfo: ScriptInfo;
  styles: Styles;
  events: Events;

  constructor(options: {
    scriptInfo?: ScriptInfo;
    styles: Styles;
    events?: Events;
  }) {
    this.scriptInfo = options.scriptInfo || new ScriptInfo();
    this.styles = options.styles;
    this.events = options.events || new Events();
  }

  static create(
    dialogues: DialogueOptions[],
    stylesOptions: IStyleOptions[]
  ): Ass {
    const events = new Events(
      dialogues.map((dialogue) => new Dialogue(dialogue))
    );
    const styles = new Styles(stylesOptions.map((style) => new Style(style)));
    return new Ass({ styles, events });
  }

  toString(): string {
    return [this.scriptInfo, this.styles, this.events].join("\n\n");
  }
}

export class ScriptInfo {
  header: string;
  wrapStyle: number;
  playResX: number;
  playResY: number;

  constructor(
    options: {
      wrapStyle?: number;
      playResX?: number;
      playResY?: number;
    } = {}
  ) {
    this.header = "[Script Info]";
    this.wrapStyle = options.wrapStyle || 0;
    this.playResX = options.playResX || 1920;
    this.playResY = options.playResY || 1080;
  }

  toString(): string {
    return [
      this.header,
      "ScriptType: v4.00+",
      `WrapStyle: ${this.wrapStyle}`,
      "ScaledBorderAndShadow: yes",
      "YCbCr Matrix: TV.601",
      `PlayResX: ${this.playResX}`,
      `PlayResY: ${this.playResY}`,
    ].join("\n");
  }
}

export class Styles {
  header: string;
  styles: Style[];

  constructor(styles: Style[]) {
    this.header =
      "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding";
    this.styles = styles;
  }

  add(style: IStyleOptions): void {
    const styleIndex = this.styles.findIndex(
      (s) => s.options.name === style.name
    );
    if (styleIndex !== -1) {
      this.styles[styleIndex] = new Style(style);
    } else {
      this.styles.push(new Style(style));
    }
  }

  toString(): string {
    return this.header + "\n" + this.styles.join("\n");
  }
}

export class Style {
  options: IStyleOptions;

  constructor(options?: IStyleOptions) {
    this.options = options || DefaultStyleOptions1;
  }

  toString(): string {
    return `Style: ${this.options.name},${this.options.fontname},${
      this.options.fontsize
    },${assColor(this.options.primaryColour)},${assColor(
      this.options.secondaryColour
    )},${assColor(this.options.outlineColour)},${assColor(
      this.options.backColour
    )},${+this.options.bold},${+this.options.italic},${+this.options
      .underline},${this.options.strikeOut},${this.options.scaleX},${
      this.options.scaleY
    },${this.options.spacing},${this.options.angle},${
      this.options.borderStyle
    },${this.options.outline},${this.options.shadow},${
      this.options.alignment
    },${this.options.marginL},${this.options.marginR},${this.options.marginV},${
      this.options.encoding
    }`;
  }
}

export class Events {
  header: string;
  events: Dialogue[];

  constructor(events?: Dialogue[]) {
    this.header =
      "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text";
    this.events = events || [];
  }

  add(event: Dialogue): void {
    this.events.push(event);
  }

  toString(): string {
    return this.header + "\n" + this.events.join("\n");
  }
}

export interface DialogueOptions {
  start: number;
  end: number;
  text: string;
  style: string;
  plugin: string;
  layer?: number;
  alignment?: AlignmentV2Line;
}

export class Dialogue {
  start: number;
  end: number;
  style: string;
  layer: number;
  plugins: string[] = [];
  private text: string;
  alignment?: AlignmentV2Line;

  constructor({
    start,
    end,
    text,
    style,
    plugin,
    layer,
    alignment,
  }: DialogueOptions) {
    this.start = start;
    this.end = end;
    this.style = style;
    this.layer = layer || 0;
    this.text = this.setText(text, plugin);
    this.alignment = alignment;
  }

  getText(): string {
    return this.text;
  }

  setText(text: string, plugin: string) {
    this.text = text;
    this.plugins.push(plugin);
    return this.text;
  }

  parseTimeToString(obj: string | number): string {
    if (typeof obj === "string") return obj;
    return this.parseSeconds(obj);
  }

  parseSeconds(time: number): string {
    // Split the time into seconds and milliseconds
    const totalSeconds = Math.floor(time);
    const milliseconds = Math.floor((time - totalSeconds) * 100);

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format the time components to two digits
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");
    const formattedMilliseconds = String(milliseconds).padStart(2, "0");

    // Construct the ASS time format
    const assFormat = `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
    return assFormat;
  }

  toString(): string {
    return `Dialogue: ${this.layer},${this.parseTimeToString(
      this.start
    )},${this.parseTimeToString(this.end)},${this.style},,0,0,0,,${this.text}`;
  }
}
