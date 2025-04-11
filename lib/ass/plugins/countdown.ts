import { IStyleOptions } from "@/types/style";
import { Ass, Dialogue } from "../ass";
import { AssPlugin } from "../types";
import { getPrevEvent } from "../utils";
import { AssPluginOptionsBase } from "./types";

export const AssCountdownPluginId = "countdown";

export interface AssCountdownPluginOptions extends AssPluginOptionsBase {
  id: "countdown";
  autoColor: boolean;
  style: IStyleOptions;
  gap: number;
  counter: number;
}

export interface AssCountdownPluginRuntime {
  styleOptionsMapping: Record<number, IStyleOptions>;
}

export class AssCountdownPlugin implements AssPlugin {
  id = AssCountdownPluginId;
  settings: AssCountdownPluginOptions;
  runtime: AssCountdownPluginRuntime;

  constructor(
    settings: AssCountdownPluginOptions,
    runtime: AssCountdownPluginRuntime
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
          name: `youka:countdown:${singer}`,
        };

        if (this.settings.autoColor) {
          style.primaryColour = runtimeStyle.primaryColour;
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

      let start = currWordStart - this.settings.counter;
      if (start < 0) {
        continue;
      }

      if (prevEvent && start < prevLineEnd) {
        continue;
      }

      if (prevEvent) {
        const prevEventGap = event.start - prevEvent.end;
        if (prevEventGap < this.settings.gap) {
          continue;
        }
      }

      const hasOverlapping = ass.events.events.some(
        (e) => e.plugins.includes(this.id) && e.start === start
      );

      if (hasOverlapping) {
        continue;
      }

      let styleName = styles[currAlignment.singer ?? 0]?.name;
      if (!styleName) {
        styleName = styles[0].name;
      }

      const fadeInMsEffect = 300;
      const fadeOutMsEffect = 300;
      for (let i = this.settings.counter; i > 0; i--) {
        const text = `{\\fad(${fadeInMsEffect},${fadeOutMsEffect})}${i}`;
        const newStart = currWordStart - i;
        const end = newStart + 1;
        const dialogue = new Dialogue({
          plugin: this.id,
          style: styleName,
          start: newStart,
          end,
          text,
          layer: 2,
        });

        ass.events.events.splice(eventIdx, 0, dialogue);
        eventIdx++;
      }
    }
  }
}
