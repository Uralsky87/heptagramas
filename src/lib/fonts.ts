export interface FontOption {
  id: string;
  label: string;
  stack: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'classic',
    label: 'Clasica (typewriter)',
    stack: "'Courier New', 'Lucida Console', 'Georgia', serif",
    description: 'Monoespaciada, estilo maquina de escribir.',
  },
  {
    id: 'system',
    label: 'Anterior (sistema)',
    stack: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
    description: 'La fuente anterior del sistema.',
  },
  {
    id: 'garamond',
    label: 'Serif elegante',
    stack: "'Garamond', 'Times New Roman', serif",
    description: 'Clasica, editorial y elegante.',
  },
  {
    id: 'poppins',
    label: 'Sans moderna',
    stack: "'Poppins', 'Segoe UI', Arial, sans-serif",
    description: 'Moderna y limpia.',
  },
  {
    id: 'source-code-pro',
    label: 'Mono limpia',
    stack: "'Source Code Pro', 'Courier New', monospace",
    description: 'Monoespaciada legible.',
  },
];

export function getFontById(fontId: string): FontOption {
  return FONT_OPTIONS.find((font) => font.id === fontId) || FONT_OPTIONS[0];
}

export function applyFont(fontId: string): void {
  const font = getFontById(fontId);
  document.documentElement.style.setProperty('--app-font', font.stack);
}
