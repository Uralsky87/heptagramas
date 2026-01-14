/**
 * Sistema de temas cosméticos desbloqueables
 */

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  unlockLevel: number;
  description: string;
  colors: {
    // Colores del tablero
    centerGradientStart: string;
    centerGradientEnd: string;
    outerGradientStart: string;
    outerGradientEnd: string;
    // Colores de botones
    primaryBtnStart: string;
    primaryBtnEnd: string;
    // Colores de nivel
    levelBgStart: string;
    levelBgEnd: string;
    levelBarStart: string;
    levelBarEnd: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'default',
    displayName: 'Clásico',
    unlockLevel: 1,
    description: 'El tema original de Heptagramas',
    colors: {
      centerGradientStart: '#ed4b82',
      centerGradientEnd: '#c9356a',
      outerGradientStart: '#667eea',
      outerGradientEnd: '#764ba2',
      primaryBtnStart: '#667eea',
      primaryBtnEnd: '#764ba2',
      levelBgStart: '#667eea',
      levelBgEnd: '#764ba2',
      levelBarStart: '#4facfe',
      levelBarEnd: '#00f2fe',
    },
  },
  {
    id: 'sunset',
    name: 'sunset',
    displayName: 'Atardecer',
    unlockLevel: 3,
    description: 'Tonos cálidos del atardecer',
    colors: {
      centerGradientStart: '#f37335',
      centerGradientEnd: '#fdc830',
      outerGradientStart: '#ff6b6b',
      outerGradientEnd: '#ee5a6f',
      primaryBtnStart: '#ff6b6b',
      primaryBtnEnd: '#ee5a6f',
      levelBgStart: '#f37335',
      levelBgEnd: '#fdc830',
      levelBarStart: '#ffbe0b',
      levelBarEnd: '#fb5607',
    },
  },
  {
    id: 'ocean',
    name: 'ocean',
    displayName: 'Océano',
    unlockLevel: 5,
    description: 'Profundidades del mar',
    colors: {
      centerGradientStart: '#1e3a8a',
      centerGradientEnd: '#0ea5e9',
      outerGradientStart: '#06b6d4',
      outerGradientEnd: '#0891b2',
      primaryBtnStart: '#0ea5e9',
      primaryBtnEnd: '#06b6d4',
      levelBgStart: '#0369a1',
      levelBgEnd: '#0891b2',
      levelBarStart: '#22d3ee',
      levelBarEnd: '#06b6d4',
    },
  },
  {
    id: 'forest',
    name: 'forest',
    displayName: 'Bosque',
    unlockLevel: 8,
    description: 'Verde natural del bosque',
    colors: {
      centerGradientStart: '#059669',
      centerGradientEnd: '#10b981',
      outerGradientStart: '#16a34a',
      outerGradientEnd: '#22c55e',
      primaryBtnStart: '#059669',
      primaryBtnEnd: '#10b981',
      levelBgStart: '#047857',
      levelBgEnd: '#059669',
      levelBarStart: '#34d399',
      levelBarEnd: '#10b981',
    },
  },
  {
    id: 'lavender',
    name: 'lavender',
    displayName: 'Lavanda',
    unlockLevel: 10,
    description: 'Suaves tonos de lavanda',
    colors: {
      centerGradientStart: '#a855f7',
      centerGradientEnd: '#c084fc',
      outerGradientStart: '#8b5cf6',
      outerGradientEnd: '#a78bfa',
      primaryBtnStart: '#8b5cf6',
      primaryBtnEnd: '#a78bfa',
      levelBgStart: '#7c3aed',
      levelBgEnd: '#8b5cf6',
      levelBarStart: '#c084fc',
      levelBarEnd: '#a855f7',
    },
  },
  {
    id: 'sunrise',
    name: 'sunrise',
    displayName: 'Amanecer',
    unlockLevel: 12,
    description: 'Colores frescos del amanecer',
    colors: {
      centerGradientStart: '#f472b6',
      centerGradientEnd: '#fb923c',
      outerGradientStart: '#fbbf24',
      outerGradientEnd: '#fcd34d',
      primaryBtnStart: '#f472b6',
      primaryBtnEnd: '#fb923c',
      levelBgStart: '#ec4899',
      levelBgEnd: '#f97316',
      levelBarStart: '#fde047',
      levelBarEnd: '#fbbf24',
    },
  },
];

/**
 * Obtiene un tema por ID
 */
export function getThemeById(themeId: string): Theme {
  return THEMES.find(t => t.id === themeId) || THEMES[0];
}

/**
 * Obtiene todos los temas desbloqueados para un nivel
 */
export function getUnlockedThemes(level: number): Theme[] {
  return THEMES.filter(theme => theme.unlockLevel <= level);
}

/**
 * Verifica si un tema está desbloqueado
 */
export function isThemeUnlocked(themeId: string, level: number): boolean {
  const theme = getThemeById(themeId);
  return theme.unlockLevel <= level;
}

/**
 * Obtiene el próximo tema por desbloquear
 */
export function getNextThemeToUnlock(level: number): Theme | null {
  const locked = THEMES.filter(theme => theme.unlockLevel > level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel);
  return locked[0] || null;
}

/**
 * Aplica un tema al DOM usando CSS variables
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;
  
  // Variables del tablero
  root.style.setProperty('--theme-center-start', colors.centerGradientStart);
  root.style.setProperty('--theme-center-end', colors.centerGradientEnd);
  root.style.setProperty('--theme-outer-start', colors.outerGradientStart);
  root.style.setProperty('--theme-outer-end', colors.outerGradientEnd);
  
  // Variables de botones
  root.style.setProperty('--theme-primary-start', colors.primaryBtnStart);
  root.style.setProperty('--theme-primary-end', colors.primaryBtnEnd);
  
  // Variables de nivel
  root.style.setProperty('--theme-level-bg-start', colors.levelBgStart);
  root.style.setProperty('--theme-level-bg-end', colors.levelBgEnd);
  root.style.setProperty('--theme-level-bar-start', colors.levelBarStart);
  root.style.setProperty('--theme-level-bar-end', colors.levelBarEnd);
}

/**
 * Verifica si un nivel desbloquea un tema nuevo
 * @param level - Nivel alcanzado
 * @returns Tema desbloqueado o null
 */
export function checkThemeUnlock(level: number): Theme | null {
  const unlockedTheme = THEMES.find(t => t.unlockLevel === level);
  return unlockedTheme || null;
}
