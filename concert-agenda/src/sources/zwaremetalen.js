import { extractTextBlocks } from "../lib/text-blocks.js";
import { monthNumber, toIsoDate } from "../lib/dutch-dates.js";

const SOURCE = "zwaremetalen";
const URL = "https://zwaremetalen.com/concertagenda";

// "September 2026", "Oktober 2026", ...
const MONTH_HEADER_RE = /^([A-Za-zëÉé]+)\s+(\d{4})$/;
// "7 sep.", "11 sep" (Dutch weekday not included on this site)
const DATE_RE = /^(\d{1,2})\s+([A-Za-zëÉé]{3,})\.?$/;

export function parseZwaremetalen(html) {
  const lines = extractTextBlocks(html);
  const startIdx = lines.findIndex((l) => l === "Concertagenda");
  const relevant = startIdx >= 0 ? lines.slice(startIdx + 1) : lines;

  const events = [];
  let year = null;
  let i = 0;
  while (i < relevant.length) {
    const line = relevant[i];

    const mHeader = MONTH_HEADER_RE.exec(line);
    if (mHeader && monthNumber(mHeader[1])) {
      year = Number(mHeader[2]);
      i++;
      continue;
    }

    const mDate = DATE_RE.exec(line);
    const month = mDate ? monthNumber(mDate[2]) : null;
    if (mDate && month && year) {
      const day = Number(mDate[1]);
      const title = relevant[i + 1] || "";
      let venue = null;
      let city = null;
      let genre = null;
      let j = i + 2;

      if (relevant[j] && relevant[j].startsWith("Locatie:")) {
        const loc = relevant[j].slice("Locatie:".length).trim();
        const idx = loc.lastIndexOf(",");
        if (idx >= 0) {
          venue = loc.slice(0, idx).trim();
          city = loc.slice(idx + 1).trim();
        } else {
          venue = loc;
        }
        j++;
      }
      if (relevant[j] && relevant[j].startsWith("Genre:")) {
        genre = relevant[j].slice("Genre:".length).trim();
        j++;
      }

      events.push({
        date: toIsoDate(year, month, day),
        title,
        venue,
        city,
        genre,
        source: SOURCE,
        sourceUrl: URL,
      });

      // Skip any trailing description/link lines (variable in number) until
      // the next date or month-header line is found.
      i = j;
      continue;
    }

    i++;
  }

  return events;
}

export async function scrapeZwaremetalen(fetchImpl = fetch) {
  const res = await fetchImpl(URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; concert-agenda-mcp/0.1)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return parseZwaremetalen(html);
}
