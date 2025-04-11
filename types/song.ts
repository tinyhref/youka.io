import { SPAnalysisResult } from "@/lib/sp";
import { Alignment2, Resolution } from "./player";

export enum AlbumType {
  ep = "EP",
  album = "Album",
  single = "Single",
}

export interface SearchResults {
  songs: ISongPreview[];
  artists: IChannelPreview[];
  playlists: IPlaylistPreview[];
  albums: IAlbumPreview[];
}

export type Playlist = IPlaylistPreview | IPlaylistProcessed;

export type Song = ISongPreview | ISongJob | ISongProcessed;

export type Artist = IChannelPreview;

interface ISongBase {
  type: "song";
  status: SongStatus;
  id: string;
  title: string;
  image: string;
  songTitle?: string;
  artists?: string[];
  duration?: number;
  lang?: string;
  channel?: IChannelBase;
  qid?: string;
  jid?: string;
}

export type SongStatus = "preview" | "job" | "processed";

export interface ISongPreview extends ISongBase {
  status: "preview";
}

export interface IChannelBase {
  type: "channel";
  id: string;
  name: string;
}

export interface ISongJob extends ISongBase {
  status: "job";
  jid: string;
}

export interface ISongQueue extends ISongBase {
  qid: string;
}

export interface ISongProcessed extends ISongBase {
  status: "processed";
  createdAt: string;
  duration?: number;
  selectedVideo: string;
  selectedInstruments: string;
  selectedVocals?: string;
  selectedAlignment?: string;
  stems: ISongStem[];
  videos: ISongVideo[];
  alignments2?: Alignment2[];
  lyrics?: string;
  rtl?: boolean;
  subtitlesPresetId?: string;
  styleMappingId?: string;
  analysis?: Omit<SPAnalysisResult, "peakWaveform">;
}

export interface ICategoryBase {
  type: "category";
  status: "preview" | "processed";
  id: string;
  title: string;
  image: string;
}

export interface ICategoryPreview extends ICategoryBase {
  status: "preview";
  items: IPlaylistPreview[];
}

export interface ICategoryProcessed extends ICategoryBase {
  status: "processed";
  items: IPlaylistProcessed[];
}

export interface IPlaylistBase {
  type: "playlist";
  status: "preview" | "processed";
  id: string;
  title: string;
  image: string;
  count: number;
  playlistType?: string;
}

export interface IAlbumBase {
  type: "album";
  status: "preview" | "processed";
  id: string;
  title: string;
  image: string;
  albumType?: AlbumType;
  artist?: string;
  artistId?: string;
  year?: string;
  isExplicit?: boolean;
}

export interface IAlbumPreview extends IAlbumBase {
  status: "preview";
}

export interface IAlbumProcessed extends IAlbumBase {
  status: "processed";
  items: ISongBase[];
}
export interface IPlaylistPreview extends IPlaylistBase {
  status: "preview";
}

export interface IPlaylistProcessed extends IPlaylistBase {
  status: "processed";
  items: ISongPreview[];
}

export interface IPlaylist extends IPlaylistBase {
  status: "preview";
}

export type PlaylistType = "category" | "song" | "artist" | "album" | "channel";

export interface IPlaylist2 {
  id: string;
  title: string;
  image: string;
  items: IPlaylist2Item[];
}

export interface IPlaylist2Item {
  id: string;
  songId: string;
}

export interface IArtistBase {
  type: "artist";
  id?: string;
  name: string;
}

export interface IChannelPreview extends IArtistBase {
  status: "preview";
  image: string;
}

export interface IChannelProcessed extends IArtistBase {
  status: "processed";
  image: string;
  songs?: ISongPreview[];
  playlists?: IPlaylistPreview[];
  suggestedChannels?: IChannelPreview[];
  // description?: string;
  // thumbnails?: any[];
  // songsPlaylistId?: string;
  // releases?: IPlaylistPreview[];
  // favorites?: ISongPreview[];
  // albums?: IAlbumPreview[];
  // singles?: IAlbumPreview[];
  // suggestedChannels?: IChannelPreview[];
  // subscribers?: string;
}

export interface SongMetadata {
  id: string;
  title?: string;
  songTitle?: string;
  artists?: string[];
  image?: string;
  lyrics?: string;
  lang?: string;
  offset?: number;
  alignments2?: Alignment2[];
  stems?: ISongStem[];
  videos?: ISongVideo[];
  selectedVideo?: string;
  selectedInstruments?: string;
  selectedVocals?: string;
  selectedAlignment?: string;
}

export interface ISongVideo {
  id: string;
  createdAt: string;
  type: VideoType;
  filepath: string;
  resolution?: Resolution;
  groupId?: string;
  title?: string;
}

export interface ISongStem {
  id: string;
  modelId: string;
  type: StemType;
  filepath: string;
  groupId?: string;
  title?: string;
}

export type StemType = "vocals" | "instruments" | "original" | "custom";
export type VideoType = "original" | "custom" | "trim";
