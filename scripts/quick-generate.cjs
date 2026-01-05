#!/usr/bin/env node

/**
 * Script de ejemplo para generar puzzles con configuraciones predefinidas
 * Ejecutar: node scripts/quick-generate.cjs [config-name]
 * 
 * Configuraciones disponibles:
 * - standard: Configuración por defecto (5000 candidatos)
 * - quick: Test rápido con 500 candidatos
 * - easy: Puzzles fáciles (menos soluciones)
 * - hard: Puzzles difíciles (más soluciones)
 * - enye: Con letra ñ permitida
 */

const { spawn } = require('child_process');
const path = require('path');

const CONFIGS = {
  standard: {
    description: 'Configuración estándar (5000 candidatos)',
    args: ['--candidates', '5000']
  },
  quick: {
    description: 'Test rápido (500 candidatos)',
    args: ['--candidates', '500', '--output', 'test-puzzles.json']
  },
  easy: {
    description: 'Puzzles fáciles (menos soluciones)',
    args: [
      '--candidates', '5000',
      '--daily-min', '50',
      '--daily-max', '100',
      '--classic-min', '100',
      '--classic-max', '200'
    ]
  },
  hard: {
    description: 'Puzzles difíciles (más soluciones)',
    args: [
      '--candidates', '5000',
      '--daily-min', '100',
      '--daily-max', '180',
      '--classic-min', '200',
      '--classic-max', '400'
    ]
  },
  enye: {
    description: 'Con letra ñ permitida',
    args: ['--candidates', '5000', '--allow-enye']
  }
};

function showHelp() {
  console.log(`
🎯 Quick Generator - Configuraciones predefinidas

Uso: node scripts/quick-generate.cjs [config-name]

Configuraciones disponibles:
`);
  
  for (const [name, config] of Object.entries(CONFIGS)) {
    console.log(`  ${name.padEnd(10)} - ${config.description}`);
  }
  
  console.log(`
Ejemplos:
  node scripts/quick-generate.cjs standard
  node scripts/quick-generate.cjs quick
  node scripts/quick-generate.cjs easy

Para opciones avanzadas, usa directamente:
  node scripts/generatePuzzles.cjs --help
`);
}

function runGenerator(configName) {
  const config = CONFIGS[configName];
  
  if (!config) {
    console.error(`❌ Configuración desconocida: ${configName}`);
    console.log(`\nConfiguraciones válidas: ${Object.keys(CONFIGS).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`\n🚀 Ejecutando configuración: ${configName}`);
  console.log(`📝 ${config.description}\n`);
  
  const scriptPath = path.join(__dirname, 'generatePuzzles.cjs');
  const child = spawn('node', [scriptPath, ...config.args], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log(`\n✅ Generación completada con configuración: ${configName}`);
    } else {
      console.error(`\n❌ Error en la generación (código: ${code})`);
      process.exit(code);
    }
  });
}

// Main
const configName = process.argv[2];

if (!configName || configName === '--help' || configName === '-h') {
  showHelp();
  process.exit(0);
}

runGenerator(configName);
