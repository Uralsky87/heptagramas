# ✅ PWA Configurada - Heptagramas

## 📦 Archivos Modificados

### 1. **package.json**
- ➕ Añadida dependencia: `vite-plugin-pwa`

### 2. **vite.config.ts**
- ➕ Importado plugin: `import { VitePWA } from 'vite-plugin-pwa'`
- ⚙️ Configurado VitePWA con:
  - `registerType: 'autoUpdate'` - actualización automática del SW
  - `manifest` completo con name, short_name, start_url, display, theme_color, icons
  - `workbox` configurado para cachear assets y fonts de Google

### 3. **index.html**
- 🎨 Actualizado `<html lang="es">`
- 🎨 Cambiado favicon a `/icon-192.svg`
- 🎨 Añadido `<meta name="theme-color" content="#6366f1">`
- 🎨 Añadido `<meta name="description">`
- 🎨 Añadido `<link rel="apple-touch-icon">`
- 📝 Actualizado título a "Heptagramas - Juego de Palabras"

### 4. **public/icon-192.svg** ✨ NUEVO
- Icono PWA 192x192 con heptagrama amarillo sobre fondo índigo

### 5. **public/icon-512.svg** ✨ NUEVO
- Icono PWA 512x512 con diseño similar al de 192x192

---

## 🔧 Archivos Generados en Build

Al ejecutar `npm run build`, se generan:

```
dist/
├── manifest.webmanifest   ← Manifest PWA con configuración
├── sw.js                  ← Service Worker principal
├── registerSW.js          ← Script de registro del SW
├── workbox-*.js           ← Workbox runtime
├── icon-192.svg           ← Icono 192x192
├── icon-512.svg           ← Icono 512x512
└── ...
```

### Salida de Build:
```
PWA v1.2.0
mode      generateSW
precache  12 entries (1073.23 KiB)
files generated
  dist/sw.js
  dist/workbox-1d305bb8.js
```

✅ **Service Worker generado correctamente**  
✅ **Manifest generado correctamente**  
✅ **12 archivos pre-cacheados**

---

## 🧪 Cómo Probar la Instalación PWA

### Opción 1: Servidor de Producción (GitHub Pages)

1. **Haz push del código:**
   ```bash
   git add .
   git commit -m "feat: PWA configuration with vite-plugin-pwa"
   git push
   ```

2. **Espera el deploy automático a GitHub Pages**

3. **Abre la URL en Chrome:**
   ```
   https://[tu-usuario].github.io/heptagramas/
   ```

4. **Verifica el botón de instalación:**
   - En Chrome Desktop: busca el icono ➕ en la barra de direcciones (derecha)
   - En Chrome Mobile: busca "Instalar app" en el menú ⋮

---

### Opción 2: Servidor Local (Preview)

1. **Compila la app:**
   ```bash
   npm run build
   ```

2. **Inicia el servidor de preview:**
   ```bash
   npm run preview
   ```

3. **Abre en Chrome:**
   ```
   http://localhost:4173/heptagramas/
   ```

4. **Verifica el botón de instalación:**
   - Debería aparecer el icono ➕ en la barra de direcciones

⚠️ **Nota:** El modo dev (`npm run dev`) NO soporta PWA. Usa `npm run preview` después de `npm run build`.

---

### Opción 3: DevTools - Verificación Manual

1. Abre **Chrome DevTools** (F12)

2. Ve a la pestaña **Application**

3. Verifica cada sección:

#### ✅ Manifest
- Click en **Manifest** (sidebar izquierdo)
- Deberías ver:
  ```
  Name: Heptagramas - Juego de Palabras
  Short name: Heptagramas
  Start URL: /heptagramas/
  Display: standalone
  Theme color: #6366f1
  Background color: #0f172a
  Icons: 2 (192x192, 512x512)
  ```

#### ✅ Service Workers
- Click en **Service Workers** (sidebar izquierdo)
- Deberías ver:
  ```
  Status: activated and running
  Source: /heptagramas/sw.js
  ```

#### ✅ Storage
- Click en **Storage** (sidebar izquierdo)
- En **Cache Storage** deberías ver:
  ```
  workbox-precache-v2-https://...
  google-fonts-cache (si se cargaron fonts)
  ```

---

## 🎯 Características PWA Implementadas

### ✨ Instalable
- ✅ Manifest completo con nombre, iconos, colores
- ✅ Service Worker registrado
- ✅ Start URL configurada
- ✅ Display mode: standalone (sin barra de navegador)

### 🔄 Offline First
- ✅ Pre-caché de todos los assets (JS, CSS, HTML)
- ✅ Pre-caché del wordlist.txt
- ✅ Workbox para gestión de caché
- ✅ Runtime caching de Google Fonts

### 🚀 Auto-Update
- ✅ `registerType: 'autoUpdate'`
- ✅ La app se actualiza automáticamente cuando hay nueva versión
- ✅ Sin prompts ni intervención del usuario

### 🎨 Branding
- ✅ Theme color: `#6366f1` (índigo, matching del tema)
- ✅ Background color: `#0f172a` (dark slate, matching del body)
- ✅ Iconos SVG escalables con heptagrama
- ✅ Apple Touch Icon para iOS

---

## 📱 Experiencia de Usuario

### En Desktop (Chrome/Edge):
1. Usuario visita la página
2. Aparece icono ➕ en la barra de direcciones
3. Click → "Instalar Heptagramas"
4. La app se abre en ventana independiente
5. Se añade acceso directo en el escritorio/menú inicio

### En Mobile (Chrome Android):
1. Usuario visita la página
2. Aparece banner "Añadir a pantalla de inicio"
3. Click → "Instalar"
4. Icono añadido a la pantalla de inicio
5. Al abrir: experiencia fullscreen sin barra de navegación

### En iOS (Safari):
1. Usuario visita la página
2. Toca el botón "Compartir" 📤
3. Selecciona "Añadir a pantalla de inicio"
4. Icono añadido con el apple-touch-icon

---

## 🔍 Checklist de Verificación

Antes de dar por completada la PWA, verifica:

- [ ] `npm run build` genera `dist/manifest.webmanifest`
- [ ] `npm run build` genera `dist/sw.js`
- [ ] En Chrome DevTools → Application → Manifest: se ve la info correcta
- [ ] En Chrome DevTools → Application → Service Workers: SW activado
- [ ] En Chrome DevTools → Lighthouse → Progressive Web App: score >80
- [ ] En Chrome (producción): aparece botón de instalación ➕
- [ ] Después de instalar: se abre en ventana standalone
- [ ] Offline: la app carga (prueba desconectando red en DevTools)
- [ ] Iconos se ven correctamente en pantalla de inicio

---

## 🚀 Próximos Pasos

### Deploy a Producción:
```bash
npm run build
git add .
git commit -m "feat: PWA configuration"
git push
```

### Verificar en GitHub Pages:
1. Espera 1-2 minutos para el deploy
2. Abre `https://[usuario].github.io/heptagramas/`
3. Verifica botón de instalación ➕

### Probar Lighthouse:
```bash
# En Chrome DevTools
1. F12
2. Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
```

**Score esperado:** 90-100 en PWA category

---

## 📚 Recursos

- [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/)
- [Workbox docs](https://developer.chrome.com/docs/workbox/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)

---

## ✅ Resumen

✨ **PWA Lista:** Tu app ahora es instalable, funciona offline, y tiene auto-update configurado.

🎯 **Archivos clave:**
- `vite.config.ts` → configuración VitePWA
- `index.html` → meta tags y title
- `public/icon-*.svg` → iconos PWA

🚀 **Para probar:** `npm run build && npm run preview` y abre en Chrome.
