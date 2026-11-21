# ovilo-web

El sitio promocional de **Ovilo**, en inglés (`/`) y en español (`/es/`). Estático, sin framework,
publicado con GitHub Pages desde `main`.

- Dominio: `https://ovilo.app/` (mientras el DNS no esté cargado: `https://fbrussa.github.io/ovilo-web/`).
- Sin analítica, sin cookies y sin pedidos a terceros: la fuente, el video y los badges se sirven desde acá.
- El código de la app no vive en este repo.

## Cómo se edita

Las dos páginas salen de una sola plantilla:

```
node build.mjs      # escribe index.html y es/index.html
```

Los textos de los dos idiomas están arriba de `build.mjs` (`T.en`, `T.es`). Los estilos, en
`assets/site.css`; el poco JS, en `assets/site.js`. `index.html` y `es/index.html` se commitean:
Pages los sirve tal cual, sin compilar nada.

**Todas las rutas son relativas.** Una ruta que empieza con `/` anda en `ovilo.app` y se rompe en
`fbrussa.github.io/ovilo-web/`.

## Cuando la app esté publicada

En `build.mjs`, poner el link de la App Store en `APP_STORE_URL` y correr `node build.mjs`: el
badge pasa a ser un link y desaparece «Próximamente».

## De dónde sale cada cosa

| Qué | Origen |
|---|---|
| Colores, ilustraciones de los juegos, nombres y cómo se juega | La app (`src/features/games/` y sus diccionarios) |
| Símbolo e ícono | `design/brand/` de la app |
| Capturas (`assets/shots/`) | La app corriendo en el simulador, en cada idioma |
| Video (`assets/video/`) | `ovilo-promo-es.mp4`, recomprimido a H.264 720×1280 y 30 fps |
| Badges de la App Store | Los oficiales de Apple (App Store Marketing Tools), sin modificar |
| Nunito (`assets/fonts/`) | Respaldo de la tipografía redondeada del sistema fuera de Apple. Licencia OFL, incluida |

`docs/capturas/` guarda capturas del sitio en los dos idiomas.

## Dominio propio

El archivo `CNAME` (con `ovilo.app`) se agrega recién cuando el DNS responde: con el dominio
cargado en Pages, la URL de github.io redirige a `ovilo.app`, y si el DNS no está el sitio queda
inaccesible. `.app` sólo abre con HTTPS, así que el dominio tampoco abre hasta que GitHub emite el
certificado.
