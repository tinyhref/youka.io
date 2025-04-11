import {
  Alignment2,
  Alignment2Subword,
  FFmpegOptions,
  StemType,
} from "@/types";
import path, { join } from "path";
import * as kfn from "./kfn";
import fs from "fs";
import tmp from "tmp-promise";
import { randomUUID } from "crypto";
import { readFileWithAutoEncoding } from "./library";
import { getM4AAudio, getMP4VideoWithDuration } from "./ffmpeg";
import ffprobe from "./binary/ffprobe";

export interface KarafunFile {
  type: "audio" | "video" | "metadata";
  ext: string;
  filepath: string;
  name: string;
}

export interface KarafunExtractResult {
  dir: string;
  files: KarafunFile[];
}

export interface KarafunStem {
  title: string;
  filepath: string;
  type: StemType;
  duration: number;
}

export interface KarafunVideo {
  filepath: string;
  duration: number;
}

export async function extractUnlockedKFN(
  filepath: string
): Promise<KarafunExtractResult> {
  const tmpDir = await tmp.dir();
  const kfnFile = await tmp.file({ cwd: tmpDir.path, postfix: ".kfn" });
  await fs.promises.copyFile(filepath, kfnFile.path);
  const kfnReader = new kfn.KfnFileReader(kfnFile.fd, kfnFile.path);
  await kfnReader.buildDirectory();
  const kfnData = kfnReader.data;

  if (!kfnData.directory) {
    throw new Error("Karafun file is corrupted");
  }

  const files: KarafunFile[] = [];
  for (const file of kfnData.directory.files) {
    const filepath = join(tmpDir.path, file.name);
    const buffer = await kfnReader.readFile(file.length1, file.offset);

    const ext = path.extname(file.name);
    await fs.promises.writeFile(filepath, buffer);

    switch (ext) {
      case ".mp3":
      case ".wav":
      case ".ogg":
        files.push({
          type: "audio",
          name: file.name,
          ext,
          filepath,
        });
        break;
      case ".ini":
        files.push({
          type: "metadata",
          name: file.name,
          ext,
          filepath,
        });
        break;
      case ".mp4":
      case ".mkv":
      case ".mov":
      case ".avi":
        files.push({
          type: "video",
          name: file.name,
          ext,
          filepath,
        });
        break;
    }
  }

  return { dir: tmpDir.path, files };
}

export async function extractLockedKFN(
  filepath: string
): Promise<KarafunExtractResult> {
  const kfnBuffer = await fs.promises.readFile(filepath);
  const kfnFile = kfn.readKFN(kfnBuffer);
  const unlockedFile = kfn.unlockKFN(kfnFile);
  const unlockedBuffer = kfn.writeKFN(unlockedFile);
  const unlockedKfnPath = await tmp.tmpName({ postfix: ".kfn" });
  await fs.promises.writeFile(unlockedKfnPath, unlockedBuffer);
  const result = await extractUnlockedKFN(unlockedKfnPath);
  return result;
}

export async function getKarafunStems(
  result: KarafunExtractResult,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal
) {
  const stems: KarafunStem[] = [];

  const tasks: (() => Promise<void>)[] = [];

  for (const file of result.files) {
    if (file.type !== "audio") {
      continue;
    }

    const audioTask = async () => {
      const parseFilename = parseKarafunStem(file.name);
      if (!parseFilename) {
        return;
      }
      const filepath = await getM4AAudio(file.filepath, {
        ffmpegOptions,
        signal,
      });

      const duration = await ffprobe.duration(filepath);

      stems.push({
        filepath,
        title: parseFilename.title,
        type: parseFilename.stemType,
        duration,
      });
    };
    tasks.push(audioTask);
  }

  await Promise.all(tasks.map((task) => task()));

  return stems;
}

export async function getKarafunVideos(
  result: KarafunExtractResult,
  duration: number,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal
) {
  const videos: KarafunVideo[] = [];

  const tasks: (() => Promise<void>)[] = [];

  for (const file of result.files) {
    if (file.type !== "video") {
      continue;
    }

    const videoTask = async () => {
      const filepath = await getMP4VideoWithDuration(file.filepath, duration, {
        ffmpegOptions,
        signal,
      });
      // const videoPath = await moveFileToLibrary(id, tmpVideoPath);
      // const video = createVideoObject("original", videoPath);
      videos.push({
        filepath,
        duration,
      });
    };
    tasks.push(videoTask);
  }

  await Promise.all(tasks.map((task) => task()));

  return videos;
}

export async function getKarafunSubtitles(
  result: KarafunExtractResult
): Promise<Alignment2[]> {
  const file = result.files.find((file) => file.type === "metadata");
  if (!file) {
    return [];
  }

  const metadata = await readFileWithAutoEncoding(file.filepath);
  const syncs = kfn.parseKarafunIniFile(metadata);
  const alignments2: Alignment2Subword[] = [];
  for (const sync of syncs) {
    const alignment: Alignment2Subword = {
      id: randomUUID(),
      mode: "subword",
      modelId: "karafun",
      alignment: sync,
      createdAt: new Date().toISOString(),
    };
    alignments2.push(alignment);
  }

  return alignments2;
}

export function parseKarafunStem(filename: string) {
  let stemType: StemType;
  const filenameLower = filename.toLowerCase();

  const ext = path.extname(filename);
  const title = filename.replace(ext, "");

  if (filenameLower.includes("vocals") || filenameLower.includes("chant")) {
    stemType = "vocals";
  } else if (filenameLower.includes("instruments")) {
    stemType = "instruments";
  } else {
    stemType = "instruments";
  }

  return {
    title,
    stemType,
  };
}
