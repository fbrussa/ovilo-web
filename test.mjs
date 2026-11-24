#!/usr/bin/env node
// Pruebas del link de compartir (`s/`).   node --test test.mjs
// Sin dependencias: el decididor es una función pura de `build.mjs`, y además se corre el script
// tal como quedó escrito en `s/index.html`, con un navegador de mentira.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test, { describe, it } from 'node:test';
import vm from 'node:vm';

import { execFileSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import { APP_STORE_URL, GAME_IDS, LEGAL_KINDS, RELEASE, T, inPreorder, legalPage, legalPath, page, releaseDay, releaseProblem, sharePage, shareTarget, siteStoreUrl, storeUrlProblem } from './build.mjs';

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

test('APP_STORE_URL: sin publicar vale; publicado, tiene que traer pt y no traer ct', () => {
  assert.equal(storeUrlProblem(null), null);
  assert.equal(storeUrlProblem(STORE), null);
  assert.match(storeUrlProblem('https://apps.apple.com/app/id6834930963'), /pt=/);
  assert.match(storeUrlProblem('https://apps.apple.com/app/id6834930963?mt=8'), /pt=/);
  assert.match(storeUrlProblem('https://apps.apple.com/app/id6834930963?pt='), /pt=/);
  assert.match(storeUrlProblem('https://apps.apple.com/app/id6834930963?pt=<proveedor>&mt=8'), /pt=/);
  // «pt=» dentro de otro parámetro no cuenta.
  assert.match(storeUrlProblem('https://apps.apple.com/app/id6834930963?opt=1'), /pt=/);
  assert.match(storeUrlProblem('https://apps.apple.com/app/id6834930963?pt=123&ct=web'), /ct=/);
  assert.match(storeUrlProblem('http://apps.apple.com/app/id1?pt=123'), /apps\.apple\.com/);
  assert.match(storeUrlProblem('https://example.com/app?pt=123'), /apps\.apple\.com/);
  assert.match(storeUrlProblem('id6834930963'), /válida/);
});

test('el APP_STORE_URL de hoy pasa', () => {
  assert.equal(storeUrlProblem(APP_STORE_URL), null);
});

// `node build.mjs` de verdad, sobre una copia del sitio con otro APP_STORE_URL.
function buildWith(value) {
  // `realpath`: en la Mac la carpeta temporal es un enlace, y `build.mjs` compara su propia ruta.
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'ovilo-web-'));
  try {
    execFileSync('cp', ['-R', new URL('./assets', import.meta.url).pathname, dir]);
    execFileSync('cp', ['-R', new URL('./legal', import.meta.url).pathname, dir]);
    const src = fs.readFileSync(new URL('./build.mjs', import.meta.url), 'utf8');
    const edited = src.replace(/^const APP_STORE_URL = .*;$/m, `const APP_STORE_URL = ${JSON.stringify(value)};`);
    assert.ok(edited.includes(`const APP_STORE_URL = ${JSON.stringify(value)};`), 'no encontré APP_STORE_URL en build.mjs');
    fs.writeFileSync(path.join(dir, 'build.mjs'), edited);
    const run = spawnSync(process.execPath, [path.join(dir, 'build.mjs')], { encoding: 'utf8' });
    return { status: run.status, stderr: run.stderr, wrote: fs.existsSync(path.join(dir, 's', 'index.html')) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('node build.mjs falla, sin escribir nada, si el link de la tienda no lleva pt', () => {
  const run = buildWith('https://apps.apple.com/app/id6834930963');
  assert.equal(run.status, 1);
  assert.match(run.stderr, /pt=/);
  assert.equal(run.wrote, false);
});

test('node build.mjs pasa con el link de campaña', () => {
  const run = buildWith(STORE);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.wrote, true);
});

// Privacidad y soporte (FO-597): las URLs van en la ficha de la App Store y dentro de la app.
describe('privacidad y soporte', () => {
  const pages = LEGAL_KINDS.flatMap((kind) => ['en', 'es'].map((lang) => ({ kind, lang, path: legalPath(kind, lang) })));

  it('las cuatro rutas son las publicadas en la ficha', () => {
    assert.deepEqual(pages.map((p) => p.path), ['privacy/', 'es/privacy/', 'support/', 'es/support/']);
  });

  for (const p of pages) {
    it(`${p.path} está al día con build.mjs, no se indexa y no tiene rutas absolutas`, () => {
      const html = fs.readFileSync(new URL(`./${p.path}index.html`, import.meta.url), 'utf8');
      assert.equal(html, legalPage(p.kind, p.lang));
      assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
      assert.match(html, new RegExp(`<html lang="${p.lang}">`));
      assert.doesNotMatch(html, /(href|src)="\//);
      assert.doesNotMatch(html, /foundryappsglobal/);
    });
  }

  it('el pie de la home lleva a las dos, en los dos idiomas', () => {
    for (const home of ['index.html', 'es/index.html']) {
      const html = fs.readFileSync(new URL(`./${home}`, import.meta.url), 'utf8');
      assert.match(html, /<a href="privacy\/">/);
      assert.match(html, /<a href="support\/">/);
    }
  });
});

// La reserva (FO-609): hasta la fecha de salida el sitio dice que la app se reserva y cuándo sale;
// desde ese instante el texto se va solo, sin volver a publicar.
describe('la reserva', () => {
  const DAY = 24 * 3600 * 1000;
  const at = Date.parse('2026-12-16T08:00:00Z');
  const opts = (now) => ({ store: STORE, release: '2026-12-16T08:00:00Z', now });
  const PRE = { en: [/Pre-order/, /Available December 16/], es: [/Reserva/, /Disponible el 16 de diciembre/] };

  // El script del <head> tal como quedó escrito, con un reloj de mentira: devuelve si la página
  // quedó marcada como `released`, que es lo que esconde `.pre` en el CSS.
  function released(html, now) {
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((x) => x.includes("' released'"));
    if (!script) return null;
    const document = { documentElement: { className: '' } };
    vm.runInNewContext(script, { Date: { now: () => now }, document });
    return / released\b/.test(document.documentElement.className);
  }
  // Lo que se lee en la página: sin lo que lleva la clase que el CSS esconde en ese estado.
  const visible = (html, isReleased) => html.replace(new RegExp(`<(span|p) class="[^"]*\\b${isReleased ? 'pre' : 'post'}\\b[^"]*">[^<]*</\\1>`, 'g'), '');

  it('la fecha sale de RELEASE, en los dos idiomas', () => {
    assert.equal(releaseDay('en', '2026-12-16T08:00:00Z'), 'December 16');
    assert.equal(releaseDay('es', '2026-12-16T08:00:00Z'), '16 de diciembre');
    assert.equal(releaseDay('en', '2027-01-05T08:00:00Z'), 'January 5');
    assert.equal(releaseProblem(RELEASE), null);
    assert.equal(releaseProblem(null), null);
    assert.match(releaseProblem('16/12/2026'), /RELEASE/);
    assert.match(releaseProblem('2026-12-16'), /RELEASE/);
  });

  it('el CSS esconde .pre cuando la página está marcada como released, y .post cuando no', () => {
    const css = fs.readFileSync(new URL('./assets/site.css', import.meta.url), 'utf8');
    assert.match(css, /\.released \.pre, html:not\(\.released\) \.post \{ display: none; \}/);
  });

  for (const lang of ['en', 'es']) {
    it(`${lang}: antes del 16/12 dice que es una reserva y la fecha`, () => {
      const html = page(T[lang], opts(at - 20 * DAY));
      for (const now of [at - 20 * DAY, at - 1]) {
        assert.equal(released(html, now), false);
        for (const re of PRE[lang]) assert.match(visible(html, false), re);
      }
      assert.doesNotMatch(html, /Coming soon|Próximamente/);
    });

    it(`${lang}: desde el 16/12 el texto de reserva se va solo, sin volver a publicar`, () => {
      const html = page(T[lang], opts(at - 20 * DAY));
      for (const now of [at, at + 1, at + 300 * DAY]) {
        assert.equal(released(html, now), true);
        const seen = visible(html, true);
        assert.doesNotMatch(seen, /Pre-order|Reserva|Resérvala|December|diciembre/);
        assert.match(seen, lang === 'es' ? /<p class="post">En iPhone y iPad\.<\/p>/ : /<p class="post">On iPhone and iPad\.<\/p>/);
        // El botón sigue ahí, con su link.
        assert.match(seen, /<a class="store" href="https:\/\/apps\.apple\.com\//);
      }
    });

    it(`${lang}: un build corrido después del 16/12 ya no escribe nada de la reserva`, () => {
      const html = page(T[lang], opts(at + DAY));
      assert.doesNotMatch(html, /Pre-order|Reserva|Resérvala|December|diciembre|released|class="[^"]*\b(pre|post)\b/);
      assert.match(html, /<a class="store" href="https:\/\/apps\.apple\.com\//);
    });

    it(`${lang}: sin la app en la tienda, «Próximamente» y ningún link`, () => {
      const html = page(T[lang], { store: null, release: '2026-12-16T08:00:00Z', now: at - DAY });
      assert.match(html, /Coming soon|Próximamente/);
      assert.doesNotMatch(html, /apps\.apple\.com|Pre-order|Resérvala/);
    });
  }

  it('reserva sólo con la app en la tienda y antes de la fecha', () => {
    assert.equal(inPreorder(STORE, RELEASE, Date.parse(RELEASE) - 1), true);
    assert.equal(inPreorder(STORE, RELEASE, Date.parse(RELEASE)), false);
    assert.equal(inPreorder(null, RELEASE, 0), false);
    assert.equal(inPreorder(STORE, null, 0), false);
  });

  it('el botón del sitio lleva pt y ct=web; s/ sigue con ct=share-<juego>', () => {
    const to = new URL(siteStoreUrl(STORE));
    assert.equal(to.searchParams.get('pt'), '123');
    assert.equal(to.searchParams.get('ct'), 'web');
    assert.equal(to.searchParams.getAll('ct').length, 1);
  });

  it('las dos páginas publicadas: el link de la ficha con ct=web, sin «Próximamente», y con la reserva hasta la fecha', () => {
    if (APP_STORE_URL === null) return;
    for (const [file, lang] of [['index.html', 'en'], ['es/index.html', 'es']]) {
      const html = fs.readFileSync(new URL(`./${file}`, import.meta.url), 'utf8');
      const href = /<a class="store" href="([^"]+)"/.exec(html)[1].replace(/&amp;/g, '&');
      assert.equal(href, siteStoreUrl(APP_STORE_URL));
      assert.equal(new URL(href).searchParams.get('ct'), 'web');
      assert.doesNotMatch(html, /Coming soon|Próximamente/);
      // Publicadas antes de la fecha, llevan el texto de reserva y el script que lo saca.
      if (released(html, Date.parse(RELEASE) - 1) === false) {
        for (const re of PRE[lang]) assert.match(html, re);
        assert.equal(released(html, Date.parse(RELEASE)), true);
      }
      // Nada de terceros: la única dirección de afuera es la ficha.
      const hosts = [...html.matchAll(/https?:\/\/([^/"'\s]+)/g)].map((m) => m[1]);
      assert.deepEqual([...new Set(hosts)].filter((h) => !['ovilo.app', 'apps.apple.com', 'www.w3.org'].includes(h)), []);
    }
  });
});
