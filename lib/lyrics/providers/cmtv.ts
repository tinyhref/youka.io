import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { GoogleLyricsProvider } from "..";

class Provider implements GoogleLyricsProvider {
  name = "cmtv.com.ar";
  site = "https://www.cmtv.com.ar/discos_letras/letra.php";
  site_re = /https:\/\/www\.cmtv\.com\.ar\/discos_letras\/letra\.php\?/;

  supported(lang: string) {
    return lang === "es";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string): Promise<string> {
    const html = await got(url, { encoding: "latin1" }).text();
    const $ = cheerio.load(html);
    const l = $("main p").text().trim();
    return l;
  }
}

const provider = new Provider();
google.register(provider);
export default provider;
