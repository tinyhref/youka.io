import { InputAnalyseLibrary, OutputAnalyseLibrary } from "@/types";
import { AbstractJob } from "../job";
import { lib } from "@/lib/repo";
import { analyseSong, savePeaks } from "@/lib/library";

export class JobAnalyseLibrary extends AbstractJob<
  InputAnalyseLibrary,
  OutputAnalyseLibrary
> {
  public readonly type = "analyse-library";
  public readonly name = "Analyse Library";

  async run() {
    const { force } = this.input;
    const songs = await lib.songs();
    const total = songs.length;
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      if (this.controller.signal.aborted) {
        throw new Error("Aborted");
      }
      if (song.analysis && !force) {
        continue;
      }
      const originalStem = song.stems.find((s) => s.type === "original");
      if (!originalStem) {
        continue;
      }

      try {
        const { peakWaveform, ...analysis } = await analyseSong(
          originalStem.filepath
        );
        song.analysis = analysis;
        const peaks = Array.from(peakWaveform);
        await savePeaks(song.id, originalStem.id, peaks);
        await lib.updateSong(song.id, song);
      } catch (error) {
        console.error(error);
      }

      const progressPercent = Math.round(((i + 1) / total) * 100);
      this.emit("progress", progressPercent);
    }
    return {};
  }
}
