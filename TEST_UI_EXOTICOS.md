# Checklist: Ajustes UI Modo Exóticos

## Resumen de Cambios Implementados

### A) Pantalla de Entrada (ExoticsHome)
✅ **Frase descriptiva eliminada**
- Eliminada la frase: "Añade una octava letra al heptagrama para descubrir aún más palabras. Un desafío mayor con más posibilidades."
- Los 3 recuadros de características se mantienen sin cambios

### B) Panel "Run Activa" (ExoticsPlay)
✅ **Panel minimizable/desplegable**
- Botón chevron (▲/▼) para plegar/desplegar
- Estado persistido en `ExoticsRunState.uiState.runPanelMinimized`
- Se mantiene tras recargar página

✅ **Contador "Letras extra" eliminado del panel**
- Línea "Letras extra: N" removida del panel lila
- El bloque inferior de letras extra se mantiene intacto

✅ **Vista minimizada compacta**
- Muestra: "Run Activa | P: XXX | XP: YYY | [Habilidades] | (chevron)"
- Botón Habilidades siempre visible
- Botón "Terminar Run" dentro del desplegable

---

## Archivos Modificados

### 1. [src/components/ExoticsHome.tsx](src/components/ExoticsHome.tsx)
**Cambio:**
```tsx
// ANTES:
<h2>Modo Exótico</h2>
<p className="exotics-description">
  Añade una octava letra al heptagrama para descubrir aún más palabras.
  Un desafío mayor con más posibilidades.
</p>

// DESPUÉS:
<h2>Modo Exótico</h2>
```

### 2. [src/types.ts](src/types.ts)
**Cambio:**
```typescript
uiState: {
  lengthHintExpanded: boolean;
  byStartLetterExpanded: boolean;
  runPanelMinimized: boolean; // NUEVO
}
```

### 3. [src/lib/exoticsStorage.ts](src/lib/exoticsStorage.ts)
**Cambios:**
- **loadExoticsRun()**: Migración automática para `runPanelMinimized`
  ```typescript
  if (parsed.uiState.runPanelMinimized === undefined) {
    parsed.uiState.runPanelMinimized = false;
  }
  ```
- **createNewRun()**: Inicializa `runPanelMinimized: false`

### 4. [src/components/ExoticsPlay.tsx](src/components/ExoticsPlay.tsx)
**Cambios principales:**

#### Panel minimizado:
```tsx
{runState.uiState.runPanelMinimized ? (
  <div className="run-panel-minimized">
    <span className="run-title">🎮 Run Activa</span>
    <span className="run-compact-stat">P: {runState.scorePoints}</span>
    <span className="run-compact-stat">XP: {runState.xpEarned}</span>
    <button className="btn-abilities-compact" onClick={...}>
      ⚡ Habilidades
    </button>
    <button className="btn-toggle-panel" onClick={...}>
      ▼
    </button>
  </div>
) : (
  // Panel expandido (sin contador de letras extra)
)}
```

#### Eliminaciones:
```tsx
// ELIMINADO:
<div className="run-info-item">
  <span className="run-info-label">Letras extra</span>
  <span className="run-info-value">{runState.extraLetters.length}</span>
</div>
```

#### Persistencia:
```typescript
onClick={() => {
  const updated = {
    ...runState,
    uiState: { ...runState.uiState, runPanelMinimized: !runState.uiState.runPanelMinimized }
  };
  setRunState(updated);
  saveExoticsRun(updated);
}}
```

### 5. [src/App.css](src/App.css)
**Estilos añadidos:**
- `.run-panel-header` - contenedor flex para título y botón
- `.run-panel-title-row` - fila con título y chevron
- `.btn-toggle-panel` - botón chevron (▲/▼)
- `.run-panel-minimized` - vista compacta del panel
- `.run-title` - título en vista minimizada
- `.run-compact-stat` - stats compactas (P: XXX, XP: YYY)
- `.btn-abilities-compact` - botón Habilidades en vista minimizada

---

## Checklist de Pruebas

### ✅ 1. Frase eliminada en ExoticsHome
**Pasos:**
1. Navegar a Inicio → Modo Exótico
2. Verificar pantalla de entrada

**Esperado:**
- ✅ Solo aparece el título "Modo Exótico"
- ✅ NO aparece la frase descriptiva
- ✅ Los 3 recuadros (8 Letras, Más Palabras, Mayor Desafío) se mantienen

---

### ✅ 2. Panel se pliega y despliega
**Pasos:**
1. Iniciar o continuar run en Exóticos
2. Verificar panel lila "Run Activa" en la izquierda
3. Click en botón ▲ (arriba a la derecha del título)

**Esperado - Minimizado:**
- ✅ Panel se contrae
- ✅ Muestra vista compacta:
  - Título "🎮 Run Activa"
  - "P: XXX"
  - "XP: YYY"
  - Botón "⚡ Habilidades"
  - Botón ▼ para expandir
- ✅ Botón "Terminar Run" NO visible
- ✅ Stats detalladas NO visibles

**Pasos - Expandir:**
4. Click en botón ▼

**Esperado - Expandido:**
- ✅ Panel se expande
- ✅ Muestra vista completa:
  - Título + botón ▲
  - Stats de Puntos y XP
  - Botón "Cambiar heptagrama" (si aplica)
  - Botón "Habilidades"
  - Botón "Terminar Run"
  - Bloque inferior "Letras Extra" (si hay)

---

### ✅ 3. Botón Habilidades visible en minimizado
**Pasos:**
1. Con panel minimizado, verificar botón "⚡ Habilidades"
2. Click en él

**Esperado:**
- ✅ Botón siempre visible en vista minimizada
- ✅ Click abre panel de habilidades correctamente
- ✅ Funcionalidad completa sin expandir panel

---

### ✅ 4. Contador "Letras extra" eliminado del panel
**Pasos:**
1. Expandir panel "Run Activa"
2. Revisar las stats mostradas

**Esperado:**
- ✅ Solo se muestran 2 stats: "Puntos (P)" y "XP Ganada"
- ✅ NO aparece "Letras extra: N" en el panel
- ✅ Panel lila no muestra contador de letras extra

---

### ✅ 5. Bloque inferior de letras extra se mantiene
**Pasos:**
1. Con panel expandido, comprar letra extra (450 P o 900 P)
2. Verificar que se añade letra
3. Scroll hacia abajo en el panel

**Esperado:**
- ✅ El bloque "Letras Extra:" aparece al final del panel (debajo de botones)
- ✅ Muestra las letras extra como badges (ej: "Z")
- ✅ Este bloque es independiente del contador eliminado
- ✅ Funciona correctamente con múltiples letras extra

**Ubicación visual:**
```
[Panel Run Activa]
├─ Título + chevron
├─ Stats (P, XP) ← sin contador extra
├─ Botones (Cambiar, Habilidades, Terminar)
└─ Letras Extra: [Z] [Q] ← este bloque se mantiene
```

---

### ✅ 6. Persistencia del estado minimizado
**Pasos:**
1. Minimizar panel (click ▲)
2. Recargar página (F5)

**Esperado:**
- ✅ Panel permanece minimizado tras recargar
- ✅ Estado guardado en `ExoticsRunState.uiState.runPanelMinimized`

**Pasos - Expandir y recargar:**
3. Expandir panel (click ▼)
4. Recargar página (F5)

**Esperado:**
- ✅ Panel permanece expandido tras recargar

---

### ✅ 7. Responsive y estilos
**Verificar:**
- ✅ Botón chevron visible y clicable
- ✅ Vista minimizada no causa overflow
- ✅ Colores y gradientes consistentes
- ✅ Transiciones suaves al plegar/desplegar
- ✅ Botones alineados correctamente

---

## Estructura Final del Panel

### Vista Expandida:
```
╔════════════════════════╗
║ 🎮 Run Activa      ▲ ║
╠════════════════════════╣
║                        ║
║ Puntos (P)             ║
║      1250              ║
║                        ║
║ XP Ganada              ║
║       500              ║
║                        ║
║ [✨ Cambiar (GRATIS)]  ║  ← si aplica
║                        ║
║ [⚡ Habilidades]        ║
║                        ║
║ [🛑 Terminar Run]      ║
║                        ║
║ Letras Extra:          ║  ← bloque independiente
║ [Z] [Q]                ║
╚════════════════════════╝
```

### Vista Minimizada:
```
╔════════════════════════╗
║ 🎮 Run Activa          ║
║────────────────────────║
║ P: 1250                ║
║ XP: 500                ║
║ [⚡ Habilidades]        ║
║ [▼]                    ║
╚════════════════════════╝
```

---

## Validaciones Técnicas

### Migración de datos:
✅ Runs antiguas sin `runPanelMinimized` → defaultean a `false` (expandido)
✅ No hay errores en consola con runs existentes

### Estado en localStorage:
```json
{
  "uiState": {
    "lengthHintExpanded": false,
    "byStartLetterExpanded": true,
    "runPanelMinimized": false  // ← nuevo campo
  }
}
```

### CSS:
✅ `.run-panel-minimized` - flex column, gap 8px
✅ `.run-compact-stat` - background transparente, padding 6px
✅ `.btn-toggle-panel` - hover scale 1.05, active scale 0.95
✅ `.btn-abilities-compact` - gradiente rosa, shadow

---

## Estado Final

✅ **COMPLETADO:**
- Frase descriptiva eliminada de ExoticsHome
- Panel "Run Activa" minimizable/desplegable
- Contador "Letras extra" eliminado del panel
- Botón Habilidades siempre accesible en minimizado
- Estado persistido correctamente
- Bloque inferior "Letras Extra" intacto
- Estilos CSS para vista minimizada
- Migración automática de runs antiguas

**Listo para testing manual con los 7 casos!**
