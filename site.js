/* ============================================================
   SVF — shared site chrome + scroll motion (Services / Work)
   Lenis + GSAP ScrollTrigger. Mirrors the homepage motion language.
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var pad2 = function (n) { return String(n).padStart(2, '0'); };

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
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
  if ($('#progressBar')) {
    gsap.to('#progressBar', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });
  }

  /* ---------- adaptive nav theme ---------- */
  var nav = $('#nav');
  if (nav) {
    ScrollTrigger.create({
      start: 80,
      onUpdate: function (self) { nav.classList.toggle('scrolled', self.scroll() > 80); }
    });
    $$('[data-nav]').forEach(function (sec) {
      var theme = sec.getAttribute('data-nav');
      ScrollTrigger.create({
        trigger: sec, start: 'top 50px', end: 'bottom 50px',
        onToggle: function (self) { if (self.isActive) nav.dataset.theme = theme; }
      });
    });
  }

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
  if (cursor && FINE && !RM) {
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
        else if (kind === 'hide') { cursor.classList.add('is-hidden'); }
      } else if (t.closest && t.closest('a, button')) {
        cursor.classList.add('is-link');
      }
    });
    document.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
  } else if (cursor) {
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
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'w'; s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(el);
    el.classList.add('split-words');
    return $$('.w', el);
  }

  /* ---------- marquees ---------- */
  function buildMarquee(el) {
    var speed = parseFloat(el.getAttribute('data-marquee-speed') || '1');
    var chunk = $('.marquee-chunk', el);
    if (!chunk) return;
    var chunkW = chunk.offsetWidth;
    if (!chunkW) return; /* hidden (e.g. display:none at this breakpoint) — skip */
    var copies = Math.max(2, Math.ceil((window.innerWidth + chunkW) / chunkW) + 1);
    for (var i = 1; i < copies; i++) { el.appendChild(chunk.cloneNode(true)); }
    if (RM) return;
    chunkW = chunk.offsetWidth;
    var dur = chunkW / 70;
    var tween = gsap.fromTo(el,
      { x: speed > 0 ? 0 : -chunkW },
      { x: speed > 0 ? -chunkW : 0, duration: dur / Math.abs(speed), ease: 'none', repeat: -1 });
    var boost = 0;
    ScrollTrigger.create({ onUpdate: function (self) { boost = gsap.utils.clamp(-3, 3, self.getVelocity() / 400); } });
    gsap.ticker.add(function () { boost *= 0.93; tween.timeScale(1 + (speed > 0 ? boost : -boost)); });
  }
  $$('.marquee').forEach(buildMarquee);

  /* ---------- generic reveals ---------- */
  if (!RM) {
    /* headline word stagger */
    $$('[data-split]').forEach(function (el) {
      var words = splitWords(el);
      gsap.from(words, {
        yPercent: 110, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    /* simple rise-in */
    $$('[data-reveal]').forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-reveal-delay') || '0');
      gsap.from(el, {
        y: 48, opacity: 0, duration: 1, ease: 'power3.out', delay: d,
        scrollTrigger: { trigger: el, start: 'top 86%' }
      });
    });
    /* staggered groups: children rise in */
    $$('[data-stagger]').forEach(function (group) {
      gsap.from(Array.prototype.slice.call(group.children), {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: group, start: 'top 85%' }
      });
    });
    /* parallax drift (data-parallax = strength px) */
    $$('[data-parallax]').forEach(function (el) {
      var amt = parseFloat(el.getAttribute('data-parallax') || '60');
      gsap.fromTo(el, { y: amt }, {
        y: -amt, ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  } else {
    $$('[data-reveal], [data-stagger] > *, [data-split]').forEach(function (el) { el.style.opacity = 1; });
  }

  /* ---------- count-up ---------- */
  $$('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (RM) { el.textContent = target; return; }
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out', snap: { v: 1 },
      onUpdate: function () { el.textContent = obj.v; },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ---------- back to top ---------- */
  var toTop = $('#toTop');
  if (toTop) { toTop.addEventListener('click', scrollToTop); }

  /* ---------- footer ghost wordmark ---------- */
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
    }
  }

  /* ---------- live timecodes on work media ---------- */
  $$('[data-tc]').forEach(function (tc, idx) {
    var off = idx * 247.3;
    setInterval(function () {
      var t = (performance.now() / 1000 + off);
      var f = Math.floor((t % 1) * 24);
      tc.textContent = 'TC ' + pad2(Math.floor(t / 3600) % 24) + ':' + pad2(Math.floor(t / 60) % 60) + ':' + pad2(Math.floor(t) % 60) + ':' + pad2(f);
    }, 120);
  });

  window.addEventListener('load', function () {
    setTimeout(function () { ScrollTrigger.refresh(); }, 300);
  });

  /* ---------- work filter (dropdown or chips) ---------- */
  (function () {
    var items = $$('#wgGrid .wg-item');
    if (!items.length) { return; }
    function apply(f) {
      items.forEach(function (it) {
        var show = (f === 'all' || it.getAttribute('data-cat') === f);
        it.classList.toggle('is-hidden', !show);
      });
      if (typeof ScrollTrigger !== 'undefined') { ScrollTrigger.refresh(); }
    }
    var sel = $('#wgSelect');
    /* honour ?cat= or hash (#films, #print, #branded) so the Work
       dropdown in the nav can jump straight to a category. */
    var validCats = { all: 1, ads: 1, brand: 1, campaign: 1 };
    function fromHash() {
      var h = (window.location.hash || '').replace(/^#/, '').toLowerCase();
      return validCats[h] ? h : null;
    }
    var initial = fromHash() || (sel ? sel.value : 'all');
    if (sel && initial && sel.value !== initial) { sel.value = initial; }
    apply(initial);
    if (sel) { sel.addEventListener('change', function () { apply(sel.value); }); }
    window.addEventListener('hashchange', function () {
      var h = fromHash();
      if (!h) { return; }
      if (sel) { sel.value = h; }
      apply(h);
    });
    var chips = $$('#wgFilters .wg-filter');
    chips.forEach(function (btn) {
      btn.addEventListener('click', function () {
        chips.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        apply(btn.getAttribute('data-filter'));
      });
    });
  })();
})();

/* ---------- work video lightbox (Vimeo films + YouTube branded, incl. vertical) ---------- */
(function () {
  var lb = document.getElementById('vlb');
  if (!lb) return;
  var ifr = document.getElementById('vlbIframe');
  var cap = document.getElementById('vlbCap');
  function openEmbed(src, title, vertical) {
    ifr.src = src;
    cap.textContent = title || '';
    lb.classList.toggle('vlb--v', !!vertical);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    try { window.__lenis && window.__lenis.stop(); } catch (e) {}
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    ifr.src = '';
    try { window.__lenis && window.__lenis.start(); } catch (e) {}
  }
  function wire(sel, build) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (m) {
      m.addEventListener('click', function () { build(m); });
      m.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.click(); }
      });
    });
  }
  wire('#wgGrid .wg-media', function (m) {
    var it = m.closest('.wg-item');
    openEmbed('https://player.vimeo.com/video/' + it.getAttribute('data-video') + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0', it.getAttribute('data-vtitle'), false);
  });
  wire('.bc-item .wg-media', function (m) {
    var it = m.closest('.bc-item');
    openEmbed('https://www.youtube.com/embed/' + it.getAttribute('data-yt') + '?autoplay=1&rel=0&playsinline=1', it.getAttribute('data-vtitle'), it.getAttribute('data-orient') === 'v');
  });
  Array.prototype.forEach.call(lb.querySelectorAll('[data-vlb-close]'), function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb.classList.contains('open')) close();
  });
})();

/* ============================================================
   SVF — print photo lightbox (tap a print still to view full-screen)
   Reuses the .pz / .pz-* styles already in the stylesheet.
   ============================================================ */
(function () {
  'use strict';
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.pr-block'));
  if (!blocks.length) return;

  var pz = document.getElementById('pz');       // reuse the markup already in the page
  if (!pz) return;
  var pzImg = document.getElementById('pzImg');
  var pzCount = document.getElementById('pzCount');
  var list = [], idx = 0;

  function render() {
    pzImg.setAttribute('src', list[idx]);
    pzCount.textContent = (idx + 1) + ' / ' + list.length;
    pz.classList.toggle('pz-multi', list.length > 1);
  }
  function openAt(imgs, i) {
    list = imgs; idx = i < 0 ? 0 : i;
    render();
    pz.classList.add('open');
    pz.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
  }
  function close() {
    pz.classList.remove('open');
    pz.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }
  function step(d) { if (list.length) { idx = (idx + d + list.length) % list.length; render(); } }

  blocks.forEach(function (block) {
    var all = (block.getAttribute('data-all') || '').split(',')
      .map(function (s) { return s.trim(); }).filter(Boolean);
    var cells = Array.prototype.slice.call(block.querySelectorAll('.pc-cell'));
    cells.forEach(function (cell) {
      cell.addEventListener('click', function () {
        var im = cell.querySelector('img');
        var src = im ? im.getAttribute('src') : null;
        var imgs = all.length ? all : cells.map(function (c) {
          var i2 = c.querySelector('img'); return i2 ? i2.getAttribute('src') : null;
        }).filter(Boolean);
        openAt(imgs, imgs.indexOf(src));
      });
    });
  });

  Array.prototype.forEach.call(pz.querySelectorAll('[data-pz-close]'), function (b) {
    b.addEventListener('click', close);
  });
  pz.querySelector('.pz-prev').addEventListener('click', function () { step(-1); });
  pz.querySelector('.pz-next').addEventListener('click', function () { step(1); });
  document.addEventListener('keydown', function (e) {
    if (!pz.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
})();
