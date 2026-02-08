# 🌟 Heptagramas

Juego de palabras tipo puzzle con 7 letras (1 central + 6 exteriores). Construido con React + Vite + TypeScript.

## 📋 Características

- **Navegación Multi-Pantalla**: Home → Daily/Classic/Exotic
- **Puzzle Diario**: Sistema de puzzles diarios con historial de 7 días
- **Puzzles Clásicos**: Lista completa de puzzles con progreso individual
- **Puzzle con 7 letras**: 1 letra central obligatoria + 6 letras exteriores
- **Validación de palabras**: Solo palabras de 3+ letras que incluyan la letra central
- **Contador real**: Muestra palabras encontradas / total de soluciones
- **Estadísticas**: Distribución de letras y palabras superhéptice (7+ letras)
- **Botón Reordenar**: Baraja solo las 6 letras exteriores (central fija)
- **Persistencia**: Guarda progreso en localStorage automáticamente
- **Generador OFFLINE**: Script para crear pools de puzzles personalizados
- **Diseño mobile-first**: Interfaz optimizada para dispositivos móviles

## 🚀 Ejecución rápida

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir en el navegador (generalmente http://localhost:5173)
```

## 📁 Estructura del proyecto

```
src/
├── components/              # Componentes de UI
│   ├── Home.tsx                # Menú principal
│   ├── DailyScreen.tsx         # Lista de puzzles diarios (hoy + historial)
│   ├── ClassicList.tsx         # Lista de puzzles clásicos
│   ├── Game.tsx                # Pantalla principal de juego
│   ├── HeptagramBoard.tsx      # Tablero con 7 letras + botón Reordenar
│   ├── WordInput.tsx           # Input y botón Enviar
│   ├── FoundWordsList.tsx      # Lista de palabras encontradas
│   └── PuzzleStats.tsx         # Estadísticas del puzzle
├── lib/                     # Lógica del juego
│   ├── dictionary.ts           # Motor de diccionario con bitmasks
│   ├── normalizeChar.ts        # Normalización de caracteres
│   ├── normalizeWord.ts        # Normalización de palabras
│   ├── validateWord.ts         # Validación completa de palabras
│   ├── solvePuzzle.ts          # Resolución y caching de soluciones
│   ├── dailySession.ts         # Sistema de sesiones diarias
│   └── storage.ts              # Persistencia en localStorage
├── data/
│   ├── puzzles.json            # Puzzles disponibles (daily + classic)
│   └── wordlist.txt            # Diccionario de palabras
├── scripts/
│   ├── generatePuzzles.cjs     # Generador OFFLINE de puzzles
│   ├── GENERATOR_README.md     # Documentación del generador
│   └── example-config.json     # Configuraciones de ejemplo
├── types.ts                 # Interfaces TypeScript
├── App.tsx                  # Componente principal (navegación)
└── App.css                  # Estilos mobile-first
```

## 🎮 Cómo jugar

1. **Objetivo**: Encuentra todas las palabras posibles usando las 7 letras
2. **Reglas**:
   - Mínimo 3 letras
   - Debe contener la letra central (destacada en color diferente)
   - Solo puedes usar las letras del heptagrama
   - Las letras se pueden repetir
3. **Controles**:
   - Escribe una palabra y presiona Enter o "Enviar"
   - Usa "🔄 Reordenar" para barajar las letras exteriores

## 🔧 Construcción

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

Los archivos optimizados se generan en `dist/`.

## 📱 Integración con Capacitor (futuro)

Para empaquetar como app móvil nativa:

```bash
# 1. Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 2. Inicializar Capacitor
npx cap init

# 3. Hacer build del proyecto
npm run build

# 4. Añadir plataformas
npx cap add android
npx cap add ios

# 5. Sincronizar
npx cap sync

# 6. Abrir en IDE nativo
npx cap open android
npx cap open ios
```

**Nota**: Actualmente el proyecto funciona 100% en navegador. La integración con Capacitor está preparada pero no implementada.

## ➕ Añadir nuevos puzzles

### Opción 1: Generador Automático (Recomendado)

Usa el generador OFFLINE para crear pools completos de puzzles:

```bash
# Generar puzzles con configuración por defecto
node scripts/generatePuzzles.cjs

# Ver opciones disponibles
node scripts/generatePuzzles.cjs --help

# Ejemplo: Generar 5000 candidatos con rangos personalizados
node scripts/generatePuzzles.cjs --candidates 5000 --daily-min 70 --daily-max 170
```

**Ver documentación completa**: [scripts/GENERATOR_README.md](scripts/GENERATOR_README.md)

El generador:
- ✅id`: Identificador único (formato: `daily-XXX` o `classic-XXX`)
- `center`: 1 letra central (minúscula)
- `outer`: Array de 6 letras exteriores (minúsculas)
- `mode`: `"daily"` o `"classic"`
- `minLen`: Longitud mínima de palabra (default: 3)
- `allowEnye`: `true` si permite ñ (default: false)
- Las soluciones se calculan automáticamente del diccionario
### Opción 2: Manual

Edita `src/data/puzzles.json`:

```json
{
  "id": "daily-042",
  "title": "Diario #042: 95 palabras",
  "center": "e",
  "outer": ["s", "t", "r", "a", "n", "m"],
  "mode": "daily",
  "minLen": 3,
  "allowEnye": false
}
```

**Importante**:
- `center`: 1 letra (minúscula)
- `outer`: Array de 6 letras (minúsculas)
- `solutions`: Array de palabras válidas (minúsculas, sin acentos)
- Todas las soluciones deben:
  - Contener la letra central
  - Usar solo letras de center + outer
  - Tener 3+ letras

## 🎨 Personalización

### Cambiar colores del heptagrama

Edita `src/App.css`:

```css
.cell.outer {
  background: linear-gradient(135deg, #TU_COLOR_1, #TU_COLOR_2);
}

.cell.center {
  background: linear-gradient(135deg, #TU_COLOR_3, #TU_COLOR_4);
}
```

### Añadir puntuación

La arquitectura ya tiene `score` en el estado. Para implementar:

1. En `App.tsx`, modifica `handleSubmit` para calcular puntos
2. Añade un componente `ScoreBar` para mostrar el puntaje
3. Guarda/carga automáticamente desde localStorage (ya implementado)

## 🧪 Testing manual

### Checklist de pruebas

- [ ] La app carga sin errores
- [ ] Se muestran 7 letras (1 central + 6 exteriores)
- [ ] El contador muestra "0 / X" (X = número real de soluciones)
- [ ] Puedo escribir una palabra y enviarla
- [ ] **Validaciones**:
  - [ ] Rechaza palabras < 3 letras
  - [ ] Rechaza palabras sin letra central
  - [ ] Rechaza palabras con letras no permitidas
  - [ ] Rechaza palabras no en el diccionario
  - [ ] Rechaza palabras repetidas
- [ ] Al acertar:
  - [ ] Muestra mensaje "¡Bien! ✓"
  - [ ] Añade palabra a la lista
  - [ ] Incrementa contador (ej: 1 / 38)
  - [ ] Limpia el input
- [ ] El botón "🔄 Reordenar":
  - [ ] Baraja solo las 6 letras exteriores
  - [ ] La letra central NO cambia de posición
- [ ] **Persistencia**:
  - [ ] Recarga la página → mantiene progreso
  - [ ] Cierra y abre pestaña → mantiene progreso
- [ ] **Responsive**: Se ve bien en móvil (< 480px)

### Palabras de prueba (Puzzle "Clásico 1")

Prueba con el primer puzzle (center: "a", outer: ["r","t","e","l","s","o"]):

✅ Válidas: `ala`, `sala`, `lata`, `tarta`, `sola`, `rata`  
❌ Inválidas: `sol` (no tiene "a"), `te` (< 3 letras), `perro` (letras no permitidas)

## 🛠️ Tecnologías

- **React 18** - Framework de UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **CSS3** - Estilos modernos con gradientes y animaciones

## 📝 Licencia

MIT - Úsalo como quieras.

---

**¡Diviértete jugando y modificando Heptagramas!** 🎉

import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
