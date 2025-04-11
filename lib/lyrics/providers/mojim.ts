import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import he from "he";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "mojim.com";
  site = "https://mojim.com";
  site_re = /https:\/\/mojim\.com\/.*.htm/;

  supported(lang: string) {
    return ["ja", "ko", "zh"].includes(lang);
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const l = $(".fsZx3")
      .html()
      ?.split("<br>")
      .map((l) => l.trim())
      .filter(
        (l, i) =>
          !l.startsWith("[") &&
          !l.startsWith("<") &&
          !l.toLowerCase().includes("mojim.com") &&
          !(i < 3 && !l.toLowerCase().includes(":"))
      )
      .join("\n")
      .trim();
    if (l) return he.unescape(l);
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
