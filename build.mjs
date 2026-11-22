#!/usr/bin/env node
// Genera index.html (inglés), es/index.html (español) y s/index.html (el link de compartir) desde
// una sola plantilla.
//   node build.mjs
// Sin dependencias. Las dos páginas generadas se commitean: GitHub Pages las sirve tal cual.
// Todas las rutas son relativas (`base`): el sitio anda igual en ovilo.app y en
// fbrussa.github.io/ovilo-web/.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Cuando la app esté publicada: poner acá el link de la App Store y volver a correr el script.
// Con `null`, el badge se muestra sin link y con el cartel de «Próximamente», y el link de
// compartir (`s/`) lleva al sitio en todos los casos.
//
// Es el único dato que cambia. Para que App Analytics cuente las descargas que vienen de compartir
// tiene que ser el link de campaña de App Store Connect, con el token del proveedor (`pt`):
//   https://apps.apple.com/app/apple-store/id6834930963?pt=<proveedor>&mt=8
// `pt` sale de generar un link de campaña en App Store Connect (Analytics > Acquisition >
// Campaigns > +) y es el mismo para toda la cuenta. `s/` le suma `ct=share-<juego>`.
// Sin `pt`, este script corta sin escribir nada (`storeUrlProblem`).
const APP_STORE_URL = null;

const LEGAL = 'https://foundryappsglobal.github.io/legal/ovilo/';

// Los colores de cada juego, de `src/features/games/colors.ts` de la app.
const GAMES = [
  { id: 'crosswordAuto', base: '#D23F22', deep: '#A93619', on: '#FFFFFF' },
  { id: 'crosswordClassic', base: '#2E7D32', deep: '#1B5E20', on: '#FFFFFF' },
  { id: 'wordsearch', base: '#0A7F72', deep: '#086358', on: '#FFFFFF' },
  { id: 'wordconnect', base: '#1F74C9', deep: '#17589B', on: '#FFFFFF' },
  { id: 'wordguess', base: '#CC2F72', deep: '#981F55', on: '#FFFFFF' },
  { id: 'alphabet', base: '#F5B021', deep: '#B37600', on: '#2A2233' },
  { id: 'sudoku', base: '#6A4FE0', deep: '#45309F', on: '#FFFFFF' },
];

// El juego gratis de cada día, de `src/features/games/calendar.ts` de la app.
const WEEK = ['wordguess', 'wordsearch', 'sudoku', 'wordconnect', 'wordguess', 'crosswordAuto', 'crosswordClassic'];

// Las palabras de las ilustraciones, de `ART_WORDS` en `Illustration.tsx` de la app.
const ART_WORDS = {
  es: { search: ['GATO', 'XSOL', 'MARE', 'LUNA'], auto: ['>SOL', 'v.A.', 'MAR>', '.R.v'], guess: 'PLAZA', wheel: 'CASO' },
  en: { search: ['BIRD', 'XSUN', 'LAKE', 'STAR'], auto: ['>SUN', 'v.E.', 'SEA>', '.A.v'], guess: 'MOUSE', wheel: 'EATS' },
};

const T = {
  en: {
    lang: 'en',
    base: '',
    other: { href: 'es/', label: 'Español', code: 'es' },
    title: 'Ovilo — Six new puzzles every day. No ads. No coins. Works offline.',
    description: 'Crosswords, word search, letter wheel, guess the word and sudoku for iPhone: a new level of each every day, and A to Z every Friday. No ads, no coins, no internet needed.',
    promise: ['Six new puzzles every day.', 'No ads.', 'No coins.', 'Works offline.'],
    sub: 'Crosswords, word search, sudoku and more: a new level of each one every day, and A to Z every Friday. One free every day; all of them with Ovilo Pro.',
    soon: 'Coming soon',
    soonNote: 'Coming soon to iPhone and iPad.',
    badgeAlt: 'Download on the App Store',
    videoLabel: 'A 30-second look at Ovilo',
    videoNote: '',
    whyTitle: 'Just the games',
    why: [
      ['ads', 'No ads', 'None. No banners, no videos to sit through between levels.'],
      ['coins', 'No coins', 'No coins to earn or spend, and no lives to run out of.'],
      ['offline', 'No internet', 'Every level is on your phone. Play on a plane or in the subway.'],
      ['daily', 'A free game every day', 'The game of the day is the same for everyone, and it is always free.'],
      ['account', 'No account', 'Open it and play. No sign-up, no email, no profile.'],
    ],
    gamesTitle: 'Seven games, one app',
    gamesSub: 'A new level of each one every day, A to Z every Friday, and hints for when you get stuck.',
    names: { crosswordAuto: 'Arrow Crossword', crosswordClassic: 'Classic Crossword', wordsearch: 'Word Search', wordconnect: 'Letter Wheel', wordguess: 'Guess the Word', alphabet: 'A to Z', sudoku: 'Sudoku' },
    how: {
      crosswordAuto: 'The clues sit inside the grid, each with an arrow that shows where the answer goes.',
      crosswordClassic: 'Fill the grid with the answers to the clues, across and down.',
      wordsearch: 'Find every word on the list hidden in the grid.',
      wordconnect: 'Connect the letters on the wheel to make every word on the board.',
      wordguess: 'Guess the five-letter word in six tries or fewer.',
      alphabet: 'Go around the alphabet: one clue for each letter.',
      sudoku: 'Fill every row, column and 3 × 3 box with the numbers 1 to 9, no repeats.',
    },
    shotAlt: 'Ovilo on iPhone:',
    weekTitle: 'A free game, every day',
    weekSub: 'Each day of the week has its game. Play it, keep your streak going, come back tomorrow.',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    freeNote: 'Also free: one sample level of every game. Ovilo Pro unlocks all the games every day, the archive of earlier days and unlimited hints.',
    endTitle: 'Shall we play today’s?',
    privacy: 'Privacy Policy',
    support: 'Support',
    privacyHref: 'privacy.html',
    supportHref: 'support.html',
    noTrack: 'This site uses no cookies and no trackers.',
    credit: 'Apple, the Apple logo, iPhone and iPad are trademarks of Apple Inc., registered in the U.S. and other countries and regions. App Store is a service mark of Apple Inc.',
    switchLabel: 'Language',
  },
  es: {
    lang: 'es',
    base: '../',
    other: { href: '../', label: 'English', code: 'en' },
    title: 'Ovilo — Seis juegos nuevos cada día. Sin anuncios. Sin monedas. Sin internet.',
    description: 'Crucigramas, sopa de letras, rueda de letras, adivina la palabra y sudoku para iPhone: un nivel nuevo de cada uno todos los días, y De la A a la Z cada viernes. Sin anuncios, sin monedas y sin internet.',
    promise: ['Seis juegos nuevos cada día.', 'Sin anuncios.', 'Sin monedas.', 'Sin internet.'],
    sub: 'Crucigramas, sopa de letras, sudoku y más: un nivel nuevo de cada uno todos los días, y De la A a la Z cada viernes. Gratis, uno por día; con Ovilo Pro, todos.',
    soon: 'Próximamente',
    soonNote: 'Próximamente en iPhone y iPad.',
    badgeAlt: 'Descárgalo en el App Store',
    videoLabel: 'Ovilo en 30 segundos',
    videoNote: '',
    whyTitle: 'Solo los juegos',
    why: [
      ['ads', 'Sin anuncios', 'Ninguno. Ni carteles ni videos que esperar entre nivel y nivel.'],
      ['coins', 'Sin monedas', 'Ni monedas que juntar o gastar, ni vidas que se acaban.'],
      ['offline', 'Sin internet', 'Todos los niveles están en tu teléfono. Juega en el avión o en el metro.'],
      ['daily', 'Un juego gratis cada día', 'El juego del día es el mismo para todos, y siempre es gratis.'],
      ['account', 'Sin cuenta', 'La abres y juegas. Sin registro, sin correo, sin perfil.'],
    ],
    gamesTitle: 'Siete juegos, una app',
    gamesSub: 'Un nivel nuevo de cada uno todos los días, De la A a la Z cada viernes, y pistas para cuando te atascas.',
    names: { crosswordAuto: 'Crucigrama autodefinido', crosswordClassic: 'Crucigrama tradicional', wordsearch: 'Sopa de letras', wordconnect: 'Rueda de letras', wordguess: 'Adivina la palabra', alphabet: 'De la A a la Z', sudoku: 'Sudoku' },
    how: {
      crosswordAuto: 'Las definiciones van dentro de la grilla, cada una con una flecha que señala dónde va la respuesta.',
      crosswordClassic: 'Completa la grilla con las respuestas a las definiciones, en horizontal y en vertical.',
      wordsearch: 'Encuentra en la grilla todas las palabras de la lista.',
      wordconnect: 'Une las letras de la rueda para formar todas las palabras del tablero.',
      wordguess: 'Adivina la palabra de cinco letras en seis intentos o menos.',
      alphabet: 'Recorre el abecedario: una definición para cada letra.',
      sudoku: 'Completa cada fila, cada columna y cada cuadro de 3 × 3 con los números del 1 al 9, sin repetir.',
    },
    shotAlt: 'Ovilo en el iPhone:',
    weekTitle: 'Un juego gratis, todos los días',
    weekSub: 'Cada día de la semana tiene su juego. Juégalo, sigue tu racha y vuelve mañana.',
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    freeNote: 'También gratis: un nivel de muestra de cada juego. Ovilo Pro abre todos los juegos todos los días, el archivo de los días anteriores y pistas sin límite.',
    endTitle: '¿Jugamos el de hoy?',
    privacy: 'Política de privacidad',
    support: 'Soporte',
    privacyHref: 'privacy.es.html',
    supportHref: 'support.es.html',
    noTrack: 'Este sitio no usa cookies ni rastreadores.',
    credit: 'Apple, el logotipo de Apple, iPhone y iPad son marcas comerciales de Apple Inc., registradas en EE. UU. y en otros países y regiones. App Store es una marca de servicio de Apple Inc.',
    switchLabel: 'Idioma',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------------------------
// Las ilustraciones: las mismas de `Illustration.tsx` de la app, pasadas a SVG. Lado 120.
const W = '#FFFFFF';
const SOFT = 'rgba(255,255,255,.55)';
const FAINT = 'rgba(255,255,255,.22)';
const S = 120;
const GAP = 0.03;
const r2 = (n) => Math.round(n * 100) / 100;
const rect = (x, y, w, h, r, fill, extra = '') => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(r)}" fill="${fill}"${extra}/>`;
const txt = (x, y, size, fill, ch) => `<text x="${r2(x)}" y="${r2(y)}" font-size="${r2(size)}" fill="${fill}" text-anchor="middle" dominant-baseline="central">${esc(ch)}</text>`;
const svg = (body) => `<svg class="art" viewBox="0 0 ${S} ${S}" aria-hidden="true" focusable="false">${body}</svg>`;

function grid(n, cellDiv, gapK) {
  const cell = S / cellDiv;
  const gap = S * GAP * gapK;
  const total = cell * n + gap * (n - 1);
  const o = (S - total) / 2;
  return { cell, gap, at: (i) => o + i * (cell + gap) };
}

const ART = {
  sudoku(g) {
    const { cell, at } = grid(3, 3.6, 1);
    const digits = ['5', '', '3', '', '7', '', '9', '', '1'];
    return digits.map((d, i) => {
      const x = at(i % 3), y = at(Math.floor(i / 3)), mid = i === 4;
      return rect(x, y, cell, cell, cell * 0.28, mid ? W : FAINT) + (d ? txt(x + cell / 2, y + cell / 2, cell * 0.6, mid ? g.deep : W, d) : '');
    }).join('');
  },
  wordsearch(g, words) {
    const { cell, gap, at } = grid(4, 4.6, 0.5);
    const ring = S * 0.025;
    let out = '';
    words.search.forEach((row, ri) => [...row].forEach((ch, ci) => {
      out += txt(at(ci) + cell / 2, at(ri) + cell / 2, cell * 0.62, ri === 1 && ci > 0 ? W : SOFT, ch);
    }));
    out += `<rect x="${r2(at(1) - ring / 2)}" y="${r2(at(1) + ring / 2)}" width="${r2(cell * 3 + gap * 2 + ring)}" height="${r2(cell - ring)}" rx="${r2((cell - ring) / 2)}" fill="none" stroke="${W}" stroke-width="${ring}"/>`;
    return out;
  },
  crosswordAuto(g, words) {
    const { cell, at } = grid(4, 4.7, 0.8);
    let out = '';
    words.auto.forEach((row, ri) => [...row].forEach((ch, ci) => {
      const x = at(ci), y = at(ri);
      if (ch === '>' || ch === 'v' || ch === '.') {
        out += rect(x, y, cell, cell, cell * 0.22, g.deep);
        if (ch !== '.') out += txt(x + cell / 2, y + cell / 2, cell * 0.62, SOFT, ch === '>' ? '›' : '⌄');
      } else {
        out += rect(x, y, cell, cell, cell * 0.22, W);
        if (ri === 0 || ri === 2) out += txt(x + cell / 2, y + cell / 2, cell * 0.6, g.deep, ch);
      }
    }));
    return out;
  },
  crosswordClassic(g) {
    const { cell, at } = grid(4, 4.7, 0.8);
    let out = '';
    ['1..2', '.##.', '3...', '.#.#'].forEach((row, ri) => [...row].forEach((ch, ci) => {
      const x = at(ci), y = at(ri);
      out += rect(x, y, cell, cell, cell * 0.22, ch === '#' ? g.deep : W);
      if (ch !== '#' && ch !== '.') out += txt(x + cell * 0.3, y + cell * 0.3, cell * 0.3, g.deep, ch);
    }));
    return out;
  },
  alphabet(g) {
    const letters = [...'ABCDEFGHIJ'];
    const r = S * 0.36, dot = S * 0.17;
    let out = '';
    letters.forEach((ch, i) => {
      const a = (i / letters.length) * Math.PI * 2 - Math.PI / 2;
      const cx = S / 2 + r * Math.cos(a), cy = S / 2 + r * Math.sin(a), on = i === 0;
      out += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(dot / 2)}" fill="${on ? W : FAINT}"/>` + txt(cx, cy, dot * 0.58, on ? g.deep : W, ch);
    });
    return out + txt(S / 2, S / 2, dot * 1.4, W, 'A');
  },
  wordguess(g, words) {
    const tile = S / 6, gap = S * GAP * 0.8;
    const total = tile * 5 + gap * 4, o = (S - total) / 2;
    const y1 = S / 2 - gap * 0.75 - tile / 2, y2 = S / 2 + gap * 0.75 + tile / 2;
    const state = [2, 0, 1, 0, 2];
    let out = '';
    [...words.guess].forEach((ch, i) => {
      const cx = o + i * (tile + gap) + tile / 2, st = state[i];
      if (st === 2) out += `<circle cx="${r2(cx)}" cy="${r2(y1)}" r="${r2(tile / 2)}" fill="${W}"/>`;
      else if (st === 1) out += `<circle cx="${r2(cx)}" cy="${r2(y1)}" r="${r2(tile / 2 - S * 0.01)}" fill="none" stroke="${W}" stroke-width="${S * 0.02}"/>`;
      else out += `<circle cx="${r2(cx)}" cy="${r2(y1)}" r="${r2(tile / 2)}" fill="${FAINT}"/>`;
      out += txt(cx, y1, tile * 0.56, st === 2 ? g.deep : st === 1 ? W : SOFT, ch);
      out += `<circle cx="${r2(cx)}" cy="${r2(y2)}" r="${r2(tile / 2 - S * 0.00625)}" fill="none" stroke="${SOFT}" stroke-width="${S * 0.0125}"/>`;
    });
    return out;
  },
  wordconnect(g, words) {
    const wheel = S * 0.78, r = wheel * 0.32, dot = wheel * 0.26;
    let out = `<circle cx="${S / 2}" cy="${S / 2}" r="${r2(wheel / 2)}" fill="${FAINT}"/>`;
    [...words.wheel].forEach((ch, i, all) => {
      const a = (i / all.length) * Math.PI * 2 - Math.PI / 2;
      const cx = S / 2 + r * Math.cos(a), cy = S / 2 + r * Math.sin(a), on = i < 2;
      if (on) out += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(dot / 2)}" fill="${W}"/>`;
      out += txt(cx, cy, dot * 0.62, on ? g.deep : W, ch);
    });
    return out;
  },
};
const art = (g, lang) => svg(ART[g.id](g, ART_WORDS[lang]));

// ---------------------------------------------------------------------------------------------
const SYMBOL = fs.readFileSync(new URL('./assets/img/ovilo-symbol.svg', import.meta.url), 'utf8')
  .replace(/<svg /, '<svg class="symbol" aria-hidden="true" focusable="false" ')
  .replace(/ width="\d+" height="\d+"/, '')
  .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="currentColor"')
  .replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="currentColor"');

// Las fichas que flotan detrás de la cabecera: letra, posición (%), tamaño (px), giro y color.
const FLOAT = [
  ['A', 6, 14, 54, -14, 0], ['R', 88, 10, 46, 12, 2], ['G', 14, 62, 40, 10, 5], ['U', 80, 70, 52, -9, 3],
  ['J', 46, 4, 36, 8, 4], ['E', 94, 42, 38, -12, 6], ['H', 2, 40, 34, 16, 1], ['B', 62, 88, 40, 6, 2],
];
const WORDMARK = [['O', 1], ['V', 5], ['I', 6], ['L', 3], ['O', 0]];

const ICONS = {
  ads: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  account: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/><path d="M3.5 3.5l17 17"/>',
  offline: '<path d="M2.5 9.5a14 14 0 0 1 19 0"/><path d="M6 13a9 9 0 0 1 12 0"/><path d="M9.3 16.4a4.2 4.2 0 0 1 5.4 0"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/><path d="M3.5 3.5l17 17"/>',
  coins: '<circle cx="9" cy="9" r="5.5"/><path d="M14.2 10.2a5.5 5.5 0 1 1-4 4"/><path d="M3.5 3.5l17 17"/>',
  daily: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8.5 15l2.3 2.3 4.7-4.8"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;

function page(t) {
  const b = t.base;
  const badge = `<img class="badge" src="${b}assets/img/app-store-badge-${t.lang}.svg" width="150" height="50" alt="${esc(t.badgeAlt)}">`;
  const cta = APP_STORE_URL
    ? `<a class="store" href="${esc(APP_STORE_URL)}">${badge}</a>`
    : `<div class="store" aria-label="${esc(t.soonNote)}"><span class="soon">${esc(t.soon)}</span>${badge}</div>`;
  const poster = t.lang === 'es' ? 'poster.jpg' : 'poster-en.jpg';
  const video = `<video class="screen" src="${b}assets/video/ovilo-promo-${t.lang}.mp4" poster="${b}assets/video/${poster}" width="720" height="1280" autoplay muted loop playsinline controls preload="metadata" aria-label="${esc(t.videoLabel)}"></video>`;

  const games = GAMES.map((g, i) => `
      <article class="game reveal${i % 2 ? ' flip' : ''}" style="--g:${g.base};--deep:${g.deep};--on:${g.on}">
        <div class="game-text">
          ${art(g, t.lang)}
          <h3>${esc(t.names[g.id])}</h3>
          <p>${esc(t.how[g.id])}</p>
        </div>
        <div class="game-shot">
          <div class="phone"><img class="screen" src="${b}assets/shots/${t.lang}/${g.id}.jpg" width="600" height="1304" loading="lazy" decoding="async" alt="${esc(`${t.shotAlt} ${t.names[g.id]}`)}"></div>
        </div>
      </article>`).join('');

  const week = WEEK.map((id, i) => {
    const g = GAMES.find((x) => x.id === id);
    return `
        <li style="--g:${g.base};--deep:${g.deep};--on:${g.on}"><span class="day">${esc(t.days[i])}</span>${art(g, t.lang)}<span class="day-game">${esc(t.names[id])}</span></li>`;
  }).join('');

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description)}">
<meta name="theme-color" content="#FFF6EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1A1622" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<link rel="alternate" hreflang="en" href="https://ovilo.app/">
<link rel="alternate" hreflang="es" href="https://ovilo.app/es/">
<link rel="alternate" hreflang="x-default" href="https://ovilo.app/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t.title)}">
<meta property="og:description" content="${esc(t.description)}">
<meta property="og:image" content="https://ovilo.app/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${b}assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="${b}assets/img/icon-180.png">
<link rel="preload" href="${b}assets/fonts/nunito-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${b}assets/site.css">
<script>
// El idioma del navegador manda la primera vez; después, el que la persona eligió en el selector.
(function () {
  var here = '${t.lang}', want;
  try { want = localStorage.getItem('ovilo-lang'); } catch (e) {}
  if (!want && here === 'en') want = /^es\\b/i.test(navigator.language || '') ? 'es' : 'en';
  if (want && want !== here && !/[?&]stay\\b/.test(location.search)) location.replace('${t.other.href}' + location.hash);
})();
</script>
</head>
<body>
<header class="top">
  <a class="brand" href="./" aria-label="Ovilo">${SYMBOL}<span>Ovilo</span></a>
  <nav class="langs" aria-label="${esc(t.switchLabel)}">
    <a href="${t.lang === 'en' ? './' : '../'}" data-lang="en" lang="en"${t.lang === 'en' ? ' aria-current="page"' : ''}>English</a>
    <a href="${t.lang === 'es' ? './' : 'es/'}" data-lang="es" lang="es"${t.lang === 'es' ? ' aria-current="page"' : ''}>Español</a>
  </nav>
</header>

<main>
  <section class="hero">
    <div class="floaters" aria-hidden="true">${FLOAT.map(([ch, x, y, s, rot, gi], i) => `<span style="left:${x}%;top:${y}%;--s:${s}px;--r:${rot}deg;--g:${GAMES[gi].base};--d:${i * -1.7}s">${ch}</span>`).join('')}</div>
    <div class="hero-text">
      <img class="app-icon" src="${b}assets/img/icon-256.png" width="112" height="112" alt="">
      <p class="wordmark" aria-label="Ovilo">${WORDMARK.map(([ch, gi], i) => `<span aria-hidden="true" style="--g:${GAMES[gi].base};--on:${GAMES[gi].on};--i:${i}">${ch}</span>`).join('')}</p>
      <h1>${t.promise.map((p, i) => `<span${i ? ' class="accent"' : ''}>${esc(p)}</span>`).join(' ')}</h1>
      <p class="sub">${esc(t.sub)}</p>
      ${cta}
    </div>
    <div class="hero-video">
      <div class="phone">${video}</div>
      ${t.videoNote ? `<p class="video-note">${esc(t.videoNote)}</p>` : ''}
    </div>
  </section>

  <section class="why">
    <h2 class="reveal">${esc(t.whyTitle)}</h2>
    <ul class="why-grid">${t.why.map(([k, title, text], i) => `
      <li class="reveal" style="--i:${i}"><span class="why-icon">${icon(k)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`).join('')}
    </ul>
  </section>

  <section class="games">
    <h2 class="reveal">${esc(t.gamesTitle)}</h2>
    <p class="lead reveal">${esc(t.gamesSub)}</p>
    <div class="game-list">${games}
    </div>
  </section>

  <section class="week">
    <h2 class="reveal">${esc(t.weekTitle)}</h2>
    <p class="lead reveal">${esc(t.weekSub)}</p>
    <ol class="week-row reveal">${week}
    </ol>
    <p class="free-note reveal">${esc(t.freeNote)}</p>
  </section>

  <section class="end reveal">
    ${SYMBOL}
    <h2>${esc(t.endTitle)}</h2>
    <p>${esc(t.soonNote)}</p>
  </section>
</main>

<footer>
  <nav aria-label="Legal">
    <a href="${LEGAL}${t.privacyHref}">${esc(t.privacy)}</a>
    <a href="${LEGAL}${t.supportHref}">${esc(t.support)}</a>
  </nav>
  <p>${esc(t.noTrack)}</p>
  <p class="credit">${esc(t.credit)}</p>
</footer>
<script src="${b}assets/site.js" defer></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------------------------
// El link de compartir: `https://ovilo.app/s/?g=<juego>`, lo que la app pone en lo que se comparte.
//
// - En iPhone y iPad lleva a la ficha de la App Store con el token de campaña de Apple
//   `ct=share-<juego>`: App Analytics cuenta las descargas que vienen de compartir, por juego. Es de
//   Apple; acá no se mide nada.
// - En cualquier otro lado, el sitio, en el idioma del navegador.
// - Mientras `APP_STORE_URL` es `null`, el sitio en todos los casos.
//
// GitHub Pages no redirige desde el servidor: lo decide este script, que va entero en la página.
// `test.mjs` lo prueba. Va escrito en ES5, como `assets/site.js`.
export function shareTarget(store, games, search, ua, touchPoints, language, savedLang) {
  var m = /[?&]g=([^&#]*)/.exec(search || '');
  var g = m ? m[1] : '';
  // Sólo un juego conocido entra en el token: lo demás cuenta como «share», sin juego.
  var campaign = games.indexOf(g) >= 0 ? 'share-' + g : 'share';
  // El iPad se presenta como una Mac; lo delata la pantalla táctil.
  var ios = /iPhone|iPad|iPod/.test(ua || '') || (/Macintosh/.test(ua || '') && touchPoints > 1);
  if (store && ios) return store + (store.indexOf('?') < 0 ? '?' : '&') + 'ct=' + campaign;
  var lang = savedLang === 'es' || savedLang === 'en' ? savedLang : /^es\b/i.test(language || '') ? 'es' : 'en';
  // La misma regla que el sitio: el idioma elegido en el selector y, si no hay, el del navegador.
  return lang === 'es' ? '../es/' : '../';
}

function sharePage() {
  const t = T.en;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#FFF6EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1A1622" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(t.title)}">
<meta property="og:description" content="${esc(t.description)}">
<meta property="og:image" content="https://ovilo.app/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="../assets/img/icon-180.png">
<script>
// El link de compartir de la app: a la App Store en iPhone y iPad, al sitio en lo demás.
// Sin cookies, sin analítica, sin pedidos a terceros.
(function () {
  ${shareTarget.toString().replace(/\n/g, '\n  ')}
  var saved;
  try { saved = localStorage.getItem('ovilo-lang'); } catch (e) {}
  location.replace(shareTarget(${JSON.stringify(APP_STORE_URL)}, ${JSON.stringify(GAMES.map((g) => g.id))}, location.search, navigator.userAgent, navigator.maxTouchPoints || 0, navigator.language, saved));
})();
</script>
<noscript><meta http-equiv="refresh" content="0; url=../"></noscript>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FFF6EC;color:#2A2233;font:600 17px/1.4 ui-rounded,system-ui,sans-serif}a{color:#CF4A0C}@media (prefers-color-scheme:dark){body{background:#1A1622;color:#F7F0E8}a{color:#FF8A3D}}</style>
</head>
<body>
<p><a href="../">Ovilo</a></p>
</body>
</html>
`;
}

// Qué le falta a `APP_STORE_URL` para publicarse, o `null` si está bien. `null` (sin publicar) vale.
// Sin el token del proveedor (`pt`) el link anda igual y App Analytics no cuenta ninguna descarga
// de compartir: nada falla, así que tiene que fallar acá.
export function storeUrlProblem(url) {
  if (url === null) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return 'APP_STORE_URL no es una dirección válida.';
  }
  if (u.protocol !== 'https:' || u.hostname !== 'apps.apple.com') return 'APP_STORE_URL tiene que ser un link https://apps.apple.com/…';
  if (!/^\d+$/.test(u.searchParams.get('pt') ?? '')) {
    return 'APP_STORE_URL no lleva el token del proveedor (pt=<número>). Sin él, App Analytics no cuenta las descargas que vienen de compartir. Sale de generar un link de campaña en App Store Connect (Analytics > Acquisition > Campaigns > +).';
  }
  // El token de campaña lo pone `s/`, por juego: uno fijo acá lo pisaría.
  if (u.searchParams.has('ct')) return 'APP_STORE_URL no lleva ct=: lo suma la página s/ (ct=share-<juego>).';
  return null;
}

// `node build.mjs` escribe las páginas; importarlo (`test.mjs`) no escribe nada.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problem = storeUrlProblem(APP_STORE_URL);
  if (problem !== null) {
    console.error(`build.mjs: ${problem}`);
    process.exit(1);
  }
  fs.writeFileSync(new URL('./index.html', import.meta.url), page(T.en));
  fs.mkdirSync(new URL('./es/', import.meta.url), { recursive: true });
  fs.writeFileSync(new URL('./es/index.html', import.meta.url), page(T.es));
  fs.mkdirSync(new URL('./s/', import.meta.url), { recursive: true });
  fs.writeFileSync(new URL('./s/index.html', import.meta.url), sharePage());
  console.log('index.html, es/index.html, s/index.html');
}

export const GAME_IDS = GAMES.map((g) => g.id);
export { APP_STORE_URL, sharePage };
