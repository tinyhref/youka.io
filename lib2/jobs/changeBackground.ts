import { InputChangeBackground, OutputChangeBackground } from "@/types";
import * as library from "@/lib/library";
import { AbstractJob } from "../job";
import { lib } from "@/lib/repo";

export class JobChangeBackground extends AbstractJob<
  InputChangeBackground,
  OutputChangeBackground
> {
  public readonly type = "change-background";
  public readonly name = "Change Background";

  async run() {
    await library.changeBackground(
      this.input,
      (progress: number) => this.emit("progress", progress),
      this.controller.signal
    );

    const newSong = await lib.getSong(this.input.song.id);
    if (!newSong) {
      throw new Error("Song not found");
    }

    return {
      song: newSong,
    };
  }
}
