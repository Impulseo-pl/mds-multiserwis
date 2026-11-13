// MDS Multiserwis - interakcje strony (menu, nagłówek, wjazdy, realizacje, karuzela).
(function () {
  var d = document;

  // menu mobilne
  var mnav = d.getElementById('mnav');
  function setMenu(open) {
    if (!mnav) return;
    mnav.classList.toggle('open', open);
    mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
    d.body.style.overflow = open ? 'hidden' : '';
  }
  d.querySelectorAll('[data-menu]').forEach(function (b) { b.addEventListener('click', function () { setMenu(true); }); });
  d.querySelectorAll('[data-menu-close], #mnav nav a').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeLb(); } });

  // nagłówek przyklejony: na stronie głównej wjeżdża po zejściu z hero
  var bar = d.getElementById('top-bar'), hero = d.getElementById('hero');
  if (bar && hero && !bar.classList.contains('is-static')) {
    var t = false;
    var upd = function () { bar.classList.toggle('is-on', window.scrollY > hero.offsetHeight * 0.55); t = false; };
    window.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // wjazdy sekcji
  var rv = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // przeglądarka realizacji
  var v = d.querySelector('[data-viewer]');
  if (v) {
    var jobs = (v.getAttribute('data-jobs') || '').split('|').map(function (x) { return x.split(';'); });
    var imgs = v.querySelectorAll('.stage img'), btns = v.querySelectorAll('.job');
    var tag = v.querySelector('.stage .tag');
    var cur = 0, timer = null;
    var show = function (i) {
      cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      btns.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      var j = jobs[i] || [], n = '0' + (i + 1);
      tag.textContent = 'Realizacja /' + n;
      v.querySelector('[data-cap]').textContent = j[0] || '';
      v.querySelector('[data-count]').textContent = n + ' / 0' + jobs.length;
      v.querySelector('[data-title]').textContent = 'Realizacja /' + n + ' · ' + (j[0] || '');
      v.querySelector('[data-a]').textContent = j[1] || '';
      v.querySelector('[data-b]').textContent = j[2] || '';
      v.querySelector('[data-c]').textContent = j[3] || '';
    };
    btns.forEach(function (b, k) { b.addEventListener('click', function () { show(k); clearInterval(timer); }); });
    timer = setInterval(function () { show((cur + 1) % jobs.length); }, 6000);
  }

  // lightbox
  var lb = d.getElementById('lb');
  function openLb(src, alt) { if (!lb) return; var im = lb.querySelector('img'); im.src = src; im.alt = alt || ''; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
  function closeLb() { if (lb) { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); } }
  if (lb) lb.addEventListener('click', closeLb);

  // karuzela z łukiem (widok od środka walca)
  var rb = d.querySelector('[data-ribbon]');
  if (rb) {
    var ring = rb.querySelector('.ribbon-ring');
    var orig = Array.prototype.slice.call(rb.querySelectorAll('.r-card'));
    var N = orig.length;
    // klony tylko w przeglądarce, żeby łuk był domknięty (te same pliki, zero nowych zdjęć)
    var copies = Math.max(1, Math.ceil(20 / Math.max(N, 1)));
    for (var k = 1; k < copies; k++) orig.forEach(function (c) { var cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); cl.tabIndex = -1; ring.appendChild(cl); });
    var cards = rb.querySelectorAll('.r-card');
    var step = 360 / cards.length;
    var rot = 0, target = 0, dragging = false, sx = 0, sr = 0, moved = 0;
    var cnt = d.querySelector('[data-rcount]');
    function radius() { return Math.max(480, Math.min(1000, rb.offsetWidth * 0.6)); }
    function layout() {
      var Rr = radius();
      var w = 2 * Rr * Math.sin(step * Math.PI / 360) * 0.9;
      cards.forEach(function (c, i) {
        var a = i * step + rot;
        a = ((a + 180) % 360 + 360) % 360 - 180;
        var vis = Math.abs(a) < 80;
        c.style.width = w + 'px';
        c.style.transform = 'translate(-50%,-50%) rotateY(' + a + 'deg) translateZ(' + (-Rr) + 'px)';
        c.style.opacity = vis ? Math.min(1, 1 - (Math.abs(a) - 62) / 18) : 0;
        c.style.pointerEvents = vis ? 'auto' : 'none';
      });
      ring.style.transform = 'translateZ(' + (Rr * 0.82) + 'px)';
      var idx = ((Math.round(-rot / step) % N) + N) % N;
      if (cnt) cnt.textContent = 'Zdjęcie ' + (idx + 1) + ' z ' + N;
    }
    function tick() {
      rot += (target - rot) * 0.12;
      if (!dragging && Math.abs(target - rot) < 0.02) rot = target;
      layout();
      requestAnimationFrame(tick);
    }
    rb.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; sx = e.clientX; sr = target; rb.classList.add('drag'); });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return; var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); target = sr + dx * 0.12;
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return; dragging = false; rb.classList.remove('drag'); target = Math.round(target / step) * step;
    });
    cards.forEach(function (c) {
      c.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); return; } var im = c.querySelector('img'); openLb(c.getAttribute('data-full'), im ? im.alt : ''); });
    });
    var pv = d.querySelector('[data-prev]'), nx = d.querySelector('[data-next]');
    if (pv) pv.addEventListener('click', function () { target = Math.round(target / step) * step + step; });
    if (nx) nx.addEventListener('click', function () { target = Math.round(target / step) * step - step; });
    rb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') pv && pv.click(); if (e.key === 'ArrowRight') nx && nx.click(); });
    var auto = setInterval(function () { if (!dragging) target -= step; }, 3800);
    rb.addEventListener('pointerdown', function () { clearInterval(auto); }, { once: true });
    window.addEventListener('resize', layout);
    tick();
  }
})();

// LICZNIK WAŻNOŚCI DEMA (K. 09.08: pełne odliczanie dni/godzin/minut/sekund).
// Element wstrzykuje multipage TYLKO w dema. Nie wita klienta przy wejściu - wjeżdża
// po zejściu z pierwszego ekranu i chowa się po powrocie na górę.
(function () {
  var el = document.querySelector('.demo-wazne');
  if (!el || !el.getAttribute('data-do')) return;
  var koniec = new Date(el.getAttribute('data-do') + 'T23:59:59');
  if (isNaN(koniec)) return;
  var txt = el.querySelector('.dw-txt') || el;
  var dwa = function (n) { return (n < 10 ? '0' : '') + n; };

  var cykl = parseInt(el.getAttribute('data-cykl') || '0', 10);   // dni; 0 = brak wznowienia
  function tyka() {
    var teraz = new Date(), ms = koniec - teraz;
    // po wygaśnięciu licznik rusza od nowa (K. 10.08) - dema i tak zostają, a odliczanie
    // ma dawać klientowi realne poczucie, że sprawa ma termin.
    while (ms <= 0 && cykl > 0) {
      koniec = new Date(koniec.getTime() + cykl * 86400000);
      ms = koniec - teraz;
    }
    if (ms <= 0) { txt.innerHTML = 'Wersja pokazowa wygasła'; el.classList.add('is-koniec'); return false; }
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    var g = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sek = s % 60;
    var zegar = dwa(g) + ':' + dwa(m) + ':' + dwa(sek);
    txt.innerHTML = d > 0
      ? 'Wersja pokazowa · <b>' + d + ' dni</b> <span class="dw-zeg">' + zegar + '</span>'
      : 'Wersja pokazowa · <b class="dw-pilne">' + zegar + '</b>';
    el.classList.toggle('is-pilne', d === 0);
    return true;
  }
  if (tyka() !== false) setInterval(tyka, 1000);
  el.hidden = false;

  var tick = false;
  function stan() {
    el.classList.toggle('is-on', (window.scrollY || 0) > window.innerHeight * 0.55);
    tick = false;
  }
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true; requestAnimationFrame(stan);
  }, { passive: true });
  stan();
})();


/* === DOLNY PASEK MOBILE: chowa się przy stopce ===
   Lekcja 13.08.2026 (Zielony Azymut): klient zgłosił, że pasek „Zapytaj o termin"
   zasłania treść na dole strony. Rezerwę pod treścią daje CSS (razem z safe-area
   iPhone'a), a tu drugie zabezpieczenie: gdy w kadrze jest stopka albo sekcja CTA
   - czyli te same przyciski - pasek zjeżdża w dół i wraca po odjechaniu w górę.
   Brak IntersectionObserver = pasek zostaje widoczny, czyli stan sprzed zmiany. */
(function () {
  try {
    var pasek = document.querySelector('.sticky-reserve, .sticky-call');
    if (!pasek || !('IntersectionObserver' in window)) return;
    var cele = document.querySelectorAll('footer, .cta');
    if (!cele.length) return;
    var widoczne = 0;
    var io = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) { widoczne += w.isIntersecting ? 1 : -1; });
      if (widoczne < 0) widoczne = 0;
      pasek.classList.toggle('schowany', widoczne > 0);
    }, { threshold: 0.01 });
    cele.forEach(function (el) { io.observe(el); });
  } catch (e) {}
})();
/* === licznik otwarć demo (buy-signal) v3 - geo po stronie serwera === */
(function(){try{if(String(location.protocol).indexOf('http')!==0)return;try{if(/[?&#]team=1/.test(location.search+location.hash)){localStorage.setItem('nb_team','1');}}catch(e){}try{if(localStorage.getItem('nb_team')==='1')return;}catch(e){}if(/crm-newbeginning|crm\.impulseo\.pl/.test(document.referrer||''))return;try{if(navigator.webdriver)return;}catch(e){}try{if(/^https?:\/\/(kris20032|impulseo-pl)\.github\.io\/?$/i.test(document.referrer||''))return;}catch(e){}if(sessionStorage.getItem('_dv'))return;sessionStorage.setItem('_dv','1');var seg=(location.pathname.split('/').filter(Boolean)[0])||'';var base=location.origin+(seg?('/'+seg):'');var ua='';try{ua=(navigator.userAgent||'').slice(0,300);}catch(e){}var EP='https://zngfubfinbojfgaxdrbf.supabase.co/functions/v1/demo-view';try{fetch(EP,{method:'POST',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({demo_url:base,page:location.pathname,referrer:(document.referrer||null),user_agent:(ua||null)})}).catch(function(){});}catch(e){}}catch(e){}})();
