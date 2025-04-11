import React, { useEffect, useRef, useState } from "react";
import { SongImage } from "./SongImage";

interface Props {
  videoUrl: string;
  playing: boolean;
  time: number;
}

export const DualPlayer = ({ videoUrl, playing, time }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    document.addEventListener("fullscreenchange", () => {
      setFullScreen(document.fullscreenElement !== null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFullScreen() {
    const isFullScreen = document.fullscreenElement !== null;
    if (isFullScreen) {
      try {
        document.exitFullscreen();
      } catch {}
    } else if (containerRef.current) {
      containerRef.current.requestFullscreen();
    }
  }

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.src = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      }
    } else {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [playing]);

  useEffect(() => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const diff = Math.abs(currentTime - time);
    if (diff > 0.1) {
      videoRef.current.currentTime = time;
    }
  }, [time]);

  return (
    <>
      <div
        ref={containerRef}
        className={`${playing ? "flex flex-col w-full" : "hidden"}`}
        onDoubleClick={handleFullScreen}
      >
        <video
          className={
            fullScreen
              ? "h-screen w-auto object-contain"
              : "w-full aspect-video object-contain border rounded"
          }
          ref={videoRef}
        />
      </div>
      <div
        className={
          playing
            ? "hidden"
            : "flex flex-col items-center justify-center w-full p-2"
        }
      >
        <SongImage />
      </div>
    </>
  );
};
