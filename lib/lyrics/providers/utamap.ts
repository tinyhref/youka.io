import iconv from "iconv-lite";
import cheerio from "cheerio";
import got from "./got";
import * as google from "./google_site";
import { LyricsProvider } from "..";

class Provider implements LyricsProvider {
  name = "utamap.com";
  site = "http://www.utamap.com/showkasi.php";
  site_re = /https?:\/\/www\.utamap\.com\/showkasi\.php\?surl=.*/;

  supported(lang: string) {
    return lang === "ja";
  }

  async search(query: string, lang: string) {
    return google.search(this.name, query, lang);
  }

  async lyrics(url: string) {
    url = url.replace("https://", "http://");
    const html = await got(url).buffer();
    const ehtml = iconv.decode(html, "EUC-JP");
    const $ = cheerio.load(ehtml);
    $(".kasi_honbun").find("br").replaceWith("\n");
    const l = $(".kasi_honbun").text().trim();
    return l;
  }
}

const provider = new Provider();
export default provider;
