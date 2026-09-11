const COUNTRY_ALIASES: Record<string, string> = {
  // Ghana
  ghana: "GH",
  gh: "GH",

  // United States
  us: "US",
  usa: "US",
  "united states": "US",
  "united states of america (the)": "US",
  "u.s.": "US",
  "u.s.a.": "US",
};

export function formatCountry(raw: string | null | undefined): string {
  if (!raw) return "unknown";
  return COUNTRY_ALIASES[raw.trim().toLowerCase()] ?? raw.trim().toUpperCase();
}
