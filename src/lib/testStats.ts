/**
 * Test manual de las funciones de estadísticas
 * Para ejecutar: importar en consola del navegador o ejecutar con Node/Deno
 */

import { 
  getStartLetterCounts, 
  getLen7PlusCount,
  getStartLetterCountsFound,
  getLen7PlusCountFound
} from './stats';

// Test 1: Conteos totales (ya existían)
const solutions = ['amigo', 'amor', 'barco', 'bola', 'casa', 'comida', 'caminante'];
const letters = ['a', 'b', 'c', 'm', 'o', 'r', 'i'];

const totalCounts = getStartLetterCounts(solutions, letters);
console.log('Total por letra:', totalCounts);
// Esperado: { a: 2, b: 2, c: 3, m: 0, o: 0, r: 0, i: 0 }

const total7Plus = getLen7PlusCount(solutions);
console.log('Total 7+:', total7Plus);
// Esperado: 2 (comida, caminante)

// Test 2: Conteos de encontradas (nuevas funciones)
const foundWords = ['amigo', 'casa', 'comida']; // Usuario encontró 3 palabras
const solutionsSet = new Set(solutions);

const foundCounts = getStartLetterCountsFound(foundWords, solutionsSet, letters);
console.log('Encontradas por letra:', foundCounts);
// Esperado: { a: 1, b: 0, c: 2, m: 0, o: 0, r: 0, i: 0 }

const found7Plus = getLen7PlusCountFound(foundWords, solutionsSet);
console.log('Encontradas 7+:', found7Plus);
// Esperado: 1 (comida)

// Test 3: Formato de estadísticas (como se mostrará en UI)
console.log('\n=== Formato UI ===');
letters.forEach(letter => {
  const found = foundCounts[letter] || 0;
  const total = totalCounts[letter] || 0;
  console.log(`${letter.toUpperCase()}: ${found}/${total}`);
});
console.log(`7+: ${found7Plus}/${total7Plus}`);

export {};
