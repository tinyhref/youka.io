interface SyncedLyric {
  start: number;
  end: number;
  line: number;
  word: number;
  subword: number;
  text: string;
}

type EffSection = {
  sync: number[];
  text: string[];
};

export function parseKarafunIniFile(karafunContent: string): SyncedLyric[][] {
  const lines = karafunContent.split("\n");
  const effSections: Record<string, EffSection> = {};
  let currentEff: string | null = null;
  const syncRegex = /Sync\d+=([\d,]+)/;

  lines.forEach((line) => {
    const sectionMatch = line.match(/\[Eff(\d+)\]/);
    if (sectionMatch) {
      currentEff = sectionMatch[1];
      effSections[currentEff] = { sync: [], text: [] };
      return;
    }

    if (currentEff && line.startsWith("Sync")) {
      const match = syncRegex.exec(line);
      if (match) {
        const syncPoints = match[1].split(",").map(Number);
        effSections[currentEff].sync.push(...syncPoints);
      }
    }

    if (currentEff && line.startsWith("Text")) {
      const textMatch = line.match(/Text\d+=(.*)/);
      if (textMatch) {
        effSections[currentEff].text.push(textMatch[1]);
      }
    }
  });

  const syncedLyrics: SyncedLyric[][] = [];
  Object.entries(effSections).forEach(([_, { sync, text }]) => {
    const s = parseSyncs(sync, text);
    if (s.length > 0) {
      syncedLyrics.push(s);
    }
  });

  return syncedLyrics;
}

export function parseSyncs(syncs: number[], text: string[]): SyncedLyric[] {
  const result: SyncedLyric[] = [];
  let syncIndex = 0;

  text.forEach((lineText, lineIndex) => {
    const words = lineText.split(" ");
    words.forEach((word, wordIndex) => {
      const subwords = word.split("/");
      subwords.forEach((subword, subIndex) => {
        if (syncIndex < syncs.length - 1) {
          const start = syncs[syncIndex] / 100;

          const isLastWord = wordIndex === words.length - 1;
          let end = syncs[syncIndex + 1] / 100;
          if (isLastWord) {
            const lineitems = result.filter((r) => r.line === lineIndex + 1);
            if (lineitems.length > 0) {
              const lineStart = lineitems[0].start;
              const lineEnd = lineitems[lineitems.length - 1].end;
              const lineDuration = lineEnd - lineStart;
              const lineLength = lineitems
                .map((r) => r.text.length)
                .reduce((a, b) => a + b, 0);
              const avgDuration = lineDuration / lineLength;
              end = parseFloat(
                (start + avgDuration * subword.length).toFixed(2)
              );

              if (end > syncs[syncIndex + 1] / 100) {
                end = syncs[syncIndex + 1] / 100;
              }
            }
          }

          if (start && end) {
            result.push({
              start,
              end,
              line: lineIndex + 1,
              word: wordIndex + 1,
              subword: subIndex + 1,
              text: subword,
            });
          }
          syncIndex++;
        }
      });
    });
  });

  return result;
}
