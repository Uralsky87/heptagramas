# 🎯 Generador de Puzzles - Heptagramas

Generador **OFFLINE** de puzzles para el juego Heptagramas. Crea dos pools de puzzles (diarios y clásicos) basados en un diccionario y criterios configurables.

## 📋 Requisitos

- Node.js instalado (versión 14 o superior)
- Diccionario en `src/data/wordlist.txt`
  - **Mínimo recomendado**: 50,000+ palabras para resultados óptimos
  - **Formato**: Una palabra por línea, minúsculas
  - **Fuente sugerida**: [Listado de palabras españolas](https://github.com/words/an-array-of-spanish-words) o diccionarios RAE

⚠️ **Nota**: El diccionario actual tiene solo 185 palabras (de prueba). Para generar puzzles reales, necesitas un diccionario completo.

## 🚀 Uso Rápido

### Opción 1: Configuraciones Predefinidas (Más fácil)

```bash
# Ver configuraciones disponibles
node scripts/quick-generate.cjs

# Usar configuración estándar
node scripts/quick-generate.cjs standard

# Test rápido (500 candidatos)
node scripts/quick-generate.cjs quick

# Puzzles fáciles
node scripts/quick-generate.cjs easy

# Puzzles difíciles
node scripts/quick-generate.cjs hard

# Con letra ñ
node scripts/quick-generate.cjs enye
```

### Opción 2: Generador Completo (Más control)

```bash
# Generar puzzles con configuración por defecto
node scripts/generatePuzzles.cjs

# Ver ayuda
node scripts/generatePuzzles.cjs --help
```

### ⚠️ Primer Uso: Configura tu Diccionario

1. **Descarga un diccionario completo** (50k+ palabras):
   ```bash
   # Opción 1: Desde GitHub (ejemplo)
   curl -o src/data/wordlist.txt https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.txt
   
   # Opción 2: Crea tu propio archivo con una palabra por línea
   ```

2. **Verifica el formato**:
   - Una palabra por línea
   - Minúsculas
   - Sin espacios ni caracteres especiales

3. **Ejecuta el generador**:
   ```bash
   node scripts/generatePuzzles.cjs --candidates 5000
   ```

## ⚙️ Configuración

### Opciones disponibles

| Opción | Descripción | Default |
|--------|-------------|---------|
| `--daily-min <num>` | Mínimo de soluciones para puzzles diarios | 70 |
| `--daily-max <num>` | Máximo de soluciones para puzzles diarios | 170 |
| `--classic-min <num>` | Mínimo de soluciones para puzzles clásicos | 140 |
| `--classic-max <num>` | Máximo de soluciones para puzzles clásicos | 300 |
| `--candidates <num>` | Número de candidatos a generar | 5000 |
| `--min-len <num>` | Longitud mínima de palabra válida | 3 |
| `--allow-enye` | Permitir letra ñ en puzzles | false |
| `--output <path>` | Ruta del archivo JSON de salida | `src/data/puzzles.json` |

### Ejemplos de uso

```bash
# Generar más candidatos para obtener más puzzles
node scripts/generatePuzzles.cjs --candidates 10000

# Cambiar rangos de soluciones
node scripts/generatePuzzles.cjs --daily-min 80 --daily-max 120 --classic-min 150 --classic-max 250

# Permitir letra ñ
node scripts/generatePuzzles.cjs --allow-enye

# Exportar a otro archivo
node scripts/generatePuzzles.cjs --output output/puzzles-test.json

# Combinar opciones
node scripts/generatePuzzles.cjs --candidates 8000 --daily-max 130 --allow-enye
```

## 🎲 Proceso de Generación

El generador sigue estos pasos:

1. **Carga del diccionario**: Lee el archivo `src/data/wordlist.txt`

2. **Generación de candidatos**: 
   - Crea combinaciones aleatorias de 7 letras únicas
   - 1 letra central + 6 letras exteriores
   - Opcionalmente incluye la letra ñ

3. **Cálculo de soluciones**:
   - Para cada candidato, valida palabras del diccionario
   - Cuenta soluciones totales
   - Identifica superheptas (palabras de 7+ letras)

4. **Filtrado por categoría**:
   - **Diarios**: 70-170 soluciones + al menos 1 superhepta
   - **Clásicos**: 140-300 soluciones

5. **Exportación**:
   - Genera IDs únicos (`daily-001`, `classic-001`, etc.)
   - Crea títulos descriptivos con el conteo de palabras
   - Guarda todo en un único array JSON

## 📊 Estructura del JSON generado

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
  },
  {
    "id": "classic-001",
    "title": "Clásico #001: 156 palabras",
    "center": "e",
    "outer": ["a", "l", "m", "n", "o", "t"],
    "mode": "classic",
    "minLen": 3,
    "allowEnye": false
  }
]
```

## 🔍 Criterios de Validación

### Puzzles Diarios
- Rango de soluciones: **70-170 palabras**
- Requisito especial: **Al menos 1 superhepta** (palabra de 7+ letras)
- Objetivo: Desafío diario balanceado y alcanzable

### Puzzles Clásicos
- Rango de soluciones: **140-300 palabras**
- Sin requisito de superheptas
- Objetivo: Desafío más largo y complejo

### Superhepta
Una palabra que:
- Tiene 7 o más letras
- Contiene la letra central
- Solo usa las 7 letras del puzzle

## 🛠️ Regenerar Puzzles

Para regenerar el pool completo de puzzles:

```bash
# 1. Asegúrate de tener el diccionario actualizado
# src/data/wordlist.txt debe contener una palabra por línea

# 2. Ejecuta el generador
node scripts/generatePuzzles.cjs --candidates 5000

# 3. El archivo src/data/puzzles.json será sobrescrito
```

⚠️ **Nota**: Regenerar sobrescribirá todos los puzzles existentes. Considera hacer un backup si necesitas preservar puzzles específicos.

## 📈 Consejos para Optimización

### Obtener más puzzles
```bash
# Aumenta el número de candidatos
node scripts/generatePuzzles.cjs --candidates 10000
```

### Ajustar dificultad
```bash
# Puzzles más fáciles (menos soluciones)
node scripts/generatePuzzles.cjs --daily-min 50 --daily-max 100

# Puzzles más difíciles (más soluciones)
node scripts/generatePuzzles.cjs --classic-min 200 --classic-max 400
```

### Verificar resultados
El script muestra estadísticas al final:
- Total de candidatos generados
- Puzzles válidos por categoría
- Rangos de soluciones encontradas

## 🐛 Troubleshooting

### "No se encontró el archivo de wordlist"
Verifica que existe `src/data/wordlist.txt` con una palabra por línea.

### "Pocos puzzles generados"
Aumenta `--candidates` para generar más combinaciones aleatorias.

### "Rangos de soluciones vacíos"
Los rangos configurados pueden ser demasiado restrictivos. Revisa tu diccionario o ajusta los límites.

## 📝 Notas Técnicas

- **Normalización**: El generador normaliza acentos automáticamente (á → a, é → e, etc.)
- **Bitmasks**: Usa operaciones de bits para validación rápida de letras
- **Performance**: Genera ~5000 candidatos en segundos
- **Determinismo**: Usa generación aleatoria, resultados varían en cada ejecución

## 🔄 Integración con el Juego

El archivo generado (`src/data/puzzles.json`) es usado directamente por:
- `src/lib/dailySession.ts`: Selecciona puzzles diarios por fecha
- `src/components/ClassicList.tsx`: Muestra lista de puzzles clásicos
- `src/App.tsx`: Importa PUZZLES para toda la aplicación

No se requiere configuración adicional después de regenerar.

## 📚 Recursos

- Wordlist español: [Diccionarios RAE](https://www.rae.es/)
- Generador de combinaciones: Código en `scripts/generatePuzzles.cjs`
- Documentación del juego: Ver README principal

---

**Última actualización**: Enero 2026
