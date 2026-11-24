# ovilo-web

El sitio promocional de **Ovilo**, en inglés (`/`) y en español (`/es/`). Estático, sin framework,
publicado con GitHub Pages desde `main`.

- Dominio: `https://ovilo.app/` (mientras el DNS no esté cargado: `https://fbrussa.github.io/ovilo-web/`).
- Sin analítica, sin cookies y sin pedidos a terceros: la fuente, el video y los badges se sirven desde acá.
- El código de la app no vive en este repo.

## Cómo se edita

Las dos páginas salen de una sola plantilla:

```
node build.mjs          # escribe index.html, es/index.html, s/index.html y las de privacidad y soporte
node --test test.mjs    # las pruebas del link de compartir, de la reserva y de las páginas legales
```

Los textos de los dos idiomas están arriba de `build.mjs` (`T.en`, `T.es`). Los estilos, en
`assets/site.css`; el poco JS, en `assets/site.js`. `index.html`, `es/index.html` y `s/index.html` se commitean:
Pages los sirve tal cual, sin compilar nada.

**Todas las rutas son relativas.** Una ruta que empieza con `/` anda en `ovilo.app` y se rompe en
`fbrussa.github.io/ovilo-web/`.

## Privacidad y soporte

Cuatro páginas, y sus rutas **no se renombran**: van en la ficha de la App Store y las abre la app.

| | Inglés | Español |
|---|---|---|
| Privacidad | `https://ovilo.app/privacy/` | `https://ovilo.app/es/privacy/` |
| Soporte | `https://ovilo.app/support/` | `https://ovilo.app/es/support/` |

El texto no se escribe acá. Sale de la app (`npm run legal:build` en su repo) y se trae con:

```
node import-legal.mjs <repo de la app>/build/legal/ovilo   # escribe legal/*.html
node build.mjs
```

`legal/` guarda sólo el cuerpo de cada página; `build.mjs` le pone el aspecto del sitio. No se
indexan (`noindex`), igual que en el sitio legal de la cartera. Las páginas viejas de
`foundryappsglobal.github.io/legal/ovilo/` siguen publicadas: las abre el build 3 de TestFlight.

## El link de compartir (`s/`)

La app comparte cada resultado con un link `https://ovilo.app/s/?g=<juego>` (`s/index.html`, que
también sale de `build.mjs`):

- **En iPhone y iPad** lleva a la ficha de la App Store con el token de campaña de Apple
  `ct=share-<juego>`: App Analytics cuenta las descargas que vienen de compartir, por juego. Es de
  Apple; el sitio no mide nada.
- **En cualquier otro lado**, el sitio, en el idioma del navegador.
- **Sin `APP_STORE_URL`** (`null`), el sitio en todos los casos.

GitHub Pages no redirige desde el servidor, así que lo decide un script en la página. Se prueba con
`node --test test.mjs`.

## El link de la App Store y la reserva

`APP_STORE_URL`, en `build.mjs`, es el link de la ficha: con él el badge es un link (con
`ct=web`, para separar en App Analytics lo que viene del sitio de lo que viene de compartir) y el
link de compartir manda el iPhone y el iPad a la ficha. Con `null`, el sitio dice «Próximamente».

La 1.0 sale como **reserva** (FO-609). `RELEASE`, también en `build.mjs`, es el instante en que la
app pasa a poder descargarse, y **es el único lugar donde está la fecha**. Hasta entonces el botón
lleva el cartel «Pre-order» / «Reserva» y, debajo, «Available December 16» / «Disponible el 16 de
diciembre». Ese día el texto **se va solo, sin volver a publicar**: un script en el `<head>`
compara la hora del navegador con `RELEASE` y esconde lo que lleva la clase `pre`. Un
`node build.mjs` corrido después de la fecha ya no escribe nada de la reserva. Si Apple mueve la
fecha, se cambia `RELEASE` y se vuelve a correr el script.

El badge es el de «Download on the App Store»: el de «Pre-order» de Apple no se pudo bajar de
App Store Marketing Tools sin sesión, así que la reserva la dicen el cartel y la línea.

Para que App Analytics cuente las descargas por juego, ese link tiene que ser el de campaña, con el
token del proveedor (`pt`): `https://apps.apple.com/app/apple-store/id6834930963?pt=<proveedor>&mt=8`.
`pt` sale de generar un link de campaña en App Store Connect (Analytics > Acquisition > Campaigns >
+) y es el mismo para toda la cuenta. Apple pide los dos tokens: con `ct` solo, la campaña no
aparece.

**`node build.mjs` falla si `APP_STORE_URL` no es `null` y no trae `pt=<número>`**, sin escribir
nada: publicar sin `pt` no rompe nada a la vista y deja la campaña sin contar descargas.

## De dónde sale cada cosa

| Qué | Origen |
|---|---|
| Colores, ilustraciones de los juegos, nombres y cómo se juega | La app (`src/features/games/` y sus diccionarios) |
| Símbolo e ícono | `design/brand/` de la app |
| Capturas (`assets/shots/`) | La app corriendo en el simulador, en cada idioma |
| Video (`assets/video/`) | Los promos en español y en inglés, recomprimidos a H.264 720×1280 y 30 fps |
| Badges de la App Store | Los oficiales de Apple (App Store Marketing Tools), sin modificar |
| Nunito (`assets/fonts/`) | Respaldo de la tipografía redondeada del sistema fuera de Apple. Licencia OFL, incluida |

`docs/capturas/` guarda capturas del sitio en los dos idiomas.

## Dominio propio

El archivo `CNAME` (con `ovilo.app`) se agrega recién cuando el DNS responde: con el dominio
cargado en Pages, la URL de github.io redirige a `ovilo.app`, y si el DNS no está el sitio queda
inaccesible. `.app` sólo abre con HTTPS, así que el dominio tampoco abre hasta que GitHub emite el
certificado.
