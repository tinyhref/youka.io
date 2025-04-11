import * as amplitude from "@amplitude/analytics-browser";
import { InputSyncLyrics, OutputSyncLyrics } from "@/types";
import * as library from "@/lib/library";
import { lib } from "@/lib/repo";
import { AbstractJob } from "../job";

export class JobSyncLyrics extends AbstractJob<
  InputSyncLyrics,
  OutputSyncLyrics
> {
  public readonly type = "sync-lyrics";
  public readonly name = "Sync Lyrics";

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

      const force = Boolean(this.input.lyrics);
      const alignment = await library.getAlignment(
        this.input.song.id,
        this.input.lyrics,
        force,
        this.input.alignModel,
        this.controller.signal
      );

      if (!alignment) {
        throw new Error("Alignment failed");
      }

      const end = new Date();
      const duration = Math.round((end.getTime() - start.getTime()) / 1000);

      await library.setAlignment2(this.input.song.id, alignment, true);

      const song = await lib.getSong(this.input.song.id);
      if (!song) {
        throw new Error("Song not found");
      }

      amplitude.track("sync", {
        duration,
        song_id: this.input.song.id,
        title: this.input.song.title,
        align_model: this.input.alignModel,
      });

      return { song, alignment };
    } catch (error) {
      throw error;
    } finally {
      clearInterval(interval);
      this.emit("progress", 100);
    }
  }
}
