// Test de normalización y búsqueda de "río" -> "rio"

function normalizeChar(char, allowEnye = true) {
  if (!char) return '';
  let normalized = char.toLowerCase();
  const diacriticMap = {
    'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
    'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
    'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
    'ñ': allowEnye ? 'ñ' : 'n',
  };
  if (diacriticMap[normalized]) {
    normalized = diacriticMap[normalized];
  }
  const validPattern = allowEnye ? /^[a-zñ]$/ : /^[a-z]$/;
  if (!validPattern.test(normalized)) {
    return '';
  }
  return normalized;
}

function normalizeString(str, allowEnye = true) {
  if (!str) return '';
  return str.trim().split('').map(c => normalizeChar(c, allowEnye)).join('');
}

// Test palabras
const testWords = ['río', 'rio', 'RÍO', 'RIO', 'Río', 'Rio'];

console.log('=== Test de Normalización ===\n');
testWords.forEach(word => {
  const normalized = normalizeString(word, false);
  console.log(`"${word}" -> "${normalized}" (length: ${normalized.length})`);
  
  // Debug cada carácter
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const norm = normalizeChar(char, false);
    const code = char.charCodeAt(0);
    console.log(`  [${i}] '${char}' (U+${code.toString(16).toUpperCase().padStart(4, '0')}) -> '${norm}'`);
  }
  console.log('');
});

// Leer wordlist.txt
const fs = require('fs');
const path = require('path');

const wordlistPath = path.join(__dirname, 'public', 'wordlist.txt');
console.log(`\n=== Leyendo: ${wordlistPath} ===\n`);

const content = fs.readFileSync(wordlistPath, 'utf-8');
const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

console.log(`Total líneas: ${lines.length}`);

// Buscar variantes de "rio"
const rioVariants = lines.filter(l => normalizeString(l, false) === 'rio');
console.log(`\nVariantes encontradas de "rio":`);
rioVariants.forEach(v => {
  console.log(`  "${v}" -> "${normalizeString(v, false)}"`);
});

// También buscar la línea exacta "río"
const exactRio = lines.filter(l => l === 'río' || l === 'rio');
console.log(`\nBúsqueda exacta de "río" o "rio":`);
exactRio.forEach(v => {
  console.log(`  "${v}"`);
});

// Normalizar todo el diccionario
console.log(`\n=== Normalizando diccionario ===\n`);
const uniqueWords = new Set();

lines.forEach(line => {
  const normalized = normalizeString(line, false);
  if (normalized.length >= 3) {
    uniqueWords.add(normalized);
  }
});

console.log(`Palabras únicas normalizadas (>=3 letras): ${uniqueWords.size}`);
console.log(`¿Contiene "rio"? ${uniqueWords.has('rio')}`);

// Si contiene "rio", buscar todas las palabras que se normalizan a "rio"
if (uniqueWords.has('rio')) {
  console.log(`\n✓ "rio" está en el diccionario normalizado`);
  const originals = lines.filter(l => normalizeString(l, false) === 'rio');
  console.log(`Palabras originales que se normalizan a "rio":`);
  originals.forEach(o => console.log(`  "${o}"`));
} else {
  console.log(`\n✗ "rio" NO está en el diccionario normalizado`);
}

// Buscar palabras de 3 letras con r, i, o
const threeLetterWords = Array.from(uniqueWords).filter(w => w.length === 3);
console.log(`\nTotal palabras de 3 letras: ${threeLetterWords.length}`);

const withRIO = threeLetterWords.filter(w => 
  w.includes('r') && w.includes('i') && w.includes('o')
);
console.log(`Palabras de 3 letras con R, I, O: ${withRIO.length}`);
console.log(withRIO.slice(0, 20));
