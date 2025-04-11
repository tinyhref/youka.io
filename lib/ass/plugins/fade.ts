import { Ass } from "../ass";
import { AssPlugin } from "../types";
import { AssPluginOptionsBase } from "./types";

export const AssFadePluginId = "fade";

export interface AssFadePluginOptions extends AssPluginOptionsBase {
  id: "fade";
  fadein: number;
  fadeout: number;
}

export class AssFadePlugin implements AssPlugin {
  id = AssFadePluginId;
  private enabled: boolean;
  private fadein: number;
  private fadeout: number;

  constructor({ id, enabled, fadein, fadeout }: AssFadePluginOptions) {
    this.enabled = enabled;
    this.fadein = fadein;
    this.fadeout = fadeout;
  }

  apply(ass: Ass) {
    if (!this.enabled) return;

    ass.events.events.forEach((event) => {
      if (!event.plugins.includes("karaoke")) {
        return;
      }

      const fadeInMs = this.fadein;
      const fadeOutMs = this.fadeout;
      const fadeInSec = fadeInMs / 1000 || 0;
      const fadeOutSec = fadeOutMs / 1000 || 0;

      if (event.start - fadeInSec < 0) {
        return this;
      }

      event.start -= fadeInSec;
      event.end += fadeOutSec;

      const fadeInMsEffect = fadeInMs * 0.5 || 0;
      const fadeOutMsEffect = fadeOutMs * 0.5 || 0;

      const k = Math.round(fadeInSec * 10000) / 100;

      event.setText(
        `{\\fad(${fadeInMsEffect},${fadeOutMsEffect})}{\\K${k}}${event.getText()}`,
        this.id
      );
    });
  }
}
