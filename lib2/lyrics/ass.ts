import { EventEmitter } from "events";
import { alignmentToAss } from "@/lib/ass-alignment";
import { ILyricsController, SubtitlesLoadOptions } from "@/types";
import SubtitlesOctopus from "@/lib/subtitles-octopus";
import * as report from "@/lib/report";
import { getFonts, getSpecialFont } from "@/lib/fonts";

export default class LyricsAssController extends EventEmitter
  implements ILyricsController {
  ass?: any;

  stop() {
    if (this.ass) {
      try {
        this.ass.freeTrack();
        this.ass.dispose();
        this.ass = undefined;
      } catch {}
      this.emit("change");
    }
  }

  async init() {}

  async load({ alignment, preset, runtime }: SubtitlesLoadOptions) {
    const ass = alignmentToAss({
      alignment,
      preset,
      runtime,
    });
    if (!ass) return;

    const subContent = ass.toString();
    if (!subContent) {
      report.warn("ass without content", alignment);
      return;
    }

    const fonts: Set<string> = new Set();
    const requiredFonts: Set<string> = new Set();

    ass.styles.styles.forEach((style) => {
      requiredFonts.add(style.options.fontname);
    });

    const systemFonts = await getFonts();
    requiredFonts.forEach((fontName) => {
      const font = systemFonts.find((f) => f.name === fontName);
      if (font) {
        fonts.add(font.url);
      }
    });

    if (runtime.lang) {
      const specialFont = await getSpecialFont(runtime.lang);
      if (specialFont) {
        fonts.add(specialFont.url);
      }
    }

    let video;
    for (let i = 0; i < 100; i++) {
      video = document.querySelector("video");
      if (video?.parentElement) {
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!video) {
      report.warn("ass: no video element");
      return;
    }

    const assOptions = {
      video,
      workerUrl: `${process.env.PUBLIC_URL}/libass/subtitles-octopus-worker.js`,
      subContent,
      fonts: Array.from(fonts),
      targetFps: 60,
      onError: (e: Error) => {
        report.error("ass error", e);
        console.error(e);
      },
    };

    try {
      this.stop();
      // @ts-expect-error
      this.ass = new SubtitlesOctopus(assOptions);
      this.emit("change", alignment);
    } catch (e) {
      console.error(e);
      report.error("failed to load ass", e as any);
    }
  }
}
