#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { scrapeAll } from "./scrape-all.js";
import { VENUES } from "./venues.js";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let cache = { at: 0, events: [], errors: [] };

async function getEvents(forceRefresh = false) {
  const stale = Date.now() - cache.at > CACHE_TTL_MS;
  if (forceRefresh || stale || cache.events.length === 0) {
    const { events, errors } = await scrapeAll();
    cache = { at: Date.now(), events, errors };
  }
  return cache;
}

const server = new McpServer({ name: "concert-agenda", version: "0.1.0" });

server.registerTool(
  "list_concerts",
  {
    title: "List metal concerts (NL/BE)",
    description:
      "Concerts aggregated from zwaremetalen.com, metalfan.nl and metalagenda.nl (scanned per venue). " +
      "Data is genre-agnostic on purpose: metalagenda.nl and metalfan.nl don't label genre at all, and " +
      "zwaremetalen.com's Genre field is inconsistent, so filter/curate by band name and your own knowledge " +
      "rather than trusting the genre field as ground truth. Always check `fetchErrors` in the response: a " +
      "non-empty list means some sources or venues failed this run, so results are a lower bound, not proof " +
      "of completeness.",
    inputSchema: {
      from: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive lower bound"),
      to: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive upper bound"),
      city: z.string().optional().describe("Case-insensitive substring match on city"),
      textFilter: z.string().optional().describe("Case-insensitive substring match on title or band name"),
      forceRefresh: z.boolean().optional().describe("Bypass the 6h cache and re-scrape now (slower)"),
    },
  },
  async ({ from, to, city, textFilter, forceRefresh }) => {
    const { events, errors } = await getEvents(Boolean(forceRefresh));
    let filtered = events;
    if (from) filtered = filtered.filter((e) => e.date >= from);
    if (to) filtered = filtered.filter((e) => e.date <= to);
    if (city) {
      const q = city.toLowerCase();
      filtered = filtered.filter((e) => (e.city || "").toLowerCase().includes(q));
    }
    if (textFilter) {
      const q = textFilter.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.bands || []).some((b) => b.toLowerCase().includes(q))
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ count: filtered.length, events: filtered, fetchErrors: errors }, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "list_venues",
  {
    title: "List configured metalagenda.nl venues",
    description:
      "The venue list this server scans on metalagenda.nl, with the slug it guessed for each. " +
      "Only two slugs (de-helling, neushoorn) are verified against the live site; the rest are best-effort. " +
      "A venue returning 0 events in list_concerts while you know it has shows is worth checking here.",
    inputSchema: {},
  },
  async () => ({
    content: [{ type: "text", text: JSON.stringify(VENUES, null, 2) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
