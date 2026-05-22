/**
 * Aprifidock — app.js
 * Vanilla JS SPA: hash-based routing · Jikan v4 API · Omega Player
 */

'use strict';

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const JIKAN_BASE  = 'https://api.jikan.moe/v4';
const OMEGA_BASE  = 'https://player.omegatv.app';   // Omega Player embed base
const APP_EL      = document.getElementById('app');

/* ══════════════════════════════════════════
   UTILITY: DEBOUNCE
   Limits search calls to respect Jikan's
   3 requests/second rate limit.
══════════════════════════════════════════ */
function debounce(fn, delay = 380) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ══════════════════════════════════════════
   UTILITY: FETCH WITH ERROR HANDLING
══════════════════════════════════════════ */
async function fetchAnime(endpoint, params = {}) {
  const url = new URL(`${JIKAN_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      // 429 = Too Many Requests (Jikan rate limit)
      if (res.status === 429) throw new Error('Rate limited – please wait a moment.');
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;  // cancelled fetch
    showToast(err.message || 'Network error. Check your connection.');
    return null;
  }
}

/* ══════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════ */
let _toastTimer;
function showToast(msg, duration = 3500) {
  const toast   = document.getElementById('toast');
  const msgEl   = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ══════════════════════════════════════════
   SCROLL-TO-TOP BUTTON
══════════════════════════════════════════ */
(function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('hidden', window.scrollY < 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ══════════════════════════════════════════
   MOBILE NAV TOGGLES
══════════════════════════════════════════ */
(function initMobileNav() {
  const hamburger      = document.getElementById('hamburger');
  const mobileMenu     = document.getElementById('mobile-menu');
  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  const mobileSearchBar = document.getElementById('mobile-search-bar');

  hamburger?.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    if (!mobileMenu.classList.contains('hidden')) mobileSearchBar.classList.add('hidden');
  });

  mobileSearchBtn?.addEventListener('click', () => {
    mobileSearchBar.classList.toggle('hidden');
    if (!mobileSearchBar.classList.contains('hidden')) {
      document.getElementById('mobile-search-input')?.focus();
      mobileMenu.classList.add('hidden');
    }
  });
})();

/* ══════════════════════════════════════════
   SEARCH INPUT WIRING
   Debounced across both desktop + mobile inputs.
══════════════════════════════════════════ */
function handleSearch(query) {
  const q = query.trim();
  if (!q) return;
  window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
}

const debouncedSearch = debounce((q) => handleSearch(q), 400);

(function wireSearchInputs() {
  const desktop = document.getElementById('search-input');
  const mobile  = document.getElementById('mobile-search-input');

  function onInput(e) {
    const spinner = document.getElementById('search-spinner');
    if (spinner) spinner.classList.toggle('hidden', !e.target.value.trim());
    debouncedSearch(e.target.value);
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e.target.value);
    }
  }

  [desktop, mobile].forEach(el => {
    if (!el) return;
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeydown);
  });
})();

/* ══════════════════════════════════════════
   ACTIVE NAV LINK
══════════════════════════════════════════ */
function setActiveNav(route) {
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(a => {
    const isActive = a.dataset.route === route;
    a.classList.toggle('text-sky-400',  isActive);
    a.classList.toggle('bg-slate-800/70', isActive);
    a.classList.toggle('text-slate-400', !isActive);
  });
}

/* ══════════════════════════════════════════
   SKELETON HELPERS
══════════════════════════════════════════ */
function skeletonCards(count = 12) {
  return Array.from({ length: count }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div style="padding:0.65rem 0.75rem 0.75rem">
        <div class="skeleton-line" style="width:88%"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════
   CARD RENDERER
══════════════════════════════════════════ */
function animeCardHTML(anime, rank = null) {
  const id      = anime.mal_id;
  const title   = anime.title_english || anime.title || 'Unknown';
  const img     = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '';
  const score   = anime.score   ? `⭐ ${anime.score.toFixed(1)}` : '';
  const year    = anime.year    || anime.aired?.prop?.from?.year || '';
  const type    = anime.type    || '';
  const eps     = anime.episodes ? `${anime.episodes} ep` : '';

  const metaParts = [year, type, eps].filter(Boolean);
  const metaHTML  = metaParts.map((p, i) => `
    ${i > 0 ? '<span class="meta-dot"></span>' : ''}
    <span>${escapeHTML(p.toString())}</span>
  `).join('');

  return `
    <div class="anime-card" role="button" tabindex="0"
         aria-label="Watch ${escapeHTML(title)}"
         onclick="navigate('/watch/${id}')"
         onkeydown="if(event.key==='Enter')navigate('/watch/${id}')">
      <div class="anime-card-img-wrap">
        <img src="${img}" alt="${escapeHTML(title)}" loading="lazy" decoding="async"
             onerror="this.src='https://via.placeholder.com/300x450/1e293b/38bdf8?text=No+Image'" />
        ${rank ? `<div class="rank-badge">#${rank}</div>` : ''}
        ${score ? `<div class="score-badge">${score}</div>` : ''}
        <div class="play-overlay">
          <div class="play-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="anime-card-body">
        <div class="anime-card-title">${escapeHTML(title)}</div>
        <div class="anime-card-meta">${metaHTML}</div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════
   OMEGA PLAYER — renderPlayer
   Embeds the Omega Player iframe for a given
   MAL ID and episode number. Dynamically
   updates src on episode change.
══════════════════════════════════════════ */
function buildOmegaSrc(malId, episode = 1) {
  // Omega Player URL format: /embed/mal/{malId}/{episode}
  return `${OMEGA_BASE}/embed/mal/${malId}/${episode}`;
}

function renderPlayer(malId, episode = 1) {
  const wrapper = document.getElementById('player-iframe-wrapper');
  if (!wrapper) return;

  const src = buildOmegaSrc(malId, episode);

  wrapper.innerHTML = `
    <iframe
      id="omega-iframe"
      src="${src}"
      allowfullscreen
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      referrerpolicy="no-referrer-when-downgrade"
      title="Anime Player — Episode ${episode}"
    ></iframe>
  `;
}

/* ══════════════════════════════════════════
   EPISODE NAVIGATION
══════════════════════════════════════════ */
function updateEpisodeUI(malId, currentEp, totalEps) {
  const prevBtn    = document.getElementById('btn-prev-ep');
  const nextBtn    = document.getElementById('btn-next-ep');
  const epLabel    = document.getElementById('ep-label');
  const epGrid     = document.getElementById('ep-grid');

  if (epLabel) epLabel.textContent = `Episode ${currentEp}${totalEps ? ' / ' + totalEps : ''}`;

  if (prevBtn) prevBtn.disabled = currentEp <= 1;
  if (nextBtn) nextBtn.disabled = totalEps ? currentEp >= totalEps : false;

  // Update active pill in episode grid
  if (epGrid) {
    epGrid.querySelectorAll('.ep-pill').forEach(pill => {
      pill.classList.toggle('active', parseInt(pill.dataset.ep) === currentEp);
    });
  }

  // Update URL without pushing a new history entry if only ep changed
  const newHash = `#/watch/${malId}?ep=${currentEp}`;
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }
}

function changeEpisode(malId, newEp, totalEps) {
  if (newEp < 1) return;
  if (totalEps && newEp > totalEps) return;
  renderPlayer(malId, newEp);
  updateEpisodeUI(malId, newEp, totalEps);
  // Scroll player into view on mobile
  document.getElementById('player-iframe-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════════════════════════
   ROUTE: HOME
══════════════════════════════════════════ */
async function renderHome() {
  setActiveNav('home');
  APP_EL.innerHTML = `<div class="page-enter">
    <!-- Hero skeleton -->
    <div class="hero-section mb-10">
      <div class="hero-backdrop skeleton" style="filter:none;opacity:1;"></div>
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <div class="skeleton-line" style="width:50%;height:14px;margin-bottom:12px"></div>
        <div class="skeleton-line" style="width:75%;height:28px;margin-bottom:16px"></div>
        <div class="skeleton-line" style="width:40%;height:11px;margin-bottom:20px"></div>
        <div class="skeleton" style="width:140px;height:40px;border-radius:10px"></div>
      </div>
    </div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pb-16">
      <div>
        <div class="section-heading mb-5">🔥 Trending Now</div>
        <div class="anime-grid">${skeletonCards(10)}</div>
      </div>
    </div>
  </div>`;

  // Fetch top airing (trending) + top all-time
  const [airing, topAll] = await Promise.all([
    fetchAnime('/top/anime', { filter: 'airing', limit: 20 }),
    fetchAnime('/top/anime', { limit: 10 }),
  ]);

  const airingList = airing?.data ?? [];
  const topList    = topAll?.data  ?? [];
  const hero       = airingList[0];

  // Build hero HTML
  const heroHTML = hero ? `
    <div class="hero-section mb-10">
      <div class="hero-backdrop" style="background-image:url('${hero.images?.jpg?.large_image_url ?? ''}')"></div>
      <div class="hero-gradient"></div>
      <div class="hero-content">
        <div class="info-label mb-1">🔴 Currently Airing</div>
        <h1 class="font-display font-extrabold text-3xl sm:text-4xl leading-tight mb-3 text-white drop-shadow-lg">
          ${escapeHTML(hero.title_english || hero.title)}
        </h1>
        <p class="text-slate-300 text-sm mb-5 max-w-lg line-clamp-2">${escapeHTML(hero.synopsis?.slice(0, 160) ?? '')}…</p>
        <div class="flex gap-3 flex-wrap">
          <button onclick="navigate('/watch/${hero.mal_id}')" class="ep-btn primary text-base px-6 py-2.5">
            ▶ Watch Now
          </button>
          <button onclick="navigate('/watch/${hero.mal_id}')" class="ep-btn secondary text-base px-5 py-2.5">
            ＋ More Info
          </button>
        </div>
      </div>
    </div>
  ` : '';

  APP_EL.innerHTML = `<div class="page-enter">
    ${heroHTML}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-16">

      <section>
        <div class="section-heading mb-5">🔥 Trending Now</div>
        <div class="anime-grid">
          ${airingList.map(a => animeCardHTML(a)).join('')}
        </div>
      </section>

      <section>
        <div class="section-heading mb-5">🏆 All-Time Top Anime</div>
        <div class="anime-grid">
          ${topList.map((a, i) => animeCardHTML(a, i + 1)).join('')}
        </div>
      </section>

    </div>
  </div>`;
}

/* ══════════════════════════════════════════
   ROUTE: TOP ANIME
══════════════════════════════════════════ */
async function renderTop() {
  setActiveNav('top');
  APP_EL.innerHTML = `<div class="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
    <div class="section-heading mb-6">🏆 Top 50 Anime of All Time</div>
    <div class="anime-grid">${skeletonCards(20)}</div>
  </div>`;

  const data = await fetchAnime('/top/anime', { limit: 50 });
  const list = data?.data ?? [];

  APP_EL.innerHTML = `<div class="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
    <div class="section-heading mb-6">🏆 Top 50 Anime of All Time</div>
    ${list.length ? `<div class="anime-grid">${list.map((a, i) => animeCardHTML(a, i + 1)).join('')}</div>`
                  : `<div class="empty-state"><span class="emoji">😢</span>No results found.</div>`}
  </div>`;
}

/* ══════════════════════════════════════════
   ROUTE: SEARCH
══════════════════════════════════════════ */
async function renderSearch(query = '') {
  setActiveNav('search');

  APP_EL.innerHTML = `<div class="page-enter max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
    <div class="section-heading mb-6">🔍 Search Anime</div>
    <div class="relative mb-8">
      <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input id="page-search-input" type="search" placeholder="Type anime name and press Enter…"
             value="${escapeHTML(query)}"
             class="search-page-input" autocomplete="off" spellcheck="false" />
    </div>
    <div id="search-results">
      ${query ? `<div class="anime-grid">${skeletonCards(12)}</div>` : `
        <div class="empty-state">
          <span class="emoji">🎌</span>
          Search for your favourite anime above.
        </div>
      `}
    </div>
  </div>`;

  // Wire page search input
  const pageInput = document.getElementById('page-search-input');
  if (pageInput) {
    pageInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q) window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
      }
    });
    // Debounced live search from page input
    pageInput.addEventListener('input', debounce(async (e) => {
      const q = e.target.value.trim();
      if (q.length < 2) return;
      await performSearch(q);
    }, 420));
    pageInput.focus();
  }

  if (query) await performSearch(query);
}

async function performSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;
  const spinner = document.getElementById('search-spinner');
  if (spinner) spinner.classList.remove('hidden');

  resultsEl.innerHTML = `<div class="anime-grid">${skeletonCards(12)}</div>`;

  const data = await fetchAnime('/anime', { q: query, limit: 24, sfw: true });
  if (spinner) spinner.classList.add('hidden');

  const list = data?.data ?? [];
  resultsEl.innerHTML = list.length
    ? `<div class="text-sm text-slate-500 mb-4 font-mono">${list.length} results for "<span class="text-sky-400">${escapeHTML(query)}</span>"</div>
       <div class="anime-grid">${list.map(a => animeCardHTML(a)).join('')}</div>`
    : `<div class="empty-state"><span class="emoji">🔦</span>No results for "<b>${escapeHTML(query)}</b>".<br>Try a different spelling.</div>`;
}

/* ══════════════════════════════════════════
   ROUTE: WATCH
══════════════════════════════════════════ */
async function renderWatch(malId, startEp = 1) {
  setActiveNav('');
  APP_EL.innerHTML = `<div class="page-enter max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
    <div class="flex flex-col xl:flex-row gap-8">
      <!-- Player column -->
      <div class="flex-1 min-w-0">
        <div class="player-wrapper mb-5" id="player-iframe-wrapper">
          <div class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <div class="w-10 h-10 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin"></div>
          </div>
        </div>
        <!-- Episode navigation bar -->
        <div class="flex items-center justify-between gap-3 flex-wrap bg-[#1e293b] border border-slate-700/60 rounded-xl px-4 py-3 mb-5">
          <button id="btn-prev-ep" class="ep-btn secondary" onclick="onPrevEp()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            Prev
          </button>
          <span id="ep-label" class="font-mono text-sm text-slate-300">Episode ${startEp}</span>
          <button id="btn-next-ep" class="ep-btn primary" onclick="onNextEp()">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <!-- Episode grid (populated after data load) -->
        <div class="bg-[#1e293b] border border-slate-700/60 rounded-xl p-4 mb-5">
          <div class="info-label mb-3">Select Episode</div>
          <div id="ep-grid" class="ep-grid">
            <div class="skeleton-line" style="width:100%;height:32px;border-radius:7px"></div>
          </div>
        </div>
      </div>

      <!-- Info sidebar -->
      <div class="xl:w-80 shrink-0">
        <div id="anime-info" class="space-y-5">
          <!-- skeleton -->
          <div class="skeleton" style="height:320px;border-radius:14px"></div>
          <div class="skeleton-line" style="width:80%;height:18px"></div>
          <div class="skeleton-line" style="width:55%;height:11px"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    </div>
  </div>`;

  // Expose current watch state globally for btn handlers
  window._watchState = { malId: parseInt(malId), currentEp: startEp, totalEps: null };

  // Start the player immediately (don't wait for API)
  renderPlayer(malId, startEp);

  // Fetch anime details
  const data = await fetchAnime(`/anime/${malId}`);
  const anime = data?.data;
  if (!anime) {
    showToast('Could not load anime details.');
    return;
  }

  const totalEps = anime.episodes || null;
  window._watchState.totalEps = totalEps;

  // Build episode grid
  const epCount = totalEps || 24; // fallback if unknown
  const epPills = Array.from({ length: epCount }, (_, i) => i + 1)
    .map(ep => `<button class="ep-pill${ep === startEp ? ' active' : ''}" data-ep="${ep}"
                   onclick="changeEpisode(${malId}, ${ep}, ${totalEps ?? 'null'})">${ep}</button>`)
    .join('');

  document.getElementById('ep-grid').innerHTML = epPills || '<span class="text-slate-500 text-sm">Episode count unavailable.</span>';

  // Update nav buttons
  updateEpisodeUI(malId, startEp, totalEps);

  // Build sidebar info
  const genres = (anime.genres || []).map(g => `<span class="genre-tag">${escapeHTML(g.name)}</span>`).join('');
  const studios = (anime.studios || []).map(s => escapeHTML(s.name)).join(', ') || '—';
  const status  = anime.status   || '—';
  const score   = anime.score    ? `⭐ ${anime.score} / 10` : '—';
  const year    = anime.year || anime.aired?.prop?.from?.year || '—';
  const synopsis = escapeHTML(anime.synopsis || 'No synopsis available.');

  document.getElementById('anime-info').innerHTML = `
    <img src="${anime.images?.jpg?.large_image_url || ''}" alt="${escapeHTML(anime.title)}"
         class="w-full rounded-2xl shadow-2xl object-cover aspect-[3/4]"
         onerror="this.style.display='none'" />

    <div>
      <h2 class="font-display font-bold text-xl leading-tight mb-1">${escapeHTML(anime.title_english || anime.title)}</h2>
      ${anime.title !== anime.title_english && anime.title_english
        ? `<p class="text-slate-500 text-sm">${escapeHTML(anime.title)}</p>` : ''}
    </div>

    <div class="grid grid-cols-2 gap-3 text-sm">
      <div><div class="info-label">Score</div><span class="text-sky-400 font-mono">${score}</span></div>
      <div><div class="info-label">Year</div><span>${year}</span></div>
      <div><div class="info-label">Status</div><span class="${status.includes('Airing') ? 'text-green-400' : 'text-slate-300'}">${status}</span></div>
      <div><div class="info-label">Episodes</div><span>${totalEps || '?'}</span></div>
      <div class="col-span-2"><div class="info-label">Studios</div><span class="text-slate-300">${studios}</span></div>
    </div>

    ${genres ? `<div><div class="info-label mb-2">Genres</div><div class="flex flex-wrap gap-1.5">${genres}</div></div>` : ''}

    <div>
      <div class="info-label mb-2">Synopsis</div>
      <p id="synopsis-text" class="synopsis-text text-slate-400 text-sm leading-relaxed">${synopsis}</p>
      <button onclick="document.getElementById('synopsis-text').classList.toggle('expanded');this.textContent=this.textContent==='Show less'?'Read more…':'Show less'"
              class="text-sky-400 text-xs mt-1.5 hover:underline">Read more…</button>
    </div>

    <a href="https://myanimelist.net/anime/${malId}" target="_blank" rel="noopener noreferrer"
       class="flex items-center gap-2 text-slate-400 hover:text-sky-400 text-sm transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      View on MyAnimeList
    </a>
  `;
}

/* ══════════════════════════════════════════
   EPISODE BUTTON HANDLERS (global scope)
══════════════════════════════════════════ */
window.onPrevEp = function () {
  const s = window._watchState;
  if (!s) return;
  changeEpisode(s.malId, s.currentEp - 1, s.totalEps);
  s.currentEp -= 1;
};

window.onNextEp = function () {
  const s = window._watchState;
  if (!s) return;
  changeEpisode(s.malId, s.currentEp + 1, s.totalEps);
  s.currentEp += 1;
};

// Make changeEpisode globally accessible (called from ep-pill onclick)
window.changeEpisode = function (malId, ep, totalEps) {
  const s = window._watchState;
  if (s) s.currentEp = ep;
  changeEpisode(malId, ep, totalEps);
};

// Navigate helper (used in card onclick)
window.navigate = function (path) {
  window.location.hash = '#' + path;
};

/* ══════════════════════════════════════════
   HASH-BASED ROUTER
   Routes:
     #/home
     #/top
     #/search
     #/search?q={query}
     #/watch/{malId}
     #/watch/{malId}?ep={episode}
══════════════════════════════════════════ */
function parseHash() {
  // Normalise — strip leading '#' then leading '/'
  const raw  = window.location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(qs ?? ''));
  return { route: parts[0] || 'home', segments: parts, params };
}

async function router() {
  const { route, segments, params } = parseHash();

  // Close mobile menu on navigate
  document.getElementById('mobile-menu')?.classList.add('hidden');
  document.getElementById('mobile-search-bar')?.classList.add('hidden');

  // Sync search input value
  if (params.q) {
    const q = decodeURIComponent(params.q);
    const desktopInput = document.getElementById('search-input');
    const mobileInput  = document.getElementById('mobile-search-input');
    if (desktopInput) desktopInput.value = q;
    if (mobileInput)  mobileInput.value  = q;
  }

  // Dispatch to route handlers
  switch (route) {
    case 'home':
      await renderHome();
      break;

    case 'top':
      await renderTop();
      break;

    case 'search':
      await renderSearch(params.q ? decodeURIComponent(params.q) : '');
      break;

    case 'watch': {
      const malId  = parseInt(segments[1]);
      const startEp = parseInt(params.ep) || 1;
      if (!malId || isNaN(malId)) {
        await renderHome();
        break;
      }
      await renderWatch(malId, startEp);
      break;
    }

    default:
      await renderHome();
  }

  // Scroll to top on route change (except watch, let user stay at player)
  if (route !== 'watch') window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  // Redirect bare / to #/home
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#/home';
  } else {
    router();
  }
});
