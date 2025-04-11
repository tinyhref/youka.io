import * as amplitude from "@amplitude/analytics-browser";
import { createWithEqualityFn as create } from "zustand/traditional";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { immer } from "zustand/middleware/immer";
import pRetry from "p-retry";
import {
  ISongProcessed,
  ISongPreview,
  JobStatus,
  Song,
  ISongQueue,
  TabType,
  INotificationAll,
  JobStateUnion,
  InputExportMedia,
  IJob,
  Role,
  SongMetadata,
  Alignment2,
  OutputSyncLyrics,
  MayIReason,
  InputChangeBackground,
  OutputChangeBackground,
  InputTrim,
  OutputSplit,
  ISongStem,
  ISongVideo,
  OutputImportSubtitles,
  InputImportSubtitles,
  InputImportKaraoke,
  OutputImportKaraoke,
  IPlaylist2,
  IPlaylist2Item,
  InputResizeVideo,
  OutputResizeVideo,
  InputCreateKaraoke,
  OutputCreateKaraoke,
  InputImportStem,
  OutputImportStem,
  SubtitlesPreset,
  SingerToStyleOptionsMapping,
  StyleMapping,
  OutputAddKaraokeIntro,
  InputAddKaraokeIntro,
} from "@/types";
import * as library from "@/lib/library";
import KaraokePlayer from "@/lib2/player/karaoke";
import MemoryQueue from "@/lib2/queue/memory";
import MemoryWorker from "@/lib2/worker/memory";
import { JobExportMedia } from "@/lib2/jobs/exportMedia";
import LyricsAssController from "@/lib2/lyrics/ass";
import { JobSyncLyrics } from "@/lib2/jobs/syncLyrics";
import * as report from "@/lib/report";
import client, { CreditsData } from "@/lib/client";
import { MayIError } from "@/types/error";
import { JobChangeBackground } from "@/lib2/jobs/changeBackground";
import { JobTrim } from "@/lib2/jobs/trim";
import { JobSplit } from "@/lib2/jobs/split";
import { JobImportSubtitles } from "@/lib2/jobs/importSubtitles";
import { JobImportKaraoke } from "@/lib2/jobs/importKaraoke";
import { lib } from "@/lib/repo";
import { JobResizeVideo } from "@/lib2/jobs/resizeVideo";
import { JobImportStem } from "@/lib2/jobs/importStem";
import { JobCreateKaraoke } from "@/lib2/jobs/createKaraoke";
import { useSettingsStore } from "./settings";
import { DefaultStyleMapping } from "@/consts";
import { getStyleMappingOptionsFromStyleMapping } from "@/lib/utils";
import { JobAddKaraokeIntro } from "@/lib2/jobs/addKaraokeIntro";
import { JobParseTitles } from "@/lib2/jobs/parseTitles";
import { JobAnalyseLibrary } from "@/lib2/jobs/analyseLibrary";

const workerCtl = new MemoryWorker({ concurrency: 10 });
const playerCtl = new KaraokePlayer();
const queueCtl = new MemoryQueue<ISongQueue>();
const lyricsCtl = new LyricsAssController();

const jobs: Record<string, IJob<any, any>> = {};

interface IPlayerState {
  ready: boolean;
  error?: Error;
  token: string;
  element: HTMLVideoElement;
  hasNext: boolean;
  playing: boolean;
  loading: boolean;
  time: number;
  seeking: boolean;
  duration: number;
  fullScreen: boolean;
  songId: string;
  qid?: string;
  queue: Song[];
  vocalsVolume: number;
  noVocalsVolume: number;
  tempo: number;
  pitch: number;
  canplay: boolean;
  notifications: INotificationAll[];
  songs: Record<string, Song>;
  jobs: Record<string, JobStateUnion>;
  tab: "queue" | "library" | "search" | "jobs" | "related" | "mix" | "explore";
  song2job: Record<string, string>;
  selectedAlignment?: Alignment2;
  selectedVocals?: ISongStem;
  selectedInstruments?: ISongStem;
  selectedVideo?: ISongVideo;
  dualSelectedVideo?: ISongVideo;
  dualSelectedAlignment?: Alignment2;
  dualSong?: ISongProcessed;
  upgrade: {
    open: boolean;
    feature: string;
    role: Role;
  };
  role?: Role;
  creditsData?: CreditsData;
  modal: {
    open: boolean;
    reason: MayIReason;
  };
  dualScreenOpen: boolean;
  playlists: Record<string, IPlaylist2>;
  playlistId?: string;

  importKaraoke(input: InputImportKaraoke): void;
  importSubtitles(input: InputImportSubtitles): void;
  setSelectedInstrumentsAndVocals(
    instrumentsStem: ISongStem,
    vocalsStem: ISongStem
  ): void;
  moveSong: (from: number, to: number) => void;
  changeBackground: (input: InputChangeBackground) => Promise<void>;
  addJob(job: IJob<any, any>): void;
  cancelJob(id: string): void;
  redoJob(id: string): void;
  addToQueue: (song: Song) => ISongQueue;
  deleteSong(song: Song): Promise<void>;
  exportMedia(input: InputExportMedia): void;
  createKaraoke(input: InputCreateKaraoke): void;
  trim(input: InputTrim): JobTrim;
  addKaraokeIntro(input: InputAddKaraokeIntro): JobAddKaraokeIntro;
  init: () => Promise<void>;
  initLibrary: () => Promise<void>;
  initLyrics: () => void;
  initPlayer: () => Promise<void>;
  initQueue: () => void;
  load: (song: ISongProcessed, autoplay?: boolean) => void;
  markAllNotificationsAsRead: () => void;
  next: () => void;
  pause: () => void;
  play: () => void;
  playSong: (songId: string, qid?: string | null) => void;
  removeFromQueue: (item: ISongQueue) => void;
  setFullScreen: (fullScreen: boolean) => void;
  setNoVocalsVolume: (volume: number) => void;
  setPitch: (pitch: number) => void;
  setSeeked: (time: number) => void;
  setSeeking: (time: number) => void;
  seekRight: () => void;
  seekLeft: () => void;
  setSelectedAlignment: (alignmentId?: string, refresh?: boolean) => void;
  setTab: (tab: TabType) => void;
  setTempo: (playbackRate: number) => void;
  setToken: (token: string) => void;
  setVocalsVolume: (volume: number) => void;
  stop: () => void;
  setSongId: (songId: string) => void;
  syncLyrics(
    song: Song,
    lyrics: string,
    lang: string,
    alignModel: string
  ): Promise<JobSyncLyrics | undefined>;
  togglePlay: () => void;
  updateAlignment(
    id: string,
    alignment: Alignment2,
    updateServer: boolean,
    updateSegments?: boolean,
    splitModelId?: string
  ): Promise<void>;
  showUpdateNotification(): void;
  setMetadata(id: string, metadata: SongMetadata): Promise<void>;
  setUpgradeClose(): void;
  setUpgradeOpen(feature: string, role: Role): void;
  setLyrics(song: ISongProcessed, lyrics: string): Promise<void>;
  refreshRole(): Promise<void>;
  refreshCreditsData(): Promise<void>;
  reportUsage(): Promise<void>;
  setCloseModal(): void;
  syncAlignments(id: string): Promise<void>;
  toggleMuteVocals(): void;
  toggleMuteNoVocals(): void;
  split(song: Song, splitModel: string): Promise<void>;
  setSelectedVocals(id: string, stem: ISongStem): Promise<void>;
  setSelectedInstruments(id: string, stem: ISongStem): Promise<void>;
  setSelectedVideo(id: string, video: ISongVideo): Promise<void>;
  refreshPlayer(): void;
  selectByGroupId(songId: string, groupId: string): Promise<void>;
  mute(): void;
  unmute(): void;
  increaseVocalsVolume(): void;
  decreaseVocalsVolume(): void;
  reindexLibrary(): Promise<void>;
  getSong(id: string): Promise<ISongProcessed | undefined>;
  setDualScreenOpen(dualScreenOpen: boolean): void;
  createPlaylist(playlist: IPlaylist2): Promise<IPlaylist2>;
  deletePlaylist(playlistId: string): Promise<void>;
  addToPlaylist(
    playlistId: string,
    playlistItem: IPlaylist2Item
  ): Promise<void>;
  removeFromPlaylist(playlistId: string, playlistItemId: string): Promise<void>;
  setPlaylistId(playlistId?: string): void;
  playPlaylist(playlistId: string, playlistItemId?: string): void;
  removePlaylist(playlistId: string): Promise<void>;
  updatePlaylist(playlist: IPlaylist2): Promise<void>;
  movePlaylistItem(
    playlistId: string,
    index: number,
    atIndex: number
  ): Promise<void>;
  persistPlaylist(playlistId: string): void;
  playPlaylistItem(playlistId: string, playlistItemId: string): void;
  resizeVideo(input: InputResizeVideo): Promise<void>;
  playIfEmpty(songId: string, qid?: string): void;
  importStem(input: InputImportStem): void;
  updateStyleMapping(songId: string, styleMappingId: string): void;
  setSubtitlesPreset(songId: string, subtitlesPresetId: string): Promise<void>;
  getSubtitlesPreset(songId: string): SubtitlesPreset;
  refreshSubtitles(): void;
  getStyleOptionsMapping(songId: string): SingerToStyleOptionsMapping;
  getStyleMapping(songId: string): StyleMapping;
  setStyleMapping(songId: string, styleMappingId: string): Promise<void>;
  updateSong(songId: string, song: ISongProcessed): void;
  deleteVideo(songId: string, videoId: string, groupId?: string): Promise<void>;
  deleteStem(songId: string, stemId: string, groupId?: string): Promise<void>;
  deleteAlignment(
    songId: string,
    alignmentId: string,
    groupId?: string
  ): Promise<void>;
  selectNotGroupId(
    songId: string,
    {
      video,
      vocals,
      instruments,
      alignment,
    }: {
      video?: ISongVideo;
      vocals?: ISongStem;
      instruments?: ISongStem;
      alignment?: Alignment2;
    }
  ): Promise<void>;
  deleteByGroupId(songId: string, groupId: string): Promise<void>;
  parseTitles(): Promise<void>;
  analyseLibrary(): Promise<void>;
  fixIndex(): Promise<void>;
}

export const usePlayerStore = create(
  persist(
    immer<IPlayerState>((set, get) => ({
      token: "",
      ready: false,
      element: document.createElement("video"),
      canplay: false,
      playing: false,
      loading: false,
      hasNext: false,
      queue: [],
      time: 0,
      duration: 0,
      fullScreen: false,
      vocalsVolume: 0,
      noVocalsVolume: 1,
      tempo: 1,
      pitch: 0,
      seeking: false,
      notifications: [],
      songs: {},
      songId: "",
      discoveryType: "search",
      tab: "library",
      jobs: {},
      song2job: {},
      loadingSubscriptions: false,
      upgrade: {
        open: false,
        feature: "",
        role: "basic",
      },
      modal: {
        open: false,
        reason: "NO_USER",
      },
      dualScreenOpen: false,
      playlists: {},

      async analyseLibrary() {
        const job = new JobAnalyseLibrary({});
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      async parseTitles() {
        const job = new JobParseTitles({});
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      async deleteByGroupId(songId: string, groupId: string) {
        const song = get().songs[songId];
        if (!song || song.status !== "processed") return;

        const videos = song.videos.filter((v) => v.groupId === groupId);
        for (const video of videos) {
          await lib.deleteVideo(songId, video.id);
        }

        const stems = song.stems.filter((s) => s.groupId === groupId);
        for (const stem of stems) {
          await lib.deleteStem(songId, stem.id);
        }

        const alignments = song.alignments2?.filter(
          (a) => a.groupId === groupId
        );
        if (alignments) {
          for (const alignment of alignments) {
            await lib.deleteAlignment(songId, alignment.id);
          }
        }

        const newSong = await lib.getSong(songId);
        if (newSong) {
          set((state) => {
            state.songs[songId] = newSong;
          });
        }

        get().selectNotGroupId(songId, {});
      },

      async selectNotGroupId(
        songId: string,
        {
          video,
          vocals,
          instruments,
          alignment,
        }: {
          video?: ISongVideo;
          vocals?: ISongStem;
          instruments?: ISongStem;
          alignment?: Alignment2;
        }
      ) {
        const song = get().songs[songId];
        if (!song || song.status !== "processed") return;

        const selectedVideo = video || song.videos.find((v) => !v.groupId);
        const selectedVocals =
          vocals || song.stems.find((s) => s.type === "vocals" && !s.groupId);
        const selectedInstruments =
          instruments ||
          song.stems.find((s) => s.type === "instruments" && !s.groupId);
        const selectedAlignment =
          alignment || song.alignments2?.find((a) => !a.groupId);

        set((state) => {
          state.dualSelectedVideo = selectedVideo;
          state.selectedVideo = selectedVideo;
          state.selectedVocals = selectedVocals;
          state.selectedInstruments = selectedInstruments;
          state.selectedAlignment = selectedAlignment;
        });

        get().refreshPlayer();

        try {
          await lib.updateSong(songId, {
            selectedVideo: selectedVideo?.id || "",
            selectedInstruments: selectedInstruments?.id || "",
            selectedVocals: selectedVocals?.id || "",
            selectedAlignment: selectedAlignment?.id || "",
          });
        } catch (e) {
          report.error(e as any);
        }
      },

      async deleteVideo(songId: string, videoId: string, groupId?: string) {
        if (groupId) return get().deleteByGroupId(songId, groupId);

        const song = await lib.deleteVideo(songId, videoId);
        set((state) => {
          state.songs[songId] = song;
        });
      },

      async deleteStem(songId: string, stemId: string, groupId?: string) {
        if (groupId) return get().deleteByGroupId(songId, groupId);

        const song = await lib.deleteStem(songId, stemId);
        set((state) => {
          state.songs[songId] = song;
        });
      },

      async deleteAlignment(
        songId: string,
        alignmentId: string,
        groupId?: string
      ) {
        if (groupId) return get().deleteByGroupId(songId, groupId);

        const song = await lib.deleteAlignment(songId, alignmentId);
        set((state) => {
          state.songs[songId] = song;
        });
      },

      updateSong(songId: string, song: ISongProcessed) {
        set((state) => {
          state.songs[songId] = song;
        });
      },

      getStyleMapping(songId: string) {
        const styleMappings = useSettingsStore.getState().styleMappings;
        const defaultStyleMapping = useSettingsStore.getState()
          .defaultStyleMappingId;
        let styleMappingId: string = "";
        const song = get().songs[songId];
        if (song?.status === "processed" && song.styleMappingId) {
          styleMappingId = song.styleMappingId;
        } else {
          styleMappingId = defaultStyleMapping;
        }
        let styleMapping = styleMappings.find(
          (mapping) => mapping.id === styleMappingId
        );
        if (!styleMapping) {
          styleMapping = DefaultStyleMapping;
        }

        return styleMapping;
      },

      async setStyleMapping(songId: string, styleMappingId: string) {
        set((state) => {
          const song = state.songs[songId];
          if (song?.status === "processed") {
            song.styleMappingId = styleMappingId;
          }
        });
        await lib.updateSong(songId, { styleMappingId });
      },

      getStyleOptionsMapping(songId: string) {
        const styleMapping = get().getStyleMapping(songId);
        const styles = useSettingsStore.getState().styles;
        return getStyleMappingOptionsFromStyleMapping(styleMapping, styles);
      },

      async refreshSubtitles() {
        const song = get().songs[get().songId];
        if (!song || song.status !== "processed") return;
        const alignment = get().selectedAlignment;
        if (!alignment) return;
        lyricsCtl.stop();
        const subtitlesPreset = get().getSubtitlesPreset(song.id);
        const styleOptionsMapping = get().getStyleOptionsMapping(song.id);
        const resolution = await library.getVideoResolution(song);

        await lyricsCtl.load({
          alignment,
          preset: subtitlesPreset,
          runtime: {
            styleOptionsMapping,
            lang: song.lang,
            rtl: library.isRTL(song.lang),
            title: song.songTitle || song.title,
            artists: song.artists || [],
            resolution,
          },
        });
        playerCtl.pause();
        setTimeout(async () => {
          await playerCtl.play();
        }, 100);
      },

      async setSubtitlesPreset(songId: string, subtitlesPresetId: string) {
        await lib.updateSong(songId, { subtitlesPresetId });
        set((state) => {
          const song = state.songs[songId];
          if (song?.status === "processed") {
            song.subtitlesPresetId = subtitlesPresetId;
          }
        });
      },

      getSubtitlesPreset(songId: string): SubtitlesPreset {
        const defaultSubtitlePreset = useSettingsStore
          .getState()
          .getDefaultSubtitlesPreset();
        const song = get().songs[songId];
        if (!song || song.status !== "processed") return defaultSubtitlePreset;
        if (!song.subtitlesPresetId) return defaultSubtitlePreset;
        const subtitlesPreset = useSettingsStore
          .getState()
          .subtitlesPresets.find((s) => s.id === song.subtitlesPresetId);
        if (!subtitlesPreset) return defaultSubtitlePreset;
        return subtitlesPreset;
      },

      async updateStyleMapping(songId: string, styleMappingId: string) {
        set((state) => {
          const song = state.songs[songId];
          if (song?.status === "processed") {
            song.styleMappingId = styleMappingId;
          }
        });
        await lib.updateSong(songId, { styleMappingId });
      },

      importStem(input: InputImportStem) {
        const job = new JobImportStem(input);
        job.on("output", ({ song }: OutputImportStem) => {
          set((state) => {
            state.songs[song.id] = song;
          });
        });
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      playIfEmpty(songId: string, qid?: string) {
        if (!get().songId) {
          get().playSong(songId, qid);
        }
      },

      async resizeVideo(input: InputResizeVideo) {
        const job = new JobResizeVideo(input);
        job.on("output", ({ song, video }: OutputResizeVideo) => {
          song.selectedVideo = video.id;
          set((state) => {
            state.songs[song.id] = song;
          });
        });
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      playPlaylistItem(playlistId: string, playlistItemId: string) {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        const playlistItem = playlist.items.find(
          (item) => item.id === playlistItemId
        );
        if (!playlistItem) return;
        let qsong = queueCtl.items.find((item) => item.qid === playlistItemId);
        if (qsong) {
          queueCtl.current = qsong;
        } else {
          get().playPlaylist(playlistId, playlistItemId);
        }
      },

      async persistPlaylist(playlistId: string) {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        await lib.updatePlaylist(playlist);
      },

      async movePlaylistItem(
        playlistId: string,
        from: number,
        to: number
      ): Promise<void> {
        const playlist = structuredClone(get().playlists[playlistId]);
        if (!playlist) return;
        const playlistItem = playlist.items[from];
        if (!playlistItem) return;

        if (from < 0 || from >= playlist.items.length) {
          return;
        }
        if (to < 0 || to >= playlist.items.length) {
          return;
        }

        const item = playlist.items[from];
        playlist.items.splice(from, 1);
        playlist.items.splice(to, 0, item);

        if (queueCtl.items.length === playlist.items.length) {
          queueCtl.move(from, to);
        }

        set((state) => {
          state.playlists[playlistId] = playlist;
        });
      },

      playPlaylist(playlistId: string, playlistItemId?: string) {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        get().setPlaylistId(playlistId);

        const songs = get().songs;
        const items: ISongQueue[] = [];
        playlist.items.forEach((item) => {
          const song = songs[item.songId];
          if (!song) return;
          items.push({ ...song, qid: item.id });
        });
        let index = 0;
        if (playlistItemId) {
          index = playlist.items.findIndex(
            (item: IPlaylist2Item) => item.id === playlistItemId
          );
          if (index === -1) {
            index = 0;
          }
        }
        queueCtl.setItems(items);
        if (items.length > 0) {
          queueCtl.current = items[index];
        }
      },

      async updatePlaylist(playlist: IPlaylist2) {
        await lib.updatePlaylist(playlist);
      },

      async removePlaylist(playlistId: string) {
        await lib.deletePlaylist(playlistId);
      },

      setPlaylistId(playlistId?: string) {
        set((state) => {
          state.playlistId = playlistId;
        });
      },

      async addToPlaylist(playlistId: string, playlistItem: IPlaylist2Item) {
        const playlist = structuredClone(get().playlists[playlistId]);
        if (!playlist) throw new Error("Playlist not found");
        playlist.items.push(playlistItem);
        await lib.updatePlaylist(playlist);
      },

      async removeFromPlaylist(playlistId: string, playlistItemId: string) {
        const playlist = structuredClone(get().playlists[playlistId]);
        if (!playlist) throw new Error("Playlist not found");
        playlist.items = playlist.items.filter(
          (item: IPlaylist2Item) => item.id !== playlistItemId
        );
        await lib.updatePlaylist(playlist);
      },

      async createPlaylist(playlist: IPlaylist2) {
        await lib.addPlaylist(playlist);
        return playlist;
      },

      async deletePlaylist(playlistId: string) {
        await lib.deletePlaylist(playlistId);
      },

      setDualScreenOpen(dualScreenOpen: boolean) {
        set((state) => {
          state.dualScreenOpen = dualScreenOpen;
        });
      },

      async getSong(id: string) {
        return lib.getSong(id);
      },

      async reindexLibrary() {
        await lib.clear();
        await lib.init();

        const libSongs = await lib.songs();
        const songs: Record<string, ISongProcessed> = {};
        for (const song of libSongs) {
          songs[song.id] = song;
        }

        const libPlaylists = await lib.playlists();
        const playlists: Record<string, IPlaylist2> = {};
        for (const playlist of libPlaylists) {
          playlists[playlist.id] = playlist;
        }

        set(() => ({ songs, playlists }));
      },

      importKaraoke(input: InputImportKaraoke) {
        const job = new JobImportKaraoke(input);
        job.on("output", ({ song }: OutputImportKaraoke) => {
          set((state) => {
            state.songs[song.id] = song;
          });

          const qsong = queueCtl.items.find((item) => item.id === song.id);
          if (qsong) {
            const newSong = { ...song, qid: qsong.qid };
            queueCtl.update(newSong);

            if (queueCtl.current?.id === song.id) {
              queueCtl.current = newSong;
            }
          }
        });
        get().addJob(job);
      },

      increaseVocalsVolume() {
        const vocalsVolume = get().vocalsVolume + 0.1;
        get().setVocalsVolume(vocalsVolume);
      },

      decreaseVocalsVolume() {
        const vocalsVolume = get().vocalsVolume - 0.1;
        get().setVocalsVolume(vocalsVolume);
      },

      mute() {
        set((state) => {
          state.vocalsVolume = 0;
          state.noVocalsVolume = 0;
        });
      },

      unmute() {
        set((state) => {
          state.vocalsVolume = 0;
          state.noVocalsVolume = 1;
        });
      },

      setSongId(songId: string) {
        const song = get().songs[songId];
        set((state) => {
          state.songId = songId;

          if (song?.status === "processed") {
            state.dualSong = song;
          }
        });
      },

      async refreshPlayer() {
        const time = get().time;
        const vocalsStem = get().selectedVocals;
        const instrumentsStem = get().selectedInstruments;
        const video = get().selectedVideo;
        if (!instrumentsStem || !video) return;
        playerCtl.once("canplay", async () => {
          await playerCtl.play();
        });
        await playerCtl.load({ vocalsStem, instrumentsStem, video });
        playerCtl.time = time;

        const alignment = get().selectedAlignment;
        if (alignment) {
          get().setSelectedAlignment(alignment.id, true);
        }
      },

      async selectByGroupId(songId: string, groupId: string) {
        const song = await lib.getSong(songId);
        if (!song) return;
        const vocalsStem =
          song.stems.find(
            (s) => s.type === "vocals" && s.groupId === groupId
          ) || get().selectedVocals;
        const instrumentsStem =
          song.stems.find(
            (s) => s.type === "instruments" && s.groupId === groupId
          ) || get().selectedInstruments;
        const video =
          song.videos.find((v) => v.groupId === groupId) || get().selectedVideo;
        const alignment =
          song.alignments2?.find((a) => a.groupId === groupId) ||
          get().selectedAlignment;

        set((state) => {
          state.selectedVideo = video;
          state.dualSelectedVideo = video;
          state.selectedVocals = vocalsStem;
          state.selectedInstruments = instrumentsStem;
          state.selectedAlignment = alignment;
        });
        get().refreshPlayer();

        try {
          await lib.updateSong(songId, {
            selectedVideo: video?.id || "",
            selectedInstruments: instrumentsStem?.id || "",
            selectedVocals: vocalsStem?.id || "",
            selectedAlignment: alignment?.id || "",
          });
        } catch (e) {
          report.error(e as any);
        }
      },

      async setSelectedVideo(id: string, video: ISongVideo) {
        if (video.groupId) return get().selectByGroupId(id, video.groupId);

        if (get().selectedVideo?.groupId) {
          return get().selectNotGroupId(id, { video });
        }

        set((state) => {
          state.selectedVideo = video;
          state.dualSelectedVideo = video;
        });
        get().refreshPlayer();

        try {
          await lib.updateSong(id, {
            selectedVideo: video.id,
          });
        } catch (e) {
          report.error(e as any);
        }
      },

      async setSelectedInstrumentsAndVocals(
        instrumentsStem: ISongStem,
        vocalsStem: ISongStem
      ) {
        set((state) => {
          state.selectedVocals = vocalsStem;
          state.selectedInstruments = instrumentsStem;
        });
        get().refreshPlayer();

        try {
          const id = get().songId;
          await lib.updateSong(id, {
            selectedInstruments: instrumentsStem.id,
            selectedVocals: vocalsStem.id,
          });
        } catch (e) {
          report.error(e as any);
        }
      },

      async setSelectedVocals(id: string, stem: ISongStem) {
        if (stem.groupId) return get().selectByGroupId(id, stem.groupId);

        if (get().selectedVocals?.groupId) {
          return get().selectNotGroupId(id, { vocals: stem });
        }

        set((state) => {
          state.selectedVocals = stem;
        });
        get().refreshPlayer();

        try {
          await lib.updateSong(id, {
            selectedVocals: stem.id,
          });
        } catch (e) {
          report.error(e as any);
        }
      },

      async setSelectedInstruments(id: string, instrumentsStem: ISongStem) {
        if (instrumentsStem.groupId)
          return get().selectByGroupId(id, instrumentsStem.groupId);

        if (get().selectedInstruments?.groupId) {
          return get().selectNotGroupId(id, { instruments: instrumentsStem });
        }

        set((state) => {
          state.selectedInstruments = instrumentsStem;
        });
        get().refreshPlayer();

        try {
          await lib.updateSong(id, {
            selectedInstruments: instrumentsStem.id,
          });
        } catch (e) {
          report.error(e as any);
        }
      },

      importSubtitles(input: InputImportSubtitles) {
        const job = new JobImportSubtitles(input);
        job.on("output", ({ alignment }: OutputImportSubtitles) => {
          get().updateAlignment(input.song.id, alignment, false);
        });
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      async split(song: Song, splitModel: string) {
        const job = new JobSplit({ song, splitModel });
        job.on("output", ({ song }: OutputSplit) => {
          set((state) => {
            state.songs[song.id] = song;
          });
          const currentSongId = get().songId;

          if (currentSongId === song.id) {
            const vocalsStem = song.stems.find(
              (s) => s.modelId === splitModel && s.type === "vocals"
            );
            const instrumentsStem = song.stems.find(
              (s) => s.modelId === splitModel && s.type === "instruments"
            );
            if (instrumentsStem && vocalsStem) {
              get().setSelectedInstrumentsAndVocals(
                instrumentsStem,
                vocalsStem
              );
            }
          }
        });
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      trim(input: InputTrim) {
        const job = new JobTrim(input);
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
        return job;
      },

      addKaraokeIntro(input: InputAddKaraokeIntro) {
        const job = new JobAddKaraokeIntro(input);
        job.on("output", ({ song, groupId }: OutputAddKaraokeIntro) => {
          set((state) => {
            state.songs[song.id] = song;
          });

          get().selectByGroupId(song.id, groupId);
        });
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
        return job;
      },

      toggleMuteVocals() {
        if (get().vocalsVolume === 0) {
          get().setVocalsVolume(1);
        } else {
          get().setVocalsVolume(0);
        }
      },

      toggleMuteNoVocals() {
        if (get().noVocalsVolume === 0) {
          get().setNoVocalsVolume(1);
        } else {
          get().setNoVocalsVolume(0);
        }
      },

      async syncAlignments(id: string) {
        const { alignments } = await client.alignments(id);
        await lib.updateSong(id, { alignments2: alignments });
        set((state) => {
          const song = state.songs[id];
          if (song?.status === "processed") {
            song.alignments2 = alignments;
          }
        });
      },

      seekRight() {
        let time = get().time + 5;
        if (time > get().duration) {
          time = get().duration;
        }
        get().setSeeked(time);
      },

      seekLeft() {
        let time = get().time - 5;
        if (time < 0) {
          time = 0;
        }
        get().setSeeked(time);
      },

      async reportUsage() {
        try {
          await client.reportUsage();
        } catch (e) {
          report.error("failed to report usage", e as any);
        }
        await get().refreshCreditsData();
        await get().refreshRole();
      },

      async refreshCreditsData() {
        const creditsData = await client.creditsData();
        set((state) => {
          state.creditsData = creditsData;
        });
      },

      async refreshRole() {
        let { role } = await client.role();
        if (
          ![
            "credits",
            "basic",
            "standard",
            "pro",
            "payperuse",
            "trial",
            "trial-expired",
          ].includes(role)
        ) {
          role = "none";
        }
        set({ role });
      },

      setUpgradeClose() {
        set((state) => {
          state.upgrade.open = false;
        });
      },

      setUpgradeOpen(feature: string, role: Role) {
        set((state) => {
          state.upgrade.open = true;
          state.upgrade.feature = feature;
          state.upgrade.role = role;
        });
      },

      moveSong(from: number, to: number) {
        queueCtl.move(from, to);
      },

      redoJob(id: string) {
        const job = jobs[id];
        if (job) {
          job.init();
          get().addJob(job);
          if (job.type === "create-karaoke") {
            set((state) => {
              state.song2job[job.input.song.id] = job.id;
            });
          }
        }
      },

      cancelJob(id: string) {
        const job = jobs[id];
        if (job) {
          set((state) => {
            state.jobs[job.id].status = "aborting";
          });
          job.abort();
        }
      },

      async changeBackground(input: InputChangeBackground) {
        const job = new JobChangeBackground(input);

        job.on("output", ({ song }: OutputChangeBackground) => {
          set((state) => {
            state.songs[song.id] = song;
          });
        });

        get().addJob(job);

        set((state) => {
          state.tab = "jobs";
        });
      },

      showUpdateNotification() {
        set((state) => {
          const found = state.notifications.find((n) => n.id === "update");
          if (!found) {
            state.notifications.unshift({
              id: "update",
              type: "update",
              data: {},
            });
          }
        });
      },

      async setMetadata(id: string, metadata: SongMetadata) {
        await lib.updateSong(id, metadata);
        set((state) => {
          const song = state.songs[id];
          song.title = metadata.title || "Untitled";
          song.lang = metadata.lang;
          song.image = metadata.image || song.image;
        });
      },

      setToken(token: string) {
        set({ token });
      },

      setTab(tab: TabType) {
        set({ tab });
      },

      markAllNotificationsAsRead() {
        set((state) => {
          state.notifications.forEach((notification) => {
            notification.read = true;
          });
        });
      },

      setSeeked(time: number) {
        playerCtl.time = time;
        set({
          time,
          seeking: false,
        });
      },

      setSeeking(time: number) {
        set({
          time,
          seeking: true,
        });
      },

      async setSelectedAlignment(alignmentId?: string, refresh?: boolean) {
        if (!alignmentId) {
          set({
            selectedAlignment: undefined,
            dualSelectedAlignment: undefined,
          });
          lyricsCtl.stop();
          return;
        }

        const song = get().songs[get().songId];
        if (!song) return;
        if (song.status !== "processed") return;
        const alignment = song?.alignments2?.find((a) => a.id === alignmentId);
        if (alignment) {
          const subtitlesPreset = get().getSubtitlesPreset(song.id);
          const styleOptionsMapping = get().getStyleOptionsMapping(song.id);
          const resolution = await library.getVideoResolution(song);
          await lyricsCtl.load({
            alignment,
            preset: subtitlesPreset,
            runtime: {
              styleOptionsMapping,
              lang: song.lang,
              rtl: library.isRTL(song.lang),
              title: song.songTitle || song.title,
              artists: song.artists || [],
              resolution,
            },
          });
          if (refresh) {
            playerCtl.pause();
            setTimeout(async () => {
              await playerCtl.play();
            }, 100);
          }
          await lib.updateSong(song.id, { selectedAlignment: alignment.id });
        }
      },

      setVocalsVolume(volume: number) {
        if (volume < 0) {
          volume = 0;
        } else if (volume > 1) {
          volume = 1;
        }
        set({ vocalsVolume: volume });
        playerCtl.setVocalsVolume(volume);
      },

      setNoVocalsVolume(volume: number) {
        if (volume < 0) {
          volume = 0;
        } else if (volume > 1) {
          volume = 1;
        }
        set({ noVocalsVolume: volume });
        playerCtl.setNoVocalsVolume(volume);
      },

      setPitch(pitch: number) {
        playerCtl.pitch = pitch;
        set({ pitch });
      },

      setTempo(tempo: number) {
        playerCtl.tempo = tempo;
        set({ tempo });
      },

      next() {
        queueCtl.next();
      },

      setFullScreen(fullScreen: boolean) {
        set({ fullScreen });
      },

      removeFromQueue(item: ISongQueue) {
        queueCtl.remove(item);
      },

      togglePlay(): void {
        if (!get().songId) return;

        if (get().playing) {
          get().pause();
        } else {
          get().play();
        }
      },

      addToQueue(song: Song) {
        const qsong = {
          ...song,
          qid: uuidv4(),
        };
        const msong = get().songs[song.id];
        if (!msong) {
          set((state) => {
            state.songs[song.id] = qsong;
          });
        }
        queueCtl.append(qsong);
        return qsong;
      },

      async playSong(songId: string, qid?: string | null) {
        get().setSongId(songId);

        if (!qid) {
          qid = queueCtl.items.find((item) => item.id === songId)?.qid;
        }
        if (qid) {
          const qsong = queueCtl.items.find((item) => item.qid === qid);
          if (qsong?.status === "processed") {
            queueCtl.current = qsong;
            return;
          }
        }

        let song: Song | undefined = get().songs[songId];
        if (!song) {
          report.warn("play song that is not processed", { songId, song });
          return;
        }

        const qsong = {
          ...song,
          qid: uuidv4(),
        };
        queueCtl.clear();
        queueCtl.append(qsong);
        queueCtl.current = qsong;
      },

      async load(song: ISongProcessed, autoplay: boolean = true) {
        amplitude.track("play_song");
        get().stop();
        get().setSongId(song.id);
        set((state) => {
          state.canplay = false;
          state.loading = true;
        });

        const preferedInstrumentStem = song.stems.find(
          (s) => s.id === song.selectedInstruments
        );
        const preferedVocalsStem = song.stems.find(
          (s) => s.id === song.selectedVocals
        );
        const preferedVideo = song.videos.find(
          (v) => v.id === song.selectedVideo
        );

        const instrumentsStem =
          preferedInstrumentStem ||
          song.stems.find((s) => s.type === "instruments");
        const vocalsStem =
          preferedVocalsStem || song.stems.find((s) => s.type === "vocals");
        const video = preferedVideo || song.videos[0];

        if (!video || !instrumentsStem) {
          throw new Error("missing stems or video");
        }

        set((state) => {
          state.selectedInstruments = instrumentsStem;
          state.selectedVocals = vocalsStem;
          state.selectedVideo = video;
          state.dualSelectedVideo = video;
        });

        await playerCtl.load({ video, instrumentsStem, vocalsStem });

        if (autoplay) {
          try {
            await pRetry(
              async () => {
                await playerCtl.play();
              },
              { retries: 3 }
            );
          } catch (e) {
            report.error("play failed", { e, song });
          }
        }
      },

      play: async () => {
        if (get().time >= get().duration) {
          playerCtl.time = 0;
        }
        await playerCtl.play();
      },

      pause: () => {
        playerCtl.pause();
      },

      stop: () => {
        playerCtl.stop();
        lyricsCtl.stop();
        playerCtl.time = 0;

        queueCtl.current = undefined;
        get().setSongId("");
        set((state) => {
          state.time = 0;
        });
      },

      async initPlayer() {
        const element = get().element;
        await playerCtl.init(element);

        playerCtl.setVocalsVolume(get().vocalsVolume);

        playerCtl.on("durationchange", (duration: number) => {
          set({ duration });
        });

        playerCtl.on("timeupdate", (time: number) => {
          if (get().seeking) return;
          set((state) => {
            state.time = time;
          });
          if (get().dualScreenOpen) {
            localStorage.setItem("time", time.toString());
          }
        });

        playerCtl.on("canplay", () => {
          set({ canplay: true });
        });

        playerCtl.on("pause", () => {
          set({ playing: false });
          localStorage.setItem("playing", "false");
        });

        playerCtl.on("playing", () => {
          set({ playing: true, loading: false });
          localStorage.setItem("playing", "true");
        });

        playerCtl.on("seeking", () => {
          set({ seeking: true });
        });

        playerCtl.on("seeked", () => {
          set({ seeking: false });
        });

        playerCtl.on("ended", () => {
          get().next();
        });
      },

      createKaraoke(input: InputCreateKaraoke) {
        const job = new JobCreateKaraoke(input);

        job.on("output", ({ song }: OutputCreateKaraoke) => {
          get().reportUsage();

          set((state) => {
            state.songs[song.id] = song;
          });

          const qsong = queueCtl.items.find((item) => item.id === song.id);
          if (qsong) {
            const newSong = { ...song, qid: qsong.qid };
            queueCtl.update(newSong);

            if (queueCtl.current?.id === song.id) {
              queueCtl.current = newSong;
            }
          }
        });

        get().addJob(job);

        const song = input.song;
        set((state) => {
          state.tab = "jobs";
          state.songs[song.id] = song;
          state.song2job[song.id] = job.id;
        });
      },

      async initQueue() {
        queueCtl.on("change", (qsongs: Song[]) => {
          set({
            queue: [...qsongs],
            hasNext: queueCtl.hasNext,
          });
        });

        queueCtl.on("current", async (qsong?: ISongQueue) => {
          get().stop();

          if (!qsong) {
            set({
              songId: "",
              qid: "",
              hasNext: queueCtl.hasNext,
            });
            return;
          }

          let song = get().songs[qsong.id];
          if (!song && qsong.id) {
            const lsong = await lib.getSong(qsong.id);
            if (lsong) {
              song = lsong;
            }
          }
          if (!song) {
            const newSong = {
              ...qsong,
            };
            set((state) => {
              state.songs[newSong.id] = newSong as Song;
            });
          }
          set({
            songId: qsong.id,
            qid: qsong.qid,
            hasNext: queueCtl.hasNext,
          });
          if (song?.status === "processed") {
            get().load(song as ISongProcessed);
          }
        });
      },

      addJob(job: IJob<any, any>) {
        job.on("status", (status: JobStatus) => {
          set((state) => {
            state.jobs[job.id].status = status;
          });
        });

        job.on("output", (output: any) => {
          set((state) => {
            state.jobs[job.id].output = output;
          });
        });

        job.on("progress", (progress: number) => {
          set((state) => {
            state.jobs[job.id].progress = progress;
          });
        });

        job.on("error", (error: Error | MayIError) => {
          set((state) => {
            state.jobs[job.id].error = error.message;
            console.error(error);
            report.error(error, state.jobs[job.id]);
          });

          if (error instanceof MayIError) {
            set((state) => {
              state.modal.open = true;
              state.modal.reason = error.reason;
            });
          }
        });

        set((state) => {
          state.jobs[job.id] = {
            id: job.id,
            name: job.name,
            type: job.type,
            input: job.input,
            status: "pending",
            progress: 0,
            created: new Date().getTime(),
          };
        });

        workerCtl.addJob(job);
        jobs[job.id] = job;
      },

      async initLibrary() {
        await lib.init();
        const libSongs = await lib.songs();
        const libPlaylists = await lib.playlists();

        const songs: Record<string, ISongProcessed> = {};
        for (const song of libSongs) {
          songs[song.id] = song;
        }
        set(() => ({ songs }));

        const playlists: Record<string, IPlaylist2> = {};
        for (const playlist of libPlaylists) {
          playlists[playlist.id] = playlist;
        }
        set(() => ({ playlists }));

        lib.on("update", (song: ISongProcessed) => {
          set((state) => {
            state.songs[song.id] = {
              ...state.songs[song.id],
              ...song,
            };
          });
        });

        lib.on("add", (song: ISongProcessed) => {
          set((state) => {
            state.songs[song.id] = song;
          });
        });

        lib.on("delete", (song: ISongPreview) => {
          set((state) => {
            delete state.songs[song.id];
            delete state.song2job[song.id];
          });

          if (song.id === queueCtl.current?.id) {
            get().stop();
          }
          for (const s of queueCtl.items) {
            if (s.id === song.id) {
              queueCtl.remove(s);
            }
          }
        });

        lib.on("playlist:update", (playlist: IPlaylist2) => {
          set((state) => {
            state.playlists[playlist.id] = playlist;
          });
        });

        lib.on("playlist:add", (playlist: IPlaylist2) => {
          set((state) => {
            state.playlists[playlist.id] = playlist;
          });
        });

        lib.on("playlist:delete", (playlistId: string) => {
          set((state) => {
            delete state.playlists[playlistId];
          });
        });
      },

      async updateAlignment(
        id: string,
        alignment: Alignment2,
        updateServer: boolean,
        updateSegments?: boolean,
        splitModelId?: string
      ) {
        const alignments2 = await library.setAlignment2(id, alignment);

        let stem;
        if (updateSegments && splitModelId) {
          stem = await library.saveMergedVocals(id, splitModelId, alignment);
        }

        if (updateServer && ["word", "subword"].includes(alignment.mode)) {
          try {
            client.updateAlignment(id, alignment);
          } catch (e) {
            report.error(e as any);
          }
        }

        const newSong = await lib.getSong(id);
        if (!newSong) {
          throw new Error("Song not found");
        }

        newSong.selectedAlignment = alignment.id;
        await lib.updateSong(id, newSong);

        set((state) => {
          const song = state.songs[id];
          if (song?.status === "processed") {
            song.stems = newSong.stems;
            song.alignments2 = alignments2;
            song.selectedAlignment = alignment.id;
          }
        });

        if (stem) {
          await get().setSelectedInstruments(id, stem);
        }
      },

      async exportMedia(input: InputExportMedia) {
        const role = get().role;
        input.addWatermark = role !== "pro" && role !== "payperuse";
        const job = new JobExportMedia(input);
        get().addJob(job);
        set((state) => {
          state.tab = "jobs";
        });
      },

      async setLyrics(song: Song, lyrics: string): Promise<void> {
        await library.setLyrics(song.id, lyrics);
        set((state) => {
          const lsong = state.songs[song.id];
          if (lsong?.status === "processed") {
            lsong.lyrics = lyrics;
          }
        });
      },

      async syncLyrics(
        song: Song,
        lyrics: string,
        lang: string,
        alignModel: string
      ): Promise<JobSyncLyrics | undefined> {
        await library.setLyrics(song.id, lyrics);
        set((state) => {
          const lsong = state.songs[song.id];
          if (lsong?.status === "processed") {
            lsong.lyrics = lyrics;
          }
        });

        const job = new JobSyncLyrics({ song, lyrics, alignModel, lang });

        job.on("output", ({ song: newSong, alignment }: OutputSyncLyrics) => {
          set((state) => {
            state.songs[song.id] = newSong;
          });
          get().setSelectedAlignment(alignment.id, true);
        });
        get().addJob(job);
        return job;
      },

      setCloseModal() {
        set((state) => {
          state.modal.open = false;
        });
      },

      async deleteSong(song: ISongPreview) {
        await lib.deleteSong(song);
        if (song.id === get().songId) {
          set((state) => {
            state.songId = "";
          });
        }
      },

      async init() {
        try {
          get().initQueue();
          await get().initLibrary();
          await get().initPlayer();
          await get().initLyrics();
          try {
            await get().fixIndex();
          } catch (error) {
            console.error(error);
          }
          set({ ready: true });
        } catch (error) {
          if (error instanceof Error) {
            console.error(error);
            report.error("Player Init Error", { error });
            set({ error });
          }
        }
      },

      async fixIndex() {
        const migrateIndex2 = useSettingsStore.getState().migrateIndex2;
        if (!migrateIndex2) {
          return;
        }
        const songs = await lib.songs();
        const hasPeaks = songs.some(
          // @ts-expect-error
          (s) => s.analysis?.peakWaveform !== undefined
        );
        if (hasPeaks) {
          await get().reindexLibrary();
        }
        useSettingsStore.setState({ migrateIndex2: false });
      },

      async initLyrics() {
        queueCtl.on("current", async (qsong?: ISongQueue) => {
          lyricsCtl.stop();
          if (!qsong) return;
          const song = await lib.getSong(qsong.id);
          if (song?.status === "processed" && song?.alignments2?.length) {
            let preferedAlignment = song.alignments2?.find(
              (a) => a.id === song.selectedAlignment
            );
            if (!preferedAlignment) {
              preferedAlignment = song.alignments2?.[0];
            }
            const alignment = Object.assign({}, preferedAlignment);

            const subtitlesPreset = get().getSubtitlesPreset(song.id);
            const styleOptionsMapping = get().getStyleOptionsMapping(song.id);
            const resolution = await library.getVideoResolution(song);

            lyricsCtl.load({
              alignment,
              preset: subtitlesPreset,
              runtime: {
                styleOptionsMapping,
                lang: song.lang,
                rtl: library.isRTL(song.lang),
                title: song.songTitle || song.title,
                artists: song.artists || [],
                resolution,
              },
            });
          }
        });

        lyricsCtl.on("change", (alignment: Alignment2) => {
          set({
            selectedAlignment: alignment,
            dualSelectedAlignment: alignment,
          });
        });

        await lyricsCtl.init();
      },
    })),
    {
      name: "player",
      partialize: (state) => ({
        dualSelectedVideo: state.dualSelectedVideo,
        dualSelectedAlignment: state.dualSelectedAlignment,
        dualSong: state.dualSong,
      }),
    }
  )
);
