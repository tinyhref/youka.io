import { Ass } from "../ass";
import { AssPlugin } from "../types";
import { AssPluginOptionsBase } from "./types";

export interface AssOffsetPluginOptions extends AssPluginOptionsBase {
  id: "offset";
  offset: number;
}

export class AssOffsetPlugin implements AssPlugin {
  id = "offset";
  enabled: boolean;

  private offset: number;

  constructor({ enabled, offset }: AssOffsetPluginOptions) {
    this.enabled = enabled;
    this.offset = offset;
  }

  apply(ass: Ass) {
    if (!this.enabled) return;

    ass.events.events.forEach((event) => {
      if (!event.plugins.includes("karaoke")) {
        return;
      }

      event.start += this.offset;
      event.end += this.offset;
    });
  }
}
