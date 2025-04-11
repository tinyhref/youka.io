import * as report from "@/lib/report";
import { EventEmitter } from "events";
import { IPlaylist2, IRepo, ISongPreview } from "@/types";
import { ISongProcessed } from "@/types";
import fs from "fs";
import MetadataRepo from "./metadata";
import PouchDBRepo from "./pouchdb";
import DBRepo from "./db";

export default class MultiRepo extends EventEmitter implements IRepo {
  private metadataLib: IRepo;
  private pouchdbLib: IRepo;
  private dbLib: IRepo;
  constructor() {
    super();
    this.metadataLib = new MetadataRepo();
    this.pouchdbLib = new PouchDBRepo();
    this.dbLib = new DBRepo();
  }

  async init() {
    await this.metadataLib.init();
    await this.pouchdbLib.init();
    await this.dbLib.init();
    const count = await this.pouchdbLib.count();
    if (count === 0) {
      console.log("empty db, reindexing");
      const metadataSongs = await this.metadataLib.songs();
      await this.pouchdbLib.bulkAddSongs(metadataSongs);

      const playlists = await this.dbLib.playlists();
      await this.pouchdbLib.bulkAddPlaylists(playlists);
    }
  }

  async deleteVideo(songId: string, videoId: string): Promise<ISongProcessed> {
    const song = await this.getSong(songId);
    if (!song) throw new Error("song not found");
    const video = song.videos.find((v) => v.id === videoId);
    if (!video) throw new Error("video not found");
    await this.pouchdbLib.deleteVideo(songId, videoId);
    await fs.promises.unlink(video.filepath);
    song.videos = song.videos.filter((v) => v.id !== videoId);
    this.metadataLib.updateSong(songId, song);
    this.emit("song:update", song);
    return song;
  }

  async deleteStem(songId: string, stemId: string): Promise<ISongProcessed> {
    const song = await this.getSong(songId);
    if (!song) throw new Error("song not found");
    const stem = song.stems.find((s) => s.id === stemId);
    if (!stem) throw new Error("stem not found");
    await this.pouchdbLib.deleteStem(songId, stemId);
    await fs.promises.unlink(stem.filepath);
    song.stems = song.stems.filter((s) => s.id !== stemId);
    this.metadataLib.updateSong(songId, song);
    this.emit("song:update", song);
    return song;
  }

  async deleteAlignment(
    songId: string,
    alignmentId: string
  ): Promise<ISongProcessed> {
    const song = await this.getSong(songId);
    if (!song) throw new Error("song not found");
    const alignment = song.alignments2?.find((a) => a.id === alignmentId);
    if (!alignment) throw new Error("alignment not found");
    await this.pouchdbLib.deleteAlignment(songId, alignmentId);
    song.alignments2 = song.alignments2?.filter((a) => a.id !== alignmentId);
    this.metadataLib.updateSong(songId, song);
    this.emit("song:update", song);
    return song;
  }

  async bulkAddPlaylists(playlists: IPlaylist2[]) {
    await this.pouchdbLib.bulkAddPlaylists(playlists);
  }

  async playlists(): Promise<IPlaylist2[]> {
    return this.pouchdbLib.playlists();
  }

  async addPlaylist(playlist: IPlaylist2) {
    const libPlaylist = await this.pouchdbLib.addPlaylist(playlist);
    try {
      this.dbLib.addPlaylist(playlist);
    } catch (error) {
      console.error("Error adding playlist to db", error);
    }
    this.emit("playlist:add", libPlaylist);
    return libPlaylist;
  }

  async deletePlaylist(playlistId: string) {
    await this.pouchdbLib.deletePlaylist(playlistId);
    try {
      await this.dbLib.deletePlaylist(playlistId);
    } catch (error) {
      console.error("Error deleting playlist from db", error);
    }
    this.emit("playlist:delete", playlistId);
  }

  async updatePlaylist(playlist: IPlaylist2) {
    const libPlaylist = await this.pouchdbLib.updatePlaylist(playlist);
    try {
      await this.dbLib.updatePlaylist(playlist);
    } catch (error) {
      console.error("Error updating playlist in db", error);
    }
    this.emit("playlist:update", libPlaylist);
    return libPlaylist;
  }

  async getPlaylist(id: string) {
    return this.pouchdbLib.getPlaylist(id);
  }

  async count() {
    return this.pouchdbLib.count();
  }

  async songs(): Promise<ISongProcessed[]> {
    return this.pouchdbLib.songs();
  }

  async clear() {
    await this.pouchdbLib.clear();
  }

  async bulkAddSongs(songs: ISongProcessed[]): Promise<void> {
    await this.pouchdbLib.bulkAddSongs(songs);
  }

  async getSong(id: string): Promise<ISongProcessed | undefined> {
    return this.pouchdbLib.getSong(id);
  }

  async addSong(song: ISongProcessed) {
    fillMissingMetadata(song);

    await this.pouchdbLib.addSong(song);
    await this.metadataLib.addSong(song);
    this.emit("add", song);
  }

  async updateSong(id: string, newSong: Partial<ISongProcessed>) {
    await this.pouchdbLib.updateSong(id, newSong);
    try {
      const libSong = await this.pouchdbLib.getSong(id);
      if (libSong) {
        await this.metadataLib.updateSong(id, libSong);
      } else {
        report.warn("song not found", { id });
      }
    } catch (error) {
      console.error("Error updating song in metadata", error);
      report.warn("Error updating song in metadata", { error });
    }
    this.emit("update", newSong);
  }

  async deleteSong(song: ISongPreview): Promise<void> {
    await this.pouchdbLib.deleteSong(song);
    await this.metadataLib.deleteSong(song);
    this.emit("delete", song);
  }
}

function fillMissingMetadata(song: ISongProcessed) {
  if (song?.lang?.length !== 2) {
    song.lang = undefined;
  }

  song?.alignments2?.forEach((alignment) => {
    if (!alignment.mode) {
      // @ts-ignore
      alignment.mode = "word";
    }
  });
}
