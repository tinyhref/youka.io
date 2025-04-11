import { InputImportKaraoke, OutputImportKaraoke } from "@/types";
import { AbstractJob } from "../job";
import { importKaraoke } from "@/lib/library";

export class JobImportKaraoke extends AbstractJob<
  InputImportKaraoke,
  OutputImportKaraoke
> {
  public readonly type = "import-karaoke";
  public readonly name = "Import Karaoke";

  async run() {
    const song = await importKaraoke(
      this.input,
      this.controller.signal,
      (progress) => {
        this.emit("progress", progress);
      }
    );
    return {
      song,
    };
  }
}
