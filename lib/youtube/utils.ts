const openBrackets = ["(", "（", "[", "【", "{", "《"];
const closeBrackets = [")", "]", "】", "}", "》"];
const re = /(?:^|\/|v=)([A-Za-z0-9_-]{11})/;

interface Duration {
  hours?: number;
  minutes?: number;
  seconds?: number;
}

function removeBrackets(str: string) {
  let counter = 0;
  for (var i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    const open = openBrackets.includes(char);
    const close = closeBrackets.includes(char);
    if (open) {
      counter++;
    } else if (close) {
      counter--;
    }
    if (open || close || counter) {
      str = str.substr(0, i) + " " + str.substr(i + 1);
    }
  }
  str = str.replace(/\s+/g, " ");
  return str;
}

export function cleanTitle(r: string) {
  r = removeBrackets(r);
  r = r.replace(
    /(official visualizer|video oficial|clip officiel|official video|official music video|music video|video oficial| mv(\s|$))/gi,
    ""
  );
  r = r.replace(/(\s|-|·|\|)+$/g, "");
  r = r.trim();
  return r;
}

export function imageUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function parseDuration(s: string): Duration | undefined {
  const re = /(\d+):(\d{2})(:(\d{2}))?/;
  if (!s.match(re)) return;
  const parts = s.split(":");
  let hours, minutes, seconds;
  if (parts.length === 3) {
    hours = parseInt(parts[0]);
    minutes = parseInt(parts[1]);
    seconds = parseInt(parts[2]);
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0]);
    seconds = parseInt(parts[1]);
  } else {
    seconds = parseInt(parts[0]);
  }
  return {
    hours,
    minutes,
    seconds,
  };
}

export function parseDurationSeconds(s: string): number {
  if (!s) return 0;
  const duration = parseDuration(s);
  if (!duration) return 0;
  let d = 0;
  d += duration.hours ? duration.hours * 60 * 60 : 0;
  d += duration.minutes ? duration.minutes * 60 : 0;
  d += duration.seconds ? duration.seconds : 0;
  return d;
}

export function parseYoutubeId(s: string) {
  return s.match(re)?.[1];
}

export function parseYoutubeUrl(s: string) {
  return s.startsWith("http") ? parseYoutubeId(s) : undefined;
}
