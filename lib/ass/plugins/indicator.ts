import { Ass, Dialogue } from "../ass";
import { IStyleOptions } from "@/types/style";
import { AssPlugin } from "../types";
import { getPrevEvent, getStyleOptions } from "../utils";
import { AssPluginOptionsBase } from "./types";

export const AssIndicatorPluginId = "indicator";

export interface AssIndicatorPluginOptions extends AssPluginOptionsBase {
  id: "indicator";
  gap: number;
  duration: number;
  autoColor: boolean;
  autoSize: boolean;
  style: IStyleOptions;
  text: string;
  startPx: number;
  endPx: number;
}

export interface AssIndicatorPluginRuntime {
  rtl?: boolean;
  styleOptionsMapping: Record<number, IStyleOptions>;
}

export class AssIndicatorPlugin implements AssPlugin {
  id = AssIndicatorPluginId;
  settings: AssIndicatorPluginOptions;
  runtime: AssIndicatorPluginRuntime;

  constructor(
    settings: AssIndicatorPluginOptions,
    runtime: AssIndicatorPluginRuntime
  ) {
    this.settings = settings;
    this.runtime = runtime;
  }

  apply(ass: Ass) {
    if (!this.settings.enabled) return;

    const styles: Record<number, IStyleOptions> = {};

    Object.entries(this.runtime.styleOptionsMapping).forEach(
      ([singer, runtimeStyle]) => {
        let style = {
          ...this.settings.style,
          name: `youka:indicator:${singer}`,
        };

        if (this.settings.autoColor) {
          style.primaryColour = runtimeStyle.primaryColour;
          style.outlineColour = runtimeStyle.outlineColour;
        }

        if (this.settings.autoSize) {
          style.fontsize = runtimeStyle.fontsize;
        }

        styles[Number(singer)] = style;
        ass.styles.add(style);
      }
    );

    for (let eventIdx = 0; eventIdx < ass.events.events.length; eventIdx++) {
      let event = ass.events.events[eventIdx];

      if (!event.plugins.includes("karaoke") || !event.alignment) {
        continue;
      }

      const prevEvent = getPrevEvent(ass, eventIdx, ["karaoke"]);
      if (prevEvent) {
        if (prevEvent.alignment) {
          const prevLineEnd =
            prevEvent.alignment.words[prevEvent.alignment.words.length - 1].end;
          const prevEventGap = event.alignment.words[0].start - prevLineEnd;
          if (prevEventGap < this.settings.gap) {
            continue;
          }
        } else {
          const prevEventGap = event.start - prevEvent.end;
          if (prevEventGap < this.settings.gap) {
            continue;
          }
        }
      }

      const currAlignment = event.alignment;
      if (!currAlignment) {
        continue;
      }

      const regex = new RegExp(`\\pos\\(([0-9\\.]+),([0-9\\.]+)\\)`, "g");
      const match = regex.exec(event.getText());
      if (!match) {
        continue;
      }
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);

      const firstWordStart = event.alignment.words[0].start;
      let start = firstWordStart - this.settings.duration;
      if (start < 0) {
        continue;
      }

      if (prevEvent?.alignment && start < prevEvent.alignment.end) {
        start = prevEvent.alignment.end;
      }

      const end = firstWordStart;

      const yStart = y;
      const yEnd = y;

      let xStart, xEnd, text;
      if (this.runtime.rtl) {
        xStart = x - this.settings.startPx;
        xEnd = x + Math.abs(this.settings.endPx);
        text = `{\\move(${xStart},${yStart},${xEnd},${yEnd})}ו{\\alpha&HFF&}${event.alignment.text}`;
      } else {
        xStart = x + this.settings.startPx;
        xEnd = x + this.settings.endPx;
        text = `{\\move(${xStart},${yStart},${xEnd},${yEnd})}${this.settings.text}{\\alpha&HFF&}${event.alignment.text}`;
      }

      const style = getStyleOptions(styles, currAlignment.singer);

      const dialogue = new Dialogue({
        plugin: this.id,
        style: style.name,
        start,
        end,
        text,
        layer: 1,
      });

      // Insert the dialogue before the current event
      ass.events.events.splice(eventIdx, 0, dialogue);

      // Adjust index to skip over the inserted dialogue
      eventIdx++;
    }
  }
}
