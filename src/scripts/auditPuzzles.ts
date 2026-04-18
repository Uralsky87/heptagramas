/// <reference types="node" />

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Puzzle } from '../types';
import { loadDictionary } from '../lib/dictionary';
import { solvePuzzle } from '../lib/solvePuzzle';
import {
  DAILY_FALLBACK_MIN_SOLUTIONS,
  DAILY_MAX_SOLUTIONS,
  DAILY_MIN_SOLUTIONS,
} from '../lib/puzzleRanges';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type CountMismatch = {
  id: string;
  mode: Puzzle['mode'];
  stored: number | null;
  computed: number;
  delta: number;
};

type StructuralIssue = {
  id: string;
  issues: string[];
};

type StaticLetterRuleIssue = {
  id: string;
  mode: Puzzle['mode'];
  center: string;
  outer: string[];
  issues: string[];
};

const FORBIDDEN_ANYWHERE_STATIC = new Set(['k', 'w']);
const FORBIDDEN_CENTER_STATIC = new Set(['k', 'w', 'x', 'y', 'ñ', 'q']);

function getDayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  return Math.floor(utc / 86400000);
}

function getDailyPool(puzzles: Puzzle[]): Puzzle[] {
  const dailyPuzzles = puzzles.filter((puzzle) => puzzle.mode === 'daily');
  return dailyPuzzles.length > 0 ? dailyPuzzles : puzzles;
}

function getDailyPuzzleForDateLikeApp(dateKey: string, puzzles: Puzzle[]): Puzzle {
  const dailyPool = getDailyPool(puzzles);
  const dayIndex = getDayIndex(dateKey);

  const optimalPuzzles = dailyPool.filter((puzzle) => {
    const count = puzzle.solutionCount;
    return count !== undefined && count >= DAILY_MIN_SOLUTIONS && count <= DAILY_MAX_SOLUTIONS;
  });

  if (optimalPuzzles.length > 0) {
    return optimalPuzzles[dayIndex % optimalPuzzles.length];
  }

  const fallbackPuzzles = dailyPool.filter((puzzle) => {
    const count = puzzle.solutionCount;
    return count !== undefined && count >= DAILY_FALLBACK_MIN_SOLUTIONS;
  });

  if (fallbackPuzzles.length > 0) {
    return fallbackPuzzles[dayIndex % fallbackPuzzles.length];
  }

  return dailyPool[dayIndex % dailyPool.length];
}

function getFutureDateKey(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  console.log('=== AUDITORIA DE PUZZLES ===\n');

  const wordlistPath = path.join(__dirname, '../../public/wordlist_normalizado.txt');
  const wordlistContent = fs.readFileSync(wordlistPath, 'utf-8');
  const dictionary = await loadDictionary(wordlistContent);

  const puzzlesPath = path.join(__dirname, '../data/puzzles.json');
  const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf-8')) as Puzzle[];

  const dailyPuzzles = puzzles.filter((puzzle) => puzzle.mode === 'daily');
  const classicPuzzles = puzzles.filter((puzzle) => puzzle.mode === 'classic');

  const structuralIssues: StructuralIssue[] = [];
  const countMismatches: CountMismatch[] = [];
  const staticLetterRuleIssues: StaticLetterRuleIssue[] = [];

  for (const puzzle of puzzles) {
    const issues: string[] = [];
    const letterRuleIssues: string[] = [];
    const outerSet = new Set(puzzle.outer);

    if (puzzle.outer.length !== 6) {
      issues.push(`outer tiene ${puzzle.outer.length} letras`);
    }
    if (outerSet.size !== puzzle.outer.length) {
      issues.push('outer contiene letras duplicadas');
    }
    if (outerSet.has(puzzle.center)) {
      issues.push('center aparece en outer');
    }
    if (!puzzle.id) {
      issues.push('id vacio');
    }
    if (!puzzle.title) {
      issues.push('title vacio');
    }

    if (FORBIDDEN_CENTER_STATIC.has(puzzle.center)) {
      letterRuleIssues.push(`center prohibido: ${puzzle.center}`);
    }

    const forbiddenOuterLetters = puzzle.outer.filter((letter) => FORBIDDEN_ANYWHERE_STATIC.has(letter));
    if (forbiddenOuterLetters.length > 0) {
      letterRuleIssues.push(
        `outer contiene letras prohibidas: ${Array.from(new Set(forbiddenOuterLetters)).join(', ')}`
      );
    }

    if (issues.length > 0) {
      structuralIssues.push({ id: puzzle.id, issues });
    }

    if (letterRuleIssues.length > 0) {
      staticLetterRuleIssues.push({
        id: puzzle.id,
        mode: puzzle.mode,
        center: puzzle.center,
        outer: puzzle.outer,
        issues: letterRuleIssues,
      });
    }

    const computedCount = solvePuzzle(
      puzzle.center,
      puzzle.outer,
      dictionary,
      puzzle.minLen || 3,
      puzzle.allowEnye ?? true
    ).length;

    const storedCount = puzzle.solutionCount ?? null;
    if (storedCount !== computedCount) {
      countMismatches.push({
        id: puzzle.id,
        mode: puzzle.mode,
        stored: storedCount,
        computed: computedCount,
        delta: computedCount - (storedCount ?? 0),
      });
    }
  }

  const dailyOutOfRange = dailyPuzzles.filter((puzzle) => {
    const count = puzzle.solutionCount;
    return count === undefined || count < DAILY_MIN_SOLUTIONS || count > DAILY_MAX_SOLUTIONS;
  });

  let firstClassicLeak:
    | {
        daysFromToday: number;
        dateKey: string;
        id: string;
        mode: Puzzle['mode'];
        solutionCount?: number;
      }
    | null = null;

  for (let offset = 0; offset < 2000; offset++) {
    const dateKey = getFutureDateKey(offset);
    const selected = getDailyPuzzleForDateLikeApp(dateKey, puzzles);
    if (selected.mode !== 'daily') {
      firstClassicLeak = {
        daysFromToday: offset,
        dateKey,
        id: selected.id,
        mode: selected.mode,
        solutionCount: selected.solutionCount,
      };
      break;
    }
  }

  const mismatchSample = [...countMismatches]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 15);
  const staticLetterIssueSample = staticLetterRuleIssues.slice(0, 15);
  const staticLetterIssueSummary = {
    total: staticLetterRuleIssues.length,
    daily: staticLetterRuleIssues.filter((entry) => entry.mode === 'daily').length,
    classic: staticLetterRuleIssues.filter((entry) => entry.mode === 'classic').length,
    forbiddenCenter: staticLetterRuleIssues.filter((entry) =>
      entry.issues.some((issue) => issue.startsWith('center prohibido'))
    ).length,
    forbiddenOuter: staticLetterRuleIssues.filter((entry) =>
      entry.issues.some((issue) => issue.startsWith('outer contiene letras prohibidas'))
    ).length,
  };

  console.log('Resumen general');
  console.log(`- Total puzzles: ${puzzles.length}`);
  console.log(`- Daily: ${dailyPuzzles.length}`);
  console.log(`- Classic: ${classicPuzzles.length}`);
  console.log(`- Incidencias estructurales: ${structuralIssues.length}`);
  console.log(`- Incumplimientos de reglas de letras staticas: ${staticLetterIssueSummary.total}`);
  console.log(`- solutionCount desalineados: ${countMismatches.length}`);
  console.log(`- Daily fuera de rango ${DAILY_MIN_SOLUTIONS}-${DAILY_MAX_SOLUTIONS}: ${dailyOutOfRange.length}`);
  console.log('');

  if (firstClassicLeak) {
    console.log('Riesgo de mezcla daily/classic con la logica actual');
    console.log(
      `- Primer caso detectado: ${firstClassicLeak.dateKey} (+${firstClassicLeak.daysFromToday} dias)`
    );
    console.log(
      `- Puzzle seleccionado: ${firstClassicLeak.id} (${firstClassicLeak.mode}, ${firstClassicLeak.solutionCount ?? '?'} soluciones)`
    );
    console.log('');
  } else {
    console.log('No se detectaron mezclas daily/classic en los proximos 2000 dias.\n');
  }

  if (structuralIssues.length > 0) {
    console.log('Incidencias estructurales');
    structuralIssues.slice(0, 15).forEach((entry) => {
      console.log(`- ${entry.id}: ${entry.issues.join(' | ')}`);
    });
    if (structuralIssues.length > 15) {
      console.log(`- ... y ${structuralIssues.length - 15} mas`);
    }
    console.log('');
  }

  if (mismatchSample.length > 0) {
    console.log('Muestra de desajustes solutionCount');
    mismatchSample.forEach((entry) => {
      console.log(
        `- ${entry.id} [${entry.mode}]: guardado=${entry.stored ?? 'null'} calculado=${entry.computed} delta=${entry.delta}`
      );
    });
    console.log('');
  }

  if (staticLetterIssueSample.length > 0) {
    console.log('Incumplimientos de reglas de letras para daily/classic');
    console.log(
      `- Total: ${staticLetterIssueSummary.total} ` +
      `(daily: ${staticLetterIssueSummary.daily}, classic: ${staticLetterIssueSummary.classic})`
    );
    console.log(
      `- Con center prohibido: ${staticLetterIssueSummary.forbiddenCenter} ` +
      `| con k/w en outer: ${staticLetterIssueSummary.forbiddenOuter}`
    );
    staticLetterIssueSample.forEach((entry) => {
      console.log(
        `- ${entry.id} [${entry.mode}] center=${entry.center} outer=[${entry.outer.join(', ')}] -> ${entry.issues.join(' | ')}`
      );
    });
    if (staticLetterRuleIssues.length > 15) {
      console.log(`- ... y ${staticLetterRuleIssues.length - 15} mas`);
    }
    console.log('');
  }

  if (dailyOutOfRange.length > 0) {
    console.log('Daily fuera del rango esperado');
    dailyOutOfRange.slice(0, 15).forEach((puzzle) => {
      console.log(`- ${puzzle.id}: ${puzzle.solutionCount ?? 'sin-conteo'} soluciones`);
    });
    if (dailyOutOfRange.length > 15) {
      console.log(`- ... y ${dailyOutOfRange.length - 15} mas`);
    }
    console.log('');
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: puzzles.length,
      daily: dailyPuzzles.length,
      classic: classicPuzzles.length,
      structuralIssues: structuralIssues.length,
      staticLetterRuleIssues: staticLetterRuleIssues.length,
      solutionCountMismatches: countMismatches.length,
      dailyOutOfRange: dailyOutOfRange.length,
    },
    firstClassicLeak,
    staticLetterIssueSummary,
    structuralIssues,
    staticLetterRuleIssues,
    countMismatches,
    dailyOutOfRange: dailyOutOfRange.map((puzzle) => ({
      id: puzzle.id,
      solutionCount: puzzle.solutionCount ?? null,
    })),
  };

  const outputPath = path.join(__dirname, '../../temp-puzzle-audit.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`Informe completo guardado en: ${outputPath}`);
}

main().catch((error) => {
  console.error('Error durante la auditoria de puzzles:', error);
  process.exitCode = 1;
});
