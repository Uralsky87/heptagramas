/// <reference types="node" />

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Puzzle } from '../types';
import { loadDictionary } from '../lib/dictionary';
import { solvePuzzle } from '../lib/solvePuzzle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function syncPuzzleTitle(title: string, solutionCount: number): string {
  return title.replace(/: \d+ palabras$/, `: ${solutionCount} palabras`);
}

async function main() {
  console.log('=== SINCRONIZACION DE solutionCount ===\n');

  const wordlistPath = path.join(__dirname, '../../public/wordlist_normalizado.txt');
  const wordlistContent = fs.readFileSync(wordlistPath, 'utf-8');
  const dictionary = await loadDictionary(wordlistContent);

  const puzzlesPath = path.join(__dirname, '../data/puzzles.json');
  const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf-8')) as Puzzle[];

  let updatedCount = 0;

  const updatedPuzzles = puzzles.map((puzzle) => {
    const computedCount = solvePuzzle(
      puzzle.center,
      puzzle.outer,
      dictionary,
      puzzle.minLen || 3,
      puzzle.allowEnye ?? true
    ).length;

    const nextTitle = syncPuzzleTitle(puzzle.title, computedCount);
    const changed = puzzle.solutionCount !== computedCount || nextTitle !== puzzle.title;

    if (changed) {
      updatedCount++;
      return {
        ...puzzle,
        solutionCount: computedCount,
        title: nextTitle,
      };
    }

    return puzzle;
  });

  fs.writeFileSync(puzzlesPath, JSON.stringify(updatedPuzzles, null, 2), 'utf-8');

  console.log(`Puzzles revisados: ${puzzles.length}`);
  console.log(`Puzzles actualizados: ${updatedCount}`);
  console.log(`Archivo actualizado: ${puzzlesPath}`);
}

main().catch((error) => {
  console.error('Error sincronizando solutionCount:', error);
  process.exitCode = 1;
});
