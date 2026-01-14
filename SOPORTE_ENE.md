# Soporte de la Letra Ñ

## Resumen de Cambios

Se ha implementado soporte completo para la letra Ñ en el juego Heptagramas con la siguiente restricción:

**✓ La Ñ puede aparecer en las letras exteriores (outer)**
**✗ La Ñ NUNCA puede ser la letra central**

## Archivos Modificados

### 1. Normalización de Caracteres

#### `src/lib/normalizeWord.ts`
- Cambiado `allowEnye` por defecto de `false` a `true`
- Las palabras ahora permiten ñ por defecto

#### `src/lib/normalizeChar.ts`
- Ya tenía soporte para ñ con el parámetro `allowEnye`
- Por defecto `allowEnye = true`

### 2. Generadores de Puzzles

#### `src/lib/puzzleGenerator.ts`
- **Letras comunes**: Incluye ñ en la lista de letras disponibles
- **Filtro de centro**: Nueva lista `centerCandidates` que excluye ñ
- La letra central se elige solo de `centerCandidates` (sin ñ)
- Las letras exteriores se eligen de todas las letras (puede incluir ñ)
- Actualizado `allowEnye: true` en puzzles generados
- Actualizado `hasAtLeastOneSuperHepta` para usar `allowEnye: true`

#### `scripts/generatePuzzles.cjs`
- **DEFAULT_CONFIG**: `allowEnye: true` por defecto
- **generateCandidate**: 
  - Usa alfabeto completo con ñ para selección general
  - Usa alfabeto sin ñ específicamente para letra central
  - Asegura que center nunca sea ñ
- Actualizado mensaje de ayuda: "ñ nunca será letra central"
- Corregido `wordlistPath` a `public/wordlist.txt`

### 3. Generador de Puzzles Exóticos

#### `src/lib/generateExoticPuzzle.ts`
- Nueva constante `INVALID_CENTER_LETTERS` que incluye ñ y letras problemáticas
- **generateRandomLetters**: 
  - Alfabeto completo con ñ para todas las letras
  - Alfabeto sin ñ específicamente para centro
  - Selecciona centro primero (nunca ñ)
  - Selecciona 6 letras outer (pueden incluir ñ)
- **isValidLetterSet**: Valida que centro no sea ñ ni letra problemática
- **calculateSolutions**: Usa `allowEnye: true`

### 4. Validación y Resolución

#### `src/lib/validateWord.ts`
- Cambiado `allowEnye = puzzle.allowEnye || false` a `allowEnye = puzzle.allowEnye ?? true`
- Ambas funciones: `isSuperHepta` y `validateWord`
- Usa el operador `??` para permitir ñ por defecto

#### `src/lib/solvePuzzle.ts`
- Cambiado parámetro por defecto de `allowEnye: boolean = false` a `allowEnye: boolean = true`
- Actualizado comentario: "ñ nunca puede ser letra central"

### 5. Componentes React

#### `src/components/Game.tsx`
- Cambiado `allowEnye = currentPuzzle.allowEnye || false` a `allowEnye = currentPuzzle.allowEnye ?? true`

#### `src/components/DailyScreen.tsx`
- Cambiado `allowEnye = puzzle.allowEnye || false` a `allowEnye = puzzle.allowEnye ?? true`

#### `src/components/ClassicList.tsx`
- Cambiado `allowEnye = puzzle.allowEnye || false` a `allowEnye = puzzle.allowEnye ?? true`

### 6. Tipos TypeScript

#### `src/types.ts`
- Actualizado comentario de `allowEnye` en interfaz `Puzzle`
- Nuevo texto: "si permite ñ (default: true, ñ nunca será letra central)"

## Comportamiento

### Generación de Puzzles

1. **Modo Clásico/Diario**:
   - Se eligen letras comunes del español (incluyendo ñ)
   - La letra central se elige de un subconjunto SIN ñ
   - Las 6 letras exteriores pueden incluir ñ

2. **Modo Exótico**:
   - Se genera un alfabeto completo con ñ
   - Se elige primero la letra central (de alfabeto sin ñ)
   - Se eligen 6 letras exteriores (pueden incluir ñ)
   - ñ está en la lista `INVALID_CENTER_LETTERS`

### Validación de Palabras

- Las palabras con ñ son aceptadas y normalizadas correctamente
- La ñ se preserva (no se convierte a 'n')
- Si una palabra contiene ñ:
  - ✓ Es válida si la ñ está en las letras exteriores
  - ✗ No es posible que requiera ñ como letra central (por diseño)

### Compatibilidad

- **Puzzles antiguos sin `allowEnye`**: Se comportan como `allowEnye: true` por defecto
- **Puzzles con `allowEnye: false`**: Mantienen su comportamiento (rechazan ñ)
- **Puzzles nuevos**: Se generan con `allowEnye: true`

## Cómo Regenerar Puzzles

Si has actualizado el `wordlist.txt` con palabras que contienen ñ:

```bash
# Generar nuevos puzzles con soporte de ñ
node scripts/generatePuzzles.cjs

# Opciones disponibles:
node scripts/generatePuzzles.cjs --help

# Por defecto allowEnye es true, para deshabilitarlo:
node scripts/generatePuzzles.cjs --no-allow-enye
```

## Verificaciones

Para asegurar que ñ nunca sea letra central:

1. **En TypeScript**: La variable `centerCandidates` excluye ñ
2. **En JavaScript**: Se usa `centerAlphabet` sin ñ para seleccionar centro
3. **En Exóticos**: `INVALID_CENTER_LETTERS` incluye ñ
4. **Validación**: `isValidLetterSet` rechaza ñ como centro

## Ejemplo

```typescript
// Puzzle válido con ñ en outer
{
  id: "puzzle-001",
  center: "a",           // ✓ No es ñ
  outer: ["ñ", "o", "s", "r", "t", "e"],  // ✓ ñ permitida aquí
  allowEnye: true
}

// Puzzle inválido (nunca se generará)
{
  id: "puzzle-002",
  center: "ñ",           // ✗ NUNCA puede ser ñ
  outer: ["a", "o", "s", "r", "t", "e"],
  allowEnye: true
}
```

## Próximos Pasos

1. ✅ Actualizar el archivo `public/wordlist.txt` con palabras que contengan ñ
2. 🔄 Regenerar puzzles con el nuevo diccionario
3. 🧪 Probar que las palabras con ñ se validan correctamente
4. 📝 Verificar que la UI muestra correctamente la letra ñ

## Notas Técnicas

- **Normalización**: La ñ se preserva en `normalizeChar` cuando `allowEnye: true`
- **Bitmask**: La ñ usa el bit 26 (después de a-z que usan 0-25)
- **Compatibilidad**: El operador `??` se usa en lugar de `||` para permitir `false` explícito
