import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ISongProcessed } from "@/types";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { getPeaks, safeFileUrl } from "@/lib/library";
import { SongVideoSelect } from "@/components/SongVideoSelect";
import { SongStemModelSelect } from "@/components/SongStemModelSelect";
import rollbar from "@/lib/rollbar";
import { SongSubtitlesSelect } from "@/components/SongSubtitlesSelect";
import { HowTo } from "./HowTo";
import { Loader } from "./Loader";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface TrimChange {
  start: number;
  end: number;
  song: ISongProcessed;
  videoId: string;
  splitModelId: string;
  alignmentId: string;
}

interface Props {
  song: ISongProcessed;
  onChange: (change: TrimChange) => void;
  theme: "light" | "dark";
}

export const Trim = ({ song, onChange, theme }: Props) => {
  const { t } = useTranslation();

  const wsRef = useRef<WaveSurfer>();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<any>();
  const wsRegionsRef = useRef<RegionsPlugin>();
  const [playing, setPlaying] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [splitModelId, setSplitModelId] = useState<string>();
  const [videoId, setVideoId] = useState<string>("original");
  const [ready, setReady] = useState<boolean>(false);
  const [alignmentId, setAlignmentId] = useState<string>();
  const [audioUrl, setAudioUrl] = useState<string>();
  const [peaks, setPeaks] = useState<number[] | undefined>();
  const [peaksReady, setPeaksReady] = useState<boolean>(false);

  useEffect(() => {
    async function initPeaks() {
      if (!song) return;
      let stem;
      if (song.selectedVocals) {
        stem = song.stems.find((s) => s.id === song.selectedVocals);
      } else {
        stem = song.stems.find((s) => s.type === "original");
      }
      if (!stem) return;
      const peaks = await getPeaks(song.id, stem.id);
      setPeaks(peaks);
      setPeaksReady(true);
    }
    initPeaks();
  }, [song]);

  useEffect(() => {
    if (!splitModelId || !alignmentId) return;
    onChange({ song, videoId, splitModelId, start, end, alignmentId });
  }, [start, end, splitModelId, alignmentId, song, videoId, onChange]);

  useEffect(() => {
    const video = song.videos.find((v) => v.id === videoId);
    if (!video) return;
    videoRef.current.src = safeFileUrl(video.filepath);
  }, [videoId, song, videoRef]);

  useEffect(() => {
    const splitModelId =
      song.stems.find((s) => s.type === "instruments")?.modelId || "";
    if (splitModelId) {
      setSplitModelId(splitModelId);
    }

    const videoId = song.videos.find((v) => v.type === "original")?.id;
    if (videoId) {
      setVideoId(videoId);
    }

    const alignmentId = song.alignments2?.[0]?.id;
    if (alignmentId) {
      setAlignmentId(alignmentId);
    }
  }, [song]);

  useEffect(() => {
    if (!song || !splitModelId) return;
    const stem = song.stems.find((s) => s.modelId === splitModelId);
    if (!stem) return;

    const audioUrl = safeFileUrl(stem.filepath);
    setAudioUrl(audioUrl);
  }, [splitModelId, song]);

  useEffect(() => {
    if (!wsRef.current) return;
    wsRef.current.setTime(start);
    videoRef.current.currentTime = start;
  }, [start]);

  useEffect(() => {
    if (!wsRef.current) return;
    wsRef.current.setTime(end);
    videoRef.current.currentTime = end;
  }, [end]);

  useEffect(() => {
    if (!ready || !wsRef.current) return;

    if (wsRegionsRef.current) {
      wsRegionsRef.current.destroy();
    }

    const wsRegions = wsRef.current.registerPlugin(RegionsPlugin.create());

    wsRegions.on("region-updated", (region) => {
      setStart(region.start);
      setEnd(region.end);
    });

    wsRegions.clearRegions();
    wsRegions.addRegion({
      start: 0,
      end: wsRef.current.getDuration(),
      color: "hsla(400, 100%, 30%, 0.1)",
    });

    wsRegionsRef.current = wsRegions;

    return () => {
      wsRegions.destroy();
    };
  }, [ready]);

  useEffect(() => {
    if (!containerRef.current || !audioUrl || !peaksReady) return;

    if (wsRef.current) {
      wsRef.current.destroy();
    }

    const dark = theme === "dark";

    setReady(false);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: audioUrl,
      peaks: peaks ? [peaks] : undefined,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      autoCenter: false,
      waveColor: dark ? "#2A163A" : "#ECE3F3",
      progressColor: dark ? "#3A234E" : "#D1C1DF",
      cursorColor: dark ? "#A188B7" : "#555",
    });

    ws.on("error", (err) => {
      rollbar.error("ws error", { error: err });
    });

    ws.on("play", () => {
      setPlaying(true);
    });

    ws.on("pause", () => {
      setPlaying(false);
    });

    ws.on("click", () => {
      videoRef.current.currentTime = ws.getCurrentTime();
    });

    ws.on("timeupdate", (currentTime) => {
      setCurrentTime(currentTime);
    });

    ws.on("decode", (duration) => {
      setEnd(duration);
    });

    ws.on("ready", () => {
      setReady(true);
    });

    wsRef.current = ws;

    return () => {
      setPlaying(false);
      ws.pause();
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, peaks, peaksReady]);

  function togglePlay() {
    if (!wsRef.current) return;

    if (playing) {
      wsRef.current.pause();
      videoRef.current.pause();
    } else {
      wsRef.current.play();
      videoRef.current.play();
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const time =
      hours > 0
        ? `${hours}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        : `${minutes}:${secs.toString().padStart(2, "0")}`;

    return time;
  };

  function updateTime(start: number, end: number) {
    setStart(start);
    setEnd(end);
    if (!wsRegionsRef.current) return;
    const regions = wsRegionsRef.current.getRegions();
    if (regions.length === 0) return;
    regions[0].setOptions({
      start,
      end,
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-row items-center rounded-md border border-secondary p-2">
        <div>{t("dialogs.trim.description")}</div>
        <HowTo url="https://www.youtube.com/watch?v=j5xPRykoSLE" />
      </div>
      <div className="flex flex-row justify-between gap-4 items-center">
        <SongVideoSelect
          withLabel
          song={song}
          value={videoId}
          onValueChange={setVideoId}
          omit={["custom"]}
        />
        {splitModelId && (
          <SongStemModelSelect
            withLabel
            song={song}
            value={splitModelId}
            onValueChange={setSplitModelId}
            omit={["original", "custom"]}
          />
        )}
        {alignmentId && (
          <SongSubtitlesSelect
            withLabel
            song={song}
            value={alignmentId}
            onValueChange={setAlignmentId}
            omit={["custom"]}
          />
        )}
      </div>

      <div className="w-[400px] border border-secondary my-4">
        <video className="object-cover w-full h-full" ref={videoRef} />
        <div className="mt-2" id="waveform" ref={containerRef} />
        {!peaksReady && (
          <div className="flex flex-col items-center justify-center h-[100px]">
            <Loader />
          </div>
        )}
      </div>

      <Button variant="outline" className="m-1" onClick={() => togglePlay()}>
        {playing ? (
          <FontAwesomeIcon icon={faPause} />
        ) : (
          <FontAwesomeIcon icon={faPlay} />
        )}
      </Button>
      <div className="flex flex-row gap-4">
        <div className="flex flex-col gap-2">
          <Label>{t("Start")}</Label>
          <Input
            className="w-20"
            min={0}
            max={end}
            type="number"
            value={start.toFixed(1)}
            onChange={(e) => updateTime(Number(e.target.value), end)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t("End")}</Label>
          <Input
            className="w-20"
            min={start}
            type="number"
            value={end.toFixed(1)}
            onChange={(e) => updateTime(start, Number(e.target.value))}
          />
        </div>
      </div>
      <div className="flex flex-row gap-4">
        <div>
          {t("Time")}: {formatTime(currentTime)}
        </div>
        <div>
          {t("Start")}: {formatTime(start)}
        </div>
        <div>
          {t("End")}: {formatTime(end)}
        </div>
        <div>
          {t("Duration")}: {formatTime(end - start)}
        </div>
      </div>
    </div>
  );
};
