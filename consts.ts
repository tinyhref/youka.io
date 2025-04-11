import {
  DefaultAlignmentAutoBreakPluginOptions,
  DefaultAlignmentMaxCharPluginOptions,
} from "./lib/alignment";
import {
  Ass123PluginOptions,
  AssBoxPluginOptions,
  AssCountdownPluginOptions,
  AssFadePluginOptions,
  AssIndicatorPluginOptions,
  AssOffsetPluginOptions,
  AssProgressBarPluginOptions,
  AssTitlePluginOptions,
} from "./lib/ass";
import { Ass2Settings } from "./lib/ass2";
import { Ass3Settings } from "./lib/ass3";
import { Ass4Settings } from "./lib/ass4";
import {
  AudioSource,
  ThumbnailSource,
  VideoSource,
  VideoSourceVideo,
} from "./schemas";
import {
  LineAlignment,
  AspectRatio,
  FFmpegOptions,
  SubtitlesPreset,
  VideoOptions,
  IStyleOptions,
  Resolution,
  StyleMapping,
} from "./types";

export const AutoStyleName = "youka:auto";

export const DefaultStyleOptions1: IStyleOptions = {
  name: "Youka",
  fontname: "Arial Bold",
  fontsize: 96,
  primaryColour: "#2185D0",
  secondaryColour: "#FFFFFF",
  outlineColour: "#000000",
  backColour: "#FFFFFF",
  bold: true,
  italic: false,
  underline: false,
  strikeOut: 0,
  scaleX: 100,
  scaleY: 100,
  spacing: 0,
  angle: 0,
  borderStyle: 1,
  outline: 9,
  shadow: 0,
  alignment: LineAlignment.TopCenter,
  marginL: 0,
  marginR: 0,
  marginV: 0,
  encoding: -1,
  uppercase: false,
  activeColour: "#fff09a",
  activeOutlineColor: "#000000",
};

export const DefaultStyleOptions2: IStyleOptions = {
  name: "Youka 2",
  fontname: "Arial Bold",
  fontsize: 96,
  primaryColour: "#9A3DF6",
  secondaryColour: "#FFFFFF",
  outlineColour: "#000000",
  backColour: "#FFFFFF",
  bold: true,
  italic: false,
  underline: false,
  strikeOut: 0,
  scaleX: 100,
  scaleY: 100,
  spacing: 0,
  angle: 0,
  borderStyle: 1,
  outline: 9,
  shadow: 0,
  alignment: LineAlignment.TopCenter,
  marginL: 0,
  marginR: 0,
  marginV: 0,
  encoding: -1,
  uppercase: false,
  activeColour: "#fff09a",
  activeOutlineColor: "#000000",
};

export const DefaultStyleOptions3: IStyleOptions = {
  name: "Youka 3",
  fontname: "Arial Bold",
  fontsize: 96,
  primaryColour: "#F53DDE",
  secondaryColour: "#FFFFFF",
  outlineColour: "#000000",
  backColour: "#FFFFFF",
  bold: true,
  italic: false,
  underline: false,
  strikeOut: 0,
  scaleX: 100,
  scaleY: 100,
  spacing: 0,
  angle: 0,
  borderStyle: 1,
  outline: 9,
  shadow: 0,
  alignment: LineAlignment.TopCenter,
  marginL: 0,
  marginR: 0,
  marginV: 0,
  encoding: -1,
  uppercase: false,
  activeColour: "#fff09a",
  activeOutlineColor: "#000000",
};

export const DefaultPluginStyleOptions: IStyleOptions = {
  name: "Plugin",
  fontname: "Arial Bold",
  fontsize: 96,
  primaryColour: "#2185D0",
  secondaryColour: "#FFFFFF",
  outlineColour: "#000000",
  backColour: "#FFFFFF",
  activeColour: "#fff09a",
  activeOutlineColor: "#000000",
  bold: true,
  italic: false,
  underline: false,
  strikeOut: 0,
  scaleX: 100,
  scaleY: 100,
  spacing: 0,
  angle: 0,
  borderStyle: 1,
  outline: 9,
  shadow: 0,
  alignment: LineAlignment.TopCenter,
  marginL: 0,
  marginR: 0,
  marginV: 0,
  encoding: -1,
  uppercase: false,
};

export const DefaultStyles = [
  DefaultStyleOptions1,
  DefaultStyleOptions2,
  DefaultStyleOptions3,
];

export const DefaultStylesNames = DefaultStyles.map((s) => s.name);

export const ALL_SINGERS_ID = -1;

export const DefaultAss123PluginOptions: Ass123PluginOptions = {
  id: "123",
  enabled: false,
  autoColor: true,
  autoAlignment: true,
  style: {
    ...DefaultPluginStyleOptions,
    alignment: LineAlignment.MiddleCenter,
    name: "youka:123",
  },
  gap: 5,
  duration: 3,
  text: "1... 2... 3...",
};

export const DefaultStyleMapping: StyleMapping = {
  id: "default",
  name: "Default",
  mapping: {
    0: DefaultStyleOptions1.name,
    1: DefaultStyleOptions2.name,
    2: DefaultStyleOptions3.name,
    [ALL_SINGERS_ID]: DefaultStyleOptions3.name,
  },
};

export const DefaultFFmpegOptions: FFmpegOptions = {
  preset: "medium",
  crf: 23,
  pixFmt: "yuv420p",
  fps: 60,
};

export const DefaultVideoSource: VideoSource = { type: "auto" };
export const DefaultAudioSourceAudio: AudioSource = {
  type: "audio",
  filepath: "",
  id: "",
  duration: 0,
  title: "",
};
export const DefaultAudioSourceUrl: AudioSource = {
  type: "url",
  url: "",
  id: "",
  duration: 0,
  title: "",
  thumbnail: "",
};
export const DefaultAudioSourceVideo: AudioSource = {
  type: "video",
  filepath: "",
  id: "",
  duration: 0,
  title: "",
};
export const DefaultAudioSourceKarafun: AudioSource = {
  type: "karafun",
  filepath: "",
  id: "",
  duration: 0,
  title: "",
  extractResult: {
    dir: "",
    files: [],
  },
};

export const AspectRatio16x9: AspectRatio = {
  width: 16,
  height: 9,
};

export const DefaultThumbnailSource: ThumbnailSource = {
  type: "auto",
};

export const DefaultVideoSourceVideo: VideoSourceVideo = {
  type: "video",
  filepath: "",
  id: "",
  duration: 0,
  title: "",
  aspectRatio: AspectRatio16x9,
};

export const VideoOptions16x9: VideoOptions = {
  aspectRatio: AspectRatio16x9,
  objectFit: "contain",
};

export const DefaultVideoResolution: Resolution = {
  width: 1920,
  height: 1080,
};

export const DefaultAssOffsetPluginOptions: AssOffsetPluginOptions = {
  id: "offset",
  enabled: false,
  offset: -0.1,
};

export const DefaultAssFadePluginOptions: AssFadePluginOptions = {
  id: "fade",
  enabled: false,
  fadein: 1000,
  fadeout: 500,
};

export const DefaultAssBoxPluginOptions: AssBoxPluginOptions = {
  id: "box",
  enabled: false,
  height: 330,
  width: 1920,
  alpha: 80,
  style: {
    ...DefaultPluginStyleOptions,
    name: "youka:box",
    primaryColour: "#000000",
    secondaryColour: "#FFFFFF",
    backColour: "#FFFFFF",
    alignment: LineAlignment.TopCenter,
    marginL: 0,
    marginR: 0,
    marginV: 0,
    outline: 0,
  },
  firstSingerPosition: {
    x: 960,
    y: 690,
  },
  secondSingerPosition: {
    x: 960,
    y: 60,
  },
  bothSingerPosition: {
    x: 960,
    y: 375,
  },
  fadeInMs: 500,
  fadeOutMs: 0,
};

export const DefaultAssTitlePluginOptionsHorizontal: AssTitlePluginOptions = {
  id: "title",
  enabled: true,
  style: {
    ...DefaultPluginStyleOptions,
    name: "youka:title",
    fontname: "Arial Black",
    fontsize: 200,
    primaryColour: "#2185D0",
    outlineColour: "#000000",
    alignment: LineAlignment.TopCenter,
    marginV: 150,
    blur: 5,
  },
  artistStyle: {
    ...DefaultPluginStyleOptions,
    name: "youka:title:artist",
    fontname: "Arial Black",
    fontsize: 150,
    primaryColour: "#FFFFFF",
    outlineColour: "#000000",
    alignment: LineAlignment.TopCenter,
    marginV: 150,
    blur: 5,
  },
  start: 1,
  duration: 4,
};

export const DefaultAssTitlePluginOptionsVertical: AssTitlePluginOptions = {
  ...DefaultAssTitlePluginOptionsHorizontal,
  style: {
    ...DefaultAssTitlePluginOptionsHorizontal.style,
    fontsize: 150,
  },
  artistStyle: {
    ...DefaultAssTitlePluginOptionsHorizontal.artistStyle,
    fontsize: 100,
  },
};

export const DefaultAssProgressBarPluginOptions: AssProgressBarPluginOptions = {
  id: "progressbar",
  enabled: true,
  autoColor: true,
  style: {
    ...DefaultPluginStyleOptions,
    name: "youka:progressbar",
    alignment: LineAlignment.MiddleCenter,
  },
  x: 900,
  y: 60,
  minDuration: 10,
  maxDuration: 60,
  gapStart: 0,
  gapEnd: 0,
  fadeInMs: 0,
  fadeOutMs: 0,
  gapSongStart: 5,
};

export const DefaultAssCountdownPluginOptions: AssCountdownPluginOptions = {
  id: "countdown",
  enabled: true,
  autoColor: false,
  style: {
    ...DefaultPluginStyleOptions,
    name: "youka:countdown",
    alignment: LineAlignment.MiddleCenter,
    primaryColour: "#FFFFFF",
  },
  gap: 5,
  counter: 3,
};

export const DefaultAssIndicatorPluginOptions: AssIndicatorPluginOptions = {
  id: "indicator",
  enabled: true,
  gap: 1,
  duration: 2,
  autoColor: true,
  autoSize: true,
  text: "I",
  style: {
    ...DefaultPluginStyleOptions,
    name: "youka:indicator",
  },
  startPx: -150,
  endPx: -10,
};

export const DEFAULT_BACKGROUND_IMAGE_URL =
  "https://public.youka.io/background.jpg";

export const DefaultAss2Settings: Ass2Settings = {
  id: "ass2",
  subtitlesPosition: {
    duetSplit: true,
    firstSinger: {
      marginV: 150,
      alignment: LineAlignment.BottomCenter,
    },
    secondSinger: {
      marginV: 150,
      alignment: LineAlignment.TopCenter,
    },
    bothSinger: {
      marginV: 150,
      alignment: LineAlignment.MiddleCenter,
    },
  },
};

export const DefaultAss3Settings: Ass3Settings = {
  id: "ass3",
  waitingLineEnabled: true,
  waitingLineGap: 5,
  waitingLineDuration: 3,
  waitingLineFadeInMs: 500,
  waitingLineFadeOutMs: 0,
  activeLineFadeInMs: 0,
  activeLineFadeOutMs: 0,
  activeLineEndExtraSeconds: 0.5,
  subtitlesPosition: {
    duetSplit: true,
    firstSinger: {
      top: {
        x: 960,
        y: 750,
      },
      bottom: {
        x: 960,
        y: 870,
      },
    },
    secondSinger: {
      top: {
        x: 960,
        y: 120,
      },
      bottom: {
        x: 960,
        y: 240,
      },
    },
    bothSinger: {
      top: {
        x: 960,
        y: 435,
      },
      bottom: {
        x: 960,
        y: 555,
      },
    },
  },
};

export const DefaultAss4Settings: Ass4Settings = {
  id: "ass4",
  subtitlesPosition: {
    upperFirstLine: { x: 960, y: 171 },
    upperSecondLine: { x: 960, y: 381 },
    lowerFirstLine: { x: 960, y: 591 },
    lowerSecondLine: { x: 960, y: 801 },
  },
  fadeInMs: 500,
  fadeOutMs: 500,
};

export const DefaultSubtitlesPreset2: SubtitlesPreset = {
  id: "youka-2",
  name: "2 Lines - Dynamic (Horizontal)",
  baseResolution: {
    width: 1920,
    height: 1080,
  },
  assPlugins: [
    DefaultAssProgressBarPluginOptions,
    DefaultAss123PluginOptions,
    DefaultAssCountdownPluginOptions,
    DefaultAssTitlePluginOptionsHorizontal,
    {
      id: "fade",
      enabled: true,
      fadein: 1000,
      fadeout: 500,
    },
    DefaultAssOffsetPluginOptions,
  ],
  alignmentPlugins: [
    DefaultAlignmentMaxCharPluginOptions,
    DefaultAlignmentAutoBreakPluginOptions,
  ],
  assRendererSettings: DefaultAss2Settings,
};

export const DefaultSubtitlesPreset3: SubtitlesPreset = {
  id: "youka-3",
  name: "2 Lines - Static (Horizontal)",
  baseResolution: {
    width: 1920,
    height: 1080,
  },
  assPlugins: [
    DefaultAssTitlePluginOptionsHorizontal,
    DefaultAssProgressBarPluginOptions,
    DefaultAss123PluginOptions,
    DefaultAssCountdownPluginOptions,
    DefaultAssIndicatorPluginOptions,
    DefaultAssBoxPluginOptions,
    DefaultAssFadePluginOptions,
    DefaultAssOffsetPluginOptions,
  ],
  alignmentPlugins: [
    DefaultAlignmentMaxCharPluginOptions,
    DefaultAlignmentAutoBreakPluginOptions,
  ],
  assRendererSettings: DefaultAss3Settings,
};

export const DefaultSubtitlesPreset4: SubtitlesPreset = {
  id: "youka-4",
  name: "4 Lines (Horizontal)",
  baseResolution: {
    width: 1920,
    height: 1080,
  },
  assPlugins: [
    DefaultAssTitlePluginOptionsHorizontal,
    DefaultAssProgressBarPluginOptions,
    DefaultAss123PluginOptions,
    DefaultAssCountdownPluginOptions,
    DefaultAssIndicatorPluginOptions,
    DefaultAssBoxPluginOptions,
    DefaultAssFadePluginOptions,
    DefaultAssOffsetPluginOptions,
  ],
  alignmentPlugins: [
    DefaultAlignmentMaxCharPluginOptions,
    DefaultAlignmentAutoBreakPluginOptions,
  ],
  assRendererSettings: DefaultAss4Settings,
};

export const DefaultSubtitlesPreset5: SubtitlesPreset = {
  id: "youka-5",
  name: "4 Lines (Vertical)",
  baseResolution: {
    width: 1080,
    height: 1920,
  },
  assPlugins: [
    {
      ...DefaultAssTitlePluginOptionsVertical,
      style: {
        ...DefaultPluginStyleOptions,
        alignment: LineAlignment.MiddleCenter,
      },
    },
    DefaultAssProgressBarPluginOptions,
    DefaultAss123PluginOptions,
    DefaultAssCountdownPluginOptions,
    DefaultAssIndicatorPluginOptions,
    DefaultAssBoxPluginOptions,
    DefaultAssFadePluginOptions,
    DefaultAssOffsetPluginOptions,
  ],
  alignmentPlugins: [
    {
      ...DefaultAlignmentMaxCharPluginOptions,
      limit: 18,
    },
    DefaultAlignmentAutoBreakPluginOptions,
  ],
  assRendererSettings: {
    id: "ass4",
    subtitlesPosition: {
      upperFirstLine: { x: 550, y: 280 },
      upperSecondLine: { x: 550, y: 680 },
      lowerFirstLine: { x: 550, y: 1080 },
      lowerSecondLine: { x: 550, y: 1480 },
    },
    fadeInMs: 500,
    fadeOutMs: 500,
  },
};

export const DefaultSubtitlesPresets: SubtitlesPreset[] = [
  DefaultSubtitlesPreset3,
  DefaultSubtitlesPreset2,
  DefaultSubtitlesPreset4,
  DefaultSubtitlesPreset5,
];
