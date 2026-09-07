import { extractTextBlocks } from "../lib/text-blocks.js";
import { monthNumber, toIsoDate } from "../lib/dutch-dates.js";

const SOURCE = "metalagenda";

// "22 september 2026 dinsdag" (day, full Dutch month name, year, weekday)
const DATE_RE = /^(\d{1,2})\s+([a-zëé]+)\s+(\d{4})\s+\w+$/i;

export function parseMetalagendaVenue(html, venue) {
  const lines = extractTextBlocks(html);
  const events = [];
  let i = 0;
  while (i < lines.length) {
    const m = DATE_RE.exec(lines[i]);
    if (m) {
      const day = Number(m[1]);
      const month = monthNumber(m[2]);
      const year = Number(m[3]);
      let j = i + 1;

      let soldOut = false;
      if (lines[j] && lines[j].toLowerCase() === "uitverkocht") {
        soldOut = true;
        j++;
      }

      const title = lines[j] || "";
      j++;

      let bands = null;
      if (lines[j] && lines[j].toLowerCase().startsWith("bands:")) {
        bands = lines[j]
          .slice("bands:".length)
          .split("|")
          .map((s) => s.trim().replace(/\.$/, ""))
          .filter(Boolean);
        j++;
      }

      if (month) {
        events.push({
          date: toIsoDate(year, month, day),
          title,
          bands,
          venue: venue.name,
          city: venue.city,
          soldOut,
          source: SOURCE,
          sourceUrl: `https://www.metalagenda.nl/venues/${venue.slug}`,
        });
      }

      i = j;
      continue;
    }
    i++;
  }
  return events;
}

export async function scrapeMetalagendaVenue(venue, fetchImpl = fetch) {
  const url = `https://www.metalagenda.nl/venues/${venue.slug}`;
  const res = await fetchImpl(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; concert-agenda-mcp/0.1)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  const html = await res.text();
  return parseMetalagendaVenue(html, venue);
}
