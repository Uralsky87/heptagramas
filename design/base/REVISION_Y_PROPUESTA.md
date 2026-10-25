# Palabrarium · revisión estética del juego base

25 de octubre de 2026. **Variante serif aprobada e integrada localmente. Sin publicar.**

## Resultado integrado

La variante serif se ha trasladado al juego: títulos Georgia, Inicio con diario
destacado, accesos compactos, palabras y bordes más ligeros, Clásicos y Ajustes.
Los títulos conviven con la fuente guardada para palabras y datos sin cambiar esa
preferencia. Las estadísticas de las partidas base se pueden desplegar; los eventos
conservan su presentación. El acceso al diario sigue abriendo su pantalla habitual.

La miniatura de Inicio respeta el puzzle de una sesión diaria existente y solo lee
sus datos. No se cambian IDs, diccionario, puzzles, formato de copias ni esquema
de almacenamiento; no hay migraciones. Pasan los 23 escenarios de protección del
progreso, incluidos fuente guardada y diario fijado. Build correcto; lint mantiene
los 2 errores y 5 avisos previos. Sin desbordamiento en partida a 320/390/768 px.

Capturas reales: `integrado.png`, `integrado-inicio.png`, `integrado-partida.png`,
`integrado-clasicos.png` e `integrado-ajustes.png`. Con Vite en el puerto 5174,
`node scripts/previewBaseStyle.mjs --integrated` las regenera en un perfil temporal.
`integrado.html` permite ver la composición. Lo que sigue documenta la propuesta
original y las alternativas que se revisaron antes de aprobarla.

## Revisión original

Se han revisado tema, tipografías, Inicio, Diario, Clásicos, partida y Ajustes,
y se han capturado Inicio y una partida del código actual en un navegador aislado.

## Lo que conviene conservar

La combinación de verde bosque, papel cálido, terracota, salvia y tinta café da
identidad al juego. Transmite una biblioteca tranquila y un objeto que apetece
abrir. El heptagrama y su central terracota ya se reconocen bien. La navegación
por modos y secciones también puede mantenerse.

La propuesta usa los colores del tema actual de `src/lib/themes.ts`:

| Función | Color conservado |
| --- | --- |
| Fondo | `#243630` |
| Papel | `#f0dfc3` |
| Letras exteriores | `#566252` → `#7c846f` |
| Central | `#b45a37` → `#d48852` |
| Acción principal | `#9f4f32` → `#ca8151` como familia de color |
| Bordes y detalles | `#8f6d4d` |
| Texto secundario | `#6a5541` |

Se permiten luces derivadas para el papel y los separadores; no se propone sustituir
la paleta ni la identidad de los eventos.

## Qué mejoraría y por qué

### Inicio: dar prioridad sin perder accesos

Actualmente conviven el marco exterior de papel, un panel verde, la placa del
título, la tarjeta del nivel y varios botones grandes de peso visual parecido.
La pantalla funciona, pero obliga a recorrer bastante altura para ver todos los modos.

Propongo una superficie principal de papel, nivel en una línea y un diario con
jerarquía propia. Clásicos, Exóticos y Eventos pasan a filas con iconos y texto.
Ajustes queda accesible desde la cabecera y el pie. El cambio es de presentación:
se conservan todos los destinos, incluido el calendario de eventos.

### Partida: aligerar lo que rodea al heptagrama

El tablero conserva forma, colores y entrada táctil. Propongo suavizar su sombra,
ordenar el espacio de cabecera y dar a Enviar el mayor peso entre las acciones.
Mezclar y borrar tienen un tratamiento secundario coherente.

El texto actual del campo dice «Escribe o haz clic…» aunque es de solo lectura.
«Toca las letras del tablero…» explica mejor la interacción ya decidida.

### Palabras y progreso: menos objetos compitiendo

Las fichas actuales combinan gradiente, contorno, sombra y bastante peso de texto.
El contador, rango y logros añaden otros recuadros. Propongo fichas con un único
borde fino, fondo suave, progreso lineal y metadatos más discretos. Los logros
mantendrían su diferencia mediante acentos cálidos, sin depender solo del color.

Las estadísticas desplegables son una **opción de interacción pendiente de aprobar**:
reducen altura al jugar, pero podrían mantenerse abiertas para quien las consulte
mucho. No se ha cambiado el comportamiento real.

### Tipografía: una opción gradual, no un cambio obligatorio

La monoespaciada forma parte de la personalidad actual y la aplicación guarda una
preferencia de fuente. La propuesta conserva esa voz en letras, palabras y pequeños
datos. Añade una variante con títulos Georgia, similar al toque editorial aprobado
para Halloween, y una variante con los títulos también monoespaciados.

La maqueta permite alternarlas. Aplicar una de ellas al juego necesitaría decidir
cómo respetar la preferencia existente; esta revisión no modifica ajustes guardados.

### Clásicos: mantener secciones, ordenar la lectura

Se conservan Secciones, Largos y la agrupación de veinte puzzles. Se separan mejor
el número de sección, el intervalo de heptagramas y su progreso. El listado usa el
mismo borde, tipografía y lenguaje visual que Inicio.

### Ajustes, definiciones y detalles comunes

Propongo botones y diálogos de papel, bordes finos y jerarquía coherente con la
partida. La maqueta muestra Ajustes en un diálogo para inspeccionar acabados;
no supone decidir que la pantalla actual deba convertirse en una ventana modal.

La tinta secundaria del tema (`#6a5541` sobre `#f0dfc3`) ofrece aproximadamente
5,37:1 de contraste. Conviene reservar los tonos más claros para líneas y adornos,
y mantener esta tinta en explicaciones pequeñas. Iconos, foco, estados y tamaños
táctiles deberían revisarse en móvil real al integrar cualquier cambio.

## Ver la propuesta

- `propuesta.png`: composición general con explicación y tres pantallas.
- `propuesta-pantallas.png`: Inicio, partida y Clásicos; abierta en VS Code.
- `propuesta-typewriter.png`: la misma composición con títulos monoespaciados.
- `propuesta-ajustes.png`: muestra de Ajustes.
- `propuesta-movil.png`: composición a 390 px de ancho.
- `actual-inicio.png`, `actual-partida.png`: capturas del juego actual para referencia.

Vista interactiva: iniciar `npm run dev -- --host 127.0.0.1 --port 5174 --strictPort`
y abrir `http://127.0.0.1:5174/heptagramas/design/base/index.html`.
Se puede usar **Simple Browser: Show** en VS Code con esa dirección.

La maqueta permite pulsar letras, enviar, mezclar, abrir definiciones y estadísticas,
alternar títulos, inspeccionar Clásicos y ver los acabados de Ajustes. La selección
de secciones es una muestra visual; no inicia partidas clásicas. Exportar, importar
y sonidos no ejecutan acciones reales.

## Datos y seguridad

`preview-data.json` usa un puzzle ya existente, `daily-072`, con A central,
S L O I Y F exteriores y 143 soluciones verificadas con el solver. Se eligió por
sus palabras familiares para la composición; **no sustituye el diario programado
para el 25 de octubre**. Seis palabras encontradas, nivel y progreso de secciones
son ejemplos de diseño, no datos de ninguna persona.

La maqueta solo carga ese JSON. No importa App ni ningún módulo de almacenamiento,
no utiliza IndexedDB o localStorage y no escribe progreso. La captura de la app
actual se hizo con un perfil temporal de Chrome, separado del perfil del usuario.
El servidor es local y no se ha publicado la propuesta.

Para reproducir los datos: `node node_modules/tsx/dist/cli.mjs scripts/prepareBaseDesign.ts`.
Para comprobar interacciones y generar capturas, con Vite en el puerto anterior:
`node scripts/previewBaseStyle.mjs`. Detecta Chrome en su ruta habitual de Windows;
se puede indicar otro ejecutable mediante `PROGRESS_TEST_BROWSER`.

Se verificaron tablero, palabra válida, definiciones, tipografías, pestañas de
Clásicos, Ajustes y estadísticas. No hay desbordamiento horizontal a 320 o 390 px.
Estos controles validan la maqueta; no sustituyen una revisión de accesibilidad
ni pruebas táctiles con dispositivos reales.

## Cómo lo aplicaría después de revisarlo contigo

1. Unificar bordes, sombras, espaciado y botones, manteniendo la estructura.
2. Decidir si los títulos serif se adoptan y cómo conviven con la fuente elegida.
3. Trasladar la composición de Inicio y el tratamiento de palabras/listados.
4. Decidir el estado inicial de las estadísticas y pulir Ajustes y definiciones.

Cada fase sería visual y acotada. No requiere alterar IDs, diccionario, puzzles
o formato de copias. Cualquier cambio con riesgo para el progreso debe explicarse
antes, conforme al criterio que ya se ha dejado registrado.
