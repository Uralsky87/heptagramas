/**
 * Normaliza un solo carácter para comparación consistente
 * Usado en: letras del puzzle, input del usuario, palabras del diccionario
 * 
 * Reglas:
 * - Convierte a minúscula
 * - Quita tildes/diacríticos (á→a, é→e, etc.)
 * - Preserva ñ (letra válida en español)
 * - Elimina cualquier carácter que no sea a-z o ñ
 * - Retorna string vacío si el carácter no es válido
 */
export function normalizeChar(char: string, allowEnye: boolean = true): string {
  if (!char) return '';
  
  // Convertir a minúscula
  let normalized = char.toLowerCase();
  
  // Mapa de diacríticos a letras base
  const diacriticMap: Record<string, string> = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': allowEnye ? 'ñ' : 'n',
  };
  
  // Aplicar mapa de diacríticos
  if (diacriticMap[normalized]) {
    normalized = diacriticMap[normalized];
  }
  
  // Solo permitir a-z (y ñ si está permitido)
  const validPattern = allowEnye ? /^[a-zñ]$/ : /^[a-z]$/;
  if (!validPattern.test(normalized)) {
    return '';
  }
  
  return normalized;
}

/**
 * Normaliza una palabra completa aplicando normalizeChar a cada letra
 */
export function normalizeString(str: string, allowEnye: boolean = true): string {
  if (!str) return '';
  
  return str
    .trim()
    .split('')
    .map(char => normalizeChar(char, allowEnye))
    .filter(char => char !== '')
    .join('');
}

/**
 * Normaliza un array de letras (útil para puzzle.outer)
 */
export function normalizeLetters(letters: string[], allowEnye: boolean = true): string[] {
  return letters
    .map(letter => normalizeChar(letter, allowEnye))
    .filter(letter => letter !== '');
}
