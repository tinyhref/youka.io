import got from "got";
import querystring from "querystring";
import { tokenGenerator } from "./token";
import { isSupported, getISOCode } from "./languages";

interface GoogleError {
  name: string;
  statusCode: number;
  statusMessage: string;
}
/**
 * @function translate
 * @param {String} text The text to be translated.
 * @param {Object} options The options object for the translator.
 * @returns {Object} The result containing the translation.
 */
export async function translate(text: string, options?: any) {
  try {
    if (typeof options !== "object") options = {};
    text = String(text);

    // Check if a lanugage is in supported; if not, throw an error object.
    let error;
    [options.from, options.to].forEach((lang) => {
      if (lang && !isSupported(lang)) {
        error = new Error();
        // @ts-ignore
        error.code = 400;
        // @ts-ignore
        error.message = `The language '${lang}' is not supported.`;
      }
    });
    if (error) throw error;

    // If options object doesn't have 'from' language, set it to 'auto'.
    if (!options.hasOwnProperty("from")) options.from = "auto";
    // If options object doesn't have 'to' language, set it to 'en'.
    if (!options.hasOwnProperty("to")) options.to = "en";
    // If options object has a 'raw' property evaluating to true, set it to true.
    options.raw = Boolean(options.raw);

    // Get ISO 639-1 codes for the languages.
    options.from = getISOCode(options.from);
    options.to = getISOCode(options.to);

    // Generate Google Translate token for the text to be translated.
    let token = await tokenGenerator(text);

    // URL & query string required by Google Translate.
    let baseUrl = "https://translate.google.com/translate_a/single";
    let data = {
      client: "gtx",
      sl: options.from,
      tl: options.to,
      hl: options.to,
      dt: ["at", "bd", "ex", "ld", "md", "qca", "rw", "rm", "ss", "t"],
      ie: "UTF-8",
      oe: "UTF-8",
      otf: 1,
      ssel: 0,
      tsel: 0,
      kc: 7,
      q: text,
      // @ts-ignore
      [token.name]: token.value,
    };

    // Append query string to the request URL.
    let url = `${baseUrl}?${querystring.stringify(data)}`;

    let requestOptions;
    // If request URL is greater than 2048 characters, use POST method.
    if (url.length > 2048) {
      // @ts-ignore
      delete data.q;
      requestOptions = {
        url: `${baseUrl}?${querystring.stringify(data)}`,
        method: "POST",
        form: {
          q: text,
        },
      };
    } else {
      requestOptions = url;
    }

    // Request translation from Google Translate.
    // @ts-ignore
    const response = await got(requestOptions).text();

    let result = {
      text: "",
      from: {
        language: {
          didYouMean: false,
          iso: "",
        },
        text: {
          autoCorrected: false,
          value: "",
          didYouMean: false,
        },
      },
      raw: "",
    };

    // If user requested a raw output, add the raw response to the result
    if (options.raw) {
      result.raw = response;
    }

    // Parse string body to JSON and add it to result object.
    let body = JSON.parse(response);
    body[0].forEach((obj: any) => {
      if (obj[0]) {
        result.text += obj[0];
      }
    });

    if (body[2] === body[8][0][0]) {
      result.from.language.iso = body[2];
    } else {
      result.from.language.didYouMean = true;
      result.from.language.iso = body[8][0][0];
    }

    if (body[7] && body[7][0]) {
      let str = body[7][0];

      str = str.replace(/<b><i>/g, "[");
      str = str.replace(/<\/i><\/b>/g, "]");

      result.from.text.value = str;

      if (body[7][5] === true) {
        result.from.text.autoCorrected = true;
      } else {
        result.from.text.didYouMean = true;
      }
    }

    return result;
  } catch (e) {
    const e2 = e as GoogleError;
    if (e2.name === "HTTPError") {
      let error = new Error();
      error.name = e2.name;
      // @ts-ignore
      error.statusCode = e2.statusCode;
      // @ts-ignore
      error.statusMessage = e2.statusMessage;
      throw error;
    }
    throw e;
  }
}

export async function language(text: string) {
  try {
    const res = await translate(text);
    let lang = res.from.language.iso.split("-")[0];
    if (lang === "iw") {
      return "he";
    }
    if (lang && lang.length !== 2) return;

    return lang;
  } catch (e) {}
}
