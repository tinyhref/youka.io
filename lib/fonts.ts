import os from "os";
import { join } from "path";
import * as fontkit from "fontkit";
import getSystemFonts from "get-system-fonts";
import { FONTS_PATH } from "./path";
import { got } from "got";
import { exists } from "./utils";
import fs from "fs";
import rollbar from "./rollbar";

interface FontInfo {
  name: string;
  path: string;
  url: string;
  lang?: string;
}

export let SystemFonts: FontInfo[] = [];
export let SpecialFonts: FontInfo[] = [];

export async function initFonts() {
  SystemFonts = await initSystemFonts();
  try {
    SpecialFonts = await initSpecialFonts();
  } catch {
    console.error("Failed to load special fonts");
  }
}

export async function getFonts() {
  if (SystemFonts.length > 0) {
    return SystemFonts;
  }

  SystemFonts = await initSystemFonts();
  return SystemFonts;
}

export async function getSpecialFont(lang: string) {
  const fonts = await getSpecialFonts();
  return fonts.find((font) => font.lang === lang);
}

export async function getSpecialFonts() {
  if (SpecialFonts.length > 0) {
    return SpecialFonts;
  }

  try {
    SpecialFonts = await initSpecialFonts();
    return SpecialFonts;
  } catch (e) {
    console.error("Failed to load special fonts", e);
    return [];
  }
}

async function initSystemFonts(): Promise<FontInfo[]> {
  const isWindows = os.platform() === "win32";

  const additionalFolders: string[] = [];
  if (isWindows) {
    const homeDir = os.homedir();
    const fontsDir = join(
      homeDir,
      "AppData",
      "Local",
      "Microsoft",
      "Windows",
      "Fonts"
    );
    additionalFolders.push(fontsDir);
  }
  const list = await getSystemFonts({
    additionalFolders,
  });

  const fonts: FontInfo[] = [];

  for (const fontFile of list) {
    try {
      const currentFonts = await getFontInfo(fontFile);
      fonts.push(...currentFonts);
    } catch (e) {
      // console.error("Failed to load font", fontFile, e);
    }
  }

  if (!fonts.length) {
    rollbar.warning("No system fonts found");
  }

  const sortedFonts = fonts.sort((a, b) => a.name.localeCompare(b.name));
  return sortedFonts;
}

export async function initSpecialFonts(): Promise<FontInfo[]> {
  const SPECIAL_FONTS: FontInfo[] = [
    {
      name: "Noto Sans KR",
      lang: "ko",
      url: "https://static.youka.club/fonts/ko.otf",
      path: join(FONTS_PATH, "ko.otf"),
    },
    {
      name: "Noto Sans JP",
      lang: "ja",
      url: "https://static.youka.club/fonts/ja.otf",
      path: join(FONTS_PATH, "ja.otf"),
    },
    {
      name: "Noto Sans SC",
      lang: "zh",
      url: "https://static.youka.club/fonts/zh.otf",
      path: join(FONTS_PATH, "zh.otf"),
    },
    {
      name: "Noto Sans Arabic UI",
      lang: "ar",
      url: "https://static.youka.club/fonts/ar.ttf",
      path: join(FONTS_PATH, "ar.ttf"),
    },
    {
      name: "Sukhumvit Set",
      lang: "th",
      url: "https://static.youka.club/fonts/th.ttf",
      path: join(FONTS_PATH, "th.ttf"),
    },
    {
      name: "Noto Sans",
      lang: "hi",
      url: "https://static.youka.club/fonts/hi.ttf",
      path: join(FONTS_PATH, "hi.ttf"),
    },
  ];

  const promises = SPECIAL_FONTS.map(installFont);
  const results = await Promise.allSettled(promises);

  const fonts: FontInfo[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      fonts.push(...result.value);
    }
  }
  return fonts;
}

async function installFont(fontInfo: FontInfo): Promise<FontInfo[]> {
  if (await exists(fontInfo.path))
    return getFontInfo(fontInfo.path, fontInfo.lang);

  const font = await got({
    url: fontInfo.url,
  }).buffer();
  await fs.promises.writeFile(fontInfo.path, font);
  return getFontInfo(fontInfo.path, fontInfo.lang);
}

async function getFontInfo(
  fontPath: string,
  lang?: string
): Promise<FontInfo[]> {
  const fonts: FontInfo[] = [];
  const font = await fontkit.open(fontPath);

  if (font.type === "TTF" || font.type === "WOFF" || font.type === "WOFF2") {
    if (font.fullName.startsWith(".")) return [];
    fonts.push({
      name: font.fullName,
      path: fontPath,
      url: `file://${fontPath}`,
      lang,
    });
  } else if (font.type === "TTC" || font.type === "DFont") {
    font.fonts.forEach((f) => {
      if (f.fullName.startsWith(".")) return;
      fonts.push({
        name: f.fullName,
        path: fontPath,
        url: `file://${fontPath}`,
        lang,
      });
    });
  }

  return fonts;
}
