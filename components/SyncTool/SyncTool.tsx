import React, { useEffect, useRef } from "react";
import { useSyncStore } from "./store";
import { SyncAlignment } from "./types";
import { Song } from "./Song";
import { LinesMenu } from "./LinesMenu";
import Mousetrap from "mousetrap";
import { Actions } from "./Actions";
import { VideoPreview } from "./VideoPreview";
import { Timeline } from "./Timeline";
import { Zoom } from "./Zoom";
import {
  ISongProcessed,
  SubtitlesPreset,
  Resolution,
  SingerToStyleOptionsMapping,
  Theme,
} from "@/types";
import { isRTL } from "@/lib/library";

interface SyncToolProps {
  song: ISongProcessed;
  videoUrl: string;
  resolution: Resolution;
  alignment: SyncAlignment;
  subtitlesPreset: SubtitlesPreset;
  styleOptionsMapping: SingerToStyleOptionsMapping;
  onChange: (alignment: SyncAlignment) => void;
  audioUrl?: string;
  peaks?: number[][];
  theme: Theme;
}

export const SyncTool: React.FC<SyncToolProps> = ({
  videoUrl,
  alignment: initialAlignment,
  onChange,
  song,
  subtitlesPreset,
  styleOptionsMapping,
  resolution,
  peaks,
  audioUrl,
  theme,
}) => {
  const songRef = useRef<HTMLDivElement>(null);
  const duration = useSyncStore((state) => state.duration);
  const alignment = useSyncStore((state) => state.alignment);
  const pixelsPerSecond = useSyncStore((state) => state.pixelsPerSecond);
  const videoElement = useSyncStore((state) => state.videoElement);
  const currentTime = useSyncStore((state) => state.currentTime);
  const shiftStep = useSyncStore((state) => state.shiftStep);
  const setAlignment = useSyncStore((state) => state.setAlignment);
  const setIsShiftPressed = useSyncStore((state) => state.setIsShiftPressed);
  const init = useSyncStore((state) => state.init);
  const undo = useSyncStore((state) => state.undo);
  const redo = useSyncStore((state) => state.redo);
  const deleteSelected = useSyncStore((state) => state.deleteSelected);
  const togglePlay = useSyncStore((state) => state.togglePlay);
  const seekForward = useSyncStore((state) => state.seekForward);
  const seekBackward = useSyncStore((state) => state.seekBackward);
  const splitSelectedWord = useSyncStore((state) => state.splitSelectedWord);
  const copySelected = useSyncStore((state) => state.copySelected);
  const cutSelected = useSyncStore((state) => state.cutSelected);
  const pasteSelected = useSyncStore((state) => state.pasteSelected);
  const setCurrentTime = useSyncStore((state) => state.setCurrentTime);
  const selectSubword = useSyncStore((state) => state.selectSubword);
  const playSelected = useSyncStore((state) => state.playSelected);
  const addLineOrWord = useSyncStore((state) => state.addLineOrWord);
  const selectSelectedLine = useSyncStore((state) => state.selectSelectedLine);
  const selectAllLines = useSyncStore((state) => state.selectAllLines);
  const mergeSelectedLineWithNextLine = useSyncStore(
    (state) => state.mergeSelectedLineWithNextLine
  );
  const shiftSelectedLines = useSyncStore((state) => state.shiftSelectedLines);
  const reset = useSyncStore((state) => state.reset);
  const setRtl = useSyncStore((state) => state.setRtl);
  useEffect(() => {
    if (!videoElement) return;
    init();

    return () => {
      reset();
    };
  }, [init, videoElement, reset]);

  useEffect(() => {
    setRtl(isRTL(song.lang || ""));
  }, [song.lang, setRtl]);

  useEffect(() => {
    setAlignment(initialAlignment);

    // Select first subword if it exists
    if (
      initialAlignment.lines.length > 0 &&
      initialAlignment.lines[0].words.length > 0 &&
      initialAlignment.lines[0].words[0].subwords.length > 0
    ) {
      const firstSubword = initialAlignment.lines[0].words[0].subwords[0];
      selectSubword(firstSubword.subwordId);
      setCurrentTime(firstSubword.start);
    }
  }, [initialAlignment, setAlignment, selectSubword, setCurrentTime]);

  useEffect(() => {
    if (!alignment) return;
    onChange(alignment);
  }, [alignment, onChange]);

  useEffect(() => {
    if (!alignment) return;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignment, selectSubword, setCurrentTime]);

  useEffect(() => {
    if (!songRef.current || !currentTime) return;

    const container = songRef.current;
    const containerWidth = container.offsetWidth;
    const currentPosition = currentTime * pixelsPerSecond;
    const scrollLeft = container.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;

    // Check if current position is outside the visible area (with some padding)
    const padding = 100; // pixels
    if (
      currentPosition < scrollLeft + padding ||
      currentPosition > scrollRight - padding
    ) {
      container.scrollTo({
        left: currentPosition - padding,
      });
    }
  }, [currentTime, pixelsPerSecond]);

  useEffect(() => {
    Mousetrap.bind(["ctrl+z", "command+z"], undo);
    Mousetrap.bind(["ctrl+y", "command+y", "command+shift+z"], redo);
    Mousetrap.bind(["del", "backspace"], deleteSelected);
    Mousetrap.bind("space", () => togglePlay());
    Mousetrap.bind("right", () => seekForward(1));
    Mousetrap.bind("left", () => seekBackward(1));
    Mousetrap.bind("shift", () => setIsShiftPressed(true), "keydown");
    Mousetrap.bind("shift", () => setIsShiftPressed(false), "keyup");
    Mousetrap.bind(["ctrl+l", "command+l"], () => splitSelectedWord());
    Mousetrap.bind(["ctrl+x", "command+x"], () => cutSelected());
    Mousetrap.bind(["ctrl+c", "command+c"], () => copySelected());
    Mousetrap.bind(["ctrl+v", "command+v"], () => pasteSelected());
    Mousetrap.bind(["space", "ctrl+p", "command+p"], () => playSelected());
    Mousetrap.bind(["ctrl+n", "command+n"], () => addLineOrWord());
    Mousetrap.bind(["ctrl+a", "command+a"], () => selectSelectedLine());
    Mousetrap.bind(["ctrl+m", "command+m"], () =>
      mergeSelectedLineWithNextLine()
    );
    Mousetrap.bind(["shift+right", "shift+right"], () =>
      shiftSelectedLines(shiftStep)
    );
    Mousetrap.bind(["shift+left", "shift+left"], () =>
      shiftSelectedLines(-shiftStep)
    );
    Mousetrap.bind(["ctrl+a", "command+a"], () => selectAllLines());
    return () => {
      Mousetrap.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!alignment) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-row w-full gap-4">
        <div className="w-1/2 h-[400px]">
          <LinesMenu />
        </div>
        <div className="w-1/2 h-[400px]">
          <VideoPreview
            song={song}
            videoUrl={videoUrl}
            subtitlesPreset={subtitlesPreset}
            styleOptionsMapping={styleOptionsMapping}
            resolution={resolution}
          />
        </div>
      </div>

      <div className="min-h-[40px]">
        <Actions />
      </div>

      <div className="h-full w-full overflow-x-scroll" ref={songRef}>
        <div className="h-[100px]">
          <Song
            duration={duration}
            alignment={alignment}
            peaks={peaks}
            audioUrl={audioUrl}
            theme={theme}
          />
        </div>
        <div className="h-[50px]">
          <Timeline duration={duration} />
        </div>
      </div>
      <Zoom />
    </div>
  );
};
