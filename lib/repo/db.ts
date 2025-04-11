import { EventEmitter } from "events";
import {
  IPlaylist2,
  IPlaylist2Item,
  IRepo,
  ISongProcessed,
  Song,
} from "@/types";
import { Low } from "lowdb/lib/core/Low";
import { JSONFilePreset } from "lowdb/node";
import { DB_PATH, ROOT_PATH } from "@/lib/path";
import { exists } from "@/lib/utils";
import { safemkdir } from "@/lib/library";

interface DB {
  songs: ISongProcessed[];
  playlists: IPlaylist2[];
}

type YoukaDB = Low<DB>;

let db: YoukaDB;

export default class DBRepo extends EventEmitter implements IRepo {
  async init() {
    if (!(await exists(DB_PATH))) {
      await safemkdir(ROOT_PATH);
    }
    const defaultData: DB = { songs: [], playlists: [] };
    db = await JSONFilePreset<DB>(DB_PATH, defaultData);
    if (!db.data.songs) {
      db.data.songs = [];
    }
    if (!db.data.playlists) {
      db.data.playlists = [];
    }
  }

  async deleteAlignment(
    songId: string,
    alignmentId: string
  ): Promise<ISongProcessed> {
    throw new Error("not implemented");
  }

  async deleteVideo(songId: string, videoId: string): Promise<ISongProcessed> {
    throw new Error("not implemented");
  }

  async deleteStem(songId: string, stemId: string): Promise<ISongProcessed> {
    throw new Error("not implemented");
  }

  async playlists() {
    return db.data.playlists;
  }

  async addPlaylist(playlist: IPlaylist2) {
    db.data.playlists.push(playlist);
    await db.write();
    return playlist;
  }

  async deletePlaylist(id: string) {
    db.data.playlists = db.data.playlists.filter((p) => p.id !== id);
    await db.write();
  }

  async getPlaylist(id: string) {
    return db.data.playlists.find((p) => p.id === id);
  }

  async updatePlaylist(playlist: IPlaylist2) {
    const playlistIndex = db.data.playlists.findIndex(
      (p) => p.id === playlist.id
    );
    db.data.playlists[playlistIndex] = playlist;
    await db.write();
    return playlist;
  }

  async addToPlaylist(playlistId: string, playlistItem: IPlaylist2Item) {
    const playlistIndex = db.data.playlists.findIndex(
      (p) => p.id === playlistId
    );
    db.data.playlists[playlistIndex].items.push(playlistItem);
    await db.write();

    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    return playlist;
  }

  async removeFromPlaylist(songId: string, playlistId: string) {
    const playlistIndex = db.data.playlists.findIndex(
      (p) => p.id === playlistId
    );
    db.data.playlists[playlistIndex].items = db.data.playlists[
      playlistIndex
    ].items.filter((i) => i.id !== songId);
    await db.write();
    const playlist = await this.getPlaylist(playlistId);
    if (!playlist) {
      throw new Error("Playlist not found");
    }
    return playlist;
  }

  async songs() {
    return db.data.songs;
  }

  async clear() {
    db.data.songs = [];
  }

  async count() {
    return db.data.songs.length;
  }

  async addSong(song: ISongProcessed) {
    return db.data.songs.push(song);
  }

  async bulkAddSongs(songs: ISongProcessed[]): Promise<void> {
    db.data.songs = songs;
  }

  async bulkAddPlaylists(playlists: IPlaylist2[]): Promise<void> {
    db.data.playlists = playlists;
  }

  async getSong(id: string) {
    return db.data.songs.find((s) => s.id === id);
  }

  async updateSong(id: string, newSong: Partial<ISongProcessed>) {
    const songIndex = db.data.songs.findIndex((s) => s.id === id);
    const mergedSong = {
      ...db.data.songs[songIndex],
      ...newSong,
    };
    db.data.songs[songIndex] = mergedSong;
  }

  async deleteSong(song: Song): Promise<void> {
    const songIndex = db.data.songs.findIndex((s) => s.id === song.id);
    db.data.songs.splice(songIndex, 1);
    await db.write();
    this.emit("delete", song);
  }
}
