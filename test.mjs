#!/usr/bin/env node
// Pruebas del link de compartir (`s/`).   node --test test.mjs
// Sin dependencias: el decididor es una función pura de `build.mjs`, y además se corre el script
// tal como quedó escrito en `s/index.html`, con un navegador de mentira.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import { APP_STORE_URL, GAME_IDS, sharePage, shareTarget } from './build.mjs';

const STORE = 'https://apps.apple.com/app/apple-store/id6834930963?pt=123&mt=8';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15';
const MAC = IPAD;
const ANDROID = 'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

test('los siete juegos de la app', () => {
  assert.deepEqual([...GAME_IDS].sort(), ['alphabet', 'crosswordAuto', 'crosswordClassic', 'sudoku', 'wordconnect', 'wordguess', 'wordsearch']);
});

test('iPhone, con la app publicada: a la ficha, con el token de campaña del juego', () => {
  for (const g of GAME_IDS) {
    const to = new URL(shareTarget(STORE, GAME_IDS, `?g=${g}`, IPHONE, 5, 'en-US', null));
    assert.equal(to.origin + to.pathname, 'https://apps.apple.com/app/apple-store/id6834930963');
    assert.equal(to.searchParams.get('ct'), `share-${g}`);
    assert.equal(to.searchParams.get('pt'), '123');
    // Apple admite hasta 30 caracteres en el token de campaña.
    assert.ok(`share-${g}`.length <= 30);
  }
});

test('iPad: se presenta como una Mac con pantalla táctil, y va a la ficha', () => {
  assert.match(shareTarget(STORE, GAME_IDS, '?g=sudoku', IPAD, 5, 'en-US', null), /^https:\/\/apps\.apple\.com\/.*ct=share-sudoku$/);
});

test('una Mac de verdad, Android y Windows: el sitio, en el idioma del navegador', () => {
  assert.equal(shareTarget(STORE, GAME_IDS, '?g=sudoku', MAC, 0, 'en-US', null), '../');
  assert.equal(shareTarget(STORE, GAME_IDS, '?g=sudoku', ANDROID, 5, 'es-MX', null), '../es/');
  assert.equal(shareTarget(STORE, GAME_IDS, '?g=sudoku', WINDOWS, 0, 'fr-FR', null), '../');
  assert.equal(shareTarget(STORE, GAME_IDS, '?g=sudoku', WINDOWS, 0, undefined, null), '../');
});

test('el idioma que la persona eligió en el sitio manda sobre el del navegador', () => {
  assert.equal(shareTarget(STORE, GAME_IDS, '?g=sudoku', ANDROID, 5, 'es-AR', 'en'), '../');
  assert.equal(shareTarget(STORE, GAME_IDS, '?g=sudoku', ANDROID, 5, 'en-US', 'es'), '../es/');
});

test('sin publicar: el sitio en todos los casos, también en iPhone', () => {
  assert.equal(shareTarget(null, GAME_IDS, '?g=sudoku', IPHONE, 5, 'en-US', null), '../');
  assert.equal(shareTarget(null, GAME_IDS, '?g=sudoku', IPHONE, 5, 'es-ES', null), '../es/');
});

test('un juego que no existe, o ninguno: el token no lleva lo que vino en el link', () => {
  for (const search of ['', '?g=', '?g=nada', '?g=sudoku%26pt%3D999', '?g=<script>', '?x=1']) {
    const to = new URL(shareTarget(STORE, GAME_IDS, search, IPHONE, 5, 'en-US', null));
    assert.equal(to.searchParams.get('ct'), 'share');
    assert.equal(to.searchParams.get('pt'), '123');
  }
  assert.match(shareTarget(STORE, GAME_IDS, '?utm=x&g=wordguess', IPHONE, 5, 'en-US', null), /ct=share-wordguess$/);
});

test('un link de la App Store sin parámetros: el token entra con «?»', () => {
  assert.equal(shareTarget('https://apps.apple.com/app/id1', GAME_IDS, '?g=sudoku', IPHONE, 5, 'en', null), 'https://apps.apple.com/app/id1?ct=share-sudoku');
});

// El script de la página, corrido tal cual con un navegador de mentira.
function run(html, { search, ua, touch = 0, language = 'en-US', saved = null }) {
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  let went = null;
  vm.runInNewContext(script, {
    location: { search, replace: (to) => (went = to) },
    navigator: { userAgent: ua, maxTouchPoints: touch, language },
    localStorage: { getItem: () => saved },
  });
  return went;
}

test('la página publicada (s/index.html) es la que genera build.mjs', () => {
  assert.equal(fs.readFileSync(new URL('./s/index.html', import.meta.url), 'utf8'), sharePage());
});

test('la página publicada: hoy lleva al sitio; con la app publicada, el iPhone va a la ficha', () => {
  const html = fs.readFileSync(new URL('./s/index.html', import.meta.url), 'utf8');
  if (APP_STORE_URL === null) {
    assert.equal(run(html, { search: '?g=sudoku', ua: IPHONE, touch: 5 }), '../');
    assert.equal(run(html, { search: '?g=sudoku', ua: IPHONE, touch: 5, language: 'es-AR' }), '../es/');
  } else {
    assert.equal(new URL(run(html, { search: '?g=sudoku', ua: IPHONE, touch: 5 })).searchParams.get('ct'), 'share-sudoku');
  }
  assert.equal(run(html, { search: '?g=sudoku', ua: WINDOWS }), '../');
  assert.equal(run(html, { search: '?g=sudoku', ua: ANDROID, touch: 5, language: 'es-MX' }), '../es/');
  assert.equal(run(html, { search: '?g=sudoku', ua: ANDROID, touch: 5, language: 'es-MX', saved: 'en' }), '../');
});

test('la página no pide nada a terceros ni guarda nada', () => {
  const html = fs.readFileSync(new URL('./s/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /document\.cookie|setItem|fetch\(|XMLHttpRequest|sendBeacon|gtag|analytics/i);
  // Las únicas direcciones absolutas: la imagen de la vista previa, en el propio sitio.
  const hosts = [...html.matchAll(/https?:\/\/([^/"'\s]+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(hosts)].filter((h) => h !== 'ovilo.app' && !(APP_STORE_URL ?? '').includes(h)), []);
  assert.match(html, /<meta name="robots" content="noindex">/);
});
