import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "azlyrics.com";
  site = "https://www.azlyrics.com/lyrics/";
  site_re = /https:\/\/www\.azlyrics\.com\/lyrics\/.*\/.*.html/;

  supported(lang: string): boolean {
    return lang === "en";
  }

  async search(query: string, lang: string): Promise<string | undefined> {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string): Promise<string | undefined> {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const l = $(".col-xs-12.col-lg-8.text-center > div > br")
      .parent()
      .text()
      .split("\n")
      .filter((l: string) => !l.startsWith("[") && !l.startsWith("Writer(s):"))
      .join("\n")
      .split("if  ( /")[0]
      .trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
