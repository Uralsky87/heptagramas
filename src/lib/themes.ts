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
    // Colores de UI (Home/menus)
    uiBackground: string;
    uiSurface: string;
    uiSurfaceAlt: string;
    uiSurfaceAlt2: string;
    uiBorder: string;
    uiText: string;
    uiMuted: string;
    uiIcon: string;
    uiXpTrack: string;
    uiXpFillStart: string;
    uiXpFillEnd: string;
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
      centerGradientStart: '#8f7558',
      centerGradientEnd: '#a88a66',
      outerGradientStart: '#7f7568',
      outerGradientEnd: '#9c907f',
      primaryBtnStart: '#8f7558',
      primaryBtnEnd: '#a88a66',
      levelBgStart: '#dfd1bc',
      levelBgEnd: '#d4c2a8',
      levelBarStart: '#b49571',
      levelBarEnd: '#927759',
      uiBackground: '#f6eedf',
      uiSurface: '#fbf5ea',
      uiSurfaceAlt: '#f4ebdc',
      uiSurfaceAlt2: '#ece0cd',
      uiBorder: '#b6a489',
      uiText: '#3f3429',
      uiMuted: '#7a6a58',
      uiIcon: '#8f7558',
      uiXpTrack: '#dbccb4',
      uiXpFillStart: '#b49571',
      uiXpFillEnd: '#927759',
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
      uiBackground: '#fff3ee',
      uiSurface: '#ffe7dd',
      uiSurfaceAlt: '#ffd9cc',
      uiSurfaceAlt2: '#ffcab8',
      uiBorder: '#f0a98f',
      uiText: '#2b1e1c',
      uiMuted: '#6b4f49',
      uiIcon: '#e05c4b',
      uiXpTrack: '#f4bca8',
      uiXpFillStart: '#ff6b6b',
      uiXpFillEnd: '#fdc830',
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
      uiBackground: '#eef7fb',
      uiSurface: '#e0f1f8',
      uiSurfaceAlt: '#d2eaf5',
      uiSurfaceAlt2: '#c6e3f2',
      uiBorder: '#8bbad1',
      uiText: '#0f2633',
      uiMuted: '#375464',
      uiIcon: '#0ea5e9',
      uiXpTrack: '#b9dcec',
      uiXpFillStart: '#22d3ee',
      uiXpFillEnd: '#06b6d4',
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
      uiBackground: '#eef8f1',
      uiSurface: '#e0f3e6',
      uiSurfaceAlt: '#d2eddc',
      uiSurfaceAlt2: '#c4e7d2',
      uiBorder: '#84b99d',
      uiText: '#132a1f',
      uiMuted: '#3b5a4b',
      uiIcon: '#059669',
      uiXpTrack: '#bfe3cc',
      uiXpFillStart: '#34d399',
      uiXpFillEnd: '#10b981',
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
      uiBackground: '#f5f0ff',
      uiSurface: '#eee6ff',
      uiSurfaceAlt: '#e6dcff',
      uiSurfaceAlt2: '#dccfff',
      uiBorder: '#b49ce9',
      uiText: '#2b1f3a',
      uiMuted: '#5a4a70',
      uiIcon: '#8b5cf6',
      uiXpTrack: '#d7c9f4',
      uiXpFillStart: '#c084fc',
      uiXpFillEnd: '#a855f7',
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
      uiBackground: '#fff4ec',
      uiSurface: '#ffe7d7',
      uiSurfaceAlt: '#ffdcc2',
      uiSurfaceAlt2: '#ffd0ad',
      uiBorder: '#f2b58d',
      uiText: '#3a2215',
      uiMuted: '#6e4b35',
      uiIcon: '#f472b6',
      uiXpTrack: '#f6c7a6',
      uiXpFillStart: '#fde047',
      uiXpFillEnd: '#fbbf24',
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

  // Variables de UI
  root.style.setProperty('--theme-ui-bg', colors.uiBackground);
  root.style.setProperty('--theme-ui-surface', colors.uiSurface);
  root.style.setProperty('--theme-ui-surface-alt', colors.uiSurfaceAlt);
  root.style.setProperty('--theme-ui-surface-alt-2', colors.uiSurfaceAlt2);
  root.style.setProperty('--theme-ui-border', colors.uiBorder);
  root.style.setProperty('--theme-ui-text', colors.uiText);
  root.style.setProperty('--theme-ui-muted', colors.uiMuted);
  root.style.setProperty('--theme-ui-icon', colors.uiIcon);
  root.style.setProperty('--theme-ui-xp-track', colors.uiXpTrack);
  root.style.setProperty('--theme-ui-xp-fill-start', colors.uiXpFillStart);
  root.style.setProperty('--theme-ui-xp-fill-end', colors.uiXpFillEnd);
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
