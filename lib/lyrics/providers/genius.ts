import { match } from "./utils";
import { LyricsProvider } from "..";
import got from "got";

class Provider implements LyricsProvider {
  name = "genius.com";

  supported() {
    return true;
  }

  async search(query: string) {
    const searchResp = await searchMulti(query, 3);
    const songID = songFromSearch(searchResp, query);
    if (!songID) return;
    const url = `https://api.genius.com/songs/${songID}?text_format=plain`;
    return url;
  }

  async lyrics(url: string) {
    const songResp = await got(url, { headers }).json<any>();
    const lyrics = cleanLyrics(lyricsFromSong(songResp));
    return lyrics;
  }
}

const headers = {
  Host: "api.genius.com",
  Accept: "*/*",
  "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  "Content-Type": "application/json",
  "X-Genius-iOS-Version": "6.10.0",
  "User-Agent": "Genius/1042 CFNetwork/1406.0.4 Darwin/22.4.0",
  "X-Genius-Logged-Out": "true",
};

async function searchMulti(query: string, perPage: number) {
  const url = `https://api.genius.com/search/multi?q=${encodeURIComponent(
    query
  )}&per_page=${perPage}`

  return got(url, {
    headers,
  }).json();
}

function songFromSearch(result: any, query: string) {
  const section = result.response.sections.find(
    (s: any) => s.type === "top_hit"
  );
  const hit = section.hits.find(
    (h: any) =>
      h.type === "song" && h.result && match(query, h.result["full_title"])
  );
  if (hit) return hit.result.id;
}

function lyricsFromSong(result: any) {
  return result.response.song.lyrics.plain;
}

function cleanLyrics(lyrics: string) {
  const lines: string[] = [];
  lyrics.split("\n").map((line) => {
    line = line.trim();
    if (line.startsWith("[") && line.endsWith("]")) return null;
    if (line.startsWith("{") && line.endsWith("}")) return null;
    lines.push(line);
    return null;
  });

  return lines.join("\n");
}

const provider = new Provider();
export default provider;
