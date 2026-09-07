function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Venue list taken from the curator protocol's §78I (metalagenda.nl venue
// scan). The doc's own tier breakdown only names 28 venues despite the
// "30 venues" total it claims — that's an inconsistency in the source
// document, not something invented here.
//
// Slugs are derived with the same rule metalagenda.nl itself appears to use
// (confirmed against two real pages: "De Helling" -> de-helling,
// "dB's Studio" -> db-s-studio). The other 26 are untested guesses — run
// `npm run scrape:test` and check `fetchErrors` in the output; a wrong slug
// shows up as an HTTP 404 for that venue and can be fixed by editing `name`
// below to whatever metalagenda.nl actually uses, or by adding an explicit
// `slug` override on that entry.
const RAW_VENUES = [
  // Tier 1
  { name: "Neushoorn", city: "Leeuwarden" },
  { name: "Iduna", city: "Drachten" },
  { name: "Vera", city: "Groningen" },
  { name: "Metropool", city: "Hengelo" },
  { name: "dB's Studio", city: "Utrecht" },
  { name: "Tivoli Vredenburg", city: "Utrecht" },
  { name: "De Helling", city: "Utrecht" },
  { name: "Effenaar", city: "Eindhoven" },
  { name: "Doornroosje", city: "Nijmegen" },
  { name: "013", city: "Tilburg" },
  { name: "Hall of Fame", city: "Tilburg" },
  { name: "Little Devil", city: "Tilburg" },
  { name: "Sound Dog", city: "Breda" },
  // Tier 2A
  { name: "Baroeg", city: "Rotterdam" },
  { name: "Bibelot", city: "Dordrecht" },
  { name: "Musicon", city: "Den Haag" },
  // Tier 2B
  { name: "Melkweg", city: "Amsterdam" },
  { name: "Paradiso", city: "Amsterdam" },
  { name: "ACU", city: "Amsterdam" },
  { name: "OCCII", city: "Amsterdam" },
  { name: "Rock Club The Cave", city: "Amsterdam" },
  { name: "Nachbar", city: "Amsterdam" },
  { name: "Patronaat", city: "Haarlem" },
  // Tier 2C
  { name: "Podium Victorie", city: "Alkmaar" },
  // Tier 2D
  { name: "De Pit", city: "Terneuzen" },
  { name: "Hedon", city: "Zwolle" },
  { name: "Bosuil", city: "Weert" },
  { name: "Muziekcafe Helmond", city: "Helmond" },
];

export const VENUES = RAW_VENUES.map((v) => ({ ...v, slug: v.slug || slugify(v.name) }));
