import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "shironet.mako.co.il";
  site = "https://shironet.mako.co.il/";
  site_re = /https:\/\/shironet\.mako\.co\.il\/artist\?type=lyrics/;

  supported(lang: string) {
    return ["he", "iw"].includes(lang);
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    const l = $("span.artist_lyrics_text").text().trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
