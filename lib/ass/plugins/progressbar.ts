import { IStyleOptions } from "@/types/style";
import { Ass, Dialogue } from "../ass";
import { AssPlugin } from "../types";
import { decimalToHex, getPrevEvent, karaokeTag } from "../utils";
import { AssPluginOptionsBase } from "./types";

export const AssProgressBarPluginId = "progressbar";

export interface AssProgressBarPluginOptions extends AssPluginOptionsBase {
  id: "progressbar";
  autoColor: boolean;
  style: IStyleOptions;
  x: number;
  y: number;
  minDuration: number;
  maxDuration: number;
  gapStart: number;
  gapEnd: number;
  gapSongStart?: number;
  fadeInMs: number;
  fadeOutMs: number;
}

export interface AssProgressBarPluginRuntime {
  styleOptionsMapping: Record<number, IStyleOptions>;
  rtl?: boolean;
}

export class AssProgressBarPlugin implements AssPlugin {
  id = AssProgressBarPluginId;
  settings: AssProgressBarPluginOptions;
  runtime: AssProgressBarPluginRuntime;

  constructor(
    settings: AssProgressBarPluginOptions,
    runtime: AssProgressBarPluginRuntime
  ) {
    this.settings = settings;
    this.runtime = runtime;
  }

  apply(ass: Ass) {
    if (!this.settings.enabled) return;

    const gapSongStart = this.settings.gapSongStart ?? 5;

    const styles: Record<number, IStyleOptions> = {};

    Object.entries(this.runtime.styleOptionsMapping).forEach(
      ([singer, runtimeStyle]) => {
        let style = {
          ...this.settings.style,
          name: `youka:progressbar:${singer}`,
        };
        if (this.settings.autoColor) {
          style.primaryColour = runtimeStyle.primaryColour;
          style.secondaryColour = runtimeStyle.secondaryColour;
          style.outlineColour = runtimeStyle.outlineColour;
        }
        styles[Number(singer)] = style;
        ass.styles.add(style);
      }
    );

    for (let eventIdx = 0; eventIdx < ass.events.events.length; eventIdx++) {
      let event = ass.events.events[eventIdx];

      if (!event.plugins.includes("karaoke")) {
        continue;
      }

      const prevEvent = getPrevEvent(ass, eventIdx, ["karaoke", "title"]);

      const currAlignment = event.alignment;
      const prevAlignment = prevEvent?.alignment;

      if (!currAlignment) {
        continue;
      }

      const currWordStart = currAlignment?.words[0].start;
      const prevLineEnd =
        prevAlignment?.words[prevAlignment.words.length - 1]?.end ||
        prevEvent?.end ||
        0;

      if (!currWordStart) {
        continue;
      }

      let start =
        currWordStart - this.settings.maxDuration + this.settings.gapStart;

      if (start < 0) {
        start = 0;
      }
      if (prevEvent && start < prevLineEnd) {
        start = prevLineEnd + this.settings.gapStart;
      }

      if (start < gapSongStart) {
        start = gapSongStart;
      }

      let end = currWordStart - this.settings.gapEnd;
      if (end > currWordStart) {
        end = currWordStart - this.settings.gapEnd;
      }

      if (end < start) {
        return;
      }

      let duration = end - start;

      if (duration < this.settings.minDuration) {
        continue;
      }
      if (duration > this.settings.maxDuration) {
        duration = this.settings.maxDuration;
      }

      let styleName = styles[currAlignment.singer ?? 0]?.name;
      if (!styleName) {
        styleName = styles[0].name;
      }

      let fade = "";
      if (this.settings.fadeInMs > 0 || this.settings.fadeOutMs > 0) {
        fade = `{\\fad(${this.settings.fadeInMs},${this.settings.fadeOutMs})}`;
        if (this.settings.fadeOutMs > 0) {
          end += this.settings.fadeOutMs / 1000;
        }
      }

      let alphaTag = "";
      if (this.settings.style.alpha !== undefined) {
        const alphaHex = decimalToHex(this.settings.style.alpha);
        alphaTag = `{\\alpha&H${alphaHex}&}`;
      }

      const k = karaokeTag(duration, this.runtime.rtl);
      const text = `${alphaTag}${fade}${k}{\\p1}m 0 0 l ${this.settings.x} 0 ${this.settings.x} ${this.settings.y} 0 ${this.settings.y}{\\p0}`;

      const dialogue = new Dialogue({
        plugin: this.id,
        style: styleName,
        start,
        end,
        text,
      });

      const hasOverlapping = ass.events.events.some(
        (e) => e.plugins.includes(this.id) && e.start === start && e.end === end
      );

      if (hasOverlapping) {
        continue;
      }

      // Insert the dialogue before the current event
      ass.events.events.splice(eventIdx, 0, dialogue);

      // Adjust index to skip over the inserted dialogue
      eventIdx++;
    }
  }
}
