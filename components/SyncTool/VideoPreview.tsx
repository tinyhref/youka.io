import React, { useEffect, useRef } from "react";
import { useSyncStore } from "./store";
import SubtitlesOctopus from "@/lib/subtitles-octopus";
import { alignmentToAss } from "@/lib/ass-alignment";
import { convertAlignmentToAlignment2 } from "./utils";
import { getFonts } from "@/lib/fonts";
import {
  ISongProcessed,
  Resolution,
  SubtitlesPreset,
  SingerToStyleOptionsMapping,
} from "@/types";
import { isRTL } from "@/lib/library";

interface VideoPreviewProps {
  videoUrl: string;
  song: ISongProcessed;
  subtitlesPreset: SubtitlesPreset;
  styleOptionsMapping: SingerToStyleOptionsMapping;
  resolution: Resolution;
}

export function VideoPreview({
  videoUrl,
  song,
  subtitlesPreset,
  styleOptionsMapping,
  resolution,
}: VideoPreviewProps) {
  const alignment = useSyncStore((state) => state.alignment);
  const videoElement = useSyncStore((state) => state.videoElement);
  const togglePlay = useSyncStore((state) => state.togglePlay);

  const ref = useRef<HTMLDivElement>(null);
  const assRef = useRef<any>(null);

  useEffect(() => {
    if (!videoElement) return;
    videoElement.src = videoUrl;
  }, [videoUrl, videoElement]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.appendChild(videoElement);
    videoElement.controls = true;
    videoElement.disablePictureInPicture = true;

    // Update video styles to fit container
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.maxHeight = "400px";
    videoElement.style.objectFit = "contain";

    // @ts-ignore
    videoElement.controlsList =
      "nodownload nofullscreen noremoteplayback noplaybackrate";
  }, [videoElement, videoUrl]);

  useEffect(() => {
    if (!videoElement || !alignment || !alignment.lines.length) return;

    async function init() {
      stop();

      const alignment2 = convertAlignmentToAlignment2(alignment);
      const ass = alignmentToAss({
        alignment: alignment2,
        preset: subtitlesPreset,
        runtime: {
          styleOptionsMapping,
          rtl: isRTL(song.lang),
          lang: song.lang,
          title: song.title,
          resolution,
          artists: song.artists || [],
        },
      });
      if (!ass) return;

      const subContent = ass.toString();
      if (!subContent) return;

      const fonts: Set<string> = new Set();
      const requiredFonts: Set<string> = new Set();

      ass.styles.styles.forEach((style) => {
        requiredFonts.add(style.options.fontname);
      });

      try {
        const systemFonts = await getFonts();
        requiredFonts.forEach((fontName) => {
          const font = systemFonts.find((f) => f.name === fontName);
          if (font) {
            fonts.add(font.url);
          }
        });
      } catch (e) {
        console.error(e);
      }

      const options = {
        video: videoElement,
        workerUrl: `${process.env.PUBLIC_URL}/libass/subtitles-octopus-worker.js`,
        subContent,
        fonts: Array.from(fonts),
        targetFps: 60,
        onError: (e: Error) => {
          console.error(e);
        },
      };

      // @ts-ignore
      assRef.current = new SubtitlesOctopus(options);
    }
    init();
  }, [
    videoElement,
    alignment,
    song,
    subtitlesPreset,
    styleOptionsMapping,
    resolution,
  ]);

  function stop() {
    if (assRef.current) {
      try {
        assRef.current.freeTrack();
        assRef.current.dispose();
        assRef.current = undefined;
      } catch {}
    }
  }

  return (
    <div className="h-full w-full border-2 border-muted">
      <div onClick={togglePlay} ref={ref} className="h-full w-full" />
    </div>
  );
}
