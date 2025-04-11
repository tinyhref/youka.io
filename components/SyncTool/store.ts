import { createWithEqualityFn as create } from "zustand/traditional";
import { immer } from "zustand/middleware/immer";
import { SyncAlignment, SyncAlignmentSubword } from "./types";
import {
  addLine,
  addSubword,
  addWord,
  deleteByIds,
  deleteLines,
  deleteSubwords,
  deleteWords,
  findLine,
  findSubword,
  getNewWordTimeBySubword,
  mergeLineWithNextLine,
  pasteLines,
  pasteWords,
  shiftAlignment,
  shiftLines,
  splitLine,
  updateSubwordText,
  updateSubwordTimes,
} from "./utils";
import { persist } from "zustand/middleware";

interface SyncState {
  videoElement: HTMLVideoElement;
  alignment: SyncAlignment;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  undoStack: SyncAlignment[];
  redoStack: SyncAlignment[];
  isShiftPressed: boolean;
  pixelsPerSecond: number;
  selectedLines: string[];
  selectedWords: string[];
  selectedSubwords: string[];
  copiedLines: string[];
  copiedWords: string[];
  isCut: boolean;
  rtl: boolean;
  shiftStep: number;

  init: () => void;
  setAlignment: (newAlignment: SyncAlignment) => void;
  updateSubwordTimes: (
    subwordId: string,
    newStart: number,
    newEnd: number
  ) => void;
  addLine: (start: number, end: number, text: string) => void;
  addWord: (lineId: string, start: number, end: number, text: string) => void;
  addSubword: (
    lineId: string,
    wordId: string,
    start: number,
    end: number,
    text: string
  ) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  play: () => void;
  pause: () => void;
  recordSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  selectSubword: (subwordId: string, multi?: boolean) => void;
  clearSelectedSubwords: () => void;
  setIsShiftPressed: (isShiftPressed: boolean) => void;
  deleteSubwords: (ids: string[]) => void;
  setPixelsPerSecond: (pixelsPerSecond: number) => void;
  playSubword: (subword: SyncAlignmentSubword) => void;
  playLine: (lineId: string) => void;
  selectLine: (lineId: string, multi?: boolean, time?: number) => void;
  clearSelected: () => void;
  selectedIds: () => string[];
  updateSubwordText: (subwordId: string, text: string) => void;
  copyLines: (lineIds: string[]) => void;
  copyWords: (wordIds: string[]) => void;
  pasteLines: (time: number, lineIds: string[]) => void;
  pasteWords: (time: number, wordIds: string[]) => void;
  deleteLines: (lineIds: string[]) => void;
  deleteWords: (wordIds: string[]) => void;
  deleteSelected: () => void;
  splitLine: (wordId: string) => void;
  selectWord: (wordId: string, multi?: boolean) => void;
  cutLines: (lineIds: string[]) => void;
  cutWords: (wordIds: string[]) => void;
  seekForward: (seconds: number) => void;
  seekBackward: (seconds: number) => void;
  togglePlay: () => void;
  playSegment: (start: number, end: number) => void;
  splitSelectedWord: () => void;
  selectNearSubword: (time: number) => void;
  copySelected: () => void;
  cutSelected: () => void;
  pasteSelected: () => void;
  playSelected: () => void;
  addLineOrWord: () => void;
  selectSelectedLine: () => void;
  reset: () => void;
  setRtl: (rtl: boolean) => void;
  mergeLineWithNextLine: (lineId: string) => void;
  mergeSelectedLineWithNextLine: () => void;
  trimSubwordStart: (subwordId: string, time: number) => void;
  trimSubwordEnd: (subwordId: string, time: number) => void;
  shiftAlignment: (time: number) => void;
  shiftLines: (lineIds: string[], time: number) => void;
  shiftSelectedLines: (time: number) => void;
  selectAllLines: () => void;
  updateLineTimes: (lineId: string, time: number) => void;
}

// Add interface for persisted state
interface PersistedState {
  pixelsPerSecond: number;
}

function initVideoElement() {
  const el = document.getElementById("video") as HTMLVideoElement;
  if (el) return el;

  return document.createElement("video");
}

export const useSyncStore = create<SyncState>()(
  persist(
    immer<SyncState>((set, get) => ({
      alignment: { lines: [] },
      undoStack: [],
      redoStack: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      isShiftPressed: false,
      selectedLines: [],
      selectedWords: [],
      selectedSubwords: [],
      pixelsPerSecond: 300,
      copiedLines: [],
      copiedWords: [],
      isCut: false,
      videoElement: initVideoElement(),
      rtl: false,
      shiftStep: 0.05,

      updateLineTimes: (lineId: string, time: number) => {
        const newAlignment = shiftLines(get().alignment, [lineId], time);
        get().recordSnapshot();
        set((state) => {
          state.alignment = newAlignment;
        });
      },

      selectAllLines: () => {
        const lines = get().alignment.lines.map((line) => line.lineId);
        set((state) => {
          state.selectedLines = lines;
          state.selectedWords = [];
          state.selectedSubwords = [];
        });
      },

      shiftSelectedLines: (time: number) => {
        const selectedLines = get().selectedLines;
        if (selectedLines.length === 0) return;
        get().shiftLines(selectedLines, time);
      },

      shiftLines: (lineIds: string[], time: number) => {
        const newAlignment = shiftLines(get().alignment, lineIds, time);
        get().recordSnapshot();
        set((state) => {
          state.alignment = newAlignment;
        });
      },

      shiftAlignment: (time: number) => {
        const newAlignment = shiftAlignment(get().alignment, time);
        get().recordSnapshot();
        set((state) => {
          state.alignment = newAlignment;
        });
      },

      trimSubwordStart: (subwordId: string, time: number) => {
        const subword = findSubword(get().alignment, subwordId);
        if (!subword) return;
        if (time > subword.end) return;
        get().updateSubwordTimes(subwordId, time, subword.end);
      },

      trimSubwordEnd: (subwordId: string, time: number) => {
        const subword = findSubword(get().alignment, subwordId);
        if (!subword) return;
        if (time < subword.start) return;
        get().updateSubwordTimes(subwordId, subword.start, time);
      },

      mergeSelectedLineWithNextLine: () => {
        const selectedLines = get().selectedLines;
        if (selectedLines.length !== 1) return;
        get().mergeLineWithNextLine(selectedLines[0]);
      },

      mergeLineWithNextLine: (lineId: string) => {
        const output = mergeLineWithNextLine(get().alignment, lineId);
        if (!output) return;
        const { newAlignment, nextLine } = output;
        get().recordSnapshot();
        set((state) => {
          state.alignment = newAlignment;
          state.selectedLines = [nextLine.lineId];
        });
      },

      setRtl: (rtl: boolean) => {
        set((state) => {
          state.rtl = rtl;
        });
      },

      reset: () => {
        set((state) => {
          state.alignment = { lines: [] };
          state.undoStack = [];
          state.redoStack = [];
          state.currentTime = 0;
          state.duration = 0;
          state.isPlaying = false;
          state.isCut = false;
          state.selectedLines = [];
          state.selectedWords = [];
          state.selectedSubwords = [];
          state.copiedLines = [];
          state.copiedWords = [];
          state.rtl = false;
        });
      },

      selectSelectedLine: () => {
        const selectedSubwords = get().selectedSubwords;
        if (selectedSubwords.length === 0) return;
        const subword = findSubword(get().alignment, selectedSubwords[0]);
        if (!subword) return;
        get().selectLine(subword.lineId);
      },

      addLineOrWord: () => {
        const selectedSubwords = get().selectedSubwords;
        const selectedLines = get().selectedLines;

        if (selectedSubwords.length > 0) {
          const subword = findSubword(get().alignment, selectedSubwords[0]);
          if (!subword) return;
          const { start, end } = getNewWordTimeBySubword(subword);
          get().addWord(subword.lineId, start, end, "<>");
        } else if (selectedLines.length === 0) {
          const currentTime = get().currentTime;
          get().addLine(currentTime, currentTime + 1, "<>");
        }
      },

      playSelected: () => {
        if (get().isPlaying) {
          get().pause();
          return;
        }

        const selectedSubwords = get().selectedSubwords;
        const selectedLines = get().selectedLines;

        if (selectedSubwords.length > 0) {
          const subword = findSubword(get().alignment, selectedSubwords[0]);
          if (!subword) return;
          get().playSubword(subword);
        } else if (selectedLines.length > 0) {
          get().playLine(selectedLines[0]);
        } else {
          get().play();
        }
      },

      copySelected: () => {
        const selectedLines = get().selectedLines;
        const selectedWords = get().selectedWords;

        if (selectedWords.length > 0) {
          get().copyWords(selectedWords);
        } else if (selectedLines.length > 0) {
          get().copyLines(selectedLines);
        }
      },

      cutSelected: () => {
        const selectedLines = get().selectedLines;
        const selectedWords = get().selectedWords;

        if (selectedWords.length > 0) {
          get().cutWords(selectedWords);
        } else if (selectedLines.length > 0) {
          get().cutLines(selectedLines);
        }
      },

      pasteSelected: () => {
        const copiedLines = get().copiedLines;
        const copiedWords = get().copiedWords;

        if (copiedWords.length > 0) {
          get().pasteWords(get().currentTime, copiedWords);
        } else if (copiedLines.length > 0) {
          get().pasteLines(get().currentTime, copiedLines);
        }
      },

      selectNearSubword: (time: number) => {
        for (const line of get().alignment.lines) {
          for (const word of line.words) {
            for (const subword of word.subwords) {
              if (subword.start > time) {
                get().selectSubword(subword.subwordId);
                return;
              }
            }
          }
        }
      },

      splitSelectedWord: () => {
        const wordId = get().selectedWords[0];
        if (!wordId) return;
        get().splitLine(wordId);
      },

      playSegment: async (start: number, end: number) => {
        const videoElement = get().videoElement;
        videoElement.currentTime = start;
        await videoElement.play();

        let rafId: number;
        const checkTime = () => {
          if (videoElement.currentTime >= end) {
            videoElement.pause();
            videoElement.currentTime = end; // Ensure exact timing
            cancelAnimationFrame(rafId); // Stop the loop
          } else {
            rafId = requestAnimationFrame(checkTime);
          }
        };
        rafId = requestAnimationFrame(checkTime);
      },

      seekForward: (seconds: number) => {
        get().setCurrentTime(get().videoElement.currentTime + seconds);
      },

      seekBackward: (seconds: number) => {
        get().setCurrentTime(get().videoElement.currentTime - seconds);
      },

      togglePlay: () => {
        if (get().isPlaying) {
          get().videoElement.pause();
        } else {
          get().videoElement.play();
        }
      },

      cutLines: (lineIds: string[]) => {
        set((state) => {
          state.isCut = true;
          state.copiedLines = lineIds;
        });
      },

      cutWords: (wordIds: string[]) => {
        set((state) => {
          state.isCut = true;
          state.copiedWords = wordIds;
        });
      },

      selectWord: (wordId: string, multi?: boolean) => {
        set((state) => {
          if (!multi) {
            state.selectedWords = [wordId];
            state.selectedLines = [wordId];
          } else {
            if (state.selectedWords.includes(wordId)) {
              state.selectedWords = state.selectedWords.filter(
                (id) => id !== wordId
              );
            } else {
              state.selectedWords.push(wordId);
            }
          }
        });
      },

      splitLine: (wordId: string) => {
        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const output = splitLine(alignment, wordId);
        if (!output) return;
        const { newAlignment, linePart2 } = output;
        set((state) => {
          state.alignment = newAlignment;
          state.selectedLines = [linePart2.lineId];
          state.selectedWords = [wordId];
          state.selectedSubwords = [linePart2.words[0].subwords[0].subwordId];
        });
      },

      deleteSelected: () => {
        const ids = [];
        const selectedWords = get().selectedWords;
        const selectedLines = get().selectedLines;
        if (selectedWords.length) {
          ids.push(...selectedWords);
        } else if (selectedLines.length) {
          ids.push(...selectedLines);
        }

        if (!ids.length) return;

        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const newAlignment = deleteByIds(alignment, ids);
        set((state) => {
          state.alignment = newAlignment;
        });

        get().selectNearSubword(get().currentTime);
      },

      deleteLines: (lineIds: string[]) => {
        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const newAlignment = deleteLines(alignment, lineIds);
        set((state) => {
          state.alignment = newAlignment;
          state.selectedLines = state.selectedLines.filter(
            (id) => !lineIds.includes(id)
          );
        });
      },

      deleteWords: (wordIds: string[]) => {
        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const newAlignment = deleteWords(alignment, wordIds);
        set((state) => {
          state.alignment = newAlignment;
          state.selectedWords = state.selectedWords.filter(
            (id) => !wordIds.includes(id)
          );
        });
      },

      copyWords: (wordIds: string[]) => {
        set((state) => {
          state.copiedWords = wordIds;
          state.isCut = false;
        });
      },

      copyLines: (lineIds: string[]) => {
        set((state) => {
          state.copiedLines = lineIds;
          state.isCut = false;
        });
      },

      pasteLines: (time: number, lineIds: string[]) => {
        const alignment = structuredClone(get().alignment);
        const output = pasteLines(alignment, time, lineIds, get().isCut);
        if (!output) return;
        const { newAlignment, newLines } = output;
        get().recordSnapshot();
        set((state) => {
          state.alignment = newAlignment;
          state.selectedLines = newLines.map((line) => line.lineId);
          state.selectedWords = [];
          state.selectedSubwords = [];
          state.currentTime = newLines[0].start;
        });
      },

      pasteWords: (time: number, wordIds: string[]) => {
        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const newAlignment = pasteWords(alignment, time, wordIds, get().isCut);
        set((state) => {
          state.alignment = newAlignment;
        });
      },

      updateSubwordText: (subwordId, text) => {
        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const newAlignment = updateSubwordText(alignment, subwordId, text);
        set({ alignment: newAlignment });
      },

      selectedIds: () => {
        return [
          ...get().selectedLines,
          ...get().selectedWords,
          ...get().selectedSubwords,
        ];
      },

      clearSelected: () => {
        set({ selectedLines: [], selectedWords: [], selectedSubwords: [] });
      },

      init: () => {
        const videoElement = get().videoElement;

        videoElement.onloadeddata = () => {
          set((state) => {
            state.duration = videoElement.duration;
          });
        };
        videoElement.ontimeupdate = () => {
          set((state) => {
            state.currentTime = videoElement.currentTime;
          });
        };
        videoElement.onplaying = () => {
          set((state) => {
            state.isPlaying = true;
          });
        };
        videoElement.onpause = () => {
          set((state) => {
            state.isPlaying = false;
          });
        };
      },

      selectLine: (lineId: string, multi?: boolean, time?: number) => {
        const line = findLine(get().alignment, lineId);
        if (!line) return;

        set((state) => {
          if (!multi) {
            state.selectedLines = [lineId];
            if (!get().isPlaying) {
              state.currentTime = time ?? line.start;
            }
          } else {
            if (state.selectedLines.includes(lineId)) {
              state.selectedLines = state.selectedLines.filter(
                (id) => id !== lineId
              );
            } else {
              state.selectedLines.push(lineId);
            }
          }
          state.selectedWords = [];
          state.selectedSubwords = [];
        });
      },

      playSubword: (subword: SyncAlignmentSubword) => {
        get().playSegment(subword.start, subword.end);
      },

      playLine: (lineId: string) => {
        const line = findLine(get().alignment, lineId);
        if (!line) return;
        get().playSegment(line.start, line.end);
      },

      setPixelsPerSecond: (pixelsPerSecond) => {
        set((state) => {
          state.pixelsPerSecond = pixelsPerSecond;
        });
      },

      deleteSubwords: (ids: string[]) => {
        get().recordSnapshot();
        const alignment = structuredClone(get().alignment);
        const newAlignment = deleteSubwords(alignment, ids);
        set((state) => {
          state.alignment = newAlignment;
          state.selectedSubwords = state.selectedSubwords.filter(
            (id) => !ids.includes(id)
          );
        });
      },

      setIsShiftPressed: (isShiftPressed: boolean) => {
        set((state) => {
          state.isShiftPressed = isShiftPressed;
        });
      },

      selectSubword: (subwordId, multi = false) => {
        get().pause();
        const subword = findSubword(get().alignment, subwordId);
        if (!subword) return;

        set((state) => {
          if (!multi) {
            // single select
            state.selectedSubwords = [subwordId];
            state.selectedWords = [subword.wordId];
            state.selectedLines = [subword.lineId];
            get().setCurrentTime(subword.start);
          } else {
            // multi select
            const exSubword = state.selectedSubwords.includes(subwordId);
            if (exSubword) {
              state.selectedSubwords = state.selectedSubwords.filter(
                (id) => id !== subwordId
              );
            } else {
              state.selectedSubwords.push(subwordId);
            }
            state.selectedWords = state.selectedWords.filter(
              (id) => id !== subword.wordId
            );
            state.selectedWords.push(subword.wordId);
            state.selectedLines = state.selectedLines.filter(
              (id) => id !== subword.lineId
            );
            state.selectedLines.push(subword.lineId);
          }
        });
      },

      clearSelectedSubwords: () => set({ selectedSubwords: [] }),

      setAlignment: (newAlignment) => {
        set((state) => {
          state.alignment = newAlignment;
        });
      },

      updateSubwordTimes: (subwordId, newStart, newEnd) => {
        get().recordSnapshot();

        const newAlignment = updateSubwordTimes(
          get().alignment,
          subwordId,
          newStart,
          newEnd
        );
        set({ alignment: newAlignment });
      },

      recordSnapshot: () => {
        const alignment = get().alignment;

        // Save current alignment to undo stack
        set((state) => {
          const snap = structuredClone(alignment) as SyncAlignment;
          state.undoStack.push(snap);
          state.redoStack = []; // Clear redo stack whenever we do a new action
        });
      },

      undo: () => {
        set((state) => {
          if (state.undoStack.length === 0) return;
          const snapshot = state.undoStack.pop();
          if (!snapshot) return;

          // Push current alignment to redo
          const current = get().alignment;
          if (current) {
            const currSnap = structuredClone(current) as SyncAlignment;
            state.redoStack.push(currSnap);
          }

          // Restore from snapshot
          state.alignment = snapshot;
        });
      },

      redo: () => {
        set((state) => {
          if (state.redoStack.length === 0) return;
          const snapshot = state.redoStack.pop();
          if (!snapshot) return;

          // Push current alignment to undo
          const current = get().alignment;
          if (current) {
            const currSnap = structuredClone(current) as SyncAlignment;
            state.undoStack.push(currSnap);
          }

          // Restore snapshot
          state.alignment = snapshot;
        });
      },

      setCurrentTime: (time) => {
        get().videoElement.currentTime = time;
      },

      setDuration: (duration) => {
        set((state) => {
          state.duration = duration;
        });
      },

      play: () => {
        get().videoElement.play();
      },

      pause: () => {
        get().videoElement.pause();
      },

      addLine: (start, end, text) => {
        get().recordSnapshot();
        const alignment = get().alignment;
        const { newAlignment, newLine } = addLine(alignment, start, end, text);
        set((state) => {
          state.alignment = newAlignment;
        });
        get().selectLine(newLine.lineId);
      },

      addWord: (lineId: string, start: number, end: number, text: string) => {
        const alignment = get().alignment;
        const output = addWord(alignment, lineId, start, end, text);
        if (!output) return;
        get().recordSnapshot();
        const { newAlignment, newWord } = output;
        set((state) => {
          state.alignment = newAlignment;
        });
        get().selectLine(newWord.lineId);
        get().selectWord(newWord.wordId);
        get().selectSubword(newWord.subwords[0].subwordId);
      },

      addSubword: (
        lineId: string,
        wordId: string,
        start: number,
        end: number,
        text: string
      ) => {
        const alignment = get().alignment;
        const output = addSubword(alignment, lineId, wordId, start, end, text);
        if (!output) return;
        get().recordSnapshot();
        const { newAlignment, newSubword } = output;
        set((state) => {
          state.alignment = newAlignment;
        });
        get().selectLine(newSubword.lineId);
        get().selectWord(newSubword.wordId);
        get().selectSubword(newSubword.subwordId);
      },
    })),
    {
      name: "sync-store",
      // Only persist specific fields
      partialize: (state) =>
        ({
          pixelsPerSecond: state.pixelsPerSecond,
        } as PersistedState),
    }
  )
);
