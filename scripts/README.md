# 📚 Scripts - Índice de Documentación

Este directorio contiene el generador OFFLINE de puzzles y su documentación.

## 🎯 Archivos Principales

### Scripts Ejecutables

1. **[generatePuzzles.cjs](./generatePuzzles.cjs)** ⭐
   - Generador principal de puzzles
   - Configuración completa por CLI
   - Ejecutar: `node scripts/generatePuzzles.cjs --help`

2. **[quick-generate.cjs](./quick-generate.cjs)** 🚀
   - Wrapper con configuraciones predefinidas
   - Más fácil de usar
   - Ejecutar: `node scripts/quick-generate.cjs`

### Documentación

3. **[GENERATOR_README.md](./GENERATOR_README.md)** 📖
   - Documentación completa del generador
   - Guía de uso con ejemplos
   - Troubleshooting
   - **Empieza aquí si es tu primera vez**

4. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** 🧪
   - Cómo probar el generador
   - Soluciones para diccionario pequeño
   - Verificación de resultados
   - **Léelo antes de hacer tu primer test**

5. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** 📝
   - Resumen técnico de la implementación
   - Algoritmos y estructuras de datos
   - Performance y limitaciones
   - **Para desarrolladores que quieran entender el código**

### Configuración

6. **[example-config.json](./example-config.json)** ⚙️
   - Configuraciones de ejemplo en JSON
   - Requisitos del diccionario
   - Resultados esperados

## 🚀 Quick Start

### Primera vez

```bash
# 1. Lee la documentación principal
cat scripts/GENERATOR_README.md

# 2. Verifica tu diccionario (debe tener 50k+ palabras)
Get-Content src/data/wordlist.txt | Measure-Object -Line

# 3. Si tu diccionario es pequeño, lee la guía de testing
cat scripts/TESTING_GUIDE.md

# 4. Ejecuta un test rápido
node scripts/quick-generate.cjs quick
```

### Uso regular

```bash
# Generar puzzles con configuración estándar
node scripts/quick-generate.cjs standard

# Ver resultados
Get-Content src/data/puzzles.json | ConvertFrom-Json | Measure-Object
```

## 📊 Flujo de Trabajo Recomendado

```
1. LEER: GENERATOR_README.md
   ↓
2. VERIFICAR: Diccionario (50k+ palabras)
   ↓
   NO → LEER: TESTING_GUIDE.md
   SÍ → CONTINUAR
   ↓
3. TEST: quick-generate.cjs quick
   ↓
4. VERIFICAR: Resultados en test-puzzles.json
   ↓
5. PRODUCCIÓN: quick-generate.cjs standard
   ↓
6. INTEGRAR: Puzzles en src/data/puzzles.json
```

## 🔗 Enlaces Rápidos

| Quiero... | Archivo |
|-----------|---------|
| Generar puzzles ahora | [quick-generate.cjs](./quick-generate.cjs) |
| Entender cómo funciona | [GENERATOR_README.md](./GENERATOR_README.md) |
| Resolver problemas | [TESTING_GUIDE.md](./TESTING_GUIDE.md) |
| Ver el código | [generatePuzzles.cjs](./generatePuzzles.cjs) |
| Ver ejemplos de config | [example-config.json](./example-config.json) |
| Detalles técnicos | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |

## 💡 Comandos Útiles

```bash
# Ver ayuda del generador
node scripts/generatePuzzles.cjs --help

# Ver configuraciones predefinidas
node scripts/quick-generate.cjs

# Test rápido sin sobrescribir
node scripts/quick-generate.cjs quick

# Generar con rangos personalizados
node scripts/generatePuzzles.cjs \
  --candidates 5000 \
  --daily-min 70 \
  --daily-max 140 \
  --classic-min 140 \
  --classic-max 300

# Verificar diccionario
Get-Content src/data/wordlist.txt | Measure-Object -Line

# Ver puzzles generados
Get-Content src/data/puzzles.json | ConvertFrom-Json | Select-Object -First 5
```

## 📈 Estadísticas de Archivos

| Archivo | Líneas | Tipo | Estado |
|---------|--------|------|--------|
| generatePuzzles.cjs | ~550 | Script | ✅ Completo |
| quick-generate.cjs | ~120 | Script | ✅ Completo |
| GENERATOR_README.md | ~350 | Docs | ✅ Completo |
| TESTING_GUIDE.md | ~200 | Docs | ✅ Completo |
| IMPLEMENTATION_SUMMARY.md | ~250 | Docs | ✅ Completo |
| example-config.json | ~40 | Config | ✅ Completo |

## 🎓 Orden de Lectura Sugerido

Para aprender el sistema:

1. **Básico** (5 min):
   - [GENERATOR_README.md](./GENERATOR_README.md) → Secciones "Uso Rápido" y "Proceso de Generación"

2. **Intermedio** (10 min):
   - [TESTING_GUIDE.md](./TESTING_GUIDE.md) → Todo el documento
   - Ejecutar test rápido

3. **Avanzado** (20 min):
   - [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) → Algoritmos y Performance
   - [generatePuzzles.cjs](./generatePuzzles.cjs) → Código fuente

## 🆘 Soporte

Si tienes problemas:

1. Revisa [TESTING_GUIDE.md](./TESTING_GUIDE.md) → Sección "Troubleshooting"
2. Verifica que tu diccionario tenga 50k+ palabras
3. Prueba con rangos más bajos: `--daily-min 10 --daily-max 50`
4. Revisa los logs del generador (muestra progreso y estadísticas)

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
