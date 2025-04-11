import {
  IPlaylist2,
  IPlaylist2Item,
  IRepo,
  ISongPreview,
  ISongProcessed,
} from "@/types";
import { EventEmitter } from "events";
import PouchDB from "pouchdb";
import UpsertPlugin from "pouchdb-upsert";
PouchDB.plugin(UpsertPlugin);

export default class PouchDBRepo extends EventEmitter implements IRepo {
  private songsDB = new PouchDB<ISongProcessed>("songs");
  private playlistsDB = new PouchDB<IPlaylist2>("playlists");

  getCustomId(id: string) {
    const prefix = "y_";
    return prefix + id;
  }

  async init() {
    if (navigator.storage && navigator.storage.persist) {
      const persistent = await navigator.storage.persist();
      if (persistent) {
        console.log(
          "Storage will not be cleared except by explicit user action"
        );
      } else {
        console.log("Storage may be cleared by the UA under storage pressure.");
      }
    }
  }

  async deleteVideo(songId: string, videoId: string): Promise<ISongProcessed> {
    const song = await this.getSong(songId);
    if (!song) throw new Error("song not found");
    song.videos = song.videos.filter((v) => v.id !== videoId);
    await this.updateSong(songId, song);
    return song;
  }

  async deleteStem(songId: string, stemId: string): Promise<ISongProcessed> {
    const song = await this.getSong(songId);
    if (!song) throw new Error("song not found");
    song.stems = song.stems.filter((s) => s.id !== stemId);
    await this.updateSong(songId, song);
    return song;
  }

  async deleteAlignment(
    songId: string,
    alignmentId: string
  ): Promise<ISongProcessed> {
    const song = await this.getSong(songId);
    if (!song) throw new Error("song not found");
    song.alignments2 = song.alignments2?.filter((a) => a.id !== alignmentId);
    await this.updateSong(songId, song);
    return song;
  }

  async addPlaylist(playlist: IPlaylist2) {
    await this.playlistsDB.put({ ...playlist, _id: playlist.id });
    return this.getPlaylist(playlist.id);
  }

  async deletePlaylist(id: string) {
    const playlist = await this.playlistsDB.get(id);
    if (!playlist) throw new Error("playlist not found");
    await this.playlistsDB.remove(playlist);
  }

  async getPlaylist(id: string) {
    return this.playlistsDB.get(id);
  }

  async updatePlaylist(playlist: IPlaylist2) {
    await this.playlistsDB.put(
      { ...playlist, _id: playlist.id },
      { force: true }
    );
    return this.getPlaylist(playlist.id);
  }

  async addToPlaylist(playlistId: string, playlistItem: IPlaylist2Item) {
    const playlist = await this.playlistsDB.get(playlistId);
    if (!playlist) throw new Error("playlist not found");
    playlist.items.push(playlistItem);
    await this.playlistsDB.put(playlist);
    return this.getPlaylist(playlistId);
  }

  async removeFromPlaylist(playlistId: string, playlistItemId: string) {
    const playlist = await this.playlistsDB.get(playlistId);
    if (!playlist) throw new Error("playlist not found");
    playlist.items = playlist.items.filter((i) => i.id !== playlistItemId);
    await this.playlistsDB.put(playlist);
    return this.getPlaylist(playlistId);
  }

  async playlists() {
    const docs = await this.playlistsDB.allDocs({ include_docs: true });
    return docs.rows.map((row) => row.doc as IPlaylist2);
  }

  async clear() {
    await this.songsDB.destroy();
    await this.playlistsDB.destroy();
    this.songsDB = new PouchDB<ISongProcessed>("songs");
    this.playlistsDB = new PouchDB<IPlaylist2>("playlists");
  }

  async songs(): Promise<ISongProcessed[]> {
    const docs = await this.songsDB.allDocs({ include_docs: true });
    return docs.rows.map((row) => row.doc as ISongProcessed);
  }

  async count() {
    const info = await this.songsDB.info();
    return info.doc_count;
  }

  async addSong(song: ISongProcessed) {
    const id = this.getCustomId(song.id);
    const songDB = await this.songsDB.upsert(id, (doc) => {
      return {
        ...doc,
        ...song,
      };
    });
    return songDB;
  }

  async bulkAddSongs(songs: ISongProcessed[]): Promise<void> {
    const songsWithId = songs
      .filter((s) => s.id)
      .map((s) => ({ ...s, _id: this.getCustomId(s.id) }));
    await this.songsDB.bulkDocs(songsWithId);
  }

  async bulkAddPlaylists(playlists: IPlaylist2[]): Promise<void> {
    this.playlistsDB.bulkDocs(playlists);
  }

  async getSong(id: string) {
    try {
      const song = await this.songsDB.get(this.getCustomId(id));
      return song;
    } catch (e) {
      return undefined;
    }
  }

  async updateSong(id: string, newSong: ISongProcessed) {
    const dbSong = await this.getSong(id);
    if (!dbSong) throw new Error("song not found");
    const song = await this.songsDB.upsert(dbSong._id, (doc) => {
      return {
        ...doc,
        ...newSong,
      };
    });
    this.emit("update", song);
  }

  async deleteSong(song: ISongPreview): Promise<void> {
    const dbSong = await this.getSong(song.id);
    if (!dbSong) throw new Error("song not found");
    await this.songsDB.remove(dbSong);
    this.emit("delete", song);
  }
}
