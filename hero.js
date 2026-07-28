/* ============================================================
   SVF — HERO cinema-aperture sequence (runs after home.js)
   Pinned, scroll-scrubbed: iris → cinemascope → full-bleed → headline
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pad2 = function (n) { return String(n).padStart(2, '0'); };

  var hero = $('#hero');
  if (!hero) return;
  var reel = $('#heroReel');
  var reelTint = $('.reel-tint', hero);
  var aperture = $('#aperture');
  var blades = $$('.blade', aperture);
  var lbTop = $('#lbTop');
  var lbBot = $('#lbBot');
  var labels = $$('.reel-label', hero);
  var rec = $('#heroRec');
  var rollHint = $('#heroRollHint');
  var content = $('#heroContent');
  var words = $$('.hero-h1 .word');
  var eyebrow = $('.hero-eyebrow', hero);
  var ctas = $$('.hero-ctas .btn');
  var soundToggle = $('#soundToggle');
  var scrollNext = $('#heroScrollNext');
  var tcEl = $('#heroTc');
  var wordmark = $('#heroWordmark'); /* may not exist — nav carries the logo */
  var nav = $('#nav');

  /* ---------------------------------------------------------
     1) Canvas "showreel" — always-on cinematic loop.
        A real <video> fades over it if the stream loads.
     --------------------------------------------------------- */
  var canvas = $('.reel-canvas', reel);
  var cctx = canvas.getContext('2d');
  canvas.width = 960; canvas.height = 540;
  var CW = canvas.width, CH = canvas.height;

  var bokeh = [];
  for (var b = 0; b < 14; b++) {
    bokeh.push({
      x: Math.random(), y: Math.random(),
      r: 18 + Math.random() * 60,
      sp: 0.004 + Math.random() * 0.012,
      a: 0.04 + Math.random() * 0.10,
      warm: Math.random() > 0.5
    });
  }
  function drawReel(t) {
    var ms = t;
    /* graded base: teal shadow → warm highlight, slow vertical drift */
    var drift = Math.sin(ms * 0.00018) * 60;
    var g = cctx.createLinearGradient(0, -drift, 0, CH + drift);
    g.addColorStop(0, '#23424a');
    g.addColorStop(0.45, '#2a1f24');
    g.addColorStop(1, '#120a0b');
    cctx.fillStyle = g;
    cctx.fillRect(0, 0, CW, CH);

    /* slow dolly key light */
    var kx = CW * (0.32 + 0.16 * Math.cos(ms * 0.00021));
    var ky = CH * (0.34 + 0.12 * Math.sin(ms * 0.00027));
    var kg = cctx.createRadialGradient(kx, ky, 0, kx, ky, CW * 0.62);
    kg.addColorStop(0, 'rgba(255, 196, 142, 0.42)');
    kg.addColorStop(0.5, 'rgba(214, 92, 64, 0.14)');
    kg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cctx.fillStyle = kg;
    cctx.fillRect(0, 0, CW, CH);

    /* drifting bokeh */
    bokeh.forEach(function (p) {
      var py = (p.y - ((ms * p.sp * 0.0006) % 1.2) + 1.2) % 1.2;
      var x = p.x * CW + Math.sin(ms * 0.0004 + p.r) * 20;
      var y = py * CH;
      var rg = cctx.createRadialGradient(x, y, 0, x, y, p.r);
      var col = p.warm ? '255, 180, 120' : '150, 210, 220';
      rg.addColorStop(0, 'rgba(' + col + ',' + p.a + ')');
      rg.addColorStop(1, 'rgba(' + col + ', 0)');
      cctx.fillStyle = rg;
      cctx.beginPath();
      cctx.arc(x, y, p.r, 0, Math.PI * 2);
      cctx.fill();
    });

    /* anamorphic light-leak streak */
    var lx = ((ms * 0.05) % (CW * 2.2)) - CW * 0.6;
    var lg = cctx.createLinearGradient(lx, 0, lx + CW * 0.28, CH);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, 'rgba(120, 190, 255, 0.06)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    cctx.fillStyle = lg;
    cctx.fillRect(0, 0, CW, CH);

    /* film grain */
    cctx.globalAlpha = 0.05;
    for (var n = 0; n < 130; n++) {
      cctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      cctx.fillRect(Math.random() * CW, Math.random() * CH, 1.3, 1.3);
    }
    cctx.globalAlpha = 1;
  }
  drawReel(0);

  var reelPlaying = false;
  if (!RM) {
    gsap.ticker.add(function (t) { if (reelPlaying) drawReel(t * 1000); });
  }
  ScrollTrigger.create({
    trigger: hero, start: 'top bottom', end: 'bottom top',
    onToggle: function (self) { reelPlaying = self.isActive && !RM; }
  });

  /* optional real video overlay */
  var video = $('.reel-video', reel);
  if (video) {
    video.addEventListener('canplay', function () {
      reel.classList.add('has-video');
      video.play().catch(function () {});
    });
    video.addEventListener('error', function () { reel.classList.remove('has-video'); }, true);
  }

  /* ---------------------------------------------------------
     2) Timecode (driven by scroll progress, 0 → 5s)
     --------------------------------------------------------- */
  function setTC(seconds) {
    var f = Math.floor((seconds % 1) * 24);
    tcEl.textContent = pad2(Math.floor(seconds / 3600)) + ':' +
      pad2(Math.floor(seconds / 60) % 60) + ':' +
      pad2(Math.floor(seconds) % 60) + ':' + pad2(f);
  }
  setTC(0);

  /* ---------------------------------------------------------
     3) Static fallback (mobile / reduced motion)
     --------------------------------------------------------- */
  var mm = gsap.matchMedia();

  mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', function () {
    hero.classList.add('is-static');
    reelPlaying = !RM;
    setTC(5);
    tcEl.classList.add('locked');
    if (nav) nav.dataset.theme = 'light';
    if (!RM) {
      gsap.from(words, { yPercent: 110, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, delay: 0.2 });
      gsap.from([eyebrow, ctas], { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
    } else {
      gsap.set(words, { yPercent: 0, opacity: 1 });
    }
    return function () { hero.classList.remove('is-static'); };
  });

  /* ---------------------------------------------------------
     4) The pinned cinema timeline (desktop)
     --------------------------------------------------------- */
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
    var vw = function () { return window.innerWidth; };
    var vh = function () { return window.innerHeight; };
    var vmin = function () { return Math.min(window.innerWidth, window.innerHeight); };
    var circStart = function () { return vmin() * 0.09; };
    var circBig = function () { return vmin() * 0.46; };
    var scopeW = function () { return Math.min(vw() * 0.80, vh() * 0.80 * 2.39); };
    var scopeH = function () { return scopeW() / 2.39; };
    var barH = function () { return Math.max(0, (vh() - scopeH()) / 2); };

    /* initial states */
    gsap.set(reel, { width: circStart, height: circStart, borderRadius: '50%', opacity: 0 });
    gsap.set(aperture, { scale: 1, opacity: 1, transformOrigin: '50% 50%' });
    gsap.set(blades, { rotation: 0, svgOrigin: '100 24' });
    gsap.set([lbTop, lbBot], { height: 0 });
    gsap.set(labels, { opacity: 0 });
    gsap.set(reelTint, { opacity: 0 });
    gsap.set(words, { yPercent: 115, opacity: 0 });
    gsap.set(eyebrow, { opacity: 0, y: 22 });
    gsap.set(ctas, { opacity: 0, y: 22 });
    gsap.set(soundToggle, { opacity: 0, y: 14 });
    gsap.set(scrollNext, { opacity: 0 });
    gsap.set([rec, rollHint], { opacity: 1 });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '+=140%',
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          setTC(p * 5);
          var dark = p > 0.56;
          if (wordmark) wordmark.classList.toggle('on-dark', dark);
          tcEl.classList.toggle('on-dark', dark);
          if (nav) nav.dataset.theme = dark ? 'light' : 'dark';
          if (p >= 0.995) tcEl.classList.add('locked');
          else tcEl.classList.remove('locked');
        }
      }
    });

    /* STATE 1 — iris opens, reel grows through the hole */
    tl.to(reel, { opacity: 1, duration: 0.04 }, 0);
    tl.to(reel, { width: circBig, height: circBig, duration: 0.30, ease: 'power2.inOut' }, 0);
    tl.to(rollHint, { opacity: 0, duration: 0.08 }, 0.02);
    tl.to(blades, { rotation: -54, duration: 0.26, ease: 'power2.in' }, 0.02);
    tl.to(rec, { opacity: 0, duration: 0.1 }, 0.12);
    tl.to(aperture, { scale: 2.7, opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.12);

    /* STATE 2 — cinemascope letterbox forms */
    tl.to(reel, { width: scopeW, height: scopeH, borderRadius: 6, duration: 0.28, ease: 'power2.inOut' }, 0.30);
    tl.to([lbTop, lbBot], { height: barH, duration: 0.28, ease: 'power2.inOut' }, 0.30);
    tl.to(labels, { opacity: 1, duration: 0.12, stagger: 0.02 }, 0.38);

    /* STATE 3 — expand to full-bleed */
    tl.to(reel, { width: vw, height: vh, borderRadius: 0, duration: 0.24, ease: 'power2.inOut' }, 0.58);
    tl.to([lbTop, lbBot], { height: 0, duration: 0.24, ease: 'power2.inOut' }, 0.58);
    tl.to(labels, { opacity: 0, duration: 0.1 }, 0.58);
    tl.to(reelTint, { opacity: 1, duration: 0.18 }, 0.6);

    /* STATE 4 — headline + chrome reveal */
    tl.to(words, { yPercent: 0, opacity: 1, duration: 0.16, ease: 'power3.out', stagger: 0.03 }, 0.82);
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.12 }, 0.84);
    tl.to(ctas, { opacity: 1, y: 0, duration: 0.12, stagger: 0.03 }, 0.88);
    tl.to(soundToggle, { opacity: 1, y: 0, duration: 0.12 }, 0.9);
    tl.to(scrollNext, { opacity: 1, duration: 0.12 }, 0.92);

    /* breathing headline weight once settled */
    var breathe = gsap.to('.hero-h1', {
      fontWeight: 800, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true
    });
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: '+=140%',
      onLeave: function () { breathe.play(); },
      onEnterBack: function () { breathe.pause(); gsap.set('.hero-h1', { fontWeight: 700 }); }
    });

    return function () {
      tl.scrollTrigger && tl.scrollTrigger.kill();
      tl.kill();
      breathe.kill();
      gsap.set([reel, aperture, blades, lbTop, lbBot, labels, reelTint, words, eyebrow, ctas, soundToggle, scrollNext, rec, rollHint], { clearProps: 'all' });
    };
  });

  /* ---------------------------------------------------------
     5) Sound toggle
     --------------------------------------------------------- */
  if (soundToggle) {
    soundToggle.addEventListener('click', function () {
      var on = soundToggle.classList.toggle('on');
      $('#soundLabel').textContent = on ? 'Sound on' : 'Sound off';
      soundToggle.setAttribute('aria-pressed', String(on));
      if (video) {
        video.muted = !on;
        if (on) { video.volume = 0.6; video.play().catch(function () {}); }
      }
    });
  }
  /* ---------------------------------------------------------
     6) CRITICAL: this pin was registered AFTER the section pins
        in home.js, but it sits ABOVE them in the document. Sort
        triggers top-to-bottom and re-measure so every section's
        start accounts for the hero's pin spacer.
     --------------------------------------------------------- */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  window.addEventListener('load', function () {
    ScrollTrigger.sort();
    setTimeout(function () { ScrollTrigger.refresh(); }, 350);
  });
})();
