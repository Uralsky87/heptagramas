import { createNewRun, loadExoticsRun, clearExoticsRun, hasActiveRun, saveExoticsRun } from '../lib/exoticsStorage';
import type { ExoticPuzzle } from '../types';

/**
 * Script de prueba para el sistema de storage de Exóticos
 * Ejecuta en consola: testExoticsStorage()
 */
export function testExoticsStorage() {
  console.log('=== TEST EXOTICS STORAGE ===\n');
  
  // 1. Verificar si hay run activa
  console.log('1. Verificar run activa:');
  console.log('   hasActiveRun():', hasActiveRun());
  
  // 2. Crear nueva run
  console.log('\n2. Crear nueva run:');
  const puzzle: ExoticPuzzle = {
    center: 'a',
    outer: ['e', 'r', 's', 't', 'o', 'n'],
    allowExtraLetters: true,
  };
  
  const newRun = createNewRun(puzzle);
  console.log('   runId:', newRun.runId);
  console.log('   startedAt:', newRun.startedAt);
  console.log('   puzzle:', newRun.puzzle);
  console.log('   extraLetters:', newRun.extraLetters);
  console.log('   foundWords:', newRun.foundWords);
  
  // 3. Verificar que se guardó
  console.log('\n3. Cargar run guardada:');
  const loaded = loadExoticsRun();
  console.log('   Cargada correctamente:', loaded !== null);
  console.log('   runId coincide:', loaded?.runId === newRun.runId);
  
  // 4. Simular progreso
  console.log('\n4. Simular progreso:');
  if (loaded) {
    loaded.extraLetters = ['i', 'l'];
    loaded.foundWords = ['ares', 'arte', 'ratones', 'salir'];
    loaded.scorePoints = 150;
    loaded.xpEarned = 25;
    loaded.solutionsTotal = 250;
    
    saveExoticsRun(loaded);
    
    console.log('   Progreso guardado');
  }
  
  // 5. Verificar persistencia
  console.log('\n5. Verificar persistencia:');
  const reloaded = loadExoticsRun();
  if (reloaded) {
    console.log('   extraLetters:', reloaded.extraLetters);
    console.log('   foundWords:', reloaded.foundWords.length, 'palabras');
    console.log('   scorePoints:', reloaded.scorePoints);
    console.log('   xpEarned:', reloaded.xpEarned);
  }
  
  // 6. Limpiar
  console.log('\n6. Limpiar run:');
  clearExoticsRun();
  console.log('   hasActiveRun():', hasActiveRun());
  
  console.log('\n=== TEST COMPLETADO ===');
}

// Exponer en window para usar en consola
if (typeof window !== 'undefined') {
  (window as any).testExoticsStorage = testExoticsStorage;
  console.log('💡 Ejecuta testExoticsStorage() en la consola para probar el sistema de storage');
}
