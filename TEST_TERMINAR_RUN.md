# Test: Terminar Run en Modo Exóticos

## Objetivo
Verificar que al terminar una run en el modo Exóticos, el XP acumulado se sume correctamente al playerState global, el nivel se recalcule, y el estado se limpie adecuadamente.

---

## Escenario 1: Terminar Run Básica

### Configuración Inicial
1. Ir a Home y anotar el **XP Total** y **Nivel** actuales
   - Ejemplo: XP Total = 500, Nivel = 3
2. Crear un nuevo run en Exóticos
3. Jugar algunas palabras para acumular XP
   - Ejemplo: 10 palabras = ~200 P = ~80 XP

### Pasos
1. Anotar XP acumulada en la run actual (mostrada en la UI)
   - Ejemplo: 80 XP
2. Hacer clic en **"Terminar Run"**
3. Leer el mensaje de confirmación:
   ```
   ¿Terminar esta run?
   
   Puntos: X P
   XP acumulada: Y
   Palabras: Z/T (%)
   
   El XP se sumará a tu nivel global.
   ```
4. Confirmar haciendo clic en **Aceptar**

### Resultado Esperado
- ✅ Vuelve a ExoticsHome (pantalla de inicio de Exóticos)
- ✅ exoticsRunState se elimina de localStorage
- ✅ XP Total aumentó: 500 + 80 = **580 XP**
- ✅ Nivel se recalculó automáticamente (puede subir o no)
- ✅ Console log (modo DEV):
  ```
  [ExoticsPlay] Run terminada por el usuario
  [ExoticsPlay] XP ganada: +80 (500 → 580)
  [ExoticsPlay] Nivel: 3 → 3 (o 4 si subió)
  ```

---

## Escenario 2: Terminar Run con Subida de Nivel

### Configuración Inicial
1. Tener un nivel cerca de subir (ej: Nivel 2 con 190 XP, falta 10 XP para nivel 3)
2. Crear run en Exóticos
3. Acumular al menos 10 XP en la run

### Pasos
1. Anotar:
   - XP Total antes: **190 XP**
   - Nivel antes: **2**
   - XP en run: **15 XP**
2. Terminar Run
3. Confirmar

### Resultado Esperado
- ✅ XP Total: 190 + 15 = **205 XP**
- ✅ Nivel: **3** (subió de nivel)
- ✅ Console log muestra:
  ```
  [ExoticsPlay] Nivel: 2 → 3
  ```
- ✅ En Home se ve el nuevo nivel actualizado

---

## Escenario 3: Cancelar Terminar Run

### Pasos
1. Estar en una run activa con XP acumulada
2. Hacer clic en **"Terminar Run"**
3. En el diálogo de confirmación, hacer clic en **Cancelar**

### Resultado Esperado
- ✅ Se queda en ExoticsPlay (no vuelve a Home)
- ✅ Run state NO se limpia
- ✅ Puede seguir jugando normalmente
- ✅ XP no se suma al global (porque no se confirmó)

---

## Escenario 4: Terminar Run Sin XP

### Configuración
1. Crear un nuevo run
2. NO jugar ninguna palabra (XP = 0)
3. Inmediatamente hacer clic en **"Terminar Run"**

### Pasos
1. Confirmar terminar run

### Resultado Esperado
- ✅ Vuelve a ExoticsHome
- ✅ XP Total global NO cambia (0 XP sumado)
- ✅ Nivel NO cambia
- ✅ Run state se limpia correctamente

---

## Escenario 5: Verificar Progreso en Confirmación

### Configuración
1. Crear run con ~100 soluciones posibles
2. Encontrar 50 palabras (50%)

### Pasos
1. Hacer clic en **"Terminar Run"**
2. Leer el mensaje de confirmación

### Resultado Esperado
- ✅ Mensaje muestra:
  ```
  Palabras: 50/100 (50.0%)
  ```
- ✅ Porcentaje calculado correctamente

---

## Escenario 6: Terminar Run con Hitos Alcanzados

### Configuración
1. Crear run
2. Jugar hasta alcanzar hitos (10, 20, 30 palabras)
3. Acumular XP significativo (ej: 500 XP)

### Pasos
1. Anotar XP global antes: **1000 XP**
2. Anotar XP en run: **500 XP**
3. Terminar Run
4. Confirmar

### Resultado Esperado
- ✅ XP Total: 1000 + 500 = **1500 XP**
- ✅ Nivel recalculado correctamente desde XP total
- ✅ Puntos P NO se transfieren (solo XP)
- ✅ Run state limpio

---

## Verificaciones de LocalStorage

### Antes de Terminar Run
```javascript
localStorage.getItem('exoticsRunState')
// → Debe tener JSON con la run activa
```

### Después de Terminar Run
```javascript
localStorage.getItem('exoticsRunState')
// → null (limpiado)

localStorage.getItem('heptagramas_playerState')
// → Debe tener xpTotal actualizado y level recalculado
```

---

## Verificaciones de Integración

### 1. Diario NO tiene opciones exóticas
- [ ] Ir a Diario
- [ ] Verificar que NO hay toggle de modo exótico
- [ ] Verificar que NO hay letras extra
- [ ] Verificar que NO hay botón de habilidades

### 2. Clásicos NO tiene opciones exóticas
- [ ] Ir a Clásicos
- [ ] Seleccionar cualquier puzzle
- [ ] Verificar que NO hay toggle de modo exótico
- [ ] Verificar que NO hay letras extra
- [ ] Verificar que NO hay botón de habilidades

### 3. Exóticos es Independiente
- [ ] Ir a Exóticos
- [ ] Crear run
- [ ] Verificar que SÍ tiene letras extra
- [ ] Verificar que SÍ tiene botón de habilidades
- [ ] Verificar que sistema P/XP es propio del modo

---

## Casos Extremos

### Terminar Run con 0 palabras pero XP > 0
- **Situación**: Compró "Nuevo heptagrama" varias veces (costó P pero no dio XP extra)
- **Resultado**: Si XP = 0, no suma nada al global

### Terminar Run con muchísimas palabras
- **Situación**: Run con 200+ palabras, 5000+ XP
- **Resultado**: XP se suma correctamente, nivel puede subir varios niveles de golpe

### Terminar Run justo al llegar al 100%
- **Situación**: Encontró todas las palabras (100%)
- **Resultado**: Igual funciona, suma XP y limpia run

---

## Fórmula de Nivel

Recordatorio: El nivel se calcula con `calculateLevel(xpTotal)`:

```typescript
// De xpSystem.ts
BASE_XP_PER_LEVEL = 100
LEVEL_EXPONENT = 1.5

// Nivel 1 → 2: 100 XP
// Nivel 2 → 3: 200 XP (100 * 2^1.5)
// Nivel 3 → 4: 346 XP (100 * 3^1.5)
// etc.
```

---

## Resultado Final

✅ **Sistema completo** si todas las verificaciones pasan:
- XP se suma al playerState global
- Nivel se recalcula automáticamente con `calculateLevel()`
- Cosmetics se preservan (aunque no hay sistema aún en exóticos)
- exoticsRunState se limpia de localStorage
- Vuelve a ExoticsHome
- Diario y Clásicos NO tienen modo exótico
