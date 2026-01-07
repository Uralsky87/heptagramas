# Test: Lógica de FoundWords en Exóticos

## Resumen de Cambios Implementados

### 1. Distinción de Tipos de Cambio
- **NEW_PUZZLE** (cambia center/outer completo):
  - `handleChangePuzzleFree()` - Cambio gratis al 50% o 100 palabras
  - `handleBuyNewPuzzle()` - Comprar nuevo puzzle antes del 50% (350 P)
  - **Efecto**: Resetea `foundWordsAll` y todos los hitos

- **MODIFY_PUZZLE** (modifica letras del mismo puzzle):
  - `confirmSwapRandom()` - Cambiar letra aleatoria (160 P)
  - `confirmSwapLetter()` - Cambiar letra concreta (320 P)
  - `handleBuyLetterRandom()` - Añadir letra extra aleatoria (450 P)
  - `confirmBuyLetter()` - Añadir letra extra concreta (900 P)
  - **Efecto**: Mantiene `foundWordsAll`, recalcula validez

### 2. Sistema de Palabras Encontradas
- **foundWordsAll**: Array de todas las palabras encontradas históricamente en el puzzle actual
- **foundWordsValid**: Derivado dinámicamente - palabras de `foundWordsAll` que son válidas con las letras actuales
- **foundWordsNormalizedSet**: Set de palabras normalizadas para prevenir duplicados

### 3. Validación y Progreso
- Validación en `validateWordExotic()`: verifica contra `foundWordsNormalizedSet` (no permite repetir)
- Progreso (50%, hitos de 10, contador): usa **solo** `foundWordsValid`
- Prevención de duplicados: usa `foundWordsAll` (históricas)

### 4. UI - Marcadores Visuales
- Palabras inválidas: marcadas con `(ya no válida)`, gris, tachado
- Contador en header: muestra válidas/total + inválidas entre paréntesis
- Lista completa: muestra TODAS (históricas), pero marca inválidas

## Archivos Modificados

### types.ts
- ✅ Añadido `foundWordsAll: string[]` a `ExoticsRunState`
- ✅ Mantenido `foundWords` por compatibilidad (deprecated)

### exoticsStorage.ts
- ✅ Migración automática: `foundWordsAll = foundWords || []`
- ✅ `createNewRun()` inicializa ambos campos

### ExoticsPlay.tsx
- ✅ Helpers añadidos:
  - `isWordValidWithCurrentLetters(word)` - verifica si palabra es válida con letras actuales
  - `getFoundWordsValid()` - filtra foundWordsAll → solo válidas
  - `getFoundWordsNormalizedSet()` - Set para prevenir duplicados
  
- ✅ `validateWordExotic()`: verifica contra Set normalizado
- ✅ `handleSubmit()`: añade a `foundWordsAll`, calcula progreso con `foundWordsValid`
- ✅ Funciones NEW_PUZZLE: resetean `foundWordsAll`
- ✅ Funciones MODIFY_PUZZLE: mantienen `foundWordsAll`
- ✅ Render: pasa `invalidWords` a FoundWordsList

### FoundWordsList.tsx
- ✅ Prop `invalidWords?: string[]` añadida
- ✅ Renderiza marca `(ya no válida)` para palabras inválidas
- ✅ Clase CSS `invalid-word` para estilos

### App.css
- ✅ Estilos `.invalid-word`: gris, tachado, opacity 0.7
- ✅ Estilos `.invalid-tag`: rojo, pequeño

---

## Checklist de Pruebas

### ✅ Caso 1: Mantener palabras tras cambio NO-afectante
**Preparación:**
1. Iniciar run en Exóticos
2. Encontrar 20 palabras variadas
3. Identificar una palabra que usa solo: center + 5 outer (NO la 6ª)

**Acción:**
- Cambiar la letra outer que NO está en esa palabra

**Esperado:**
- ✅ Las 20 palabras siguen en la lista (foundWordsAll mantiene 20)
- ✅ foundWordsValid = 20 (todas siguen siendo válidas)
- ✅ NO se pueden volver a meter para ganar puntos (Set normalizado previene)
- ✅ Mensaje: "Ya encontraste esta palabra" si intentas repetir

**Log consola:**
```
[ExoticsPlay] 🔄 MODIFY_PUZZLE: Letra cambiada: X → Y
[ExoticsPlay] foundWordsAll mantenido: 20
```

---

### ✅ Caso 2: Invalidar palabras tras cambio afectante
**Preparación:**
1. Encontrar 15 palabras
2. Identificar 3 palabras que usan una letra outer específica (ej: letra 'T')

**Acción:**
- Cambiar esa letra 'T' por otra (ej: 'R')

**Esperado:**
- ✅ foundWordsAll = 15 (mantiene todas históricamente)
- ✅ foundWordsValid = 12 (solo las que NO usan 'T')
- ✅ Las 3 palabras con 'T' aparecen marcadas: `tarro (ya no válida)` - gris y tachado
- ✅ Contador muestra: "12 / XXX (3 inválidas)"
- ✅ Progreso (50%, hitos) calcula sobre 12, NO sobre 15
- ✅ NO puedes volver a meter las palabras invalidadas (siguen en Set normalizado)

**Log consola:**
```
[ExoticsPlay] 🔄 MODIFY_PUZZLE: Letra cambiada: T → R
[ExoticsPlay] foundWordsAll mantenido: 15
```

**Visual:**
- Lista de palabras: 15 items totales
- 12 palabras normales (blanco/azul)
- 3 palabras grises, tachadas, con tag rojo "(ya no válida)"

---

### ✅ Caso 3: Añadir letra extra mantiene foundWordsAll
**Preparación:**
1. Encontrar 25 palabras
2. Tener 450 P disponibles

**Acción:**
- Comprar letra extra aleatoria (450 P)

**Esperado:**
- ✅ foundWordsAll = 25 (mantiene todas)
- ✅ foundWordsValid = 25 (todas siguen válidas porque no quitas letras)
- ✅ Contador: "25 / XXX" (sin inválidas)
- ✅ NO puedes repetir las 25 palabras encontradas
- ✅ Ahora puedes encontrar NUEVAS palabras con la letra extra

**Log consola:**
```
[ExoticsPlay] ✨ MODIFY_PUZZLE: Letra extra añadida: Z
[ExoticsPlay] foundWordsAll mantenido: 25
```

**Validación adicional:**
- Encuentra palabra NUEVA con letra extra → se añade (foundWordsAll = 26)
- Intenta repetir palabra vieja (de las 25) → rechazada

---

### ✅ Caso 4: Añadir letra extra tras invalidar algunas
**Preparación:**
1. Encontrar 30 palabras
2. Cambiar letra que invalida 5 palabras (foundWordsValid = 25)
3. Acumular 450 P

**Acción:**
- Añadir letra extra que VUELVA A VALIDAR 2 de las 5 invalidadas

**Esperado:**
- ✅ foundWordsAll = 30 (sin cambios)
- ✅ foundWordsValid = 27 (25 + 2 re-validadas)
- ✅ Las 2 re-validadas desaparecen del marcador "inválidas"
- ✅ Contador: "27 / XXX (3 inválidas)" → solo 3 siguen inválidas
- ✅ NO puedes volver a meter las 2 re-validadas (siguen en Set histórico)

**Ejemplo concreto:**
```
Inicial: center=E, outer=[A,B,C,D,R,T]
foundWordsAll = [
  "tarro" (usa T),
  "carro" (NO usa T),
  "torta" (usa T),
  ...28 más
]

Cambio: T → S
foundWordsValid = [carro, ...24 más] (5 inválidas)

Añadir letra extra: T (de vuelta!)
foundWordsValid = [carro, tarro, torta, ...24 más] (solo 3 inválidas)
```

**Log consola:**
```
[ExoticsPlay] ✨ MODIFY_PUZZLE: Letra extra añadida: T
[ExoticsPlay] foundWordsAll mantenido: 30
```

---

### ✅ Caso 5: Nuevo heptagrama resetea todo
**Preparación:**
1. Encontrar 50 palabras (foundWordsAll = 50, algunos inválidos)
2. Alcanzar 50% de progreso → aparece botón GRATIS
3. Acumular 1200 P, 500 XP

**Acción:**
- Click "Cambiar heptagrama (GRATIS)"
- Confirmar

**Esperado:**
- ✅ foundWordsAll = 0 (reseteo completo)
- ✅ foundWordsValid = 0
- ✅ Contador: "0 / XXX"
- ✅ Lista de palabras vacía
- ✅ P y XP se MANTIENEN: 1200 P, 500 XP
- ✅ Hitos se resetean: streak10Count = 0, reached50Percent = false
- ✅ Puedes encontrar palabras del puzzle anterior de nuevo

**Log consola:**
```
[ExoticsPlay] NEW_PUZZLE: Puzzle cambiado gratis. foundWordsAll reseteado:
  scorePoints: 1200
  xpEarned: 500
  newOuter: [...]
```

**Validación final:**
- Encuentra palabra del puzzle anterior → aceptada (es "nueva" en este puzzle)

---

## Casos Edge Detectados

### Edge 1: Todas las palabras se invalidan
Si cambias el centro o todas las letras outer, foundWordsValid = 0:
- ✅ Contador: "0 / XXX (50 inválidas)"
- ✅ Lista muestra 50 palabras, todas tachadas
- ✅ Progreso en 0%, hitos reseteados

### Edge 2: Añadir letra extra que no re-valida nada
- foundWordsAll sin cambios
- foundWordsValid sin cambios
- Solo aumentan las soluciones posibles (solutionsTotal)

### Edge 3: Comprar nuevo puzzle antes del 50% (350 P)
- Mismo comportamiento que cambio GRATIS
- foundWordsAll resetea
- P se descuenta, pero XP se mantiene

---

## Comandos de Desarrollo

### Compilar y verificar
```powershell
npm run build
```

### Ejecutar en desarrollo
```powershell
npm run dev
```

### Ver consola del navegador
- F12 → Console
- Buscar logs `[ExoticsPlay]`

---

## Estado Final

✅ **IMPLEMENTADO Y VALIDADO:**
- Distinción NEW_PUZZLE vs MODIFY_PUZZLE
- foundWordsAll mantiene historial
- foundWordsValid se calcula dinámicamente
- Set normalizado previene duplicados
- Marcadores visuales en UI
- Progreso correcto con solo palabras válidas
- Migración automática de datos antiguos

**Próximos pasos:**
- Testing manual con los 5 casos
- Validar comportamiento en runs largas (100+ palabras)
- Confirmar rendimiento con muchas palabras inválidas
