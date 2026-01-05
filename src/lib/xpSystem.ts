/**
 * Sistema de XP y niveles para Heptagramas
 */

export interface XPReward {
  baseXP: number;
  completionBonus: number;
  superHeptaBonus: number;
  total: number;
}

// Configuración de XP
const XP_CONFIG = {
  // XP base por palabra encontrada
  DAILY_WORD_XP: 10,
  CLASSIC_WORD_XP: 2.5, // 25% del diario
  
  // Bonus por completar porcentaje
  COMPLETION_BONUS: {
    25: 50,
    50: 100,
    75: 200,
    100: 500,
  },
  
  // Bonus por superhepta (palabra 7+ letras)
  SUPERHEPTA_XP: 25,
  
  // XP necesaria para subir de nivel (fórmula exponencial)
  BASE_XP_PER_LEVEL: 100,
  LEVEL_EXPONENT: 1.5,
};

/**
 * Calcula el nivel actual desde el XP total
 */
export function calculateLevel(xpTotal: number): number {
  if (xpTotal < 0) return 1;
  
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= xpTotal) {
    level++;
    xpNeeded += getXPForNextLevel(level - 1);
  }
  
  return level - 1;
}

/**
 * Calcula cuánta XP se necesita para llegar al siguiente nivel
 * desde un nivel dado
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.floor(
    XP_CONFIG.BASE_XP_PER_LEVEL * Math.pow(currentLevel, XP_CONFIG.LEVEL_EXPONENT)
  );
}

/**
 * Calcula el XP total acumulado necesario para alcanzar un nivel
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForNextLevel(i);
  }
  return total;
}

/**
 * Obtiene la información de progreso del nivel actual
 */
export function getLevelProgress(xpTotal: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(xpTotal);
  const xpForCurrentLevel = getTotalXPForLevel(currentLevel);
  const xpInCurrentLevel = xpTotal - xpForCurrentLevel;
  const xpNeededForNext = getXPForNextLevel(currentLevel);
  const progressPercentage = Math.floor((xpInCurrentLevel / xpNeededForNext) * 100);
  
  return {
    currentLevel,
    xpInCurrentLevel,
    xpNeededForNext,
    progressPercentage,
  };
}

/**
 * Calcula el porcentaje de completitud de un puzzle
 */
function calculateCompletionPercentage(foundWords: number, totalWords: number): number {
  if (totalWords === 0) return 0;
  return Math.floor((foundWords / totalWords) * 100);
}

/**
 * Calcula el bonus de XP por porcentaje completado
 */
function getCompletionBonus(completionPercentage: number): number {
  if (completionPercentage >= 100) return XP_CONFIG.COMPLETION_BONUS[100];
  if (completionPercentage >= 75) return XP_CONFIG.COMPLETION_BONUS[75];
  if (completionPercentage >= 50) return XP_CONFIG.COMPLETION_BONUS[50];
  if (completionPercentage >= 25) return XP_CONFIG.COMPLETION_BONUS[25];
  return 0;
}

/**
 * Calcula la recompensa de XP por una sesión de juego
 */
export function calculateSessionXP(
  foundWordsCount: number,
  totalWordsCount: number,
  superHeptaCount: number,
  mode: 'daily' | 'classic'
): XPReward {
  // XP base por palabras encontradas
  const wordXP = mode === 'daily' ? XP_CONFIG.DAILY_WORD_XP : XP_CONFIG.CLASSIC_WORD_XP;
  const baseXP = Math.floor(foundWordsCount * wordXP);
  
  // Bonus por completitud
  const completionPercentage = calculateCompletionPercentage(foundWordsCount, totalWordsCount);
  const completionBonus = getCompletionBonus(completionPercentage);
  
  // Bonus por superhéptas
  const superHeptaBonus = superHeptaCount * XP_CONFIG.SUPERHEPTA_XP;
  
  // Total
  const total = baseXP + completionBonus + superHeptaBonus;
  
  return {
    baseXP,
    completionBonus,
    superHeptaBonus,
    total,
  };
}

/**
 * Verifica si se subió de nivel tras ganar XP
 */
export function checkLevelUp(
  oldXP: number,
  newXP: number
): {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  levelsGained: number;
} {
  const oldLevel = calculateLevel(oldXP);
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel > oldLevel;
  const levelsGained = newLevel - oldLevel;
  
  return {
    leveledUp,
    oldLevel,
    newLevel,
    levelsGained,
  };
}

/**
 * Formatea la información de XP para mostrar al usuario
 */
export function formatXPReward(reward: XPReward): string {
  const parts: string[] = [];
  
  if (reward.baseXP > 0) {
    parts.push(`${reward.baseXP} XP base`);
  }
  
  if (reward.completionBonus > 0) {
    parts.push(`+${reward.completionBonus} bonus completitud`);
  }
  
  if (reward.superHeptaBonus > 0) {
    parts.push(`+${reward.superHeptaBonus} superhéptas`);
  }
  
  return parts.join(' | ');
}
