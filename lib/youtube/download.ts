import * as report from "@/lib/report";
import youtubeNode, { Filter } from "@distube/ytdl-core";
import fs from "fs";
import tmp from "tmp-promise";
import ytdlp from "../binary/yt-dlp";
import { TMP_PATH } from "../path";
import { useSettingsStore } from "@/stores/settings";

enum DownloadMode {
  Audio = "audio",
  Video = "video",
}

export async function downloadAudio(
  id: string,
  signal?: AbortSignal
): Promise<Buffer> {
  return download(id, DownloadMode.Audio, signal);
}

export async function downloadVideo(
  id: string,
  signal?: AbortSignal
): Promise<Buffer> {
  return download(id, DownloadMode.Video, signal);
}

export async function download(
  id: string,
  mode: DownloadMode,
  signal?: AbortSignal
): Promise<Buffer> {
  try {
    const file = await downloadYtdlp(id, mode, signal);
    return file;
  } catch (e) {
    report.error("Download from YouTube with ytdlp failed", { e });
  }

  try {
    const file = await downloadYoutubeNode(id, mode, signal);
    return file;
  } catch (e) {
    report.error("Download from YouTube with youtube-node failed", { e });
  }

  throw new Error("Download from YouTube failed");
}

async function downloadYtdlp(
  id: string,
  mode: DownloadMode,
  signal?: AbortSignal
) {
  const settings = useSettingsStore.getState();

  let postfix;
  let format;
  switch (mode) {
    case DownloadMode.Audio:
      postfix = ".m4a";
      format = "bestaudio[ext=m4a]";
      break;
    case DownloadMode.Video:
      postfix = ".mp4";
      format = `bestvideo[ext=mp4][height<=${settings.maxVideoHeight}]`;
      break;
    default:
      throw new Error("unknown mode");
  }
  const filename = await tmp.tmpName({ dir: TMP_PATH, postfix });
  const args: string[] = [
    "-v",
    "--no-check-certificate",
    "--no-cache-dir",
    "-f",
    format,
    "--output",
    filename,
    `https://www.youtube.com/watch?v=${id}`,
  ];
  await ytdlp.exec(args, { signal });
  const file = await fs.promises.readFile(filename);
  await fs.promises.unlink(filename);
  return file;
}

async function downloadYoutubeNode(
  id: string,
  mode: DownloadMode,
  signal?: AbortSignal
): Promise<Buffer> {
  let quality: string;
  let filter: Filter;
  switch (mode) {
    case DownloadMode.Audio:
      quality = "highestaudio";
      filter = (format: any) =>
        format.container === "mp4" && format.codecs.includes("mp4a");
      break;
    case DownloadMode.Video:
      quality = "highestvideo";
      filter = (format: any) => format.container === "mp4";
      break;
    default:
      throw new Error("unknown mode");
  }

  const url = `https://www.youtube.com/watch?v=${id}`;
  return new Promise((resolve, reject) => {
    if (signal) {
      signal.onabort = () => {
        reject(new Error("Download aborted"));
      };
    }
    var buffers: any = [];
    youtubeNode(url, { quality, filter })
      .on("data", (buffer) => {
        buffers.push(buffer);
      })
      .on("error", (error) => {
        return reject(error);
      })
      .on("finish", () => {
        var buffer = Buffer.concat(buffers);
        return resolve(buffer);
      });
  });
}
