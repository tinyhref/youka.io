import iconv from "iconv-lite";
import chardet from "chardet";
import got from "got";
import * as report from "@/lib/report";

export async function autocomplete(
  query: string,
  signal?: AbortSignal
): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&callback=suggestionsCallback&q=${encodeURIComponent(
      query
    )}`;
    const buffer = await got(url, {
      signal,
    }).buffer();
    const encoding = await chardet.detect(buffer);
    const data = await iconv.decode(buffer, encoding || "utf-8");
    const suggestions = extractSuggestions(data);
    return suggestions;
  } catch (e) {
    report.warn("Failed to fetch autocomplete", { query, error: e as any });
    return [];
  }
}

function extractSuggestions(s: string) {
  // Remove callback function wrapper
  const jsonStr = s.replace(/^[^(]*\(/, "").replace(/\)[^)]*$/, "");

  // Parse JSON data
  const jsonData = JSON.parse(jsonStr);

  // Extract suggestions
  const suggestions = jsonData[1].map((item: any) => item[0]);

  return suggestions;
}
