import { scrapeZwaremetalen } from "./sources/zwaremetalen.js";
import { scrapeMetalfan } from "./sources/metalfan.js";
import { scrapeMetalagendaVenue } from "./sources/metalagenda.js";
import { VENUES } from "./venues.js";
import { aggregate } from "./aggregate.js";

export async function scrapeAll() {
  const errors = [];

  const [zm, mf] = await Promise.all([
    scrapeZwaremetalen().catch((e) => {
      errors.push(`zwaremetalen: ${e.message}`);
      return [];
    }),
    scrapeMetalfan().catch((e) => {
      errors.push(`metalfan: ${e.message}`);
      return [];
    }),
  ]);

  const venueResults = await Promise.all(
    VENUES.map((v) =>
      scrapeMetalagendaVenue(v).catch((e) => {
        errors.push(`metalagenda/${v.slug}: ${e.message}`);
        return [];
      })
    )
  );

  const events = aggregate([zm, mf, ...venueResults]);
  return { events, errors };
}
