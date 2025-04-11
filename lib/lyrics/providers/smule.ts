import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "smule.com";
  site = "https://www.smule.com/song/";
  site_re = /https:\/\/www\.smule\.com\/song\/.*-lyrics\/.*\/arrangement/;

  supported() {
    return true;
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const match = url.match(
      /https:\/\/www\.smule\.com\/song\/.*-lyrics\/(\d+_\d+)\/arrangement/
    );
    if (!match || match.length < 2) return;
    const key = match[1];
    const urlj = `https://www.smule.com/api/arrangement?key=${key}`;
    const json = await got(urlj).json<any>();

    const arr: string[] = [];
    json.lyrics_list.forEach((l: any) => {
      l = l.trim();
      if (!l || l === "...") return;
      arr.push(l);
    });

    const lyrics = arr.join("\n").trim();
    return lyrics;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
