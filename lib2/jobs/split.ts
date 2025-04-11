import fs from "fs";
import { InputSplit, OutputSplit } from "@/types";
import * as library from "@/lib/library";
import { AbstractJob } from "../job";
import { lib } from "@/lib/repo";

export class JobSplit extends AbstractJob<InputSplit, OutputSplit> {
  public readonly type = "split";
  public readonly name = "Separate Audio";

  async run() {
    let interval: any;

    try {
      const intervalTime = library.calcInternalTime(2);
      let progress = 0;
      interval = setInterval(() => {
        if (this.controller.signal.aborted || progress >= 99) {
          clearInterval(interval);
          return;
        }
        progress += 1;

        this.emit("progress", progress);
      }, intervalTime);

      const audioFile = await library.getOriginalPathFromSong(this.input.song);
      if (!audioFile) {
        throw new Error("Audio file not found");
      }
      const audio = await fs.promises.readFile(audioFile);
      await library.generateStems(
        this.input.song.id,
        audio,
        this.input.splitModel,
        this.controller.signal
      );

      const song = await lib.getSong(this.input.song.id);
      if (!song) {
        throw new Error("Song not found");
      }

      return { song };
    } catch (error) {
      throw error;
    } finally {
      clearInterval(interval);
      this.emit("progress", 100);
    }
  }
}
