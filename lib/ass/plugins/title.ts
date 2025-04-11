import { IStyleOptions } from "@/types/style";
import { AssPlugin } from "../types";
import { Ass, Dialogue } from "./../ass";
import { AssPluginOptionsBase } from "./types";
import { getBlurTag } from "../utils";

export const AssTitlePluginId = "title";

export interface AssTitlePluginOptions extends AssPluginOptionsBase {
  id: "title";
  style: IStyleOptions;
  artistStyle: IStyleOptions;
  duration: number;
  start: number;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface AssTitlePluginRuntime {
  title: string;
  artists: string[];
}

export class AssTitlePlugin implements AssPlugin {
  id = AssTitlePluginId;
  settings: AssTitlePluginOptions;
  runtime: AssTitlePluginRuntime;

  constructor(settings: AssTitlePluginOptions, runtime: AssTitlePluginRuntime) {
    this.settings = settings;
    this.runtime = runtime;
  }

  apply(ass: Ass) {
    if (!this.settings.enabled) return;
    if (!this.runtime.title) return;

    ass.styles.add(this.settings.style);
    ass.styles.add(this.settings.artistStyle);

    let end = this.settings.start + this.settings.duration;

    const fadeInMsEffect = this.settings.fadeInMs || 300;
    const fadeOutMsEffect = this.settings.fadeOutMs || 300;

    let title = this.runtime.title;
    title = title.replace(/\n/g, "\\N");
    if (this.settings.style.uppercase) {
      title = title.toUpperCase();
    }

    const songTitleBlur = getBlurTag(this.settings.style.blur);

    const text = `{${songTitleBlur}\\fad(${fadeInMsEffect},${fadeOutMsEffect})}${title}`;
    const event = new Dialogue({
      plugin: this.id,
      style: this.settings.style.name,
      start: this.settings.start,
      end,
      text,
    });

    if (this.runtime.artists.length > 0) {
      const artistBlur = getBlurTag(this.settings.artistStyle.blur);
      let artists = this.runtime.artists.join(" • ");
      if (this.settings.artistStyle.uppercase) {
        artists = artists.toUpperCase();
      }
      const artistsText = `{${artistBlur}\\fad(${fadeInMsEffect},${fadeOutMsEffect})}${artists}`;
      const artistsEvent = new Dialogue({
        plugin: this.id,
        style: this.settings.artistStyle.name,
        start: this.settings.start,
        end,
        text: artistsText,
      });
      ass.events.events.unshift(artistsEvent);
    }

    ass.events.events.unshift(event);
  }
}
