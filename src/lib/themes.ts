/**
 * Tema visual fijo de la aplicacion.
 *
 * Se conserva la API historica de temas por compatibilidad con guardados antiguos,
 * pero la experiencia actual solo permite el tema por defecto.
 */

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  unlockLevel: number;
  description: string;
  colors: {
    centerGradientStart: string;
    centerGradientEnd: string;
    outerGradientStart: string;
    outerGradientEnd: string;
    primaryBtnStart: string;
    primaryBtnEnd: string;
    levelBgStart: string;
    levelBgEnd: string;
    levelBarStart: string;
    levelBarEnd: string;
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

export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'default',
  displayName: 'Clasico',
  unlockLevel: 1,
  description: 'Tema fijo de Palabrarium',
  colors: {
    centerGradientStart: '#b45a37',
    centerGradientEnd: '#d48852',
    outerGradientStart: '#566252',
    outerGradientEnd: '#7c846f',
    primaryBtnStart: '#9f4f32',
    primaryBtnEnd: '#ca8151',
    levelBgStart: '#dbc4a2',
    levelBgEnd: '#c8ab82',
    levelBarStart: '#d2a267',
    levelBarEnd: '#9f4f32',
    uiBackground: '#243630',
    uiSurface: '#f0dfc3',
    uiSurfaceAlt: '#e7d2b1',
    uiSurfaceAlt2: '#d9bf97',
    uiBorder: '#8f6d4d',
    uiText: '#2f2017',
    uiMuted: '#6a5541',
    uiIcon: '#9f4f32',
    uiXpTrack: '#cdb189',
    uiXpFillStart: '#d2a267',
    uiXpFillEnd: '#9f4f32',
  },
};

export const THEMES: Theme[] = [DEFAULT_THEME];

/**
 * Devuelve siempre el tema fijo. El parametro se conserva para aceptar estados
 * antiguos como "ocean" sin propagar estilos obsoletos.
 */
export function getThemeById(themeId?: string): Theme {
  void themeId;
  return DEFAULT_THEME;
}

export function getUnlockedThemes(level?: number): Theme[] {
  void level;
  return THEMES;
}

export function isThemeUnlocked(themeId: string, level?: number): boolean {
  void level;
  return themeId === DEFAULT_THEME.id;
}

export function getNextThemeToUnlock(level?: number): Theme | null {
  void level;
  return null;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const colors = theme.colors;

  root.style.setProperty('--theme-center-start', colors.centerGradientStart);
  root.style.setProperty('--theme-center-end', colors.centerGradientEnd);
  root.style.setProperty('--theme-outer-start', colors.outerGradientStart);
  root.style.setProperty('--theme-outer-end', colors.outerGradientEnd);

  root.style.setProperty('--theme-primary-start', colors.primaryBtnStart);
  root.style.setProperty('--theme-primary-end', colors.primaryBtnEnd);

  root.style.setProperty('--theme-level-bg-start', colors.levelBgStart);
  root.style.setProperty('--theme-level-bg-end', colors.levelBgEnd);
  root.style.setProperty('--theme-level-bar-start', colors.levelBarStart);
  root.style.setProperty('--theme-level-bar-end', colors.levelBarEnd);

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

export function checkThemeUnlock(level?: number): Theme | null {
  void level;
  return null;
}
