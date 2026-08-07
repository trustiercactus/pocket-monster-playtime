# Mapa 2.0 — Mapa general + Mundos independientes

Rediseño completo del sistema de mapa, sin tocar combate, colección, huevos, progreso ni guardado.

## Idea central

Hoy el "mundo" es el mismo mapa ampliado con zoom. A partir de ahora habrá **dos pantallas distintas**:

1. **Mapa General** — vista de todo el reino, con el camino del Pueblo al Castillo Final.
2. **Escenario de Mundo** — una ilustración propia a pantalla completa de la zona actual.

La cámara ya no amplía el mapa: hace un fundido cinematográfico del mapa general al escenario del mundo.

## 1. Mapa General

- Vista vertical completa: se ven las 9 zonas a la vez, sin scroll.
- Camino continuo Pueblo → Castillo Final; los tramos ya recorridos brillan en dorado, los que faltan se ven apagados.
- Zonas bloqueadas: cubiertas parcialmente por nubes mágicas que respiran suavemente.
- Zona actual: halo brillante que late + el compañero del niño de pie encima.
- Castillo Final: siempre visible arriba, más grande, oscuro, con aura morada.
- Corona de esmeraldas arriba (igual que ahora, sin cambios).

Al entrar, el mapa se muestra quieto **2,5 s** para que el niño vea todo el viaje. Luego pasa solo al escenario del mundo actual.

## 2. Transición

```text
MAPA GENERAL                TRANSICION                ESCENARIO DEL MUNDO
[todo el reino]  --->  destello + nubes que    --->   [bosque a pantalla
 zona actual late       cruzan la pantalla            completa, con vida]
        2,5 s                  0,9 s
```

- Nubes blancas barren la pantalla y, al abrirse, ya estamos dentro del mundo.
- No hay recorte ni ampliación del mapa: es un cambio de escena real.
- Vibración corta y sonido mágico en el momento del cambio.

## 3. Escenario de cada mundo

Pantalla completa, sin scroll, con:

- Ilustración propia del bioma (fondo nuevo por zona, formato vertical).
- Capas de vida: partículas de ambiente propias (hojas, nieve, chispas, burbujas, plumas...) y elementos animados suaves.
- El guardián en el centro, flotando/respirando, con ojos brillantes.
- El compañero del niño abajo a un lado.
- Un único botón gigante: **⚔️ Luchar** (arranca el combate actual, sin cambios).
- Botón 🗺️ pequeño arriba para volver a ver el mapa general cuando quiera.

Escenarios previstos: Pueblo, Bosque frondoso, Montaña Nevada, Volcán, Desierto, Playa, Cielo, Islas del Cielo, Castillo Final oscuro. Se generan como ilustraciones verticales nuevas (las actuales son iconos pequeños de zona y se conservan para el mapa general).

## 4. Regreso al mapa tras ganar

Secuencia automática al derrotar un guardián:

1. Vuelve al **Mapa General** con un fundido.
2. La zona completada se ilumina y su esmeralda vuela a la corona (animación actual, se conserva).
3. El tramo de camino hasta la siguiente zona se enciende, piedra a piedra.
4. Las nubes de la siguiente zona se disipan con destello y vibración corta.
5. La cámara pasa al **escenario del nuevo mundo**.

Toda la secuencia dura unos 5 s, sin que el niño tenga que tocar nada. El narrador habla solo al final, cuando ya no hay animación en marcha.

## 5. Detalles técnicos

- Nuevo estado en `MapaMundo.tsx`: `vista: "mapa" | "mundo"`, sustituyendo al actual `cam: "wide" | "zoom"`. Se elimina la lógica de `scale()`/`transform-origin` del zoom.
- Nuevo componente `src/components/Mundo.tsx`: escenario a pantalla completa (fondo + partículas + guardián + botón Luchar). Recibe el `Area` y los callbacks que ya existen.
- `src/lib/areas.ts`: se añade a cada zona el campo `scene` (imagen del escenario). Nada más cambia; `terrain`, `pedestal`, `ambient`, `gem` y `gemCut` se reutilizan.
- Nuevo componente de transición (barrido de nubes) reutilizable, con animaciones CSS en `src/styles.css`.
- `Game.tsx` no cambia: `MapaMundo` sigue exponiendo los mismos callbacks (`onBattle`, `onCollection`, `onHome`).
- Rendimiento móvil: partículas limitadas (máx. ~10 por escena), animaciones solo con `transform`/`opacity`, imágenes de escenario a 768×1344 y carga diferida de los mundos no visibles.
- Combate, colección, casa, huevos, audio y guardado local: intactos.

## Qué NO se toca

Mecánica de combate, sistema de esmeraldas y fusión de Aurora, pantalla final, colección de 10 criaturas, ajustes de sonido y narrador, PWA/iconos Beta.
