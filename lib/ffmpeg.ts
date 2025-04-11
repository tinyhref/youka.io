import {
  AspectRatio,
  FFmpegOptions,
  FFmpegTransitionOptions,
  ProgressFunc,
  Resolution,
} from "@/types";
import ffmpeg from "./binary/ffmpeg";
import tmp from "tmp-promise";
import ffprobe from "./binary/ffprobe";
import { ffmpegArgsFromOptions } from "./library";
import fs from "fs";
export interface BasicFFmpegOptions {
  ffmpegOptions: FFmpegOptions;
  signal?: AbortSignal;
  onProgress?: ProgressFunc;
}

export async function getMP4VideoWithDuration(
  filepath: string,
  duration: number,
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const output = await tmp.tmpName({ prefix: "video-", postfix: ".mp4" });

  const args = [
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    filepath,
    "-t",
    duration.toString(),
    "-an",
    "-c:v",
    "libx264",
    "-shortest",
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress, duration);

  return output;
}

export async function getM4AAudio(
  input: string,
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const output = await tmp.tmpName({
    prefix: "audio-",
    postfix: ".m4a",
  });

  const args = [
    "-y",
    "-i",
    input,
    "-c:a",
    "aac",
    "-b:a",
    "320k",
    "-vn",
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress);

  return output;
}

export async function addPaddingToVideo(
  input: string,
  aspectRatio: AspectRatio,
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const resolution = await ffprobe.resolution(input);
  if (resolution) {
    const currentAspectRatio = resolution.width / resolution.height;
    const targetAspectRatio = aspectRatio.width / aspectRatio.height;
    if (currentAspectRatio === targetAspectRatio) {
      return input;
    }
  }

  if (!resolution) {
    return input;
  }

  const output = await tmp.tmpName({
    prefix: "video-",
    postfix: ".mp4",
  });

  const videoFilterValue = getPadVideoFilterValueByAspectRatio(
    resolution.width,
    resolution.height,
    aspectRatio
  );
  if (!videoFilterValue) {
    return input;
  }

  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    videoFilterValue,
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress);

  return output;
}

export async function getPadVideoFilterByAspectRatioOrResolution(
  filepath: string,
  targetAspectRatio: AspectRatio,
  targetResolution?: Resolution,
  fps?: number
) {
  if (targetResolution) {
    return getPadVideoFilterByResolution(filepath, targetResolution, fps);
  }

  return getPadVideoFilterByAspectRatio(filepath, targetAspectRatio, fps);
}

export async function getPadVideoFilterByAspectRatio(
  filepath: string,
  targetAspectRatio: AspectRatio,
  fps?: number
) {
  const resolution = await ffprobe.resolution(filepath);
  const filters: string[] = [];

  if (fps) {
    filters.push(`fps=${fps}`);
  }

  if (resolution) {
    const padFilter = getPadVideoFilterValueByAspectRatio(
      resolution.width,
      resolution.height,
      targetAspectRatio
    );

    if (padFilter) {
      filters.push(padFilter);
    }
  }

  if (filters.length > 0) {
    return ["-vf", filters.join(",")];
  }

  return [];
}

export function getPadVideoFilterValueByAspectRatio(
  width: number,
  height: number,
  aspectRatio: AspectRatio
): string | undefined {
  if (aspectRatio.width <= 0 || aspectRatio.height <= 0) {
    throw new Error("targetAspectRatio must be a positive number");
  }

  const targetAspectRatio = aspectRatio.width / aspectRatio.height;
  const inputAspectRatio = width / height;
  let targetWidth = width;
  let targetHeight = height;

  // Adjust dimensions to maintain the target aspect ratio if needed
  if (inputAspectRatio > targetAspectRatio) {
    // Input is wider than target, so increase height
    targetHeight = Math.ceil(width / targetAspectRatio);
  } else if (inputAspectRatio < targetAspectRatio) {
    // Input is taller than target, so increase width
    targetWidth = Math.ceil(height * targetAspectRatio);
  }

  // Ensure dimensions are even
  targetWidth += targetWidth % 2;
  targetHeight += targetHeight % 2;

  // If the input already matches the target dimensions, no padding is needed.
  if (targetWidth === width && targetHeight === height) {
    return undefined;
  }

  // Calculate the necessary padding
  const padWidth = (targetWidth - width) / 2;
  const padHeight = (targetHeight - height) / 2;

  // Return the FFmpeg pad filter string
  return `pad=${targetWidth}:${targetHeight}:${Math.ceil(padWidth)}:${Math.ceil(
    padHeight
  )}`;
}

export async function getPadVideoFilterByResolution(
  filepath: string,
  targetResolution: Resolution,
  fps?: number
) {
  const resolution = await ffprobe.resolution(filepath);
  const filters: string[] = [];

  if (fps) {
    filters.push(`fps=${fps}`);
  }

  if (resolution) {
    const padFilter = getPadVideoFilterValueByResolution(
      resolution,
      targetResolution
    );

    if (padFilter) {
      filters.push(padFilter);
    }
  }

  if (filters.length > 0) {
    return ["-vf", filters.join(",")];
  }

  return [];
}

export function getPadVideoFilterValueByResolution(
  currentResolution: Resolution,
  targetResolution: Resolution
): string | undefined {
  if (targetResolution.width <= 0 || targetResolution.height <= 0) {
    throw new Error("targetResolution dimensions must be positive numbers");
  }

  // If the input already matches the target dimensions, no padding is needed
  if (
    targetResolution.width === currentResolution.width &&
    targetResolution.height === currentResolution.height
  ) {
    return undefined;
  }

  // Calculate the necessary padding to center the video
  const padWidth = (targetResolution.width - currentResolution.width) / 2;
  const padHeight = (targetResolution.height - currentResolution.height) / 2;

  // Return the FFmpeg pad filter string
  return `pad=${targetResolution.width}:${targetResolution.height}:${Math.ceil(
    padWidth
  )}:${Math.ceil(padHeight)}`;
}

export async function padVideo(
  input: string,
  start: number,
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const output = await tmp.tmpName({
    prefix: "video-",
    postfix: ".mp4",
  });

  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    `tpad=start_duration=${start}`,
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress);

  return output;
}

export async function padAudio(
  input: string,
  output: string,
  time: number,
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const args = [
    "-y",
    "-f",
    "lavfi",
    "-t",
    time.toString(),
    "-i",
    "anullsrc=r=44100:cl=stereo",
    "-i",
    input,
    "-filter_complex",
    "[0:a][1:a]concat=n=2:v=0:a=1[outa]",
    "-map",
    "[outa]",
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress);

  return output;
}

export async function joinVideos(
  inputs: string[],
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const inputFile = await tmp.tmpName({ prefix: "concat-", postfix: ".txt" });
  const output = await tmp.tmpName({ prefix: "video-", postfix: ".mp4" });

  // Write input files to a text file
  const fileList = inputs.map((file) => `file '${file}'`).join("\n");
  console.log("fileList", fileList);
  await fs.promises.writeFile(inputFile, fileList);

  const args = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    inputFile,
    "-reset_timestamps",
    "1",
    "-c",
    "copy",
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress);

  await fs.promises.unlink(inputFile);

  return output;
}

export async function joinVideosWithRencoding(
  video1: string,
  video2: string,
  output: string,
  transition: FFmpegTransitionOptions,
  { signal, onProgress, ffmpegOptions }: BasicFFmpegOptions
) {
  const [duration1, duration2] = await Promise.all([
    ffprobe.duration(video1),
    ffprobe.duration(video2),
  ]);
  const duration = duration1 + duration2;
  const offset = duration1 - transition.duration;

  const streams = await ffprobe.streams(video2);
  const videoStream = streams?.find((s) => s.codecType === "video");
  if (!videoStream) {
    throw new Error("No video stream found");
  }
  if (!videoStream.avgFrameRate) {
    throw new Error("No average frame rate found");
  }

  const args = [
    "-y",
    "-i",
    video1,
    "-i",
    video2,
    "-c:v",
    "libx264",
    "-filter_complex",
    `[0:v]fps=${videoStream.avgFrameRate}[v0]; ` +
      `[1:v]fps=${videoStream.avgFrameRate}[v1]; ` +
      `[v0][v1]xfade=transition=${transition.type}:duration=${transition.duration}:offset=${offset}[v]`,
    "-map",
    "[v]",
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { signal }, onProgress, duration);

  return output;
}
