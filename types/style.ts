import { TwoLinePosition } from "@/lib/ass";

export enum LineAlignment {
  BottomLeft = 1,
  BottomCenter = 2,
  BottomRight = 3,
  MiddleLeft = 4,
  MiddleCenter = 5,
  MiddleRight = 6,
  TopLeft = 7,
  TopCenter = 8,
  TopRight = 9,
}

export interface IStyleOptions {
  alignment: number;
  angle: number;
  backColour: string;
  bold: boolean;
  borderStyle: number;
  encoding: number;
  fontname: string;
  fontsize: number;
  italic: boolean;
  marginL: number;
  marginR: number;
  marginV: number;
  name: string;
  outline: number;
  outlineColour: string;
  activeOutlineColor: string;
  primaryColour: string;
  scaleX: number;
  scaleY: number;
  secondaryColour: string;
  shadow: number;
  spacing: number;
  strikeOut: 0 | 1;
  underline: boolean;
  uppercase: boolean;
  activeColour: string;
  blur?: number;
  alpha?: number;
}

export interface SubtitlesPosition {
  duetSplit: boolean;
  firstSinger: TwoLinePosition;
  secondSinger: TwoLinePosition;
  bothSinger: TwoLinePosition;
}

export type Theme = "light" | "dark";

export type SingerToStyleNameMapping = Record<number, string>;
export type SingerToStyleOptionsMapping = Record<number, IStyleOptions>;

export interface StyleMapping {
  id: string;
  name: string;
  mapping: SingerToStyleNameMapping;
}
