import { usePlayerStore } from "@/stores/player";
import { ISongProcessed } from "@/types";
import { useEffect, useState } from "react";

const useSong = (songId: string | undefined) => {
  const [songs] = usePlayerStore((state) => [state.songs]);
  const [song, setSong] = useState<ISongProcessed | undefined>();

  useEffect(() => {
    if (songId) {
      const song = songs[songId];
      if (song && song.status === "processed") {
        setSong(song);
      }
    } else {
      setSong(undefined);
    }
  }, [songId, songs]);

  return song;
};

export default useSong;
