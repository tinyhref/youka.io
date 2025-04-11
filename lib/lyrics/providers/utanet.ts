import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "uta-net.com";
  site = "https://www.uta-net.com/song/";
  site_re = /https:\/\/www\.uta-net\.com\/song\/\d+/;

  supported(lang: string) {
    return lang === "ja";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    const html = await got(url).text();
    const $ = cheerio.load(html);
    $("#kashi_area").find("br").replaceWith("\n");
    const l = $("#kashi_area").text().trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
