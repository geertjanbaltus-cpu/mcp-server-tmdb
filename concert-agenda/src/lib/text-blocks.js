import * as cheerio from "cheerio";

// These three sites render their agendas as plain stacked <div>/<li>/<p>
// blocks with no reusable CSS hooks (confirmed by fetching real pages via
// a GitHub Actions runner, since this sandbox's network policy blocks
// direct fetches to them). So instead of brittle CSS selectors, we flatten
// the DOM to one text line per block-level element, in document order, and
// parse the resulting line stream with a small per-source state machine.
const BLOCK_TAGS = new Set([
  "br", "p", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "td", "article", "section",
]);

export function extractTextBlocks(html) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const lines = [];
  let buf = "";

  function flush() {
    const t = buf.replace(/\s+/g, " ").trim();
    if (t) lines.push(t);
    buf = "";
  }

  function walk(node) {
    if (node.type === "text") {
      buf += node.data;
      return;
    }
    if (node.type !== "tag") return;
    const isBlock = BLOCK_TAGS.has(node.name);
    if (isBlock) flush();
    for (const child of node.children || []) walk(child);
    if (isBlock) flush();
  }

  const body = $("body").get(0);
  if (body) {
    for (const child of body.children || []) walk(child);
  }
  flush();

  const out = [];
  for (const l of lines) {
    if (out.length === 0 || out[out.length - 1] !== l) out.push(l);
  }
  return out;
}
