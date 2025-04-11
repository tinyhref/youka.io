import { InputAddKaraokeIntro, OutputAddKaraokeIntro } from "@/types";
import { AbstractJob } from "../job";
import { addKaraokeIntro } from "@/lib/library";

export class JobAddKaraokeIntro extends AbstractJob<
  InputAddKaraokeIntro,
  OutputAddKaraokeIntro
> {
  public readonly type = "add-karaoke-intro";
  public readonly name = "Add Intro Video";

  async run() {
    return addKaraokeIntro(
      this.input,
      (progress: number) => this.emit("progress", progress),
      this.controller.signal
    );
  }
}
