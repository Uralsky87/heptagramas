# 📚 Scripts - Índice de Documentación

Este directorio contiene el generador OFFLINE de puzzles y su documentación.

## Pruebas de protección del progreso

Ejecutar `npm run test-progress-safety` con las dependencias instaladas.
El runner inicia Vite en `127.0.0.1:5175`, abre Chrome/Edge/Chromium sin interfaz
con un perfil temporal independiente y elimina ese perfil al terminar.
No utiliza el perfil habitual del navegador ni las partidas de usuarios.
No requiere dependencias de pruebas adicionales.

En Windows detecta Chrome o Edge en sus rutas habituales. En otros entornos, o para
elegir un navegador, indicar su ejecutable mediante `PROGRESS_TEST_BROWSER`.
El puerto 5175 debe estar disponible. El runner necesita permiso para lanzar procesos.

Los escenarios usan Game y la aplicacion completa con React StrictMode e IndexedDB real:
apertura sin reescritura, cambio A/B, guardado de una palabra y retorno, puzzle vacío,
carga cancelada, escritura lenta, error de lectura y reintento, diario antiguo,
evento con letra desbloqueada y recarga completa. Tambien comprueban entrada desde
Inicio con cache vacia, doble pulsacion, error y reintento, cancelacion, creacion
atomica, fallo de creacion, eventos fuera de fecha y temporadas anuales compatibles
con los IDs originales de 2026. Halloween se comprueba con el diccionario real:
280/482 soluciones, recompensa a las 50 palabras, palabras destacadas y progreso
al continuar fuera de temporada. El runner genera una captura movil de la partida
en `design/halloween/juego-integrado.png`. Algunos escenarios agrupan varias
comprobaciones. La página de pruebas está fuera de `public` y del build de producción.

Son 25 escenarios, incluidos el respeto a la fuente guardada y la miniatura del
diario en Inicio: conserva el puzzle fijado sin reescribir su sesión.
La navegación comprueba que Clásicos, sus secciones, Exóticos y Atrás abren desde
arriba y conservan los registros guardados.
También se verifica la actualización desde 0.7.3, la versión visible y el acceso
inferior a Ajustes, conservando todos los registros de IndexedDB.

Para revisar el estilo base integrado, con Vite en el puerto 5174, ejecutar
`node scripts/previewBaseStyle.mjs --integrated`. Genera capturas reales en
`design/base/integrado*.png`, usando también un perfil temporal independiente.

Estas pruebas cubren el paso 1 y la entrada segura a eventos; no validan todavía
la restauración atómica de copias ni la edición simultánea desde varias pestañas.

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
   --daily-max 170 \
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
