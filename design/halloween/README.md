# Halloween · propuesta visual y estudio de letras

Propuesta local del 25 de octubre de 2026, aprobada por el usuario y trasladada
al evento real. Esta maqueta sigue siendo independiente y no lee ni escribe partidas.

## Resultado integrado

Se ha elegido **Calabazas y escobas**. El evento real usa central A, exteriores
B C L O S Z y regalo E a las 50 palabras, con 280 → 482 soluciones. Se repite
del 31 de octubre al 30 de noviembre y conserva el progreso por temporada.
`juego-integrado.png` muestra una captura móvil del componente real con datos
de prueba aislados. El evento está registrado; todavía no se ha publicado.
Las otras opciones de esta maqueta se conservan como referencia del estudio.

## Dirección visual

**Una noche de palabras**: Halloween acogedor, de biblioteca y otoño. Fondo
ciruela, papel crema, naranja calabaza, detalles malva y salvia. Ilustración SVG
propia con dos calabazas, luna, murciélagos y telaraña. La tipografía monoespaciada
mantiene la relación con Palabrarium y los títulos serif aportan calidez.

Se muestran dos momentos: invitación desde Inicio y pantalla de partida.
El tablero mantiene la central naranja y el resto malva. Las palabras temáticas
destacan en pequeñas etiquetas de papel dorado. El regalo puede revelar una letra
salvia. Los colores son del evento; no se propone alterar los temas globales.

Calendario previsto: **31 de octubre–30 de noviembre, ambos incluidos, cada año**.
El indicador Activo de la maqueta representa cómo se verá durante ese intervalo.
El umbral de desbloqueo del regalo está pendiente; Ver permite inspeccionarlo
directamente en esta demostración.

## Ver y probar

- `propuesta.png`: captura de escritorio, abierta en una pestaña de VS Code.
- `propuesta-movil.png`: captura de la composición a 390 px de ancho.
- `index.html`, `preview.css`, `preview.js`: maqueta navegable, independiente de React y del almacenamiento.
- `letter-research.json`: resultados calculados con el diccionario y solver reales.

Para la vista interactiva: ejecutar `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
y abrir `http://127.0.0.1:5174/heptagramas/design/halloween/index.html`.
En VS Code también se puede usar el comando **Simple Browser: Show** con esa URL.
Los cuatro candidatos cambian las letras, las palabras y los conteos. El regalo,
mezclar, pulsar letras y enviar permiten revisar la interacción. La validación de
esta demo acepta solo sus palabras temáticas, no todo el diccionario.

Las dos palabras encontradas de la captura son ejemplos de composición. No se
conservan al recargar. No se carga el arranque de App, sus migraciones ni IndexedDB.

## Letras contrastadas

| Dirección | Central | Exteriores | Regalo | Soluciones iniciales → ampliadas | Palabras temáticas |
| --- | --- | --- | --- | --- | --- |
| Calabazas y escobas | A | B C L O S Z | E | 280 → 482 | calabaza, calabozo; después escoba |
| El rincón de la bruja | U | A B J M R T | E | 116 → 214 | bruja, tumba; después muerte, muerta |
| Entre las telarañas | A | E L Ñ R T V | C | 286 → 683 | vela, araña, telaraña; después calavera |
| La hora del misterio | T | E M O R S U | N | 235 → 450 | susto, muerte, muerto, temor, terror; después monstruo |

**Primera propuesta: Calabazas y escobas.** Encaja con la ilustración, ofrece
280 soluciones iniciales y una recompensa que incorpora una palabra reconocible.
**Entre las telarañas** es una alternativa con más variedad temática y ñ.
La opción de misterio cubre más familias, pero su vocabulario es más sombrío.
No se han elegido aún las letras definitivas.

Todas las palabras de la tabla están en el diccionario actual, respetan las letras
y contienen la central. No requieren excepciones ni palabras añadidas a mano.
Los conteos usan el solver del juego, longitud mínima 3 y ñ permitida.

La lista inicial explora 35 familias: calabaza, bruja, escoba, fantasma, miedo,
susto, tumba, noche, hechizo, calavera, cadáver, vela, murciélago, araña, telaraña,
monstruo, vampiro, zombi, calabozo, muerte, temor, terror, oscuridad, sombra, hueso,
ritual, gato, luna, máscara, ataúd, momia, sangre, diablo, cuervo y sapo.

## Método y límites

`scripts/exploreHalloween.ts` normaliza las palabras y comprueba su presencia en
las 109 735 entradas únicas del diccionario. Combina conjuntos de letras de hasta
tres familias, busca tableros de siete letras con una octava desbloqueable y
compara cobertura temática por familias. Contrasta una preselección de 302
configuraciones con el solver y penaliza conteos excesivos o muy pequeños.

Es una búsqueda dirigida por este vocabulario, no una demostración del óptimo
global entre todos los tableros posibles. Los resultados pueden cambiar si se
priorizan otras palabras o se prescinde del regalo. La ausencia de una propuesta
para fantasma en el informe significa que no pasó los filtros de esta búsqueda,
no que sea imposible construir un tablero con esa palabra.

El diccionario no incluye muchos plurales habituales de esta lista (por ejemplo,
calabazas o brujas). No se han incorporado automáticamente: añadirlos sería una
decisión de contenido posterior. El informe enumera los que faltan.

Para reproducir el estudio: `node node_modules/tsx/dist/cli.mjs scripts/exploreHalloween.ts`.
Para comprobar interacciones, desbordamiento móvil y regenerar capturas, con Vite
en el puerto indicado: `node scripts/previewHalloween.mjs` (Chrome en Windows;
se puede indicar otro ejecutable mediante `PROGRESS_TEST_BROWSER`). El capturador
usa un perfil temporal y lo elimina al terminar.

## Siguiente decisión

Revisar estética y escoger las palabras imprescindibles. Después cerrar letras,
umbral del regalo, definiciones y textos; registrar el nuevo evento con su propio
identificador anual y trasladar el tema a los componentes del juego. Se conserva
el criterio de avisar antes de cualquier cambio que pueda poner en riesgo progreso
existente. Esta propuesta no necesita una migración de datos.
