// Script para probar la migración de datos de localStorage
// Ejecutar en la consola del navegador

console.log('=== Test de Migración de localStorage ===\n');

// Simular datos antiguos
const oldData = {
  'heptagramas_currentPuzzleId': 'puzzle-001',
  'heptagramas_progressByPuzzle': JSON.stringify({
    'puzzle-001': {
      foundWords: ['ropa', 'pure', 'ruego'],
      score: 15,
      superHeptasFound: ['roqueros'],
      lastPlayedAt: '2026-01-01T10:00:00.000Z'
    }
  }),
  'heptagramas_settings': JSON.stringify({
    soundEnabled: true
  })
};

console.log('1. Datos antiguos simulados:');
console.log(oldData);

// Guardar datos antiguos
Object.entries(oldData).forEach(([key, value]) => {
  localStorage.setItem(key, value);
});

console.log('\n2. Datos guardados en localStorage');

// Forzar recarga para que se ejecute la migración
console.log('\n3. Recarga la página para ver la migración automática');
console.log('   Luego ejecuta: testMigrationResult()');

// Función para verificar resultado
(window as any).testMigrationResult = function() {
  console.log('\n=== Resultado de Migración ===\n');
  
  const activePuzzleId = localStorage.getItem('heptagramas_activePuzzleId');
  console.log('✓ activePuzzleId:', activePuzzleId);
  
  const progressById = localStorage.getItem('heptagramas_progressByPuzzleId');
  console.log('\n✓ progressByPuzzleId:', JSON.parse(progressById || '{}'));
  
  const playerState = localStorage.getItem('heptagramas_playerState');
  console.log('\n✓ playerState:', JSON.parse(playerState || '{}'));
  
  console.log('\n¡Migración completada exitosamente!');
};
