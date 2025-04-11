import { Alignment2, Alignment3, IStyleOptions } from "@/types";
import { RGB } from "./types";
import { Ass } from "./ass";
import {
  ALL_SINGERS_ID,
  AutoStyleName,
  DefaultStyleOptions1,
  DefaultStyleOptions2,
  DefaultStyleOptions3,
} from "@/consts";

export function assColor(c: string): string {
  if (c.startsWith("&H")) return c;
  const rgb = hexToRgb(c);
  if (!rgb) return c;
  const bgr = rgb2assHex(rgb);
  return bgr;
}

function rgb2assHex(rgb: RGB): string {
  let bgr = rgb2bgrHex(rgb);
  bgr = `&H${bgr.replace("#", "")}&`;
  return bgr;
}

export function decimalToHex(decimal: number): string {
  return decimal.toString(16).padStart(2, "0");
}

function hexToRgb(hex: string): RGB | undefined {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgb2bgrHex(rgb: RGB): string {
  return (
    "#" +
    [rgb.b, rgb.g, rgb.r]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

export function bgr2rgb(rgb: RGB): string {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

export function parseTimeToSeconds(s: string): number {
  const parts = s.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseInt(parts[2]);
  const milliseconds = parseInt(parts[3]);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 100;
}

export function karaokeTag(durationSec: number, rtl?: boolean): string {
  const rtlPrefix = rtl ? "\\frz180\\frx180\\fry180" : "";
  const k = Math.round(durationSec * 10000) / 100;
  return `{${rtlPrefix}\\K${k}}`;
}

export function getStyle(style: string, nextStyle?: string) {
  if (style === AutoStyleName) {
    return nextStyle || DefaultStyleOptions1.name;
  }
  return style;
}

export function getPrevEvent(ass: Ass, eventIdx: number, plugins: string[]) {
  const currentEvent = ass.events.events[eventIdx];
  if (!currentEvent) return undefined;

  for (let i = eventIdx - 1; i >= 0; i--) {
    const event = ass.events.events[i];
    if (!event) continue;
    if (!hasCommonElement(event.plugins, plugins)) continue;

    if (event.alignment?.words.length && currentEvent.alignment?.words.length) {
      if (
        event.alignment.words[0].start < currentEvent.alignment.words[0].start
      ) {
        return event;
      }
    } else if (event.end <= currentEvent.start) {
      return event;
    }
  }
}

export function hasCommonElement(arr1: string[], arr2: string[]): boolean {
  return arr1.some((element) => arr2.includes(element));
}

export function isEven(n: number): boolean {
  return n % 2 === 0;
}

export function getStyleOptions(
  styleOptionsMapping: Record<number, IStyleOptions>,
  singer?: number
) {
  singer = singer ?? 0;

  const style = styleOptionsMapping[singer];
  if (style) return structuredClone(style);

  if (singer === 0) return DefaultStyleOptions1;
  if (singer === 1) return DefaultStyleOptions2;
  if (singer === ALL_SINGERS_ID) return DefaultStyleOptions3;

  return DefaultStyleOptions1;
}

export function getSingersFromAlignment(alignment: Alignment3) {
  const singers: number[] = [0];
  alignment.lines.forEach((line) => {
    if (line.singer && !singers.includes(line.singer)) {
      singers.push(line.singer);
    }
  });
  if (singers.length === 2 && singers.includes(0) && singers.includes(-1)) {
    singers.push(1);
  }
  return singers;
}

export function shouldAddSpace(text: string, nextText?: string): boolean {
  if (!text) return true;

  if (text.trimEnd().endsWith("-") || nextText?.trimStart().startsWith("-")) {
    return false;
  }
  return true;
}

export function getBlurTag(blur?: number) {
  if (blur) {
    return `\\blur${blur}`;
  }
  return "";
}

export function getSingersFromAlignment2(alignment: Alignment2): number[] {
  const set = new Set<number>();
  set.add(0);
  alignment.alignment.forEach((a) => {
    if (a.singer) {
      set.add(a.singer);
    }
  });
  return Array.from(set).sort((a, b) => {
    // Handle cases where one or both numbers are negative
    if (a >= 0 && b < 0) return -1; // positive numbers come before negative
    if (a < 0 && b >= 0) return 1; // negative numbers come after positive
    // For numbers of the same sign, sort normally
    return a - b;
  });
}

export function getSingersFromAlignment3(alignment: Alignment3): number[] {
  const set = new Set<number>();
  set.add(0);
  alignment.lines.forEach((line) => {
    if (line.singer) {
      set.add(line.singer);
    }
  });
  return Array.from(set).sort((a, b) => {
    // Handle cases where one or both numbers are negative
    if (a >= 0 && b < 0) return -1; // positive numbers come before negative
    if (a < 0 && b >= 0) return 1; // negative numbers come after positive
    // For numbers of the same sign, sort normally
    return a - b;
  });
}
