# Test Manual: Sistema de Puntuación Exóticos

## Preparación

1. Abrir el navegador en: http://localhost:5173/heptagramas/
2. Abrir DevTools Console (F12)

## Test 1: Verificar función de test en consola

```javascript
testExoticsScoring()
```

**Resultados esperados:**
- ✅ Puntos por longitud correctos (3→20, 4→25, 5→30, 6→35, 7→45, 8+→55+5/letra)
- ✅ SuperHepta +60 puntos
- ✅ Hitos: 10→+150, 20→+225, 30→+340, 40→+510, 50→+765
- ✅ XP = round(P * 0.4)
- ✅ CAP: después de 100 palabras, no más bonuses

## Test 2: Gameplay en navegador

### 2.1. Iniciar run
1. Click en "Exóticos" desde el menú principal
2. Click en "🚀 Iniciar Nueva Run"
3. Esperar generación del puzzle (mostrará intentos y conteo)
4. Cuando termine, verificar que navega a pantalla de juego

### 2.2. Probar palabras de diferentes longitudes

Usar palabras del puzzle generado. Verificar en consola (logs DEV):

**Palabra de 3 letras:**
```
[ExoticsPlay] 📊 Palabra aceptada: "rio"
  Longitud: 3
  SuperHepta: false
  Puntos base: 20
  Total P: +20
  XP ganada: +8
```

**Palabra de 7 letras:**
```
[ExoticsPlay] 📊 Palabra aceptada: "rotador"
  Longitud: 7
  SuperHepta: false
  Puntos base: 45
  Total P: +45
  XP ganada: +18
```

**SuperHepta (7 letras usando todas):**
```
[ExoticsPlay] 📊 Palabra aceptada: "rotador"
  Longitud: 7
  SuperHepta: true
  Puntos base: 105 (incluye +60 SuperHepta)
  Total P: +105
  XP ganada: +42
```

### 2.3. Verificar hito de 10 palabras

1. Encontrar 9 palabras → observar puntos acumulados
2. Encontrar la palabra #10 → debe mostrar:

```
[ExoticsPlay] 📊 Palabra aceptada: "..."
  ...
  🎉 HITO! 10 palabras → +150 P
  Total P: +[puntos_palabra + 150]
  XP ganada: +[xp correspondiente]
```

**En pantalla debe aparecer:**
```
🎉 ¡10 PALABRAS! +150 P
```

### 2.4. Verificar panel Run Info

El panel izquierdo debe actualizar en tiempo real:
- **Puntos (P)**: incrementa con cada palabra
- **XP Ganada**: incrementa (40% de los puntos)
- **Letras extra**: muestra 0 (por ahora, sin añadir extras)

### 2.5. Verificar hitos sucesivos

Continuar encontrando palabras para verificar:

- **20 palabras**: +225 P (mensaje: "🎉 ¡20 PALABRAS! +225 P")
- **30 palabras**: +340 P
- **40 palabras**: +510 P
- **50 palabras**: +765 P

## Test 3: Verificar persistencia

1. Encontrar 5-10 palabras
2. Recargar la página (F5)
3. Ir a "Exóticos"
4. Click en "▶️ Continuar Run"
5. Verificar que:
   - Puntos (P) se mantienen
   - XP se mantiene
   - Palabras encontradas se mantienen
   - `streak10Count` se mantiene (no da hitos duplicados)

## Test 4: Verificar CAP de 100 palabras

**Nota:** Este test es difícil de hacer manualmente. Se verifica en `testExoticsScoring()`:

```javascript
testExoticsScoring()
// Buscar sección "TEST 6: CAP después de 100 palabras"
// Verificar que 110, 120, 150 palabras → bonus = 0 P
```

## Checklist Final

- [ ] testExoticsScoring() muestra todos ✅
- [ ] Palabras de diferentes longitudes dan puntos correctos
- [ ] SuperHepta da +60 bonus
- [ ] Hito de 10 palabras da +150 P
- [ ] XP es aproximadamente 40% de los puntos
- [ ] Panel Run Info se actualiza en tiempo real
- [ ] Mensajes de feedback correctos
- [ ] Logs en consola detallados (en modo dev)
- [ ] Persistencia funciona al recargar
- [ ] No se repiten hitos después de recargar

## Fórmulas de Referencia

### Puntos por palabra
```
3 letras: 20 P
4 letras: 25 P
5 letras: 30 P
6 letras: 35 P
7 letras: 45 P
8 letras: 55 P
9 letras: 60 P (55 + 5)
10 letras: 65 P (55 + 10)
...
```

### SuperHepta
```
Puntos = Puntos_base + 60
Ejemplo: palabra de 7 letras SuperHepta = 45 + 60 = 105 P
```

### XP
```
XP = round(Puntos_totales * 0.4)
Ejemplo: 150 P → 60 XP
```

### Hitos cada 10 palabras (hasta 100)
```
10 palabras: +150 P
20 palabras: +225 P
30 palabras: +340 P
40 palabras: +510 P
50 palabras: +765 P
60 palabras: +1147 P
70 palabras: +1720 P
80 palabras: +2580 P
90 palabras: +3870 P
100 palabras: +5805 P
110+ palabras: +0 P (CAP)
```

### Cálculo de hitos
```javascript
// Cada hito es el anterior * 1.5
hito[n] = hito[n-1] * 1.5
// Ejemplo:
// 50: 765
// 60: 765 * 1.5 = 1147.5 → 1147
```

## Logs esperados en consola

Al iniciar la app:
```
📊 Test de puntuación disponible: testExoticsScoring()
```

Al encontrar palabra:
```
[ExoticsPlay] 📊 Palabra aceptada: "palabra"
  Longitud: X
  SuperHepta: true/false
  Puntos base: XXX
  [HITO si aplica]
  Total P: +XXX
  XP ganada: +XX
  Nuevos totales: XXX P, XXX XP
  Palabras: X/XXX
```
