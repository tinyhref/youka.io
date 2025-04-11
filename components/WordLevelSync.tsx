import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { Region } from "wavesurfer.js/dist/plugins/regions";
import { Button } from "./ui/button";
import { Alignment3, Theme } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faArrowLeft,
  faArrowRight,
  faBackward,
  faCopy,
  faForward,
  faInfoCircle,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPause,
  faPlay,
  faPlus,
  faRedo,
  faTrash,
  faUndo,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { Time } from "./player/Time";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "./ui/input";
import { useSettingsStore } from "@/stores/settings";
import { randomUUID } from "crypto";
import { faSplit } from "@/icons";
import * as report from "@/lib/report";
import { Toggle } from "./ui/toggle";
import SelectSinger from "./SelectSinger";
import { getSingersFromAlignment3 } from "@/lib/ass/utils";
// import log from "electron-log/main";
// log.initialize();

interface Props {
  peaks: number[] | undefined;
  audioUrl: string;
  alignment: Alignment3;
  onChange: (alignment: Alignment3) => void;
  onUpdateSegments: () => void;
  theme: Theme;
  showPreservedWords?: boolean;
}

interface Alignment3WithId {
  id: string;
  modelId: string;
  createdAt: string;
  text: string;
  lines: AlignmentV2LineWithId[];
}

interface AlignmentV2LineWithId {
  id: string;
  singer?: number;
  start: number;
  end: number;
  text: string;
  words: AlignmentV2WordWithId[];
}

interface AlignmentV2WordWithId {
  id: string;
  start: number;
  end: number;
  text: string;
  vocals?: boolean;
  subwords: AlignmentV2SubwordWithId[];
}

interface AlignmentV2SubwordWithId {
  id: string;
  start: number;
  end: number;
  text: string;
  vocals?: boolean;
}

interface LineWordSubwordIdx {
  lineId: string;
  wordId: string;
  subwordId: string;
  line: number;
  word: number;
  subword: number;
}

export function WordLevelSync({
  audioUrl,
  alignment,
  onChange,
  onUpdateSegments,
  showPreservedWords,
  theme,
  peaks,
}: Props) {
  const { t } = useTranslation();

  const [minPxPerSec, setMinPxPerSec] = useSettingsStore((state) => [
    state.minPxPerSecWord,
    state.setMinPxPerSecWord,
  ]);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [activeSubwordIdx, setActiveSubwordIdx] = useState<
    LineWordSubwordIdx
  >();
  const [activeSubword, setActiveSubword] = useState<
    AlignmentV2SubwordWithId
  >();
  const [searchResults, setSearchResults] = useState<LineWordSubwordIdx[]>([]);
  const [searchIndex, setSearchIndex] = useState<number>(-1);
  const [undoStack, setUndoStack] = useState<Alignment3WithId[]>([]);
  const [redoStack, setRedoStack] = useState<Alignment3WithId[]>([]);

  const alignmentRef = useRef<Alignment3WithId>();
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRegionsRef = useRef<RegionsPlugin>();
  const wsRef = useRef<WaveSurfer>();
  const activeRegionRef = useRef<Region>();
  const [activeRegion, setActiveRegion] = useState<Region>();
  const [ready, setReady] = useState<boolean>(false);
  const [singer, setSinger] = useState<number | undefined>();

  const singers = useMemo(() => {
    return getSingersFromAlignment3(alignment);
  }, [alignment]);

  useEffect(() => {
    if (alignmentRef.current && activeSubwordIdx) {
      const line = alignmentRef.current.lines[activeSubwordIdx.line];
      if (!line) return;
      const word = line.words[activeSubwordIdx.word];
      if (!word) return;
      const subword = word.subwords[activeSubwordIdx.subword];
      if (!subword) return;
      setActiveSubword(subword);
    }
  }, [activeSubwordIdx]);

  useEffect(() => {
    if (!alignmentRef.current || !searchResults.length || searchIndex === -1)
      return;
    if (!searchResults[searchIndex]) return;
    const idx = searchResults[searchIndex];
    const subword =
      alignmentRef.current.lines[idx.line].words[idx.word].subwords[
        idx.subword
      ];
    wsRef.current?.setTime(subword.start + 0.001);
    const regionId = subword.id;
    const region = wsRegionsRef.current
      ?.getRegions()
      .find((r) => r.id === regionId);
    if (region) {
      setActiveRegion(region);
    }
  }, [searchResults, searchIndex]);

  useEffect(() => {
    try {
      if (!wsRef.current) return;
      wsRef.current.zoom(minPxPerSec);
    } catch (e) {
      console.error("zoom error", e);
    }
  }, [minPxPerSec]);

  useEffect(() => {
    activeRegionRef.current = activeRegion;
  }, [activeRegion]);

  useEffect(() => {
    if (!activeRegion) return;
    const idx = getIdxFromSubwordId(activeRegion.id);
    setActiveSubwordIdx(idx);
  }, [activeRegion, alignmentRef]);

  useEffect(() => {
    if (!ready || !alignment) return;

    const ws = wsRef.current;
    if (!ws) return;

    // log.info("init regions");

    if (wsRegionsRef.current) {
      wsRegionsRef.current.destroy();
    }

    const wsRegions = ws.registerPlugin(RegionsPlugin.create());

    wsRegions.on("region-updated", (region) => {
      ws.setTime(region.start + 0.001);
      if (!alignmentRef.current) return;
      const idx = getIdxFromSubwordId(region.id);
      if (!idx) return;
      pushUndo();
      alignmentRef.current.lines[idx.line].words[idx.word].subwords[
        idx.subword
      ].start = region.start;
      alignmentRef.current.lines[idx.line].words[idx.word].subwords[
        idx.subword
      ].end = region.end;
      reportChange();
    });

    wsRegions.on("region-clicked", (region, e) => {
      e.stopPropagation(); // prevent triggering a click on the waveform
      setActiveRegion(region);
      ws.setTime(region.start + 0.001);
    });

    wsRegions.on("region-in", (region) => {
      if (!region?.element) return;
      const currentPart = region.element.getAttribute("part") || "";
      region.element.setAttribute("part", currentPart + " active");
    });

    wsRegions.on("region-out", (region) => {
      if (!region?.element) return;
      const currentPart = region.element.getAttribute("part") || "";
      region.element.setAttribute("part", currentPart.replace(" active", ""));

      if (region.id === activeRegionRef.current?.id && ws.isPlaying()) {
        ws.pause();
        ws.setTime(region.start + 0.001);
      }
    });

    const currAlignmentWithId = alignmentWithId(alignment);

    alignment.lines.forEach((line, lineIdx) => {
      line.words.forEach((word, wordIdx) => {
        word.subwords.forEach((subword, subwordIdx) => {
          wsRegions.addRegion({
            id:
              currAlignmentWithId.lines[lineIdx].words[wordIdx].subwords[
                subwordIdx
              ].id,
            start: subword.start,
            end: subword.end,
            content: subword.text,
          });
        });
      });
    });

    ws.setTime(alignment.lines[0].start || 0);

    alignmentRef.current = currAlignmentWithId;
    wsRegionsRef.current = wsRegions;

    return () => {
      wsRegions.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, alignment]);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    const dark = theme === "dark";

    // log.info("init wavesurfer");

    if (wsRef.current) {
      wsRef.current.destroy();
    }

    setReady(false);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: audioUrl,
      peaks: peaks?.length ? [peaks] : undefined,
      minPxPerSec,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      autoCenter: false,
      waveColor: dark ? "#2A163A" : "#ECE3F3",
      progressColor: dark ? "#3A234E" : "#D1C1DF",
      cursorColor: dark ? "#A188B7" : "#555",
    });

    ws.on("timeupdate", (currentTime) => {
      setCurrentTime(currentTime);
    });

    ws.on("interaction", () => {
      setActiveRegion(undefined);
    });

    ws.on("play", () => {
      setPlaying(true);
    });

    ws.on("pause", () => {
      setPlaying(false);
    });

    ws.on("decode", (duration) => {
      setDuration(duration);
      if (currentTime) {
        ws.setTime(currentTime);
      }
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
  }, [audioUrl, peaks]);

  function updateRegions(filterSinger?: number) {
    if (!alignmentRef.current || !wsRegionsRef.current) return;

    // Clear existing regions
    wsRegionsRef.current.clearRegions();

    // Add regions from the current alignment state
    alignmentRef.current.lines.forEach((line) => {
      const lineSinger = line.singer || 0;
      const hide = filterSinger !== undefined && lineSinger !== filterSinger;
      if (hide) return;
      line.words.forEach((word) => {
        word.subwords.forEach((subword) => {
          wsRegionsRef.current?.addRegion({
            id: subword.id,
            start: subword.start,
            end: subword.end,
            content: subword.text,
          });
        });
      });
    });
  }

  function refreshActiveWord() {
    if (alignmentRef.current && activeSubwordIdx) {
      const line = alignmentRef.current.lines[activeSubwordIdx.line];
      if (!line) return;
      const word = line.words[activeSubwordIdx.word];
      if (!word) return;
      const subword = word.subwords[activeSubwordIdx.subword];
      if (!subword) return;
      setActiveSubword(subword);
    }
  }

  function refreshActiveRegion() {
    const closestRegion = findClosestRegion(currentTime);
    setActiveRegion(closestRegion);
    if (closestRegion) {
      wsRef.current?.setTime(closestRegion.start + 0.001);
      const wordIdx = getIdxFromSubwordId(closestRegion.id);
      setActiveSubwordIdx(wordIdx);
    }
  }

  function pushUndo() {
    if (!alignmentRef.current) return;
    setUndoStack((prevStack) => [
      JSON.parse(JSON.stringify(alignmentRef.current)),
      ...prevStack,
    ]);
    setRedoStack([]);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    setRedoStack((prevStack) => [
      JSON.parse(JSON.stringify(alignmentRef.current)),
      ...prevStack,
    ]);
    const lastState = undoStack[0];
    setUndoStack((prevStack) => prevStack.slice(1));
    alignmentRef.current = JSON.parse(JSON.stringify(lastState));
    updateRegions();
    refreshActiveWord();
    refreshActiveRegion();
    reportChange();
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    setUndoStack((prevStack) => [
      JSON.parse(JSON.stringify(alignmentRef.current)),
      ...prevStack,
    ]);
    const lastState = redoStack[0];
    setRedoStack((prevStack) => prevStack.slice(1));
    alignmentRef.current = JSON.parse(JSON.stringify(lastState));
    updateRegions();
    refreshActiveWord();
    refreshActiveRegion();
    reportChange();
  }

  function getIdxFromSubwordId(id: string): LineWordSubwordIdx | undefined {
    if (!alignmentRef.current) return;

    for (
      let lineIdx = 0;
      lineIdx < alignmentRef.current.lines.length;
      lineIdx++
    ) {
      const line = alignmentRef.current.lines[lineIdx];
      for (let wordIdx = 0; wordIdx < line.words.length; wordIdx++) {
        const word = line.words[wordIdx];
        for (
          let subwordIdx = 0;
          subwordIdx < word.subwords.length;
          subwordIdx++
        ) {
          const subword = word.subwords[subwordIdx];
          if (subword.id === id) {
            return {
              lineId: line.id,
              wordId: word.id,
              subwordId: subword.id,
              line: lineIdx,
              word: wordIdx,
              subword: subwordIdx,
            };
          }
        }
      }
    }

    return undefined;
  }

  function togglePlay() {
    if (!wsRef.current) return;

    if (playing) {
      wsRef.current.pause();
    } else {
      setActiveRegion(undefined);
      wsRef.current.play();
    }
  }

  function alignmentWithId(alignment: Alignment3): Alignment3WithId {
    const alignments = {
      ...alignment,
      lines: alignment.lines.map((line) => ({
        ...line,
        id: randomUUID(),
        words: line.words.map((word) => ({
          ...word,
          id: randomUUID(),
          subwords: word.subwords.map((subword) => ({
            ...subword,
            id: randomUUID(),
          })),
        })),
      })),
    };

    return alignments;
  }

  function attachToNextWord() {
    if (!activeRegionRef.current || !alignmentRef.current) return;
    const idx = getIdxFromSubwordId(activeRegionRef.current.id);
    if (!idx) return;
    let nextSubword =
      alignmentRef.current.lines[idx.line].words[idx.word].subwords[
        idx.subword + 1
      ];
    if (!nextSubword) {
      const nextWord = alignmentRef.current.lines[idx.line].words[idx.word + 1];
      if (nextWord) {
        nextSubword = nextWord.subwords[0];
      }
    }
    if (!nextSubword) {
      const nextLine = alignmentRef.current.lines[idx.line + 1];
      if (nextLine) {
        const firstSubword = nextLine.words[0].subwords[0];
        if (firstSubword) {
          nextSubword = firstSubword;
        }
      }
    }
    if (!nextSubword) return;
    pushUndo();
    const end = nextSubword.start - 0.001;
    alignmentRef.current.lines[idx.line].words[idx.word].subwords[
      idx.subword
    ].end = end;
    activeRegionRef.current.setOptions({
      start: activeRegionRef.current.start,
      end,
    });
    reportChange();
  }

  function reportChange() {
    if (!alignmentRef.current) return;
    const sortedAlignment = sortAlignment(alignmentRef.current);
    onChange(sortedAlignment);
  }

  function sortAlignment(alignment: Alignment3WithId): Alignment3WithId {
    alignment.lines.forEach((line) => {
      line.words.forEach((word) => {
        word.subwords.sort((a, b) => a.start - b.start);
        word.start = word.subwords[0].start;
        word.end = word.subwords[word.subwords.length - 1].end;
      });
      line.words.sort((a, b) => a.start - b.start);
      line.start = line.words[0].start;
      line.end = line.words[line.words.length - 1].end;
    });

    return alignment;
  }

  function attachToPreviousWord() {
    if (!activeRegionRef.current || !alignmentRef.current) return;
    const idx = getIdxFromSubwordId(activeRegionRef.current.id);
    if (!idx) return;
    let previousSubword =
      alignmentRef.current.lines[idx.line].words[idx.word].subwords[
        idx.subword - 1
      ];
    if (!previousSubword) {
      const previousWord =
        alignmentRef.current.lines[idx.line].words[idx.word - 1];
      if (previousWord) {
        previousSubword =
          previousWord.subwords[previousWord.subwords.length - 1];
      }
    }
    if (!previousSubword) {
      const previousLine = alignmentRef.current.lines[idx.line - 1];
      if (previousLine) {
        const lastWord = previousLine.words[previousLine.words.length - 1];
        previousSubword = lastWord.subwords[lastWord.subwords.length - 1];
      }
    }
    if (!previousSubword) return;
    pushUndo();
    const start = previousSubword.end + 0.001;
    alignmentRef.current.lines[idx.line].words[idx.word].start = start;
    activeRegionRef.current.setOptions({
      start,
    });
    reportChange();
  }

  function handleDelete(subwordId: string) {
    if (!alignmentRef.current) return;
    const idx = getIdxFromSubwordId(subwordId);
    if (!idx) return;
    pushUndo();
    alignmentRef.current.lines[idx.line].words[idx.word].subwords.splice(
      idx.subword,
      1
    );
    if (!alignmentRef.current.lines[idx.line].words[idx.word].subwords.length) {
      alignmentRef.current.lines[idx.line].words.splice(idx.word, 1);
    }
    if (!alignmentRef.current.lines[idx.line].words.length) {
      alignmentRef.current.lines.splice(idx.line, 1);
    }
    if (activeRegion && activeRegion.remove) {
      activeRegion.remove();
    }
    const closestRegion = findClosestRegion(currentTime);
    setActiveRegion(closestRegion);
    if (closestRegion) {
      wsRef.current?.setTime(closestRegion.start + 0.001);
      const subwordIdx = getIdxFromSubwordId(closestRegion.id);
      setActiveSubwordIdx(subwordIdx);
    } else {
      setActiveSubwordIdx(undefined);
    }
    reportChange();
  }

  function handleChangeText(e: any) {
    const text = e.target.value;
    if (!activeRegion?.content || !alignmentRef.current || !activeSubwordIdx)
      return;
    pushUndo();
    activeRegion.content.textContent = text;
    alignmentRef.current.lines[activeSubwordIdx.line].words[
      activeSubwordIdx.word
    ].subwords[activeSubwordIdx.subword].text = text;
    reportChange();
  }

  function findClosestRegion(currentTime: number) {
    const regions = wsRegionsRef.current?.getRegions();
    if (!regions) return;
    // @ts-ignore
    let closestRegionBefore = regions.findLast((r: any) => r.end < currentTime);
    // @ts-ignore
    let closestRegionAfter = regions.find((r: any) => r.end > currentTime);
    let closestRegion: Region | undefined;
    if (closestRegionBefore && closestRegionAfter) {
      const diffBefore = currentTime - closestRegionBefore.end;
      const diffAfter = closestRegionAfter.start - currentTime;
      if (diffBefore < diffAfter) {
        closestRegion = closestRegionBefore;
      } else {
        closestRegion = closestRegionAfter;
      }
    } else if (closestRegionBefore) {
      closestRegion = closestRegionBefore;
    } else if (closestRegionAfter) {
      closestRegion = closestRegionAfter;
    }
    return closestRegion;
  }

  function handleAddWord() {
    const regions = wsRegionsRef.current?.getRegions();
    if (!regions) return;
    let after = true;
    // @ts-ignore
    let closestRegionBefore = regions.findLast((r: any) => r.end < currentTime);
    // @ts-ignore
    let closestRegionAfter = regions.find((r: any) => r.start > currentTime);
    let closestRegion: Region | undefined;
    if (closestRegionBefore && closestRegionAfter) {
      const diffBefore = currentTime - closestRegionBefore.end;
      const diffAfter = closestRegionAfter.start - currentTime;
      if (diffBefore < diffAfter) {
        closestRegion = closestRegionBefore;
        after = true;
      } else {
        closestRegion = closestRegionAfter;
        after = false;
      }
    } else if (closestRegionBefore) {
      closestRegion = closestRegionBefore;
      after = true;
    } else if (closestRegionAfter) {
      closestRegion = closestRegionAfter;
      after = false;
    }

    if (!closestRegion) return;

    const idx = getIdxFromSubwordId(closestRegion.id);
    if (!idx) return;

    const start = currentTime;
    const end = start + 0.4;
    addWord(idx, "<>", start, end, after);
  }

  function addWord(
    idx: LineWordSubwordIdx,
    text: string,
    start: number,
    end: number,
    after: boolean
  ) {
    if (!alignmentRef.current) return;
    pushUndo();
    const wordId = randomUUID();
    const subWordId = randomUUID();
    const wordRegion = {
      id: subWordId,
      start,
      end,
      content: text,
    };
    const region = wsRegionsRef.current?.addRegion(wordRegion);
    wsRef.current?.setTime(wordRegion.start + 0.001);
    const splice = after ? idx.word + 1 : idx.word;
    alignmentRef.current.lines[idx.line].words.splice(splice, 0, {
      id: wordId,
      start,
      end,
      text,
      subwords: [
        {
          id: subWordId,
          text,
          start,
          end,
        },
      ],
    });

    setActiveRegion(region);
    reportChange();
  }

  function togglePlayLoop() {
    if (!activeRegion) return;

    if (playing) {
      wsRef.current?.pause();
    } else {
      wsRef.current?.play();
    }
  }

  function handleClickZoomIn() {
    const newMinPxPerSec = minPxPerSec + 50;
    if (newMinPxPerSec > 2000) return;
    setMinPxPerSec(newMinPxPerSec);
  }

  function handleClickZoomOut() {
    const newMinPxPerSec = minPxPerSec - 50;
    if (newMinPxPerSec < 0) return;
    setMinPxPerSec(newMinPxPerSec);
  }

  function handleSearch(q: string) {
    if (!q) {
      setSearchResults([]);
      setSearchIndex(-1);
      return;
    }
    const results: LineWordSubwordIdx[] = [];
    alignmentRef.current?.lines.forEach((line, lineIdx) => {
      line.words.forEach((word, wordIdx) => {
        word.subwords.forEach((subword, subwordIdx) => {
          if (subword.text.toLowerCase().includes(q)) {
            results.push({
              wordId: word.id,
              lineId: line.id,
              subwordId: subword.id,
              line: lineIdx,
              word: wordIdx,
              subword: subwordIdx,
            });
          }
        });
      });
    });

    setSearchResults(results);
    if (results.length > 0) {
      setSearchIndex(0);
    } else {
      setSearchIndex(-1);
    }
  }

  function handleAddSubword(subword: AlignmentV2SubwordWithId) {
    if (!alignmentRef.current) return;
    const idx = getIdxFromSubwordId(subword.id);
    if (!idx) return;

    pushUndo();

    const newSubwordId = randomUUID();
    const newSubword: AlignmentV2SubwordWithId = {
      id: newSubwordId,
      start: subword.end + 0.01,
      end: subword.end + 0.4,
      text: "<>",
    };
    alignmentRef.current.lines[idx.line].words[idx.word].subwords.splice(
      idx.subword + 1,
      0,
      newSubword
    );
    const subwordRegion = {
      id: newSubwordId,
      start: newSubword.start,
      end: newSubword.end,
      content: newSubword.text,
    };
    const region = wsRegionsRef.current?.addRegion(subwordRegion);
    wsRef.current?.setTime(subwordRegion.start + 0.001);
    setActiveRegion(region);

    setActiveSubwordIdx(getIdxFromSubwordId(newSubwordId));
    reportChange();
  }

  function handleSplitLine(subwordId: string) {
    try {
      if (!alignmentRef.current) return;
      const idx = getIdxFromSubwordId(subwordId);
      if (!idx) return;
      const firstPart = alignmentRef.current?.lines[idx.line].words.slice(
        0,
        idx.word
      );
      const secondPart = alignmentRef.current?.lines[idx.line].words.slice(
        idx.word
      );
      if (!firstPart.length || !secondPart.length) return;
      pushUndo();
      const newLineId = randomUUID();
      const newLine: AlignmentV2LineWithId = {
        id: newLineId,
        start: firstPart[0].start,
        end: secondPart[secondPart.length - 1].end,
        text: firstPart.map((w) => w.text).join(" "),
        words: firstPart,
      };
      alignmentRef.current.lines.splice(idx.line, 1, newLine);
      const newLine2: AlignmentV2LineWithId = {
        id: randomUUID(),
        start: secondPart[0].start,
        end: secondPart[secondPart.length - 1].end,
        text: secondPart.map((w) => w.text).join(" "),
        words: secondPart,
      };
      alignmentRef.current.lines.splice(idx.line + 1, 0, newLine2);
      setActiveSubwordIdx(getIdxFromSubwordId(subwordId));
      reportChange();
    } catch (e) {
      report.error(e as Error);
    }
  }

  function handleDuplicate(subwordIdx: LineWordSubwordIdx) {
    if (!alignmentRef.current) return;
    const subword =
      alignmentRef.current.lines[subwordIdx.line].words[subwordIdx.word]
        .subwords[subwordIdx.subword];
    const duration = subword.end - subword.start;
    addWord(
      subwordIdx,
      subword.text,
      subword.end,
      subword.end + duration,
      true
    );
  }

  return (
    <div className="flex flex-col">
      <div>
        {singers.length > 1 && (
          <div className="w-fit">
            <SelectSinger
              withLabel
              value={singer}
              onChange={(value) => {
                setSinger(value);
                updateRegions(value);
              }}
              singers={singers}
            />
          </div>
        )}
      </div>
      <div className="flex flex-row items-center my-4">
        <Button
          variant="outline"
          className="m-1"
          onClick={() => setSearchIndex(searchIndex - 1)}
          disabled={!searchResults.length || searchIndex < 1}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        <Input
          placeholder={t("Search")}
          className="w-30"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Button
          variant="outline"
          className="m-1"
          onClick={() => setSearchIndex(searchIndex + 1)}
          disabled={
            !searchResults.length || searchResults.length - 1 === searchIndex
          }
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
        <div className="ml-2 text-sm">
          {searchResults.length > 0 && searchIndex !== -1 && (
            <div>
              {searchIndex + 1} / {searchResults.length}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-center m-2">
        {!activeRegion && <div className="h-[100px]"></div>}
        {alignmentRef.current &&
          activeRegion &&
          activeSubword &&
          activeSubwordIdx && (
            <div className="flex flex-row items-center justify-center h-[100px]">
              <div className="flex flex-row gap-2 mx-2">
                <div>
                  {t("Line")}:{" "}
                  <span className="font-bold">{activeSubwordIdx.line + 1}</span>
                </div>

                <div>
                  {t("Word")}:{" "}
                  <span className="font-bold">{activeSubwordIdx.word + 1}</span>
                </div>

                <div>
                  {t("Subword")}:{" "}
                  <span className="font-bold">
                    {activeSubwordIdx.subword + 1}
                  </span>
                </div>
              </div>

              <Input
                className="mx-1 text-lg w-[150px]"
                onChange={handleChangeText}
                value={activeSubword.text}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="m-1"
                    onClick={() => togglePlayLoop()}
                  >
                    {playing ? (
                      <FontAwesomeIcon icon={faPause} />
                    ) : (
                      <FontAwesomeIcon icon={faPlay} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Play")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="m-1"
                    onClick={attachToPreviousWord}
                  >
                    <FontAwesomeIcon icon={faBackward} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("comps.sync_editor.attach_previous")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="m-1"
                    onClick={attachToNextWord}
                  >
                    <FontAwesomeIcon icon={faForward} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("comps.sync_editor.attach_next")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="mx-1"
                    variant="outline"
                    onClick={() => handleSplitLine(activeSubwordIdx.subwordId)}
                  >
                    <FontAwesomeIcon icon={faSplit} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Split Line")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="mx-1"
                    variant="outline"
                    onClick={() => handleAddSubword(activeSubword)}
                  >
                    <FontAwesomeIcon icon={faAdd} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Add Subword")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="mx-1"
                    variant="outline"
                    onClick={() => handleDuplicate(activeSubwordIdx)}
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Duplicate")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="mx-1"
                    variant="outline"
                    onClick={() => handleDelete(activeSubwordIdx.subwordId)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Delete word")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="m-1"
                    variant="outline"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                  >
                    <FontAwesomeIcon icon={faUndo} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Undo")}</div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="m-1"
                    variant="outline"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                  >
                    <FontAwesomeIcon icon={faRedo} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div>{t("Redo")}</div>
                </TooltipContent>
              </Tooltip>

              {showPreservedWords && (
                <Toggle
                  aria-label="Toggle"
                  variant="outline"
                  pressed={activeSubword.vocals ? true : false}
                  onPressedChange={(vocals) => {
                    if (!alignmentRef.current) return;
                    alignmentRef.current.lines[activeSubwordIdx.line].words[
                      activeSubwordIdx.word
                    ].subwords[activeSubwordIdx.subword].vocals = vocals;
                    reportChange();
                    onUpdateSegments();
                  }}
                >
                  <FontAwesomeIcon icon={faVolumeHigh} className="mr-2" />
                  {t("preserve_vocals")}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FontAwesomeIcon icon={faInfoCircle} className="ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("preserve_vocals_description")}
                    </TooltipContent>
                  </Tooltip>
                </Toggle>
              )}
            </div>
          )}

        <div id="waveform" ref={containerRef} />
        <div className="flex flex-col">
          <div className="flex flex-row items-center justify-center m-4">
            <Button className="m-1" onClick={() => togglePlay()}>
              {playing ? (
                <FontAwesomeIcon icon={faPause} />
              ) : (
                <FontAwesomeIcon icon={faPlay} />
              )}
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled={playing}
                  className="mx-1"
                  variant="outline"
                  onClick={handleAddWord}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div>{t("Add new word")}</div>
              </TooltipContent>
            </Tooltip>

            <Button
              disabled={minPxPerSec >= 2000}
              variant="outline"
              className="m-1"
              onClick={handleClickZoomIn}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
            </Button>
            <Button
              disabled={minPxPerSec <= 0}
              variant="outline"
              className="m-1"
              onClick={handleClickZoomOut}
            >
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
            </Button>
            <Time
              className="m-1 w-12 text-sm text-primary"
              duration={duration}
              time={currentTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
