import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useSyncStore } from "./store";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  ClipboardCopyIcon,
  MergeIcon,
  PlusIcon,
  ScissorsIcon,
  TrashIcon,
  WrapTextIcon,
} from "lucide-react";
import { getNewWordTime } from "./utils";

interface Props {
  children: React.ReactNode;
}
export function ContextMenuSong({ children }: Props) {
  const { t } = useTranslation();
  const alignment = useSyncStore((state) => state.alignment);
  const selectedLines = useSyncStore((state) => state.selectedLines);
  const selectedWords = useSyncStore((state) => state.selectedWords);
  const selectedSubwords = useSyncStore((state) => state.selectedSubwords);
  const currentTime = useSyncStore((state) => state.currentTime);
  const addLine = useSyncStore((state) => state.addLine);
  const copyWords = useSyncStore((state) => state.copyWords);
  const cutWords = useSyncStore((state) => state.cutWords);
  const pasteWords = useSyncStore((state) => state.pasteWords);
  const deleteLines = useSyncStore((state) => state.deleteLines);
  const deleteWords = useSyncStore((state) => state.deleteWords);
  const addWord = useSyncStore((state) => state.addWord);
  const copyLines = useSyncStore((state) => state.copyLines);
  const pasteLines = useSyncStore((state) => state.pasteLines);
  const splitLine = useSyncStore((state) => state.splitLine);
  const trimSubwordStart = useSyncStore((state) => state.trimSubwordStart);
  const trimSubwordEnd = useSyncStore((state) => state.trimSubwordEnd);
  const cutLines = useSyncStore((state) => state.cutLines);
  const mergeLineWithNextLine = useSyncStore(
    (state) => state.mergeLineWithNextLine
  );
  const copiedWords = useSyncStore((state) => state.copiedWords);
  const copiedLines = useSyncStore((state) => state.copiedLines);
  function handleAddWord() {
    const lineId = selectedLines[0];
    if (!lineId) return;

    const { start, end } = getNewWordTime(alignment, currentTime);

    addWord(lineId, start, end, "<>");
  }

  function render() {
    const iconClassName = "h-4 w-4 mr-2";

    if (selectedWords.length) {
      return (
        <>
          <ContextMenuItem onClick={() => copyWords(selectedWords)}>
            <ClipboardCopyIcon className={iconClassName} />
            {t("Copy Word")}
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => cutWords(selectedWords)}>
            <ScissorsIcon className={iconClassName} />
            {t("Cut Word")}
            <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => deleteWords(selectedWords)}>
            <TrashIcon className={iconClassName} />
            {t("Delete Word")}
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => splitLine(selectedWords[0])}>
            <WrapTextIcon className={iconClassName} />
            {t("Split Line")}
            <ContextMenuShortcut>Ctrl+L</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            disabled={selectedLines.length !== 1}
            onClick={() => mergeLineWithNextLine(selectedLines[0])}
          >
            <MergeIcon className={iconClassName} />
            {t("Merge Line")}
            <ContextMenuShortcut>Ctrl+M</ContextMenuShortcut>
          </ContextMenuItem>
          {selectedSubwords.length === 1 && (
            <>
              <ContextMenuItem
                onClick={() =>
                  trimSubwordStart(selectedSubwords[0], currentTime)
                }
              >
                <ArrowLeftToLineIcon className={iconClassName} />
                {t("Trim Start")}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => trimSubwordEnd(selectedSubwords[0], currentTime)}
              >
                <ArrowRightToLineIcon className={iconClassName} />
                {t("Trim End")}
              </ContextMenuItem>
            </>
          )}
        </>
      );
    } else if (selectedLines.length) {
      return (
        <>
          <ContextMenuItem
            disabled={selectedLines.length !== 1}
            onClick={handleAddWord}
          >
            <PlusIcon className={iconClassName} />
            {t("Add Word")}
            <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            disabled={copiedWords.length === 0}
            onClick={() => pasteWords(currentTime, copiedWords)}
          >
            <ClipboardCopyIcon className={iconClassName} />
            {t("Paste Word")}
            <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => copyLines(selectedLines)}>
            <ClipboardCopyIcon className={iconClassName} />
            {t("Copy Line")}
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => cutLines(selectedLines)}>
            <ScissorsIcon className={iconClassName} />
            {t("Cut Line")}
            <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem onClick={() => deleteLines(selectedLines)}>
            <TrashIcon className={iconClassName} />
            {t("Delete Line")}
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
        </>
      );
    } else {
      return (
        <>
          <ContextMenuItem
            onClick={() => addLine(currentTime, currentTime + 1, "<>")}
          >
            <PlusIcon className={iconClassName} />
            {t("Add Line")}
            <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            disabled={copiedLines.length === 0}
            onClick={() => pasteLines(currentTime, copiedLines)}
          >
            <ClipboardCopyIcon className={iconClassName} />
            {t("Paste Line")}
            <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
          </ContextMenuItem>
        </>
      );
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">{render()}</ContextMenuContent>
    </ContextMenu>
  );
}
