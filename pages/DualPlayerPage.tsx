import React, { useEffect, useState } from "react";
import { usePlayerStore } from "@/stores/player";
import { Fallback } from "@/components/Fallback";
import { DualPlayer } from "@/components/DualPlayer";
import { getVideoResolution, isRTL, safeFileUrl } from "@/lib/library";
import LyricsAssController from "@/lib2/lyrics/ass";
import {
  Resolution,
  SingerToStyleOptionsMapping,
  SubtitlesPreset,
} from "@/types";
import { DefaultVideoResolution } from "@/consts";

const assCtl = new LyricsAssController();

export default function DualPlayerPage() {
  const [
    dualSong,
    ready,
    dualSelectedVideo,
    dualSelectedAlignment,
    getSubtitlesPreset,
    getStyleOptionsMapping,
  ] = usePlayerStore((state) => [
    state.dualSong,
    state.ready,
    state.dualSelectedVideo,
    state.dualSelectedAlignment,
    state.getSubtitlesPreset,
    state.getStyleOptionsMapping,
  ]);

  const [videoUrl, setVideoUrl] = useState("");
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [assReady, setAssReady] = useState(false);
  const [resolution, setResolution] = useState<Resolution>(
    DefaultVideoResolution
  );
  const [subtitlesPreset, setSubtitlesPreset] = useState<SubtitlesPreset>();
  const [styleOptionsMapping, setStyleOptionsMapping] = useState<
    SingerToStyleOptionsMapping
  >();

  useEffect(() => {
    if (!dualSong) return;
    setSubtitlesPreset(getSubtitlesPreset(dualSong.id));
    setStyleOptionsMapping(getStyleOptionsMapping(dualSong.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dualSong]);

  useEffect(() => {
    async function init() {
      await assCtl.init();
      setAssReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    async function init() {
      if (!dualSong || !dualSelectedVideo) return;
      const resolution = await getVideoResolution(
        dualSong,
        dualSelectedVideo.id
      );
      setResolution(resolution);
    }
    init();
  }, [dualSong, dualSelectedVideo]);

  useEffect(() => {
    if (dualSelectedVideo) {
      setVideoUrl(safeFileUrl(dualSelectedVideo.filepath));
    } else {
      setVideoUrl("");
    }
  }, [dualSelectedVideo]);

  useEffect(() => {
    if (!assReady || !dualSong) return;

    if (dualSelectedAlignment && subtitlesPreset && styleOptionsMapping) {
      assCtl.load({
        alignment: dualSelectedAlignment,
        preset: subtitlesPreset,
        runtime: {
          styleOptionsMapping,
          rtl: isRTL(dualSong?.lang),
          title: dualSong?.songTitle || dualSong?.title,
          artists: dualSong?.artists || [],
          resolution,
        },
      });
    } else {
      assCtl.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assReady, dualSelectedAlignment, dualSong, resolution]);

  useEffect(() => {
    function handleUpdate(e: StorageEvent) {
      const { key } = e;
      switch (key) {
        case "time":
          setTime(parseInt(e.newValue || "0"));
          break;
        case "playing":
          setPlaying(e.newValue === "true");
          break;
        case "player":
          usePlayerStore.persist.rehydrate();
          break;
      }
    }

    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!ready) {
    return <Fallback />;
  }

  return <DualPlayer videoUrl={videoUrl} playing={playing} time={time} />;
}
