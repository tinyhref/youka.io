import * as amplitude from "@amplitude/analytics-browser";
import { InputExportMedia, OutputExportMedia } from "@/types";
import * as library from "@/lib/library";
import { AbstractJob } from "../job";

export class JobExportMedia extends AbstractJob<
  InputExportMedia,
  OutputExportMedia
> {
  public readonly type = "export-media";
  public readonly name = "Export";

  async run() {
    const start = new Date();
    const filepath = await library.exportMedia(
      this.input,
      (progress: number) => this.emit("progress", progress),
      this.controller.signal
    );
    if (!filepath) {
      throw new Error("Failed to export media");
    }
    const end = new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    amplitude.track("export", { duration, type: this.input.fileType });
    return { filepath };
  }
}
