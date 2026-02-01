import { normalizeString } from './normalizeChar';

export interface DictionaryData {
  words: string[];
  masks: number[]; // Bitmask de letras para cada palabra
  lens: number[]; // Longitud de cada palabra
  byCenter: Map<string, number[]>; // Índice: letra central -> índices de palabras
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
    if (code >= 97 && code <= 122) { // a-z
      mask |= 1 << (code - 97);
    } else if (char === 'ñ') { // ñ -> bit 26
      mask |= 1 << 26;
    }
  }
  return mask;
}

/**
 * Carga y preprocesa el diccionario desde wordlist.txt (español) o wordlisten.txt (inglés):
 * - Normaliza con normalizeString (consistente con validateWord)
 * - Filtra palabras < 3 letras
 * - Elimina duplicados
 * - Calcula bitmasks y longitudes
 * - Crea índice por letra para búsqueda rápida
 * 
 * @param wordlistContent - Opcional. Si se provee, usa este texto en lugar de hacer fetch
 * @param language - Idioma ('es' o 'en') para seleccionar el archivo correcto
 */
export async function loadDictionary(wordlistContent?: string, language: 'es' | 'en' = 'es'): Promise<DictionaryData> {
  try {
    let text: string;

    if (wordlistContent) {
      // Usar contenido proporcionado (para scripts de Node.js)
      console.log('Usando contenido de diccionario proporcionado');
      text = wordlistContent;
    } else {
      // Cargar desde public/wordlist.txt (español) o wordlisten.txt (inglés)
      const filename = language === 'en' ? 'wordlisten.txt' : 'wordlist.txt';
      const wordlistUrl = `${import.meta.env.BASE_URL}${filename}`;
      console.log('Iniciando carga de diccionario desde', wordlistUrl);
      const response = await fetch(wordlistUrl);
      console.log('Respuesta del fetch:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      text = await response.text();
    }

    console.log(`Archivo cargado: ${text.length} caracteres`);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log(`Líneas encontradas: ${lines.length}`);
    
    // Usar Set para eliminar duplicados durante normalización
    const uniqueWords = new Set<string>();
    
    lines.forEach((line) => {
      // Normalizar consistentemente (modo clásico: NO permite ñ)
      const normalized = normalizeString(line, false);
      if (normalized.length >= 3) { // Mínimo 3 letras
        uniqueWords.add(normalized);
      }
    });
    
    // Convertir a arrays y preparar datos
    const words: string[] = Array.from(uniqueWords).sort();
    const masks: number[] = [];
    const lens: number[] = [];
    const byCenter = new Map<string, number[]>();
    
    words.forEach((word, index) => {
      masks.push(letterMask(word));
      lens.push(word.length);
      
      // Indexar por cada letra que contiene la palabra
      const letterSet = new Set(word);
      letterSet.forEach(letter => {
        if (!byCenter.has(letter)) {
          byCenter.set(letter, []);
        }
        byCenter.get(letter)!.push(index);
      });
    });
    
    console.log(`Diccionario cargado: ${words.length} palabras únicas`);
    
    return { words, masks, lens, byCenter };
  } catch (error) {
    console.error('Error cargando diccionario:', error);
    
    // Solo mostrar alert si estamos en navegador
    if (typeof window !== 'undefined' && typeof alert !== 'undefined') {
      alert(`Error al cargar el diccionario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
    
    return { words: [], masks: [], lens: [], byCenter: new Map() };
  }
}
