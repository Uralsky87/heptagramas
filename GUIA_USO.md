# 🎮 HEPTAGRAMAS - Guía de Uso

## ✅ Estado del Proyecto

**TODOS LOS PROBLEMAS RESUELTOS:**
- ✅ Normalización consistente (sin falsos positivos)
- ✅ Puzzles sin letras duplicadas
- ✅ Rango de soluciones 100-300 por puzzle
- ✅ 22 puzzles válidos generados

---

## 🚀 Inicio Rápido

### Desarrollo
```bash
npm run dev
```

La app estará disponible en: http://localhost:5173

---

## 🎯 Características

### Puzzle Clásico
- 7 letras (1 central + 6 exteriores)
- Forma palabras usando la letra central
- Mínimo 3 letras por palabra
- 100-300 palabras posibles por puzzle

### SuperHeptas ⭐
- Palabras que usan las 7 letras
- Bonus de puntos extra
- Garantizado al menos 1 por puzzle

### Progreso por Puzzle
- Guardado automático en localStorage
- Rastreo de palabras encontradas
- Selector de puzzles con indicadores de progreso

### Puzzle del Día 📅
- Cambia cada día
- Mismo puzzle para todos los usuarios
- Algoritmo determinista basado en fecha

---

## 🛠️ Herramientas para Desarrolladores

### Regenerar Puzzles
```bash
npm run generate-puzzles
```

**Qué hace:**
1. Carga diccionario (72,165 palabras)
2. Genera 22 puzzles válidos
3. Valida:
   - 6 letras únicas en outer
   - Center NO en outer
   - 100-300 soluciones
   - Al menos 1 SuperHepta
4. Guarda en `src/data/puzzles.json`

**Tiempo estimado:** 1-2 minutos

### Test en Navegador
Abrir consola del navegador (F12) y ejecutar:

```javascript
// Test de puzzle específico
testPuzzle("puzzle-001")

// Test del primer puzzle
testPuzzle()
```

**Muestra:**
- Información del puzzle
- Total de soluciones
- Primeras 10 palabras válidas
- SuperHeptas encontrados
- Estadísticas (palabra más corta/larga)

---

## 📋 Estructura del Proyecto

```
src/
├── lib/
│   ├── normalizeChar.ts       # Sistema de normalización (NUEVO)
│   ├── validateWord.ts         # Validación de palabras (ACTUALIZADO)
│   ├── dictionary.ts           # Carga de diccionario (ACTUALIZADO)
│   ├── puzzleGenerator.ts     # Generador de puzzles (NUEVO)
│   ├── testPuzzle.ts          # Test interactivo (NUEVO)
│   ├── solvePuzzle.ts         # Resolver puzzles
│   └── storage.ts             # localStorage helpers
│
├── scripts/
│   └── validateAndGeneratePuzzles.ts  # Script CLI (NUEVO)
│
├── data/
│   └── puzzles.json           # 22 puzzles validados (ACTUALIZADO)
│
├── components/
│   ├── HeptagramBoardSvg.tsx  # Tablero hexagonal SVG
│   ├── WordInput.tsx          # Input de palabras
│   ├── FoundWordsList.tsx     # Lista de palabras encontradas
│   └── PuzzleSelector.tsx     # Selector de puzzles
│
└── App.tsx                     # Componente principal
```

---

## 🧪 Testing

### Test Manual de Normalización
En consola del navegador:
```javascript
// Probar normalización
normalizeString("área", false)  // → "area"
normalizeString("niño", false)  // → "nino"
normalizeString("café", false)  // → "cafe"
```

### Test de Validación
Jugar con palabras que tengan diacríticos:
- Escribir "área" con letras A, R, E en el puzzle
- Debería aceptarse como "area" ✅
- Sin mensaje de error de letras inválidas ✅

### Test de Puzzles
Verificar que todos tengan:
- [ ] 6 letras únicas en exteriores
- [ ] Centro no repetido en exteriores
- [ ] 100-300 soluciones
- [ ] Al menos 1 SuperHepta

```bash
npm run generate-puzzles
# Verificar output muestra todos los checks ✓
```

---

## 🐛 Debugging

### Modo DEV - Logging Activado
Al jugar en desarrollo (`npm run dev`), la consola mostrará:
```
Palabra rechazada por letra inválida: 'x' (code: 120) no está en allowedSet
```

### Regenerar Puzzles si hay Problemas
Si encuentras puzzles inválidos:
```bash
npm run generate-puzzles
```

### Limpiar Progreso
Abrir consola del navegador:
```javascript
localStorage.clear()
location.reload()
```

---

## 📊 Estadísticas Actuales

| Métrica | Valor |
|---------|-------|
| Total puzzles | 22 |
| Palabras en diccionario | 72,165 |
| Soluciones por puzzle | 100-300 |
| SuperHeptas por puzzle | ≥1 |
| Modo actual | Clásico (sin ñ) |

---

## 🔧 Configuración

### Modificar Rango de Soluciones
Editar `src/scripts/validateAndGeneratePuzzles.ts`:
```typescript
const newPuzzles = await generateValidPuzzles(
  dictionary,
  22,   // cantidad de puzzles
  100,  // ← cambiar mínimo de soluciones
  300   // ← cambiar máximo de soluciones
);
```

### Agregar Más Puzzles
```typescript
const newPuzzles = await generateValidPuzzles(
  dictionary,
  50,   // ← cambiar cantidad
  100,
  300
);
```

---

## 📚 Documentación Adicional

- [FIXES_README.md](./FIXES_README.md) - Detalles técnicos de los fixes
- [RESUMEN_FINAL.md](./RESUMEN_FINAL.md) - Resumen ejecutivo
- [MULTIPUZZLE_README.md](./MULTIPUZZLE_README.md) - Sistema multi-puzzle

---

## 🎯 Checklist de Funcionalidad

### Juego Base
- [x] Formar palabras clickeando letras
- [x] Validación de palabras vs diccionario
- [x] Detección de SuperHeptas
- [x] Sistema de puntos
- [x] Guardado automático de progreso

### Multi-Puzzle
- [x] 22 puzzles diferentes
- [x] Selector con vista de progreso
- [x] Puzzle del día
- [x] Progreso independiente por puzzle

### Calidad
- [x] Sin falsos positivos en validación
- [x] Sin letras duplicadas en puzzles
- [x] Rango consistente de soluciones (100-300)
- [x] Al menos 1 SuperHepta por puzzle

---

## 🚀 ¡Listo para Jugar!

1. Ejecutar: `npm run dev`
2. Abrir: http://localhost:5173
3. Seleccionar un puzzle o jugar el "Puzzle del Día"
4. ¡Encontrar todas las palabras!

---

**Versión:** 1.0 (Todos los problemas resueltos)
**Estado:** ✅ FUNCIONAL Y TESTEADO
