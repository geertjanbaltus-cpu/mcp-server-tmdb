# concert-agenda-mcp

Klein MCP-servertje dat drie Nederlandse/Belgische metal-concertagenda's
scrapet (zwaremetalen.com, metalfan.nl, metalagenda.nl per venue) en als
tool aan Claude aanbiedt. Los van `mcp-server-tmdb` — die blijft puur TMDB —
maar bewust met dezelfde architectuurgedachte: betrouwbare data-ophaling in
code, curatie (welk concert past bij jouw profiel) blijft bij Claude, via
het bestaande curator-protocol (§78 in de hoofdinstructie).

## Waarom dit bestaat

Claude kan deze sites niet direct fetchen vanuit een gehoste sessie
(claude.ai en Claude Code Remote draaien achter een netwerk-policy die
willekeurige sites blokkeert — geverifieerd tijdens de bouw van dit
servertje). Vanaf een gewone machine (jouw laptop, of eender welke server
met normale internettoegang) is dat geen probleem: alle drie de bronnen
gaven gewoon HTTP 200 toen getest via een GitHub Actions runner. Dit
servertje draait dus **op jouw eigen machine** (of een server die je zelf
beheert), niet binnen de Claude-sandbox zelf.

## Installeren

```bash
cd concert-agenda
npm install
```

## Eerst los testen (aanbevolen)

```bash
npm run scrape:test
```

Dumpt alle gevonden concerten als JSON naar stdout, plus een `errors`-array.
Check die array vóór je het aan Claude koppelt: een lege array betekent dat
alle drie bronnen + alle geconfigureerde venues succesvol zijn opgehaald.
Een niet-lege array noemt per bron/venue wat faalde (bijv. een verkeerd
geraden metalagenda.nl-slug — zie `src/venues.js` voor hoe je die corrigeert).

## Koppelen aan Claude

Voeg toe aan je MCP-config (Claude Desktop: `claude_desktop_config.json`;
Claude Code: `.mcp.json` of via `claude mcp add`):

```json
{
  "mcpServers": {
    "concert-agenda": {
      "command": "node",
      "args": ["/absoluut/pad/naar/concert-agenda/src/server.js"]
    }
  }
}
```

## Tools

- **list_concerts** — `from`, `to` (ISO-datums), `city`, `textFilter`
  (band/titel), `forceRefresh`. Resultaten cachen 6 uur; `forceRefresh: true`
  forceert een verse scrape (duurt een paar seconden extra, ~30 fetches).
- **list_venues** — de geconfigureerde metalagenda.nl-venuelijst met geraden
  slugs, handig om te debuggen als een venue 0 concerten teruggeeft.

## Bekende beperkingen (eerlijk, niet weggepoetst)

- **Genre wordt niet betrouwbaar meegeleverd.** Alleen zwaremetalen.com
  heeft een Genre-veld, en dat is inconsistent ingevuld. Black-metal-filtering
  moet dus op bandnaam/kennis gebeuren (door Claude, via het curator-profiel),
  niet op dit veld.
- **Venue-slugs voor metalagenda.nl zijn grotendeels ongeverifieerd.** Alleen
  `de-helling` en `neushoorn` zijn tegen de live site bevestigd; de overige
  ~26 zijn een best-effort gok volgens hetzelfde patroon. `scrape:test` legt
  foute slugs bloot.
- **De venuelijst telt 28, niet 30.** Het bronprotocol (§78I) claimt "30
  venues" maar somt er zelf maar 28 op — een inconsistentie in het
  originele document, hier niet stilzwijgend rechtgetrokken.
- **metalfan.nl heeft geen jaartal per concert**, alleen een jaartal in de
  paginatitel plus maandkoppen zonder jaar. Jaarovergang (bijv. december →
  januari) wordt gedetecteerd via het terugspringen van het maandnummer;
  test dat expliciet als je de agenda rond een jaarwisseling gebruikt.
- **Geen retry/backoff.** Eén mislukte fetch = die bron ontbreekt dit run;
  probeer het gewoon opnieuw (`forceRefresh: true` of `scrape:test`).
- **Cross-source deduplicatie is best-effort.** Dezelfde show kan op elke
  site net anders geformuleerd staan ("Sigh + Devil Master" vs "Sigh en
  Devil Master"), dus kan als twee aparte regels verschijnen. Het
  `sources`-veld per concert laat zien welke bronnen het bevestigen.
