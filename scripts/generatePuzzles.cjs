#!/usr/bin/env node

/**
 * Generador OFFLINE de puzzles para Heptagramas
 * 
 * Genera dos pools de puzzles:
 * - dailyPool: 70-140 soluciones + al menos 1 superhepta (7+ letras)
 * - classicsPool: 140-300 soluciones
 * 
 * Uso: node scripts/generatePuzzles.js [opciones]
 * 
 * Opciones:
 *   --daily-min <num>      Mínimo de soluciones para diarios (default: 70)
 *   --daily-max <num>      Máximo de soluciones para diarios (default: 140)
 *   --classic-min <num>    Mínimo de soluciones para clásicos (default: 140)
 *   --classic-max <num>    Máximo de soluciones para clásicos (default: 300)
 *   --candidates <num>     Número de candidatos a generar (default: 5000)
 *   --min-len <num>        Longitud mínima de palabra (default: 3)
 *   --allow-enye           Permitir letra ñ (default: false)
 *   --output <path>        Ruta del archivo de salida (default: src/data/puzzles.json)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_CONFIG = {
  dailyMin: 70,
  dailyMax: 140,
  classicMin: 140,
  classicMax: 300,
  candidates: 5000,
  minLen: 3,
  allowEnye: true,
  output: 'src/data/puzzles.json',
  wordlistPath: 'public/wordlist.txt'
};

// Parsear argumentos
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--daily-min':
        config.dailyMin = parseInt(args[++i], 10);
        break;
      case '--daily-max':
        config.dailyMax = parseInt(args[++i], 10);
        break;
      case '--classic-min':
        config.classicMin = parseInt(args[++i], 10);
        break;
      case '--classic-max':
        config.classicMax = parseInt(args[++i], 10);
        break;
      case '--candidates':
        config.candidates = parseInt(args[++i], 10);
        break;
      case '--min-len':
        config.minLen = parseInt(args[++i], 10);
        break;
      case '--allow-enye':
        config.allowEnye = true;
        break;
      case '--output':
        config.output = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Generador OFFLINE de puzzles para Heptagramas

Uso: node scripts/generatePuzzles.js [opciones]

Opciones:
  --daily-min <num>      Mínimo de soluciones para diarios (default: ${DEFAULT_CONFIG.dailyMin})
  --daily-max <num>      Máximo de soluciones para diarios (default: ${DEFAULT_CONFIG.dailyMax})
  --classic-min <num>    Mínimo de soluciones para clásicos (default: ${DEFAULT_CONFIG.classicMin})
  --classic-max <num>    Máximo de soluciones para clásicos (default: ${DEFAULT_CONFIG.classicMax})
  --candidates <num>     Número de candidatos a generar (default: ${DEFAULT_CONFIG.candidates})
  --min-len <num>        Longitud mínima de palabra (default: ${DEFAULT_CONFIG.minLen})
  --allow-enye           Permitir letra ñ (default: true, ñ nunca será letra central)
  --output <path>        Ruta del archivo de salida (default: ${DEFAULT_CONFIG.output})
  --help, -h             Mostrar esta ayuda
        `);
        process.exit(0);
    }
  }
  
  return config;
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Normaliza un carácter para comparación
 */
function normalizeChar(char) {
  const lower = char.toLowerCase();
  const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Casos especiales
  if (lower === 'ñ') return 'ñ';
  if (normalized === 'n' && lower !== 'n') return 'ñ';
  
  return normalized;
}

/**
 * Normaliza una palabra completa
 */
function normalizeString(str) {
  return str.split('').map(normalizeChar).join('');
}

/**
 * Genera bitmask para letras permitidas
 */
function getPuzzleMask(center, outer) {
  let mask = 0;
  const allLetters = [center, ...outer];
  
  for (const letter of allLetters) {
    const code = letter.charCodeAt(0);
    if (code >= 97 && code <= 122) { // a-z
      mask |= 1 << (code - 97);
    } else if (letter === 'ñ') {
      mask |= 1 << 26;
    }
  }
  
  return mask;
}

/**
 * Genera bitmask para una palabra
 */
function getWordMask(word) {
  let mask = 0;
  const normalized = normalizeString(word);
  
  for (const char of normalized) {
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
 * Carga el diccionario desde el archivo
 */
function loadDictionary(wordlistPath) {
  const fullPath = path.resolve(process.cwd(), wordlistPath);
  console.log(`📖 Cargando diccionario desde: ${fullPath}`);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`No se encontró el archivo de wordlist: ${fullPath}`);
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const words = content
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(word => word.length > 0);
  
  console.log(`✅ Diccionario cargado: ${words.length} palabras`);
  return words;
}

/**
 * Genera un candidato aleatorio de puzzle
 * La ñ nunca puede ser letra central
 */
function generateCandidate(allowEnye) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz' + (allowEnye ? 'ñ' : '');
  // ñ nunca puede ser letra central
  const centerAlphabet = 'abcdefghijklmnopqrstuvwxyz';
  const letters = new Set();
  
  // Elegir letra central (nunca ñ)
  const center = centerAlphabet[Math.floor(Math.random() * centerAlphabet.length)];
  letters.add(center);
  
  // Generar 6 letras exteriores únicas (pueden incluir ñ si allowEnye es true)
  while (letters.size < 7) {
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    letters.add(randomLetter);
  }
  
  const lettersArray = Array.from(letters);
  // Asegurar que center esté en la primera posición
  const outer = lettersArray.filter(l => l !== center);
  
  return { center, outer };
}

/**
 * Resuelve un puzzle y retorna las soluciones
 */
function solvePuzzle(center, outer, words, minLen) {
  const allowedMask = getPuzzleMask(center, outer);
  const solutions = [];
  const superHeptas = [];
  
  for (const word of words) {
    // Filtros básicos
    if (word.length < minLen) continue;
    
    const normalized = normalizeString(word);
    
    // Debe contener la letra central
    if (!normalized.includes(center)) continue;
    
    // Verificar que todas las letras están permitidas
    const wordMask = getWordMask(word);
    if ((wordMask & ~allowedMask) !== 0) continue;
    
    solutions.push(word);
    
    // Verificar si es superhepta (7+ letras)
    if (word.length >= 7) {
      superHeptas.push(word);
    }
  }
  
  return { solutions, superHeptas };
}

/**
 * Genera un ID único para el puzzle
 */
function generatePuzzleId(mode, index) {
  const prefix = mode === 'daily' ? 'daily' : 'classic';
  return `${prefix}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * Crea un objeto Puzzle
 */
function createPuzzle(id, center, outer, mode, solutionCount, minLen, allowEnye) {
  return {
    id,
    title: `${mode === 'daily' ? 'Diario' : 'Clásico'} #${id.split('-')[1]}: ${solutionCount} palabras`,
    center,
    outer,
    mode,
    minLen,
    allowEnye
  };
}

// ============================================================================
// GENERADOR PRINCIPAL
// ============================================================================

function generatePuzzles(config) {
  console.log('\n🎯 Generador de Puzzles - Heptagramas\n');
  console.log('Configuración:');
  console.log(`  Diarios: ${config.dailyMin}-${config.dailyMax} soluciones + 1+ superhepta`);
  console.log(`  Clásicos: ${config.classicMin}-${config.classicMax} soluciones`);
  console.log(`  Candidatos a generar: ${config.candidates}`);
  console.log(`  Longitud mínima: ${config.minLen}`);
  console.log(`  Permitir ñ: ${config.allowEnye}`);
  console.log();
  
  // Cargar diccionario
  const words = loadDictionary(config.wordlistPath);
  
  // Generar candidatos
  console.log(`\n🔄 Generando ${config.candidates} candidatos...`);
  const candidates = [];
  const startTime = Date.now();
  
  for (let i = 0; i < config.candidates; i++) {
    const candidate = generateCandidate(config.allowEnye);
    const { solutions, superHeptas } = solvePuzzle(
      candidate.center,
      candidate.outer,
      words,
      config.minLen
    );
    
    candidates.push({
      ...candidate,
      solutionCount: solutions.length,
      superHeptaCount: superHeptas.length,
      solutions,
      superHeptas
    });
    
    if ((i + 1) % 500 === 0) {
      console.log(`  Progreso: ${i + 1}/${config.candidates} candidatos procesados`);
    }
  }
  
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Candidatos generados en ${elapsedTime}s`);
  
  // Filtrar puzzles por categoría
  console.log('\n📊 Filtrando puzzles...');
  
  const dailyCandidates = candidates.filter(c => 
    c.solutionCount >= config.dailyMin &&
    c.solutionCount <= config.dailyMax &&
    c.superHeptaCount >= 1
  );
  
  const classicCandidates = candidates.filter(c =>
    c.solutionCount >= config.classicMin &&
    c.solutionCount <= config.classicMax
  );
  
  console.log(`  Diarios válidos: ${dailyCandidates.length}`);
  console.log(`  Clásicos válidos: ${classicCandidates.length}`);
  
  // Ordenar por número de soluciones
  dailyCandidates.sort((a, b) => a.solutionCount - b.solutionCount);
  classicCandidates.sort((a, b) => a.solutionCount - b.solutionCount);
  
  // Crear puzzles finales
  const dailyPool = dailyCandidates.map((c, i) =>
    createPuzzle(
      generatePuzzleId('daily', i),
      c.center,
      c.outer,
      'daily',
      c.solutionCount,
      config.minLen,
      config.allowEnye
    )
  );
  
  const classicsPool = classicCandidates.map((c, i) =>
    createPuzzle(
      generatePuzzleId('classic', i),
      c.center,
      c.outer,
      'classic',
      c.solutionCount,
      config.minLen,
      config.allowEnye
    )
  );
  
  // Mostrar estadísticas
  console.log('\n📈 Estadísticas de generación:');
  console.log(`  Total candidatos: ${candidates.length}`);
  console.log(`  Puzzles diarios: ${dailyPool.length}`);
  console.log(`  Puzzles clásicos: ${classicsPool.length}`);
  
  if (dailyPool.length > 0) {
    const dailyRange = {
      min: Math.min(...dailyPool.map(p => parseInt(p.title.match(/\d+/g)[1]))),
      max: Math.max(...dailyPool.map(p => parseInt(p.title.match(/\d+/g)[1])))
    };
    console.log(`    Rango diarios: ${dailyRange.min}-${dailyRange.max} palabras`);
  }
  
  if (classicsPool.length > 0) {
    const classicRange = {
      min: Math.min(...classicsPool.map(p => parseInt(p.title.match(/\d+/g)[1]))),
      max: Math.max(...classicsPool.map(p => parseInt(p.title.match(/\d+/g)[1])))
    };
    console.log(`    Rango clásicos: ${classicRange.min}-${classicRange.max} palabras`);
  }
  
  return { dailyPool, classicsPool };
}

// ============================================================================
// EXPORTACIÓN
// ============================================================================

function exportPuzzles(puzzles, config) {
  const outputPath = path.resolve(process.cwd(), config.output);
  console.log(`\n💾 Exportando puzzles a: ${outputPath}`);
  
  // Crear directorio si no existe
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Combinar ambos pools en un solo array
  const allPuzzles = [
    ...puzzles.dailyPool,
    ...puzzles.classicsPool
  ];
  
  // Escribir archivo
  const json = JSON.stringify(allPuzzles, null, 2);
  fs.writeFileSync(outputPath, json, 'utf-8');
  
  console.log(`✅ Archivo exportado exitosamente`);
  console.log(`   Total de puzzles: ${allPuzzles.length}`);
  console.log(`   Diarios: ${puzzles.dailyPool.length}`);
  console.log(`   Clásicos: ${puzzles.classicsPool.length}`);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  try {
    const config = parseArgs();
    const puzzles = generatePuzzles(config);
    exportPuzzles(puzzles, config);
    
    console.log('\n🎉 ¡Generación completada con éxito!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar si es el módulo principal
if (require.main === module) {
  main();
}

module.exports = { generatePuzzles, exportPuzzles };
