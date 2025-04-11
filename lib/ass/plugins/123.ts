import { IStyleOptions, LineAlignment } from "@/types/style";
import { Ass, Dialogue } from "../ass";
import { AssPlugin } from "../types";
import { getPrevEvent, karaokeTag } from "../utils";
import { AssPluginOptionsBase } from "./types";

export const Ass123PluginId = "123";

export interface Ass123PluginOptions extends AssPluginOptionsBase {
  id: "123";
  autoColor: boolean;
  autoAlignment: boolean;
  style: IStyleOptions;
  text: string;
  gap: number;
  duration: number;
}

export interface Ass123PluginRuntime {
  styleOptionsMapping: Record<number, IStyleOptions>;
  rtl?: boolean;
}

export class Ass123Plugin implements AssPlugin {
  id = Ass123PluginId;

  settings: Ass123PluginOptions;
  runtime: Ass123PluginRuntime;

  constructor(settings: Ass123PluginOptions, runtime: Ass123PluginRuntime) {
    this.settings = settings;
    this.runtime = runtime;
  }

  apply(ass: Ass) {
    if (!this.settings.enabled) return;

    const styles: Record<number, IStyleOptions> = {};

    let bottom: boolean = false;

    Object.entries(this.runtime.styleOptionsMapping).forEach(
      ([singer, runtimeStyle]) => {
        let style = {
          ...this.settings.style,
          name: `youka:123:${singer}`,
          fontname: this.settings.style.fontname,
        };

        if (this.settings.autoColor) {
          style.primaryColour = runtimeStyle.primaryColour;
          style.secondaryColour = runtimeStyle.secondaryColour;
        } else {
          style.primaryColour = this.settings.style.primaryColour;
          style.secondaryColour = this.settings.style.secondaryColour;
        }

        if (this.settings.autoAlignment) {
          if (bottom) {
            style.alignment = LineAlignment.BottomCenter;
            bottom = false;
          } else {
            style.alignment = LineAlignment.TopCenter;
          }
          bottom = !bottom;
        } else {
          style.alignment = this.settings.style.alignment;
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

      const prevEvent = getPrevEvent(ass, eventIdx, ["karaoke"]);

      const currAlignment = event.alignment;
      const prevAlignment = prevEvent?.alignment;

      if (!currAlignment) {
        continue;
      }

      const currWordStart = currAlignment?.words[0].start;
      const prevLineEnd =
        prevAlignment?.words[prevAlignment.words.length - 1].end || 0;

      if (!currWordStart) {
        continue;
      }

      let start = currWordStart - this.settings.duration;
      if (start < 0) {
        continue;
      }
      if (prevEvent && start < prevLineEnd) {
        start = prevLineEnd;
      }

      if (prevEvent) {
        const prevEventGap = event.start - prevEvent.end;
        if (prevEventGap < this.settings.gap) {
          continue;
        }
      }
      if (start < 0) {
        continue;
      }

      const style = styles[currAlignment.singer || 0];

      const k = karaokeTag(this.settings.duration, this.runtime.rtl);

      const end = currWordStart;

      let text;
      if (this.runtime.rtl) {
        text = `${k}${this.settings.text.split("").reverse().join("")}`;
      } else {
        text = `${k}${this.settings.text}`;
      }
      const dialogue = new Dialogue({
        plugin: this.id,
        style: style.name,
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
