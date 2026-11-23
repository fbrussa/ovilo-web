#!/usr/bin/env node
// Trae el texto de las páginas de privacidad y de soporte a `legal/`, desde las que genera la app.
//   node import-legal.mjs <carpeta con privacy.html, privacy.es.html, support.html y support.es.html>
// La carpeta es `build/legal/ovilo/` del repo de la app después de `npm run legal:build`, o una
// copia de lo publicado en foundryappsglobal.github.io/legal/ovilo/.
//
// El texto no se escribe acá: se copia tal cual. Sólo se guarda lo que va dentro de `<main>` (sin el
// pie del sitio legal de la cartera) y los links entre las cuatro páginas pasan a ser marcas
// (`{{privacy.es}}`) que `build.mjs` resuelve con la ruta de este sitio.
import fs from 'node:fs';
import path from 'node:path';

const LEGAL_PAGES = [
  { kind: 'privacy', lang: 'en', file: 'privacy.html' },
  { kind: 'privacy', lang: 'es', file: 'privacy.es.html' },
  { kind: 'support', lang: 'en', file: 'support.html' },
  { kind: 'support', lang: 'es', file: 'support.es.html' },
];

function fragmentOf(html) {
  const start = html.indexOf('<main>');
  const end = html.search(/\n\s*<hr>\s*\n\s*<footer>/);
  if (start < 0 || end < 0) throw new Error('la página no tiene <main> … <hr><footer>: cambió la plantilla del sitio legal');
  let body = html.slice(start + '<main>'.length, end).replace(/^\n/, '').trimEnd() + '\n';
  for (const p of LEGAL_PAGES) body = body.replaceAll(`href="${p.file}"`, `href="{{${p.kind}.${p.lang}}}"`);
  const left = body.match(/href="(?!https:|mailto:|\{\{)[^"]*"/);
  if (left) throw new Error(`queda un link relativo que este sitio no tiene: ${left[0]}`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) throw new Error('la página no tiene <title>');
  return `<!-- title: ${title} -->\n${body}`;
}

const dir = process.argv[2];
if (!dir) {
  console.error('uso: node import-legal.mjs <carpeta>');
  process.exit(1);
}
fs.mkdirSync(new URL('./legal/', import.meta.url), { recursive: true });
for (const p of LEGAL_PAGES) {
  const out = fragmentOf(fs.readFileSync(path.join(dir, p.file), 'utf8'));
  fs.writeFileSync(new URL(`./legal/${p.kind}.${p.lang}.html`, import.meta.url), out);
}
console.log(LEGAL_PAGES.map((p) => `legal/${p.kind}.${p.lang}.html`).join(', '));
