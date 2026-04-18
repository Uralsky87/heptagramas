/// <reference types="node" />

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { loadDictionary } from '../lib/dictionary';
import { solvePuzzle } from '../lib/solvePuzzle';
import {
  DAILY_MAX_SOLUTIONS,
  DAILY_MIN_SOLUTIONS,
} from '../lib/puzzleRanges';
import type { Puzzle } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FORBIDDEN_STATIC_ANYWHERE = new Set(['k', 'w']);
const FORBIDDEN_STATIC_CENTER = new Set(['k', 'w', 'x', 'y', 'ñ', 'q']);

function makePuzzleSignature(center: string, outer: string[]): string {
  return `${center}|${[...outer].sort().join('')}`;
}

function generateCandidate(): { center: string; outer: string[] } {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzñ'
    .split('')
    .filter((letter) => !FORBIDDEN_STATIC_ANYWHERE.has(letter));
  const centerAlphabet = alphabet.filter((letter) => !FORBIDDEN_STATIC_CENTER.has(letter));
  const letters = new Set<string>();

  const center = centerAlphabet[Math.floor(Math.random() * centerAlphabet.length)];
  letters.add(center);

  while (letters.size < 7) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    letters.add(randomLetter);
  }

  const outer = Array.from(letters).filter((letter) => letter !== center);
  return { center, outer };
}

function syncPuzzleTitle(title: string, solutionCount: number): string {
  return title.replace(/: \d+ palabras$/, `: ${solutionCount} palabras`);
}

async function main() {
  console.log('=== REPARACION DE DAILY FUERA DE RANGO ===\n');

  const wordlistPath = path.join(__dirname, '../../public/wordlist_normalizado.txt');
  const wordlistContent = fs.readFileSync(wordlistPath, 'utf-8');
  const dictionary = await loadDictionary(wordlistContent);

  const puzzlesPath = path.join(__dirname, '../data/puzzles.json');
  const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf-8')) as Puzzle[];

  const outOfRangeDailyIds = new Set(
    puzzles
      .filter(
        (puzzle) =>
          puzzle.mode === 'daily' &&
          (puzzle.solutionCount === undefined ||
            puzzle.solutionCount < DAILY_MIN_SOLUTIONS ||
            puzzle.solutionCount > DAILY_MAX_SOLUTIONS)
      )
      .map((puzzle) => puzzle.id)
  );

  if (outOfRangeDailyIds.size === 0) {
    console.log('No hay daily fuera de rango. No se hicieron cambios.');
    return;
  }

  const existingSignatures = new Set(
    puzzles.map((puzzle) => makePuzzleSignature(puzzle.center, puzzle.outer))
  );
  const replacements = new Map<
    string,
    {
      center: string;
      outer: string[];
      solutionCount: number;
    }
  >();

  const targetIds = [...outOfRangeDailyIds];
  let attempts = 0;
  const maxAttempts = 50000;

  while (replacements.size < targetIds.length && attempts < maxAttempts) {
    attempts++;
    const candidate = generateCandidate();
    const signature = makePuzzleSignature(candidate.center, candidate.outer);

    if (existingSignatures.has(signature)) {
      continue;
    }

    const solutions = solvePuzzle(candidate.center, candidate.outer, dictionary, 3, true);
    const solutionCount = solutions.length;

    if (solutionCount < DAILY_MIN_SOLUTIONS || solutionCount > DAILY_MAX_SOLUTIONS) {
      continue;
    }

    const hasSuperHepta = solutions.some((word) => word.length >= 7);
    if (!hasSuperHepta) {
      continue;
    }

    const nextId = targetIds[replacements.size];
    replacements.set(nextId, {
      center: candidate.center,
      outer: candidate.outer,
      solutionCount,
    });
    existingSignatures.add(signature);
  }

  if (replacements.size !== targetIds.length) {
    throw new Error(
      `No se encontraron suficientes reemplazos validos. Encontrados: ${replacements.size}/${targetIds.length} tras ${attempts} intentos`
    );
  }

  const updatedPuzzles = puzzles.map((puzzle) => {
    const replacement = replacements.get(puzzle.id);
    if (!replacement) {
      return puzzle;
    }

    return {
      ...puzzle,
      center: replacement.center,
      outer: replacement.outer,
      solutionCount: replacement.solutionCount,
      title: syncPuzzleTitle(puzzle.title, replacement.solutionCount),
    };
  });

  fs.writeFileSync(puzzlesPath, JSON.stringify(updatedPuzzles, null, 2), 'utf-8');

  console.log(`Daily fuera de rango reparados: ${replacements.size}`);
  console.log(`Intentos usados: ${attempts}`);
  for (const [id, replacement] of replacements) {
    console.log(
      `- ${id}: center=${replacement.center} outer=[${replacement.outer.join(', ')}] soluciones=${replacement.solutionCount}`
    );
  }
  console.log(`Archivo actualizado: ${puzzlesPath}`);
}

main().catch((error) => {
  console.error('Error reparando daily fuera de rango:', error);
  process.exitCode = 1;
});
