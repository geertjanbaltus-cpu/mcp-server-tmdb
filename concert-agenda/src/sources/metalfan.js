import { extractTextBlocks } from "../lib/text-blocks.js";
import { monthNumber, toIsoDate } from "../lib/dutch-dates.js";

const SOURCE = "metalfan";
const URL = "https://www.metalfan.nl/agenda.php";

// "September:", "Oktober:", ...
const SECTION_RE = /^([A-Za-zëé]+):$/;
// "8 sep.", "11 & 12 sep."
const DATE_RE = /^(\d{1,2})(?:\s*&\s*\d{1,2})?\s+([a-zëé]+)\.?$/i;

export function parseMetalfan(html) {
  const lines = extractTextBlocks(html);

  let baseYear = new Date().getFullYear();
  for (const l of lines) {
    const m = /Concertagenda\s+(\d{4})/.exec(l);
    if (m) {
      baseYear = Number(m[1]);
      break;
    }
  }

  const markerIdx = lines.findIndex((l) => l.toLowerCase().includes("ontbrekend concert"));
  const relevant = markerIdx >= 0 ? lines.slice(markerIdx + 1) : lines;

  const events = [];
  let year = baseYear;
  let lastMonthNum = null;
  let i = 0;
  while (i < relevant.length) {
    const line = relevant[i];

    const mSection = SECTION_RE.exec(line);
    const sectionMonth = mSection ? monthNumber(mSection[1]) : null;
    if (mSection && sectionMonth) {
      // The page has no per-entry year; bump it when the month sequence
      // wraps around (e.g. December section followed by a January one).
      if (lastMonthNum !== null && sectionMonth < lastMonthNum) year++;
      lastMonthNum = sectionMonth;
      i++;
      continue;
    }

    const mDate = DATE_RE.exec(line);
    const month = mDate ? monthNumber(mDate[2]) : null;
    if (mDate && month) {
      const day = Number(mDate[1]);
      const title = relevant[i + 1] || "";
      const locLine = relevant[i + 2] || "";
      let venue = null;
      let city = null;
      const idx = locLine.lastIndexOf(",");
      if (idx >= 0) {
        venue = locLine.slice(0, idx).trim();
        city = locLine.slice(idx + 1).trim();
      } else if (locLine) {
        venue = locLine;
      }

      events.push({
        date: toIsoDate(year, month, day),
        title,
        venue,
        city,
        source: SOURCE,
        sourceUrl: URL,
      });

      i += 3;
      continue;
    }

    i++;
  }

  return events;
}

export async function scrapeMetalfan(fetchImpl = fetch) {
  const res = await fetchImpl(URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; concert-agenda-mcp/0.1)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return parseMetalfan(html);
}
