/**
 * Script de prueba para verificar selección de puzzles diarios
 * Verifica que múltiples fechas siempre caen en el rango óptimo
 */

const fs = require('fs');
const path = require('path');

// Cargar puzzles con solutionCount
const puzzlesPath = path.join(__dirname, '../src/data/puzzles.json');
const puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf-8'));

console.log('🧩 Puzzles cargados:', puzzles.length);
console.log('📊 Puzzles en rango 80-150:', puzzles.filter(p => p.solutionCount >= 80 && p.solutionCount <= 150).length);
console.log('\n');

// Función hash (igual que en el código)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Función de selección de puzzle (igual que en dailySession.ts)
function getDailyPuzzleForDate(dateKey) {
  const hash = simpleHash(dateKey);
  
  // Puzzles en rango óptimo 80-150
  const optimalPuzzles = puzzles.filter(p => 
    p.solutionCount !== undefined && 
    p.solutionCount >= 80 && 
    p.solutionCount <= 150
  );
  
  if (optimalPuzzles.length > 0) {
    const index = hash % optimalPuzzles.length;
    return { puzzle: optimalPuzzles[index], range: 'optimal' };
  }
  
  // Fallback 70-160
  const fallbackPuzzles = puzzles.filter(p => 
    p.solutionCount !== undefined && 
    p.solutionCount >= 70 && 
    p.solutionCount <= 160
  );
  
  if (fallbackPuzzles.length > 0) {
    const index = hash % fallbackPuzzles.length;
    return { puzzle: fallbackPuzzles[index], range: 'fallback' };
  }
  
  // Último recurso
  const index = hash % puzzles.length;
  return { puzzle: puzzles[index], range: 'any' };
}

// Fechas de prueba
const testDates = [
  '2026-01-04', // Hoy
  '2026-01-05', // Mañana
  '2026-01-10',
  '2026-02-14', // San Valentín
  '2026-03-15',
  '2026-06-21', // Solsticio
  '2026-12-25', // Navidad
  '2025-12-31', // Año pasado
];

console.log('🎯 VERIFICACIÓN DE SELECCIÓN DE PUZZLES\n');
console.log('═'.repeat(80));

let optimalCount = 0;
let fallbackCount = 0;
let anyCount = 0;

testDates.forEach(dateKey => {
  const { puzzle, range } = getDailyPuzzleForDate(dateKey);
  const inTargetRange = puzzle.solutionCount >= 80 && puzzle.solutionCount <= 150;
  
  if (range === 'optimal') optimalCount++;
  else if (range === 'fallback') fallbackCount++;
  else anyCount++;
  
  const rangeEmoji = range === 'optimal' ? '✅' : range === 'fallback' ? '⚠️' : '❌';
  const targetEmoji = inTargetRange ? '🎯' : '📍';
  
  console.log(`${rangeEmoji} ${dateKey}`);
  console.log(`   ${targetEmoji} ${puzzle.id}: ${puzzle.solutionCount} soluciones`);
  console.log(`   Rango: ${range} ${inTargetRange ? '(80-150 ✓)' : ''}`);
  console.log();
});

console.log('═'.repeat(80));
console.log('\n📊 RESUMEN:');
console.log(`   ✅ Óptimas (80-150): ${optimalCount}/${testDates.length}`);
console.log(`   ⚠️  Fallback (70-160): ${fallbackCount}/${testDates.length}`);
console.log(`   ❌ Cualquiera: ${anyCount}/${testDates.length}`);

if (optimalCount === testDates.length) {
  console.log('\n🎉 ¡PERFECTO! Todas las fechas caen en rango óptimo 80-150');
} else if (optimalCount + fallbackCount === testDates.length) {
  console.log('\n✅ BIEN: Todas las fechas caen en rangos aceptables (70-160)');
} else {
  console.log('\n⚠️  ATENCIÓN: Algunas fechas fuera de rangos aceptables');
}

// Verificar distribución
console.log('\n📈 DISTRIBUCIÓN DE PUZZLES:');
const puzzleUsage = {};
for (let i = 0; i < 365; i++) {
  const date = new Date('2026-01-01');
  date.setDate(date.getDate() + i);
  const dateKey = date.toISOString().split('T')[0];
  const { puzzle } = getDailyPuzzleForDate(dateKey);
  puzzleUsage[puzzle.id] = (puzzleUsage[puzzle.id] || 0) + 1;
}

const usageCounts = Object.values(puzzleUsage);
const avgUsage = usageCounts.reduce((a, b) => a + b, 0) / usageCounts.length;
const maxUsage = Math.max(...usageCounts);
const minUsage = Math.min(...usageCounts);

console.log(`   Puzzles únicos usados en 365 días: ${Object.keys(puzzleUsage).length}`);
console.log(`   Uso promedio: ${avgUsage.toFixed(1)} días/puzzle`);
console.log(`   Uso máximo: ${maxUsage} días`);
console.log(`   Uso mínimo: ${minUsage} días`);
console.log(`   Desviación: ${((maxUsage - minUsage) / avgUsage * 100).toFixed(1)}%`);

console.log('\n✅ Pruebas completadas');
