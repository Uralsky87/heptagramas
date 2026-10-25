import fs from 'node:fs';
import path from 'node:path';
import { loadDictionary } from '../src/lib/dictionary';
import { solvePuzzle } from '../src/lib/solvePuzzle';
import { normalizeString } from '../src/lib/normalizeChar';

// Exploratory content only: no changes to the event catalog or saved games.
const families = [
  ['calabaza', 'calabazas'], ['bruja', 'brujas', 'brujo', 'brujos'], ['escoba', 'escobas'],
  ['fantasma', 'fantasmas'], ['miedo', 'miedos'], ['susto', 'sustos'], ['tumba', 'tumbas'],
  ['noche', 'noches'], ['hechizo', 'hechizos'], ['calavera', 'calaveras'], ['cadáver', 'cadáveres'],
  ['vela', 'velas'], ['murciélago', 'murciélagos'], ['araña', 'arañas'], ['telaraña', 'telarañas'],
  ['monstruo', 'monstruos'], ['vampiro', 'vampiros'], ['zombi', 'zombis'], ['calabozo', 'calabozos'],
  ['muerte', 'muerto', 'muerta', 'muertos', 'muertas'], ['temor', 'temores'], ['terror', 'terrores'],
  ['oscuridad'], ['sombra', 'sombras'], ['hueso', 'huesos'], ['ritual', 'rituales'],
  ['gato', 'gatos'], ['luna', 'lunas'], ['máscara', 'máscaras'], ['ataúd', 'ataúdes'],
  ['momia', 'momias'], ['sangre'], ['diablo', 'diablos'], ['cuervo', 'cuervos'], ['sapo', 'sapos'],
];
const alphabet = 'abcdefghijklmnñopqrstuvwxyz';
function mask(word: string) {
  let value = 0;
  for (const letter of word) value |= 1 << alphabet.indexOf(letter);
  return value;
}
function letters(value: number) { return [...alphabet].filter((_, i) => value & (1 << i)); }
function size(value: number) { let count = 0; while (value) { value &= value - 1; count++; } return count; }
const words = families.flatMap((family, group) => family.map((display) => {
  const word = normalizeString(display, true);
  return { display, word, group, mask: mask(word) };
}));
const dictionary = await loadDictionary(fs.readFileSync('public/wordlist_normalizado.txt', 'utf8'));
const dictionarySet = new Set(dictionary.words);
const missing = words.filter((item) => !dictionarySet.has(item.word)).map((item) => item.display);
const distinctMasks = [...new Set(words.filter((item) => dictionarySet.has(item.word) && size(item.mask) <= 8).map((item) => item.mask))];
const unions = new Set<number>();
for (const a of distinctMasks) for (const b of distinctMasks) for (const c of distinctMasks) {
  const value = a | b | c;
  if (size(value) <= 8) unions.add(value);
}
const candidates = new Set<number>();
for (const value of unions) {
  if (size(value) === 8) candidates.add(value);
  else if (size(value) === 7) {
    for (const letter of 'aeiourstnlcbmdfzjhv') candidates.add(value | mask(letter));
  }
}
type Draft = { center: string; outer: string[]; extraLetter: string; base: typeof words; expanded: typeof words; rank: number };
const drafts: Draft[] = [];
const forbiddenCenters = new Set(['k', 'w', 'x', 'y', 'ñ', 'q']);
for (const value of candidates) {
  if (size(value) !== 8) continue;
  const available = letters(value);
  for (const center of available.filter((letter) => !forbiddenCenters.has(letter))) {
    const expanded = words.filter((item) => dictionarySet.has(item.word) && (item.mask & ~value) === 0 && item.word.includes(center));
    const groups = new Set(expanded.map((item) => item.group));
    if (groups.size < 3) continue;
    for (const extraLetter of available.filter((letter) => letter !== center)) {
      const baseMask = value & ~mask(extraLetter);
      const base = expanded.filter((item) => (item.mask & ~baseMask) === 0);
      const baseGroups = new Set(base.map((item) => item.group));
      if (baseGroups.size < 2 || base.length === expanded.length) continue;
      drafts.push({ center, outer: available.filter((letter) => letter !== center && letter !== extraLetter), extraLetter, base, expanded,
        rank: groups.size * 10 + baseGroups.size * 7 + Math.min(expanded.length, 12) });
    }
  }
}
drafts.sort((a, b) => b.rank - a.rank);
const shortlist = new Set(drafts.slice(0, 100));
for (const anchor of ['calabaza', 'bruja', 'fantasma', 'miedo', 'noche', 'calavera']) {
  drafts.filter((item) => item.expanded.some((word) => word.word === anchor)).slice(0, 70).forEach((item) => shortlist.add(item));
}
const evaluated = [...shortlist].map((draft) => {
  const baseCount = solvePuzzle(draft.center, draft.outer, dictionary, 3, true).length;
  const expandedCount = solvePuzzle(draft.center, draft.outer, dictionary, 3, true, draft.extraLetter).length;
  const penalty = Math.max(0, baseCount - 500) / 25 + Math.max(0, 100 - baseCount) / 5 + Math.max(0, expandedCount - 1100) / 60;
  return {
    center: draft.center, outer: draft.outer, extraLetter: draft.extraLetter,
    baseCount, expandedCount,
    baseThematic: draft.base.map((word) => word.display),
    unlockedThematic: draft.expanded.filter((word) => !draft.base.includes(word)).map((word) => word.display),
    familyCount: new Set(draft.expanded.map((word) => word.group)).size,
    score: Math.round((draft.rank - penalty) * 100) / 100,
  };
}).sort((a, b) => b.score - a.score);
const proposals = ['calabaza', 'bruja', 'fantasma', 'miedo', 'noche', 'calavera'].map((anchor) => ({
  anchor, candidate: evaluated.find((item) => [...item.baseThematic, ...item.unlockedThematic].some((word) => normalizeString(word, true) === anchor)),
}));
const report = { dictionaryWords: dictionary.words.length, candidates: candidates.size, evaluated: evaluated.length, missingFromDictionary: missing, proposals, top: evaluated.slice(0, 8) };
const outputDirectory = path.join('design', 'halloween');
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, 'letter-research.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, top: report.top.slice(0, 3) }, null, 2));
