# Implementación del Sistema de Habilidades Exóticas

## Resumen

Sistema de 8 habilidades compradas con P (puntos) que mejoran la experiencia de juego en el modo Exóticos.

---

## Habilidades Implementadas

### 1. 💡 Pista de Longitud (40 P)
- **Función**: `handleLengthHint()`
- **Efecto**: Muestra panel en sidebar con conteo de palabras restantes por longitud
- **Estado**: `lengthHints: Record<number, number>`
- **UI**: Panel amarillo con lista de longitudes y contadores
- **Permanencia**: Visible hasta que se cierre manualmente

### 2. 🔓 Desbloquear por Inicial (120 P)
- **Función**: `handleUnlockByStartLetter()`
- **Efecto**: Activa permanentemente el contador de palabras por inicial
- **Estado**: `statsUnlocked: true` en ExoticsRunState
- **UI**: Botón se deshabilita tras comprar (solo una vez por run)
- **Permanencia**: Activo hasta finalizar el run

### 3. 🔄 Cambiar Letra Aleatoria (160 P)
- **Función**: `handleSwapLetterRandom()`
- **Efecto**: Cambia una letra del outer por otra disponible aleatoria
- **Lógica**:
  - Selecciona letra del outer al azar
  - Elige nueva letra de `getAvailableLetters()`
  - Regenera puzzle con nueva configuración
- **Restricciones**: No ñ, no duplicados

### 4. 🎯 Cambiar Letra Concreta (320 P)
- **Función**: `handleSwapLetterConcrete()` + `confirmSwapLetter(letter)`
- **Efecto**: Selector de letras para elegir cuál añadir al swap
- **UI**: Modal con grid a-z, letras usadas bloqueadas
- **Lógica**: Similar a aleatoria pero con letra elegida por usuario
- **Restricciones**: No ñ, no duplicados

### 5. ✨ Letra Extra Aleatoria (450 P)
- **Función**: `handleBuyLetterRandom()`
- **Efecto**: Añade letra aleatoria a extraLetters
- **Lógica**: 
  - Elige letra de `getAvailableLetters()`
  - Añade a `extraLetters` array
  - Letra disponible inmediatamente en tablero
- **Restricciones**: No ñ, no duplicados

### 6. 🌟 Letra Extra Concreta (900 P)
- **Función**: `handleBuyLetterConcrete()` + `confirmBuyLetter(letter)`
- **Efecto**: Selector de letras para elegir cuál añadir
- **UI**: Modal con grid a-z, letras usadas bloqueadas
- **Lógica**: Similar a aleatoria pero elegida por usuario
- **Restricciones**: No ñ, no duplicados

### 7. ⚡ Doble Puntos x10 (240 P)
- **Función**: `handleDoublePointsBoost()`
- **Efecto**: Siguientes 10 palabras dan puntos ×2
- **Estado**: `doublePointsRemaining: 10` en ExoticsRunState
- **Lógica en handleSubmit**:
  ```typescript
  if (hasDoublePoints) {
    wordPoints *= 2;
    newState.doublePointsRemaining = currentState.doublePointsRemaining - 1;
  }
  ```
- **IMPORTANTE**: Solo multiplica puntos de palabra, NO bonos de hitos
- **UI**: Mensajes muestran "⚡x2" y "(⚡X restantes)"
- **Restricción**: No se puede comprar si ya está activo

### 8. 🔮 Nuevo Heptagrama (350 P)
- **Función**: `handleBuyNewPuzzle()`
- **Efecto**: Genera nuevo puzzle conservando P y XP
- **Lógica**:
  - Genera nuevo puzzle (50-500 soluciones)
  - Resetea foundWords, extraLetters, progreso
  - CONSERVA scorePoints y xpEarned (menos el coste)
- **Restricción**: Solo disponible si progreso < 50%
- **UI**: Botón deshabilitado si progreso ≥ 50%

---

## Funciones Auxiliares

### `getUsedLetters(): Set<string>`
- Retorna todas las letras actualmente en uso
- Incluye: center + outer + extraLetters
- Usado para prevenir duplicados

### `getAvailableLetters(): string[]`
- Retorna letras disponibles para compra/swap
- Excluye: ñ + letras usadas
- Alfabeto: a-z menos las excluidas

---

## Estados UI

```typescript
const [showAbilitiesPanel, setShowAbilitiesPanel] = useState(false);
const [showLetterSelector, setShowLetterSelector] = useState(false);
const [letterSelectorMode, setLetterSelectorMode] = useState<'swap' | 'buy'>('buy');
const [lengthHints, setLengthHints] = useState<Record<number, number> | null>(null);
```

---

## Integración en handleSubmit

```typescript
// Aplicar multiplicador de doble puntos SOLO a puntos de palabra
let wordPoints = baseWordPoints;
let hasDoublePoints = currentState.doublePointsRemaining > 0;

if (hasDoublePoints) {
  wordPoints *= 2; // Multiplicar SOLO los puntos de la palabra
  newState.doublePointsRemaining = currentState.doublePointsRemaining - 1;
}

// Los bonos de hitos NO se multiplican
const milestoneBonus = calculateMilestoneBonus(newFoundWordsCount);
finalPoints = wordPoints + milestoneBonus; // NO aplicar ×2 al hito
```

---

## Estructura del Modal de Habilidades

```tsx
{showAbilitiesPanel && (
  <div className="modal-overlay" onClick={() => setShowAbilitiesPanel(false)}>
    <div className="abilities-panel" onClick={(e) => e.stopPropagation()}>
      <h2>⚡ Habilidades</h2>
      <p className="abilities-balance">Tu balance: {scorePoints} P</p>
      <div className="abilities-list">
        {/* 8 botones de habilidades */}
        <button
          className="ability-btn"
          onClick={handleXXX}
          disabled={scorePoints < COST || otherCondition}
        >
          <span className="ability-icon">💡</span>
          <span className="ability-name">Nombre</span>
          <span className="ability-cost">{COST} P</span>
        </button>
        {/* ... */}
      </div>
      <button className="btn-close-panel" onClick={() => setShowAbilitiesPanel(false)}>
        Cerrar
      </button>
    </div>
  </div>
)}
```

---

## Estructura del Selector de Letras

```tsx
{showLetterSelector && (
  <div className="modal-overlay" onClick={() => setShowLetterSelector(false)}>
    <div className="letter-selector-panel" onClick={(e) => e.stopPropagation()}>
      <h2>Selecciona letra nueva</h2>
      <p className="selector-cost">
        {letterSelectorMode === 'swap' ? '320 P' : '900 P'}
      </p>
      <div className="letter-grid">
        {getAvailableLetters().map((letter) => (
          <button
            key={letter}
            className="letter-btn"
            onClick={() => {
              if (letterSelectorMode === 'swap') {
                confirmSwapLetter(letter);
              } else {
                confirmBuyLetter(letter);
              }
            }}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      <button className="btn-close-panel" onClick={() => setShowLetterSelector(false)}>
        Cancelar
      </button>
    </div>
  </div>
)}
```

---

## Estilos CSS (exotics-styles.css)

### Clases principales:
- `.modal-overlay`: Fondo oscuro semitransparente
- `.abilities-panel`: Panel blanco centrado con lista de habilidades
- `.ability-btn`: Botón con grid de 3 columnas (icono | nombre | coste)
- `.letter-selector-panel`: Panel para seleccionar letras
- `.letter-grid`: Grid 6×5 con botones de letras
- `.letter-btn`: Botones cuadrados con letra
- `.length-hints-panel`: Panel amarillo con pistas de longitud
- `.btn-abilities`: Botón rosa/morado para abrir panel
- `.btn-close-panel`: Botón gris para cerrar paneles

---

## Reglas Críticas

### 1. No ñ
- `getAvailableLetters()` filtra: `'abcdefghijklmnopqrstuvwxyz'` (sin ñ)

### 2. No Duplicados
- `getUsedLetters()` incluye center + outer + extraLetters
- Antes de añadir/swap letra, se valida que no esté en usedLetters

### 3. Doble Puntos SOLO en Palabras
```typescript
// ✅ CORRECTO
wordPoints *= 2; // Solo puntos de palabra
finalPoints = wordPoints + milestoneBonus; // Hito NO multiplicado

// ❌ INCORRECTO
finalPoints = (wordPoints + milestoneBonus) * 2; // No hacer esto
```

### 4. Restricciones de Compra
- **Desbloquear inicial**: Solo una vez (deshabilitar tras comprar)
- **Doble puntos**: No comprar si `doublePointsRemaining > 0`
- **Nuevo puzzle**: Solo si `progressPercent < 50`

---

## Costes y Balance

| Habilidad | Coste | Comprable múltiples veces |
|-----------|-------|---------------------------|
| 💡 Pista longitud | 40 P | ✅ Sí |
| 🔓 Desbloquear inicial | 120 P | ❌ No (permanente) |
| 🔄 Cambiar aleatoria | 160 P | ✅ Sí |
| 🎯 Cambiar concreta | 320 P | ✅ Sí |
| ✨ Letra aleatoria | 450 P | ✅ Sí |
| 🌟 Letra concreta | 900 P | ✅ Sí |
| ⚡ Doble P x10 | 240 P | ⚠️ No si ya activo |
| 🔮 Nuevo heptagrama | 350 P | ⚠️ No si ≥50% |

---

## Flujo de Trabajo

### Compra Simple (ej: Pista Longitud)
1. Usuario hace clic en "⚡ Habilidades"
2. Panel se abre mostrando 8 habilidades
3. Usuario hace clic en "💡 Pista longitud — 40 P"
4. Función `handleLengthHint()` ejecuta:
   - Valida P ≥ 40
   - Calcula palabras restantes por longitud
   - Actualiza estado con pistas
   - Resta 40 P
   - Guarda en localStorage
   - Cierra panel
5. Panel de pistas aparece en sidebar
6. Usuario puede cerrar pistas con "×"

### Compra con Selector (ej: Letra Concreta)
1. Usuario abre panel de habilidades
2. Hace clic en "🌟 Letra extra concreta — 900 P"
3. Función `handleBuyLetterConcrete()` ejecuta:
   - Valida P ≥ 900
   - Cierra panel de habilidades
   - Abre selector de letras con modo 'buy'
4. Usuario ve grid con letras a-z (sin ñ, sin usadas)
5. Usuario hace clic en letra (ej: "X")
6. Función `confirmBuyLetter('x')` ejecuta:
   - Resta 900 P
   - Añade 'x' a extraLetters
   - Guarda en localStorage
   - Cierra selector
7. Letra "X" aparece en tablero inmediatamente

---

## Testing

Ver archivo completo: **TEST_HABILIDADES_EXOTICAS.md**

### Áreas críticas a probar:
1. ✅ Costes correctos para cada habilidad
2. ✅ Estados deshabilitados (P insuficiente, ya comprado)
3. ✅ Regla de no ñ en selectores
4. ✅ Regla de no duplicados
5. ✅ Doble puntos multiplica SOLO palabra, no hitos
6. ✅ Contador de doble puntos decrementa correctamente
7. ✅ Restricción de 50% en nuevo puzzle
8. ✅ Desbloqueo permanente de estadísticas
9. ✅ Pistas de longitud actualizadas
10. ✅ Persistencia en localStorage

---

## Archivos Modificados

### `src/components/ExoticsPlay.tsx`
- **Líneas añadidas**: ~450 líneas
- **Estados UI**: showAbilitiesPanel, showLetterSelector, letterSelectorMode, lengthHints
- **Funciones**: 10 nuevas funciones de habilidades
- **Integración**: Modificado handleSubmit para doble puntos
- **UI**: Modales, paneles, selectores

### `src/exotics-styles.css`
- **Líneas añadidas**: ~280 líneas
- **Clases nuevas**: 20+ clases CSS
- **Estilos**: Modales, botones, grids, paneles, animaciones

### `TEST_HABILIDADES_EXOTICAS.md`
- Checklist completo de pruebas
- 8 secciones (una por habilidad)
- Casos extremos y verificaciones

---

## Resultado Final

✅ **Sistema de habilidades completamente funcional** con:
- 8 habilidades únicas con diferentes costes
- Selectores de letras con validación (no ñ, no duplicados)
- Sistema de doble puntos integrado
- UI completa con modales y paneles
- Estados persistentes en localStorage
- Restricciones y validaciones correctas
- Testing comprehensivo documentado

**Total de código añadido**: ~730 líneas (450 TS + 280 CSS)
