import { InputParseTitles, OutputParseTitles } from "@/types";
import { AbstractJob } from "../job";
import { lib } from "@/lib/repo";
import client from "@/lib/client";

export class JobParseTitles extends AbstractJob<
  InputParseTitles,
  OutputParseTitles
> {
  public readonly type = "parse-titles";
  public readonly name = "Parse Titles";

  async run() {
    const { force } = this.input;
    const songs = await lib.songs();
    const total = songs.length;
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      if (this.controller.signal.aborted) {
        throw new Error("Aborted");
      }
      if (song.songTitle && !force) {
        continue;
      }
      const parsedTitle = await client.parseSongTitle(song.title);
      song.songTitle = parsedTitle.title;
      song.artists = parsedTitle.artists;
      await lib.updateSong(song.id, song);
      const progressPercent = Math.round(((i + 1) / total) * 100);
      this.emit("progress", progressPercent);
    }
    return {};
  }
}
