# Checklist de Pruebas - Habilidades Exóticas

## Configuración Inicial
1. Ir a Home y crear un nuevo run en Exóticos
2. Jugar algunas palabras para acumular P (mínimo 1000 P recomendado)
3. Verificar que el botón "⚡ Habilidades" aparece en el panel izquierdo

---

## 1. 💡 Pista de Longitud (40 P)

### Configuración
- Coste: 40 P
- Efecto: Muestra cuántas palabras quedan por longitud en el sidebar

### Pasos de prueba
1. Abrir panel de habilidades
2. Verificar que botón muestra "💡 Pista de longitud — 40 P"
3. Hacer clic en el botón (debe tener ≥40 P)
4. **Resultado esperado**:
   - Panel se cierra
   - P se reduce en 40
   - Aparece panel amarillo en sidebar con lista:
     ```
     Palabras restantes:
     3 letras: X
     4 letras: Y
     5 letras: Z
     ...
     ```
   - Botón "×" para cerrar el panel de pistas

### Verificaciones
- [ ] Coste correcto (-40 P)
- [ ] Panel de pistas aparece con contadores
- [ ] Contadores coinciden con palabras no encontradas
- [ ] Botón cerrar funciona
- [ ] Si se compra varias veces, pistas se actualizan

---

## 2. 🔓 Desbloquear por Inicial (120 P)

### Configuración
- Coste: 120 P
- Efecto: Activa permanentemente "palabras por inicial" en el run

### Pasos de prueba
1. Abrir panel de habilidades
2. Verificar que botón muestra "🔓 Desbloquear por inicial — 120 P"
3. Hacer clic (debe tener ≥120 P)
4. **Resultado esperado**:
   - P se reduce en 120
   - `statsUnlocked = true` en el estado
   - Botón aparece **deshabilitado** (no se puede comprar otra vez)
   - En la pantalla de juego, el contador de palabras por inicial se activa

### Verificaciones
- [ ] Coste correcto (-120 P)
- [ ] statsUnlocked cambia a true
- [ ] Botón se deshabilita después de comprar
- [ ] No se puede comprar múltiples veces
- [ ] Contador de palabras por inicial visible en UI

---

## 3. 🔄 Cambiar Letra Aleatoria (160 P)

### Configuración
- Coste: 160 P
- Efecto: Cambia una letra del outer por otra aleatoria disponible

### Pasos de prueba
1. Anotar letras actuales del outer (ej: A B C D E F)
2. Anotar letras en extraLetters (si las hay)
3. Abrir panel de habilidades
4. Hacer clic en "🔄 Cambiar letra aleatoria — 160 P"
5. **Resultado esperado**:
   - P se reduce en 160
   - Una letra del outer cambia por otra disponible
   - La nueva letra NO puede ser:
     - ñ
     - La letra central
     - Ninguna letra ya en outer
     - Ninguna letra en extraLetters
   - Puzzle se regenera automáticamente

### Verificaciones
- [ ] Coste correcto (-160 P)
- [ ] Una letra del outer cambia
- [ ] Nueva letra es válida (a-z, no ñ)
- [ ] No hay duplicados en center + outer + extraLetters
- [ ] Puzzle se regenera correctamente

---

## 4. 🎯 Cambiar Letra Concreta (320 P)

### Configuración
- Coste: 320 P
- Efecto: Selector de letras para elegir la nueva letra del swap

### Pasos de prueba
1. Anotar letras actuales (center, outer, extraLetters)
2. Abrir panel de habilidades
3. Hacer clic en "🎯 Cambiar letra concreta — 320 P"
4. **Resultado esperado**:
   - Panel de habilidades se cierra
   - Aparece modal "Selecciona letra nueva (320 P)"
   - Grid con letras a-z (sin ñ)
   - Letras **usadas** (center, outer, extraLetters) NO aparecen
5. Hacer clic en una letra disponible (ej: "K")
6. **Resultado esperado**:
   - P se reduce en 320
   - Letra elegida reemplaza una del outer aleatoriamente
   - Modal se cierra
   - Puzzle se regenera

### Verificaciones
- [ ] Coste correcto (-320 P)
- [ ] Modal de selector aparece
- [ ] Letras usadas no aparecen en el grid
- [ ] ñ no aparece en el grid
- [ ] Al elegir letra, swap se ejecuta
- [ ] No duplicados después del swap
- [ ] Puzzle regenerado correctamente

---

## 5. ✨ Letra Extra Aleatoria (450 P)

### Configuración
- Coste: 450 P
- Efecto: Añade una letra aleatoria a extraLetters

### Pasos de prueba
1. Anotar tamaño actual de extraLetters
2. Abrir panel de habilidades
3. Hacer clic en "✨ Letra extra aleatoria — 450 P"
4. **Resultado esperado**:
   - P se reduce en 450
   - extraLetters tiene +1 letra
   - Nueva letra es válida (a-z, no ñ, no duplicado)
   - Letra aparece en UI del tablero

### Verificaciones
- [ ] Coste correcto (-450 P)
- [ ] extraLetters.length aumenta en 1
- [ ] Nueva letra no es ñ
- [ ] Nueva letra no es duplicada
- [ ] Letra aparece en el tablero
- [ ] Se puede usar en palabras inmediatamente

---

## 6. 🌟 Letra Extra Concreta (900 P)

### Configuración
- Coste: 900 P
- Efecto: Selector de letras para elegir cuál añadir a extraLetters

### Pasos de prueba
1. Anotar letras actuales y tamaño de extraLetters
2. Abrir panel de habilidades
3. Hacer clic en "🌟 Letra extra concreta — 900 P"
4. **Resultado esperado**:
   - Panel de habilidades se cierra
   - Modal "Selecciona letra nueva (900 P)"
   - Grid con letras disponibles (a-z, sin ñ, sin usadas)
5. Hacer clic en una letra (ej: "X")
6. **Resultado esperado**:
   - P se reduce en 900
   - Letra "X" se añade a extraLetters
   - Modal se cierra
   - Letra aparece en el tablero

### Verificaciones
- [ ] Coste correcto (-900 P)
- [ ] Modal de selector aparece
- [ ] Letras usadas no aparecen
- [ ] ñ no aparece
- [ ] Letra elegida se añade a extraLetters
- [ ] No duplicados
- [ ] Letra aparece en UI

---

## 7. ⚡ Doble Puntos x10 (240 P)

### Configuración
- Coste: 240 P
- Efecto: Siguiente 10 palabras dan doble P (solo puntos de palabra, NO hitos)

### Pasos de prueba
1. Tener al menos 240 P
2. Abrir panel de habilidades
3. Hacer clic en "⚡ Doble P x10 — 240 P"
4. **Resultado esperado**:
   - P se reduce en 240
   - doublePointsRemaining = 10
   - Panel se cierra
5. Encontrar una palabra de 3 letras (normalmente 20 P)
6. **Resultado esperado**:
   - Mensaje: "¡Bien! +40 P ⚡x2 (⚡9 restantes)"
   - P aumenta en 40 (20 × 2)
   - doublePointsRemaining = 9
7. Continuar hasta encontrar 10 palabras
8. En la palabra 11:
   - Mensaje: "¡Bien! +20 P" (sin ⚡x2)
   - doublePointsRemaining = 0

### Verificaciones especiales - HITOS
1. Durante las 10 palabras con doble puntos, alcanzar un hito (ej: palabra #10)
2. **Resultado esperado**:
   - Puntos de la palabra: ×2
   - Bonus del hito: NO multiplicado (ej: +150 P sin ×2)
   - Mensaje muestra ambos separados

### Checklist
- [ ] Coste correcto (-240 P)
- [ ] doublePointsRemaining = 10
- [ ] Palabras 1-10: puntos ×2
- [ ] Mensaje muestra "⚡x2" y contador
- [ ] Palabra 11: puntos normales
- [ ] HITOS NO se multiplican por ×2
- [ ] Contador decrementa correctamente

---

## 8. 🔮 Nuevo Heptagrama (350 P)

### Configuración
- Coste: 350 P
- Efecto: Genera nuevo puzzle sin perder P ni XP acumulado
- Restricción: Solo disponible ANTES del 50% de progreso

### Pasos de prueba - Antes del 50%
1. Empezar un run nuevo
2. Encontrar algunas palabras (< 50%)
3. Anotar P y XP actuales (ej: 500 P, 200 XP)
4. Abrir panel de habilidades
5. Hacer clic en "🔮 Nuevo heptagrama — 350 P"
6. **Resultado esperado**:
   - P se reduce en 350 (ej: 500 - 350 = 150 P)
   - XP permanece igual (200 XP)
   - Puzzle se regenera (nuevas letras)
   - foundWords se resetea
   - extraLetters se resetea
   - Progreso vuelve a 0%

### Pasos de prueba - Después del 50%
1. Continuar jugando hasta ≥50% de progreso
2. Abrir panel de habilidades
3. **Resultado esperado**:
   - Botón "🔮 Nuevo heptagrama" aparece **deshabilitado**
   - No se puede comprar

### Verificaciones
- [ ] Coste correcto (-350 P)
- [ ] P se conserva (menos el coste)
- [ ] XP se conserva intacto
- [ ] Puzzle se regenera con nuevas letras
- [ ] foundWords se vacía
- [ ] extraLetters se vacía
- [ ] Progreso = 0%
- [ ] Botón deshabilitado si progreso ≥50%
- [ ] Botón habilitado si progreso <50% y P ≥350

---

## Pruebas Generales

### Estados de Botones
1. **Con P insuficiente**:
   - [ ] Botones con coste > P disponible aparecen deshabilitados
   - [ ] Hover no funciona en botones deshabilitados

2. **Habilidades permanentes**:
   - [ ] "Desbloquear por inicial" se deshabilita tras comprar
   - [ ] No se puede comprar múltiples veces

3. **Restricciones condicionales**:
   - [ ] "Nuevo heptagrama" se deshabilita tras 50%
   - [ ] "Doble P x10" se deshabilita si doublePointsRemaining > 0

### UI y UX
- [ ] Panel de habilidades se abre con "⚡ Habilidades"
- [ ] Panel se cierra con botón "Cerrar"
- [ ] Panel se cierra con clic fuera (overlay)
- [ ] Animaciones fluidas (fadeIn, slideUp)
- [ ] Balance de P visible en panel
- [ ] Iconos correctos para cada habilidad
- [ ] Costes visibles y correctos

### Reglas de Letras
- [ ] ñ NUNCA aparece en selectores
- [ ] NO se pueden duplicar letras en center + outer + extraLetters
- [ ] Letras usadas no aparecen en selector
- [ ] getUsedLetters() incluye todas las letras activas
- [ ] getAvailableLetters() excluye usadas y ñ

---

## Casos Extremos

### Sin P suficiente
1. Tener < 40 P
2. Abrir panel
3. **Verificar**: Todos los botones deshabilitados

### Máximo de letras
1. Tener 20+ extraLetras
2. Intentar comprar más letras
3. **Verificar**: ¿Hay límite? (implementar si es necesario)

### Doble puntos activo
1. Activar doble puntos (doublePointsRemaining = 10)
2. Intentar comprar otra vez
3. **Verificar**: Botón deshabilitado (no apilar)

### Nuevo heptagrama al límite del 50%
1. Llegar a 49.9% de progreso
2. Comprar "Nuevo heptagrama"
3. Verificar que funciona
4. Llegar a 50.0%
5. Verificar que se deshabilita

---

## Resultado Final

✅ **Sistema completamente funcional** si todas las verificaciones pasan.

### Resumen de costes
- 💡 Pista longitud: 40 P
- 🔓 Desbloquear inicial: 120 P
- 🔄 Cambiar aleatoria: 160 P
- 🎯 Cambiar concreta: 320 P
- ✨ Letra aleatoria: 450 P
- 🌟 Letra concreta: 900 P
- ⚡ Doble P x10: 240 P
- 🔮 Nuevo heptagrama: 350 P

**Total para comprar todas**: 2580 P (aproximadamente 64 palabras de 4 letras)
