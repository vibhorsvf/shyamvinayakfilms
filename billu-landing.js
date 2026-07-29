/* ============================================================
   BILLU — landing prelude (simple single-video version)
   One baked clip (cat + background) loops fullscreen. A loader
   holds the scene until the clip is buffered in full quality, so
   slow connections never see a half-loaded video. The speech
   bubble sits beside Billu and advances on click; the last click
   enters the site.
   ============================================================ */
(function () {
  var root = document.getElementById('billuLanding');
  if (!root) return;

  /* Billu is a one-time welcome. Once a visitor has entered (or skipped),
     remember it for the session so clicking the logo / Home returns straight
     to the homepage instead of replaying the intro. */
  var SEEN_KEY = 'svf_billu_seen';
  var alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
  if (alreadySeen) {
    root.classList.add('is-gone');
    root.style.display = 'none';
    document.documentElement.classList.remove('billu-lock');
    return;
  }

  var vid    = document.getElementById('billuVid');
  var fill   = document.getElementById('billuLoadFill');
  var bubble = document.getElementById('billuBubble');
  var bText  = document.getElementById('billuBubbleText');
  var bNudge = document.getElementById('billuNudge');
  var skip   = document.getElementById('billuSkip');
  var fade   = document.getElementById('billuFade');

  /* lock the page under the intro */
  document.documentElement.classList.add('billu-lock');
  try { window.scrollTo(0, 0); } catch (e) {}
  function lenis(fn) { try { window.__lenis && window.__lenis[fn](); } catch (e) {} }
  lenis('stop');

  /* ---------- load the clip at best quality, behind a loader ---------- */
  var ready = false, guard = null;
  function updateProgress() {
    try {
      if (vid.buffered.length && vid.duration) {
        var end = vid.buffered.end(vid.buffered.length - 1);
        var pct = Math.min(100, Math.round(end / vid.duration * 100));
        if (fill) fill.style.width = pct + '%';
      }
    } catch (e) {}
  }
  function begin() {
    if (ready) return; ready = true;
    if (guard) { clearInterval(guard); guard = null; }
    if (fill) fill.style.width = '100%';
    root.classList.add('video-ready');
    try { var p = vid.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    setTimeout(startFlow, 500);
  }
  vid.addEventListener('progress', updateProgress);
  vid.addEventListener('loadeddata', updateProgress);
  vid.addEventListener('canplaythrough', begin);
  vid.addEventListener('error', begin); /* never trap the visitor on the loader */
  /* ---- separate clips per device: phones get the dedicated full-frame 9:16
     portrait so nothing is cropped; laptops/desktops get the wide studio clip.
     We set src directly on the <video> (overrides the child <source>) and force a
     reload, so the correct clip is guaranteed regardless of the markup default. ---- */
  var isPhone = window.matchMedia('(max-width: 900px), (orientation: portrait), (pointer: coarse)').matches;
  var PHONE_CLIP = 'uploads/billu-mobile.mp4';
  var LAPTOP_CLIP = 'uploads/billu-desktop.mp4';
  var wantSrc = isPhone ? PHONE_CLIP : LAPTOP_CLIP;
  var msrc = vid.querySelector('source');
  if (msrc) msrc.parentNode.removeChild(msrc);   /* drop the markup default */
  vid.setAttribute('src', wantSrc);
  vid.src = wantSrc;
  root.classList.add(isPhone ? 'billu-mobile' : 'billu-desktop');
  try { vid.load(); } catch (e) {}
  /* proceed the moment the browser reports it can play through without stalling */
  guard = setInterval(function () {
    updateProgress();
    if (vid.readyState >= 4) begin();
  }, 400);
  /* hard cap: nobody is ever stuck on the loader */
  setTimeout(begin, 12000);

  /* ---------- conversation flow ---------- */
  var MSG = [
    "Hey hooman, I\u2019m Billu, CMO (Chief Meowing Officer) of Shyam Vinayak Films.",
    "Come in! Let me show you what my hoomans have been building."
  ];
  var step = 0; /* 0 pre · 1 msg1 · 2 msg2 · 3 entering */

  function place() {
    var mobileish = window.innerWidth <= 820 || window.matchMedia('(orientation: portrait)').matches;
    bubble.setAttribute('data-tail', mobileish ? 'none' : 'left');
  }
  window.addEventListener('resize', place);

  function showBubble(txt, nudge) {
    place();
    bText.textContent = txt;
    bNudge.innerHTML = nudge;
    bubble.classList.remove('hide');
    bubble.classList.add('show');
  }
  function hideBubble(cb) {
    bubble.classList.remove('show'); bubble.classList.add('hide');
    setTimeout(function () { bubble.classList.remove('show', 'hide'); if (cb) cb(); }, 340);
  }
  function startFlow() {
    if (step !== 0) return;
    step = 1;
    showBubble(MSG[0], 'Scroll or click to continue <span class="k">\u2193</span>');
  }
  function toMsg2() {
    if (step !== 1) return;
    step = 2;
    hideBubble(function () {
      setTimeout(function () { showBubble(MSG[1], 'Scroll to come inside <span class="k">\u2193</span>'); }, 200);
    });
  }

  var entered = false;
  function enter() {
    if (entered) return; entered = true; step = 3;
    root.classList.add('is-entering');
    hideBubble();
    var done = false;
    function finish() {
      if (done) return; done = true;
      try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
      document.documentElement.classList.remove('billu-lock');
      lenis('start');
      try { window.scrollTo(0, 0); } catch (e) {}
      if (window.__lenis) { try { window.__lenis.scrollTo(0, { immediate: true }); } catch (e) {} }
      try { if (window.ScrollTrigger) ScrollTrigger.refresh(); } catch (e) {}
      root.classList.add('is-gone');
    }
    fade.style.opacity = '1';
    root.style.transition = 'opacity .7s ease';
    setTimeout(function () { root.style.opacity = '0'; }, 700);
    setTimeout(finish, 1500);
  }

  function advance() {
    if (!ready) return;               /* ignore clicks while still loading */
    if (step === 1) { toMsg2(); return; }
    if (step === 2) { enter(); return; }
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('.billu-skip')) return;
    advance();
  });

  /* ---------- scroll drives the reveal: a scroll down advances Billu
     through his lines and then glides into the site ---------- */
  var scrollLock = false;
  function scrollAdvance() {
    if (!ready || entered) return;
    if (scrollLock) return;
    scrollLock = true;
    setTimeout(function () { scrollLock = false; }, 780);
    advance();
  }
  root.addEventListener('wheel', function (e) {
    if (root.classList.contains('is-gone')) return;
    if (e.deltaY > 4) scrollAdvance();
  }, { passive: true });
  var touchY = null;
  root.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
  root.addEventListener('touchmove', function (e) {
    if (touchY == null) return;
    if (touchY - e.touches[0].clientY > 36) { touchY = null; scrollAdvance(); }
  }, { passive: true });
  skip.addEventListener('click', function (e) { e.stopPropagation(); enter(); });
  document.addEventListener('keydown', function (e) {
    if (root.classList.contains('is-gone')) return;
    if (e.key === 'Escape') { enter(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
  });
})();
