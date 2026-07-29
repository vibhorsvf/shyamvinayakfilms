/* ============================================================
   SVF homepage v3 — motion system
   Lenis + GSAP ScrollTrigger
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pad2 = function (n) { return String(n).padStart(2, '0'); };

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis ---------- */
  var lenis = null;
  if (!RM && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.105 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToTop() {
    if (lenis) { lenis.scrollTo(0, { duration: 1.4 }); }
    else { window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }
  }

  /* ---------- progress bar ---------- */
  gsap.to('#progressBar', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
  });

  /* ---------- adaptive nav theme ---------- */
  var nav = $('#nav');
  ScrollTrigger.create({
    start: 80,
    onUpdate: function (self) { nav.classList.toggle('scrolled', self.scroll() > 80); }
  });
  $$('[data-nav]').forEach(function (sec) {
    var theme = sec.getAttribute('data-nav');
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50px',
      end: 'bottom 50px',
      onToggle: function (self) { if (self.isActive) nav.dataset.theme = theme; }
    });
  });

  /* ---------- mobile nav (burger + sheet) ---------- */
  (function () {
    var burger = $('#navBurger'), sheet = $('#navMobile');
    if (!burger || !sheet) return;
    function set(open) {
      document.body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      try { if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); } } catch (e) {}
    }
    burger.addEventListener('click', function () { set(!document.body.classList.contains('nav-open')); });
    $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 760 && document.body.classList.contains('nav-open')) set(false); });
  })();

  /* ---------- custom cursor ---------- */
  var cursor = $('#cursor');
  var cursorLabel = $('#cursorLabel');
  if (FINE && !RM) {
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      var mode = t.closest && t.closest('[data-cursor]');
      cursor.className = 'cursor';
      if (mode) {
        var kind = mode.getAttribute('data-cursor');
        if (kind === 'play') { cursor.classList.add('is-play'); cursorLabel.textContent = '▶ PLAY'; }
        else if (kind === 'drag') { cursor.classList.add('is-drag'); cursorLabel.textContent = '← DRAG →'; }
        else if (kind === 'hide') { cursor.classList.add('is-hidden'); }
      } else if (t.closest && t.closest('a, button')) {
        cursor.classList.add('is-link');
      }
    });
    document.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
  } else {
    cursor.style.display = 'none';
  }

  /* ---------- magnetic buttons ---------- */
  if (FINE && !RM) {
    $$('[data-magnetic]').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.34);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- split helpers ---------- */
  function splitChars(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split('').forEach(function (ch) {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'c';
            s.textContent = ch;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(el);
    el.classList.add('split-chars');
    return $$('.c', el);
  }
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(el);
    el.classList.add('split-words');
    return $$('.w', el);
  }
  function revealUp(targets, trigger, vars) {
    if (RM) return;
    gsap.from(targets, Object.assign({
      y: 56, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: trigger, start: 'top 80%' }
    }, vars || {}));
  }

  /* S1 hero cinema-aperture sequence now lives in hero.js */

  /* ---------- marquees ---------- */
  function buildMarquee(el) {
    if (el.dataset.mqBuilt) return; /* already running — don't duplicate */
    var speed = parseFloat(el.getAttribute('data-marquee-speed') || '1');
    var chunk = $('.marquee-chunk', el);
    if (!chunk) return;
    var chunkW = chunk.offsetWidth;
    if (!chunkW) return; /* hidden (e.g. display:none at this breakpoint) — build later when visible */
    el.dataset.mqBuilt = '1';
    var copies = Math.max(2, Math.ceil((window.innerWidth + chunkW) / chunkW) + 1);
    for (var i = 1; i < copies; i++) { el.appendChild(chunk.cloneNode(true)); }
    if (RM) return;
    chunkW = chunk.offsetWidth;
    var dur = chunkW / 70;
    var tween = gsap.fromTo(el,
      { x: speed > 0 ? 0 : -chunkW },
      { x: speed > 0 ? -chunkW : 0, duration: dur / Math.abs(speed), ease: 'none', repeat: -1 });
    var boost = 0;
    ScrollTrigger.create({
      onUpdate: function (self) { boost = gsap.utils.clamp(-3, 3, self.getVelocity() / 400); }
    });
    gsap.ticker.add(function () {
      boost *= 0.93;
      tween.timeScale(1 + (speed > 0 ? boost : -boost));
    });
  }
  function buildAllMarquees() { $$('.marquee').forEach(buildMarquee); }
  buildAllMarquees();
  /* Rows hidden at load (e.g. the phone-only client logo marquee, or any row
     revealed by a resize/orientation change) aren't measurable until shown —
     re-run once images settle and on every resize so they animate when visible. */
  window.addEventListener('load', buildAllMarquees);
  var mqResizeT;
  window.addEventListener('resize', function () {
    clearTimeout(mqResizeT);
    mqResizeT = setTimeout(buildAllMarquees, 200);
  });

  /* ============================================================
     INTRO — editorial reveal sequence
     ============================================================ */
  var introRoles = $('#introRoles');
  if (introRoles && !RM) {
    gsap.from(['.intro-eyebrow', '.intro-lead'], {
      y: 34, opacity: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.intro', start: 'top 84%' }
    });
    gsap.from(['.intro-copy .intro-p', '.intro-copy .intro-p-chair'], {
      y: 22, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.15,
      scrollTrigger: { trigger: '.intro', start: 'top 84%' }
    });
    gsap.from('.intro-reel', {
      opacity: 0, x: 44, duration: 1, ease: 'power3.out', delay: 0.2,
      scrollTrigger: { trigger: '.intro', start: 'top 84%' }
    });
    gsap.from('.intro-roles-pre', {
      opacity: 0, y: 12, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: '.intro-roles-block', start: 'top 82%' }
    });
    gsap.from('.intro-roles .ir-line', {
      yPercent: 60, opacity: 0, rotate: 1.2, duration: 0.8,
      ease: 'back.out(1.25)', stagger: 0.1,
      scrollTrigger: { trigger: '.intro-roles-block', start: 'top 78%' }
    });
    gsap.from('.intro-coda .intro-mid', {
      y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.intro-coda', start: 'top 88%' }
    });
    gsap.from('.intro-scroll', {
      y: 22, opacity: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.intro-scroll', start: 'top 92%' }
    });
  }

  /* roles drift horizontally on scroll (scrubbed parallax) */
  if (!RM && $('.intro-roles')) {
    $$('.intro-roles .ir-line').forEach(function (sp, i) {
      gsap.fromTo(sp, { xPercent: (i - 1) * 6 }, {
        xPercent: (i - 1) * -6, ease: 'none',
        scrollTrigger: { trigger: '.intro-roles-block', start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });
  }

  /* intro reel — two counter-scrolling rows of static film thumbnails */
  (function () {
    var reel = $('#introReel');
    if (!reel) return;
    /* GSAP-driven seamless marquee. CSS keyframe animations are suppressed by
       some webviews under OS reduced-motion, so we drive the two tracks with
       gsap (rAF ticker) instead — each track holds two identical copies of the
       tile set, so a -50% shift loops seamlessly. */
    var tweens = [];
    $$('.ir-track', reel).forEach(function (track) {
      var toRight = track.classList.contains('ir-track--r');
      gsap.set(track, { xPercent: toRight ? -50 : 0 });
      tweens.push(gsap.to(track, {
        xPercent: toRight ? 0 : -50,
        duration: 34, ease: 'none', repeat: -1
      }));
    });
    /* pause on hover so people can look */
    reel.addEventListener('mouseenter', function () { tweens.forEach(function (tw) { tw.pause(); }); });
    reel.addEventListener('mouseleave', function () { tweens.forEach(function (tw) { tw.play(); }); });
  })();

  /* intro "scroll down" smooth-scrolls via Lenis */
  var introScroll = $('.intro-scroll');
  if (introScroll) {
    introScroll.addEventListener('click', function (e) {
      var id = introScroll.getAttribute('href');
      var target = id && id.charAt(0) === '#' && document.querySelector(id);
      if (target) {
        e.preventDefault();
        if (lenis) { lenis.scrollTo(target, { offset: -30, duration: 1.2 }); }
        else { window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 30, behavior: RM ? 'auto' : 'smooth' }); }
      }
    });
  }

  /* ============================================================
     S4 — WORK SHOWCASE (pinned video scroller)
     ============================================================ */
  var wsItems = $$('.ws-item');

  /* ---- canvas "footage" loops (only if a .ws-canvas exists) ---- */
  var wsPlaying = false;
  var wsLoops = wsItems.map(function (it, idx) {
    var canvas = $('.ws-canvas', it);
    var media = $('.ws-media', it);
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var p1 = getComputedStyle(media).getPropertyValue('--p1').trim() || '#3a2326';
    var p2 = getComputedStyle(media).getPropertyValue('--p2').trim() || '#14090b';
    var seed = idx * 137.5;
    function size() {
      var r = media.getBoundingClientRect();
      var w = Math.max(2, Math.round(r.width / 2));
      var h = Math.max(2, Math.round(r.height / 2));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    function draw(t) {
      size();
      var w = canvas.width, h = canvas.height;
      ctx.fillStyle = p2; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 3; i++) {
        var ang = t * 0.00012 * (i + 1) + seed + i * 2.1;
        var gx = w * (0.5 + 0.38 * Math.cos(ang));
        var gy = h * (0.5 + 0.34 * Math.sin(ang * 1.3));
        var rad = Math.max(w, h) * (0.5 + 0.18 * Math.sin(t * 0.0002 + i));
        var g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
        g.addColorStop(0, p1); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.5; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      }
      ctx.globalAlpha = 1;
      var lx = ((t * 0.04 + seed * 10) % (w * 2.4)) - w * 0.7;
      var lg = ctx.createLinearGradient(lx, 0, lx + w * 0.34, h);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(0.5, 'rgba(255,240,220,0.08)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.06;
      for (var n = 0; n < 90; n++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;
      var vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    }
    return draw;
  });
  if (!RM) {
    gsap.ticker.add(function (t) {
      if (!wsPlaying) return;
      wsLoops.forEach(function (draw) { if (draw) draw(t * 1000); });
    });
  } else {
    wsLoops.forEach(function (draw) { if (draw) draw(0); });
  }

  ScrollTrigger.create({
    trigger: '#workshow', start: 'top bottom', end: 'bottom top',
    onToggle: function (self) { wsPlaying = self.isActive && !RM; }
  });
  /* live timecodes */
  wsItems.forEach(function (it, idx) {
    var tc = $('.ws-tc', it);
    if (!tc) return;
    var off = idx * 247.3;
    setInterval(function () {
      var t = (performance.now() / 1000 + off);
      var f = Math.floor((t % 1) * 24);
      tc.textContent = 'TC ' + pad2(Math.floor(t / 3600) % 24) + ':' + pad2(Math.floor(t / 60) % 60) + ':' + pad2(Math.floor(t) % 60) + ':' + pad2(f);
    }, 120);
  });

  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
    var stage = $('#wsStage');
    var finalEl = $('#wsFinal');
    var dots = $$('#wsProgress i');
    if (!stage) return;

    wsItems.forEach(function (it, i) {
      gsap.set(it, { xPercent: -50, yPercent: -50, y: i === 0 ? 0 : window.innerHeight * 1.2 });
    });

    function gridPos(i) {
      var w = stage.offsetWidth, h = stage.offsetHeight;
      var dx = w * 0.225, dy = h * 0.24;
      var col = i % 2, row = Math.floor(i / 2);
      return { x: (col === 0 ? -dx : dx), y: (row === 0 ? -dy : dy) - h * 0.02 };
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#workshow', start: 'top top', end: '+=' + window.innerHeight * 5,
        pin: '#wsPin', scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) {
          var seg = Math.min(4, Math.floor(self.progress * 5.0001));
          dots.forEach(function (d, i) { d.classList.toggle('on', i === seg); });
          finalEl.classList.toggle('live', self.progress > 0.86);
        }
      }
    });

    tl.from(wsItems[0], { scale: 0.88, duration: 0.5, ease: 'power2.out' }, 0);

    /* "Featured work" begins as a bright heading at the top of the section,
       then grows and fades into the large faint watermark behind the reel */
    /* "Featured work" starts ON TOP as a heading (ws-head z-index 5). On scroll
       it enlarges, drifts down and fades; once it's faint it snaps BEHIND the
       videos so it settles as the background watermark — the swap is invisible
       because by then it's nearly transparent. */
    /* "Featured work" sits BEHIND the videos from the start (ws-head z-index 1,
       videos z-index 2). On scroll it enlarges and drifts down, settling as the
       faint background watermark — it never crosses in front of the reel. */
    var wsTitle = $('.ws-title');
    /* title grow/fade is large-desktop only — on phones and iPads the heading stays static */
    if (wsTitle && window.matchMedia('(min-width: 1200px)').matches) {
      gsap.set(wsTitle, { transformOrigin: '50% 0%' });
      tl.fromTo(wsTitle,
        { scale: 1, y: 0, opacity: 0.96 },
        { scale: function () {
            /* cap the growth so the watermark always fits the viewport (never
               clipped at the edges), regardless of screen width */
            var w = wsTitle.offsetWidth || 1;
            return Math.max(1.2, Math.min(2.5, (window.innerWidth * 0.9) / w));
          },
          y: function () { return window.innerHeight * 0.38; }, opacity: 0.07, ease: 'power2.inOut', duration: 1.3 }, 0);
    }

    for (var i = 1; i < wsItems.length; i++) {
      tl.to(wsItems[i - 1], { y: -window.innerHeight * 1.15, rotate: -3, scale: 0.94, duration: 1, ease: 'power1.inOut' }, i);
      tl.fromTo(wsItems[i],
        { y: window.innerHeight * 1.2, rotate: 3, scale: 0.94 },
        { y: 0, rotate: 0, scale: 1, duration: 1, ease: 'power1.inOut', immediateRender: false },
        i - 0.12);
    }

    var G = 4.3;
    wsItems.forEach(function (it, i) {
      tl.to(it, {
        x: function () { return gridPos(i).x; },
        y: function () { return gridPos(i).y; },
        rotate: 0, scale: 0.42, duration: 1.1, ease: 'power2.inOut'
      }, G + i * 0.06);
    });
    tl.to($$('.ws-info, .ws-idx'), { opacity: 0, duration: 0.4 }, G);
    tl.to(finalEl, { opacity: 1, duration: 0.5 }, G + 0.9);
    tl.to({}, { duration: 0.4 });

    return function () {
      tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill();
      /* wipe every inline style the pin left behind so narrower breakpoints render clean */
      var leftovers = [wsTitle].concat(wsItems).concat($$('.ws-info, .ws-idx')).filter(Boolean);
      gsap.set(leftovers, { clearProps: 'all' });
      if (finalEl) { finalEl.classList.remove('live'); gsap.set(finalEl, { clearProps: 'all' }); }
    };
  });

  /* ============================================================
     S5 — SERVICES (stack + outline→fill names)
     ============================================================ */
  if (!RM) {
    var cards = $$('.svc-card');
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (next) {
        /* scale the card, but dim only its CONTENT — the card bg
           must stay opaque or the stack looks translucent */
        gsap.to(card, {
          scale: 0.93, transformOrigin: '50% 18%', ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true }
        });
        gsap.to(Array.prototype.slice.call(card.children), {
          opacity: 0.35, ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 60%', end: 'top top', scrub: true }
        });
      }
      /* outline → fill wipe */
      var fill = $('.nm-fill', card);
      if (fill) {
        gsap.fromTo(fill,
          { clipPath: 'inset(-10% 100% -10% 0)' },
          {
            clipPath: 'inset(-10% 0% -10% 0)', ease: 'none',
            scrollTrigger: { trigger: card, start: 'top 85%', end: 'top 10%', scrub: 0.4 }
          });
      }
      /* name drifts sideways */
      var name = $('.svc-name', card);
      gsap.fromTo(name, { x: 70 }, {
        x: -30, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'top top', scrub: true }
      });
      /* body staggers in */
      gsap.from($$('.svc-body > *', card), {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: card, start: 'top 55%' }
      });
      gsap.from($('.svc-top', card), {
        y: 24, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 65%' }
      });
    });
    revealUp('.services-intro > *', '.services-intro', { y: 30, stagger: 0.08 });
  }

  /* services 2×2 grid + client wall reveals (new layout) */
  if (!RM) {
    revealUp('.svc-tile', '.svc-grid', { y: 60, stagger: 0.1 });
    /* Partners in Creativity — gentle word-stagger rise on the title */
    (function () {
      var clientsH = $('.clients-h');
      if (clientsH) {
        var chWords = splitWords(clientsH);
        gsap.from(chWords, {
          y: 26, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.09,
          scrollTrigger: { trigger: '.clients-head', start: 'top 84%' }
        });
      }
    })();
    revealUp('.client-tile', '.client-wall', { y: 40, duration: 0.8, stagger: 0.04 });
  }

  /* ============================================================
     S6 — INTERLUDE
     ============================================================ */
  var quote = $('#interludeQ');
  if (quote && !RM) {
    var qWords = splitWords(quote);
    gsap.from(qWords, {
      y: 50, opacity: 0, rotate: 3,
      duration: 0.8, ease: 'power3.out', stagger: 0.045,
      scrollTrigger: { trigger: '.interlude', start: 'top 65%' }
    });
    gsap.from('.interlude-attr', {
      opacity: 0, y: 16, duration: 0.7, delay: 0.8,
      scrollTrigger: { trigger: '.interlude', start: 'top 65%' }
    });
  }

  /* ============================================================
     S7 — PROCESS (horizontal, heavy)
     ============================================================ */
  var STEP_NAMES = ['BRIEF', 'PRE-PROD', 'SHOOT', 'POST', 'DELIVER'];
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', function () {
    var track = $('#processTrack');
    var pin = $('#processPin');
    var ghost = $('#processGhost');
    var stepLabel = $('#processStepLabel');
    if (!track || !pin) return;
    var amount = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 80); };

    var skewTo = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power2.out' });

    var tween = gsap.to(track, {
      x: function () { return -amount(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.process',
        start: 'top top',
        end: function () { return '+=' + (amount() + window.innerHeight * 0.4); },
        pin: pin,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: function (self) {
          var p = self.progress;
          gsap.set('#processBar', { scaleX: p });
          gsap.set('#processDot', { left: (p * 100) + '%' });
          /* sprocket holes crawl */
          var shift = -p * 900;
          $('#filmEdgeTop').style.backgroundPositionX = shift + 'px';
          $('#filmEdgeBot').style.backgroundPositionX = -shift + 'px';
          /* ghost text counter-parallax */
          if (ghost) {
            var gw = ghost.scrollWidth - window.innerWidth + 200;
            gsap.set(ghost, { x: -p * Math.max(0, gw) });
          }
          /* velocity skew */
          skewTo(gsap.utils.clamp(-7, 7, self.getVelocity() / -350));
          /* step label */
          var idx = Math.min(4, Math.floor(p * 5));
          stepLabel.textContent = 'STEP ' + pad2(idx + 1) + ' / 05 — ' + STEP_NAMES[idx];
        }
      }
    });

    /* per-step number drift — content stays visible (no opacity hide:
       containerAnimation triggers don't fire for items already onscreen
       at progress 0, which left the first step invisible) */
    $$('.step', track).forEach(function (step) {
      gsap.set($$('.step-num, .step-glyph, .step-title, .step-desc', step), { opacity: 1, y: 0 });
      gsap.fromTo($('.step-num', step), { x: 90 }, {
        x: -50, ease: 'none',
        scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
    });

    return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
  });

  /* ============================================================
     S8 — NUMBERS
     ============================================================ */
  $$('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (RM) { el.textContent = target; return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out', snap: { v: 1 },
      onUpdate: function () { el.textContent = obj.v; },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });
  revealUp('.numbers .stat', '.numbers-grid', { stagger: 0.12 });

  /* ============================================================
     S9 — WORD OF MOUTH (pinned quote deck)
     ============================================================ */
  /* ============================================================
     S9 — WORD OF MOUTH · manual testimonial carousel (all viewports)
     ============================================================ */
  (function () {
    var slides = $$('.q-slide');
    if (!slides.length) return;
    var counter = $('#qCounter');
    var prev = $('#qPrev');
    var next = $('#qNext');
    var avatarBox = $('.q-avatar');
    var avatarImg = avatarBox ? avatarBox.querySelector('.q-avatar-img') : null;
    function setAvatar(slide) {
      if (!avatarBox || !avatarImg) return;
      var src = slide && slide.getAttribute('data-avatar');
      if (src) {
        avatarImg.onload = function () { avatarBox.classList.add('has-img'); };
        avatarImg.onerror = function () { avatarBox.classList.remove('has-img'); avatarImg.removeAttribute('src'); };
        avatarImg.src = src;                 // real photo when present; falls back to the placeholder icon if missing
      } else {
        avatarBox.classList.remove('has-img');
        avatarImg.removeAttribute('src');
      }
    }
    var i = 0;
    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      if (counter) counter.textContent = pad2(i + 1) + ' / ' + pad2(slides.length);
      setAvatar(slides[i]);
    }
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    show(0);
  })();

  /* ============================================================
     S11 — BIG CTA (calm editorial)
     ============================================================ */
  if (!RM) {
    gsap.from('.bigcta-eyebrow', {
      y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: '.bigcta', start: 'top 75%' }
    });
    var ctaH = $('#ctaH');
    if (ctaH) {
      var ctaWords = splitWords(ctaH);
      gsap.from(ctaWords, {
        yPercent: 110, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05,
        scrollTrigger: { trigger: '.bigcta', start: 'top 72%' }
      });
    }
    gsap.from(['.bigcta-sub', '.bigcta-mail', '.bigcta-row'], {
      y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.25,
      scrollTrigger: { trigger: '.bigcta', start: 'top 65%' }
    });
  }

  /* ============================================================
     S12 — FOOTER (static)
     ============================================================ */
  /* ghost wordmark rises into view */
  var ghostEl = $('#footerGhost');
  if (ghostEl) {
    var letters = ghostEl.textContent.split('').map(function (ch) {
      return ch === ' ' ? ' ' : '<span class="gc">' + ch + '</span>';
    }).join('');
    ghostEl.innerHTML = letters;
    if (!RM) {
      gsap.from($$('.gc', ghostEl), {
        yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.03,
        scrollTrigger: { trigger: '.footer-ghost', start: 'top 95%' }
      });
      gsap.from($$('.footer-cols > div'), {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: '.footer-cols', start: 'top 85%' }
      });
    }
  }
  $('#toTop').addEventListener('click', scrollToTop);

  /* refresh after everything settles */
  window.addEventListener('load', function () {
    setTimeout(function () { ScrollTrigger.refresh(); }, 300);
  });
})();
