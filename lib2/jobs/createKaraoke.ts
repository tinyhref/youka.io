import * as amplitude from "@amplitude/analytics-browser";
import { InputCreateKaraoke, OutputCreateKaraoke } from "@/types";
import * as library from "@/lib/library";
import { AbstractJob } from "../job";
import client from "@/lib/client";
import { MayIError } from "@/types/error";
import { lib } from "@/lib/repo";
import Debug from "debug";

const debug = Debug("youka:desktop");

export class JobCreateKaraoke extends AbstractJob<
  InputCreateKaraoke,
  OutputCreateKaraoke
> {
  public readonly type = "create-karaoke";
  public readonly name = "Create Karaoke";

  async run() {
    let interval: any;
    const start = new Date();

    try {
      const intervalTime = library.calcInternalTime(7);
      let progress = 0;
      interval = setInterval(() => {
        if (this.controller.signal.aborted || progress >= 99) {
          clearInterval(interval);
          return;
        }
        progress += 1;
        this.emit("progress", progress);
      }, intervalTime);

      let song = await lib.getSong(this.input.song.id);
      if (song) {
        return { song };
      }

      await library.ensureDiskSpace();

      const { ok, reason } = await client.mayi();
      if (!ok) {
        throw new MayIError("Unauthorized", reason);
      }

      song = await library.createKaraoke(this.input, this.controller.signal);

      const end = new Date();
      const duration = Math.round((end.getTime() - start.getTime()) / 1000);

      debug("duration", duration);

      amplitude.track("generate", {
        source: this.input.audioSource.type,
        duration,
        song_id: this.input.song.id,
        title: this.input.song.title,
        split_model: this.input.splitModel,
        align_model: this.input.alignModel,
      });

      return { song };
    } catch (error) {
      throw error;
    } finally {
      clearInterval(interval);
      this.emit("progress", 100);
    }
  }
}
