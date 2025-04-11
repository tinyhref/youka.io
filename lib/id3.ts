import * as NodeID3 from "node-id3";
import { IAlignmentItemSubword } from "@/types";

export interface SynchronisedText {
  text: string;
  timeStamp: number;
}

export interface ID3ParsedFile {
  title: string;
  alignments: IAlignmentItemSubword[];
}

export async function read(filepathOrBuffer: string | Buffer) {
  return NodeID3.read(filepathOrBuffer);
}

export async function parse(filepathOrBuffer: string | Buffer) {
  const tags = await NodeID3.read(filepathOrBuffer);
  if (!tags?.synchronisedLyrics || !tags.synchronisedLyrics.length) {
    return null;
  }

  const synchronisedLyrics = tags.synchronisedLyrics[0];
  const alignments = parseSynchronisedText(synchronisedLyrics.synchronisedText);

  const song = {
    title: tags.title,
    alignments,
  };

  return song;
}

export function parseSynchronisedText(synchronisedText: SynchronisedText[]) {
  const subwords: IAlignmentItemSubword[] = [];
  let line = 1;
  let word = 1;
  let subword = 1;

  synchronisedText.forEach((st, stIdx) => {
    const text = "" + st.text.trim();
    let start = parseTimestampToSeconds(st.timeStamp);
    let end;

    const nextSt = synchronisedText[stIdx + 1];

    if (nextSt) {
      const isEndOfLine = isNewLine(nextSt.text);
      if (isEndOfLine) {
        const prevSt = synchronisedText[stIdx - 1];
        if (prevSt) {
          const prevStart = parseTimestampToSeconds(prevSt.timeStamp);
          const nextStart = parseTimestampToSeconds(nextSt.timeStamp);
          const duration = start - prevStart;
          end = start + duration;
          if (end > nextStart) {
            end = nextStart;
          }
        }
      } else {
        end = parseTimestampToSeconds(nextSt.timeStamp);
      }
    }

    if (!end) {
      end = start + 0.2;
    }

    if (isNewLine(st.text)) {
      line++;
      word = 1;
      subword = 1;
    }

    subwords.push({
      line,
      word,
      subword,
      text,
      start,
      end,
    });

    subword++;

    if (isEndOfWord(st.text)) {
      word++;
      subword = 1;
    }
  });

  return subwords;
}

function parseTimestampToSeconds(timestamp: number): number {
  return timestamp / 1000;
}

function isNewLine(text: string) {
  return text.includes("\n") || text.includes("\r");
}

function isEndOfWord(text: string) {
  return text.includes(" ");
}
