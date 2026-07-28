# Shyam Vinayak Films — website

A **static, dependency-free website**. No build step, no framework, no package.json. Every file here is served as-is.

Deploy target: **Vercel** (or GitHub Pages / Netlify / Cloudflare Pages — all work unchanged).

---

## Quick deploy

```bash
cd svf-site
git init && git add -A && git commit -m "SVF site"
gh repo create shyamvinayakfilms --public --source=. --push
```

Then either:

- **Vercel dashboard** → New Project → import the repo → Framework Preset: **Other** → leave Build Command empty → Output Directory: `./` → Deploy.
- **Vercel CLI**: `npx vercel --prod` from this folder.

`vercel.json` is already present with the correct static config (plus long-cache headers for media/fonts), so no dashboard tweaking is needed. `cleanUrls` is deliberately **off** — every internal link is written as `work.html`, `about.html`, etc., and stripping extensions would add a redirect hop on every navigation.

---

## Structure

```
index.html          Home (includes the Billu intro prelude)
work.html           Work — Films / Print / Branded Content sections
services.html       Services
about.html          About Us
contact.html        Contact
project.html        Project detail template

home.css            Root design tokens + nav/cursor/grain/global type
sections.css        Home + shared section styles
hero.css            Hero block
about.css           About page
pages.css           Inner-page shell
modal.css           Lightbox / modal
billu-landing.css   Billu intro prelude
shared.css          Cross-page primitives

site.js  shared.js  home.js  hero.js   Site behaviour (GSAP/ScrollTrigger + Lenis driven)
billu-landing.js                       Billu intro sequence + per-device clip selection
image-slot.js                          Image placeholder web component

uploads/            Video assets
work-print/         Print-campaign stills (Panaka, Kohira, Solares, CoinDCX)
client-logos/       Client logo marks
fonts/              Clash Display (OTF, self-hosted)
dummy/              Placeholder stills — swap for final imagery
svf-logo.png        Wordmark
```

### External runtime dependencies (CDN, no install)

- GSAP 3.12.5 + ScrollTrigger — scroll animation
- Lenis 1.1.14 — smooth scroll
- Google Fonts: DM Sans, JetBrains Mono

Clash Display is self-hosted from `fonts/`.

---

## The Billu intro — important

`index.html` opens with a fullscreen video prelude (`#billuLanding`). `billu-landing.js` **selects a different clip per device** and sets it directly on the `<video>`, overriding the markup `<source>`:

| Device | Clip | Fit |
| --- | --- | --- |
| Phone / portrait / touch | `uploads/billu-mobile.mp4` (9:16) | `object-fit: contain` |
| Laptop / desktop landscape | `uploads/billu-desktop.mp4` (16:9) | `object-fit: contain` |

Both are `contain` on purpose — the frame must **never be cropped at the sides**. Letterbox is filled by the page background (`#070604`).

Two things that will silently break this if changed:

1. **Filenames must stay free of spaces and non-ASCII characters.** The original filenames had spaces and 404'd on the host. Keep them web-safe.
2. **Both clips must ship.** If either 404s the visitor sees a black screen with the speech bubble over it — the loader has a 12s failsafe and the bubble appears regardless.

The intro plays **once per session** (`sessionStorage` key `svf_billu_seen`). To re-test, open a fresh private window or clear session storage.

### Suggested improvement for a real host

Video is served straight from `uploads/`. If you want faster first paint, move the two clips to a CDN/blob store and swap the two constants at the top of `billu-landing.js` (`PHONE_CLIP`, `LAPTOP_CLIP`). Nothing else references them.

---

## Design tokens (defined in `home.css` `:root`)

| Token | Value |
| --- | --- |
| `--ink` / `--cream` | page ink / cream ground |
| `--red` | `#e63946` |
| `--red-deep` | `#c1121f` |
| `--green` | `#1f6b4f` |
| `--yellow` | `#f4c430` |
| `--grain-o` | `0.05` (film-grain overlay opacity) |
| `--font-display` | Clash Display |
| `--font-body` | DM Sans |
| `--font-mono` | JetBrains Mono |

Change a brand colour in one place: `home.css` `:root`.

---

## Notes / possible follow-ups

- **Cache-busting query strings** (`home.css?v=8`, `sections.css?v=27`, `billu-landing.js?v=23`) are hand-maintained. Harmless, but a real pipeline should drop them in favour of content hashes.
- **Contact email** across all pages: `vibhorsharma@shyamvinayakfilms.in`.
- `dummy/` holds placeholder stills — replace with final photography.
- No analytics, no cookie banner, no form backend (contact CTAs are `mailto:` links). Add if needed.
- Vimeo players are embedded as background iframes (`player.vimeo.com/video/...?background=1`) on the home reel and work grid.
