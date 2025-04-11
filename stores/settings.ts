import getMAC from "getmac";
import { app } from "@electron/remote";
import os from "os";
import { createWithEqualityFn as create } from "zustand/traditional";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { defaultLang } from "@/i18n";
import {
  IStyleOptions,
  Role,
  FFmpegOptions,
  SubtitlesPreset,
  StyleMapping,
} from "@/types";
import path from "path";
import {
  AlignmentMaxCharPluginOptions,
  DefaultAlignmentMaxCharPluginOptions,
  AlignmentAutoBreakPluginOptions,
  DefaultAlignmentAutoBreakPluginOptions,
} from "@/lib/alignment";
import { getUserRootDir } from "@/lib/utils";
import {
  AspectRatio16x9,
  DEFAULT_BACKGROUND_IMAGE_URL,
  DefaultAssTitlePluginOptionsHorizontal,
  DefaultAssTitlePluginOptionsVertical,
  DefaultAudioSourceAudio,
  DefaultFFmpegOptions,
  DefaultStyleMapping,
  DefaultStyleOptions1,
  DefaultStyles,
  DefaultSubtitlesPreset3,
  DefaultSubtitlesPresets,
  DefaultThumbnailSource,
  DefaultVideoResolution,
  DefaultVideoSource,
} from "@/consts";
import { AudioSource, ThumbnailSource, VideoSource } from "@/schemas";

export type SortBy =
  | "date-asc"
  | "date-desc"
  | "title-asc"
  | "title-desc"
  | "artist-asc"
  | "artist-desc";

export interface IDualScreenBounds {
  x: number | undefined;
  y: number | undefined;
  width: number;
  height: number;
}

export interface IPluginOptions {
  enabled: boolean;
}

export interface ISettingsState {
  eula: boolean;
  signedUp: boolean;
  lang: string;
  styles: IStyleOptions[];
  rootPath: string;
  exportPath: string;
  libraryPath: string;
  alignModel: string;
  splitModel: string;
  minPxPerSecLine: number;
  minPxPerSecWord: number;
  maxVideoHeight: number;
  ffmpegOptions: FFmpegOptions;
  youtubeEnabled: boolean;
  sort: SortBy;
  emails: string[];
  hideAlertSync: boolean;
  hideAlertReview: boolean;
  dualScreenBounds: IDualScreenBounds;
  alignmentMaxCharPlugin: AlignmentMaxCharPluginOptions;
  alignmentAutoBreakPlugin: AlignmentAutoBreakPluginOptions;
  migrateSubtitles3: boolean;
  defaultBackgroundImage: string;
  styleMappings: StyleMapping[];
  defaultVideoSource: VideoSource;
  tempoStep: number;
  pitchStep: number;
  defaultAudioSource: AudioSource;
  defaultThumbnailSource: ThumbnailSource;
  welcomeShown: boolean;
  showQuickStart: boolean;
  subtitlesPresets: SubtitlesPreset[];
  defaultSubtitlePresetId: string;
  defaultStyleMappingId: string;
  migrateIndex2: boolean;
  init: () => void;
  setLang: (lang: string) => void;
  setAcceptEula: () => void;
  setSignedUp: () => void;
  setStyle: (style: IStyleOptions) => void;
  setStyles: (styles: IStyleOptions[]) => void;
  setRootPath: (rootPath: string) => void;
  setExportPath: (exportPath: string) => void;
  setLibraryPath: (libraryPath: string) => void;
  setAlignModel: (model: string) => void;
  setMinPxPerSecLine: (minPxPerSecLine: number) => void;
  setMinPxPerSecWord: (minPxPerSecWord: number) => void;
  setMaxVideoHeight: (maxVideoHeight: number) => void;
  setFFmpegOptions: (ffmpegOptions: FFmpegOptions) => void;
  setYoutubeEnabled: (youtubeEnabled: boolean) => void;
  deleteStyle: (styleName: string) => void;
  setSort: (sort: SortBy) => void;
  checkAbuse: (email: string, role?: Role) => IAbuse;
  setSplitModel: (model: string) => void;
  setHideAlertSync: (hide: boolean) => void;
  setHideAlertReview: (hide: boolean) => void;
  setDualScreenBounds: (bounds: IDualScreenBounds) => void;
  setDefaultBackgroundImage: (imageURL: string) => void;
  setDefaultVideoSource: (videoSource: VideoSource) => void;
  setTempoStep: (tempoStep: number) => void;
  setPitchStep: (pitchStep: number) => void;
  setDefaultAudioSource: (audioSource: AudioSource) => void;
  setDefaultThumbnailSource: (thumbnailSource: ThumbnailSource) => void;
  setWelcomeShown: (welcomeShown: boolean) => void;
  setShowQuickStart: (showQuickStart: boolean) => void;
  getDefaultSubtitlesPreset: () => SubtitlesPreset;
  setSubtitlesPreset: (subtitlesPreset: SubtitlesPreset) => void;
  deleteSubtitlesPreset: (subtitlesPresetId: string) => void;
  setDefaultSubtitlePresetId: (subtitlesPresetId: string) => void;
  setDefaultStyleMappingId: (styleMappingId: string) => void;
  deleteStyleMapping: (styleMappingId: string) => void;
  setStyleMapping: (styleMapping: StyleMapping) => void;
  setMigrateIndex2: (migrateIndex2: boolean) => void;
}

export let DefaultExportPath = "";
export let DefaultLibraryPath = "";
export let DefaultRootPath = "";

try {
  DefaultRootPath = path.join(app.getPath("userData"), "youka", "data");
  DefaultExportPath = path.join(app.getPath("downloads"), "Youka");
  DefaultLibraryPath = path.join(app.getPath("music"), "Youka");
} catch (e) {
  const userDataDir = getUserRootDir();
  DefaultRootPath = path.join(userDataDir, "youka", "data");
  DefaultExportPath = path.join(os.homedir(), "Downloads", "Youka");
  DefaultLibraryPath = path.join(os.homedir(), "Music", "Youka");
}

export const DefaultMaxVideoHeight = 1080;

export type ABUSE_REASON = "mac_blocked" | "virtual_machine" | "many_emails";
export interface IAbuse {
  abused: boolean;
  reason?: ABUSE_REASON;
}
let mac: string | undefined;
const BLOCKED_MAC_ADDRESSES: string[] = [];

export const MAC_ADDRESS_PREFIXES = [
  // virtualbox
  "08:00:27",
  "0a:00:27",
  // vmware
  "00:50:56",
  "00:0c:29",
  "00:05:69",
  // microsoft hyper-v
  "00:15:5d",
  // kvm/qemu
  // "52:54:00",
  // parallels
  // "00:1c:42",
  // xen
  // "00:16:3e",
];

export const useSettingsStore = create(
  persist(
    immer<ISettingsState>((set, get) => ({
      eula: false,
      signedUp: false,
      lang: defaultLang(),
      style: DefaultStyleOptions1,
      rootPath: DefaultRootPath,
      exportPath: DefaultExportPath,
      libraryPath: DefaultLibraryPath,
      alignModel: "auto",
      splitModel: "auto",
      minPxPerSecLine: 200,
      minPxPerSecWord: 200,
      maxVideoHeight: 1080,
      ffmpegOptions: DefaultFFmpegOptions,
      youtubeEnabled: false,
      hideAlertSync: false,
      hideAlertReview: false,
      styles: DefaultStyles,
      sort: "date-desc",
      emails: [],
      alignmentMaxCharPlugin: DefaultAlignmentMaxCharPluginOptions,
      alignmentAutoBreakPlugin: DefaultAlignmentAutoBreakPluginOptions,
      dualScreenBounds: {
        x: undefined,
        y: undefined,
        width: 568,
        height: 350,
      },
      migrateSubtitles3: true,
      defaultBackgroundImage: DEFAULT_BACKGROUND_IMAGE_URL,
      styleMapping: DefaultStyleMapping,
      pitchStep: 1,
      tempoStep: 0.01,
      defaultVideoSource: DefaultVideoSource,
      defaultAudioSource: DefaultAudioSourceAudio,
      defaultThumbnailSource: DefaultThumbnailSource,
      welcomeShown: false,
      showQuickStart: true,
      subtitlesPresets: DefaultSubtitlesPresets,
      defaultSubtitlePresetId: DefaultSubtitlesPreset3.id,
      styleMappings: [DefaultStyleMapping],
      defaultStyleMappingId: DefaultStyleMapping.id,
      migrateIndex2: true,

      setMigrateIndex2(migrateIndex2: boolean) {
        set((state) => {
          state.migrateIndex2 = migrateIndex2;
        });
      },

      setDefaultStyleMappingId(styleMappingId: string) {
        set((state) => {
          state.defaultStyleMappingId = styleMappingId;
        });
      },

      deleteStyleMapping(styleMappingId: string) {
        set((state) => {
          state.styleMappings = state.styleMappings.filter(
            (s) => s.id !== styleMappingId
          );
        });
      },

      setStyleMapping(styleMapping: StyleMapping) {
        set((state) => {
          const index = state.styleMappings.findIndex(
            (s) => s.id === styleMapping.id
          );
          if (index === -1) {
            state.styleMappings.push(styleMapping);
          } else {
            state.styleMappings[index] = styleMapping;
          }
        });
      },

      setSubtitlesPreset(subtitlesPreset: SubtitlesPreset) {
        const subtitlesPresets = get().subtitlesPresets;
        const existingPresetIndex = subtitlesPresets.findIndex(
          (p) => p.id === subtitlesPreset.id
        );
        if (existingPresetIndex !== -1) {
          set((state) => {
            state.subtitlesPresets[existingPresetIndex] = subtitlesPreset;
          });
        } else {
          set((state) => {
            state.subtitlesPresets.push(subtitlesPreset);
          });
        }
      },

      deleteSubtitlesPreset(subtitlesPresetId: string) {
        set((state) => {
          state.subtitlesPresets = state.subtitlesPresets.filter(
            (p) => p.id !== subtitlesPresetId
          );
        });
      },

      setDefaultSubtitlePresetId(subtitlesPresetId: string) {
        set((state) => {
          state.defaultSubtitlePresetId = subtitlesPresetId;
        });
      },

      getDefaultSubtitlesPreset() {
        const defaultSubtitlePresetId = get().defaultSubtitlePresetId;
        const subtitlesPresets = get().subtitlesPresets;
        let subtitlesPreset = subtitlesPresets.find(
          (s) => s.id === defaultSubtitlePresetId
        );
        if (!subtitlesPreset) {
          subtitlesPreset = DefaultSubtitlesPreset3;
        }
        return subtitlesPreset;
      },

      setShowQuickStart(showQuickStart: boolean) {
        set((state) => {
          state.showQuickStart = showQuickStart;
        });
      },

      setWelcomeShown(welcomeShown: boolean) {
        set((state) => {
          state.welcomeShown = welcomeShown;
        });
      },

      setDefaultThumbnailSource(thumbnailSource: ThumbnailSource) {
        set((state) => {
          state.defaultThumbnailSource = thumbnailSource;
        });
      },

      setDefaultAudioSource(audioSource: AudioSource) {
        set((state) => {
          state.defaultAudioSource = audioSource;
        });
      },

      setDefaultVideoSource(videoSource: VideoSource) {
        set((state) => {
          state.defaultVideoSource = videoSource;
        });
      },

      setTempoStep(tempoStep: number) {
        set((state) => {
          state.tempoStep = tempoStep;
        });
      },

      setPitchStep(pitchStep: number) {
        set((state) => {
          state.pitchStep = pitchStep;
        });
      },

      setDefaultBackgroundImage(imageURL: string) {
        set((state) => {
          state.defaultBackgroundImage = imageURL;
        });
      },

      setAlignmentAutoBreakPlugin(plugin: AlignmentAutoBreakPluginOptions) {
        set((state) => {
          state.alignmentAutoBreakPlugin = plugin;
        });
      },

      setDualScreenBounds(bounds: IDualScreenBounds) {
        set((state) => {
          state.dualScreenBounds = bounds;
        });
      },

      checkAbuse(email: string, role?: Role): IAbuse {
        if (!mac) {
          try {
            mac = getMAC();
            console.log("macaddress", mac);
          } catch {}
        }
        if (mac) {
          mac = mac.toLowerCase();
        }

        const noPlan = role === "trial";

        // const isPrefixBlocked = MAC_ADDRESS_PREFIXES.some((prefix) =>
        //   mac?.startsWith(prefix)
        // );
        // if (isPrefixBlocked && noPlan) {
        //   return { abused: true, reason: "virtual_machine" };
        // }

        const isMacBlocked = mac && BLOCKED_MAC_ADDRESSES.includes(mac);
        if (isMacBlocked) {
          return { abused: true, reason: "mac_blocked" };
        }

        const emails = get().emails;
        if (!emails.includes(email)) {
          set((state) => {
            state.emails.push(email);
          });
        }
        const isManyEmails = get().emails.length > 1;
        if (isManyEmails && noPlan) {
          return { abused: true, reason: "many_emails" };
        }

        return { abused: false };
      },

      setHideAlertReview(hide: boolean) {
        set((state) => {
          state.hideAlertReview = hide;
        });
      },

      setHideAlertSync(hide: boolean) {
        set((state) => {
          state.hideAlertSync = hide;
        });
      },

      setSort(sort: SortBy) {
        set((state) => {
          state.sort = sort;
        });
      },

      init() {
        const splitModel = get().splitModel;
        if (!splitModel) {
          get().setSplitModel("auto");
        }

        const migrateSubtitles3 = get().migrateSubtitles3;
        get().styles.forEach((style) => {
          if (style.activeColour === undefined) {
            get().setStyle({
              ...style,
              activeColour: "#fff09a",
            });
          }

          if (style.activeOutlineColor === undefined) {
            get().setStyle({
              ...style,
              activeOutlineColor: "#000000",
            });
          }

          if (migrateSubtitles3 && style.fontsize !== 96) {
            const mul = 3;
            get().setStyle({
              ...style,
              fontsize: style.fontsize * mul,
              outline: style.outline * mul,
              marginV: style.marginV * mul,
              shadow: style.shadow * mul,
              spacing: style.spacing * mul,
            });
          }
        });
        set((state) => {
          state.migrateSubtitles3 = false;
        });

        const alignModel = get().alignModel;
        switch (alignModel) {
          case "default-2":
            get().setAlignModel("wav2vec2");
            break;
          case "default":
            get().setAlignModel("whisper");
            break;
          case "audioshake":
            get().setAlignModel("audioshake-alignment");
            break;
        }

        get().deleteStyle("youka:title");

        get().subtitlesPresets.forEach((preset) => {
          const p = preset.assPlugins.find((p) => p.id === "title");
          if (p && p.id === "title" && p.artistStyle === undefined) {
            get().setSubtitlesPreset({
              ...preset,
              assPlugins: preset.assPlugins.map((p) => {
                if (p.id === "title") {
                  const isVertical =
                    preset.baseResolution.height > preset.baseResolution.width;
                  const defaultStyle = isVertical
                    ? DefaultAssTitlePluginOptionsVertical
                    : DefaultAssTitlePluginOptionsHorizontal;
                  return {
                    ...p,
                    style: defaultStyle.style,
                    artistStyle: defaultStyle.artistStyle,
                  };
                }
                return p;
              }),
            });
          }
        });

        const defaultVideoSource = get().defaultVideoSource;
        if (
          defaultVideoSource.type === "color" &&
          defaultVideoSource.resolution === undefined
        ) {
          set((state) => {
            // @ts-ignore
            state.defaultVideoSource.resolution = DefaultVideoResolution;
          });
        } else if (
          (defaultVideoSource.type === "video" ||
            defaultVideoSource.type === "image") &&
          defaultVideoSource.aspectRatio === undefined
        ) {
          set((state) => {
            // @ts-ignore
            state.defaultVideoSource.aspectRatio = AspectRatio16x9;
          });
        }
      },

      setSplitModel(model: string) {
        set((state) => {
          state.splitModel = model;
        });
      },

      setYoutubeEnabled(youtubeEnabled: boolean) {
        set((state) => {
          state.youtubeEnabled = youtubeEnabled;
        });
      },

      setFFmpegOptions(ffmpegOptions: FFmpegOptions) {
        set((state) => {
          state.ffmpegOptions = ffmpegOptions;
        });
      },

      setMaxVideoHeight(maxVideoHeight: number) {
        set((state) => {
          state.maxVideoHeight = maxVideoHeight;
        });
      },

      setMinPxPerSecLine(minPxPerSecLine: number) {
        set((state) => {
          state.minPxPerSecLine = minPxPerSecLine;
        });
      },

      setMinPxPerSecWord(minPxPerSecWord: number) {
        set((state) => {
          state.minPxPerSecWord = minPxPerSecWord;
        });
      },

      setAlignModel(model: string) {
        set((state) => {
          state.alignModel = model;
        });
      },

      setAcceptEula() {
        set((state) => {
          state.eula = true;
        });
      },

      setSignedUp() {
        set((state) => {
          state.signedUp = true;
        });
      },

      setLang(lang: string) {
        set((state) => {
          state.lang = lang;
        });
      },

      deleteStyle(styleName: string) {
        set((state) => {
          state.styles = state.styles.filter(
            (style) => style.name !== styleName
          );
        });
      },

      setStyles(styles: IStyleOptions[]) {
        set((state) => {
          state.styles = styles;
        });
      },

      setStyle(style: IStyleOptions) {
        set((state) => {
          const index = state.styles.findIndex((s) => s.name === style.name);
          if (index === -1) {
            state.styles.push({ ...style });
            return;
          } else {
            state.styles[index] = style;
          }
        });
      },

      setRootPath(rootPath: string) {
        set((state) => {
          state.rootPath = rootPath;
        });
      },

      setExportPath(exportPath: string) {
        set((state) => {
          state.exportPath = exportPath;
        });
      },

      setLibraryPath(libraryPath: string) {
        set((state) => {
          state.libraryPath = libraryPath;
        });
      },
    })),
    {
      name: "settings",
    }
  )
);
