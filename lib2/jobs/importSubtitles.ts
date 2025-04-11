import { InputImportSubtitles, OutputImportSubtitles } from "@/types";
import { AbstractJob } from "../job";
import { parseLrcToAlignments } from "@/lib/lrc";

export class JobImportSubtitles extends AbstractJob<
  InputImportSubtitles,
  OutputImportSubtitles
> {
  public readonly type = "import-subtitles";
  public readonly name = "Import Subtitles";

  async run() {
    switch (this.input.type) {
      case "lrc":
        const alignment = parseLrcToAlignments(this.input.subtitles);
        if (!alignment) {
          throw new Error("Failed to parse LRC file");
        }
        alignment.modelId = this.input.title;
        return { alignment };

      default:
        throw new Error("Unsupported subtitle type");
    }
  }
}
