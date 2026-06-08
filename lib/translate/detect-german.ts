/** Lightweight German detection for job descriptions (no extra dependencies). */
export function isLikelyGerman(text: string): boolean {
  const sample = text.slice(0, 4000).toLowerCase();
  const words = sample.match(/\b[\p{L}]{2,}\b/gu) ?? [];
  if (words.length < 6) return false;

  const markers =
    /\b(und|oder|der|die|das|den|dem|des|ein|eine|einer|einem|mit|für|von|zu|auf|ist|sind|wir|sie|ihre|ihrem|ihren|aufgaben|anforderungen|erfahrung|unternehmen|stellenangebot|bewerbung|vollzeit|teilzeit|kenntnisse|verantwortlich|entwicklung|zusammenarbeit|bereich|abteilung|gehalt|standort|homeoffice|hybrid)\b/giu;
  const markerHits = sample.match(markers)?.length ?? 0;
  const umlauts = (sample.match(/[äöüß]/g) ?? []).length;

  if (umlauts >= 2) return true;
  if (markerHits >= 4) return true;
  return markerHits / words.length >= 0.06;
}
