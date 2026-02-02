const fs = require('fs');
const path = require('path');

const WORDLIST_INPUT = path.resolve(__dirname, '../public/wordlist.txt');
const WORDLIST_OUTPUT = path.resolve(__dirname, '../public/wordlist_normalizado.txt');
const DEFINITIONS_INPUT = path.resolve(__dirname, '../public/definiciones.txt');
const DEFINITIONS_OUTPUT = path.resolve(__dirname, '../public/definiciones_normalizado.txt');

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
  return str
    .trim()
    .split('')
    .map((char) => normalizeChar(char, allowEnye))
    .filter((char) => char !== '')
    .join('');
}

function buildFeminine(masc, suffix) {
  if (!suffix) return null;
  
  // Buscar el mínimo k donde no haya overlap entre base y suffix
  for (let k = 1; k <= masc.length; k += 1) {
    const base = masc.slice(0, -k);
    const baseLower = base.toLowerCase();
    const suffixLower = suffix.toLowerCase();
    
    // Verificar si hay algún overlap entre el final de base y el inicio de suffix
    let hasOverlap = false;
    for (let len = 1; len <= Math.min(base.length, suffix.length); len += 1) {
      if (baseLower.slice(-len) === suffixLower.slice(0, len)) {
        hasOverlap = true;
        break;
      }
    }
    
    // Si no hay overlap, este es el k correcto
    if (!hasOverlap) {
      return `${base}${suffix}`;
    }
  }
  
  // Si todos tienen overlap, agregar el sufijo al final
  return `${masc}${suffix}`;
}

function parseWordlistLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const parts = trimmed.split(',');
  const masc = (parts[0] || '').trim();
  if (!masc) return null;
  const suffix = parts.slice(1).join(',').trim();
  return { masc, suffix: suffix || null };
}

function parseDefinitionLine(line) {
  if (!line.trim()) return null;
  const match = line.match(/^(\S+?)(?:\^[\d])?\s+(.+)$/);
  if (!match) return null;
  const word = match[1];
  const definition = match[2].trim();
  return { word, definition };
}

function loadDefinitionsMap() {
  const defs = new Map();
  if (!fs.existsSync(DEFINITIONS_INPUT)) {
    return defs;
  }
  const text = fs.readFileSync(DEFINITIONS_INPUT, 'utf-8');
  for (const line of text.split('\n')) {
    const parsed = parseDefinitionLine(line);
    if (!parsed) continue;
    const normalized = normalizeString(parsed.word, true);
    if (!defs.has(normalized)) {
      defs.set(normalized, parsed.definition);
    }
  }
  return defs;
}

function buildWordlists() {
  const raw = fs.readFileSync(WORDLIST_INPUT, 'utf-8');
  const lines = raw.split('\n');
  const wordSet = new Set();
  const entries = [];

  for (const line of lines) {
    const parsed = parseWordlistLine(line);
    if (!parsed) continue;
    const fem = parsed.suffix ? buildFeminine(parsed.masc, parsed.suffix) : null;
    entries.push({ masc: parsed.masc, fem });
    const mascNormalized = normalizeString(parsed.masc, true);
    if (mascNormalized) wordSet.add(mascNormalized);
    if (fem) {
      const femNormalized = normalizeString(fem, true);
      if (femNormalized) wordSet.add(femNormalized);
    }
  }

  const definitionsBase = loadDefinitionsMap();
  const definitionsNormalized = new Map();

  for (const entry of entries) {
    const mascNormalized = normalizeString(entry.masc, true);
    const femNormalized = entry.fem ? normalizeString(entry.fem, true) : null;
    const definition = definitionsBase.get(mascNormalized);
    if (definition) {
      if (!definitionsNormalized.has(mascNormalized)) {
        definitionsNormalized.set(mascNormalized, definition);
      }
      if (femNormalized && !definitionsNormalized.has(femNormalized)) {
        definitionsNormalized.set(femNormalized, definition);
      }
    }
  }

  const wordsSorted = Array.from(wordSet).sort();
  fs.writeFileSync(WORDLIST_OUTPUT, `${wordsSorted.join('\n')}\n`, 'utf-8');

  const defsSorted = Array.from(definitionsNormalized.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([word, definition]) => `${word}\t${definition}`);
  fs.writeFileSync(DEFINITIONS_OUTPUT, `${defsSorted.join('\n')}\n`, 'utf-8');

  return { wordSet, definitionsNormalized };
}

function runExamplesTest(wordSet, definitionsNormalized) {
  const examples = [
    { masc: 'abacalero', suffix: 'ra', expected: 'abacalera' },
    { masc: 'abadengo', suffix: 'ga', expected: 'abadenga' },
    { masc: 'abad', suffix: 'desa', expected: 'abadesa' },
    { masc: 'abastecedor', suffix: 'ra', expected: 'abastecedora' },
    { masc: 'ablatorio', suffix: 'ria', expected: 'ablatoria' },
    { masc: 'abrasivo', suffix: 'va', expected: 'abrasiva' },
    { masc: 'abietíneo', suffix: 'a', expected: 'abietínea' },
  ];

  let failed = false;

  for (const ex of examples) {
    const fem = buildFeminine(ex.masc, ex.suffix);
    const expectedNormalized = normalizeString(ex.expected, true);
    const femNormalized = normalizeString(fem || '', true);
    const inWordlist = wordSet.has(expectedNormalized);

    if (femNormalized !== expectedNormalized || !inWordlist) {
      failed = true;
      console.error(`✗ Ejemplo fallido: ${ex.masc}, ${ex.suffix} -> ${fem} (esperado: ${ex.expected})`);
    } else {
      console.log(`✓ Ejemplo OK: ${ex.masc}, ${ex.suffix} -> ${ex.expected}`);
    }

    if (definitionsNormalized.has(expectedNormalized)) {
      console.log(`  ✓ Definición disponible para ${ex.expected}`);
    }
  }

  if (failed) {
    process.exit(1);
  }
}

const { wordSet, definitionsNormalized } = buildWordlists();
runExamplesTest(wordSet, definitionsNormalized);

console.log('✓ wordlist_normalizado.txt y definiciones_normalizado.txt generados.');
