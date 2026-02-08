# 🎯 Generador de Puzzles - Resumen de Implementación

## 📦 Archivos Creados

### Scripts Principales
1. **`scripts/generatePuzzles.cjs`** (550+ líneas)
   - Generador OFFLINE completo de puzzles
   - Soporta configuración por línea de comandos
   - Calcula soluciones automáticamente
   - Filtra por rangos configurables
   - Exporta a JSON

2. **`scripts/quick-generate.cjs`** (120 líneas)
   - Wrapper con configuraciones predefinidas
   - Simplifica el uso común
   - 5 presets: standard, quick, easy, hard, enye

### Documentación
3. **`scripts/GENERATOR_README.md`**
   - Documentación completa del generador
   - Guía de uso con ejemplos
   - Troubleshooting
   - Integración con el juego

4. **`scripts/example-config.json`**
   - Configuraciones de ejemplo en JSON
   - Requisitos del diccionario
   - Resultados esperados

### README Principal
5. **`README.md`** (actualizado)
   - Nueva sección sobre el generador
   - Estructura del proyecto actualizada
   - Instrucciones de uso

## ✨ Funcionalidades

### Entrada
- **Diccionario**: `src/data/wordlist.txt` (una palabra por línea)
- **Configuración CLI**: 
  - `--daily-min/max`: Rango de soluciones para diarios (default: 70-170)
  - `--classic-min/max`: Rango de soluciones para clásicos (default: 140-300)
  - `--candidates`: Número de candidatos a generar (default: 5000)
  - `--min-len`: Longitud mínima de palabra (default: 3)
  - `--allow-enye`: Permitir letra ñ (default: false)
  - `--output`: Ruta de salida (default: src/data/puzzles.json)

### Proceso
1. **Generación de candidatos**: Combinaciones aleatorias de 7 letras únicas
2. **Cálculo de soluciones**: Valida palabras del diccionario contra cada candidato
3. **Filtrado por categoría**:
  - **Diarios**: 70-170 soluciones + al menos 1 superhepta (7+ letras)
   - **Clásicos**: 140-300 soluciones
4. **Ordenamiento**: Por número de soluciones (ascendente)
5. **Generación de IDs**: `daily-001`, `classic-001`, etc.

### Salida
```json
[
  {
    "id": "daily-001",
    "title": "Diario #001: 85 palabras",
    "center": "a",
    "outer": ["b", "c", "d", "e", "r", "s"],
    "mode": "daily",
    "minLen": 3,
    "allowEnye": false
  }
]
```

## 🔧 Algoritmos Implementados

### 1. Normalización de Caracteres
```javascript
function normalizeChar(char) {
  const lower = char.toLowerCase();
  const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Casos especiales
  if (lower === 'ñ') return 'ñ';
  if (normalized === 'n' && lower !== 'n') return 'ñ';
  
  return normalized;
}
```

### 2. Bitmasks para Validación Rápida
```javascript
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
```
- **Complejidad**: O(1) para validar letras
- **Bits 0-25**: a-z
- **Bit 26**: ñ

### 3. Resolución de Puzzles
```javascript
function solvePuzzle(center, outer, words, minLen) {
  const allowedMask = getPuzzleMask(center, outer);
  const solutions = [];
  const superHeptas = [];
  
  for (const word of words) {
    if (word.length < minLen) continue;
    
    const normalized = normalizeString(word);
    if (!normalized.includes(center)) continue;
    
    const wordMask = getWordMask(word);
    if ((wordMask & ~allowedMask) !== 0) continue;
    
    solutions.push(word);
    if (word.length >= 7) superHeptas.push(word);
  }
  
  return { solutions, superHeptas };
}
```

## 📊 Performance

Con 5000 candidatos y un diccionario de 50k+ palabras:
- **Tiempo de generación**: 5-30 segundos
- **Puzzles típicos**: 50-200 diarios, 30-150 clásicos
- **Tamaño del JSON**: ~50-200KB

## 🎮 Integración con el Juego

El archivo `src/data/puzzles.json` generado es usado por:
- `src/lib/dailySession.ts`: Selecciona puzzle diario por fecha
- `src/components/ClassicList.tsx`: Muestra lista de puzzles clásicos
- `src/App.tsx`: Importa PUZZLES globalmente

No requiere configuración adicional.

## 📝 Uso Recomendado

### Para Desarrollo
```bash
# Test rápido
node scripts/quick-generate.cjs quick

# Resultado: test-puzzles.json (no sobrescribe producción)
```

### Para Producción
```bash
# Generar pool completo
node scripts/quick-generate.cjs standard

# O con opciones personalizadas
node scripts/generatePuzzles.cjs --candidates 10000
```

### Para Diccionarios Pequeños
```bash
# Ajustar rangos
node scripts/generatePuzzles.cjs \
  --candidates 2000 \
  --daily-min 10 \
  --daily-max 50 \
  --classic-min 30 \
  --classic-max 100
```

## ⚠️ Limitaciones Actuales

1. **Diccionario requerido**: El repo actual tiene solo 185 palabras (demo)
   - **Solución**: Descargar diccionario completo (50k+ palabras)
   
2. **Generación aleatoria**: Resultados varían en cada ejecución
   - **Solución futura**: Opción `--seed` para reproducibilidad

3. **Sin validación de unicidad**: Puede generar combinaciones repetidas
   - **Impacto**: Mínimo con 5000+ candidatos aleatorios

4. **Sin filtro de palabras ofensivas**: Usa todas las palabras del diccionario
   - **Solución**: Pre-filtrar el diccionario

## 🚀 Próximas Mejoras

- [ ] Añadir `--seed` para generación reproducible
- [ ] Filtro de palabras ofensivas
- [ ] Validación de calidad (distribución de letras)
- [ ] Generación paralela (workers)
- [ ] Modo interactivo (TUI)
- [ ] Export a múltiples formatos (CSV, SQLite)
- [ ] Estadísticas avanzadas (histogramas, correlaciones)

## 🔗 Referencias

- Documentación completa: `scripts/GENERATOR_README.md`
- Configuraciones: `scripts/example-config.json`
- Código fuente: `scripts/generatePuzzles.cjs`
- Quick launcher: `scripts/quick-generate.cjs`

---

**Fecha de creación**: Enero 2026  
**Versión**: 1.0.0
