/**
 * Test del sistema de puntuación de Exóticos
 * Ejecutar en consola: testExoticsScoring()
 */

// Calcular puntos por palabra
function calculateWordPoints(word: string, isSuperHepta: boolean): number {
  const len = word.length;
  let points = 0;
  
  if (len === 3) points = 20;
  else if (len === 4) points = 25;
  else if (len === 5) points = 30;
  else if (len === 6) points = 35;
  else if (len === 7) points = 45;
  else if (len >= 8) points = 55 + (len - 8) * 5;
  
  if (isSuperHepta) {
    points += 60;
  }
  
  return points;
}

// Calcular bonus por hitos
function calculateMilestoneBonus(wordCount: number): number {
  const milestone = Math.floor(wordCount / 10);
  
  // CAP: después de 100 palabras, no dar más bonuses
  if (milestone > 10 || milestone === 0) {
    return 0;
  }
  
  const bonuses = [
    0,    // 0: no usado
    150,  // 1: 10 palabras
    225,  // 2: 20 palabras
    340,  // 3: 30 palabras
    510,  // 4: 40 palabras
    765,  // 5: 50 palabras
    1147, // 6: 60 palabras
    1720, // 7: 70 palabras
    2580, // 8: 80 palabras
    3870, // 9: 90 palabras
    5805, // 10: 100 palabras
  ];
  
  return bonuses[milestone] || 0;
}

function testExoticsScoring() {
  console.log('='.repeat(60));
  console.log('🧪 TEST: Sistema de Puntuación Exóticos');
  console.log('='.repeat(60));
  
  // Test 1: Puntos por longitud
  console.log('\n📏 TEST 1: Puntos por longitud de palabra');
  console.log('-'.repeat(60));
  const testWords = [
    { word: 'rio', len: 3, isSH: false, expected: 20 },
    { word: 'ropa', len: 4, isSH: false, expected: 25 },
    { word: 'rotas', len: 5, isSH: false, expected: 30 },
    { word: 'ropita', len: 6, isSH: false, expected: 35 },
    { word: 'rotador', len: 7, isSH: false, expected: 45 },
    { word: 'rotadora', len: 8, isSH: false, expected: 55 },
    { word: 'rotadoras', len: 9, isSH: false, expected: 60 },
    { word: 'rotadoraso', len: 10, isSH: false, expected: 65 },
  ];
  
  testWords.forEach(({ word, len, isSH, expected }) => {
    const points = calculateWordPoints(word, isSH);
    const status = points === expected ? '✅' : '❌';
    console.log(`${status} ${len} letras: ${points} P (esperado: ${expected})`);
  });
  
  // Test 2: SuperHepta bonus
  console.log('\n⭐ TEST 2: Bonus SuperHepta');
  console.log('-'.repeat(60));
  const testSH = [
    { word: 'rio', len: 3, expected: 80 }, // 20 + 60
    { word: 'rotador', len: 7, expected: 105 }, // 45 + 60
    { word: 'rotadora', len: 8, expected: 115 }, // 55 + 60
  ];
  
  testSH.forEach(({ word, len, expected }) => {
    const points = calculateWordPoints(word, true);
    const status = points === expected ? '✅' : '❌';
    console.log(`${status} ${len} letras + SH: ${points} P (esperado: ${expected})`);
  });
  
  // Test 3: Hitos cada 10 palabras
  console.log('\n🎯 TEST 3: Hitos cada 10 palabras');
  console.log('-'.repeat(60));
  const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  
  milestones.forEach(count => {
    const bonus = calculateMilestoneBonus(count);
    const milestone = Math.floor(count / 10);
    console.log(`${count} palabras (hito ${milestone}): +${bonus} P`);
  });
  
  // Test 4: Cálculo de XP
  console.log('\n💎 TEST 4: Conversión P → XP (40%)');
  console.log('-'.repeat(60));
  const testXP = [
    { points: 20, expected: 8 },
    { points: 25, expected: 10 },
    { points: 45, expected: 18 },
    { points: 105, expected: 42 }, // SuperHepta 7 letras
    { points: 150, expected: 60 }, // Hito 10 palabras
    { points: 765, expected: 306 }, // Hito 50 palabras
  ];
  
  testXP.forEach(({ points, expected }) => {
    const xp = Math.round(points * 0.4);
    const status = xp === expected ? '✅' : '❌';
    console.log(`${status} ${points} P → ${xp} XP (esperado: ${expected})`);
  });
  
  // Test 5: Simulación de run completa
  console.log('\n🎮 TEST 5: Simulación de Run Completa');
  console.log('-'.repeat(60));
  
  const simulationWords = [
    // 1-9: palabras normales
    { word: 'rio', len: 3, isSH: false },
    { word: 'ropa', len: 4, isSH: false },
    { word: 'rotas', len: 5, isSH: false },
    { word: 'ropita', len: 6, isSH: false },
    { word: 'rotador', len: 7, isSH: false },
    { word: 'rio2', len: 3, isSH: false },
    { word: 'ropa2', len: 4, isSH: false },
    { word: 'rotas2', len: 5, isSH: false },
    { word: 'ropita2', len: 6, isSH: false },
    // 10: hito!
    { word: 'rotadora', len: 8, isSH: false },
    // 11-19
    { word: 'word11', len: 6, isSH: false },
    { word: 'word12', len: 6, isSH: false },
    { word: 'word13', len: 6, isSH: false },
    { word: 'word14', len: 6, isSH: false },
    { word: 'word15', len: 6, isSH: false },
    { word: 'word16', len: 6, isSH: false },
    { word: 'word17', len: 6, isSH: false },
    { word: 'word18', len: 6, isSH: false },
    { word: 'word19', len: 6, isSH: false },
    // 20: hito!
    { word: 'superh', len: 7, isSH: true }, // SuperHepta!
  ];
  
  let totalPoints = 0;
  let totalXP = 0;
  
  simulationWords.forEach((wordData, idx) => {
    const wordNum = idx + 1;
    const points = calculateWordPoints(wordData.word, wordData.isSH);
    const milestoneBonus = calculateMilestoneBonus(wordNum);
    const totalThisWord = points + milestoneBonus;
    const xp = Math.round(totalThisWord * 0.4);
    
    totalPoints += totalThisWord;
    totalXP += xp;
    
    if (milestoneBonus > 0) {
      console.log(
        `🎉 Palabra #${wordNum}: ${wordData.word} (${wordData.len} letras)${wordData.isSH ? ' [SH]' : ''}`,
        `\n   → ${points} P + HITO ${milestoneBonus} P = ${totalThisWord} P (+${xp} XP)`,
        `\n   TOTAL ACUMULADO: ${totalPoints} P, ${totalXP} XP`
      );
    } else if (wordData.isSH) {
      console.log(
        `⭐ Palabra #${wordNum}: ${wordData.word} (${wordData.len} letras) [SuperHepta]`,
        `\n   → ${totalThisWord} P (+${xp} XP)`,
        `\n   TOTAL: ${totalPoints} P, ${totalXP} XP`
      );
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ TOTALES FINALES: ${totalPoints} P, ${totalXP} XP`);
  console.log('='.repeat(60));
  
  // Test 6: Verificar que después de 100 no hay más bonuses
  console.log('\n🚫 TEST 6: CAP después de 100 palabras');
  console.log('-'.repeat(60));
  [95, 100, 105, 110, 120, 150].forEach(count => {
    const bonus = calculateMilestoneBonus(count);
    console.log(`${count} palabras: bonus = ${bonus} P ${bonus === 0 && count > 100 ? '(CAP activo ✅)' : ''}`);
  });
  
  console.log('\n✅ Tests completados\n');
}

// Exportar función al window para uso en consola
if (typeof window !== 'undefined') {
  (window as any).testExoticsScoring = testExoticsScoring;
  console.log('📊 Test de puntuación disponible: testExoticsScoring()');
}

export { testExoticsScoring };
