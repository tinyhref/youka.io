import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { useTranslation } from "react-i18next";
import { Alignment3 } from "@/types";
import { Input } from "./ui/input";
import { ALL_SINGERS_ID } from "@/consts";

interface DuetEditorProps {
  audioUrl?: string;
  styles: string[];
  alignment: Alignment3;
  onChange: (alignment: Alignment3) => void;
}

interface LineProps {
  lineIdx: number;
  showPlayButton: boolean;
  playing: boolean;
  play: (start: number, end: number) => void;
  pause: () => void;
  numSingers: number;
  styles: string[];
  singer: number;
  text: string;
  start: number;
  end: number;
  onChange: (singer: number) => void;
}

interface LinePlayerProps {
  playing: boolean;
  play: (start: number, end: number) => void;
  pause: () => void;
  start: number;
  end: number;
}

function LinePlayer({ playing, start, end, play, pause }: LinePlayerProps) {
  return (
    <>
      {playing ? (
        <Button variant="outline" onClick={() => pause()}>
          <FontAwesomeIcon icon={faPause} />
        </Button>
      ) : (
        <Button variant="outline" onClick={() => play(start, end)}>
          <FontAwesomeIcon icon={faPlay} />
        </Button>
      )}
    </>
  );
}

function Line({
  lineIdx,
  showPlayButton,
  numSingers,
  singer,
  onChange,
  play,
  pause,
  playing,
  start,
  end,
  text,
}: LineProps) {
  const { t } = useTranslation();

  function handleChange(value: string) {
    const singer = parseInt(value);
    onChange(singer);
  }

  const singers = Array.from({ length: numSingers || 2 }, (_, i) => i);

  function lineId(singer: number) {
    return `${lineIdx}-${singer}`;
  }

  return (
    <div className="flex flex-row items-center gap-4">
      {showPlayButton && (
        <LinePlayer
          play={play}
          pause={pause}
          playing={playing}
          start={start}
          end={end}
        />
      )}

      <RadioGroup
        className="flex flex-row"
        value={singer.toString() ?? "0"}
        onValueChange={handleChange}
      >
        {singers.map((_, i) => (
          <div key={i} className="flex flex-row items-center space-x-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={i.toString()} id={lineId(i)} />
              <Label className="cursor-pointer" htmlFor={lineId(i)}>
                {t("Singer") + ` ${i + 1}`}
              </Label>
            </div>
          </div>
        ))}
        <div key="all" className="flex flex-row items-center space-x-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={ALL_SINGERS_ID.toString()}
              id={lineId(ALL_SINGERS_ID)}
            />
            <Label className="cursor-pointer" htmlFor={lineId(ALL_SINGERS_ID)}>
              {t("All")}
            </Label>
          </div>
        </div>
      </RadioGroup>
      <div>{text}</div>
    </div>
  );
}

export function DuetEditor({
  audioUrl,
  alignment: initialAlignment,
  styles,
  onChange,
}: DuetEditorProps) {
  const { t } = useTranslation();
  const [numSingers, setNumSingers] = useState(2);
  const [playIndex, setPlayIndex] = useState<number>();
  const [alignment, setAlignment] = useState(initialAlignment);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setAlignment(initialAlignment);
  }, [initialAlignment]);

  useEffect(() => {
    let maxSingers = 2;

    initialAlignment.lines.forEach((line) => {
      if (line.singer && line.singer >= maxSingers) {
        maxSingers = line.singer + 1;
      }
    });

    setNumSingers(maxSingers);
  }, [initialAlignment]);

  useEffect(() => {
    onChange(alignment);
  }, [alignment, onChange]);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  function handleLineChange(lineIdx: number, singer: number) {
    const newAlignment = structuredClone(alignment);
    newAlignment.lines[lineIdx].singer = singer;
    setAlignment(newAlignment);
  }

  function play(playIndex: number, start: number, end: number) {
    setPlayIndex(playIndex);
    if (!audioRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!audioRef.current.paused) {
      audioRef.current.pause();
    }
    audioRef.current.currentTime = start;
    audioRef.current.play();
    const duration = end - start;
    timeoutRef.current = setTimeout(() => {
      audioRef.current?.pause();
      setPlayIndex(undefined);
    }, duration * 1000);
  }

  function pause() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setPlayIndex(undefined);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4">
        <Label>{t("Number of Singers")}</Label>
        <Input
          min={2}
          max={7}
          className="w-20"
          type="number"
          value={numSingers}
          onChange={(e) => setNumSingers(parseInt(e.target.value || "2"))}
        />
      </div>
      {alignment.lines.map((line, lineIdx) => (
        <Line
          lineIdx={lineIdx}
          showPlayButton={Boolean(audioUrl)}
          playing={playIndex === lineIdx}
          play={(start: number, end: number) => play(lineIdx, start, end)}
          pause={pause}
          numSingers={numSingers}
          key={lineIdx}
          singer={line.singer ?? 0}
          start={line.start}
          end={line.end}
          text={line.text}
          styles={styles}
          onChange={(singer) => handleLineChange(lineIdx, singer)}
        />
      ))}
    </div>
  );
}
