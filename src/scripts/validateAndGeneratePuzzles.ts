/**
 * Script para validar puzzles existentes y generar nuevos puzzles válidos
 * 
 * Uso:
 * 1. Ejecutar: npm run generate-puzzles
 * 2. El script validará puzzles.json actual
 * 3. Generará nuevos puzzles que cumplan todos los criterios
 * 4. Guardará el resultado en puzzles.json
 */

import { loadDictionary } from '../lib/dictionary';
import { generateValidPuzzles, testPuzzle } from '../lib/puzzleGenerator';
import type { Puzzle } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('=== GENERADOR DE PUZZLES HEPTAGRAMAS ===\n');

  // 1. Cargar diccionario
  console.log('Cargando diccionario...');
  const wordlistPath = path.join(__dirname, '../../public/wordlist.txt');
  const wordlistContent = fs.readFileSync(wordlistPath, 'utf-8');
  
  // loadDictionary espera texto, no URL, así que lo llamamos directamente
  const dictionary = await loadDictionary(wordlistContent);
  console.log(`✓ Diccionario cargado: ${dictionary.words.length} palabras\n`);

  // 2. Validar puzzles existentes
  console.log('Validando puzzles existentes...');
  const puzzlesPath = path.join(__dirname, '../data/puzzles.json');
  let existingPuzzles: Puzzle[] = [];
  
  try {
    const puzzlesContent = fs.readFileSync(puzzlesPath, 'utf-8');
    existingPuzzles = JSON.parse(puzzlesContent);
    console.log(`✓ Cargados ${existingPuzzles.length} puzzles existentes\n`);
  } catch (error) {
    console.log('⚠ No se encontraron puzzles existentes, generando desde cero\n');
  }

  // 3. Generar nuevos puzzles válidos
  console.log('Generando puzzles válidos...');
  console.log('Criterios:');
  console.log('  - 6 letras únicas en outer');
  console.log('  - center NO en outer');
  console.log('  - 100-300 soluciones');
  console.log('  - Al menos 1 SuperHepta\n');

  const newPuzzles = await generateValidPuzzles(
    dictionary,
    22,  // cantidad de puzzles
    100, // mín soluciones
    300  // máx soluciones
  );

  console.log(`\n✓ Generados ${newPuzzles.length} puzzles válidos\n`);

  // 4. Test de algunos puzzles
  console.log('=== TESTS DE EJEMPLO ===');
  if (newPuzzles.length > 0) {
    testPuzzle(newPuzzles[0], dictionary, 10);
  }
  if (newPuzzles.length > 1) {
    testPuzzle(newPuzzles[1], dictionary, 10);
  }

  // 5. Guardar nuevos puzzles
  const outputPath = path.join(__dirname, '../data/puzzles.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(newPuzzles, null, 2),
    'utf-8'
  );

  console.log(`\n✓ Puzzles guardados en: ${outputPath}`);
  console.log(`\nPROCESO COMPLETADO ✓`);
}

main().catch(console.error);
