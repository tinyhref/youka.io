import { InputImportStem, OutputImportStem } from "@/types";
import { AbstractJob } from "../job";
import { importStem } from "@/lib/library";
import { lib } from "@/lib/repo";

export class JobImportStem extends AbstractJob<
  InputImportStem,
  OutputImportStem
> {
  public readonly type = "import-stem";
  public readonly name = "Import Stem";

  async run() {
    await importStem(this.input, this.controller.signal, (progress) => {
      this.emit("progress", progress);
    });

    const song = await lib.getSong(this.input.song.id);
    if (!song) {
      throw new Error("Song not found");
    }

    return {
      song,
    };
  }
}
