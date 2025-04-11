import React, { useEffect, useRef, useState } from "react";
import SubtitlesOctopus from "@/lib/subtitles-octopus";
import { getDummyVideo } from "@/lib/library";
import { Skeleton } from "../ui/skeleton";
import { SystemFonts } from "@/lib/fonts";
import { Ass } from "@/lib/ass";
import { useSettingsStore } from "@/stores/settings";
import { DefaultVideoResolution } from "@/consts";
import { Resolution } from "@/types";

interface Props {
  ass?: Ass;
  duration?: number;
  color?: string;
  resolution?: Resolution;
}

export function SettingsPreview({
  ass,
  duration = 10,
  color = "black",
  resolution = DefaultVideoResolution,
}: Props) {
  const ffmpegOptions = useSettingsStore((state) => state.ffmpegOptions);
  const [videoReady, setVideoReady] = useState(false);
  const [assReady, setAssReady] = useState(false);
  const videoRef = useRef<any>();
  const assRef = useRef<any>();

  useEffect(() => {
    if (!videoRef.current) return;

    async function init() {
      try {
        setVideoReady(false);
        const videoFilepath = await getDummyVideo(
          duration,
          color,
          resolution,
          ffmpegOptions
        );
        const videoSrc = `file://${videoFilepath}`;
        if (!videoRef.current) return;
        videoRef.current.src = videoSrc;
        videoRef.current.oncanplay = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setVideoReady(true);
          }
        };
      } catch (e) {
        console.error(e);
      }
    }

    init();
  }, [duration, color, ffmpegOptions, resolution]);

  useEffect(() => {
    if (!videoReady || !videoRef.current) return;

    if (!ass) {
      if (assRef.current) {
        assRef.current.dispose();
      }
      return;
    }

    const fonts: string[] = [];
    ass.styles.styles.forEach((style) => {
      const font = SystemFonts.find((f) => f.name === style.options.fontname);
      if (font) {
        fonts.push(font.url);
      }
    });

    videoRef.current.pause();

    if (assRef.current) {
      assRef.current.dispose();
    }

    const options = {
      video: videoRef.current,
      workerUrl: `${process.env.PUBLIC_URL}/libass/subtitles-octopus-worker.js`,
      subContent: ass.toString(),
      fonts,
      onError: (e: Error) => {
        console.error(e);
      },
    };

    // @ts-ignore
    assRef.current = new SubtitlesOctopus(options);

    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setAssReady(true);

    return () => {
      if (assRef.current) {
        assRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ass, videoReady, assRef]);

  return (
    <div className="flex flex-col justify-center">
      <div>
        <video
          className="my-4 h-[40vh] w-auto object-contain border border-secondary"
          ref={videoRef}
          loop
          style={{ display: assReady ? "block" : "none" }}
        />
        {!assReady && <Skeleton className="w-[70vh] h-[40vh]" />}
      </div>
    </div>
  );
}
