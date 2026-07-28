/* SVF — Shared interactions */
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Nav scroll state + floating CTA ---------- */
  const nav = $(".nav");
  const floatCta = $(".float-cta");
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (floatCta) floatCta.classList.toggle("show", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const mm = $(".mobile-menu");
  const open = $(".hamburger");
  const close = $(".mobile-menu-close");
  open && open.addEventListener("click", () => mm.classList.add("open"));
  close && close.addEventListener("click", () => mm.classList.remove("open"));
  $$(".mobile-menu-list a").forEach(a => a.addEventListener("click", () => mm.classList.remove("open")));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  $$(".reveal, .split-line").forEach(el => io.observe(el));

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let x = 0, y = 0, tx = 0, ty = 0;
    window.addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$(".media, [data-cursor='play']").forEach(el => {
      el.addEventListener("mouseenter", () => cursor.classList.add("over-media"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("over-media"));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$("[data-magnetic]").forEach(btn => {
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        const strength = 0.25;
        btn.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$("[data-count]");
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1600;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      const step = now => {
        const t = Math.min(1, (now - start) / dur);
        const v = target * ease(t);
        el.textContent = (Number.isInteger(target) ? Math.round(v) : v.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => cio.observe(c));

  /* ---------- Page wipe on link nav ---------- */
  const wipe = document.createElement("div");
  wipe.className = "page-wipe";
  document.body.appendChild(wipe);
  $$("a[data-wipe]").forEach(a => {
    a.addEventListener("click", e => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      e.preventDefault();
      wipe.classList.add("in");
      setTimeout(() => { window.location.href = href; }, 500);
    });
  });

  /* ---------- Modal video player (homepage + project page) ---------- */
  window.SVF_openPlayer = function (title, client) {
    const m = document.createElement("div");
    m.className = "modal-player";
    m.innerHTML = `
      <div class="mp-backdrop"></div>
      <button class="mp-close" aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>
        <span class="mono">esc</span>
      </button>
      <div class="mp-stage">
        <div class="mp-poster">
          <div class="mp-tape mono">REC ● ${title || "PROJECT"}</div>
          <div class="mp-center">
            <div class="mp-play"><svg viewBox="0 0 24 24" width="28" height="28" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div>
            <div class="mp-loading mono">Loading film… holding for action.</div>
          </div>
          <div class="mp-overlay-meta mono">${client || ""}</div>
        </div>
        <div class="mp-controls">
          <button class="mp-ctrl" aria-label="Play"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
          <div class="mp-time mono">00:00</div>
          <div class="mp-scrub"><div class="mp-scrub-fill"></div></div>
          <div class="mp-time mono">02:14</div>
          <button class="mp-ctrl" aria-label="Mute"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 4V5L7 9H3z"/></svg></button>
          <button class="mp-ctrl mono" aria-label="Quality">HD</button>
          <button class="mp-ctrl" aria-label="Fullscreen"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => m.classList.add("open"));
    const close = () => {
      m.classList.remove("open");
      document.body.style.overflow = "";
      setTimeout(() => m.remove(), 280);
      document.removeEventListener("keydown", esc);
    };
    const esc = e => { if (e.key === "Escape") close(); };
    m.querySelector(".mp-close").addEventListener("click", close);
    m.querySelector(".mp-backdrop").addEventListener("click", close);
    document.addEventListener("keydown", esc);

    // Fake scrubber motion to feel alive
    const fill = m.querySelector(".mp-scrub-fill");
    const time = m.querySelectorAll(".mp-time")[0];
    let p = 0;
    const tick = () => {
      if (!m.isConnected) return;
      p = (p + 0.0025) % 1;
      fill.style.width = (p * 100) + "%";
      const sec = Math.floor(p * 134);
      time.textContent = String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
      requestAnimationFrame(tick);
    };
    tick();
  };

  // Wire any .media[data-open-player]
  $$("[data-open-player]").forEach(el => {
    el.addEventListener("click", () => {
      window.SVF_openPlayer(el.dataset.title, el.dataset.client);
    });
  });
})();
