# 🔍 Code Review - Palabrarium

Análisis completo del código en busca de bugs, errores potenciales y optimizaciones.

---

## 🐛 BUGS Y ERRORES CRÍTICOS

### 1. **⚠️ Missing dependency in useEffect** - `Game.tsx` (Línea 116)
**Severidad**: MEDIA

```tsx
// PROBLEMA: savePuzzleProgressState no está en dependencias
useEffect(() => {
  if (foundWords.length > 0 || score > 0) {
    savePuzzleProgressState();
  }
}, [foundWords, score, achievements]); // ❌ Falta progressId
```

**Impacto**: Si `progressId` cambia, el progreso podría guardarse en la progreso anterior.

**Solución**:
```tsx
useEffect(() => {
  if (foundWords.length > 0 || score > 0) {
    savePuzzleProgressState();
  }
}, [foundWords, score, achievements, progressId]); // ✅ Agregado
```

---

### 2. **⚠️ Memory leak potencial en setTimeout** - `Game.tsx` (Línea 171)
**Severidad**: MEDIA

```tsx
// ❌ setTimeout sin limpiar
setTimeout(() => {
  setShowXPReward(false);
}, 4000);
```

**Impacto**: Si el componente se desmonta antes de 4 segundos, el timeout intentará actualizar estado en componente desmontado.

**Solución**:
```tsx
useEffect(() => {
  if (!showXPReward) return;
  
  const timer = setTimeout(() => {
    setShowXPReward(false);
  }, 4000);
  
  return () => clearTimeout(timer);
}, [showXPReward]);
```

---

### 3. **⚠️ Lógica incorrecta en handlePopState** - `App.tsx` (Línea 79)
**Severidad**: MEDIA

```tsx
// ❌ PROBLEMA: El evento popstate ya previene la navegación
// pero luego permite que el navegador salga de la app
const handlePopState = (event: PopStateEvent) => {
  event.preventDefault(); // Esto no previene salir de la app
  
  if (currentScreen === 'home') {
    return; // Permitir salir de la app
  }
  // ...
};
```

**Impacto**: En home, el usuario nunca puede salir con el botón atrás porque el evento ya está prevenido.

**Solución**: El comportamiento es correcto (solo prevenir en pantallas no-home), pero necesita mejor documentación.

---

### 4. **⚠️ Race condition en loadPuzzleProgressState** - `Game.tsx` (Línea 85)
**Severidad**: MEDIA

```tsx
const loadPuzzleProgressState = async (progressIdToLoad: string) => {
  await preloadPuzzleProgress(progressIdToLoad); // Async
  const progress = loadPuzzleProgress(progressIdToLoad); // Sync
};
```

Si `progressIdToLoad` cambia antes de que `preloadPuzzleProgress` termine, se cargará el progreso equivocado.

**Solución**:
```tsx
const loadPuzzleProgressState = async (progressIdToLoad: string) => {
  await preloadPuzzleProgress(progressIdToLoad);
  // Verificar que el progressId sigue siendo el mismo
  if (progressIdToLoad !== progressId) return;
  
  const progress = loadPuzzleProgress(progressIdToLoad);
  // ...
};
```

---

### 5. **⚠️ Casting inseguro con `any`** - `App.tsx` (Línea 53)
**Severidad**: BAJA

```tsx
(window as any).__playerStateCache = playerState; // ❌ Unsafe
```

**Solución**:
```tsx
interface HeptagramasWindow extends Window {
  __playerStateCache?: PlayerState;
}
const win = window as HeptagramasWindow;
win.__playerStateCache = playerState;
```

---

### 6. **⚠️ Normalización inconsistente en validateWord** - `validateWord.ts`
**Severidad**: MEDIA

Las palabras se normalizan con `normalizeString` pero algunas validaciones usan comparaciones case-sensitive.

---

## 🚀 OPTIMIZACIONES RECOMENDADAS

### 1. **Usar useMemo para calculateSessionXP**
```tsx
// ANTES: Se recalcula en cada render
const xpReward = calculateSessionXP(
  foundWords.length,
  puzzleSolutions.length,
  achievements.superHeptaWords.length,
  mode
);

// DESPUÉS: Memoizar
const xpReward = useMemo(() => 
  calculateSessionXP(
    foundWords.length,
    puzzleSolutions.length,
    achievements.superHeptaWords.length,
    mode
  ),
  [foundWords.length, puzzleSolutions.length, achievements.superHeptaWords.length, mode]
);
```

---

### 2. **Usar useCallback para handlers**
Los handlers `handleLetterClick`, `handleClearClicked`, etc. deberían estar memorizados para evitar re-renders innecesarios en `WordInput`.

```tsx
const handleLetterClick = useCallback((letter: string) => {
  setClickedWord(prev => prev + letter.toLowerCase());
}, []);
```

---

### 3. **Virtualización en ClassicList**
Si hay muchos puzzles (>100), implementar virtualización:

```tsx
import { FixedSizeList } from 'react-window';

// En lugar de mapear todos los puzzles, usar una lista virtual
```

---

### 4. **Web Workers para cálculos pesados**
`solvePuzzle` es intensivo en CPU. Para diccionarios grandes, considerar Web Worker:

```tsx
// src/workers/solvePuzzle.worker.ts
self.onmessage = (event) => {
  const solutions = solvePuzzle(...);
  self.postMessage(solutions);
};
```

---

### 5. **Lazy load del diccionario**
Actualmente se carga al iniciar. Considerar cargar por demanda:

```tsx
const [dictionary, setDictionary] = useState<DictionaryData | null>(null);
const [isLoadingDict, setIsLoadingDict] = useState(false);

const ensureDictionaryLoaded = useCallback(async () => {
  if (dictionary || isLoadingDict) return;
  setIsLoadingDict(true);
  const dict = await loadDictionary();
  setDictionary(dict);
  setIsLoadingDict(false);
}, [dictionary, isLoadingDict]);
```

---

### 6. **Remove console.logs en production**
Actualmente hay muchos `console.log` protegidos con `import.meta.env.DEV`, lo que está bien, pero algunos en producción permanecen.

---

## ⚠️ PROBLEMAS POTENCIALES

### 1. **IndexedDB no disponible en navegadores antiguos**
La app depende de IndexedDB, pero no hay fallback explícito.

**Verificar**: ¿Qué ocurre si IndexedDB falla?

---

### 2. **Gestión de estado distribuida**
El estado del jugador se maneja en:
- `storage/api.ts` (IndexedDB)
- `storageAdapter.ts` (Cache en window)
- `lib/exoticsStorage.ts` (Almacenamiento de runs)
- LocalStorage cache

Esto puede causar inconsistencias si no se sincroniza correctamente.

**Recomendación**: Usar un estado manager único (Zustand, Redux, etc.)

---

### 3. **Diccionario se carga en memory**
`loadDictionary()` carga todo el diccionario en RAM. Si el diccionario es muy grande (>10MB), podría causar problemas en dispositivos móviles antiguos.

---

### 4. **No hay validación de entrada**
Los inputs de usuario no se validan contra ataques (XSS, injection, etc.).

**Verificar**: ¿La normalización de strings es segura?

---

### 5. **Posible bug en migración de datos**
En `migration.ts`, línea 83, se intenta parsear `progressById` pero no verifica la estructura antes.

---

## ✅ COSAS BIEN IMPLEMENTADAS

1. ✅ **Uso correcto de TypeScript**: Tipos estrictos, interfaces bien definidas
2. ✅ **Separación de concerns**: `lib/`, `components/`, `storage/` bien organizados
3. ✅ **Sistema de cache**: `solutionCache` y `__playerStateCache` para performance
4. ✅ **Manejo de IndexedDB**: Migración desde localStorage bien hecha
5. ✅ **PWA**: Service Worker, Manifest, offline support configurado
6. ✅ **History API**: Navegación con botón atrás implementada correctamente
7. ✅ **Normalización de caracteres**: Consistente en toda la app (ñ, acentos)
8. ✅ **Error handling**: Try-catch blocks en lugares clave
9. ✅ **Responsive design**: Adaptado a móviles y desktop
10. ✅ **Documentación**: Comentarios útiles en funciones complejas

---

## 🎯 PRIORIDAD DE FIXES

1. **ALTA**: Fix #1 (Missing dependency) - Impacta data consistency
2. **ALTA**: Fix #2 (Memory leak) - Impacta performance
3. **MEDIA**: Fix #3 (handlePopState logic) - Verificar comportamiento real
4. **MEDIA**: Fix #4 (Race condition) - Raro pero posible en conexiones lentas
5. **BAJA**: Fix #5 (any casting) - Solo mejora type safety
6. **BAJA**: Fix #6 (Normalización inconsistente) - Verificar si hay bugs reales

---

## 📝 RECOMENDACIONES FINALES

1. **Implementar tests**: Unit tests para `solvePuzzle`, `validateWord`, etc.
2. **Setup linting**: ESLint + Prettier para evitar estos problemas
3. **Type checking estricto**: `noImplicitAny: true` en tsconfig.json
4. **Monitoring**: Agregar Sentry o similar para capturar errores en producción
5. **Performance monitoring**: Medir tiempo de carga del diccionario
6. **Code review**: Implementar PR reviews antes de merge
7. **Automated testing**: CI/CD con tests antes de deploy

---

**Fecha de review**: 28 de enero de 2026
**Estado general**: Código de buena calidad, algunos bugs potenciales que requieren atención
