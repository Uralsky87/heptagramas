# Hoja de Ruta de Lanzamiento

Ultima actualizacion: 2026-10-25

## Revision al retomar el proyecto

Estado verificado el 25 de octubre de 2026: [revision general](REVISION_2026-10-25.md).
El codigo incluye cambios hasta el 16 de junio y eventos de verano y Navidad.
Build correcto; lint con 2 errores y 5 avisos. Auditoria actual: 474 puzzles,
0 incidencias estructurales o de letras, 0 conteos desalineados y 0 diarios fuera de rango.
Los pendientes historicos de esta hoja deben contrastarse con esa revision.
La prioridad al continuar es revisar el guardado al cambiar de clasico y la importacion
de copias de seguridad, seguidos de la coordinacion de escrituras y los errores de lint.

## Criterio de conservacion de progreso

Peticion expresa del usuario, 2026-10-25: proteger las partidas que las personas ya
tengan guardadas. Si un cambio puede borrar, invalidar o perder progreso al actualizar,
hay que explicar el riesgo al usuario antes de aplicar ese cambio.
No asumir que se permite reiniciar datos, regenerar identificadores o migrar partidas
de forma destructiva como parte de una correccion.

## Paso 1 completado: guardado al cambiar de puzzle (2026-10-25)

- El guardado exige que el estado cargado pertenezca al puzzle activo y haya cambios de juego.
- Abrir o abandonar una partida sin jugar no reescribe su registro.
- La carga espera las escrituras pendientes de progreso y descarta resultados de cargas canceladas.
- Un fallo de lectura bloquea el juego y el guardado; permite reintentar o volver.
- Sin cambios en esquema/version de IndexedDB, formato de copia, IDs de puzzles,
  diccionario, dataset ni migraciones de arranque. No se ha publicado esta correccion.
- Validacion: 9 escenarios con Chrome, React StrictMode e IndexedDB real, incluido
  reinicio de pagina, diarios antiguos y eventos con letra desbloqueada.
- `npm run build` y `npm run audit-puzzles` correctos. Lint conserva los 2 errores
  y 5 avisos anteriores en los componentes del tablero y Game.
- Pendiente: paso 2 (validacion y restauracion atomica de copias), paso 3
  (coordinacion de todas las escrituras). Esta correccion no resuelve fallos de
  escritura silenciados por la API ni conflictos entre varias pestanas.
- Comando de regresion: `npm run test-progress-safety`; detalles en `scripts/README.md`.

## Entrada segura a eventos y ciclos anuales (2026-10-25)

- Inicio y la ficha del evento leen IndexedDB con errores propagados antes de
  decidir si existe una partida. Un error bloquea la entrada y ofrece reintento.
- Pulsar Jugar crea un registro solo si no existe, en una transaccion atomica
  de lectura/escritura que conserva cualquier partida existente.
- Se ignoran dobles pulsaciones y se cancelan las navegaciones pendientes al
  volver o desmontar la aplicacion.
- Todos los eventos actuales son anuales: Madre 1-31 de mayo, Verano 21 de junio-21
  de julio y Navidad 15 de diciembre-15 de enero, ambos extremos incluidos.
- El evento Madre conserva su ID de ruta original y usa un prefijo para las
  temporadas: el guardado 2026 sigue siendo exactamente `special-mothers-day-2026`;
  2027 usa `special-mothers-day-2027`. No hay migracion, copia ni borrado de registros.
- Cada temporada tiene su propia partida. Las anteriores siguen almacenadas, pero
  la pantalla actual solo consulta la temporada mas reciente; no hay selector historico.
- Validacion: 17 escenarios de regresion en Chrome con IndexedDB real; build y
  auditoria de puzzles correctos. Lint completo mantiene los 2 errores y 5 avisos
  previos; los archivos de esta correccion pasan su comprobacion de lint.
- Halloween aun no se ha creado. Cambios locales, sin publicar.

## Propuesta de Halloween (2026-10-25)

- Calendario solicitado: anual, 31 de octubre a 30 de noviembre inclusive.
- Maqueta visual local y estudio de letras en [design/halloween](design/halloween/README.md).
- Direccion propuesta: calabaza, ciruela, papel crema, malva y salvia; ilustracion
  SVG propia y vistas de invitacion y partida. Captura abierta en VS Code.
- Cuatro candidatos con conteos reales del solver; primera propuesta A + B C L O S Z,
  regalo E, 280 a 482 soluciones (calabaza, calabozo, luego escoba).
- Pendiente elegir estetica/letras definitivas y umbral de recompensa. El evento
  aun no se ha incorporado al catalogo y la maqueta no usa almacenamiento.

## Halloween integrado (2026-10-25)

- Estetica y direccion Calabazas y escobas aprobadas por el usuario.
- Evento `special-halloween`, anual del 31 de octubre al 30 de noviembre inclusive;
  progreso propio por temporada (`special-halloween-2026`, etc.).
- Central A, exteriores B C L O S Z: 280 soluciones. Regalo a las 50 palabras:
  letra E, 482 soluciones. Calabaza y calabozo destacados inicialmente;
  escoba destacada tras abrir el regalo. Definiciones tematicas, sin excepciones
  a la central ni cambios de diccionario.
- Invitacion, ficha, partida, listado de eventos y tablero con tema propio;
  ilustracion SVG local `public/halloween-scene.svg`, estilos acotados a Halloween.
- Sin cambios de IDs de eventos existentes, esquema de guardado ni migraciones.
- 21 escenarios de regresion en Chrome con IndexedDB real, incluyendo el evento
  completo, persistencia de la recompensa y continuacion despues del 30 de noviembre.
- Build y auditoria correctos; lint conserva los 2 errores y 5 avisos anteriores.
- Cambio local, sin publicar. La revision visual del juego base queda para una
  peticion posterior del usuario.

## Revision visual del juego base (2026-10-25)

- Peticion del usuario: evolucion suave, conservando tonos calidos y elegantes.
- Revision y maqueta independiente en [design/base](design/base/REVISION_Y_PROPUESTA.md),
  con Inicio, partida, Clasicos, definiciones y muestra de Ajustes.
- Paleta actual conservada; propuesta de menos marcos/sombras, diario con jerarquia,
  menus secundarios compactos y fichas de palabras mas ligeras.
- Dos variantes de titulos (serif y monoespaciados) para revisar; sin modificar la
  preferencia de fuente ni otros datos de usuarios.
- Capturas abiertas en VS Code. Interacciones comprobadas y sin desbordamientos
  a 320/390 px. Sin cambios en estilos o logica del juego base: pendiente revision
  del usuario antes de trasladar esta propuesta al producto.

## Estilo serif integrado en el juego base (2026-10-25)

- Variante serif aprobada por el usuario: titulos Georgia y paleta calida conservada.
- Inicio con diario destacado y miniatura, accesos compactos; bordes y palabras
  mas ligeros; Clasicos y Ajustes con acabados comunes. Estadisticas desplegables
  en partidas base; eventos con su presentacion propia.
- Se respeta la fuente guardada para palabras y datos. La miniatura del diario
  consulta la sesion existente sin crearla ni cambiar su puzzle fijado.
- Sin migraciones ni cambios en IDs, puzzles, diccionario o formato de copias.
- 23 escenarios de proteccion del progreso correctos, incluidos fuente guardada
  y diario fijado; build correcto. Lint mantiene los 2 errores y 5 avisos previos.
- Capturas reales en `design/base/integrado.png`; partida sin desbordamientos
  a 320/390/768 px. Cambios locales, sin publicar.

## Navegacion desde el inicio de pantalla (2026-10-25)

- Al cambiar de pantalla o partida se reinicia el desplazamiento antes de pintar.
- Se desactiva la restauracion automatica de scroll del navegador mientras la app
  esta montada: Atras tambien abre la pantalla desde arriba.
- Las pestanas y secciones internas de Clasicos siguen el mismo criterio.
- Sin cambios en almacenamiento. Build y 24 escenarios de regresion correctos;
  la nueva prueba verifica scroll y conservacion de todos los registros al navegar.

## Version 0.8.0 y acceso inferior a Ajustes (2026-10-25)

- Version actualizada en appInfo, package.json y package-lock.json a 0.8.0.
- Inicio conserva Ajustes en el pie y elimina la rueda de la cabecera.
- No se altera la migracion existente ni el esquema de guardado. Se comprueba
  la actualizacion desde 0.7.3: todos los registros de IndexedDB permanecen iguales.
- Build correcto y 25 escenarios de regresion correctos, incluido el acceso inferior.
- Incluye la correccion de scroll. Version como referencia de desarrollo;
  se reserva 1.0 para cuando el juego este listo.

## Contexto

Esta hoja de ruta resume la revision tecnica y de producto realizada sobre la app con objetivo de prepararla para un lanzamiento publico.

Decisiones ya aclaradas:

- La app esta pensada como experiencia `mobile-first`.
- La introduccion de palabras sera solo mediante pulsacion de letras.
- No se considera prioritario anadir entrada por teclado.

## Estado actual

La app compila en produccion correctamente, pero todavia hay varios puntos importantes que conviene cerrar antes de considerarla lista para lanzamiento publico.

Areas revisadas:

- sistema de puzzles diarios y clasicos
- metadatos y conteos de soluciones
- persistencia y migraciones
- estructura React y gestion de estado
- rendimiento en movil y estrategia PWA
- experiencia de usuario general

## Hallazgos principales

### 1. Diario y clasico no estaban completamente aislados

Riesgo:

- El selector diario podia terminar cogiendo puzzles del pool clasico en el futuro si no se filtraba correctamente el conjunto de entrada.

Impacto:

- Inconsistencia de producto.
- El modo diario deja de ser realmente diario o curado.

### 2. `solutionCount` no era totalmente fiable

Riesgo:

- Los conteos guardados en `puzzles.json` no siempre coincidian con el solver real.

Impacto:

- Barras de progreso incorrectas.
- Clasificacion erronea de puzzles.
- Seleccion diaria sesgada.

### 3. Persistencia funcional, pero fragil

Riesgo:

- Hay caches en memoria y escrituras en cola sin una capa fuerte de confirmacion o vaciado.

Impacto:

- Posibles inconsistencias de progreso.
- Casos dificiles de depurar si un usuario reporta perdida de datos.

### 4. Deuda estructural React

Riesgo:

- `lint` sigue sacando errores, en especial por `setState` dentro de efectos, dependencias incompletas y algunos tipos demasiado laxos.

Impacto:

- Mayor fragilidad ante cambios.
- Mas probabilidad de bugs sutiles en produccion.

### 5. Estrategia PWA pesada

Riesgo:

- Se estan precacheando archivos grandes, especialmente definiciones.

Impacto:

- Instalacion mas lenta.
- Peor experiencia en movil.
- Actualizaciones mas costosas.

### 6. Carga de definiciones mejorable

Riesgo:

- El archivo de definiciones es grande y hoy se procesa de forma costosa.

Impacto:

- Mas uso de memoria.
- Penalizacion en dispositivos modestos.

## Hoja de ruta por fases

## Fase 0: Bloqueantes previos al lanzamiento

### Objetivo

Corregir lo que puede romper la logica del producto o dar datos inconsistentes.

### Tareas

- Separar completamente los pools de puzzles `daily` y `classic`.
- Revisar la logica de seleccion del puzzle diario.
- Regenerar o validar de forma masiva todos los `solutionCount`.
- Confirmar que el metadato mostrado al usuario coincide con el solver real.
- Revisar los puntos criticos de persistencia: colas de escritura, limpieza de caches y borrado total.

### Criterio de terminado

- Un puzzle clasico no puede aparecer nunca como diario.
- Todos los puzzles tienen conteos consistentes.
- El progreso guardado se mantiene estable tras cerrar, recargar o volver a entrar.

## Fase 1: Robustez tecnica

### Objetivo

Reducir deuda estructural antes de ampliar funcionalidades.

### Tareas

- Corregir los errores importantes de `lint`.
- Reducir `setState` innecesarios dentro de `useEffect`.
- Simplificar el flujo de estado de `Game`.
- Simplificar el flujo de estado de `ExoticsPlay`.
- Revisar la capa `storageAdapter` para dejar mas claro que es sincronico, que es cache y que es persistencia real.

### Criterio de terminado

- El estado principal del juego resulta mas facil de seguir.
- `lint` deja de senalar problemas estructurales clave.
- El flujo de guardado es mas predecible.

## Fase 2: Rendimiento y movil

### Objetivo

Asegurar una experiencia ligera y estable en moviles reales.

### Tareas

- Reducir el peso del precache PWA.
- Evitar precachear datos no esenciales para primera carga.
- Replantear la carga de definiciones para que sea mas perezosa o segmentada.
- Reducir calculos innecesarios en pantallas de listados.
- Revisar carga inicial, navegacion y tiempos de respuesta en movil.

### Criterio de terminado

- La instalacion es mas ligera.
- La app abre rapido.
- No hay operaciones costosas innecesarias al entrar en listas o puzzles.

## Fase 3: Pulido de UX movil

### Objetivo

Refinar la experiencia tactil sin cambiar la filosofia del producto.

### Tareas

- Revisar tamano y claridad de los botones del heptagrama.
- Mejorar feedback visual al pulsar, borrar, enviar y mezclar.
- Revisar mensajes de error y exito.
- Revisar onboarding para usuarios nuevos.
- Afinar legibilidad y jerarquia visual en pantallas pequenas.

### Criterio de terminado

- La interaccion tactil se siente rapida, clara y consistente.
- Un usuario nuevo entiende que hacer sin friccion.

## Fase 4: Preparacion de beta publica

### Objetivo

Dejar la app lista para recibir usuarios reales.

### Tareas

- Anadir manejo de errores global basico.
- Dejar una checklist de regresion manual.
- Revisar exportacion/importacion y borrado completo de datos.
- Valorar telemetria minima o reporting de errores.
- Dejar visible la version instalada y un flujo claro de actualizacion.

### Criterio de terminado

- La app puede salir a beta con riesgo controlado.
- Hay proceso claro para detectar, reproducir y corregir incidencias.

## Orden de trabajo recomendado

1. Fase 0: diario, conteos y persistencia critica.
2. Fase 1: limpieza estructural y estado.
3. Fase 2: rendimiento y PWA.
4. Fase 3: pulido de UX movil.
5. Fase 4: beta publica.

## Punto de reanudacion

La proxima sesion deberia empezar por:

1. decidir si ajustamos el pipeline de generacion para que todos los `daily` queden ya dentro de rango al salir del generador
2. o si damos por valido el dataset actual y pasamos al siguiente bloque de UX/beta publica
3. mantener siempre validacion con `audit-puzzles`, `build` y `lint` tras cada cambio

## Notas de seguimiento

- 2026-04-13: Se corrigio el aislamiento entre puzzles `daily` y `classic` en la logica de sesiones diarias.
- 2026-04-13: Se creo la auditoria `npm run audit-puzzles` para validar dataset y detectar riesgos antes de tocar mas runtime.
- 2026-04-13: Validacion tras el cambio: ya no se detectan mezclas `daily/classic` en los proximos 2000 dias.
- 2026-04-13: Se sincronizaron los `solutionCount` de `puzzles.json` con el solver real y quedaron 0 desalineados.
- 2026-04-13: Tras sincronizar conteos, aparecio un nuevo hallazgo: 121 puzzles `daily` quedan fuera del rango objetivo 120-350.
- 2026-04-13: La seleccion diaria ya queda acotada al subconjunto apto sin romper compatibilidad con sesiones historicas guardadas por `puzzleId`.
- 2026-04-13: Primer endurecimiento de persistencia en `storageAdapter`: limpieza real de caches al borrar datos, invalidacion previa al precargar progreso y cache inmediata de `playerState`.
- 2026-04-13: `Settings` ya limpia explicitamente caches de runtime tras importar o borrar datos, sin depender solo del `reload`.
- 2026-04-13: Se anadio `flushPendingWrites()` para esperar a escrituras pendientes antes de exportar, importar o borrar datos.
- 2026-04-13: `Home` ya calcula su estado derivado sin `useEffect + setState`.
- 2026-04-13: `WordInput` ya no mantiene estado duplicado y refleja directamente `clickedWord`.
- 2026-04-13: Se eliminaron los antiguos componentes de feedback no usados para reducir superficie de mantenimiento.
- 2026-04-13: `UnifiedFeedback` quedo mas explicito internamente.
- 2026-04-13: `ExoticsHome` ya carga su snapshot inicial sin `useEffect`.
- 2026-04-13: Validacion actual: `npm run build` sigue correcto y `npm run lint` baja a 40 problemas (35 errores, 5 warnings).
- 2026-04-14: La PWA dejo de precachear los `.txt` pesados y el precache bajo a ~1.17 MB.
- 2026-04-14: `useDefinitions` ya comparte fetch y parseo para evitar duplicar la carga de definiciones entre pantallas.
- 2026-04-14: `ClassicList` y `DailyScreen` ya usan `solutionCount` persistido y dejan de recalcular soluciones en background.
- 2026-04-14: `Home` ya no queda bloqueada por la carga inicial del diccionario; este se difiere a pantallas jugables.
- 2026-04-14: La auditoria se amplio para detectar reglas de letras en puzzles estaticos (`k/w` fuera por completo y `x/y/ñ/q` fuera del centro).
- 2026-04-14: Estado actual del dataset frente a esa regla: 173 incumplimientos, todos por `k/w` en outer (110 daily, 63 classic), y 0 casos por centro prohibido.

- 2026-04-15: `scripts/generatePuzzles.cjs` ya aplica la nueva regla para puzzles estaticos: `k/w` fuera por completo y `x/y/Ã±/q/k/w` fuera del centro.
- 2026-04-15: `src/lib/puzzleGenerator.ts` quedo alineado con la misma politica para no dejar un generador secundario desfasado.
- 2026-04-15: El generador principal pasa a usar por defecto `public/wordlist_normalizado.txt`.
- 2026-04-15: Se regenero `src/data/puzzles.json` con las reglas nuevas; resultado actual: 474 puzzles (`272 daily`, `202 classic`).
- 2026-04-15: Validacion actual del dataset regenerado: 0 incidencias estructurales, 0 incumplimientos de reglas de letras estaticas, 0 desalineados de `solutionCount` y 0 mezclas `daily/classic` en los proximos 2000 dias.
- 2026-04-15: Quedan 7 puzzles `daily` fuera del rango 120-350 tras sincronizar conteos con el solver real.

- Este documento debe actualizarse al cierre de cada sesion.
- Cuando una tarea se complete, conviene anadir fecha y resultado.
- Si cambia una decision de producto, debe quedar reflejada aqui antes de continuar.
