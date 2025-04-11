import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "kkbox.com";
  site = "https://www.kkbox.com/";
  site_re = /https:\/\/www\.kkbox\.com\/.*\/song\/.*\.html/;

  supported(lang: string) {
    return lang === "zh";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const l = $(".lyrics")
      .text()
      .split("\n")
      .filter((line, i) => !(i < 5 && line.includes("：")))
      .join("\n")
      .trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
