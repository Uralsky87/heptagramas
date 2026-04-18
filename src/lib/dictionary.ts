import { normalizeString } from './normalizeChar';

export interface DictionaryData {
  words: string[];
  masks: number[]; // Bitmask de letras para cada palabra
  lens: number[]; // Longitud de cada palabra
  byCenter: Map<string, number[]>; // Indice: letra central -> indices de palabras
}

/**
 * Calcula bitmask de letras para una palabra.
 * Bits 0-25: a-z
 * Bit 26: ñ
 */
function letterMask(word: string): number {
  let mask = 0;
  for (const char of word) {
    const code = char.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      mask |= 1 << (code - 97);
    } else if (char === 'ñ') {
      mask |= 1 << 26;
    }
  }
  return mask;
}

/**
 * Carga y preprocesa el diccionario desde wordlist_normalizado.txt.
 */
export async function loadDictionary(
  wordlistContent?: string,
  language: 'es' = 'es'
): Promise<DictionaryData> {
  let text: string;

  if (wordlistContent) {
    console.log('Usando contenido de diccionario proporcionado');
    text = wordlistContent;
  } else {
    const wordlistUrl = `${import.meta.env.BASE_URL}wordlist_normalizado.txt`;
    console.log('Iniciando carga de diccionario desde', wordlistUrl);
    const response = await fetch(wordlistUrl);
    console.log('Respuesta del fetch:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    text = await response.text();
  }

  console.log(`Archivo cargado: ${text.length} caracteres`);

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  console.log(`Lineas encontradas: ${lines.length}`);

  const uniqueWords = new Set<string>();

  lines.forEach((line) => {
    const normalized = normalizeString(line, true);
    if (normalized.length >= 3) {
      uniqueWords.add(normalized);
    }
  });

  const words: string[] = Array.from(uniqueWords).sort();
  const masks: number[] = [];
  const lens: number[] = [];
  const byCenter = new Map<string, number[]>();

  words.forEach((word, index) => {
    masks.push(letterMask(word));
    lens.push(word.length);

    const letterSet = new Set(word);
    letterSet.forEach((letter) => {
      if (!byCenter.has(letter)) {
        byCenter.set(letter, []);
      }
      byCenter.get(letter)!.push(index);
    });
  });

  console.log(`Diccionario cargado: ${words.length} palabras unicas (${language})`);

  return { words, masks, lens, byCenter };
}
