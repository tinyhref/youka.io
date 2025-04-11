import {
  IChannelProcessed,
  IPlaylistPreview,
  ISongPreview,
  Playlist,
} from "./song";

export enum MediaMode {
  Video = "video",
  Original = "original",
  Instruments = "instruments",
  Vocals = "vocals",
  InstrumentsVocals = "instruments-vocals",
  Pitch = "pitch",
  Image = "image",
  OriginalTrim = "original-trim",
  VideoTrim = "video-trim",
  VocalsTrim = "vocals-trim",
  InstrumentsTrim = "instruments-trim",
  VocalsSegments = "vocals-segments",
}

export enum MetadataMode {
  Lyrics = "lyrics",
  Info = "metadata",
  Lang = "lang",
}

export type Mode = MediaMode | MetadataMode;

export type MediaUrls = Partial<Record<MediaMode, string>>;

export type ProgressFunc = (progress: number) => void;
export type StatusFunc = (status: string) => void;

export interface INotification<T> {
  id: string;
  type: string;
  read?: boolean;
  data: T;
}

export interface INotificationUpdate extends INotification<{}> {
  type: "update";
}

export type INotificationAll = INotificationUpdate;

export interface ILyricsStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
}

export interface FFmpegProgress {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number;
}

export type Discovery =
  | IDiscoverySearch
  | IDiscoveryPlaylist
  | IDiscoveryChannel;

export type DiscoveryType =
  | "search"
  | "playlist"
  | "channel"
  | "related"
  | "mix";

export interface IDiscovery {
  type: DiscoveryType;
  loading: boolean;
  error?: string;
}

export interface IDiscoverySearch extends IDiscovery {
  type: "search";
  query: string;
  next: SearchNextFunc<ISongPreview | IPlaylistPreview> | undefined;
  suggestions: string[];
  songs: Array<ISongPreview | IPlaylistPreview>;
}

export interface IDiscoveryRelated extends IDiscovery {
  type: "related";
  next: SearchNextFunc<ISongPreview | IPlaylistPreview> | undefined;
  songs: Array<ISongPreview | IPlaylistPreview>;
}

export interface IDiscoveryMix extends IDiscovery {
  type: "mix";
  songs: Array<ISongPreview>;
}

export interface IDiscoveryPlaylist extends IDiscovery {
  type: "playlist";
  playlist?: Playlist;
}

export interface IDiscoveryChannel extends IDiscovery {
  type: "channel";
  channel?: IChannelProcessed;
}

export type TabType =
  | "library"
  | "jobs"
  | "search"
  | "queue"
  | "related"
  | "mix"
  | "explore";

export type SearchNextFunc<T> = () => Promise<ISearchResult<T> | undefined>;

export interface ISearchResult<T> {
  next?: SearchNextFunc<T>;
  items: T[];
}

export interface IParsedSearchResult<T> {
  items: T[];
  token?: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface Title {
  title: string;
  artists: string[];
}

export enum FileType {
  MP4 = ".mp4",
  MP3 = ".mp3",
  M4A = ".m4a",
  WAV = ".wav",
  MKV = ".mkv",
  Inandon = ".inandon",
  ASS = ".ass",
  TEXT = ".txt",
  JSON = ".json",
  JPEG = ".jpeg",
  PNG = ".png",
  LRC = ".lrc",
}

export const AlignerModelIds = [
  "audioshake-transcription",
  "audioshake-alignment",
  "wav2vec2",
  "whisper",
  "wav2vec2-en",
  "wav2vec2-es",
  "wav2vec2-fr",
  "wav2vec2-pt",
  "wav2vec2-it",
  "line",
];

export type Alignment2 = Alignment2Subword | Alignment2Word | Alignment2Line;

export interface Alignment3 {
  id: string;
  modelId: string;
  createdAt: string;
  text: string;
  lines: AlignmentV2Line[];
  groupId?: string;
}

export interface AlignmentV2Line {
  singer?: number;
  start: number;
  end: number;
  text: string;
  words: AlignmentV2Word[];
}

export interface AlignmentV2Word {
  start: number;
  end: number;
  text: string;
  vocals?: boolean;
  subwords: AlignmentV2Subword[];
}

export interface AlignmentV2Subword {
  start: number;
  end: number;
  text: string;
  vocals?: boolean;
}

export interface Alignment3WithId extends Alignment3 {
  id: string;
  modelId: string;
  createdAt: string;
  text: string;
  lines: AlignmentV2LineWithId[];
}

export interface AlignmentV2LineWithId extends AlignmentV2Line {
  id: string;
  words: AlignmentV2WordWithId[];
}

export interface AlignmentV2WordWithId extends AlignmentV2Word {
  id: string;
  subwords: AlignmentV2SubwordWithId[];
}

export interface AlignmentV2SubwordWithId extends AlignmentV2Subword {
  id: string;
}

export interface IAlignment2 {
  id: string;
  modelId: string;
  createdAt: string;
  // updatedAt: string;
  mode: string;
  groupId?: string;
  alignment:
    | IAlignmentItemSubword[]
    | IAlignmentItemWord[]
    | IAlignmentItemLine[];
}

export interface Alignment2Subword extends IAlignment2 {
  mode: "subword";
  alignment: IAlignmentItemSubword[];
}

export interface Alignment2Word extends IAlignment2 {
  mode: "word";
  alignment: IAlignmentItemWord[];
}

export interface Alignment2Line extends IAlignment2 {
  mode: "line";
  alignment: IAlignmentItemLine[];
}

export type AlignmentItemUnion =
  | IAlignmentItemLine
  | IAlignmentItemWord
  | IAlignmentItemSubword;

export interface IAlignmentItemLine {
  start: number;
  end: number;
  line: number;
  text: string;
  singer?: number;
  vocals?: boolean;
}

export interface IAlignmentItemSubword extends IAlignmentItemWord {
  subword: number;
}

export interface IAlignmentItemWord extends IAlignmentItemLine {
  word: number;
}

export interface ICaptionsWord extends IAlignmentItemWord {
  id: string;
}

export interface ICaptionsLine extends IAlignmentItemLine {
  id: string;
}

export type FFmpegPreset =
  | "ultrafast"
  | "superfast"
  | "veryfast"
  | "faster"
  | "fast"
  | "medium"
  | "slow"
  | "slower"
  | "veryslow";

export const FFmpegPresetList: Array<FFmpegPreset> = [
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
  "slow",
  "slower",
  "veryslow",
];

export type AspectRatio = {
  width: number;
  height: number;
};

export interface Resolution {
  width: number;
  height: number;
}

export type ObjectFit = "contain"; // | "cover" | "fill" | "none" | "scale-down";

export interface VideoOptions {
  aspectRatio: AspectRatio;
  resolution?: Resolution;
  objectFit: ObjectFit;
}

export interface FFmpegOptions {
  preset: FFmpegPreset;
  crf: number;
  pixFmt: PixFmt;
  fps: number;
}

export type PixFmt = "yuv420p" | "yuv422p" | "yuv444p";

export const PixFmtList: Array<PixFmt> = ["yuv420p", "yuv422p", "yuv444p"];

export interface TrackSegment {
  start: number;
  end: number;
}

export interface ImportKaraokeInput {
  id: string;
  mediaFilepath: string;
  signal: AbortSignal;
  ffmpegOptions: FFmpegOptions;
  title: string;
  image: string;
  subtitlesFilepath?: string;
  onProgress?: (progress: number) => void;
}

export interface SongTitleAndArtists {
  title: string;
  artists: string[];
}
