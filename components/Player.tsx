import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "@/stores/player";
import {
  faMusic,
  faMicrophone,
  faMicrophoneSlash,
  faGauge,
} from "@fortawesome/free-solid-svg-icons";
import useSize from "@react-hook/size";
import Mousetrap from "mousetrap";
import { faMusicNote, faMusicSlash } from "@/icons";
import { PlayPause } from "./player/PlayPause";
import { FullScreen } from "./player/FullScreen";
import { Progress } from "./player/Progress";
import { Volume } from "./player/Volume";
import { Next } from "./player/Next";
import { Time } from "./player/Time";
import { SongImage } from "./SongImage";
import TitleComp from "./player/Title";
import { useSettingsStore } from "@/stores/settings";
import { cn } from "@/lib/utils";

export const Player = () => {
  const { t } = useTranslation();
  const {
    duration,
    element,
    fullScreen,
    hasNext,
    jobs,
    next,
    noVocalsVolume,
    pitch,
    playing,
    setFullScreen,
    setNoVocalsVolume,
    setPitch,
    setSeeked,
    setSeeking,
    setTempo,
    setVocalsVolume,
    song2job,
    tempo,
    time,
    togglePlay,
    vocalsVolume,
    loading,
    seekRight,
    seekLeft,
    toggleMuteVocals,
    toggleMuteNoVocals,
    increaseVocalsVolume,
    decreaseVocalsVolume,
  } = usePlayerStore((state) => ({
    canplay: state.canplay,
    duration: state.duration,
    element: state.element,
    fullScreen: state.fullScreen,
    hasNext: state.hasNext,
    jobs: state.jobs,
    next: state.next,
    noVocalsVolume: state.noVocalsVolume,
    pitch: state.pitch,
    playing: state.playing,
    setFullScreen: state.setFullScreen,
    setNoVocalsVolume: state.setNoVocalsVolume,
    setPitch: state.setPitch,
    setSeeked: state.setSeeked,
    setSeeking: state.setSeeking,
    setTempo: state.setTempo,
    setVocalsVolume: state.setVocalsVolume,
    song2job: state.song2job,
    tempo: state.tempo,
    time: state.time,
    togglePlay: state.togglePlay,
    vocalsVolume: state.vocalsVolume,
    loading: state.loading,
    seekRight: state.seekRight,
    seekLeft: state.seekLeft,
    toggleMuteVocals: state.toggleMuteVocals,
    toggleMuteNoVocals: state.toggleMuteNoVocals,
    increaseVocalsVolume: state.increaseVocalsVolume,
    decreaseVocalsVolume: state.decreaseVocalsVolume,
  }));
  const [song] = usePlayerStore((state) => [state.songs[state.songId]]);
  const [pitchStep, tempoStep] = useSettingsStore((state) => [
    state.pitchStep,
    state.tempoStep,
  ]);
  const [isHovering, setIsHovering] = useState(false);
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasVocals, setHasVocals] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const mouseMoveTimeoutRef = useRef<any>();

  const [width] = useSize(containerRef);
  const [fullVolumeControl, setFullVolumeControl] = useState<boolean>();

  useEffect(() => {
    if (song?.status === "processed") {
      setHasVocals(song.stems.some((stem) => stem.type === "vocals"));
    }
  }, [song]);

  useEffect(() => {
    const showControls =
      song?.status === "processed" &&
      ((!fullScreen && isHovering) || isMouseMoving || !playing);
    setShowControls(showControls);
  }, [playing, song?.status, isHovering, isMouseMoving, fullScreen]);

  useEffect(() => {
    if (videoContainerRef.current && song?.status === "processed") {
      videoContainerRef.current.appendChild(element);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoContainerRef.current, song?.status]);

  useEffect(() => {
    if (fullScreen) {
      element.className = "h-screen w-auto object-contain";
    } else {
      element.className = "w-full aspect-video object-contain";
    }
  }, [element, fullScreen]);

  useEffect(() => {
    const b = width > 1000;
    setFullVolumeControl(b);
  }, [width]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", () => {
      setFullScreen(document.fullscreenElement !== null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Mousetrap.bind("space", togglePlay);
    Mousetrap.bind("right", seekRight);
    Mousetrap.bind("left", seekLeft);
    Mousetrap.bind("f", handleFullScreen);
    Mousetrap.bind("0", () => setSeeked(0));
    Mousetrap.bind("m", toggleMuteNoVocals);
    Mousetrap.bind("v", toggleMuteVocals);
    Mousetrap.bind("=", increaseVocalsVolume);
    Mousetrap.bind("-", decreaseVocalsVolume);

    return () => {
      Mousetrap.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMouseMove() {
    setIsMouseMoving(true);
    clearTimeout(mouseMoveTimeoutRef.current);
    mouseMoveTimeoutRef.current = setTimeout(() => {
      setIsMouseMoving(false);
    }, 3000);
  }

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

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col relative w-full items-center justify-center aspect-video",
        song ? "bg-black" : "bg-muted"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      onDoubleClick={handleFullScreen}
    >
      {song?.status === "processed" ? (
        <div
          ref={videoContainerRef}
          className="w-full h-full transition-opacity duration-300"
        ></div>
      ) : (
        <SongImage song={song} job={jobs[song2job[song?.id]]} />
      )}

      {showControls && fullScreen && (
        <div className="flex flex-col absolute left-0 top-0 w-full">
          <div className="flex flex-row w-full justify-between items-center">
            {song && (
              <TitleComp className="text-white m-4 select-none" song={song} />
            )}
          </div>
        </div>
      )}
      {showControls && (
        <div
          className="flex flex-col w-full absolute left-0 bottom-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="items-center">
            <Progress
              className="w-full"
              color="#e30b17"
              onValueChange={(value) => setSeeking(value[0])}
              onValueCommit={(value) => setSeeked(value[0])}
              value={[time]}
              step={1}
              max={duration}
            />
          </div>
          <div
            className="flex flex-row w-full justify-between p-2 items-center h-[40px] bg-black bg-opacity-20"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="flex flex-row w-full items-center px-2">
              <PlayPause
                className="pr-7"
                ready={!loading}
                onClick={togglePlay}
                playing={playing}
              />
              {hasNext && <Next className="pr-7" onClick={() => next()} />}
              <div className="flex flex-row items-center w-full">
                <Time
                  className="mr-7 w-12 text-white text-sm"
                  duration={duration}
                  time={time}
                />
                <Volume
                  title={t("Instrumental")}
                  full={true}
                  className="mx-3"
                  onValueChange={(value: number[]) =>
                    setNoVocalsVolume(value[0] / 100)
                  }
                  onClickIcon={() => {
                    noVocalsVolume === 0
                      ? setNoVocalsVolume(1)
                      : setNoVocalsVolume(0);
                  }}
                  icon={faMusic}
                  mutedIcon={faMusicSlash}
                  value={[Math.floor(noVocalsVolume * 100)]}
                  step={1}
                  max={100}
                  min={0}
                />
                {hasVocals && (
                  <Volume
                    title={t("Vocals")}
                    full={true}
                    className="mx-3"
                    onValueChange={(value: number[]) =>
                      setVocalsVolume(value[0] / 100)
                    }
                    onClickIcon={() => {
                      vocalsVolume === 0
                        ? setVocalsVolume(1)
                        : setVocalsVolume(0);
                    }}
                    icon={faMicrophone}
                    mutedIcon={faMicrophoneSlash}
                    value={[Math.floor(vocalsVolume * 100)]}
                    step={1}
                    max={100}
                    min={0}
                  />
                )}
                <Volume
                  title={t("Key")}
                  full={fullVolumeControl}
                  className="mx-3"
                  onValueChange={(value: number[]) => setPitch(value[0])}
                  onClickIcon={() => {
                    setPitch(0);
                  }}
                  icon={faMusicNote}
                  mutedIcon={faMusicNote}
                  value={[pitch]}
                  step={pitchStep}
                  max={6}
                  min={-6}
                />
                <Volume
                  title={t("Tempo")}
                  full={fullVolumeControl}
                  className="mx-3"
                  onValueChange={(value: number[]) => setTempo(value[0])}
                  onClickIcon={() => {
                    setTempo(1);
                  }}
                  render={(value) => `${((value - 1) * 100).toFixed(0)}%`}
                  icon={faGauge}
                  mutedIcon={faGauge}
                  step={tempoStep}
                  min={0.5}
                  max={1.5}
                  value={[tempo]}
                />
              </div>
              <FullScreen
                className="flex flex-row items-center"
                fullScreen={fullScreen}
                onClick={handleFullScreen}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
