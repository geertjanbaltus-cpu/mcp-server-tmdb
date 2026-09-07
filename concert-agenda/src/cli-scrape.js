#!/usr/bin/env node
// Standalone test runner: `npm run scrape:test` — scrapes everything once
// and dumps the result as JSON, without going through MCP. Use this first
// to check `errors` (bad venue slugs, sites that changed markup) before
// wiring the server into Claude.
import { scrapeAll } from "./scrape-all.js";

const { events, errors } = await scrapeAll();
console.log(JSON.stringify({ count: events.length, events, errors }, null, 2));
if (errors.length) {
  console.error(`\n${errors.length} source(s) failed — see "errors" above.`);
}
