# 🧪 Testing del Generador

Este documento explica cómo probar el generador con el diccionario actual (limitado).

## ⚠️ Estado Actual

El diccionario en `src/data/wordlist.txt` tiene solo **185 palabras** (demo). Esto es insuficiente para generar puzzles con los rangos por defecto (70-170 y 140-300 soluciones).

## ✅ Opción 1: Test con Rangos Ajustados

Para probar con el diccionario actual:

```bash
# Test con rangos muy bajos
node scripts/generatePuzzles.cjs \
  --candidates 2000 \
  --daily-min 5 \
  --daily-max 20 \
  --classic-min 15 \
  --classic-max 40 \
  --output test-puzzles.json
```

**Expectativa**: Puede generar algunos puzzles, pero probablemente muy pocos.

## ✅ Opción 2: Descargar Diccionario Real

### Fuentes sugeridas:

1. **GitHub - Spanish Words** (Recomendado)
   ```bash
   # PowerShell
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.txt" -OutFile "src/data/wordlist-full.txt"
   
   # Bash/Linux
   curl -o src/data/wordlist-full.txt https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.txt
   ```

2. **Manual**: Crea tu propio archivo con palabras, una por línea

### Usar el nuevo diccionario:

```bash
# Opción A: Reemplazar el actual
Move-Item src/data/wordlist.txt src/data/wordlist-demo.txt
Move-Item src/data/wordlist-full.txt src/data/wordlist.txt

# Opción B: Usar --wordlist (si se implementa)
# Actualmente no soportado, usar Opción A
```

### Generar puzzles reales:

```bash
node scripts/quick-generate.cjs standard
```

## 🔍 Verificar Resultados

### Inspeccionar el JSON generado:

```bash
# PowerShell - Ver primeros puzzles
Get-Content test-puzzles.json | ConvertFrom-Json | Select-Object -First 3 | ConvertTo-Json

# Contar puzzles
$puzzles = Get-Content test-puzzles.json | ConvertFrom-Json
Write-Host "Total puzzles: $($puzzles.Count)"
Write-Host "Diarios: $($puzzles | Where-Object { $_.mode -eq 'daily' } | Measure-Object).Count"
Write-Host "Clásicos: $($puzzles | Where-Object { $_.mode -eq 'classic' } | Measure-Object).Count"
```

### Validar en el juego:

1. Si generaste en `test-puzzles.json`:
   ```bash
   Copy-Item test-puzzles.json src/data/puzzles.json
   ```

2. Reinicia el servidor: `npm run dev`

3. Abre http://localhost:5173/

4. Navega a "Puzzle Diario" o "Clásicos"

## 📊 Estadísticas Esperadas

Con un diccionario completo (50k+ palabras):

| Configuración | Candidatos | Diarios | Clásicos | Tiempo |
|---------------|------------|---------|----------|--------|
| quick         | 500        | ~10-30  | ~5-15    | 1-3s   |
| standard      | 5000       | ~50-150 | ~30-100  | 5-15s  |
| custom 10k    | 10000      | ~100-300| ~60-200  | 10-30s |

Con diccionario actual (185 palabras):
- Muy pocos puzzles o ninguno
- La mayoría de candidatos tendrán <10 soluciones

## 🐛 Troubleshooting

### "0 puzzles generados"

**Causas**:
1. Diccionario muy pequeño
2. Rangos demasiado altos
3. Requisito de superhepta muy restrictivo

**Soluciones**:
```bash
# Reducir rangos
node scripts/generatePuzzles.cjs \
  --candidates 5000 \
  --daily-min 1 \
  --daily-max 30 \
  --classic-min 20 \
  --classic-max 60

# Verificar diccionario
Get-Content src/data/wordlist.txt | Measure-Object -Line
```

### "Error al cargar diccionario"

Verifica que existe `src/data/wordlist.txt`:
```bash
Test-Path src/data/wordlist.txt
```

### "Puzzles diarios sin superhéptice"

Los puzzles diarios requieren al menos 1 palabra de 7+ letras. Con diccionario pequeño, esto es difícil de cumplir.

**Workaround temporal**: Modificar el código para quitar el requisito:

En `scripts/generatePuzzles.cjs`, línea ~280:
```javascript
// Antes:
const dailyCandidates = candidates.filter(c => 
  c.solutionCount >= config.dailyMin &&
  c.solutionCount <= config.dailyMax &&
  c.superHeptaCount >= 1  // <-- Quitar esta línea
);

// Después:
const dailyCandidates = candidates.filter(c => 
  c.solutionCount >= config.dailyMin &&
  c.solutionCount <= config.dailyMax
);
```

## 📝 Comandos de Test Rápido

```bash
# 1. Test con diccionario actual (probablemente 0 resultados)
node scripts/quick-generate.cjs quick

# 2. Ver estadísticas sin generar
Get-Content src/data/wordlist.txt | Measure-Object -Line

# 3. Test con rangos ultra-bajos
node scripts/generatePuzzles.cjs --candidates 1000 --daily-min 1 --daily-max 15 --classic-min 10 --classic-max 30 --output test.json

# 4. Ver resultados
Get-Content test.json | ConvertFrom-Json | Measure-Object

# 5. Limpiar
Remove-Item test.json, test-puzzles.json -ErrorAction SilentlyContinue
```

## 🎯 Próximos Pasos

1. **Corto plazo**: Descargar diccionario real
2. **Mediano plazo**: Generar 100+ puzzles de cada tipo
3. **Largo plazo**: Implementar validación de calidad (distribución de letras, balance de dificultad)

---

**Tip**: Guarda el diccionario demo en `wordlist-demo.txt` para poder revertir si es necesario.
