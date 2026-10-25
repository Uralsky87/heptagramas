import fs from 'node:fs';
import { loadDictionary } from '../src/lib/dictionary';
import { solvePuzzle } from '../src/lib/solvePuzzle';
import { normalizeString } from '../src/lib/normalizeChar';
import type { Puzzle } from '../src/types';

// Read-only design data: the proposal never imports the game's storage modules.
const puzzles: Puzzle[] = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8'));
const daily = puzzles.filter((puzzle) => puzzle.mode === 'daily' && puzzle.solutionCount! >= 120 && puzzle.solutionCount! <= 350);
const dictionary = await loadDictionary(fs.readFileSync('public/wordlist_normalizado.txt', 'utf8'));
const common = ['ala', 'aire', 'arte', 'aroma', 'asilo', 'calor', 'casa', 'cielo', 'isla', 'lata', 'loro', 'luna', 'marea', 'mar', 'mesa', 'miel', 'ola', 'oro', 'pala', 'palo', 'pan', 'par', 'pera', 'piel', 'rama', 'rata', 'rima', 'rosa', 'sala', 'sal', 'sol', 'tela', 'tierra', 'tren', 'tres', 'vela'];
const familiarWordCount = (item: Puzzle) => common.filter((word) => word.includes(item.center) && [...word].every((letter) => [item.center, ...item.outer].includes(letter))).length;
// A representative existing puzzle makes the visual study readable; this is not
// a replacement for the scheduled daily puzzle in the actual application.
const puzzle = [...daily].sort((a, b) => familiarWordCount(b) - familiarWordCount(a))[0];
const solutions = solvePuzzle(puzzle.center, puzzle.outer, dictionary, puzzle.minLen ?? 3, puzzle.allowEnye ?? true);
const samples = [...new Set([...common.filter((word) => solutions.includes(word)), ...solutions.filter((word) => word.length >= 4 && word.length <= 6)])].slice(0, 9);
const definitions: Record<string, string> = {};
for (const line of fs.readFileSync('public/definiciones_normalizado.txt', 'utf8').split('\n')) {
  const match = line.match(/^(\S+?)(?:\^[\d])?\s+(.+)$/);
  if (!match) continue;
  const word = normalizeString(match[1], true);
  if (samples.includes(word)) definitions[word] = match[2].trim();
}
const classic = puzzles.filter((item) => item.mode === 'classic');
const makeSections = (pool: Puzzle[]) => Array.from({ length: Math.ceil(pool.length / 20) }, (_, index) => ({
  number: index + 1, start: index * 20 + 1, end: Math.min((index + 1) * 20, pool.length),
  examplePuzzle: pool[index * 20],
}));
const report = { date: '2026-10-25', selection: 'Representative existing puzzle, not the scheduled daily puzzle', puzzle, total: solutions.length, solutions, examples: samples, definitions,
  classicCount: classic.length, sections: makeSections(classic), longSections: makeSections(classic.filter((item) => (item.solutionCount ?? 0) >= 150)),
};
fs.mkdirSync('design/base', { recursive: true });
fs.writeFileSync('design/base/preview-data.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ puzzle: puzzle.id, center: puzzle.center, outer: puzzle.outer, total: solutions.length, examples: samples, classicCount: classic.length, sections: report.sections.length }, null, 2));
