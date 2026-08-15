# Diagnóstico: producción en 404, beta funcionando

Investigación realizada sin tocar ni un archivo del proyecto.

## Qué se ha comprobado

- Estado de publicación: el proyecto está publicado, visibilidad pública.
- URL publicada actual: `https://pocket-monster-playtime-beta.lovable.app` → responde **200 OK**.
- URL de preview: responde con redirección normal (302), sin errores.
- Slugs "clásicos" de la versión estable (`criaturitas`, `criaturitas-app`, `criaturitas-beta`) → **404**, es decir, no apuntan a ningún proyecto publicado.
- Historial de commits reciente: todos los cambios son de UI del mapa (nubes, camino luminoso, transformación del guardián, inicio del mapa). Ningún commit toca rutas, configuración de despliegue ni `vite.config.ts` / `src/server.ts`.
- Manifest PWA: renombrado a "Criaturitas Beta" con `id` y `start_url` propios. Es un cambio de metadatos de la app instalable, no afecta al hosting.

## Causa más probable

Este workspace es **un único proyecto de Lovable**, no dos. La "versión Beta" se creó cambiando la identidad de este mismo proyecto (nombre, iconos, manifest) y su URL publicada quedó como `pocket-monster-playtime-beta.lovable.app`.

Consecuencia: la URL de producción anterior dejó de estar asociada a ningún proyecto publicado y por eso devuelve 404. No es un fallo de código: ningún commit reciente rompe el build ni las rutas, y el sitio publicado actual carga correctamente.

Dos escenarios encajan con esto, y hay que confirmar cuál es:

1. **Se renombró el slug de este proyecto** (de la URL estable a la URL `-beta`). La URL antigua queda libre y da 404.
2. **La producción vivía en un proyecto distinto** que se ha despublicado, borrado o cuyo slug se cambió. En ese caso hay que recuperarlo desde ese otro proyecto, no desde este.

Descartado como causa: los cambios de UI del mapa, el manifest de la beta y los ajustes de badge/PWA.

## Cómo recuperar producción

Sin hacer cambios todavía; estas son las opciones, en orden recomendable:

1. **Confirmar la URL exacta que antes funcionaba.** Con el slug real se puede verificar si está libre o tomada.
2. **Si producción era otro proyecto**: abrirlo en el panel de proyectos y volver a publicarlo. No hay que tocar este repositorio.
3. **Si producción era este mismo proyecto y solo se le cambió el slug**: separar de verdad las dos versiones. Lo limpio es duplicar/remixar este proyecto en dos: uno publicado con el slug estable (con el estado congelado de la v1.0.0) y este como beta. Publicar el estado actual bajo el slug antiguo no serviría: pondría la beta en producción.
4. **Si hay dominio personalizado implicado**: revisar Ajustes del proyecto → Dominios, porque un dominio solo puede apuntar a un proyecto a la vez.

## Qué necesito de ti

- La URL exacta de producción que daba 404.
- Si recuerdas haber renombrado la URL del proyecto al crear la beta, o si la producción era un proyecto separado en tu lista.

Con eso te digo el camino exacto de recuperación y, si lo apruebas, lo ejecuto.
