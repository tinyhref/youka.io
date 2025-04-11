import React, { useMemo } from "react";
import { useSyncStore } from "./store";
import { findLineByTime, findSubword } from "./utils";
import { NewWordButton } from "./buttons/NewWordButton";
import { PasteWordButton } from "./buttons/PasteWordButton";
import { PasteLineButton } from "./buttons/PasteLineButton";
import { NewLineButton } from "./buttons/NewLineButton";
import { CopyLineButton } from "./buttons/CopyLineButton";
import { DeleteLineButton } from "./buttons/DeleteLineButton";
import { PlaySubwordButton } from "./buttons/PlaySubwordButton";
import { CopyWordButton } from "./buttons/CopyWordButton";
import { CutWordsButton } from "./buttons/CutWordsButton";
import { SubwordInput } from "./SubwordInput";
import { DeleteWordButton } from "./buttons/DeleteWordButton";
import { PlayLineButton } from "./buttons/PlayLineButton";
import { SelectLineButton } from "./buttons/SelectLineButton";
import { UndoButton } from "./buttons/UndoButton";
import { RedoButton } from "./buttons/RedoButton";
import { NewWordBySubwordButton } from "./buttons/NewWordBySubwordButton";
import { PasteWordBySubwordButton } from "./buttons/PasteWordBySubwordButton";
import { SplitLineBySubwordButton } from "./buttons/SplitLineBySubwordButton";
import { CutLinesButton } from "./buttons/CutLinesButton";
import { PlayButton } from "./buttons/PlayButton";
import { TrimSubwordEndButton } from "./buttons/TrimSubwordEndButton";
import { TrimSubwordStartButton } from "./buttons/TrimSubwordStartButton";
import { MergeLineButton } from "./buttons/MergeLineButton";
import { ShiftLineBackwardButton } from "./buttons/ShifLineBackwardButton";
import { ShiftLineForwardButton } from "./buttons/ShifLineForwardButton";

export const Actions = () => {
  const selectedSubwords = useSyncStore((state) => state.selectedSubwords);
  const alignment = useSyncStore((state) => state.alignment);
  const currentTime = useSyncStore((state) => state.currentTime);

  const subword = useMemo(() => {
    return findSubword(alignment, selectedSubwords[0]);
  }, [alignment, selectedSubwords]);

  const line = useMemo(() => {
    return findLineByTime(alignment, currentTime);
  }, [alignment, currentTime]);

  function render() {
    if (!subword && line) {
      return (
        <>
          <PlayLineButton />
          <NewWordButton />
          <CopyLineButton />
          <CutLinesButton />
          <PasteWordButton />
          <DeleteLineButton />
          <UndoButton />
          <RedoButton />
        </>
      );
    } else if (subword) {
      return (
        <>
          <SubwordInput subword={subword} />
          <PlaySubwordButton />
          <NewWordBySubwordButton subword={subword} />
          <CopyWordButton />
          <CutWordsButton />
          <PasteWordBySubwordButton subword={subword} />
          <DeleteWordButton />
          <SelectLineButton subword={subword} />
          <SplitLineBySubwordButton subword={subword} />
          <MergeLineButton lineId={subword.lineId} />
          <TrimSubwordStartButton subword={subword} currentTime={currentTime} />
          <TrimSubwordEndButton subword={subword} currentTime={currentTime} />
          <ShiftLineBackwardButton />
          <ShiftLineForwardButton />
          <UndoButton />
          <RedoButton />
        </>
      );
    } else {
      return (
        <>
          <PlayButton />
          <NewLineButton />
          <PasteLineButton />
        </>
      );
    }
  }

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      {render()}
    </div>
  );
};
