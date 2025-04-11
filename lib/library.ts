import iconv from "iconv-lite";
import tmp from "tmp-promise";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import fs from "fs";
import path, { join, basename, extname } from "path";
import checkDiskSpace from "check-disk-space";
import { mkdirp } from "mkdirp";
import { platform, arch, release } from "@/lib/binary/os";
import filenamify from "filenamify";
import { tmpName } from "tmp-promise";
import { BinaryLike, createHash, randomUUID } from "crypto";
import ytdlp from "@/lib/binary/yt-dlp";
import chardet from "chardet";
import lyricsFinder from "./lyrics";
import * as karafun from "./karafun";
import * as gt from "./google-translate";
import {
  ISongProcessed,
  ProgressFunc,
  InputExportMedia,
  IAlignmentItemLine,
  SongMetadata,
  FFmpegPreset,
  Alignment2,
  Alignment2Line,
  Alignment2Word,
  TrackSegment,
  ISongStem,
  ISongVideo,
  StemType,
  Alignment2Subword,
  InputChangeBackground,
  Alignment3,
  InputImportStem,
  FFmpegOptions,
  InputCreateKaraoke,
  InputImportKaraoke,
  VideoOptions,
  AspectRatio,
  Resolution,
  SubtitlesPreset,
  SingerToStyleOptionsMapping,
  VideoType,
  InputAddKaraokeIntro,
  InputTrim,
  SongTitleAndArtists,
} from "@/types";
import { alignmentToAss } from "./ass-alignment";
import * as report from "@/lib/report";
import * as youtube from "./youtube";
import ffmpeg from "./binary/ffmpeg";
import ffprobe from "./binary/ffprobe";
import soundstretch from "./binary/soundstretch";
import { exists, sortAlignments } from "./utils";
import {
  LIBRARY_PATH,
  DOWNLOAD_PATH,
  FONTS_PATH,
  BINARIES_PATH,
  CACHE_PATH,
  TMP_PATH,
  ROOT_PATH,
} from "./path";
import { FileType, MediaMode, MetadataMode, Mode } from "@/types";
import client from "./client";
import got from "got";
import _ from "lodash";
import { MayIError } from "@/types/error";
import rollbar from "./rollbar";
import { alignment2Lrc, parseLrcToAlignments } from "./lrc";
import * as id3 from "./id3";
import { useSettingsStore } from "@/stores/settings";
import { lib } from "@/lib/repo";
import Debug from "debug";
import { initFonts } from "./fonts";
import {
  BasicFFmpegOptions,
  addPaddingToVideo,
  getPadVideoFilterByAspectRatioOrResolution,
  joinVideosWithRencoding,
  padAudio,
} from "./ffmpeg";
import * as filetype from "file-type";
import audiowaveform from "./binary/audiowaveform";
import { alignment3ToAlignment2 } from "./alignment";
import {
  AudioSource,
  AudioSourceKarafun,
  SubtitlesSource,
  SubtitlesSourceId3,
  SubtitlesSourceKarafun,
  SubtitlesSourceLrc,
  VideoSource,
  VideoSourceColor,
  VideoSourceImage,
  VideoSourceKarafun,
  VideoSourceUrl,
  VideoSourceVideo,
} from "@/schemas";
import { DEFAULT_BACKGROUND_IMAGE_URL, DefaultVideoResolution } from "@/consts";
import { analyseAudio, SPAnalysisResult } from "./sp";

const debug = Debug("youka:desktop");

export function isSupported() {
  return (
    ["win32", "darwin", "linux"].includes(platform) &&
    ["ia32", "x64", "arm64"].includes(arch)
  );
}

export async function initSongDir(id: string) {
  await mkdirp(join(LIBRARY_PATH, id));
}

export async function ensureDiskSpace(
  ppath: string = LIBRARY_PATH,
  requiredFreeMb: number = 200
) {
  let space;
  try {
    space = await checkDiskSpace(ppath);
  } catch (e) {
    // report.error("Failed to check disk space", e as any);
    return;
  }

  const requiredFreeBytes = requiredFreeMb * 1024 * 1024;
  if (space && space.free < requiredFreeBytes) {
    const spaceFreeMb = Math.floor(space.free / 1024 / 1024);
    console.log("not enough disk space", spaceFreeMb, requiredFreeMb);
    throw new MayIError(
      "Not enough disk space to generate karaoke",
      "DISK_FULL"
    );
  }
}

export async function generateStems(
  id: string,
  audio: Buffer,
  modelId: string,
  signal?: AbortSignal
) {
  const { instruments, vocals } = await getStems(id, audio, modelId, signal);

  await addStem(id, {
    type: instruments.type,
    modelId: instruments.modelId,
    filepath: instruments.filepath,
  });
  await addStem(id, {
    type: vocals.type,
    modelId: vocals.modelId,
    filepath: vocals.filepath,
  });

  return { instruments, vocals };
}

export async function createKaraoke(
  {
    id,
    title,
    thumbnail,
    videoSource,
    audioSource,
    alignModel,
    splitModel,
    ffmpegOptions,
    lang,
    lyrics,
  }: InputCreateKaraoke,
  signal: AbortSignal
): Promise<ISongProcessed> {
  debug("generate from youtube", id);

  await initSongDir(id);

  await client.setMetadata(id, { id });

  const videoPromise = getFilepathFromVideoSource(
    id,
    videoSource,
    audioSource.duration,
    ffmpegOptions,
    signal
  );
  const audioFilepath = await getFilepathFromAudioSource(
    audioSource,
    ffmpegOptions,
    signal
  );

  const audio = await fs.promises.readFile(audioFilepath);
  await client.uploadOriginal(id, audio);
  const stemsPromise = getStems(id, audio, splitModel, signal);

  const forceAlign = Boolean(lyrics);

  if (!lyrics && title) {
    lyrics = await getLyricsByTitle(title, signal);
  }

  if (lyrics && !lang) {
    lang = await getLanguage(id, lyrics, true);
  }

  const selectedAlignerModelId = selectAlignerModel({
    modelId: alignModel,
    lyrics,
  });

  let stems: { instruments: ISongStem; vocals: ISongStem } | undefined;

  const isAlignerRequiresVocals = ![
    "audioshake-transcription",
    "audioshake-alignment",
  ].includes(selectedAlignerModelId);

  if (isAlignerRequiresVocals) {
    stems = await stemsPromise;
  }
  signal?.throwIfAborted();

  let alignments2: Alignment2[] = [];
  try {
    signal?.throwIfAborted();
    const alignment = await getAlignment(
      id,
      lyrics,
      forceAlign,
      alignModel,
      signal
    );
    signal?.throwIfAborted();
    if (alignment) {
      alignments2.push(alignment);
      lyrics = lyricsFromAlignment(alignment as Alignment2Word);
    }
    if (lyrics) {
      lang = await getLanguage(id, lyrics, true);
    }
  } catch (e) {
    report.error("Syncing lyrics failed", e as any);
    console.error(e);
  }
  signal?.throwIfAborted();

  let parsedTitle: SongTitleAndArtists | undefined;
  try {
    parsedTitle = await client.parseSongTitle(title);
  } catch (e) {
    report.error("Parsing song title failed", e as any);
  }

  const videoFilepath = await videoPromise;

  const resolution = await ffprobe.resolution(videoFilepath);
  const video = await createVideoObject(videoFilepath, "original", resolution);
  const original = await createStemObject(
    "original",
    "original",
    audioFilepath
  );

  if (!isAlignerRequiresVocals) {
    stems = await stemsPromise;
  }

  if (!stems) {
    throw new Error("Can't get stems");
  }

  let partialAnalysis: Omit<SPAnalysisResult, "peakWaveform"> | undefined;
  try {
    const { peakWaveform, ...analysis } = await analyseSong(audioFilepath);
    await savePeaks(id, original.id, Array.from(peakWaveform));
    partialAnalysis = analysis;
  } catch (e) {
    report.error("Failed to analyze audio", { error: e });
  }

  const vocals = await createStemObject(
    "vocals",
    stems.vocals.modelId,
    stems.vocals.filepath
  );
  const instruments = await createStemObject(
    "instruments",
    stems.instruments.modelId,
    stems.instruments.filepath
  );

  const newSong: ISongProcessed = {
    id,
    title,
    songTitle: parsedTitle?.title,
    artists: parsedTitle?.artists,
    image: thumbnail,
    lyrics,
    lang,
    createdAt: new Date().toISOString(),
    videos: [video],
    stems: [original, instruments, vocals],
    status: "processed",
    type: "song",
    selectedVideo: video.id,
    selectedInstruments: instruments.id,
    selectedVocals: vocals.id,
    alignments2,
    analysis: partialAnalysis,
  };

  try {
    client.setMetadata(id, newSong);
  } catch (e) {
    report.error("Failed to set server metadata", e as any);
  }

  await lib.addSong(newSong);
  return newSong;
}

export async function savePeaks(id: string, stemId: string, peaks: number[]) {
  const filename = `peaks-${stemId}.json`;
  const peaksFilepath = join(LIBRARY_PATH, id, filename);
  await fs.promises.writeFile(peaksFilepath, JSON.stringify(peaks));
}

export async function readPeaks(
  id: string,
  stemId?: string
): Promise<number[] | undefined> {
  const filename = stemId ? `peaks-${stemId}.json` : "peaks.json";
  const peaksFilepath = join(LIBRARY_PATH, id, filename);
  if (await exists(peaksFilepath)) {
    try {
      const peaks = JSON.parse(
        await fs.promises.readFile(peaksFilepath, "utf8")
      );
      return peaks;
    } catch (e) {
      report.error("Failed to get peaks", {
        id,
        filepath: peaksFilepath,
        error: e as Error,
      });
    }
  }
}

export function getStemFilepath(id: string, stem: StemType, modelId: string) {
  const filename = getStemFilename(modelId, stem);
  return join(LIBRARY_PATH, id, `${filename}${FileType.M4A}`);
}

export function getStemFilename(modelId: string, stem: StemType) {
  return modelId === "demucs" ? stem : `${modelId}_${stem}`;
}

export async function getStems(
  id: string,
  audio: Buffer,
  modelId: string,
  signal?: AbortSignal
): Promise<{ instruments: ISongStem; vocals: ISongStem }> {
  let splitResult: ISongStem[] | undefined;

  try {
    splitResult = await client.split(id, audio, modelId, signal);
  } catch (e) {
    report.error("Failed to split audio", { error: e, id, modelId });
  }

  if (!splitResult && modelId !== "demucs") {
    try {
      splitResult = await client.split(id, audio, "demucs", signal);
    } catch (e) {
      report.error("Failed to split audio", {
        error: e,
        id,
        modelId: "demucs",
      });
    }
  }

  if (!splitResult) {
    throw new Error("Failed to split audio");
  }

  signal?.throwIfAborted();

  const instrumentsStem = splitResult.find((s) => s.type === "instruments");
  const vocalsStem = splitResult.find((s) => s.type === "vocals");
  if (!instrumentsStem || !vocalsStem) {
    throw new Error("Failed to split audio");
  }

  const newInstrumentsFile = getStemFilepath(
    id,
    "instruments",
    instrumentsStem.modelId
  );
  const newVocalsFile = getStemFilepath(id, "vocals", vocalsStem.modelId);

  await Promise.all([
    fs.promises.copyFile(instrumentsStem.filepath, newInstrumentsFile),
    fs.promises.copyFile(vocalsStem.filepath, newVocalsFile),
  ]);

  try {
    fs.promises.unlink(instrumentsStem.filepath);
    fs.promises.unlink(vocalsStem.filepath);
  } catch (e) {
    report.error(e as any);
  }

  const iStem = await createStemObject(
    "instruments",
    instrumentsStem.modelId,
    newInstrumentsFile
  );
  const vStem = await createStemObject(
    "vocals",
    vocalsStem.modelId,
    newVocalsFile
  );

  return {
    instruments: iStem,
    vocals: vStem,
  };
}

export function lyricsFromSubwordAlignment(alignment: Alignment2Subword) {
  let lyrics = "";
  alignment.alignment.forEach((a) => {
    if (a.word === 1 && a.subword === 1) {
      lyrics += "\n";
    } else if (a.subword === 1) {
      lyrics += " ";
    }
    lyrics += a.text;
  });
  lyrics = lyrics?.trim();
  return lyrics;
}

export function lyricsFromAlignment(alignment: Alignment2Word) {
  let lyrics = "";
  alignment.alignment.forEach((a) => {
    if (a.word === 1) {
      lyrics += "\n";
    } else {
      lyrics += " ";
    }
    lyrics += a.text;
  });
  lyrics = lyrics?.trim();
  return lyrics;
}

export async function getDummyVideo(
  duration: number,
  color: string,
  { width, height }: Resolution,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal,
  onProgress?: ProgressFunc
) {
  const cwd = CACHE_PATH;
  const output = `${width}_${height}_${duration}_${color}${FileType.MP4}`;
  const outputFull = join(cwd, output);
  if (await exists(outputFull)) {
    return outputFull;
  }

  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=${color}:s=${width}x${height}:r=${ffmpegOptions.fps}:d=${duration}`,
    "-c:v",
    "libx264",
    "-tune",
    "stillimage",
    ...ffmpegArgsFromOptions({ ...ffmpegOptions, preset: "ultrafast" }),
    output,
  ];

  await ffmpeg.exec(args, { cwd, signal }, onProgress, duration);

  return outputFull;
}

export function calcInternalTime(
  minutes: number,
  totalIncrements: number = 99
) {
  const timeMs = minutes * 60 * 1000;
  return timeMs / totalIncrements;
}

export function getExt(filename: string) {
  return path.extname(filename).toLowerCase().slice(1);
}

export async function isJPEG(buffer: Buffer) {
  const type = await filetype.fileTypeFromBuffer(buffer);
  if (!type) {
    return false;
  }

  return type.mime === "image/jpeg";
}

export function isImageExt(filename: string) {
  const ext = getExt(filename);
  const imageExt = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "bmp",
    "tiff",
    "svg",
    "avif",
    "jfif",
  ];
  return imageExt.includes(ext);
}

export function isKFNExt(filename: string) {
  const ext = getExt(filename);
  return ext === "kfn";
}

export async function hasVideoAudioStream(filepath: string) {
  const streams = await ffprobe.streams(filepath);
  if (!streams) {
    return { hasVideo: isVideoExt(filepath), hasAudio: isAudioExt(filepath) };
  }
  const hasVideo = streams.some((s) => s.codecType === "video");
  const hasAudio = streams.some((s) => s.codecType === "audio");
  return { hasVideo, hasAudio };
}

export async function hasVideoStream(filepath: string) {
  const streams = await ffprobe.streams(filepath);
  if (!streams) {
    return isVideoExt(filepath);
  }
  return streams.some((s) => s.codecType === "video");
}

export async function hasAudioStream(filepath: string) {
  const streams = await ffprobe.streams(filepath);
  if (!streams) {
    return isAudioExt(filepath);
  }
  return streams.some((s) => s.codecType === "audio");
}

const VideoExtensions = [
  "mp4",
  "mov",
  "mkv",
  "avi",
  "wmv",
  "flv",
  "webm",
  "m4v",
  "mpg",
  "mpeg",
];

export function isVideoExt(filename: string) {
  const ext = getExt(filename);
  return VideoExtensions.includes(ext);
}

const AudioExtensions = [
  "mp3",
  "m4a",
  "wav",
  "ogg",
  "flac",
  "wma",
  "aac",
  "opus",
  "aif",
  "aiff",
  "weba",
  "mpg",
  "mpeg",
];
export function isAudioExt(filename: string) {
  const ext = getExt(filename);
  return AudioExtensions.includes(ext);
}

export async function getFilepathFromAudioSource(
  params: AudioSource,
  ffmpegOptions: FFmpegOptions,
  signal: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string> {
  switch (params.type) {
    case "audio":
      const safeAudioFilepath = await getSafeFilepath(params.filepath);
      return getAudioFromAudio(
        params.id,
        safeAudioFilepath,
        signal,
        onProgress
      );
    case "video":
      const safeVideoFilepath = await getSafeFilepath(params.filepath);
      return getAudioFromVideo(
        params.id,
        safeVideoFilepath,
        signal,
        onProgress
      );
    case "url":
      return getAudioFromUrl(params.id, signal);
    case "karafun":
      return getAudioFromKarafun(params.id, params, ffmpegOptions, signal);
  }
}

export async function getVocalsFilepathFromAudioSource(
  params: AudioSource,
  ffmpegOptions: FFmpegOptions,
  signal: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string | undefined> {
  if (params.type !== "karafun") return;

  return getVocalsFilepathFromKarafun(params.id, params, ffmpegOptions, signal);
}

export async function getVocalsFilepathFromKarafun(
  id: string,
  audioSource: AudioSourceKarafun,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal
): Promise<string | undefined> {
  const stems = await karafun.getKarafunStems(
    audioSource.extractResult,
    ffmpegOptions,
    signal
  );

  const stem = stems.find((s) => s.type === "vocals");
  if (!stem) return;

  return moveFileToLibrary(id, stem.filepath);
}

export async function getAudioFromKarafun(
  id: string,
  audioSource: AudioSourceKarafun,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal
): Promise<string> {
  const stems = await karafun.getKarafunStems(
    audioSource.extractResult,
    ffmpegOptions,
    signal
  );

  const stem = stems.find((s) => s.type === "instruments");
  if (!stem) {
    throw new Error("No instruments stem found");
  }

  return moveFileToLibrary(id, stem.filepath);
}

export async function getAudioFromUrl(
  id: string,
  signal: AbortSignal
): Promise<string> {
  const fp = filepath(id, MediaMode.Original, FileType.M4A);

  let audio = await client.downloadOriginal(id, signal);
  if (!audio) {
    audio = await youtube.downloadAudio(id, signal);
  }
  await fs.promises.writeFile(fp, audio);
  return fp;
}

export async function getFilepathFromVideoSource(
  id: string,
  videoSource: VideoSource,
  duration: number,
  ffmpegOptions: FFmpegOptions,
  signal: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string> {
  switch (videoSource.type) {
    case "url":
      return getVideoFromUrlSource(id, videoSource, ffmpegOptions, signal);
    case "video":
      return getVideoFromVideoSource(
        id,
        videoSource,
        duration,
        ffmpegOptions,
        signal,
        onProgress
      );
    case "image":
      return getVideoFromImageSource(
        id,
        videoSource,
        duration,
        ffmpegOptions,
        signal,
        onProgress
      );
    case "color":
      return getVideoFromColorSource(
        id,
        videoSource,
        duration,
        ffmpegOptions,
        signal,
        onProgress
      );
    case "karafun":
      return getVideoFromKarafunSource(
        id,
        videoSource,
        duration,
        ffmpegOptions,
        signal,
        onProgress
      );
    case "auto":
      throw new Error("Auto video source is not supported");
  }
}

export async function getAlignmentFromSubtitlesSource(
  subtitlesSource: SubtitlesSource
): Promise<Alignment2[]> {
  switch (subtitlesSource.type) {
    case "karafun":
      return getAlignmentFromKarafunSource(subtitlesSource);
    case "lrc":
      return getAlignmentFromLRCSource(subtitlesSource);
    case "id3":
      return getAlignmentFromID3Source(subtitlesSource);
    case "auto":
      throw new Error("Not implemented");
  }
}

export async function getAlignmentFromKarafunSource(
  subtitlesSource: SubtitlesSourceKarafun
): Promise<Alignment2[]> {
  return karafun.getKarafunSubtitles(subtitlesSource.extractResult);
}

export async function getVideoFromKarafunSource(
  id: string,
  videoSource: VideoSourceKarafun,
  duration: number,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string> {
  const videos = await karafun.getKarafunVideos(
    videoSource.extractResult,
    duration,
    ffmpegOptions,
    signal
  );

  if (!videos.length) {
    throw new Error("No videos found");
  }

  return moveFileToLibrary(id, videos[0].filepath);
}

export async function getVideoFromColorSource(
  id: string,
  videoSource: VideoSourceColor,
  duration: number,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string> {
  const cwd = join(LIBRARY_PATH, id);
  const output = await tmpName({
    dir: cwd,
    prefix: "video-",
    postfix: FileType.MP4,
  });
  const video = await getDummyVideo(
    duration,
    videoSource.color,
    videoSource.resolution,
    ffmpegOptions,
    signal,
    onProgress
  );
  await fs.promises.copyFile(video, output);
  return output;
}

export async function getVideoFromUrlSource(
  id: string,
  videoSource: VideoSourceUrl,
  ffmpegOptions: FFmpegOptions,
  signal: AbortSignal
): Promise<string> {
  const cwd = join(LIBRARY_PATH, id);

  const video = await youtube.downloadVideo(videoSource.id, signal);
  const tmpVideo = await tmpName({
    dir: cwd,
    prefix: "video-",
    postfix: FileType.MP4,
  });
  await fs.promises.writeFile(tmpVideo, video);

  const video16x9 = await getResolution(tmpVideo, videoSource.aspectRatio, {
    signal,
    ffmpegOptions,
  });

  const outputVideo = await tmpName({
    dir: cwd,
    prefix: "video-",
    postfix: FileType.MP4,
  });
  await renameOrCopy(video16x9, outputVideo);
  return outputVideo;
}

export async function getVideoFromVideoSource(
  id: string,
  videoSource: VideoSourceVideo,
  duration: number,
  ffmpegOptions: FFmpegOptions,
  signal: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string> {
  const cwd = join(LIBRARY_PATH, id);
  const videoPath = await tmpName({
    dir: cwd,
    prefix: "original-",
    postfix: FileType.MP4,
  });

  // Get input video duration
  const inputDuration = await ffprobe.duration(videoSource.filepath);

  let args: string[] = [];

  const videoFilter = await getPadVideoFilterByAspectRatioOrResolution(
    videoSource.filepath,
    videoSource.aspectRatio,
    videoSource.resolution
  );

  if (inputDuration < duration) {
    // Video is shorter than target duration - use loop
    args = [
      "-stream_loop",
      "-1",
      "-i",
      videoSource.filepath,
      ...videoFilter,
      "-t",
      duration.toString(),
      "-an",
      "-c:v",
      "libx264",
      ...ffmpegArgsFromOptions(ffmpegOptions),
      videoPath,
    ];
  } else if (inputDuration === duration) {
    args = [
      "-i",
      videoSource.filepath,
      ...videoFilter,
      "-an",
      "-c:v",
      "libx264",
      ...ffmpegArgsFromOptions(ffmpegOptions),
      videoPath,
    ];
  } else if (inputDuration > duration) {
    // Video is longer than target duration - trim to duration
    args = [
      "-i",
      videoSource.filepath,
      ...videoFilter,
      "-t",
      duration.toString(),
      "-an",
      "-c:v",
      "libx264",
      ...ffmpegArgsFromOptions(ffmpegOptions),
      videoPath,
    ];
  }

  await ffmpeg.exec(args, { cwd, signal }, onProgress, duration);

  return videoPath;
}

export async function getFileOrUrlBuffer(fileOrUrl: string): Promise<Buffer> {
  if (fileOrUrl.startsWith("http")) {
    return got(fileOrUrl).buffer();
  }
  return fs.promises.readFile(safeFilePath(fileOrUrl));
}

export async function getVideoFromImageSource(
  id: string,
  imageSource: VideoSourceImage,
  duration: number,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal,
  onProgress?: ProgressFunc
): Promise<string> {
  const filepath = await getJPEGImageFilepath(id, imageSource.url);
  const videoPath = await generateImageVideo(
    id,
    filepath,
    duration,
    {
      aspectRatio: imageSource.aspectRatio,
      resolution: imageSource.resolution,
      objectFit: "contain",
    },
    ffmpegOptions,
    signal,
    onProgress
  );
  return videoPath;
}

export async function saveImageFile(id: string, file: File): Promise<string> {
  const cwd = join(LIBRARY_PATH, id);
  const ext = path.extname(file.name).toLowerCase();
  const imagePath = await tmpName({
    dir: cwd,
    prefix: "image-",
    postfix: ext,
  });
  await fs.promises.copyFile(file.path, imagePath);
  const imageUrl = `file://${imagePath}`;
  await lib.updateSong(id, { image: imageUrl });
  return imageUrl;
}

export async function copyImage(id: string, from: string) {
  const cwd = join(LIBRARY_PATH, id);
  const ext = path.extname(from).toLowerCase();
  const imagePath = await tmpName({
    dir: cwd,
    prefix: "image-",
    postfix: ext,
  });
  await fs.promises.copyFile(from, imagePath);
  const imageUrl = `file://${imagePath}`;
  return imageUrl;
}

export async function saveImage(id: string, imageUrl: string) {
  const cwd = join(LIBRARY_PATH, id);
  const filepath = await tmpName({
    dir: cwd,
    prefix: "image-",
    postfix: FileType.JPEG,
  });

  const image = await got(imageUrl).buffer();
  await fs.promises.writeFile(filepath, image);
  return `file://${filepath}`;
}

export function safeFileUrl(filepath: string): string {
  if (filepath.startsWith("file://") || filepath.startsWith("http")) {
    return filepath;
  }

  return `file://${filepath}`;
}

export function safeFilePath(filepath: string): string {
  if (filepath.startsWith("file://")) {
    return filepath.slice(7);
  }

  return filepath;
}

export async function getCreatedAt(id: string) {
  try {
    const stats = await fs.promises.stat(join(LIBRARY_PATH, id));
    return stats.birthtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function removeDuplicateAlignments(id: string) {
  const alignments = await getAlignments2(id);
  const uniqueAlignments = _.uniqBy(alignments, (a) => a.modelId).filter(
    (a) => a.modelId !== "word-hq"
  );
  await lib.updateSong(id, { alignments2: uniqueAlignments });
}

export async function getAlignments2(id: string): Promise<Alignment2[]> {
  const song = await lib.getSong(id);
  if (!song?.alignments2) {
    return [];
  }
  return sortAlignments(song.alignments2);
}

export function filepath(id: string, mode: Mode | string, file: FileType) {
  return join(LIBRARY_PATH, id, `${mode}${file}`);
}

export function fileurl(id: string, mode: Mode, file: FileType) {
  const fpath = filepath(id, mode, file);
  return `file://${fpath}`;
}

export async function getInstrumentsVocals(id: string, signal?: AbortSignal) {
  const newInstrumentsFile = filepath(id, MediaMode.Instruments, FileType.M4A);
  const newVocalsFile = filepath(id, MediaMode.Vocals, FileType.M4A);

  if ((await exists(newInstrumentsFile)) && (await exists(newVocalsFile))) {
    return {
      instrumentsFile: newInstrumentsFile,
      vocalsFile: newVocalsFile,
    };
  }
}

export async function getVideo2(
  id: string,
  videoPath: string,
  audioPath: string,
  signal?: AbortSignal
): Promise<string> {
  const cwd = join(LIBRARY_PATH, id);
  const outputFull = await tmpName({
    dir: cwd,
    prefix: "video-",
    postfix: FileType.MP4,
  });

  await ffmpeg.exec(
    [
      "-y",
      "-i",
      videoPath,
      "-i",
      audioPath,
      "-vcodec",
      "copy",
      "-acodec",
      "copy",
      "-map",
      "0:0",
      "-map",
      "1:0",
      "-strict",
      "-2",
      outputFull,
    ],
    { cwd, signal }
  );

  return outputFull;
}

export async function isAspectRatio(
  filepath: string,
  aspectRatio: AspectRatio
): Promise<boolean> {
  const resolution = await ffprobe.resolution(filepath);
  if (!resolution) {
    rollbar.warn("Failed to get resolution", { filepath });
    return true;
  }
  const givenAspectRatio = resolution.width / resolution.height;
  const targetAspectRatio = aspectRatio.width / aspectRatio.height;

  // Compare aspect ratios with a small tolerance to handle floating point precision
  const tolerance = 0.01;
  return Math.abs(givenAspectRatio - targetAspectRatio) <= tolerance;
}

export async function getResolution(
  videoPath: string,
  aspectRatio: AspectRatio,
  options: BasicFFmpegOptions
) {
  const shouldResize = await isAspectRatio(videoPath, aspectRatio);

  if (!shouldResize) {
    return videoPath;
  }

  return addPaddingToVideo(videoPath, aspectRatio, options);
}

export async function renameOrCopy(src: string, dst: string) {
  try {
    await fs.promises.rename(src, dst);
    return dst;
  } catch {
    await fs.promises.copyFile(src, dst);
    return dst;
  }
}

export async function setLyrics(id: string, lyrics: string): Promise<void> {
  if (lyrics) {
    await lib.updateSong(id, { lyrics });
  }
}

export async function moveLyricsToMetadata(id: string) {
  const fp = filepath(id, MetadataMode.Lyrics, FileType.TEXT);
  if (await exists(fp)) {
    let lyrics = await fs.promises.readFile(fp, "utf8");
    lyrics = lyrics.slice(0, 9999);
    await setLyrics(id, lyrics);
    return lyrics;
  }
}

export async function getLyricsByTitle(title: string, signal?: AbortSignal) {
  if (title && title.split(" ").length > 1) {
    const lyrics = (await lyricsFinder(title, undefined, signal)) || "";
    return lyrics.trim();
  }
}

export function getLyricsByAlignments(alignments: Alignment2[]) {
  if (alignments.length) {
    const alignment = alignments.find((a) => a.modelId !== "line");
    if (alignment && alignment.mode === "word") {
      const lyrics = lyricsFromAlignment(alignment);
      return lyrics;
    } else if (alignment && alignment.mode === "subword") {
      const lyrics = lyricsFromSubwordAlignment(alignment);
      return lyrics;
    }
  }
}

export function isRTL(lang?: string): boolean {
  return ["he", "iw", "ar", "fa", "ku", "dv"].includes(lang!);
}

export async function getLanguage(
  id: string,
  text?: string,
  force: boolean = false
): Promise<string | undefined> {
  try {
    const song = await lib.getSong(id);
    if (!force && song?.lang && song.lang.length === 2) {
      return song.lang;
    }
    if (!text) return;
    const lang = await gt.language(text);
    if (lang) {
      return lang;
    }
  } catch (e) {
    report.error(e as any);
    return undefined;
  }
}

export async function safemkdir(dirpath: string) {
  const ex = await exists(dirpath);

  if (ex) {
    return;
  }

  try {
    await fs.promises.mkdir(dirpath);
    return;
  } catch (e) {
    // report.error(e as Error);
  }

  try {
    await mkdirp(dirpath);
    return;
  } catch (e) {
    // report.error(e as Error);
  }

  try {
    await fs.promises.mkdir(dirpath, { recursive: true });
    return;
  } catch (e) {
    // report.error(e as Error);
  }

  throw new Error("Failed to create directory: " + dirpath);
}

export async function install(
  youtubeEnabled: boolean,
  onProgress: ProgressFunc
) {
  console.log("platform", platform);
  console.log("arch", arch);
  console.log("release", release);
  console.log("totalmem", os.totalmem() / 1024 ** 2);
  console.log("freemem", os.freemem() / 1024 ** 2);
  console.log("cpus", os.cpus().length);

  if (!isSupported()) {
    throw new Error("unsupported platform");
  }

  try {
    if (await exists(TMP_PATH)) {
      await fs.promises.rm(TMP_PATH, { recursive: true });
    }
  } catch (e) {
    console.log("failed to rm tmp dir", e);
  }

  try {
    await safemkdir(ROOT_PATH);
    await safemkdir(BINARIES_PATH);
    await safemkdir(DOWNLOAD_PATH);
    await safemkdir(FONTS_PATH);
    await safemkdir(CACHE_PATH);
    await safemkdir(TMP_PATH);
  } catch (e) {
    report.error(e as Error);
    throw new Error(
      "Failed to create directories, please change the library folder or run Youka as administrator"
    );
  }

  const promises: Promise<void>[] = [];
  promises.push(initFonts());

  const binaries = [ffmpeg, ffprobe, soundstretch, audiowaveform];
  if (youtubeEnabled) {
    binaries.push(ytdlp);
  }
  let transferred = Array(binaries.length);
  let total = Array(binaries.length);

  binaries.map((b, i) =>
    b.on("progress", (p) => {
      total[i] = p.total;
      transferred[i] = p.transferred;
      const to = total.reduce((a, b) => a + b, 0);
      const tr = transferred.reduce((a, b) => a + b, 0);
      const pr = (tr / to) * 100;
      onProgress(Math.floor(pr));
    })
  );

  binaries.map((b) => b.install());
  await Promise.all(promises);
  await lib.init();
}

export function lineAlignmentFromWordAlignment(
  word: Alignment2Word
): Alignment2Line | undefined {
  const alignment: IAlignmentItemLine[] = [];
  let line = 1;

  word.alignment.forEach((a) => {
    const words = word.alignment.filter((l) => l.line === line);
    if (words.length === 0) return;
    const start = words[0].start;
    const end = words[words.length - 1].end;
    const text = words.map((w) => w.text).join(" ");
    alignment.push({ start, end, text, line });
    line += 1;
  });

  if (!alignment.length) return;

  return {
    id: uuidv4(),
    mode: "line",
    modelId: "auto",
    alignment,
    createdAt: new Date().toISOString(),
  };
}

export async function getAlignment(
  id: string,
  lyrics?: string,
  force?: boolean,
  modelId?: string,
  signal?: AbortSignal
) {
  if (lyrics) {
    return getAlignmentWithAlignment(id, lyrics, force, modelId, signal);
  }

  return getAlignmentWithTranscription(id, force, modelId, signal);
}

export async function getAlignment2(id: string, modelId?: string) {
  const alignments = await getAlignments2(id);
  const alignment = alignments.find((a) => a.modelId === modelId);
  return alignment;
}

export async function getAlignmentWithAlignment(
  id: string,
  lyrics: string,
  force?: boolean,
  modelId?: string,
  signal?: AbortSignal
): Promise<Alignment2 | undefined> {
  if (!force) {
    const a = await getAlignment2(id, modelId);
    if (a) return a;
  }

  const lang = await getLanguage(id, lyrics);
  signal?.throwIfAborted();

  const alignment2 = await client.align(
    id,
    lyrics,
    lang,
    force,
    modelId,
    signal
  );
  signal?.throwIfAborted();

  if (!alignment2) {
    return;
  }

  return alignment2;
}

export async function getAlignmentWithTranscription(
  id: string,
  force?: boolean,
  modelId?: string,
  signal?: AbortSignal
): Promise<Alignment2 | undefined> {
  if (!force) {
    const a = await getAlignment2(id, modelId);
    if (a) return a;
  }
  const alignment2 = await client.align(
    id,
    undefined,
    undefined,
    force,
    modelId,
    signal
  );
  signal?.throwIfAborted();

  if (!alignment2) {
    return;
  }

  return alignment2;
}

export async function setAlignment2(
  id: string,
  alignment: Alignment2,
  replaceByModelId?: boolean
) {
  const song = await lib.getSong(id);
  let alignments2 = song?.alignments2 || [];
  let index;
  if (replaceByModelId) {
    index = alignments2.findIndex((a) => a.modelId === alignment.modelId);
  } else {
    index = alignments2.findIndex((a) => a.id === alignment.id);
  }
  if (index > -1) {
    alignments2[index] = alignment;
  } else {
    alignments2.push(alignment);
  }
  await lib.updateSong(id, { alignments2 });
  return alignments2;
}

export async function saveFile(
  id: string,
  mode: Mode,
  file: FileType,
  buffer: Buffer
): Promise<void> {
  const fp = filepath(id, mode, file);
  return fs.promises.writeFile(fp, buffer);
}

export async function getPeaks(
  id: string,
  stemId: string
): Promise<number[] | undefined> {
  let peaks = await readPeaks(id, stemId);
  if (peaks) return peaks;
  const song = await lib.getSong(id);
  if (!song || !song.stems) return;
  const stem = song.stems.find((s) => s.id === stemId);
  if (!stem) return;
  const wavFilepath = await getWav(stem.filepath);
  const wavUrl = `file://${wavFilepath}`;
  try {
    const analysis = await analyseAudio(wavUrl);
    peaks = Array.from(analysis.peakWaveform);
    await savePeaks(id, stemId, peaks);
    return peaks;
  } catch (e) {
    return getPeaksLegacy(id, wavFilepath);
  }
}

export async function getWav(input: string): Promise<string> {
  const hash = createHash("md5").update(input).digest("hex");
  const filename = `${hash}.wav`;
  const outputFull = join(TMP_PATH, filename);
  if (await exists(outputFull)) return outputFull;
  await ffmpeg.exec(["-y", "-i", input, "-acodec", "pcm_s16le", outputFull]);
  return outputFull;
}

export async function getAudioPitchTempo(
  song: SongMetadata,
  input: string,
  pitch: number,
  tempo: number
) {
  if (pitch === 0 && tempo === 1) {
    return input;
  }
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: FileType.WAV });
  const wavFile = await getWav(input);
  const args = [wavFile, outputFull];
  if (pitch !== 0) args.push(`-pitch=${pitch}`);
  if (tempo > 1) {
    args.push(`-tempo=+${(tempo - 1) * 100}`);
  } else if (tempo < 1) {
    args.push(`-tempo=${(tempo - 1) * 100}`);
  }

  await soundstretch.exec(args, { cwd });

  return outputFull;
}

export async function getVideoPitchTempo(
  song: SongMetadata,
  input: string,
  pitch: number,
  tempo: number
) {
  if (pitch === 0 && tempo === 1) {
    return input;
  }

  const cwd = join(LIBRARY_PATH, song.id);
  const output = `${MediaMode.Pitch}${FileType.MKV}`;
  const outputFull = join(cwd, output);
  const videoPath = getVideoPathFromSong(song);

  await getAudioPitchTempo(song, input, pitch, tempo);

  await ffmpeg.exec(
    [
      "-y",
      "-i",
      videoPath,
      "-i",
      `${MediaMode.Instruments}-${MediaMode.Pitch}${FileType.WAV}`,
      "-map",
      "0:0",
      "-map",
      "1:0",
      "-vcodec",
      "copy",
      "-acodec",
      "copy",
      output,
    ],
    { cwd }
  );

  const url = `file://${outputFull}`;
  return url;
}

export async function padAudioFile(
  id: string,
  input: string,
  output: string,
  start?: number,
  end?: number
) {
  const cwd = join(LIBRARY_PATH, id);
  const args: string[] = ["-y"];
  const filterInputs: string[] = [];
  let inputIndex = 0;

  // If start padding is requested, add silence at the beginning.
  if (start && start > 0) {
    args.push(
      "-f",
      "lavfi",
      "-t",
      start.toString(),
      "-i",
      "anullsrc=r=44100:cl=stereo"
    );
    filterInputs.push(`[${inputIndex}:a]`);
    inputIndex++;
  }

  // Main audio input.
  args.push("-i", input);
  filterInputs.push(`[${inputIndex}:a]`);
  inputIndex++;

  // If end padding is requested, add silence at the end.
  if (end && end > 0) {
    args.push(
      "-f",
      "lavfi",
      "-t",
      end.toString(),
      "-i",
      "anullsrc=r=44100:cl=stereo"
    );
    filterInputs.push(`[${inputIndex}:a]`);
    inputIndex++;
  }

  if (filterInputs.length === 1) {
    // No padding was added; simply copy the file.
    args.push("-c", "copy");
  } else {
    // Concatenate the silence (if any) with the main audio.
    // For example, if both start and end are provided, the filter becomes:
    //   [0:a][1:a][2:a]concat=n=3:v=0:a=1[outa]
    const concatFilter = `${filterInputs.join("")}concat=n=${
      filterInputs.length
    }:v=0:a=1[outa]`;
    args.push("-filter_complex", concatFilter, "-map", "[outa]", "-c:a", "aac");
  }

  args.push(output);

  await ffmpeg.exec(args, { cwd });
}

export async function trimFile(
  id: string,
  input: string,
  output: string,
  start: number,
  end: number
) {
  const cwd = join(LIBRARY_PATH, id);
  await ffmpeg.exec(
    [
      "-y",
      "-ss",
      start.toString(),
      "-to",
      end.toString(),
      "-i",
      input,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      output,
    ],
    { cwd }
  );

  return output;
}

export function shiftAlignment(alignment: Alignment2, time: number) {
  const newAlignment = structuredClone(alignment);
  newAlignment.alignment = newAlignment.alignment.map((a) => ({
    ...a,
    start: a.start + time,
    end: a.end + time,
  }));
  return newAlignment;
}

export function trimAlignment(
  alignment: Alignment2,
  start: number,
  end: number,
  groupId?: string
) {
  const newAlignment = structuredClone(alignment);
  newAlignment.id = randomUUID();
  newAlignment.createdAt = new Date().toISOString();
  newAlignment.modelId = "custom";
  newAlignment.groupId = groupId;
  newAlignment.alignment = newAlignment.alignment
    .filter((a) => a.start >= start && a.end <= end)
    .map((a) => ({
      ...a,
      start: a.start - start,
      end: a.end - start,
    }));
  return newAlignment;
}

export async function trim({
  song,
  splitModelId,
  videoId,
  start,
  end,
  alignmentId,
}: InputTrim) {
  const dir = join(LIBRARY_PATH, song.id);

  const vocalsInput = song.stems.find(
    (s) => s.modelId === splitModelId && s.type === "vocals"
  )?.filepath;

  const instrumentsInput = song.stems.find(
    (s) => s.modelId === splitModelId && s.type === "instruments"
  )?.filepath;

  const originalInput = song.stems.find(
    (s) => s.type === "original" && s.modelId === "original"
  )?.filepath;

  const videoInput = song.videos.find((v) => v.id === videoId)?.filepath;

  let vocalsFilepath: string | undefined;
  let instrumentsFilepath: string | undefined;
  let originalFilepath: string | undefined;
  let videoFilepath: string | undefined;

  const groupId = randomUUID();

  const tasks: Promise<void>[] = [];

  if (vocalsInput) {
    const fn = async () => {
      vocalsFilepath = await tmpName({ dir, postfix: FileType.M4A });
      await trimFile(song.id, vocalsInput, vocalsFilepath, start, end);
    };
    tasks.push(fn());
  }

  if (instrumentsInput) {
    const fn = async () => {
      instrumentsFilepath = await tmpName({ dir, postfix: FileType.M4A });
      await trimFile(
        song.id,
        instrumentsInput,
        instrumentsFilepath,
        start,
        end
      );
    };
    tasks.push(fn());
  }

  if (originalInput) {
    const fn = async () => {
      originalFilepath = await tmpName({ dir, postfix: FileType.M4A });
      await trimFile(song.id, originalInput, originalFilepath, start, end);
    };
    tasks.push(fn());
  }

  if (videoInput) {
    const fn = async () => {
      videoFilepath = await tmpName({ dir, postfix: FileType.MP4 });
      await trimFile(song.id, videoInput, videoFilepath, start, end);
    };
    tasks.push(fn());
  }

  let alignment: Alignment2 | undefined;
  if (alignmentId) {
    const fn = async () => {
      const originalAlignment = song.alignments2?.find(
        (a) => a.id === alignmentId
      );
      if (!originalAlignment) {
        throw new Error("original alignment not found");
      }
      alignment = trimAlignment(originalAlignment, start, end, groupId);
    };
    tasks.push(fn());
  }

  await Promise.all(tasks);

  let vocalsStem: ISongStem | undefined;
  let instrumentsStem: ISongStem | undefined;
  let originalStem: ISongStem | undefined;
  let video: ISongVideo | undefined;

  if (originalFilepath) {
    originalStem = await addStem(song.id, {
      type: "original",
      modelId: "custom",
      filepath: originalFilepath,
      groupId,
    });
  }
  if (videoFilepath) {
    video = await addVideo(song.id, {
      filepath: videoFilepath,
      type: "custom",
      groupId,
    });
  }

  if (instrumentsFilepath) {
    instrumentsStem = await addStem(song.id, {
      type: "instruments",
      modelId: "custom",
      filepath: instrumentsFilepath,
      groupId,
    });
  }

  if (vocalsFilepath) {
    vocalsStem = await addStem(song.id, {
      type: "vocals",
      modelId: "custom",
      filepath: vocalsFilepath,
      groupId,
    });
  }

  if (alignment) {
    await setAlignment2(song.id, alignment);
  }

  const newSong = await lib.getSong(song.id);
  if (!newSong) {
    throw new Error("song not found");
  }

  newSong.selectedVideo = video?.id || newSong.selectedVideo;
  newSong.selectedInstruments =
    instrumentsStem?.id || newSong.selectedInstruments;
  newSong.selectedVocals = vocalsStem?.id || newSong.selectedVocals;
  newSong.selectedAlignment = alignment?.id || newSong.selectedAlignment;

  await lib.updateSong(song.id, newSong);

  return {
    song: newSong,
    vocalsStem,
    instrumentsStem,
    originalStem,
    video,
    alignment,
    groupId,
  };
}

export async function addKaraokeIntro(
  {
    song,
    videoId,
    stemModelId,
    videoSource,
    duration,
    ffmpegOptions,
    alignmentId,
    transition,
  }: InputAddKaraokeIntro,
  onProgress: ProgressFunc,
  signal: AbortSignal
) {
  const vocalsInput = song.stems.find(
    (s) => s.modelId === stemModelId && s.type === "vocals"
  )?.filepath;

  const instrumentsInput = song.stems.find(
    (s) => s.modelId === stemModelId && s.type === "instruments"
  )?.filepath;

  const originalInput = song.stems.find(
    (s) => s.type === "original" && s.modelId === "original"
  )?.filepath;

  const videoInput = song.videos.find((v) => v.id === videoId)?.filepath;

  const groupId = randomUUID();

  const tasks: Promise<void>[] = [];

  let vocalsFilepath: string | undefined;
  let instrumentsFilepath: string | undefined;
  let originalFilepath: string | undefined;
  let videoFilepath: string | undefined;

  if (vocalsInput) {
    const fn = async () => {
      vocalsFilepath = await tmp.tmpName({
        prefix: "audio-",
        postfix: ".m4a",
      });
      await padAudio(vocalsInput, vocalsFilepath, duration, {
        signal,
        ffmpegOptions,
      });
    };
    tasks.push(fn());
  }

  if (instrumentsInput) {
    const fn = async () => {
      instrumentsFilepath = await tmp.tmpName({
        prefix: "audio-",
        postfix: ".m4a",
      });
      await padAudio(instrumentsInput, instrumentsFilepath, duration, {
        signal,
        ffmpegOptions,
      });
    };
    tasks.push(fn());
  }

  if (originalInput) {
    const fn = async () => {
      originalFilepath = await tmp.tmpName({
        prefix: "audio-",
        postfix: ".m4a",
      });
      await padAudio(originalInput, originalFilepath, duration, {
        signal,
        ffmpegOptions,
      });
    };
    tasks.push(fn());
  }

  if (videoInput) {
    const fn = async () => {
      const introInput = await getFilepathFromVideoSource(
        song.id,
        videoSource,
        duration,
        ffmpegOptions,
        signal
      );

      videoFilepath = await tmp.tmpName({
        prefix: "video-",
        postfix: ".mp4",
      });
      await joinVideosWithRencoding(
        introInput,
        videoInput,
        videoFilepath,
        transition,
        {
          signal,
          ffmpegOptions: { ...ffmpegOptions, preset: "ultrafast" },
          onProgress,
        }
      );
    };
    tasks.push(fn());
  }

  let alignment: Alignment2 | undefined;
  if (alignmentId) {
    const originalAlignment = song.alignments2?.find(
      (a) => a.id === alignmentId
    );
    if (!originalAlignment) {
      throw new Error("original alignment not found");
    }
    alignment = shiftAlignment(originalAlignment, duration);
    alignment.id = randomUUID();
    alignment.createdAt = new Date().toISOString();
    alignment.modelId = "custom";
    alignment.groupId = groupId;
    await setAlignment2(song.id, alignment);
  }

  await Promise.all(tasks);

  let originalStem: ISongStem | undefined;
  let vocalsStem: ISongStem | undefined;
  let instrumentsStem: ISongStem | undefined;
  let video: ISongVideo | undefined;

  if (vocalsFilepath) {
    vocalsStem = await addStem(song.id, {
      type: "vocals",
      modelId: "custom",
      filepath: vocalsFilepath,
      groupId,
    });
  }

  if (originalFilepath) {
    originalStem = await addStem(song.id, {
      type: "original",
      modelId: "custom",
      filepath: originalFilepath,
      groupId,
    });
  }

  if (instrumentsFilepath) {
    instrumentsStem = await addStem(song.id, {
      type: "instruments",
      modelId: "custom",
      filepath: instrumentsFilepath,
      groupId,
    });
  }

  if (videoFilepath) {
    video = await addVideo(song.id, {
      filepath: videoFilepath,
      type: "custom",
      groupId,
    });
  }

  const newSong = await lib.getSong(song.id);
  if (!newSong) throw new Error("song not found");

  newSong.selectedVideo = video?.id || newSong.selectedVideo;
  newSong.selectedInstruments =
    instrumentsStem?.id || newSong.selectedInstruments;
  newSong.selectedVocals = vocalsStem?.id || newSong.selectedVocals;
  newSong.selectedAlignment = alignment?.id || newSong.selectedAlignment;

  await lib.updateSong(song.id, newSong);

  return {
    song: newSong,
    originalStem,
    vocalsStem,
    instrumentsStem,
    video,
    alignment,
    groupId,
  };
}

export function segmentsFilterComplex(
  segments: TrackSegment[],
  totalDuration: number
): string {
  // Create variables to store the parts of the filter complex
  let filters = [];
  let inputs = [];
  let currentTime = 0;

  segments.forEach((segment, index) => {
    const { start, end } = segment;
    // Calculate the silence needed before the segment
    if (start > currentTime) {
      const silenceDuration = start - currentTime;
      filters.push(
        `anullsrc=r=44100:cl=stereo,atrim=duration=${silenceDuration}[silence${index}];`
      );
      inputs.push(`[silence${index}]`);
    }
    // Add the segment filter
    filters.push(
      `[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[part${index}];`
    );
    inputs.push(`[part${index}]`);
    currentTime = end;
  });

  // Add silence at the end if necessary
  if (currentTime < totalDuration) {
    const silenceDuration = totalDuration - currentTime;
    filters.push(
      `anullsrc=r=44100:cl=stereo,atrim=duration=${silenceDuration}[endsilence];`
    );
    inputs.push(`[endsilence]`);
  }

  // Combine all filters and inputs to form the final filter complex
  const filterComplex =
    filters.join(" ") +
    inputs.join("") +
    `concat=n=${inputs.length}:v=0:a=1[out]`;
  return filterComplex;
}

export async function getVocalsSegmentsFile(
  song: SongMetadata,
  vocalsFile: string,
  segments: TrackSegment[]
) {
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: FileType.M4A });

  const duration = await ffprobe.duration(vocalsFile);
  const filterComplex = segmentsFilterComplex(segments, duration);

  const args = [
    "-i",
    vocalsFile,
    "-filter_complex",
    filterComplex,
    "-map",
    "[out]",
    outputFull,
  ];

  await ffmpeg.exec(args, { cwd });

  return outputFull;
}

export async function saveMergedVocals(
  id: string,
  splitModelId: string,
  alignment: Alignment2
) {
  const song = await lib.getSong(id);
  if (!song) throw new Error("song not found");
  const segments = alignmentToSegments(alignment);
  const hasSegments = segments.length > 0;
  if (hasSegments) {
    let vocalsStem = song.stems.find(
      (s) => s.type === "vocals" && s.modelId === splitModelId
    );
    if (!vocalsStem) {
      vocalsStem = song.stems.find((s) => s.type === "vocals");
    }
    let instrumentsStem = song.stems.find(
      (s) => s.type === "instruments" && s.modelId === splitModelId
    );
    if (!instrumentsStem) {
      instrumentsStem = song.stems.find((s) => s.type === "instruments");
    }

    if (!vocalsStem || !instrumentsStem) throw new Error("missing stems");

    const vocalsSegmentsFile = await getVocalsSegmentsFile(
      song,
      vocalsStem.filepath,
      segments
    );
    const mergedFilepath = await mergeVocalsSegmentsAndInstruments(
      song,
      vocalsSegmentsFile,
      instrumentsStem.filepath
    );

    const stem = await addStem(id, {
      type: "instruments",
      modelId: "custom",
      filepath: mergedFilepath,
    });
    await lib.updateSong(id, { selectedInstruments: stem.id });
    return stem;
  }
}

export async function mergeVocalsSegmentsAndInstruments(
  song: SongMetadata,
  vocalsSegmentsFile: string,
  instrumentalFile: string
) {
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: FileType.M4A });

  const args = [
    "-i",
    instrumentalFile,
    "-i",
    vocalsSegmentsFile,
    "-filter_complex",
    "amerge=inputs=2",
    "-ac",
    "2",
    outputFull,
  ];

  await ffmpeg.exec(args, { cwd });

  return outputFull;
}

export async function exportMedia(
  input: InputExportMedia,
  onProgress: ProgressFunc,
  signal: AbortSignal
) {
  const {
    song,
    preset,
    instrumentsStem,
    vocalsStem,
    video,
    instrumentsVolume,
    vocalsVolume,
    pitch,
    tempo,
    alignment,
    fileType,
    styleOptionsMapping,
    addWatermark,
  } = input;

  const id = song.id;
  const songMetadata = await lib.getSong(id);
  if (!songMetadata) {
    throw new Error("song not found");
  }

  const resolution = await getVideoResolution(song, video.id);

  switch (fileType) {
    case FileType.WAV:
    case FileType.MP3:
      return exportAudio({
        song: songMetadata,
        instrumentsStem,
        vocalsStem,
        instrumentsVolume,
        vocalsVolume,
        pitch,
        tempo,
        fileType,
        onProgress,
        signal,
      });
    case FileType.MP4:
      return exportVideoMp4({
        song: songMetadata,
        preset,
        instrumentsVolume,
        vocalsVolume,
        pitch,
        tempo,
        styleOptionsMapping,
        onProgress,
        signal,
        ffmpegOptions: input.ffmpegOptions,
        instrumentsStem,
        vocalsStem,
        video,
        alignment,
        resolution,
        addWatermark,
      });
    case FileType.MKV:
      return exportVideoMkv({
        song: songMetadata,
        preset,
        styleOptionsMapping,
        instrumentsStem,
        video,
        resolution,
        onProgress,
        signal,
        alignment,
      });
    case FileType.Inandon:
      return exportVideoInandon({
        song: songMetadata,
        preset,
        onProgress,
        signal,
        ffmpegOptions: input.ffmpegOptions,
        instrumentsStem,
        video,
        resolution,
        alignment,
        addWatermark,
        styleOptionsMapping,
      });
    case FileType.ASS:
      if (!alignment) throw new Error("alignment is missing");
      return exportSubtitles(
        songMetadata,
        alignment,
        preset,
        styleOptionsMapping,
        resolution
      );
    case FileType.LRC:
      if (!alignment) throw new Error("alignment is missing");
      return exportLrc(songMetadata, alignment);
    default:
      throw new Error("Unsupported file type: " + fileType);
  }
}

export async function exportLrc(song: ISongProcessed, alignment: Alignment2) {
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({
    dir: cwd,
    prefix: "subtitles-",
    postfix: FileType.ASS,
  });
  const fileName = await getFilename(song, FileType.LRC);
  const downloadFull = join(DOWNLOAD_PATH, fileName);

  const lrc = alignment2Lrc(alignment);

  if (!lrc || lrc === "") {
    throw new Error("Failed to convert subtitles to lrc");
  }

  if (song?.lang && isCyrillic(song?.lang)) {
    const buffer = iconv.encode(lrc, "windows-1251");
    await fs.promises.writeFile(outputFull, buffer);
  } else {
    await fs.promises.writeFile(outputFull, lrc, "utf-8");
  }

  return moveFile(outputFull, downloadFull);
}

export function getSongPath(id: string) {
  const libraryPath = useSettingsStore.getState().libraryPath;
  return join(libraryPath, id);
}

export async function exportSubtitles(
  song: ISongProcessed,
  alignment: Alignment2,
  preset: SubtitlesPreset,
  styleOptionsMapping: SingerToStyleOptionsMapping,
  resolution: Resolution
) {
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({
    dir: cwd,
    prefix: "subtitles-",
    postfix: FileType.ASS,
  });
  const fileName = await getFilename(song, FileType.ASS);
  const downloadFull = join(DOWNLOAD_PATH, fileName);

  const ass = alignmentToAss({
    alignment,
    preset,
    runtime: {
      styleOptionsMapping,
      rtl: isRTL(song.lang),
      lang: song.lang,
      title: song.songTitle || song.title,
      resolution,
      artists: song.artists || [],
    },
  });
  if (!ass) return;

  await fs.promises.writeFile(outputFull, ass.toString(), "utf-8");
  return moveFile(outputFull, downloadFull);
}

interface ExportAudioInput {
  song: ISongProcessed;
  instrumentsStem: ISongStem;
  vocalsStem?: ISongStem;
  instrumentsVolume: number;
  vocalsVolume: number;
  pitch: number;
  tempo: number;
  fileType: FileType.WAV | FileType.MP3;
  onProgress: ProgressFunc;
  signal: AbortSignal;
}
export async function exportAudio({
  song,
  instrumentsStem,
  vocalsStem,
  instrumentsVolume,
  vocalsVolume,
  pitch,
  tempo,
  fileType,
  onProgress,
  signal,
}: ExportAudioInput) {
  const input = await getAudioVolume({
    song,
    instrumentsStem,
    vocalsStem,
    instrumentsVolume,
    vocalsVolume,
    pitch,
    tempo,
  });
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: fileType });
  const output = basename(outputFull);
  const downloadName = await getFilename(song, fileType);
  const downloadFull = join(DOWNLOAD_PATH, downloadName);

  let args;
  if (fileType === FileType.MP3) {
    args = ["-y", "-i", input, "-acodec", "libmp3lame", "-b", "320", output];
  } else if (fileType === FileType.WAV) {
    args = ["-y", "-i", input, output];
  }

  await ffmpeg.exec(args, { cwd, signal }, onProgress);
  return moveFile(outputFull, downloadFull);
}

export async function getFilename(
  song: SongMetadata,
  fileType: FileType
): Promise<string> {
  let title = song.title || song.id;
  title = title.replace(/\n/g, " ");
  const name = filenamify(title, {
    replacement: "",
  });
  const filename = `${name}${fileType}`;
  return filename;
}

export async function moveFile(src: string, dst: string): Promise<string> {
  const out = await copyFile(src, dst);
  if (out !== src) {
    try {
      await fs.promises.unlink(src);
    } catch (e) {
      report.error(e as any);
    }
  }
  return out;
}

export async function copyFile(src: string, dst: string): Promise<string> {
  if (!(await exists(src))) {
    throw new Error("can't find src file");
  }

  for (let i = 0; i < 5; i++) {
    try {
      await fs.promises.copyFile(src, dst);
      return dst;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return src;
}

export async function getWatermarkPath() {
  const imagePath = path.join(CACHE_PATH, "watermark.png");
  const watermark = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAFkAAAAXCAYAAABgWeOzAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAORSURBVHgB1VmNddpADBZ5GYBO0OsEJRs4E5RuQCcITBBngpAJIBOQDcwGyQZ2JwgbqBI+Wvv86WyTYOj33iX4Tn8nZEl3jJh5QkQbqmMn43Y0Gu0oAoO3EL5buiCInZn8c5Wprdj4i4aEGLHmJtIOfBngm9GFQWzKAxszGhqi1Ml4DwzR53GEZwYcnNMF4txOvtI/8uoU8u8pWFMHzyO892Bu2Ffwf4NGbddoNqJ4RReKc0fy9eGDFjlRvpCPVWepgzViFwEfiuIHMEf+S5pSWXi+yvgto6Cy+BRkgMuiOqnOCf3aoJ0FU29C+0Y9wbievKAGwNiX0m1bdTMuZq5qCFhfAjnOkFWL/qrsgD8NiSM2h0iD9ZxbIlnm7oGc9ZH7erX2dRCSAKZNxOA8FOgNybkblG5yTifL8x2QoY4af2BfiilFjM4AQ2IYM+thSGx+fA4ny+eJYY8DenKDNjPW7A6NS0eFeAWCcsC7ArzrgzIvewloVkM7mXFAqGMc0DEFeuZtNnPs3GAwRAVw2aGEyA35GTc3Nx7Kyd7WHPAmhg79QmYy5t62OaAZt9mCGN7ZxgbwJIBuZshHBXRKwzhZ38oM8MXOBa0w9p9eWwy+pdO27NEgWYC5CZiz2pmtwf9Cpweycyl7XlIHcJlOEhnfqWxzVZ7znxu4jglTpSLwjuqXK4q10eMiJdYl064j/1DQnPsQuxTjsgvSoEuoB6460KBDxhOdBjs6HxzhQ9YePnq1YCYGSSFjjRa6OBmhT3Q6g9b1kLsHRy6sjkDhRxVa1BKDXmtQVb/aqgGo17pf5A34Zl2fHutkCyj/JgZt0pG/CnRoSag/Ciqdg5yy4mbPfsi7VSzEqamMbdu9+6c6WRVSMxrvGJwIdT6gKzz/32dq4pHrbZ6j+l1LV6iug74w9Tlqpo1OtcbqpD47khXoyjTzLVviDQl/qVA8B8+oy9Bo0vZrw2UL+Up2OuqKlHDaqB6JUaT+4PqdTkJ2JxYH437WtfBk3A9dDyyQF9ClgZw8WA/vLlB/Gx6OMoMm5/p5IjxbpKeIZMVPas+vB2ypzI8ImjMLsrH/LZI+CCNtqIOrB64FNSNaaRz9SydaCBv7PomTtRDIuKG4k3Rei8etda/s59WJz2B5K+MmdifdEyk1bdUIn3tb1Hk3hA9R6vx9IQRrNKIBwGV60TH2BhV9neNfXecfi7aKfkpU9qPYtdnzB8gjsJlkoV/aAAAAAElFTkSuQmCC",
    "base64"
  );
  const hash = createHash("md5").update(watermark).digest("hex");

  let shouldUpdate = true;
  if (await exists(imagePath)) {
    const currHash = await fileHash(imagePath);
    if (currHash === hash) {
      shouldUpdate = false;
    }
  }

  if (shouldUpdate) {
    await fs.promises.writeFile(imagePath, watermark);
  }

  return imagePath;
}

export function alignmentToSegments(a: Alignment2): TrackSegment[] {
  return a.alignment
    .filter((a) => a.vocals)
    .map((a) => ({
      start: a.start,
      end: a.end,
    }));
}

export interface ExportVideoMp4Input {
  song: ISongProcessed;
  preset: SubtitlesPreset;
  instrumentsVolume: number;
  vocalsVolume: number;
  pitch: number;
  tempo: number;
  styleOptionsMapping: SingerToStyleOptionsMapping;
  onProgress: ProgressFunc;
  signal: AbortSignal;
  ffmpegOptions: FFmpegOptions;
  instrumentsStem: ISongStem;
  vocalsStem?: ISongStem;
  video: ISongVideo;
  resolution: Resolution;
  alignment?: Alignment2;
  addWatermark?: boolean;
}
export async function exportVideoMp4({
  song,
  preset,
  instrumentsVolume,
  vocalsVolume,
  pitch,
  tempo,
  onProgress,
  signal,
  ffmpegOptions,
  instrumentsStem,
  vocalsStem,
  video,
  alignment,
  styleOptionsMapping,
  resolution,
}: ExportVideoMp4Input) {
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: FileType.MP4 });
  const output = basename(outputFull);
  const downloadName = await getFilename(song, FileType.MP4);
  const downloadFull = join(DOWNLOAD_PATH, downloadName);

  if (!alignment) {
    const videoVolume = await getVideoVolume({
      song,
      video,
      instrumentsStem,
      vocalsStem,
      instrumentsVolume,
      vocalsVolume,
      pitch,
      tempo,
      fileType: FileType.MP4,
    });
    return copyFile(join(cwd, videoVolume), downloadFull);
  }

  const ass = await getAss(
    song,
    alignment,
    preset,
    styleOptionsMapping,
    resolution
  );
  const captionsFile = `${alignment.modelId}${FileType.ASS}`;
  const audioInput = await getAudioVolume({
    song,
    instrumentsStem,
    vocalsStem,
    instrumentsVolume,
    vocalsVolume,
    pitch,
    tempo,
  });

  const inputArgs = ["-i", video.filepath, "-i", audioInput];
  const videoFilters = [];
  const videoFilterArgs = [];

  // if (addWatermark) {
  //   const watermarkPath = await getWatermarkPath();
  //   inputArgs.push("-i", watermarkPath);
  //   videoFilters.push(
  //     `[2]lut=a=val*0.5[wm];[wm][0]scale2ref=w='min(iw*5/100,iw)':h='ow/mdar'[wm][vid];[vid][wm]overlay=x=W*0.02:y=W*0.02`
  //   );
  // }

  let videoMap = "0:0";
  if (ass) {
    videoFilters.push(`[${videoMap}]ass=${captionsFile},fps=60[out]`);
    videoMap = "[out]";
  }
  if (tempo !== 1) {
    const pts = 1 / tempo;
    videoFilters.push(`${videoMap}setpts=${pts}*PTS[vfinal]`);
    videoMap = "[vfinal]";
  }
  if (videoFilters.length) {
    videoFilterArgs.push("-filter_complex", videoFilters.join(","));
  }

  const args = [
    "-y",
    ...inputArgs,
    ...videoFilterArgs,
    "-map",
    videoMap,
    "-map",
    "1",
    ...ffmpegArgsFromOptions(ffmpegOptions),
    output,
  ];

  await ffmpeg.exec(args, { cwd, signal }, onProgress);
  return moveFile(outputFull, downloadFull);
}

export function ffmpegArgsFromOptions(options: FFmpegOptions) {
  const args: string[] = [];

  if (options.preset) {
    args.push("-preset", options.preset);
  }
  if (options.crf) {
    args.push("-crf", options.crf.toString());
  }
  if (options.pixFmt) {
    args.push("-pix_fmt", options.pixFmt);
  }

  return args;
}

export async function getAss(
  song: ISongProcessed,
  alignment: Alignment2,
  preset: SubtitlesPreset,
  styleOptionsMapping: SingerToStyleOptionsMapping,
  resolution: Resolution
): Promise<string | undefined> {
  const ass = alignmentToAss({
    alignment,
    preset,
    runtime: {
      styleOptionsMapping,
      rtl: isRTL(song.lang),
      title: song.songTitle || song.title,
      artists: song.artists || [],
      lang: song.lang,
      resolution,
    },
  });
  if (!ass) return;
  const captionsFull = filepath(song.id, alignment.modelId, FileType.ASS);
  await fs.promises.writeFile(captionsFull, ass.toString(), "utf-8");
  return captionsFull;
}

interface ExportVideoMkvInput {
  song: ISongProcessed;
  preset: SubtitlesPreset;
  styleOptionsMapping: SingerToStyleOptionsMapping;
  onProgress: ProgressFunc;
  signal: AbortSignal;
  instrumentsStem: ISongStem;
  video: ISongVideo;
  resolution: Resolution;
  alignment?: Alignment2;
}
export async function exportVideoMkv({
  song,
  preset,
  styleOptionsMapping,
  onProgress,
  signal,
  instrumentsStem,
  video,
  alignment,
  resolution,
}: ExportVideoMkvInput) {
  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: FileType.MKV });
  const output = basename(outputFull);
  const downloadName = await getFilename(song, FileType.MKV);
  const downloadFull = join(DOWNLOAD_PATH, downloadName);

  interface Input {
    filepath: string;
    type: FileType;
    label: string;
  }

  let originalPath: string | undefined;
  if (instrumentsStem.groupId) {
    const stem = song.stems.find(
      (s) => s.groupId === instrumentsStem.groupId && s.type === "original"
    );
    if (stem) {
      originalPath = stem.filepath;
    } else {
      throw new Error("can't find trim stem");
    }
  } else {
    originalPath = getOriginalPathFromSong(song);
  }

  const instrumentsFilepath = await getVideo2(
    song.id,
    video.filepath,
    instrumentsStem.filepath,
    signal
  );

  const inputs: Input[] = [
    {
      filepath: instrumentsFilepath,
      type: FileType.MP4,
      label: "Karaoke",
    },
  ];

  if (originalPath) {
    inputs.push({
      filepath: originalPath,
      type: FileType.M4A,
      label: "Original",
    });
  }

  if (alignment) {
    const assFilepath = await getAss(
      song,
      alignment,
      preset,
      styleOptionsMapping,
      resolution
    );
    if (assFilepath) {
      inputs.push({
        filepath: assFilepath,
        type: FileType.ASS,
        label: "Karaoke",
      });
    }
  }

  const args = ["-y"];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    args.push("-i", input.filepath);
  }

  for (let i = 0; i < inputs.length; i++) {
    args.push("-map", i.toString());
  }

  let aindex = 0;
  let sindex = 0;
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (input.type === FileType.M4A || input.type === FileType.MP4) {
      args.push(`-metadata:s:a:${aindex}`, `language=${input.label}`);
      aindex++;
    } else if (input.type === FileType.ASS) {
      args.push(`-metadata:s:s:${sindex}`, `language=${input.label}`);
      sindex++;
    }
  }

  if (sindex > 0) {
    args.push("-disposition:s:0", "default");
  }

  args.push("-c", "copy", output);

  await ffmpeg.exec(args, { cwd, signal }, onProgress);
  return moveFile(outputFull, downloadFull);
}

export function inandonLangCode(s: string | undefined): string {
  const map: Record<string, string> = {
    zh: "国语",
    en: "英语",
    ja: "日语",
    ko: "韩语",
    vi: "越南语",
    hi: "印度语",
    th: "泰语",
    ms: "马来语",
    my: "缅甸语",
    id: "印尼语",
    in: "印尼语",
    ru: "俄语",
    fr: "法语",
  };
  const unknown = "其他";
  if (s && s in map) return map[s];
  return unknown;
}

interface ExportVideoInandonInput {
  song: ISongProcessed;
  preset: SubtitlesPreset;
  styleOptionsMapping: SingerToStyleOptionsMapping;
  onProgress: ProgressFunc;
  signal: AbortSignal;
  ffmpegOptions: FFmpegOptions;
  instrumentsStem: ISongStem;
  video: ISongVideo;
  resolution: Resolution;
  alignment?: Alignment2;
  addWatermark?: boolean;
}
export async function exportVideoInandon({
  song,
  preset,
  onProgress,
  signal,
  ffmpegOptions,
  instrumentsStem,
  video,
  alignment,
  styleOptionsMapping,
  resolution,
}: ExportVideoInandonInput) {
  let title = song.title || song.id;
  title = title.replace(/\s+-\s+/g, "-");
  const lang = await getLanguage(song.id);
  const langcode = inandonLangCode(lang);

  const names = [title, langcode];
  const filename = filenamify(names.join("-"), {
    replacement: "",
  });

  const cwd = join(LIBRARY_PATH, song.id);
  const outputFull = await tmpName({ dir: cwd, postfix: FileType.MP4 });
  const output = basename(outputFull);
  const downloadName = `${filename}${FileType.MP4}`;
  const downloadFull = join(DOWNLOAD_PATH, downloadName);

  let ass, captionsFile;
  if (alignment) {
    ass = await getAss(
      song,
      alignment,
      preset,
      styleOptionsMapping,
      resolution
    );
    captionsFile = `${alignment.modelId}${FileType.ASS}`;
  }

  let originalPath: string | undefined;
  if (instrumentsStem.groupId) {
    const stem = song.stems.find(
      (s) => s.groupId === instrumentsStem.groupId && s.type === "original"
    );
    if (stem) {
      originalPath = stem.filepath;
    } else {
      throw new Error("can't find trim stem");
    }
  } else {
    originalPath = getOriginalPathFromSong(song);
  }

  const inputArgs = ["-i", video.filepath];
  if (originalPath) {
    inputArgs.push("-i", originalPath);
  }
  if (instrumentsStem.filepath) {
    inputArgs.push("-i", instrumentsStem.filepath);
  }
  const videoFilters = [];
  const videoFilterArgs = [];

  // if (addWatermark) {
  //   const watermarkPath = await getWatermarkPath();
  //   inputArgs.push("-i", watermarkPath);
  //   videoFilters.push(
  //     `[3]lut=a=val*0.5[wm];[wm][0]scale2ref=w='min(iw*5/100,iw)':h='ow/mdar'[wm][vid];[vid][wm]overlay=x=W*0.02:y=W*0.02`
  //   );
  // }

  let videoMap = "0";
  if (ass) {
    videoFilters.push(`[${videoMap}]ass=${captionsFile}[out]`);
    videoMap = "[out]";
  }
  if (videoFilters.length) {
    videoFilterArgs.push("-filter_complex", videoFilters.join(","));
  }

  let args: string[] = [];
  if (originalPath) {
    args = [
      "-y",
      ...inputArgs,
      "-map",
      videoMap,
      "-map",
      "1",
      "-map",
      "2",
      "-metadata:s:a:0",
      "title=Original",
      "-metadata:s:a:1",
      "title=Karaoke",
      ...videoFilterArgs,
      ...ffmpegArgsFromOptions(ffmpegOptions),
      output,
    ];
  } else {
    args = [
      "-y",
      ...inputArgs,
      "-map",
      videoMap,
      "-map",
      "1",
      "-metadata:s:a:0",
      "title=Karaoke",
      ...videoFilterArgs,
      ...ffmpegArgsFromOptions(ffmpegOptions),
      output,
    ];
  }

  await ffmpeg.exec(args, { cwd, signal }, onProgress);
  return moveFile(outputFull, downloadFull);
}

export async function fileHash(filepath: string) {
  const buff = await fs.promises.readFile(filepath);
  const hash = createHash("md5").update(buff).digest("hex");
  return hash;
}

export async function changeBackground(
  { song, videoSource, duration, ffmpegOptions }: InputChangeBackground,
  onProgress: ProgressFunc,
  signal: AbortSignal
) {
  const videoPath = await getFilepathFromVideoSource(
    song.id,
    videoSource,
    duration,
    ffmpegOptions,
    signal,
    onProgress
  );

  const video = await addVideo(song.id, {
    filepath: videoPath,
    type: "custom",
  });

  await lib.updateSong(song.id, { selectedVideo: video.id });
}

export function createVideoObject(
  filepath: string,
  type: VideoType,
  resolution?: Resolution
) {
  return {
    id: randomUUID(),
    filepath,
    createdAt: new Date().toISOString(),
    resolution,
    type,
  };
}

export async function addVideo(
  songId: string,
  { filepath, resolution, type, groupId }: Omit<ISongVideo, "id" | "createdAt">
) {
  if (!(await exists(filepath))) {
    throw new Error("file not found");
  }

  const song = await lib.getSong(songId);
  if (!song) {
    throw new Error("song not found");
  }

  if (!resolution) {
    resolution = await ffprobe.resolution(filepath);
  }

  const video: ISongVideo = {
    id: randomUUID(),
    filepath,
    createdAt: new Date().toISOString(),
    resolution,
    type,
    groupId,
  };

  song.videos = song.videos || [];
  song.videos.push(video);
  await lib.updateSong(songId, song);

  return video;
}

export async function createStemObject(
  type: StemType,
  modelId: string,
  filepath: string
) {
  return {
    id: randomUUID(),
    type,
    modelId,
    filepath,
    createdAt: new Date().toISOString(),
  };
}

export async function addStem(
  songId: string,
  { type, modelId, filepath, groupId }: Omit<ISongStem, "id" | "createdAt">
) {
  if (!(await exists(filepath))) {
    throw new Error("file not found");
  }

  const song = await lib.getSong(songId);
  if (!song) {
    throw new Error("song not found");
  }

  const stem: ISongStem = {
    id: randomUUID(),
    type,
    modelId,
    filepath,
    groupId,
  };

  song.stems = song.stems || [];
  song.stems.push(stem);
  await lib.updateSong(songId, song);
  return stem;
}

export async function getVideoPath(id: string) {
  const song = await lib.getSong(id);
  if (!song) return filepath(id, MediaMode.Video, FileType.MP4);
  const video = song.videos?.find((v) => v.id === song.selectedVideo);
  if (!video) {
    return filepath(id, MediaMode.Video, FileType.MP4);
  }
  return safeFilePath(video.filepath);
}

export async function generateImageVideo(
  id: string,
  filepath: string,
  duration: number,
  videoOptions: VideoOptions,
  ffmpegOptions: FFmpegOptions,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void
) {
  const cwd = join(LIBRARY_PATH, id);
  const videoPath = await tmpName({
    dir: cwd,
    prefix: "video-",
    postfix: FileType.MP4,
  });

  const videoFilter = await getPadVideoFilterByAspectRatioOrResolution(
    filepath,
    videoOptions.aspectRatio,
    videoOptions.resolution,
    ffmpegOptions.fps
  );

  const args = [
    "-loop",
    "1",
    "-i",
    filepath,
    ...videoFilter,
    "-c:v",
    "libx264",
    "-t",
    duration.toString(),
    ...ffmpegArgsFromOptions(ffmpegOptions),
    videoPath,
  ];

  await ffmpeg.exec(args, { cwd, signal }, onProgress, duration);

  return videoPath;
}

export async function getAudioFromAudio(
  id: string,
  input: string,
  signal: AbortSignal,
  onProgress?: ProgressFunc
) {
  const cwd = join(LIBRARY_PATH, id);
  const filepath = await tmpName({
    dir: cwd,
    prefix: "audio-",
    postfix: FileType.M4A,
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
    filepath,
  ];

  await ffmpeg.exec(args, { cwd, signal }, onProgress);

  return filepath;
}

export async function convertVideo(
  id: string,
  input: string,
  signal: AbortSignal,
  ffmpegPreset: FFmpegPreset,
  onProgress?: (progress: number) => void
) {
  const cwd = join(LIBRARY_PATH, id);
  const filepath = await tmpName({
    dir: cwd,
    prefix: "video-",
    postfix: FileType.MP4,
  });

  const args = [
    "-y",
    "-i",
    input,
    "-preset",
    ffmpegPreset,
    "-c:v",
    "libx264",
    "-an",
    filepath,
  ];
  await ffmpeg.exec(args, { cwd, signal }, onProgress);

  return filepath;
}

export async function getAudioFromVideo(
  id: string,
  input: string,
  signal: AbortSignal,
  onProgress?: (progress: number) => void
) {
  const cwd = join(LIBRARY_PATH, id);
  const filepath = await tmpName({
    dir: cwd,
    prefix: "audio-",
    postfix: FileType.M4A,
  });

  const args = [
    "-y",
    "-i",
    input,
    "-vn",
    "-c:a",
    "aac",
    "-b:a",
    "320k",
    filepath,
  ];

  await ffmpeg.exec(args, { cwd, signal }, onProgress);

  return filepath;
}

interface GetAudioVolumeInput {
  song: SongMetadata;
  instrumentsStem: ISongStem;
  instrumentsVolume: number;
  vocalsStem?: ISongStem;
  vocalsVolume?: number;
  pitch: number;
  tempo: number;
}

export async function getAudioVolume({
  song,
  instrumentsStem,
  vocalsStem,
  instrumentsVolume,
  vocalsVolume,
  pitch,
  tempo,
}: GetAudioVolumeInput): Promise<string> {
  if (pitch === 0 && tempo === 1) {
    if (instrumentsVolume === 1 && vocalsVolume === 1) {
      const stem = getOriginalPathFromSong(song); // `${MediaMode.Original}${FileType.M4A}`;
      if (stem) {
        return stem;
      } else {
        return instrumentsStem.filepath;
      }
    }
    if (instrumentsVolume === 1 && vocalsVolume === 0) {
      // return getInstrumentsPathFromSong(song); // `${MediaMode.Instruments}${FileType.M4A}`;
      return instrumentsStem.filepath;
    }
    if (vocalsStem && instrumentsVolume === 0 && vocalsVolume === 1) {
      // return getVocalsPathFromSong(song); // `${MediaMode.Vocals}${FileType.M4A}`;
      return vocalsStem.filepath;
    }
  }

  const cwd = join(LIBRARY_PATH, song.id);
  const output = `${MediaMode.InstrumentsVocals}${FileType.M4A}`;

  let args: string[] = [];
  if (vocalsStem && vocalsVolume) {
    let [instruments, vocals] = await Promise.all([
      getAudioPitchTempo(song, instrumentsStem.filepath, pitch, tempo),
      getAudioPitchTempo(song, vocalsStem.filepath, pitch, tempo),
    ]);
    args = [
      "-y",
      "-i",
      instruments,
      "-i",
      vocals,
      "-filter_complex",
      `[0:a]volume=${instrumentsVolume}[a0];[1:a]volume=${vocalsVolume}[a1];[a0][a1]amix=2[aout]`,
      "-map",
      "[aout]",
      output,
    ];
  } else {
    const instruments = await getAudioPitchTempo(
      song,
      instrumentsStem.filepath,
      pitch,
      tempo
    );
    args = [
      "-y",
      "-i",
      instruments,
      "-filter_complex",
      `[0:a]volume=${instrumentsVolume}[aout]`,
      "-map",
      "[aout]",
      output,
    ];
  }

  await ffmpeg.exec(args, { cwd });
  return output;
}

export function getVideoPathFromSong(song: SongMetadata) {
  let video = song.videos?.find((v) => v.id === song.selectedVideo);
  if (!video) {
    video = song.videos?.[0];
  }
  if (!video) {
    throw new Error("video not found");
  }
  return safeFilePath(video.filepath);
}

export function getOriginalPathFromSong(song: SongMetadata) {
  const stem = song.stems?.find((s) => s.type === "original");

  if (!stem) return;

  return safeFilePath(stem.filepath);
}

export function getInstrumentsPathFromSong(song: SongMetadata) {
  let stem = song.stems?.find((s) => s.id === song.selectedInstruments);

  if (!stem) {
    stem = song.stems?.find((s) => s.type === "instruments");
  }

  if (!stem) {
    throw new Error("instruments stem not found");
  }

  return safeFilePath(stem.filepath);
}

export function getVocalsPathFromSong(song: SongMetadata) {
  let stem = song.stems?.find((s) => s.id === song.selectedVocals);
  if (!stem) {
    stem = song.stems?.find((s) => s.type === "vocals");
  }
  if (!stem) {
    throw new Error("vocals stem not found");
  }
  return safeFilePath(stem.filepath);
}

interface GetVideoVolumeInput {
  song: SongMetadata;
  video: ISongVideo;
  instrumentsStem: ISongStem;
  instrumentsVolume: number;
  vocalsStem?: ISongStem;
  vocalsVolume?: number;
  pitch: number;
  tempo: number;
  fileType: FileType.MKV | FileType.MP4;
}

export async function getVideoVolume({
  song,
  video,
  instrumentsStem,
  vocalsStem,
  instrumentsVolume,
  vocalsVolume,
  pitch,
  tempo,
  fileType,
}: GetVideoVolumeInput): Promise<string> {
  const cwd = join(LIBRARY_PATH, song.id);
  const output = `${MediaMode.InstrumentsVocals}${fileType}`;

  const audioInput = await getAudioVolume({
    song,
    instrumentsStem,
    vocalsStem,
    instrumentsVolume,
    vocalsVolume,
    pitch,
    tempo,
  });

  const args = [
    "-y",
    "-i",
    video.filepath,
    "-i",
    `${audioInput}`,
    "-vcodec",
    "copy",
    "-acodec",
    "copy",
    "-map",
    "0:0",
    "-map",
    "1:0",
    "-strict",
    "-2",
    output,
  ];

  await ffmpeg.exec(args, { cwd });

  return output;
}

export async function isImportableKaraokeFile(filepath: string) {
  const { hasAudio, hasVideo } = await hasVideoAudioStream(filepath);

  return hasAudio || hasVideo || isKFNExt(filepath);
}

export async function readLrcFile(filepath: string) {
  const buffer = await fs.promises.readFile(filepath);
  const encoding = await chardet.detect(buffer);
  const lrc = await iconv.decode(buffer, encoding || "utf-8");
  return lrc;
}

export function getPathFromKaraokeFile(filepath: string, ext: string) {
  return filepath.split(".")[0] + ext;
}

export async function getAlignmentFromLRCSource({
  filepath,
}: SubtitlesSourceLrc) {
  const lrcExists = await exists(filepath);
  if (!lrcExists) return [];
  const lrc = await readLrcFile(filepath);
  const alignment = parseLrcToAlignments(lrc);
  if (!alignment) return [];
  return [alignment];
}

export function getLyricsFromAlignment(alignment: Alignment2) {
  let lyrics: string = "";
  if (alignment.mode === "word") {
    lyrics = lyricsFromAlignment(alignment);
  } else if (alignment.mode === "subword") {
    lyrics = lyricsFromSubwordAlignment(alignment);
  }
  return lyrics;
}

export async function getAlignmentFromID3Source({
  filepath,
}: SubtitlesSourceId3) {
  try {
    const parsed = await id3.parse(filepath);
    if (parsed) {
      const alignment: Alignment2 = {
        id: randomUUID(),
        modelId: "ID3",
        alignment: parsed.alignments,
        mode: "subword",
        createdAt: new Date().toISOString(),
      };
      return [alignment];
    }
  } catch (e) {
    console.log("error", e);
    rollbar.error(e as Error);
  }
  return [];
}

export async function getTitleFromKaraokeFile(filepath: string) {
  const parsed = await id3.parse(filepath);
  return parsed?.title || basename(filepath);
}

export function extractLrcMetadata(lrc: string) {
  const metadata: Record<string, string> = {};
  const lines = lrc.split("\n");

  // Regular expressions for metadata like [key:value]
  const metaRegex = /^\[(\w+):(.*)\]$/;

  lines.forEach((line) => {
    const match = line.match(metaRegex);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      metadata[key] = value;
    }
  });

  return metadata;
}

export function extractLyricsFromLRC(lrc: string) {
  const lines: string[] = [];

  // Regular expression to remove timestamps like [00:12.00] and <00:12.50>
  const timestampRegex = /(\[\d{2}:\d{2}\.\d{2}\]|<\d{2}:\d{2}\.\d{2}>)/g;

  // Loop through each line, removing timestamps and invalid characters
  lrc.split("\n").forEach((l) => {
    // Remove timestamps
    let line = l.replace(timestampRegex, " ").trim();
    line = line.replace(/\s\s+/g, " ");
    lines.push(line);
  });

  const lyrics = lines.join("\n");
  return lyrics;
}

interface SongMeta {
  lang?: string;
  lyrics?: string;
}

export async function getMetadataFromID3(filepath: string) {
  const parsed = await id3.read(filepath);
  if (!parsed) return;

  let meta: SongMeta | undefined = undefined;

  if (parsed.language) {
    meta = { lang: parsed.language };
  } else if (parsed.unsynchronisedLyrics?.text) {
    meta = {
      lyrics: parsed.unsynchronisedLyrics?.text,
      lang: parsed.unsynchronisedLyrics?.language,
    };
  }
  return meta;
}
export async function getMetadataFromLRC(filepath: string) {
  const lrc = await readLrcFile(filepath);
  const metadata = extractLrcMetadata(lrc);

  const lyrics = extractLyricsFromLRC(lrc);

  const meta: SongMeta = {
    lyrics,
  };
  if (metadata.lang) {
    meta.lang = metadata.lang;
  }

  return meta;
}

export async function getMetadataFromKaraokeFile(filepath: string) {
  const lrcFilepath = getPathFromKaraokeFile(filepath, FileType.LRC);
  const lrcExists = await exists(lrcFilepath);
  let meta: SongMeta | undefined;
  if (lrcExists) {
    meta = await getMetadataFromLRC(lrcFilepath);
  }
  if (!meta) {
    meta = await getMetadataFromID3(filepath);
  }
  return meta;
}

const cyrillicLanguages = [
  "az",
  "ru",
  "uk",
  "bg",
  "be",
  "sr",
  "mk",
  "kk",
  "tg",
  "ky",
  "mn",
];

export function isCyrillic(lang: string) {
  return cyrillicLanguages.includes(lang);
}

export async function readFileWithAutoEncoding(filepath: string) {
  const buffer = await fs.promises.readFile(filepath);
  const encoding = chardet.detect(buffer);
  const file = await iconv.decode(buffer, encoding || "utf-8");
  return file;
}

export async function getSafeFilepath(filepath: string) {
  try {
    const ext = extname(filepath);
    const newFilepath = await tmpName({
      dir: TMP_PATH,
      postfix: ext,
    });
    await fs.promises.copyFile(filepath, newFilepath);
    return newFilepath;
  } catch (e) {
    rollbar.error(e as Error);
    return filepath;
  }
}

export async function getJPEGImage(urlOrFilepath: string): Promise<Buffer> {
  let buffer: Buffer;
  if (urlOrFilepath.startsWith("http")) {
    buffer = await got(urlOrFilepath).buffer();
  } else if (urlOrFilepath.startsWith("file://")) {
    const filepath = urlOrFilepath.split("file://")[1];
    buffer = await fs.promises.readFile(filepath);
  } else {
    buffer = await fs.promises.readFile(urlOrFilepath);
  }

  const isItJPEG = await isJPEG(buffer);
  const needsConversion = isItJPEG === false;

  let image;
  if (needsConversion) {
    try {
      image = await client.convertImage(buffer);
    } catch (e) {
      rollbar.error("error converting image", {
        error: e as Error,
        urlOrFilepath,
      });
      return getJPEGImage(DEFAULT_BACKGROUND_IMAGE_URL);
    }
  } else {
    image = buffer;
  }

  return image;
}

export async function getJPEGImageFilepath(
  id: string,
  urlOrFilepath: string
): Promise<string> {
  const image = await getJPEGImage(urlOrFilepath);

  const cwd = join(LIBRARY_PATH, id);
  const filepath = await tmpName({
    dir: cwd,
    prefix: "image-",
    postfix: FileType.JPEG,
  });

  await fs.promises.writeFile(filepath, image);

  return filepath;
}

export async function getJPEGImageFileURL(
  id: string,
  urlOrFilepath: string
): Promise<string> {
  const image = await getJPEGImage(urlOrFilepath);

  const cwd = join(LIBRARY_PATH, id);
  const filepath = await tmpName({
    dir: cwd,
    prefix: "image-",
    postfix: FileType.JPEG,
  });

  await fs.promises.writeFile(filepath, image);

  return `file://${filepath}`;
}

export async function checkDuration(file: File) {
  try {
    const duration = await ffprobe.duration(file.path);
    const validDuration = duration < 900;
    return validDuration;
  } catch (e) {
    report.error(e as Error);
    return true;
  }
}

export async function getFileDuration(filepath: string) {
  const duration = await ffprobe.duration(filepath);
  return duration;
}

export async function checkPermissions(path: string) {
  const ex = await exists(path);
  if (!ex) {
    try {
      await safemkdir(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  try {
    await fs.promises.access(path, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (e) {
    return false;
  }
}

export const AlignerModelIds: string[] = [
  "audioshake-transcription",
  "audioshake-alignment",
  "wav2vec2-en",
  "wav2vec2-es",
  "wav2vec2-it",
  "wav2vec2-fr",
  "wav2vec2-pt",
  "wav2vec2",
  "whisper",
];

export function selectAlignerModel({
  modelId,
  lyrics,
}: {
  modelId?: string;
  lyrics?: string;
}): string {
  lyrics = lyrics?.trim();

  // legacy
  if (modelId === "default") {
    modelId = "whisper";
  } else if (modelId === "default-2") {
    modelId = "wav2vec2";
  }

  // can't align without lyrics
  if (
    modelId &&
    !lyrics &&
    !["audioshake-transcription", "whisper"].includes(modelId)
  ) {
    modelId = undefined;
  }

  if (modelId && AlignerModelIds.includes(modelId)) {
    return modelId;
  } else {
    modelId = undefined;
  }

  if (lyrics) {
    return "audioshake-alignment";
  } else {
    return "audioshake-transcription";
  }
}

export async function getPeaksUsingFFMPEG(
  filepath: string,
  {
    aresample = 44000,
    asetnsamples = 500,
  }: {
    aresample?: number;
    asetnsamples?: number;
  } = {}
): Promise<number[]> {
  const output = await tmpName({
    prefix: "peaks-",
    postfix: ".txt",
  });

  const args = [
    "-y",
    "-i",
    filepath,
    "-af",
    `aresample=${aresample},asetnsamples=${asetnsamples},astats=reset=1:metadata=1,ametadata=print:key='lavfi.astats.Overall.Peak_level':file=${output}`,
    "-f",
    "null",
    "-",
  ];

  await ffmpeg.exec(args);

  const data = await fs.promises.readFile(output, "utf8");
  const lines = data.split("\n");
  let peaks: number[] = [];
  for (const line of lines) {
    const index = line.indexOf("Peak_level=");
    if (index === -1) continue;
    const peakStr = line.substring(index + "Peak_level=".length);
    const peak = parseFloat(peakStr);
    peaks.push(peak);
  }

  try {
    await fs.promises.unlink(output);
  } catch (e) {
    rollbar.error(e as Error);
  }

  return peaks;
}

export function getCustomAlignment(newAlignment: Alignment3, modelId: string) {
  const alignment2 = alignment3ToAlignment2(newAlignment);
  if (alignment2.modelId === "custom") return alignment2;
  alignment2.id = randomUUID();
  alignment2.modelId = modelId;
  return alignment2;
}

export async function importStem(
  input: InputImportStem,
  signal: AbortSignal,
  onProgress: ProgressFunc
) {
  const audioFilepath = await getAudioFromAudio(
    input.song.id,
    input.filepath,
    signal,
    onProgress
  );
  await addStem(input.song.id, {
    type: input.type,
    modelId: "imported",
    filepath: audioFilepath,
  });
}

export async function getVideoWithAudio(
  songId: string,
  videoId: string,
  stemId: string
) {
  const output = join(TMP_PATH, `av-${songId}-${videoId}-${stemId}.mp4`);

  if (await exists(output)) {
    return output;
  }

  const song = await lib.getSong(songId);
  if (!song) throw new Error("song not found");
  const video = song.videos?.find((v) => v.id === videoId);
  if (!video) throw new Error("video not found");
  const audio = song.stems?.find((s) => s.id === stemId);
  if (!audio) throw new Error("audio not found");

  const args = [
    "-y",
    "-i",
    video.filepath,
    "-i",
    audio.filepath,
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    output,
  ];

  await ffmpeg.exec(args);

  return output;
}

export async function getFileId(filepath: string) {
  let hash;
  try {
    hash = await fileHash(filepath);
  } catch (e) {
    rollbar.error("failed to get hash from file", { filepath, e });
    try {
      hash = getMD5(filepath);
    } catch (e) {
      rollbar.error("failed to get hash from filepath", { filepath, e });
      hash = generateRandomMD5();
    }
  }
  const id = `file-${hash}`;
  return id;
}

export function getMD5(data: BinaryLike | Buffer | string) {
  return createHash("md5").update(data).digest("hex");
}

export function generateRandomMD5() {
  return getMD5(randomUUID());
}

export async function importKaraoke(
  {
    id,
    title,
    song,
    audioSource,
    videoSource,
    thumbnail,
    subtitlesSource,
    ffmpegOptions,
  }: InputImportKaraoke,
  signal: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<ISongProcessed> {
  await initSongDir(song.id);

  const audioFilepathPromise = getFilepathFromAudioSource(
    audioSource,
    ffmpegOptions,
    signal
  );
  const vocalsFilepathPromise = getVocalsFilepathFromAudioSource(
    audioSource,
    ffmpegOptions,
    signal
  );
  const videoFilepathPromise = getFilepathFromVideoSource(
    song.id,
    videoSource,
    audioSource.duration,
    ffmpegOptions,
    signal,
    onProgress
  );
  const alignmentsPromise = getAlignmentFromSubtitlesSource(subtitlesSource);

  const [
    audioFilepath,
    vocalsFilepath,
    videoFilepath,
    alignments,
  ] = await Promise.all([
    audioFilepathPromise,
    vocalsFilepathPromise,
    videoFilepathPromise,
    alignmentsPromise,
  ]);

  const resolution = await ffprobe.resolution(videoFilepath);
  const video = createVideoObject(videoFilepath, "original", resolution);
  const instruments = await createStemObject(
    "instruments",
    "imported",
    audioFilepath
  );
  let vocals;
  if (vocalsFilepath) {
    vocals = await createStemObject("vocals", "imported", vocalsFilepath);
  }

  let lyrics;
  if (alignments.length > 0) {
    lyrics = await getLyricsFromAlignment(alignments[0]);
  }

  const newSong: ISongProcessed = {
    createdAt: new Date().toISOString(),
    id,
    title,
    image: thumbnail,
    lyrics,
    alignments2: alignments,
    videos: [video],
    stems: [instruments],
    selectedInstruments: instruments.id,
    selectedVocals: vocals?.id,
    selectedVideo: video.id,
    selectedAlignment: alignments[0]?.id,
    status: "processed",
    type: "song",
  };

  await lib.addSong(newSong);

  return newSong;
}

export async function copyFileToLibrary(id: string, src: string) {
  const filename = basename(src);
  const destPath = join(LIBRARY_PATH, id, filename);
  await fs.promises.copyFile(src, destPath);
  return destPath;
}

export async function moveFileToLibrary(id: string, src: string) {
  const filename = basename(src);
  const destPath = join(LIBRARY_PATH, id, filename);
  await renameOrCopy(src, destPath);
  return destPath;
}

export async function importSettings(file: File) {
  const settings = await file.text();
  const parsed = JSON.parse(settings);
  localStorage.setItem("settings", JSON.stringify(parsed));
}

export async function exportSettings() {
  const settings = localStorage.getItem("settings");
  if (!settings) return;
  const filepath = join(DOWNLOAD_PATH, "yokua-settings.json");
  await fs.promises.writeFile(filepath, settings);
  return filepath;
}

export async function exportDebugInfo(id: string) {
  const song = await lib.getSong(id);
  if (!song) throw new Error("song not found");
  const filepath = join(DOWNLOAD_PATH, `debug-${id}.json`);
  await fs.promises.writeFile(filepath, JSON.stringify(song, null, 2));
  return filepath;
}

export async function getVideoResolution(
  song: ISongProcessed,
  videoId?: string
) {
  const newSong = structuredClone(song);
  videoId = videoId || newSong.selectedVideo;
  let video = newSong.videos.find((v) => v.id === videoId);
  if (!video) return DefaultVideoResolution;
  if (video?.resolution) return video.resolution;
  const resolution = await ffprobe.resolution(video.filepath);
  if (!resolution) return DefaultVideoResolution;
  video.resolution = resolution;
  await lib.updateSong(newSong.id, newSong);
  return resolution;
}

export function getBaseResolution(resolution: Resolution): Resolution {
  const aspectRatio = resolution.width / resolution.height;

  switch (aspectRatio) {
    case 16 / 9:
      return { width: 1920, height: 1080 };
    case 9 / 16:
      return { width: 1080, height: 1920 };
    case 4 / 5:
      return { width: 1080, height: 1350 };
    case 2 / 3:
      return { width: 1080, height: 1620 };
    case 1 / 1:
      return { width: 1080, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}

export function resolutionToAspectRatio(resolution: Resolution): AspectRatio {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const divisor = gcd(resolution.width, resolution.height);

  return {
    width: resolution.width / divisor,
    height: resolution.height / divisor,
  };
}

export async function getPeaksLegacy(
  id: string,
  input: string
): Promise<number[] | undefined> {
  const inputHash = await createHash("md5").update(input).digest("hex");
  const peaksFilepath = join(LIBRARY_PATH, id, `peaks-${inputHash}.json`);
  if (await exists(peaksFilepath)) {
    try {
      const peaks = JSON.parse(
        await fs.promises.readFile(peaksFilepath, "utf8")
      );
      return peaks;
    } catch (e) {
      report.error("Failed to get peaks", { id, input, error: e as Error });
    }
  }

  if (platform === "darwin" || platform === "linux") {
    try {
      const options = {
        aresample: 44000,
        asetnsamples: 2000,
      };

      const peaks = await getPeaksUsingFFMPEG(input, options);
      await fs.promises.writeFile(peaksFilepath, JSON.stringify(peaks));
      return peaks;
    } catch (e) {
      report.error("Failed to get peaks", { id, input, error: e as Error });
      return;
    }
  } else {
    try {
      const wav = await getWav(safeFilePath(input));
      const peaks = await audiowaveform.peaks(wav);
      await fs.promises.writeFile(peaksFilepath, JSON.stringify(peaks));
      return peaks.data;
    } catch (e) {
      report.error("Failed to get peaks", { id, input, error: e as Error });
      return;
    }
  }
}

export async function analyseSong(filepath: string) {
  const wavFilepath = await getWav(filepath);
  const wavUrl = `file://${wavFilepath}`;
  const analysis = await analyseAudio(wavUrl);
  return analysis;
}
