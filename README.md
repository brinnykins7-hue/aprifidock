# Aprifidock 🎌

> A clean, fast, dark-themed anime streaming and discovery site — powered by Jikan v4 and Omega Player.

![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub%20Pages-0f172a?style=flat-square&labelColor=38bdf8&color=0f172a)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?style=flat-square&logo=javascript&logoColor=000)
![Jikan v4](https://img.shields.io/badge/Data-Jikan%20v4%20API-2e51a2?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-38bdf8?style=flat-square)

---

## What is Aprifidock?

**Aprifidock** is a single-page anime streaming and discovery application. It gives users a fast, beautiful interface to:

- 🔥 **Browse trending & currently-airing** anime from the top charts
- 🏆 **Discover top-rated** anime of all time (ranked via MyAnimeList data)
- 🔍 **Search** the full Jikan anime catalog with live debounced results
- ▶️ **Watch** any episode via the integrated **Omega Player** — no redirects, no pop-ups
- 🎬 **Navigate episodes** with Prev/Next buttons and a clickable episode grid
- 📖 **Read** full synopsis, genres, studio info, score, and status per title

The site is deliberately framework-free — no React, no build tools, no node_modules. Just HTML, vanilla JS, Tailwind CDN, and two external APIs.

---

## Tech Stack

| Layer       | Technology               | Purpose                                    |
|-------------|--------------------------|---------------------------------------------|
| Structure   | HTML5                    | Semantic, accessible markup                 |
| Styling     | Tailwind CSS (CDN)       | Utility-first responsive design             |
| Styling     | Custom CSS (`styles.css`)| Dark theme, loading skeletons, animations   |
| Logic       | Vanilla JavaScript (ES6) | Routing, API calls, DOM rendering           |
| Anime Data  | **Jikan v4 API**         | Metadata, search, rankings                  |
| Video       | **Omega Player**         | iframe embed for episode streaming          |
| Hosting     | GitHub Pages             | Static file hosting, zero cost              |
| Fonts       | Google Fonts             | Syne (display) · DM Sans (body) · JetBrains Mono |

---

## How the APIs Connect

### 1. Jikan v4 — Anime Metadata

[Jikan](https://jikan.moe/) is an **unofficial MyAnimeList REST API**. It's fully open, requires no API key, and returns rich JSON metadata.

```
Base URL: https://api.jikan.moe/v4
```

Aprifidock calls the following endpoints:

| Endpoint                  | Used For                               |
|---------------------------|----------------------------------------|
| `GET /top/anime`          | Home page hero + top-ranked lists      |
| `GET /top/anime?filter=airing` | Currently airing / trending section |
| `GET /anime?q={query}`    | Live search results                    |
| `GET /anime/{id}`         | Anime detail page (synopsis, genres…)  |

**Rate Limiting**: Jikan enforces ~3 requests/second per IP. Aprifidock uses a `debounce(fn, 400ms)` wrapper on all search inputs so keystrokes are batched. If a 429 is returned, a friendly toast notification is shown.

### 2. Omega Player — Video Streaming

The **Omega Player** is embedded as a standard HTML `<iframe>`. Episode sources are resolved by the player itself using the MAL ID + episode number.

```
Embed URL: https://player.omegatv.app/embed/mal/{MAL_ID}/{EPISODE}
```

`renderPlayer(malId, episode)` in `app.js` builds this URL dynamically and injects the iframe. When the user clicks Prev/Next or any episode pill, only the `src` attribute is updated — no page reload required.

---

## File Structure

```
aprifidock/
├── index.html     — Core HTML shell: navbar, main container, toast, router bootstrap
├── app.js         — SPA logic: router, API calls, player, episode nav, rendering
├── styles.css     — Dark theme variables, card styles, skeletons, animations
├── README.md      — This file
└── LICENSE        — MIT License
```

---

## Local Setup

No build step. No dependencies to install.

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/aprifidock.git

# 2. Open it in a browser
#    Option A — just open the file (some features may differ cross-origin)
open aprifidock/index.html

#    Option B — serve with Python (recommended)
cd aprifidock
python3 -m http.server 8080
# Then visit: http://localhost:8080

#    Option C — serve with Node.js npx
npx serve .
# Then visit the URL shown in the terminal
```

> Hash-based routing (`#/home`, `#/watch/21`) works correctly with any static file server, including GitHub Pages.

---

## Features at a Glance

- **Hash Router** — `/#/home`, `/#/top`, `/#/search?q=naruto`, `/#/watch/21?ep=3` — full back/forward support
- **Debounced Search** — 400ms debounce on all search inputs to stay within Jikan's rate limit
- **Loading Skeletons** — shimmer placeholders fill the layout before data arrives
- **Hero Banner** — top airing anime displayed as a cinematic fullscreen hero with backdrop
- **Episode Grid** — clickable pills for every episode; active pill highlighted in accent blue
- **Stagger Animations** — cards animate in with delay offsets for a polished feel
- **Responsive** — mobile-first grid, collapsible nav, mobile search bar
- **Scroll-to-Top** — button appears after 400px scroll
- **Toast Errors** — non-blocking, auto-dismissing error notifications

---

## Deployment

See the numbered checklist below the README in the repo for GitHub Pages deployment steps.

---

## License

MIT — see `LICENSE` for full text.

---

<div align="center">
  Made with ♥ and vanilla JS · <a href="https://jikan.moe">Jikan API</a> · Omega Player
</div>
