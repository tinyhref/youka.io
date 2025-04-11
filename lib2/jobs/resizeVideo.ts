import { InputResizeVideo, OutputResizeVideo } from "@/types";
import * as ffmpeg from "@/lib/ffmpeg";
import { AbstractJob } from "../job";
import { lib } from "@/lib/repo";
import { moveFileToLibrary, addVideo } from "@/lib/library";

export class JobResizeVideo extends AbstractJob<
  InputResizeVideo,
  OutputResizeVideo
> {
  public readonly type = "resize-video";
  public readonly name = "Resize Video";

  async run() {
    const { song, videoId, aspectRatio, ffmpegOptions } = this.input;

    const video = song.videos.find((v) => v.id === videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    const resizedVideoPath = await ffmpeg.addPaddingToVideo(
      video.filepath,
      aspectRatio,
      {
        ffmpegOptions,
        onProgress: (progress: number) => this.emit("progress", progress),
        signal: this.controller.signal,
      }
    );

    const newVideoPath = await moveFileToLibrary(song.id, resizedVideoPath);

    const newVideo = await addVideo(song.id, {
      filepath: newVideoPath,
      type: "custom",
    });

    const newSong = await lib.getSong(this.input.song.id);
    if (!newSong) {
      throw new Error("Song not found");
    }

    return {
      song: newSong,
      video: newVideo,
    };
  }
}
