/**
 * Script para agregar solutionCount a cada puzzle
 * Calcula las soluciones de cada puzzle y actualiza puzzles.json
 */

const fs = require('fs');
const path = require('path');

// Cargar puzzles
const puzzlesPath = path.join(__dirname, '../src/data/puzzles.json');
const wordlistPath = path.join(__dirname, '../public/wordlist.txt');

const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf-8'));
const wordlist = fs.readFileSync(wordlistPath, 'utf-8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length > 0);

console.log(`📚 Wordlist cargada: ${wordlist.length} palabras`);
console.log(`🧩 Puzzles cargados: ${puzzles.length} puzzles`);

// Normalizar caracter (igual que en el código principal)
function normalizeChar(char) {
  const map = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u'
  };
  return map[char] || char;
}

// Normalizar palabra
function normalizeWord(word) {
  return word.toLowerCase().split('').map(normalizeChar).join('');
}

// Validar si una palabra es válida para un puzzle
function isValidWord(word, center, outer, minLen, allowEnye) {
  const normalized = normalizeWord(word);
  
  // Longitud mínima
  if (normalized.length < minLen) return false;
  
  // Debe contener la letra central
  if (!normalized.includes(normalizeChar(center))) return false;
  
  // Ñ solo si está permitida
  if (!allowEnye && normalized.includes('ñ')) return false;
  
  // Todas las letras deben estar en el conjunto
  const letters = [normalizeChar(center), ...outer.map(normalizeChar)];
  const uniqueLetters = [...new Set(letters)];
  
  for (const char of normalized) {
    if (!uniqueLetters.includes(char)) {
      return false;
    }
  }
  
  return true;
}

// Resolver puzzle
function solvePuzzle(puzzle) {
  const { center, outer, minLen = 3, allowEnye = false } = puzzle;
  const solutions = [];
  
  for (const word of wordlist) {
    if (isValidWord(word, center, outer, minLen, allowEnye)) {
      solutions.push(word);
    }
  }
  
  return solutions;
}

// Procesar cada puzzle
console.log('\n🔍 Calculando soluciones...\n');
let inRangeCount = 0;

const updatedPuzzles = puzzles.map((puzzle, index) => {
  const solutions = solvePuzzle(puzzle);
  const inRange = solutions.length >= 80 && solutions.length <= 150;
  
  if (inRange) inRangeCount++;
  
  console.log(
    `${index + 1}. ${puzzle.id}: ${solutions.length} soluciones ${inRange ? '✓ (en rango)' : ''}`
  );
  
  return {
    ...puzzle,
    solutionCount: solutions.length
  };
});

console.log(`\n📊 Puzzles en rango 80-150: ${inRangeCount}/${puzzles.length}`);

// Guardar
fs.writeFileSync(puzzlesPath, JSON.stringify(updatedPuzzles, null, 2), 'utf-8');
console.log('\n✅ puzzles.json actualizado con solutionCount');
