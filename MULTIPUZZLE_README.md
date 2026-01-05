# Heptagramas - Sistema de Múltiples Puzzles

## Cambios Implementados

### 1. Sistema de Puzzles Múltiples
- **22 puzzles clásicos** disponibles en `src/data/puzzles.json`
- Cada puzzle tiene: id, título, letra central, 6 letras exteriores
- Soluciones calculadas dinámicamente desde el diccionario (no hardcodeadas)

### 2. Puzzle del Día
- Implementado en `src/lib/dailyPuzzle.ts`
- Selección determinística basada en la fecha local (YYYY-MM-DD)
- Usa hash simple para elegir puzzle del array
- Mismo puzzle para todos los usuarios en la misma fecha

### 3. Progreso por Puzzle
- **Nuevo sistema de persistencia** en `src/lib/storage.ts`
- Cada puzzle guarda su progreso individual:
  - `foundWords[]`: palabras encontradas
  - `score`: puntuación acumulada
  - `superHeptasFound[]`: palabras de 7 letras encontradas
  - `lastPlayedAt`: timestamp ISO de última jugada
- Almacenamiento en localStorage bajo clave `heptagramas_progressByPuzzle`

### 4. Selector de Puzzles
- Componente `PuzzleSelector.tsx` con modal overlay
- **Botón "Puzzle del Día"** destacado con gradiente
- **Grid de puzzles** mostrando:
  - Número del puzzle
  - Letra central y letras exteriores
  - Progreso (palabras encontradas, SuperHeptas)
  - Badge "HOY" para el puzzle del día
  - Badge "Actual" para el puzzle en curso
- Diseño responsive para móviles

### 5. Funcionalidades Mantenidas
✅ Input por teclado y por clicks en letras  
✅ Botón reordenar (shuffle) letras exteriores  
✅ Detección de SuperHepta (palabras de 7 letras)  
✅ Indicador ⭐ en palabras SuperHepta  
✅ Contador de progreso (Principiante/Aprendiz/Avanzado/Experto)  
✅ Validación dinámica con diccionario  
✅ Diseño SVG hexagonal con gaps perfectos  

## Archivos Modificados

### Nuevos Archivos
1. `src/lib/dailyPuzzle.ts` - Lógica de puzzle del día
2. `src/components/PuzzleSelector.tsx` - Modal de selección de puzzles
3. `src/data/puzzles.json` - 22 puzzles (reemplazó versión con soluciones hardcodeadas)

### Archivos Modificados
1. `src/lib/storage.ts` - Sistema de progreso por puzzle
2. `src/types.ts` - Actualizado interface Puzzle (removió `solutions`)
3. `src/App.tsx` - Integración completa del sistema
4. `src/App.css` - Estilos para selector de puzzles

## Estructura de Datos

### PuzzleProgress
```typescript
{
  foundWords: string[];
  score: number;
  superHeptasFound: string[];
  lastPlayedAt: string; // ISO 8601
}
```

### Almacenamiento en localStorage
- `heptagramas_progressByPuzzle`: `Record<puzzleId, PuzzleProgress>`
- `heptagramas_currentPuzzleId`: ID del puzzle activo
- `heptagramas_settings`: Configuración (soundEnabled, etc.)

## Cómo Usar

### Ejecutar la app
```bash
npm run dev
```

### Cambiar de puzzle
1. Click en botón "📋 Cambiar" en el header
2. Seleccionar "Puzzle del Día" o cualquier puzzle de la lista
3. El progreso del puzzle anterior se guarda automáticamente

### Agregar más puzzles
Editar `src/data/puzzles.json`:
```json
{
  "id": "puzzle-023",
  "title": "Puzzle 23: Descripción",
  "center": "letra_central",
  "outer": ["l1", "l2", "l3", "l4", "l5", "l6"],
  "mode": "classic",
  "minLen": 3,
  "allowEnye": false
}
```

## Checklist de Pruebas Manuales

### ✅ Puzzle del Día
- [ ] Al abrir por primera vez, carga el puzzle del día
- [ ] El puzzle del día tiene badge "HOY" en el selector
- [ ] Mañana (cambio de fecha) se selecciona otro puzzle automáticamente

### ✅ Selector de Puzzles
- [ ] Botón "📋 Cambiar" abre el modal
- [ ] Botón "X" cierra el modal
- [ ] Click fuera del modal lo cierra
- [ ] Botón "Puzzle del Día" carga el puzzle correcto
- [ ] Click en cualquier puzzle lo carga correctamente
- [ ] El puzzle actual muestra badge "Actual"

### ✅ Progreso Individual por Puzzle
- [ ] Encontrar palabras en Puzzle 1, cambiar a Puzzle 2
- [ ] Encontrar palabras en Puzzle 2, volver a Puzzle 1
- [ ] Las palabras del Puzzle 1 se mantienen guardadas
- [ ] Cada puzzle muestra su contador de progreso correcto
- [ ] SuperHeptas se guardan por puzzle independientemente

### ✅ Persistencia
- [ ] Recargar página mantiene el puzzle actual
- [ ] Recargar página mantiene el progreso de todos los puzzles
- [ ] Cerrar y abrir navegador mantiene todo el progreso

### ✅ Funcionalidades Existentes
- [ ] Input por teclado funciona
- [ ] Click en letras del tablero funciona
- [ ] Botón X limpia la palabra
- [ ] Backspace borra letra por letra
- [ ] Botón "Reordenar" mezcla letras exteriores
- [ ] SuperHepta muestra mensaje especial
- [ ] Palabras SuperHepta tienen ⭐
- [ ] Nivel de progreso se actualiza (Principiante→Experto)

### ✅ Validación
- [ ] Rechaza palabras muy cortas (<3 letras)
- [ ] Rechaza palabras sin la letra central
- [ ] Rechaza palabras con letras no permitidas
- [ ] Rechaza palabras repetidas
- [ ] Acepta palabras válidas del diccionario

### ✅ UI/UX
- [ ] Diseño hexagonal se ve bien en desktop
- [ ] Diseño hexagonal se ve bien en móvil
- [ ] Modal de selector responsive en móvil
- [ ] Animaciones smooth en hover
- [ ] Feedback visual al hacer click en letras
- [ ] Mensajes de error/éxito se muestran correctamente

## Notas Técnicas

### Performance
- Soluciones de puzzle se calculan una sola vez por puzzle
- Cache de resultados en memoria durante la sesión
- Bitmask optimization para filtrado rápido (27 bits a-z + ñ)

### Compatibilidad
- localStorage usado para persistencia (disponible en todos los navegadores modernos)
- No requiere backend ni autenticación
- Funciona offline después de primera carga

### Próximas Mejoras (No Implementadas)
- [ ] Modo exótico (puzzles con reglas especiales)
- [ ] Sistema de login/sincronización cloud
- [ ] Estadísticas globales por usuario
- [ ] Animaciones al encontrar palabras
- [ ] Sonidos (toggle en settings)
- [ ] Exportar/importar progreso JSON
- [ ] Router para URLs por puzzle (/puzzle/puzzle-001)
