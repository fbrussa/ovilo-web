# Conectar `ovilo.app` (GoDaddy → GitHub Pages)

Valores confirmados contra la documentación de GitHub Pages el 21/11/2026. Son unos 10 minutos.
Hasta que termines, el sitio sigue abriendo en `https://fbrussa.github.io/ovilo-web/`.

## 1. Verificar el dominio en GitHub (evita que otro repo lo tome)

1. En github.com, clic en tu foto (arriba a la derecha) → **Settings**. Es la configuración de la
   cuenta, no la del repo.
2. En la barra izquierda, sección «Code, planning, and automation» → **Pages**.
3. **Add a domain** → escribí `ovilo.app` → **Add domain**.
4. GitHub muestra un registro TXT: un nombre que empieza con `_github-pages-challenge-fbrussa` y un
   valor (un código largo). Dejá esa pestaña abierta: el valor se copia en el paso 2.

## 2. Cargar los registros en GoDaddy

1. Entrá a godaddy.com → **Mis productos** → al lado de `ovilo.app`, **DNS** (o «Administrar DNS»).
2. **Borrá** el registro tipo **A** con nombre `@` que dice «Parked» (o «WebsiteBuilder Site»).
   Si no deja borrarlo, editá ese mismo registro con el primer valor de la lista de abajo.
3. Si hay un registro **CNAME** con nombre `www`, borralo: se crea de nuevo abajo.
4. En la misma página, pestaña **Reenvío** (Forwarding): si hay un reenvío del dominio, eliminalo.
5. Con **Agregar nuevo registro**, cargá estos seis (TTL: el que viene por defecto):

| Tipo | Nombre | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `fbrussa.github.io` |
| TXT | `_github-pages-challenge-fbrussa` | el código que mostró GitHub en el paso 1 |

En el TXT, GoDaddy agrega solo el `.ovilo.app` al nombre: escribí únicamente
`_github-pages-challenge-fbrussa`. En el CNAME, el valor va sin `https://` y sin `/ovilo-web`.

Opcional (IPv6), cuatro registros **AAAA** con nombre `@`: `2606:50c0:8000::153`,
`2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

No toques los registros **NS** ni el **SOA**.

## 3. Comprobar que quedó

En la Terminal de la Mac:

```
dig ovilo.app +short
dig www.ovilo.app +short
dig _github-pages-challenge-fbrussa.ovilo.app TXT +short
```

El primero tiene que devolver las cuatro direcciones `185.199.…` y nada más (si aparece otra, quedó
el registro «Parked»). El segundo, `fbrussa.github.io.` y debajo las mismas direcciones. El
tercero, el código de GitHub. Suele verse en minutos; puede tardar hasta 24 horas.

Cuando el tercero responda, volvé a la pestaña de GitHub del paso 1 y tocá **Verify**. Dejá el TXT
cargado para siempre: si se borra, el dominio deja de estar verificado.

## 4. Avisar en el ticket

Con los tres `dig` bien, comentá en FO-580. El resto lo hace el agente: agrega el archivo `CNAME`,
carga el dominio en el repo y activa HTTPS.

Entre que se activa y GitHub emite el certificado, `ovilo.app` **no abre en ningún navegador**: los
dominios `.app` sólo funcionan con HTTPS. Es normal y puede tardar hasta 24 horas (suele ser menos
de una).
