import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPause,
  faPlay,
  faRedo,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { IAlignmentItemLine } from "@/types";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Textarea } from "./ui/textarea";

interface Props {
  audioUrl: string;
  lyrics: string;
  onChange: (alignments: IAlignmentItemLine[]) => void;
}
export default function SyncLine({ lyrics, audioUrl, onChange }: Props) {
  const { t } = useTranslation();
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isStart, setIsStart] = useState(true);
  const [localLyrics, setLocalLyrics] = useState(lyrics);

  const audioRef = useRef(new Audio());
  audioRef.current.onplay = () => setPaused(false);
  audioRef.current.onpause = () => setPaused(true);
  audioRef.current.ontimeupdate = () =>
    setCurrentTime(audioRef.current.currentTime);
  const alignmentsRef = useRef<IAlignmentItemLine[]>([]);

  useEffect(() => {
    setLines(
      (localLyrics || "").split("\n").filter((line) => line.trim() !== "")
    );
  }, [localLyrics]);

  useEffect(() => {
    audioRef.current.src = audioUrl;
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio.pause();
    };
  }, []);

  function handlePlay() {
    audioRef.current.play();
  }

  function handlePause() {
    audioRef.current.pause();
  }

  function handleSetStart() {
    setIsStart(false);
    let start = Number((audioRef.current.currentTime - 0.2).toPrecision(3));
    if (start < 0) {
      start = 0;
    } else if (Object.keys(alignmentsRef.current).length) {
      if (alignmentsRef.current[lineIndex - 1]) {
        const prevEnd = alignmentsRef.current[lineIndex - 1].end;
        if (start < prevEnd) {
          start = prevEnd;
        }
      }
    }
    alignmentsRef.current[lineIndex] = {
      line: lineIndex + 1,
      start,
      end: -1,
      text: lines[lineIndex],
    };
  }

  function handleSetEnd() {
    setIsStart(true);
    alignmentsRef.current[lineIndex].end = Number(
      audioRef.current.currentTime.toPrecision(3)
    );

    if (lineIndex + 1 < lines.length) {
      setLineIndex(lineIndex + 1);
    } else {
      // finished
      audioRef.current.pause();
      onChange(alignmentsRef.current);
    }
  }

  function handlePlayBackward() {
    setIsStart(true);
    audioRef.current.currentTime -= 5;
  }

  function handlePlayForward() {
    setIsStart(true);
    audioRef.current.currentTime += 5;
  }

  function formatSeconds(seconds: number) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  }

  function handleUndo() {
    if (lineIndex === 0) {
      if (audioRef.current.currentTime > 5) {
        audioRef.current.currentTime = audioRef.current.currentTime - 5;
      } else {
        audioRef.current.currentTime = 0;
      }
    } else if (isStart) {
      audioRef.current.currentTime = alignmentsRef.current[lineIndex - 1].start;
      setLineIndex(lineIndex - 1);
    } else {
      audioRef.current.currentTime = alignmentsRef.current[lineIndex - 1].end;
    }
    setIsStart(!isStart);
  }

  function handleLineChange(e: any) {
    const tmp = [...lines];
    tmp[lineIndex] = e.target.value;
    setLines(tmp);
  }

  if (!lines) return null;

  return (
    <div className="flex flex-col items-center h-full w-full justify-center">
      <div className="flex flex-row items-center m-4 gap-2">
        <div className="px-2">{formatSeconds(currentTime)}</div>
        <Button
          className="h-10 w-10"
          variant="outline"
          onClick={handlePlayBackward}
        >
          <FontAwesomeIcon icon={faUndo} />
        </Button>
        {paused && (
          <Button onClick={handlePlay}>
            <FontAwesomeIcon icon={faPlay} />
            {t("Start")}
          </Button>
        )}
        {!paused && (
          <Button onClick={handlePause}>
            <FontAwesomeIcon icon={faPause} />
            {t("Pause")}
          </Button>
        )}
        <Button
          className="h-10 w-10"
          variant="outline"
          onClick={handlePlayForward}
        >
          <FontAwesomeIcon icon={faRedo} />
        </Button>
        <div className="px-2">
          {lineIndex + 1} / {lines.length}
        </div>
      </div>
      <div className="w-[70%]">
        {lines.length && lineIndex < lines.length ? (
          <Input
            className="text-lg w-full text-center"
            value={lines[lineIndex]}
            onChange={handleLineChange}
          />
        ) : null}
      </div>
      <div className="m-4">
        <Button
          variant="outline"
          disabled={paused || (lineIndex === 0 && isStart)}
          onClick={handleUndo}
        >
          {t("Undo")}
        </Button>
        <Button
          className={`w-40 m-2 ${
            isStart
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
          disabled={paused}
          onClick={isStart ? handleSetStart : handleSetEnd}
        >
          {isStart ? t("Set Start") : t("Set End")}
        </Button>
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button className="mb-2" variant="outline">
            {t("Edit Lyrics")}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Textarea
            className="h-[200px] w-[500px]"
            value={localLyrics}
            onChange={(e) => setLocalLyrics(e.target.value)}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
