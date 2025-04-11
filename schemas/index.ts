import { z } from "zod";
export * from "./ffmpeg";

export const songTitleAndArtistsSchema = z.object({
  title: z.string(),
  artists: z.array(z.string()),
});

const audioSourceTypeSchema = z.enum(["url", "video", "audio", "karafun"]);
const videoSourceTypeSchema = z.enum([
  "auto",
  "url",
  "video",
  "image",
  "color",
  "karafun",
]);
export const thumbnailSourceTypeSchema = z.enum(["auto", "image"]);

export const resolutionSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const aspectRatioSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const karafunFileSchema = z.object({
  type: z.enum(["audio", "video", "metadata"]),
  filepath: z.string(),
  ext: z.string(),
  name: z.string(),
});
export const karafunExtractResultSchema = z.object({
  dir: z.string(),
  files: z.array(karafunFileSchema),
});

export const videoSourceBaseSchema = z.object({
  type: videoSourceTypeSchema,
});

export const audioSourceBaseSchema = z.object({
  type: audioSourceTypeSchema,
  id: z.string(),
  duration: z.number().max(900),
  title: z.string().min(2),
});

export const thumbnailSourceBaseSchema = z.object({
  type: thumbnailSourceTypeSchema,
});

export const thumbnailSourceImageSchema = thumbnailSourceBaseSchema.extend({
  type: z.literal("image"),
  url: z.string(),
});

export const thumbnailSourceAutoSchema = thumbnailSourceBaseSchema.extend({
  type: z.literal("auto"),
});

export const videoSourceAutoSchema = videoSourceBaseSchema.extend({
  type: z.literal("auto"),
});

export const thumbnailSourceSchema = z.discriminatedUnion("type", [
  thumbnailSourceImageSchema,
  thumbnailSourceAutoSchema,
]);

export const videoSourceUrlSchema = videoSourceBaseSchema.extend({
  type: z.literal("url"),
  id: z.string().length(11),
  url: z.string().url(),
  aspectRatio: aspectRatioSchema,
});

export const videoSourceVideoSchema = videoSourceBaseSchema.extend({
  type: z.literal("video"),
  filepath: z.string(),
  id: z.string(),
  duration: z.number().max(900),
  title: z.string().min(2),
  aspectRatio: aspectRatioSchema,
  resolution: resolutionSchema.optional(),
});

export const videoSourceImageSchema = videoSourceBaseSchema.extend({
  type: z.literal("image"),
  url: z.string(),
  size: z.number().max(4 * 1024 * 1024, "Image size must be less than 4MB"),
  aspectRatio: aspectRatioSchema,
  resolution: resolutionSchema.optional(),
});

export const videoSourceColorSchema = videoSourceBaseSchema.extend({
  type: z.literal("color"),
  color: z.string(),
  resolution: resolutionSchema,
});

export const videoSourceKarafunSchema = videoSourceBaseSchema.extend({
  type: z.literal("karafun"),
  filepath: z.string(),
  extractResult: karafunExtractResultSchema,
});

export const videoSourceSchema = z.discriminatedUnion("type", [
  videoSourceAutoSchema,
  videoSourceUrlSchema,
  videoSourceVideoSchema,
  videoSourceImageSchema,
  videoSourceColorSchema,
  videoSourceKarafunSchema,
]);

export const audioSourceAudioSchema = audioSourceBaseSchema.extend({
  type: z.literal("audio"),
  filepath: z.string(),
});

export const audioSourceVideoSchema = audioSourceBaseSchema.extend({
  type: z.literal("video"),
  filepath: z.string(),
});

export const audioSourceKarafunSchema = audioSourceBaseSchema.extend({
  type: z.literal("karafun"),
  filepath: z.string(),
  extractResult: karafunExtractResultSchema,
});

export const audioSourceUrlSchema = audioSourceBaseSchema.extend({
  type: z.literal("url"),
  id: z.string().length(11),
  url: z.string().url(),
  thumbnail: z.string().url(),
});

export const audioSourceSchema = z.discriminatedUnion("type", [
  audioSourceAudioSchema,
  audioSourceVideoSchema,
  audioSourceUrlSchema,
  audioSourceKarafunSchema,
]);

export const subtitlesSourceTypeSchema = z.enum([
  "auto",
  "lrc",
  "id3",
  "karafun",
]);
export const subtitlesSourceBaseSchema = z.object({
  type: subtitlesSourceTypeSchema,
});
export const subtitlesSourceId3Schema = subtitlesSourceBaseSchema.extend({
  type: z.literal("id3"),
  filepath: z.string(),
});
export const subtitlesSourceLrcSchema = subtitlesSourceBaseSchema.extend({
  type: z.literal("lrc"),
  filepath: z.string(),
});
export const subtitlesSourceAutoSchema = subtitlesSourceBaseSchema.extend({
  type: z.literal("auto"),
});
export const subtitlesSourceKarafunSchema = subtitlesSourceBaseSchema.extend({
  type: z.literal("karafun"),
  filepath: z.string(),
  extractResult: karafunExtractResultSchema,
});

export const subtitlesSourceSchema = z.discriminatedUnion("type", [
  subtitlesSourceAutoSchema,
  subtitlesSourceLrcSchema,
  subtitlesSourceId3Schema,
  subtitlesSourceKarafunSchema,
]);

export type VideoSource = z.infer<typeof videoSourceSchema>;
export type VideoSourceType = z.infer<typeof videoSourceTypeSchema>;
export type VideoSourceImage = z.infer<typeof videoSourceImageSchema>;
export type VideoSourceColor = z.infer<typeof videoSourceColorSchema>;
export type VideoSourceVideo = z.infer<typeof videoSourceVideoSchema>;
export type VideoSourceUrl = z.infer<typeof videoSourceUrlSchema>;
export type VideoSourceKarafun = z.infer<typeof videoSourceKarafunSchema>;
export type AudioSource = z.infer<typeof audioSourceSchema>;
export type AudioSourceType = z.infer<typeof audioSourceTypeSchema>;
export type AudioSourceAudio = z.infer<typeof audioSourceAudioSchema>;
export type AudioSourceVideo = z.infer<typeof audioSourceVideoSchema>;
export type AudioSourceUrl = z.infer<typeof audioSourceUrlSchema>;
export type AudioSourceKarafun = z.infer<typeof audioSourceKarafunSchema>;

export type ThumbnailSource = z.infer<typeof thumbnailSourceSchema>;
export type ThumbnailSourceType = z.infer<typeof thumbnailSourceTypeSchema>;
export type ThumbnailSourceImage = z.infer<typeof thumbnailSourceImageSchema>;
export type ThumbnailSourceAuto = z.infer<typeof thumbnailSourceAutoSchema>;

export type SubtitlesSourceType = z.infer<typeof subtitlesSourceTypeSchema>;

export type SubtitlesSourceLrc = z.infer<typeof subtitlesSourceLrcSchema>;
export type SubtitlesSourceAuto = z.infer<typeof subtitlesSourceAutoSchema>;
export type SubtitlesSourceKarafun = z.infer<
  typeof subtitlesSourceKarafunSchema
>;
export type SubtitlesSourceId3 = z.infer<typeof subtitlesSourceId3Schema>;
export type SubtitlesSource = z.infer<typeof subtitlesSourceSchema>;
