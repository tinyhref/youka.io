import fs from "fs";
import path, { join } from "path";
import os from "os";
import process from "process";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Alignment2,
  ISongStem,
  ISongVideo,
  IStyleOptions,
  ProgressFunc,
  Role,
  SingerToStyleOptionsMapping,
  Song,
  StyleMapping,
  SubscriptionObject,
} from "@/types";
import { shell } from "electron";
import { ISettingsState } from "@/stores/settings";
import * as report from "@/lib/report";
import { t } from "i18next";
import { safeFileUrl } from "./library";
import rollbar from "./rollbar";

export async function exists(filepath: string) {
  try {
    await fs.promises.stat(filepath);
    return true;
  } catch (e) {
    return false;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSettings(): ISettingsState | undefined {
  const s = localStorage.getItem("settings");
  if (!s) return;
  const obj = JSON.parse(s);
  return obj.state;
}

interface GotoPricingOptions {
  medium?: string;
  provider?: "lemon" | "freekassa";
  lang?: string;
}
export function gotoPricing({ lang, provider }: GotoPricingOptions) {
  if (!lang) {
    lang = "en";
  }

  let prefix;
  if (lang === "en") {
    prefix = "https://www.youka.io";
  } else {
    prefix = `https://www.youka.io/${lang}`;
  }

  let url;
  if (provider === "freekassa") {
    url = `${prefix}/top-up-credits/`;
  } else {
    url = `${prefix}/pricing/`;
  }

  // if (medium) {
  //   url += `?utm_medium=${medium}`;
  // }

  shell.openExternal(url);
}

export async function gotoCustomerPortal(subscription: SubscriptionObject) {
  const url = subscription.attributes.urls.customer_portal;
  shell.openExternal(url);
}

export function gotoDownload(medium?: string) {
  let lang;
  try {
    const settings = getSettings();
    lang = settings?.lang || "en";
  } catch (e) {
    report.error(e as any);
    lang = "en";
  }

  let url = `https://www.youka.io/${lang}/download?utm_source=youka_desktop`;
  if (medium) {
    url += `&utm_medium=${medium}`;
  }
  shell.openExternal(url);
}

export function sortAlignments(alignments: Alignment2[]) {
  const order = [
    "audioshake-transcription",
    "audioshake-alignment",
    "wav2vec2-en",
    "wav2vec2-es",
    "wav2vec2-it",
    "wav2vec2-fr",
    "wav2vec2-pt",
    "wav2vec2",
    "whisper",
  ];

  alignments.sort((a, b) => {
    let indexA = order.indexOf(a.modelId);
    let indexB = order.indexOf(b.modelId);

    if (indexA === -1) indexA = order.length;
    if (indexB === -1) indexB = order.length;

    return indexA - indexB;
  });

  return alignments;
}

export function splitStringToChunks(str: string, maxLength: number): string[] {
  const result = [];
  let startIndex = 0;

  while (startIndex < str.length) {
    const chunk = str.substring(startIndex, startIndex + maxLength);
    result.push(chunk);
    startIndex += maxLength;
  }

  return result;
}

export function stem2Label(stem: ISongStem) {
  if (stem.title) return stem.title;

  switch (stem.type) {
    case "vocals":
      return t("Vocals");
    case "instruments":
      return t("Instrumental");
    case "original":
      return t("Original");
    default:
      return `${t("Custom")} (${formatId(stem.groupId || stem.id)})`;
  }
}

export function formatDate(s: string) {
  let [date, time] = s.split("T");
  time = time.split(".")[0];
  return `${date} ${time}`;
}

export function formatId(id: string) {
  return id.slice(0, 4);
}

export function videoTitle(video: ISongVideo) {
  switch (video.type) {
    case "original":
      return t("Original");
    default:
      return `${t("Custom")} (${formatId(video.groupId || video.id)})`;
  }
}

export function isValidAudioId(id: string | null) {
  if (!id) return false;

  if (id.startsWith("file-") && id.length === 37) {
    return true;
  }

  if (id.length !== 11) {
    return false;
  }

  var regex = /^[a-zA-Z0-9-_]{11}$/;
  return regex.test(id);
}

export class ProgressAggregator {
  private progressFuncs: ProgressFunc[] = [];
  private progressValues: number[] = [];
  private onProgress: ProgressFunc;

  constructor(onProgress: ProgressFunc) {
    this.onProgress = onProgress;
  }

  // Request a new ProgressFunc for a child and return it
  getNewProgressFunc(): ProgressFunc {
    const index = this.progressFuncs.length;
    this.progressValues.push(0); // Initialize progress for the new child

    const progressFunc: ProgressFunc = (progress: number) => {
      this.progressValues[index] = progress;
      this.emitCombinedProgress();
    };

    this.progressFuncs.push(progressFunc);
    return progressFunc;
  }

  private emitCombinedProgress() {
    // Calculate total progress proportionally to the number of reporters
    const totalProgress =
      this.progressValues.reduce((sum, value) => sum + value, 0) /
      this.progressFuncs.length;
    this.onProgress(Math.floor(totalProgress)); // Emit the combined progress
  }
}

export function getNewPath(id: string, libraryPath: string, filepath: string) {
  if (filepath.startsWith("http")) return filepath;
  if (filepath.startsWith("file://")) {
    filepath = filepath.replace("file://", "");
  }

  const base = getFileNameFromPath(filepath);
  const newPath = join(libraryPath, id, base);

  return newPath;
}

export async function getNewPathSafe(
  id: string,
  libraryPath: string,
  filepath: string
) {
  const newFilepath = getNewPath(id, libraryPath, filepath);

  if (await exists(newFilepath)) {
    return newFilepath;
  } else {
    rollbar.warning("new path does not exist", {
      id,
      libraryPath,
      filepath,
      newFilepath,
    });
    return;
  }
}

function getFileNameFromPath(filePath: string) {
  return filePath.replace(/^.*[\\/]/, "");
}

export async function getNewUrlPathSafe(
  id: string,
  libraryPath: string,
  filepath: string
) {
  const newFilepath = await getNewPathSafe(id, libraryPath, filepath);
  if (!newFilepath) return;
  return safeFileUrl(newFilepath);
}

export function getUserRootDir() {
  const platform = os.platform();
  const homeDir = os.homedir();

  let userDataDir;

  switch (platform) {
    case "win32": // Windows
      userDataDir =
        process.env.APPDATA || path.join(homeDir, "AppData", "Local");
      break;
    case "darwin": // macOS
      userDataDir = path.join(homeDir, "Library", "Application Support");
      break;
    case "linux": // Linux
    default:
      userDataDir = process.env.XDG_CONFIG_HOME || homeDir;
      break;
  }

  return userDataDir;
}

export function isOKRole(roles: Role[], role?: Role) {
  if (!role) return false;

  return roles.includes(role);
}

export function isActiveRole(role?: Role) {
  if (!role) return false;
  const ActiveRoles = [
    "trial",
    "basic",
    "standard",
    "pro",
    "payperuse",
    "credits",
  ];

  return ActiveRoles.includes(role);
}

export function getStyleMappingOptionsFromStyleMapping(
  styleMapping: StyleMapping,
  styles: IStyleOptions[]
) {
  const styleOptionsMapping: SingerToStyleOptionsMapping = {};
  for (const [singer, styleName] of Object.entries(styleMapping.mapping)) {
    const style = styles.find((s) => s.name === styleName);
    if (style) {
      styleOptionsMapping[Number(singer)] = style;
    }
  }
  return styleOptionsMapping;
}

export function formatSongTitle(song: Song): string {
  if (song.songTitle) {
    let title = song.songTitle;
    if (song.artists && song.artists.length > 0) {
      title += " • " + song.artists.join(" • ");
    }
    return title;
  }
  return song.title;
}

export function keyFromIndex(index: number): string {
  const keys = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
  ];

  if (index >= 0 && index <= 11) {
    return keys[index]; // Major keys
  } else if (index >= 12 && index <= 23) {
    return keys[index - 12] + "m"; // Minor keys
  } else {
    return "Invalid index";
  }
}

export function transposeKey(index: number, shift: number): string {
  const keys = [
    "A",
    "A#",
    "B",
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
  ];

  // Ensure the shift stays within the valid key range (0-23)
  let newIndex = (index + shift) % 24;
  if (newIndex < 0) newIndex += 24; // Wrap around for negative shifts

  // Determine if it's major or minor
  if (newIndex <= 11) {
    return keys[newIndex]; // Major keys
  } else {
    return keys[newIndex - 12] + "m"; // Minor keys
  }
}

export function getNewBPM(baselineBPM: number, tempo: number): number {
  return baselineBPM * tempo;
}
