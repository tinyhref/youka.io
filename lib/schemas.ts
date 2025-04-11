import { z } from "zod";
import { isValidAudioId } from "./utils";

export const LineAlignmentItemSchema = z.object({
  line: z.number(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  vocals: z.boolean().optional(),
  singer: z.number().optional(),
});

export const WordAlignmentItemSchema = z.object({
  line: z.number(),
  word: z.number(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  vocals: z.boolean().optional(),
  singer: z.number().optional(),
});

export const SubwordAlignmentItemSchema = z.object({
  line: z.number(),
  word: z.number(),
  subword: z.number(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  vocals: z.boolean().optional(),
  singer: z.number().optional(),
});

export const LineAlignmentSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  createdAt: z.string().datetime(),
  mode: z.literal("line"),
  alignment: z.array(LineAlignmentItemSchema),
  groupId: z.string().optional(),
});

export const WordAlignmentSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  createdAt: z.string().datetime(),
  mode: z.literal("word"),
  alignment: z.array(WordAlignmentItemSchema),
  groupId: z.string().optional(),
});

export const SubwordAlignmentSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  createdAt: z.string().datetime(),
  mode: z.literal("subword"),
  alignment: z.array(SubwordAlignmentItemSchema),
  groupId: z.string().optional(),
});

export const Alignment2Schema = z.union([
  LineAlignmentSchema,
  WordAlignmentSchema,
  SubwordAlignmentSchema,
]);

export const MetadataAlignment2Schema = z.object({
  id: z.string(),
  modelId: z.string(),
  alignment: z.array(z.any()),
});

export const SPAnalysisResultSchema = z.object({
  samplerate: z.number(),
  duration: z.number(),
  peakDb: z.number(),
  averageDb: z.number(),
  loudpartsAverageDb: z.number(),
  bpm: z.number(),
  keyIndex: z.number(),
  waveformSize: z.number(),
  peakWaveform: z.any().optional(),
});

export const SongMetadataSchema = z.object({
  id: z.string().refine(isValidAudioId),
  title: z.string().max(200).optional(),
  songTitle: z.string().optional(),
  artists: z.array(z.string()).optional(),
  lang: z.string().min(2).max(2).optional(),
  lyrics: z.string().max(10000).optional(),
  duration: z.number().positive().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  type: z.string().optional(),
  alignments2: z.array(MetadataAlignment2Schema).optional(),
  image: z.string().optional(),
  original: z.string().optional(),
  video: z.string().optional(),
  vocals: z.string().optional(),
  instruments: z.string().optional(),
  offset: z.number().optional(),
  stems: z
    .array(
      z.object({
        id: z.string(),
        modelId: z.string(),
        type: z.enum(["vocals", "instruments", "original"]),
        filepath: z.string(),
      })
    )
    .optional(),
  videos: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["original", "custom", "trim"]),
        filepath: z.string(),
        createdAt: z.string(),
      })
    )
    .optional(),
  selectedVideo: z.string().optional(),
  selectedInstruments: z.string().optional(),
  selectedVocals: z.string().optional(),
  selectedAlignment: z.string().optional(),
  assRenderer: z.enum(["ass2", "ass3", "ass4"]).optional(),
  subtitlesPresetId: z.string().optional(),
  styleMappingId: z.string().optional(),
  analysis: SPAnalysisResultSchema.optional(),
});

export const ResolutionSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

export const SongSchema = z.object({
  id: z.string().refine(isValidAudioId),
  status: z.literal("processed"),
  type: z.literal("song"),
  createdAt: z.string(),
  title: z.string().max(200),
  songTitle: z.string().optional(),
  artists: z.array(z.string()).optional(),
  lang: z.string().min(2).max(2).optional(),
  lyrics: z.string().max(10000).optional(),
  duration: z.number().positive().optional(),
  alignments2: z.array(Alignment2Schema).optional(),
  image: z.string(),
  original: z.string().optional(),
  video: z.string().optional(),
  vocals: z.string().optional(),
  instruments: z.string().optional(),
  offset: z.number().optional(),
  rtl: z.boolean().optional(),
  stems: z.array(
    z.object({
      id: z.string(),
      modelId: z.string(),
      type: z.enum(["vocals", "instruments", "original"]),
      filepath: z.string(),
      groupId: z.string().optional(),
    })
  ),
  videos: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["original", "custom", "trim"]),
      filepath: z.string(),
      createdAt: z.string(),
      resolution: ResolutionSchema.optional(),
      groupId: z.string().optional(),
    })
  ),
  selectedVideo: z.string(),
  selectedInstruments: z.string(),
  selectedVocals: z.string().optional(),
  selectedAlignment: z.string().optional(),
  assRenderer: z.enum(["ass2", "ass3", "ass4"]).optional(),
  subtitlesPresetId: z.string().optional(),
  styleMappingId: z.string().optional(),
  analysis: SPAnalysisResultSchema.optional(),
});
