# Arreglo de Layout - Centrado en Móvil

## Problema
Las pantallas Home, Daily y Clásicos aparecían "pegadas a la izquierda" en móvil, mientras que Exóticos y el juego estaban bien centrados.

## Solución Implementada

### 1. Componente PageContainer Reutilizable
**Archivo creado:** `src/components/PageContainer.tsx`

Componente wrapper que proporciona un layout consistente:
- Centrado horizontal con `margin: 0 auto`
- `max-width: 520px` para evitar que el contenido se estire demasiado
- `padding: 24px 16px` para espaciado de los bordes
- `min-height: 100dvh` para ocupar toda la pantalla (usa dvh para móviles)
- Responsive: reduce padding en móviles pequeños (<480px)

### 2. Estilos CSS
**Archivo modificado:** `src/App.css`

Agregado `.page-container` con:
```css
.page-container {
  max-width: 520px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}

@media (max-width: 480px) {
  .page-container {
    padding: 20px 16px;
  }
}
```

Simplificados los contenedores específicos para que hereden del PageContainer:
- `.home-container`
- `.daily-screen-container`
- `.classic-list-container`

### 3. Componentes Actualizados

#### Home.tsx
- Importa `PageContainer`
- Reemplaza `<div className="home-container">` por `<PageContainer className="home-container">`

#### DailyScreen.tsx
- Importa `PageContainer`
- Reemplaza `<div className="daily-screen-container">` por `<PageContainer className="daily-screen-container">`

#### ClassicList.tsx
- Importa `PageContainer`
- Reemplaza `<div className="classic-list-container">` por `<PageContainer className="classic-list-container">`

### 4. Componentes No Modificados

**ExoticsHome.tsx y ExoticsPlay.tsx** - No se modificaron porque ya usan el contenedor `.app` que tiene un layout correcto con `margin: 0 auto` y `max-width: 480px`.

## Archivos Tocados
1. ✅ `src/components/PageContainer.tsx` (creado)
2. ✅ `src/components/Home.tsx`
3. ✅ `src/components/DailyScreen.tsx`
4. ✅ `src/components/ClassicList.tsx`
5. ✅ `src/App.css`

## Checklist de Verificación

Para verificar que todo funciona correctamente:

1. **Abrir en emulación móvil** (DevTools > Toggle device toolbar)
   - Probar con iPhone SE (375px)
   - Probar con iPhone 12 Pro (390px)
   - Probar con Pixel 5 (393px)

2. **Pantalla Home:**
   - ✅ Título centrado
   - ✅ Barra de nivel centrada
   - ✅ Botones (Diario/Clásicos/Exóticos) centrados
   - ✅ Padding de 16px a los lados

3. **Pantalla Daily:**
   - ✅ Título centrado
   - ✅ Card de "Hoy" centrada
   - ✅ Lista de días anteriores centrada
   - ✅ Contenido no pegado al borde izquierdo

4. **Pantalla Clásicos:**
   - ✅ Título centrado
   - ✅ Cards de puzzles centradas
   - ✅ Grid responsive en una columna en móvil
   - ✅ Contenido no pegado al borde izquierdo

5. **Pantalla Exóticos:**
   - ✅ Ya funcionaba bien (no se modificó)
   - ✅ Sigue centrado correctamente

6. **Pantalla de Juego:**
   - ✅ Ya funcionaba bien (no se modificó)
   - ✅ Tablero centrado

## Notas Técnicas

- Se usa `100dvh` en lugar de `100vh` para mejor soporte en navegadores móviles (maneja correctamente la barra de navegación)
- El `max-width: 520px` permite una buena legibilidad sin que el texto sea demasiado ancho
- El padding de 16px evita que el contenido toque los bordes de la pantalla
- Los contenedores específicos ahora solo heredan del PageContainer, evitando duplicación de estilos
