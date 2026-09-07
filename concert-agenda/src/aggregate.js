function normalizeKey(title) {
  return (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Merges events from multiple sources for the same date+title into one
// record with a `sources` list. Sites phrase the same show differently
// ("Sigh + Devil Master" vs "Sigh en Devil Master"), so this is a
// best-effort merge, not a guarantee against duplicates — the `sources`
// field lets a caller judge that for themselves rather than trusting a
// silent dedupe.
export function aggregate(sourceLists) {
  const all = sourceLists.flat();
  const groups = new Map();

  for (const ev of all) {
    const key = `${ev.date}__${normalizeKey(ev.title)}`;
    if (!groups.has(key)) {
      groups.set(key, { ...ev, sources: [ev.source] });
    } else {
      const existing = groups.get(key);
      if (!existing.sources.includes(ev.source)) existing.sources.push(ev.source);
      existing.venue = existing.venue || ev.venue;
      existing.city = existing.city || ev.city;
      existing.genre = existing.genre || ev.genre;
      existing.bands = existing.bands || ev.bands;
    }
  }

  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}
