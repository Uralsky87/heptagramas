# Test Manual: Nuevo Heptagrama Gratis

## Sistema Implementado

### Reglas de cambio gratis:
1. **Progreso >= 50%**: Si foundWords/solutionsTotal >= 0.5
2. **100+ palabras**: Si foundWords >= 100 (sin importar el %)

### Bonus único del 50%:
- **+250 P** al alcanzar el 50% por primera vez
- **+100 XP** (40% de 250)
- Solo se da UNA VEZ por puzzle

### Al cambiar puzzle:
- ✅ Mantener: `scorePoints` y `xpEarned` acumulados
- ❌ Reiniciar: `foundWords`, `streak10Count`, `milestones`
- Generar nuevo puzzle (50-500 soluciones)

---

## Test 1: Verificar bonus del 50%

### Preparación:
1. Abrir http://localhost:5173/heptagramas/
2. Ir a "Exóticos"
3. Iniciar nueva run
4. Abrir DevTools Console (F12)

### Pasos:
1. Jugar hasta encontrar ~49% de palabras
2. Observar: NO debe aparecer el botón "Cambiar heptagrama (GRATIS)"
3. Encontrar UNA palabra más para pasar el 50%

### Resultado esperado:
```
[ExoticsPlay] 📊 Palabra aceptada: "..."
  ...
  🎯 BONUS 50%! → +250 P
  Total P: +[puntos_palabra + 250]
  XP ganada: +[xp + 100]
  ...
  Progreso: 51% (o más)
```

**En pantalla:**
```
🎯 ¡50% COMPLETADO! +250 P (GRATIS disponible)
```

**Panel Run Info:**
- Puntos aumentan en +250
- XP aumenta en +100

**Botón aparece:**
```
✨ Cambiar heptagrama (GRATIS)
```

---

## Test 2: Verificar condición de 100 palabras

### Caso A: 100+ palabras pero < 50%
Si el puzzle tiene muchas soluciones (ej: 300), encontrar 100 palabras:

**Resultado esperado:**
- Progreso: ~33% (100/300)
- Bonus de 50%: NO se activa
- Botón "Cambiar heptagrama (GRATIS)": SÍ aparece

### Caso B: >= 50% alcanzado primero
Si ya se alcanzó el 50% antes de llegar a 100:

**Resultado esperado:**
- Bonus +250 P ya cobrado al llegar al 50%
- Al llegar a 100 palabras: NO se da bonus extra
- Botón "Cambiar heptagrama (GRATIS)": sigue visible

---

## Test 3: Cambiar puzzle gratis

### Pasos:
1. Alcanzar 50% o 100 palabras
2. Observar: aparece botón verde "✨ Cambiar heptagrama (GRATIS)"
3. Click en el botón

### Confirmación esperada:
```
¿Cambiar a un nuevo heptagrama?

Progreso actual: X/Y palabras

Se MANTENDRÁN tus puntos (XXX P) y XP (XXX)
Se REINICIARÁ el contador de palabras encontradas para el nuevo puzzle.

[OK] [Cancelar]
```

4. Click en OK

### Durante generación:
**Panel muestra:**
```
⏳
Generando nuevo puzzle...
Intentos: X
Última: Y palabras
```

### Después de generación:
**Mensaje:**
```
✨ ¡Nuevo heptagrama cargado! Tus P y XP se mantienen.
```

**Console log:**
```
[ExoticsPlay] Puzzle cambiado gratis. P y XP mantenidos: {
  scorePoints: XXX,
  xpEarned: XXX
}
```

**Verificar en Panel Run Info:**
- ✅ Puntos (P): se mantienen
- ✅ XP Ganada: se mantiene
- ✅ Encontradas: ahora muestra 0 / [nuevo total]

**Verificar en tablero:**
- Letras nuevas
- Palabras encontradas: lista vacía

---

## Test 4: Verificar que bonus de 50% NO se repite

### Pasos:
1. En el nuevo puzzle, encontrar palabras hasta el 50%
2. Observar logs

### Resultado esperado:
```
[ExoticsPlay] 📊 Palabra aceptada: "..."
  ...
  🎯 BONUS 50%! → +250 P
  ...
  Progreso: 50%+
```

**¡El bonus SÍ se da de nuevo!** Cada puzzle tiene su propio bonus del 50%.

---

## Test 5: Verificar hitos de 10 después de cambio

### Escenario:
- Run inicial: alcanzaste el hito de 10 palabras (+150 P)
- Cambiaste puzzle gratis
- Nuevo puzzle: encontraste 10 palabras

### Resultado esperado:
```
🎉 ¡10 PALABRAS! +150 P
```

**¡El hito de 10 palabras SÍ se da de nuevo!** El `streak10Count` se reinicia con cada puzzle.

---

## Test 6: Acumulación de P y XP a través de puzzles

### Ejemplo de run completa:

#### Puzzle 1:
- Palabras encontradas: 50/100 (50%)
- Bonus 50%: +250 P (+100 XP)
- Hitos 10, 20, 30, 40, 50: +150, +225, +340, +510, +765 P
- Palabras individuales: ~1500 P
- **Total Puzzle 1: ~3740 P, ~1496 XP**

#### Cambio gratis → Puzzle 2:
- Estado inicial: 3740 P, 1496 XP
- Palabras encontradas: 80/150 (53%)
- Bonus 50%: +250 P (+100 XP)
- Hitos 10-80: ~10,000 P
- **Total Puzzle 2: +13,000 P, +5,200 XP**

#### **Total Run: ~16,740 P, ~6,696 XP**

---

## Checklist de Verificación

### Bonus del 50%:
- [ ] Se activa al alcanzar >= 50% de progreso
- [ ] Da +250 P y +100 XP
- [ ] Mensaje: "🎯 ¡50% COMPLETADO! +250 P (GRATIS disponible)"
- [ ] Log detallado en consola
- [ ] Solo se da UNA VEZ por puzzle

### Botón Cambiar Gratis:
- [ ] Aparece al >= 50% de progreso
- [ ] Aparece al >= 100 palabras (sin importar %)
- [ ] Botón verde con gradiente
- [ ] Texto: "✨ Cambiar heptagrama (GRATIS)"

### Cambio de Puzzle:
- [ ] Muestra confirmación con resumen
- [ ] Genera nuevo puzzle (50-500)
- [ ] Muestra spinner y progreso durante generación
- [ ] Mantiene scorePoints y xpEarned
- [ ] Reinicia foundWords a []
- [ ] Reinicia streak10Count a 0
- [ ] Reinicia milestones
- [ ] Mensaje: "✨ ¡Nuevo heptagrama cargado!"

### Persistencia:
- [ ] Estado se guarda en localStorage
- [ ] Al recargar página, mantiene el estado
- [ ] Botón "Continuar Run" funciona correctamente
- [ ] P y XP acumulados se mantienen

---

## Logs Esperados

### Al alcanzar 50%:
```javascript
[ExoticsPlay] 🎯 ¡50% ALCANZADO! Bonus: +250 P (+100 XP)
[ExoticsPlay] 📊 Palabra aceptada: "palabra"
  Longitud: X
  SuperHepta: false
  Puntos base: XX
  🎯 BONUS 50%! → +250 P
  Total P: +XXX
  XP ganada: +XXX
  Nuevos totales: XXXX P, XXXX XP
  Palabras: XX/XXX
  Progreso: 51%
```

### Al cambiar puzzle:
```javascript
[ExoticsPlay] Puzzle cambiado gratis. P y XP mantenidos: {
  scorePoints: 3740,
  xpEarned: 1496
}
```

### Verificación en consola:
```javascript
// Ver estado actual:
JSON.parse(localStorage.getItem('exoticsRunState'))

// Resultado esperado después de cambio:
{
  foundWords: [],
  scorePoints: 3740, // MANTENIDO
  xpEarned: 1496,    // MANTENIDO
  streak10Count: 0,  // REINICIADO
  milestones: {
    reached50Percent: false,      // REINICIADO
    reached100Found: false,       // REINICIADO
    claimed50PercentBonus: false  // REINICIADO
  }
}
```
