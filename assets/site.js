// Ovilo — lo mínimo de JS: recordar el idioma elegido, la entrada suave al desplazar y el video.
// Sin cookies, sin analítica, sin pedidos a terceros.
(function () {
  var doc = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // El selector guarda la elección en este navegador (localStorage), para no volver a mandar a la
  // persona al idioma del sistema cada vez que entra.
  document.querySelectorAll('.langs a').forEach(function (a) {
    a.addEventListener('click', function () {
      try { localStorage.setItem('ovilo-lang', a.getAttribute('data-lang')); } catch (e) {}
    });
  });

  if (!calm && 'IntersectionObserver' in window) {
    doc.classList.add('js');
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { seen.observe(el); });
  }

  // El video se reproduce solo y sin sonido mientras está a la vista. Con «menos movimiento»
  // queda quieto, con sus controles, hasta que la persona le da a reproducir.
  var video = document.querySelector('.hero-video video');
  if (video) {
    if (calm) {
      video.removeAttribute('autoplay');
      video.pause();
      video.controls = true;
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!video.muted) return; // si le puso sonido, manda la persona
          if (e.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause();
        });
      }, { threshold: 0.2 }).observe(video);
    }
  }
})();
