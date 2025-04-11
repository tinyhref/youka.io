import { EventEmitter } from "events";
import * as library from "@/lib/library";
import {
  Alignment2,
  FileType,
  IPlaylist2,
  IRepo,
  ISongProcessed,
  ISongStem,
  ISongVideo,
  MediaMode,
  MetadataMode,
  Song,
  VideoType,
} from "@/types";
import rimraf from "rimraf";
import { join } from "path";
import { LIBRARY_PATH } from "@/lib/path";
import fs from "fs";
import { randomUUID } from "crypto";
import {
  exists,
  getNewPathSafe,
  getNewUrlPathSafe,
  splitStringToChunks,
} from "@/lib/utils";
import Debug from "debug";
import {
  Alignment2Schema,
  SongMetadataSchema,
  SongSchema,
} from "@/lib/schemas";
import rollbar from "../rollbar";
import { imageUrl, parseYoutubeId } from "../youtube";
import { DEFAULT_BACKGROUND_IMAGE_URL } from "@/consts";
import { SPAnalysisResult } from "../sp";
const debug = Debug("youka:desktop");

export default class MetadataRepo extends EventEmitter implements IRepo {
  private _count: number = 0;

  async deleteVideo(songId: string, videoId: string): Promise<ISongProcessed> {
    throw new Error("not implemented");
  }

  async deleteStem(songId: string, stemId: string): Promise<ISongProcessed> {
    throw new Error("not implemented");
  }

  async deleteAlignment(
    songId: string,
    alignmentId: string
  ): Promise<ISongProcessed> {
    throw new Error("not implemented");
  }

  async playlists(): Promise<IPlaylist2[]> {
    throw new Error("not implemented");
  }

  async addPlaylist(playlist: IPlaylist2): Promise<IPlaylist2> {
    throw new Error("not implemented");
  }

  async deletePlaylist(id: string) {
    throw new Error("not implemented");
  }

  async getPlaylist(id: string): Promise<IPlaylist2 | undefined> {
    throw new Error("not implemented");
  }

  async updatePlaylist(playlist: IPlaylist2): Promise<IPlaylist2> {
    throw new Error("not implemented");
  }

  async count() {
    return this._count;
  }

  async clear() {
    throw new Error("not implemented");
  }

  async songs() {
    console.log("read songs metadata");
    if (!(await exists(LIBRARY_PATH))) {
      return [];
    }

    const files = await fs.promises.readdir(LIBRARY_PATH, {
      withFileTypes: true,
    });
    const ids = files
      .filter((dirent) => dirent.isDirectory())
      .filter((dirent) => isValidId(dirent.name))
      .map((dirent) => dirent.name);

    const songs: ISongProcessed[] = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      try {
        const song = await this.getSongFromDirectory(id, LIBRARY_PATH);
        if (song) {
          songs.push(song);
          await this.addSong(song);
        } else {
          debug("song is undefined", id);
        }
      } catch (e) {
        console.error(id, e);
      }
    }
    this._count = songs.length;
    return songs;
  }

  async init() {
    await library.safemkdir(LIBRARY_PATH);
  }

  async bulkAddSongs(songs: ISongProcessed[]): Promise<void> {
    throw new Error("not implemented");
  }

  async bulkAddPlaylists(playlists: IPlaylist2[]): Promise<void> {
    throw new Error("not implemented");
  }

  async addSong(song: ISongProcessed) {
    const fp = library.filepath(song.id, MetadataMode.Info, FileType.JSON);
    try {
      const parsedSong = SongSchema.parse(song);
      await fs.promises.writeFile(
        fp,
        JSON.stringify(parsedSong, null, 2),
        "utf8"
      );
      this.emit("add", parsedSong);
    } catch (e) {
      rollbar.error("Failed to add song", { e, song });

      await fs.promises.writeFile(fp, JSON.stringify(song, null, 2), "utf8");
      this.emit("add", song);
    }
  }

  async getSong(id: string): Promise<ISongProcessed | undefined> {
    const fp = library.filepath(id, MetadataMode.Info, FileType.JSON);
    if (!(await exists(fp))) return;

    const data = await fs.promises.readFile(fp, "utf-8");
    try {
      const metadata = JSON.parse(data);
      const parsedSong = SongSchema.parse(metadata);
      return parsedSong;
    } catch (e) {
      const metadata = splitStringToChunks(data, 500);
      rollbar.error("Failed to parse song metadata", {
        e,
        metadata,
      });
      return JSON.parse(data) as ISongProcessed;
    }
  }

  async getSongMetadata(id: string) {
    const fp = library.filepath(id, MetadataMode.Info, FileType.JSON);
    if (!(await exists(fp))) return;
    const data = await fs.promises.readFile(fp, "utf-8");
    const metadata = JSON.parse(data.toString());
    return SongMetadataSchema.parse(metadata);
  }

  async getSongFromDirectory(
    id: string,
    libraryPath: string
  ): Promise<ISongProcessed | undefined> {
    let metadata;
    try {
      metadata = await this.getSongMetadata(id);
    } catch (e) {
      console.warn("can't get metadata", id, e);
      return;
    }

    if (!metadata) {
      console.warn("metadata is undefined", id);
      return;
    }

    const videoPath = library.filepath(id, MediaMode.Video, FileType.MP4);
    const originalPath = library.filepath(id, MediaMode.Original, FileType.M4A);
    const originalExists = await exists(originalPath);

    let stems: ISongStem[] = [];

    if (metadata.stems?.length) {
      for (const stem of metadata.stems) {
        const filepath = await getNewPathSafe(id, libraryPath, stem.filepath);
        if (filepath) {
          const newStem = {
            ...stem,
            filepath,
          };
          stems.push(newStem);
        } else {
          stems.push(stem);
        }
      }
    } else {
      const vocalsPath = library.filepath(id, MediaMode.Vocals, FileType.M4A);
      const instrumentsPath = library.filepath(
        id,
        MediaMode.Instruments,
        FileType.M4A
      );
      const instrumentsMdxKara2Path = library.getStemFilepath(
        id,
        "instruments",
        "uvr_mdxnet_kara_2"
      );
      const vocalsMdxKara2Path = library.getStemFilepath(
        id,
        "vocals",
        "uvr_mdxnet_kara_2"
      );
      const instrumentsReformerPath = library.getStemFilepath(
        id,
        "instruments",
        "bs_roformer"
      );
      const vocalsReformerPath = library.getStemFilepath(
        id,
        "vocals",
        "bs_roformer"
      );
      const instrumentsMdx23c = library.getStemFilepath(
        id,
        "instruments",
        "mdx23c"
      );
      const vocalsMdx23c = library.getStemFilepath(id, "vocals", "mdx23c");

      const requiredPaths = Promise.all([
        exists(vocalsPath),
        exists(instrumentsPath),
        exists(instrumentsMdxKara2Path),
        exists(vocalsMdxKara2Path),
        exists(instrumentsReformerPath),
        exists(vocalsReformerPath),
        exists(instrumentsMdx23c),
        exists(vocalsMdx23c),
      ]);
      const [
        vocalsExists,
        instrumentsExists,
        instrumentsMdxKara2Exists,
        vocalsMdxKara2Exists,
        instrumentsReformerExists,
        vocalsReformerExists,
        instrumentsMdx23cExists,
        vocalsMdx23cExists,
      ] = await requiredPaths;

      stems.push({
        id: randomUUID(),
        type: "original",
        modelId: "original",
        filepath: originalPath,
      });

      if (instrumentsExists) {
        stems.push({
          id: randomUUID(),
          type: "instruments",
          modelId: "demucs",
          filepath: instrumentsPath,
        });
      }
      if (vocalsExists) {
        stems.push({
          id: randomUUID(),
          type: "vocals",
          modelId: "demucs",
          filepath: vocalsPath,
        });
      }
      if (instrumentsMdxKara2Exists) {
        stems.push({
          id: randomUUID(),
          type: "instruments",
          modelId: "uvr_mdxnet_kara_2",
          filepath: instrumentsMdxKara2Path,
        });
      }
      if (vocalsMdxKara2Exists) {
        stems.push({
          id: randomUUID(),
          type: "vocals",
          modelId: "uvr_mdxnet_kara_2",
          filepath: vocalsMdxKara2Path,
        });
      }
      if (instrumentsReformerExists) {
        stems.push({
          id: randomUUID(),
          type: "instruments",
          modelId: "bs_roformer",
          filepath: instrumentsReformerPath,
        });
      }
      if (vocalsReformerExists) {
        stems.push({
          id: randomUUID(),
          type: "vocals",
          modelId: "bs_roformer",
          filepath: vocalsReformerPath,
        });
      }
      if (instrumentsMdx23cExists) {
        stems.push({
          id: randomUUID(),
          type: "instruments",
          modelId: "mdx23c",
          filepath: instrumentsMdx23c,
        });
      }
      if (vocalsMdx23cExists) {
        stems.push({
          id: randomUUID(),
          type: "vocals",
          modelId: "mdx23c",
          filepath: vocalsMdx23c,
        });
      }
    }

    let hasOriginal = stems.some((s) => s.type === "original");

    if (!hasOriginal) {
      if (originalExists) {
        stems.push({
          id: randomUUID(),
          type: "original",
          modelId: "original",
          filepath: originalPath,
        });
        hasOriginal = true;
      }
    }

    let videos: ISongVideo[] = [];
    if (metadata.videos?.length) {
      for (const video of metadata.videos) {
        const filepath = await getNewPathSafe(id, libraryPath, video.filepath);
        if (filepath) {
          let type = video.type as VideoType;
          const newVideo = {
            ...video,
            filepath,
            type,
          };
          videos.push(newVideo);
        } else {
          videos.push(video as ISongVideo);
        }
      }
    } else {
      videos.push({
        id: randomUUID(),
        filepath: videoPath,
        type: "original",
        createdAt: await library.getCreatedAt(id),
      });
    }

    let selectedVideo = metadata.selectedVideo;
    let selectedInstruments = metadata.selectedInstruments;
    let selectedVocals = metadata.selectedVocals;

    const selectedVideoEx = metadata.videos?.find(
      (v) => v.id === selectedVideo
    );
    if (!selectedVideoEx) {
      selectedVideo = videos[0].id;
    }

    const selectedInstrumentsEx = metadata.stems?.find(
      (s) => s.id === selectedInstruments
    );
    if (!selectedInstrumentsEx) {
      selectedInstruments =
        stems.find((s) => s.type === "instruments")?.id || "";
    }

    const selectedVocalsEx = metadata.stems?.find(
      (s) => s.id === selectedVocals
    );
    if (!selectedVocalsEx) {
      selectedVocals = stems.find((s) => s.type === "vocals")?.id;
    }

    if (!selectedVideo) {
      selectedVideo = videos[0].id;
    }

    if (!selectedInstruments) {
      selectedInstruments =
        stems.find((s) => s.type === "instruments")?.id || "";
    }

    if (!selectedVocals) {
      selectedVocals = stems.find((s) => s.type === "vocals")?.id;
    }

    if (!selectedVideo || !selectedInstruments) {
      console.warn("Failed to get selected stems");
      return;
    }

    const createdAt = await library.getCreatedAt(id);

    let alignments2: Alignment2[] = [];
    if (metadata.alignments2?.length) {
      metadata.alignments2.forEach((alignment) => {
        let mode;
        const hasSubword = alignment.alignment.some(
          // @ts-ignore
          (a) => a.subword !== undefined
        );
        const hasWord = alignment.alignment.some(
          // @ts-ignore
          (a) => a.word !== undefined
        );
        const hasLine = alignment.alignment.some(
          // @ts-ignore
          (a) => a.line !== undefined
        );

        if (hasSubword) {
          mode = "subword";
        } else if (hasWord) {
          mode = "word";
        } else if (hasLine) {
          mode = "line";
        }

        const fixedAlignment = {
          ...alignment,
          // @ts-ignore
          mode,
          // @ts-ignore
          createdAt: alignment.createdAt || createdAt,
        };
        const out = Alignment2Schema.safeParse(fixedAlignment);
        if (out.success) {
          alignments2.push(out.data);
        } else {
          rollbar.error("Failed to parse alignment", { fixedAlignment });
        }
      });
    }

    try {
      let lyrics = metadata.lyrics;
      if (!lyrics && alignments2) {
        lyrics = library.getLyricsByAlignments(alignments2);
      }
      let lang = metadata.lang;
      let title = metadata.title || "Untitled";
      const rtl =
        lang && ["he", "iw", "ar", "fa", "az", "ku", "dv"].includes(lang)
          ? true
          : false;

      let image;
      if (metadata.image?.startsWith("http")) {
        image = metadata.image;
      } else if (metadata.image) {
        image = await getNewUrlPathSafe(id, libraryPath, metadata.image);
      }

      if (!image) {
        const isYoutubeId = parseYoutubeId(metadata.id);
        if (isYoutubeId) {
          image = imageUrl(metadata.id);
        }
      }

      if (!image) {
        image = DEFAULT_BACKGROUND_IMAGE_URL;
      }

      if (lang?.length !== 2) {
        lang = undefined;
      }

      let partialAnalysis: Omit<SPAnalysisResult, "peakWaveform"> | undefined;
      if (metadata.analysis) {
        const { peakWaveform, ...analysis } = metadata.analysis;
        partialAnalysis = analysis;
      }

      const song: ISongProcessed = {
        id: metadata.id,
        lang,
        type: "song",
        status: "processed",
        image,
        title,
        songTitle: metadata.songTitle,
        artists: metadata.artists,
        createdAt,
        videos,
        stems,
        alignments2,
        lyrics,
        rtl,
        selectedInstruments,
        selectedVideo,
        selectedVocals,
        selectedAlignment: metadata.selectedAlignment,
        subtitlesPresetId: metadata.subtitlesPresetId,
        analysis: partialAnalysis,
      };

      return song;
    } catch (e) {
      // report.error(e as any);
      console.error(e);
    }
  }

  async updateSong(id: string, newSong: ISongProcessed) {
    SongSchema.parse(newSong);
    const fp = library.filepath(id, MetadataMode.Info, FileType.JSON);
    await fs.promises.writeFile(fp, JSON.stringify(newSong, null, 2), "utf8");
    this.emit("update", newSong);
  }

  async deleteSong(song: Song): Promise<void> {
    await new Promise((resolve, reject) => {
      rimraf(join(LIBRARY_PATH, song.id), { maxBusyTries: 10 }, (err) => {
        if (err) return reject(err);
        resolve(null);
      });
    });
    this.emit("delete", song);
  }
}

function isValidId(id: string) {
  return id.startsWith("file-") || id.length === 11;
}
