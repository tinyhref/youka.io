import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Song } from "@/types";
import { usePlayerStore } from "@/stores/player";
import SongItemList from "./SongItemList";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { useSettingsStore } from "@/stores/settings";

export default function TabLibrarySongs() {
  const { t } = useTranslation();
  const songs = usePlayerStore((state) => state.songs);
  const [sort, setSort] = useSettingsStore((state) => [
    state.sort,
    state.setSort,
  ]);
  const [query, setQuery] = useState<string>("");
  const [libSongs, setLibSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);

  useEffect(() => {
    const librarySongs = Object.values(songs).filter((song) =>
      ["processed", "processing", "pending"].includes(song.status)
    );
    setLibSongs(librarySongs);
  }, [songs]);

  useEffect(() => {
    if (!query) {
      return setFilteredSongs(libSongs);
    }

    const filteredSongs = libSongs.filter(
      (song: Song) =>
        ["processed", "processing", "pending"].includes(song.status) &&
        song.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSongs(filteredSongs);
  }, [query, libSongs]);

  useEffect(() => {
    doSort(sort, filteredSongs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSongs, sort]);

  function doSort(sort: string, songs: Song[]) {
    let sortedSongs = [...songs];
    switch (sort) {
      case "title-asc":
        sortedSongs = sortAlphaAsc(filteredSongs);
        break;
      case "title-desc":
        sortedSongs = sortAlphaDesc(filteredSongs);
        break;
      case "date-asc":
        sortedSongs = sortByDateAsc(filteredSongs);
        break;
      case "date-desc":
        sortedSongs = sortByDateDesc(filteredSongs);
        break;
      case "artist-asc":
        sortedSongs = sortByArtistAsc(filteredSongs);
        break;
      case "artist-desc":
        sortedSongs = sortByArtistDesc(filteredSongs);
        break;
      default:
        return;
    }
    setFilteredSongs(sortedSongs);
  }

  function handleSearch(e: any) {
    const query = e.target.value;
    setQuery(query);
  }

  function sortAlphaAsc(songs: Song[]) {
    return songs.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  }

  function sortAlphaDesc(songs: Song[]) {
    return songs.sort((a, b) => {
      return b.title.localeCompare(a.title);
    });
  }

  function sortByDateDesc(songs: Song[]) {
    return songs.sort((a, b) => {
      if (a.status !== "processed" || b.status !== "processed") return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  function sortByDateAsc(songs: Song[]) {
    return songs.sort((a, b) => {
      if (a.status !== "processed" || b.status !== "processed") return 0;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  function sortByArtistAsc(songs: Song[]) {
    return songs.sort((a, b) => {
      return (a.artists?.join(", ") || "").localeCompare(
        b.artists?.join(", ") || ""
      );
    });
  }

  function sortByArtistDesc(songs: Song[]) {
    return songs.sort((a, b) => {
      return (b.artists?.join(", ") || "").localeCompare(
        a.artists?.join(", ") || ""
      );
    });
  }

  function handleSort(sort: any) {
    setSort(sort);
  }

  return (
    <>
      <div className="flex flex-row">
        <Input
          className="mr-1"
          type="search"
          placeholder={t("Start typing to search") || ""}
          onChange={handleSearch}
        />

        <Select value={sort} onValueChange={(v) => handleSort(v)}>
          <SelectTrigger className="w-[100px]">
            <span className="mr-2">{t("Sort")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">{t("sort.date.desc")}</SelectItem>
            <SelectItem value="date-asc">{t("sort.date.asc")}</SelectItem>
            <SelectItem value="title-asc">{t("sort.title.asc")}</SelectItem>
            <SelectItem value="title-desc">{t("sort.title.desc")}</SelectItem>
            <SelectItem value="artist-asc">{t("sort.artist.asc")}</SelectItem>
            <SelectItem value="artist-desc">{t("sort.artist.desc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pb-1" />
      <div className="h-[75vh] overflow-y-auto overflow-x-hidden grow-1 rounded-md border">
        <SongItemList songs={filteredSongs} variant="library" />
      </div>
    </>
  );
}
