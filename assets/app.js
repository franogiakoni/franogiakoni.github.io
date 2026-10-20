(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PUBS = window.PUBS || [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const lang = () => doc.dataset.lang;
  const t = (es, en) => (lang() === 'en' ? en : es);
  const fmt = n => n.toLocaleString(lang() === 'en' ? 'en-US' : 'es-CL');

  const LINES = {
    esports: ['Gestión deportiva', 'Sport management'],
    gestion: ['Gestión deportiva', 'Sport management'],
    vr: ['Realidad virtual', 'Virtual reality'],
    salud: ['Actividad física y salud', 'Physical activity & health'],
  };
  const lineName = l => t(...LINES[l]);
  const pubUrl = p => p.url || `https://scholar.google.es/citations?view_op=view_citation&hl=${lang()}&user=eCAw05QAAAAJ&citation_for_view=eCAw05QAAAAJ:${p.id}`;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- language ---------- */
  const langListeners = [];
  function setLang(l, save = true) {
    doc.dataset.lang = l; doc.lang = l;
    $$('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === l)));
    $$('[data-ph-es]').forEach(el => el.placeholder = el.dataset[l === 'en' ? 'phEn' : 'phEs']);
    $$('option[data-es]').forEach(o => o.textContent = o.dataset[l]);
    document.title = l === 'en'
      ? 'Frano Giakoni Ramírez — Sport management, esports and neuromarketing'
      : 'Frano Giakoni Ramírez — Gestión deportiva, esports y neuromarketing';
    if (save) try { localStorage.setItem('lang', l); } catch (e) {}
    langListeners.forEach(fn => fn());
  }
  $$('[data-set-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang)));
  let initial = 'es';
  try { initial = localStorage.getItem('lang') || (navigator.language || 'es').slice(0, 2); } catch (e) {}
  if (initial !== 'en') initial = 'es';

  /* ---------- header ---------- */
  const top = $('.top');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const navLinks = $$('.nav a');
  const pill = $('.nav-pill');
  function movePill() {
    const a = $('.nav a.active');
    if (!a || innerWidth <= 1080) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = `translateX(${a.offsetLeft}px)`;
  }
  addEventListener('resize', movePill);
  // hide header on scroll down, show on scroll up
  let lastSY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    top.classList.toggle('hide', y > lastSY + 4 && y > 400 && !doc.classList.contains('menu-open'));
    if (y < lastSY - 4) top.classList.remove('hide');
    lastSY = y;
  }, { passive: true });
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); movePill(); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.menu-btn'), nav = $('#mainNav');
  const closeMenu = () => { doc.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    const open = !doc.classList.contains('menu-open');
    doc.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open));
    if (open) nav.querySelector('a').focus();
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { closeMenu(); menuBtn.focus(); } });

  /* ---------- deck ---------- */
  const deck = $('#deck');
  const featured = [...PUBS].filter(p => p.c >= 10)
    .sort((a, b) => b.c - a.c).slice(0, 9);
  const ring = document.createElement('div'); ring.className = 'deck-ring'; deck.appendChild(ring);
  function renderDeck() {
    ring.innerHTML = featured.map(p => {
      const venue = p.v.replace(/,\s*\d{4}$/, '');
      return `<a class="card" role="listitem" data-line="${p.l}" href="${pubUrl(p)}" target="_blank" rel="noopener" draggable="false">
        <span class="card-top"><span>${lineName(p.l)}</span><span class="card-year">${p.y}</span></span>
        <span class="card-title">${esc(p.t)}</span>
        <span class="card-venue">${esc(venue)}</span>
        <span class="card-cites"><b>${p.c}</b><span>${t('citas', 'citations')}</span></span>
      </a>`;
    }).join('');
    layoutDeck();
  }
  let cw = 230;
  let gap = 0.62;
  function layoutDeck() { const c = ring.firstElementChild; if (c) cw = c.offsetWidth; gap = Math.min(0.82, Math.max(0.6, deck.clientWidth / cw * 0.2)); }
  const N = featured.length;
  let focus = 0, vel = 0, dragging = false, lastX = 0, moved = 0, visible = true, idle = 0;
  function draw() {
    [...ring.children].forEach((c, i) => {
      let o = ((i - focus) % N + N) % N; if (o > N / 2) o -= N;
      const ao = Math.abs(o);
      c.style.transform = `translate3d(${o * cw * gap}px, ${ao * ao * 6}px, ${-ao * cw * 0.55}px) rotateY(${-o * 24}deg) rotateZ(${o * 2.5}deg)`;
      c.style.opacity = ao > 2.6 ? Math.max(0, 3.4 - ao).toFixed(3) : 1;
      c.style.zIndex = String(100 - Math.round(ao * 10));
      c.style.filter = `brightness(${(1 - Math.min(ao, 3) * 0.16).toFixed(3)})`;
      c.style.pointerEvents = ao > 2.6 ? 'none' : '';
      c.tabIndex = ao < 0.5 ? 0 : -1;
    });
  }
  deck.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; lastX = e.clientX; vel = 0; deck.classList.add('dragging');
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    focus -= dx / (cw * gap); vel = -dx / (cw * gap);
  });
  addEventListener('pointerup', () => { if (!dragging) return; dragging = false; deck.classList.remove('dragging'); idle = 0; });
  deck.addEventListener('click', e => {
    if (moved > 6) { e.preventDefault(); return; }
    const card = e.target.closest('.card'); if (!card) return;
    const i = [...ring.children].indexOf(card);
    let o = ((i - focus) % N + N) % N; if (o > N / 2) o -= N;
    if (Math.abs(o) > 0.5) { e.preventDefault(); focus = Math.round(focus + o); vel = 0; idle = 0; }
  }, true);
  deck.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { focus = Math.round(focus) - 1; e.preventDefault(); }
    if (e.key === 'ArrowRight') { focus = Math.round(focus) + 1; e.preventDefault(); }
    requestAnimationFrame(() => ring.querySelector('.card[tabindex="0"]')?.focus());
  });
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(deck);
  let target = null;
  function tick() {
    if (visible && !dragging) {
      if (Math.abs(vel) > 0.002) { focus += vel; vel *= 0.92; }
      else {
        vel = 0; idle += 1;
        // settle on the nearest card, then advance every ~4s
        const snap = Math.round(focus);
        if (!reduced && idle > 240) { idle = 0; target = snap + 1; }
        const goal = target ?? snap;
        focus += (goal - focus) * 0.08;
        if (Math.abs(goal - focus) < 0.001) { focus = goal; target = null; }
      }
    }
    if (visible) draw();
    requestAnimationFrame(tick);
  }
  addEventListener('resize', layoutDeck);

  /* ---------- citations chart ---------- */
  const SCH = window.SCHOLAR || {};
  const CITES = (SCH.perYear && SCH.perYear.length) ? SCH.perYear : [[2021, 20], [2022, 81], [2023, 133], [2024, 256], [2025, 250], [2026, 274]];
  function renderStats() {
    if (!SCH.citations) return;
    $$('[data-s]').forEach(el => {
      const k = el.dataset.s, en = el.closest('[lang="en"]');
      const n = v => v.toLocaleString(en ? 'en-US' : 'es-CL');
      if (k === 'citations') el.textContent = n(SCH.citations);
      if (k === 'h') el.textContent = SCH.h; if (k === 'i10') el.textContent = SCH.i10;
      if (k === 'floor') el.textContent = Math.floor(SCH.records / 10) * 10;
      if (k === 'date') el.textContent = en ? SCH.updated : SCH.updated.split('-').reverse().join('-');
    });
  }
  function renderChart() {
    const svg = $('#citesChart'); const W = 600, H = 260, top = 34, bottom = 30;
    const max = Math.ceil(Math.max(...CITES.map(c => c[1])) / 50) * 50 + 25, bw = 62, gap = (W - CITES.length * bw) / (CITES.length - 1);
    const y = v => H - bottom - (v / max) * (H - top - bottom);
    svg.innerHTML = `<line class="axis" x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}"/>` +
      CITES.map(([yr, v], i) => {
        const x = i * (bw + gap), last = i === CITES.length - 1;
        return `<rect class="bar${last ? ' hi' : ''}" x="${x}" y="${y(v)}" width="${bw}" height="${H - bottom - y(v)}" rx="3"
            style="transform-origin:${x}px ${H - bottom}px"/>
          <text class="bar-val" x="${x + bw / 2}" y="${y(v) - 10}" text-anchor="middle">${v}</text>
          <text class="bar-yr" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${yr}${last ? '*' : ''}</text>`;
      }).join('');
    svg.setAttribute('aria-label', CITES.map(([yr, v]) => `${yr}: ${v}`).join(', '));
  }
  const chartCap = $('#chart-cap');
  const capBase = chartCap.innerHTML;
  chartCap.innerHTML = capBase + '<span lang="es"> · *2026 hasta octubre</span><span lang="en"> · *2026 through October</span>';

  /* ---------- gaze simulation ---------- */
  function gaze() {
    const cv = $('#gaze'); if (!cv) return; const ctx = cv.getContext('2d');
    let W, H, dpr, heat, hctx;
    // areas of interest in a stylised esports broadcast (fractions of frame)
    const AOI = [
      { id: 'game', x: .03, y: .14, w: .70, h: .62, es: 'Juego', en: 'Gameplay', wt: .46 },
      { id: 'score', x: .30, y: .03, w: .40, h: .08, es: 'Marcador', en: 'Scoreboard', wt: .12 },
      { id: 'cam', x: .76, y: .14, w: .21, h: .27, es: 'Cámara del jugador', en: 'Player cam', wt: .14 },
      { id: 'feed', x: .76, y: .45, w: .21, h: .31, es: 'Chat', en: 'Chat', wt: .08 },
      { id: 'map', x: .03, y: .79, w: .16, h: .18, es: 'Minimapa', en: 'Minimap', wt: .07 },
      { id: 'ad', x: .22, y: .81, w: .51, h: .14, es: 'Banner del patrocinador', en: 'Sponsor banner', wt: .13 },
    ];
    const dwell = Object.fromEntries(AOI.map(a => [a.id, 0]));
    let gx = .4, gy = .45, tx = .4, ty = .45, fixT = 0, fixDur = 300, path = [], total = 0, current = AOI[0];
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      heat = document.createElement('canvas'); heat.width = Math.max(1, W / 2); heat.height = Math.max(1, H / 2);
      hctx = heat.getContext('2d');
    }
    function pickTarget() {
      let r = Math.random(), a = AOI[0];
      for (const o of AOI) { r -= o.wt; if (r <= 0) { a = o; break; } }
      current = a;
      // bias game fixations toward the action in the centre
      const cx = a.id === 'game' ? .5 + (Math.random() - .5) * .55 : Math.random() * .8 + .1;
      const cy = a.id === 'game' ? .5 + (Math.random() - .5) * .6 : Math.random() * .7 + .15;
      tx = a.x + a.w * cx; ty = a.y + a.h * cy;
      fixDur = 180 + Math.random() * (a.id === 'game' ? 520 : 380);
    }
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
    function frame(dt) {
      // saccade + fixation model
      fixT += dt;
      const k = Math.min(1, dt / 40);
      gx += (tx - gx) * k; gy += (ty - gy) * k;
      if (fixT > fixDur) {
        path.push({ x: gx, y: gy, d: fixDur }); if (path.length > 7) path.shift();
        dwell[current.id] += fixDur; total += fixDur; fixT = 0; pickTarget();
      }
      // accumulate heat (half-res, additive)
      hctx.globalCompositeOperation = 'source-over';
      hctx.fillStyle = 'rgba(0,0,0,0.012)'; hctx.globalCompositeOperation = 'destination-out';
      hctx.fillRect(0, 0, heat.width, heat.height);
      hctx.globalCompositeOperation = 'lighter';
      const hx = gx * heat.width, hy = gy * heat.height, hr = heat.width * .045;
      const g = hctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
      g.addColorStop(0, 'rgba(255,170,60,0.03)'); g.addColorStop(1, 'rgba(255,90,30,0)');
      hctx.fillStyle = g; hctx.beginPath(); hctx.arc(hx, hy, hr, 0, 7); hctx.fill();
    }
    function paint() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0d0d0c'; ctx.fillRect(0, 0, W, H);
      // broadcast frame
      AOI.forEach(a => {
        const x = a.x * W, y = a.y * H, w = a.w * W, h = a.h * H;
        rr(x, y, w, h, 6);
        ctx.fillStyle = a.id === 'game' ? '#1b1d1c' : a.id === 'ad' ? '#262219' : '#191918';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();
      });
      // game scene geometry
      const gA = AOI[0], gx0 = gA.x * W, gy0 = gA.y * H, gw = gA.w * W, gh = gA.h * H;
      ctx.save(); rr(gx0, gy0, gw, gh, 6); ctx.clip();
      ctx.strokeStyle = 'rgba(156,195,178,.16)';
      for (let i = 1; i < 9; i++) { ctx.beginPath(); ctx.moveTo(gx0 + gw * i / 9, gy0 + gh); ctx.lineTo(gx0 + gw / 2 + (i - 4.5) * gw * .03, gy0 + gh * .35); ctx.stroke(); }
      for (let j = 0; j < 5; j++) { const yy = gy0 + gh * (.4 + j * j * .035); ctx.beginPath(); ctx.moveTo(gx0, yy); ctx.lineTo(gx0 + gw, yy); ctx.stroke(); }
      ctx.fillStyle = 'rgba(216,180,106,.85)'; ctx.beginPath(); ctx.arc(gx0 + gw * .46, gy0 + gh * .58, 4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(174,166,220,.85)'; ctx.beginPath(); ctx.arc(gx0 + gw * .58, gy0 + gh * .5, 4, 0, 7); ctx.fill();
      ctx.restore();
      // sponsor mark
      const ad = AOI[5];
      ctx.fillStyle = 'rgba(216,180,106,.55)'; ctx.font = `600 ${Math.max(10, H * .035)}px Geist, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('SPONSOR', (ad.x + ad.w / 2) * W, (ad.y + ad.h / 2) * H);
      // heat
      ctx.globalCompositeOperation = 'screen'; ctx.drawImage(heat, 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
      // scanpath
      ctx.strokeStyle = 'rgba(242,225,182,.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
      path.forEach((p, i) => i ? ctx.lineTo(p.x * W, p.y * H) : ctx.moveTo(p.x * W, p.y * H));
      ctx.lineTo(gx * W, gy * H); ctx.stroke();
      path.forEach((p, i) => {
        const r = 4 + p.d / 70;
        ctx.fillStyle = 'rgba(21,21,20,.75)'; ctx.strokeStyle = 'rgba(242,225,182,.8)';
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f2e1b6'; ctx.font = `500 ${Math.max(9, r * .9)}px "Geist Mono", monospace`;
        ctx.fillText(String(i + 1), p.x * W, p.y * H + .5);
      });
      // live gaze point
      ctx.fillStyle = '#d8b46a'; ctx.beginPath(); ctx.arc(gx * W, gy * H, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(216,180,106,.4)'; ctx.beginPath(); ctx.arc(gx * W, gy * H, 12 + (fixT / fixDur) * 8, 0, 7); ctx.stroke();
      // dwell labels
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const fs = Math.max(10, Math.min(13, W * .018));
      AOI.forEach(a => {
        const pct = total ? Math.round(dwell[a.id] / total * 100) : 0;
        ctx.font = `500 ${fs}px Geist, sans-serif`;
        ctx.fillStyle = a.id === current.id ? '#f2e1b6' : 'rgba(239,237,230,.62)';
        ctx.fillText(`${lang() === 'en' ? a.en : a.es}  ${pct}%`, a.x * W + 8, a.y * H + 6);
      });
    }
    size(); pickTarget();
    addEventListener('resize', size);
    if (reduced) { for (let i = 0; i < 2400; i++) frame(16); paint(); langListeners.push(paint); return; }
    let on = false, last = performance.now();
    new IntersectionObserver(([e]) => { on = e.isIntersecting; last = performance.now(); }).observe(cv);
    (function loop(now) {
      if (on) { const dt = Math.min(64, now - last); last = now; frame(dt); paint(); }
      requestAnimationFrame(loop);
    })(performance.now());
    // warm up so the first view already has data
    for (let i = 0; i < 600; i++) frame(16);
  }

  /* ---------- publications ---------- */
  const PAGE = 10;
  const state = { q: '', line: 'all', year: 'all', sort: 'year', first: false, shown: PAGE };
  const list = $('#pubList'), countEl = $('#pubsCount'), more = $('#moreBtn'), empty = $('#pubEmpty');
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const yearSel = $('#year');
  [...new Set(PUBS.map(p => p.y).filter(Boolean))].sort((a, b) => b - a).forEach(y => yearSel.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`));
  function hl(text, q) {
    const safe = esc(text); if (!q) return safe;
    const i = norm(text).indexOf(norm(q)); if (i < 0) return safe;
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }
  function filtered() {
    const q = norm(state.q.trim());
    let r = PUBS.filter(p => (state.line === 'all' || p.l === state.line)
      && (state.year === 'all' || String(p.y) === state.year)
      && (!state.first || p.first)
      && (!q || norm(p.t + ' ' + p.v + ' ' + p.a).includes(q)));
    r.sort(state.sort === 'cites' ? (a, b) => b.c - a.c || b.y - a.y : (a, b) => b.y - a.y || b.c - a.c);
    return r;
  }
  function renderPubs() {
    const r = filtered(), q = state.q.trim();
    const total = PUBS.length;
    countEl.textContent = r.length === total
      ? t(`${total} publicaciones`, `${total} publications`)
      : t(`${r.length} de ${total} publicaciones`, `${r.length} of ${total} publications`);
    list.innerHTML = r.slice(0, state.shown).map((p, pi) => {
      const authors = esc(p.a).replace(/([A-Z]{1,3}\.? ?)?(Giakoni[‐-]?\s?Ram[ií]rez|Giakoni|G Ram[ií]rez|FG Ram[ií]rez)/g, '<span class="me">$&</span>');
      return `<li class="pub" style="--i:${Math.min(pi % PAGE, 12)}">
        <span class="pub-year">${p.y || t('s/f', 'n.d.')}</span>
        <div class="pub-main">
          <a class="pub-title" href="${pubUrl(p)}" target="_blank" rel="noopener">${hl(p.t, q)}</a>
          <div class="pub-meta"><span class="pub-line" data-l="${p.l}">${lineName(p.l)}</span>${authors}${p.v ? ` · <span class="pub-venue">${hl(p.v, q)}</span>` : ''}</div>
        </div>
        <span class="pub-cites${p.c ? '' : ' zero'}">${p.c || '—'}<small>${p.c === 1 ? t('cita', 'citation') : t('citas', 'citations')}</small></span>
      </li>`;
    }).join('');
    more.hidden = r.length <= state.shown;
    empty.hidden = r.length > 0;
  }
  function setLine(l) {
    state.line = l; state.shown = PAGE;
    $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.line === l)));
    renderPubs();
  }
  let qTimer;
  $('#q').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = e.target.value; state.shown = PAGE; renderPubs(); }, 120); });
  $$('.chip').forEach(c => c.addEventListener('click', () => setLine(c.dataset.line)));
  yearSel.addEventListener('change', e => { state.year = e.target.value; state.shown = PAGE; renderPubs(); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderPubs(); });
  $('#firstOnly').addEventListener('change', e => { state.first = e.target.checked; state.shown = PAGE; renderPubs(); });
  more.addEventListener('click', () => { state.shown += PAGE; renderPubs(); });
  $('#clearFilters').addEventListener('click', () => {
    Object.assign(state, { q: '', year: 'all', first: false }); $('#q').value = ''; yearSel.value = 'all'; $('#firstOnly').checked = false; setLine('all');
  });
  $$('[data-filter-line]').forEach(b => b.addEventListener('click', () => {
    setLine(b.dataset.filterLine); $('#publicaciones').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));
  function renderCounts() {
    $$('[data-count-line]').forEach(el => {
      const n = PUBS.filter(p => p.l === el.dataset.countLine).length;
      el.textContent = t(`${n} publicaciones →`, `${n} papers →`);
    });
  }

  /* ---------- talks ---------- */
  const HOME = [-33.45, -70.67];
  const TALKS = [
    [2026, 'Medellín', 'Colombia', 'Colombia', 6.25, -75.56, 'Fan experience: nuevas audiencias para el fútbol femenino (conferencia magistral)', 'Fan experience: new audiences for women’s football (keynote)', 'II Congreso Internacional de Fútbol Femenino · Liga Antioqueña de Fútbol'],
    [2026, 'Campinas', 'Brasil', 'Brazil', -22.91, -47.06, 'Comportamiento del consumidor deportivo', 'Sport consumer behaviour', 'Comité Brasileño de Clubes · Unicamp'],
    [2025, 'Bogotá', 'Colombia', 'Colombia', 4.71, -74.07, 'Comportamiento del consumidor deportivo', 'Sport consumer behaviour', 'V Congreso Internacional de Entrenamiento, Pedagogía y Administración Deportiva'],
    [2024, 'Minsk', 'Bielorrusia', 'Belarus', 53.9, 27.57, 'Esports Science', 'Esports Science', 'III International Scientific Congress · BSUPC'],
    [2024, 'La Habana', 'Cuba', 'Cuba', 23.11, -82.37, 'Esports and Phygital Sports Science', 'Esports and Phygital Sports Science', 'II Congreso Internacional UNAFID'],
    [2024, 'Monterrey', 'México', 'Mexico', 25.69, -100.32, 'Esports Science', 'Esports Science', 'XXXII Congreso FOD · UANL'],
    [2024, 'Lima', 'Perú', 'Peru', -12.05, -77.04, 'Predicción del rendimiento en los Panamericanos Santiago 2023', 'Predicting performance at the Santiago 2023 Pan American Games', 'Universidad Peruana de Ciencias Aplicadas'],
    [2023, 'Thiruvananthapuram', 'India', 'India', 8.52, 76.94, 'Esports: the new industry', 'Esports: the new industry', '22nd Biennial Conference · Sports Authority of India & LNCPE'],
    [2023, 'Doha', 'Qatar', 'Qatar', 25.29, 51.53, 'Brand Effectiveness in Esports Events', 'Brand Effectiveness in Esports Events', '4th Conference of the World Association for Sport Management'],
    [2023, 'Santo Domingo', 'República Dominicana', 'Dominican Republic', 18.49, -69.93, 'Eficacia de la publicidad en los esports', 'Advertising effectiveness in esports', 'Congreso ALGEDE · INEFI'],
    [2023, 'León', 'México', 'Mexico', 21.12, -101.68, 'Economía del comportamiento en la industria deportiva', 'Behavioural economics in the sport industry', 'Congreso Internacional del Deporte Guanajuato'],
    [2022, 'Concepción', 'Chile', 'Chile', -36.83, -73.05, 'Nueva tendencia deportiva: los esports', 'A new sporting trend: esports', 'II Seminario Internacional · UNAB'],
    [2021, 'A Coruña', 'España', 'Spain', 43.36, -8.41, 'Intenciones de los residentes ante la Fórmula E en Santiago', 'Residents’ intentions towards Formula E in Santiago', 'Congreso Iberoamericano de Economía Deportiva'],
    [2020, 'Quito', 'Ecuador', 'Ecuador', -0.18, -78.47, 'El Libro Blanco de la Gestión Deportiva', 'The White Book of Sport Management', 'Foro Iberoamericano de la Gerencia Deportiva · CIED'],
    [2020, 'Guatemala', 'Guatemala', 'Guatemala', 14.63, -90.51, 'Gestión deportiva en Latinoamérica', 'Sport management in Latin America', 'Universidad del Valle de Guatemala'],
    [2019, 'Barcelona', 'España', 'Spain', 41.39, 2.17, 'Impacto social de la Fórmula E', 'The social impact of Formula E', 'X Congreso Iberoamericano de Economía del Deporte'],
    [2019, 'Barcelona', 'España', 'Spain', 41.39, 2.17, 'Calidad del servicio deportivo en Chile: el caso PUCV', 'Sport service quality in Chile: the PUCV case', '30th FIEP World Congress'],
    [2018, 'Alicante', 'España', 'Spain', 38.35, -0.48, 'Protocolo de neuromarketing para streaming de esports', 'A neuromarketing protocol for esports streaming', 'I Congreso Internacional Universitario de Neuromarketing'],
    [2018, 'Murcia', 'España', 'Spain', 37.99, -1.13, 'El neuromarketing aplicado a los esports', 'Neuromarketing applied to esports', 'Cátedra Internacional de eSports · UCAM'],
  ];
  const km = ([la1, lo1], [la2, lo2]) => {
    const R = 6371, r = Math.PI / 180, dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(a)));
  };
  const talkKm = TALKS.map(x => km(HOME, [x[4], x[5]]));
  const CITIES = [];
  TALKS.forEach((x, i) => {
    let c = CITIES.find(c => c.name === x[1]);
    if (!c) CITIES.push(c = { name: x[1], es: x[2], en: x[3], lat: x[4], lon: x[5], km: talkKm[i], talks: [] });
    c.talks.push({ y: x[0], es: x[6], en: x[7], org: x[8] });
  });
  const VISITED = new Set(['076', '170', '112', '192', '484', '604', '356', '634', '214', '152', '724', '218', '320']);
  let selected = CITIES[0], mapReady = false, mapEls = {};

  function renderCard() {
    const c = selected;
    $('#atlasCard').innerHTML = `
      <p class="ac-km">${fmt(c.km)} km <span>${t('desde Santiago', 'from Santiago')}</span></p>
      <h3 class="ac-city">${esc(c.name)}</h3>
      <p class="ac-country">${esc(t(c.es, c.en))}</p>
      <ol class="ac-talks">${c.talks.map(k => `<li><time>${k.y}</time><div><b>${esc(t(k.es, k.en))}</b><span>${esc(k.org)}</span></div></li>`).join('')}</ol>
      <div class="ac-nav"><button type="button" data-step="-1" aria-label="${t('Ciudad anterior', 'Previous city')}">←</button><span>${CITIES.indexOf(c) + 1} / ${CITIES.length}</span><button type="button" data-step="1" aria-label="${t('Ciudad siguiente', 'Next city')}">→</button></div>`;
    $$('.ac-nav button').forEach(b => b.addEventListener('click', () => { stopPlay(); select(CITIES[(CITIES.indexOf(selected) + +b.dataset.step + CITIES.length) % CITIES.length]); }));
  }
  function select(c) {
    selected = c; renderCard();
    if (!mapReady) return;
    mapEls.cities.forEach(({ c: cc, g, arc }) => {
      const on = cc === c;
      g.classList.toggle('on', on); arc.classList.toggle('on', on);
    });
  }
  function renderTalks() {
    $('#talkList').innerHTML = TALKS.map((x, i) => `<li>${x[0]} · ${x[1]}, ${t(x[2], x[3])} · ${esc(t(x[6], x[7]))} · ${esc(x[8])} · ${fmt(talkKm[i])} km</li>`).join('');
    renderCard();
    if (mapReady) mapEls.cities.forEach(({ c, g }) => g.setAttribute('aria-label', `${c.name}, ${t(c.es, c.en)}: ${c.talks.length} ${t('ponencias', 'talks')}`));
  }

  async function buildMap() {
    const svg = $('#worldMap');
    if (!window.d3 || !window.topojson) return;
    let world;
    try { world = await fetch('assets/vendor/countries-110m.json').then(r => r.json()); } catch (e) { return; }
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
    const countries = topojson.feature(world, world.objects.countries).features.filter(f => f.id !== '010');
    const fc = { type: 'FeatureCollection', features: countries };
    const proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [954, 464]], fc);
    const path = d3.geoPath(proj);
    el('path', { d: path(d3.geoGraticule10()), class: 'm-grat' }, svg);
    const gC = el('g', { class: 'm-countries' }, svg);
    countries.forEach(f => el('path', { d: path(f), class: VISITED.has(f.id) ? 'm-c visited' : 'm-c' }, gC));
    const gA = el('g', { class: 'm-arcs' }, svg), gP = el('g', { class: 'm-pts' }, svg);
    const home = proj([HOME[1], HOME[0]]);
    mapEls.cities = CITIES.map((c, i) => {
      const arc = el('path', { d: path({ type: 'LineString', coordinates: [[HOME[1], HOME[0]], [c.lon, c.lat]] }), id: `arc${i}`, class: 'm-arc', pathLength: 1, style: `--i:${i}` }, gA);
      if (!reduced) {
        const dot = el('circle', { r: 1.8, class: 'm-runner' }, gA);
        const am = el('animateMotion', { dur: `${(2.6 + c.km / 9000).toFixed(2)}s`, begin: `${(i * 0.37).toFixed(2)}s`, repeatCount: 'indefinite', keyPoints: '0;1', keyTimes: '0;1', calcMode: 'linear' }, dot);
        const mp = document.createElementNS(NS, 'mpath'); mp.setAttribute('href', `#arc${i}`); am.appendChild(mp);
      }
      const [x, y] = proj([c.lon, c.lat]);
      const g = el('g', { class: 'm-city', transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`, tabindex: 0, role: 'button' }, gP);
      el('circle', { r: 14, class: 'm-hit' }, g);
      el('circle', { r: 3 + c.talks.length * 1.4, class: 'm-ring' }, g);
      el('circle', { r: 2.6, class: 'm-dot' }, g);
      const lab = el('text', { x: 9, y: 4, class: 'm-label' }, g); lab.textContent = c.name;
      if (x > 860) { lab.setAttribute('x', -9); lab.setAttribute('text-anchor', 'end'); }
      const go = () => { stopPlay(); select(c); };
      g.addEventListener('mouseenter', go); g.addEventListener('focus', go); g.addEventListener('click', go);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      return { c, g, arc };
    });
    const hg = el('g', { class: 'm-home', transform: `translate(${home[0].toFixed(1)},${home[1].toFixed(1)})` }, svg);
    el('circle', { r: 9, class: 'm-home-pulse' }, hg); el('circle', { r: 4.5, class: 'm-home-dot' }, hg);
    const hl = el('text', { x: 10, y: 4, class: 'm-label m-label-home' }, hg); hl.textContent = 'Santiago';
    mapReady = true; renderTalks(); select(selected);
    const sc = $('#atlasScroll'); if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (home[0] / 960) * sc.scrollWidth - sc.clientWidth * 0.35;
    const io = new IntersectionObserver(([e], o) => { if (e.isIntersecting) { svg.classList.add('drawn'); o.disconnect(); } }, { threshold: .25 });
    reduced ? svg.classList.add('drawn') : io.observe(svg);
  }

  // chronological tour
  let playTimer = null;
  const chrono = () => [...CITIES].sort((a, b) => Math.min(...a.talks.map(k => k.y)) - Math.min(...b.talks.map(k => k.y)));
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; $('#atlasPlay').classList.remove('playing'); } }
  $('#atlasPlay').addEventListener('click', () => {
    if (playTimer) return stopPlay();
    const seq = chrono(); let k = 0; select(seq[k]);
    $('#atlasPlay').classList.add('playing');
    playTimer = setInterval(() => { k++; if (k >= seq.length) return stopPlay(); select(seq[k]); }, reduced ? 2200 : 1500);
  });

  /* ---------- stage strip: horizontal drift on scroll ---------- */
  const stage = $('.stage'), track = $('#stageTrack');
  function drift() {
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const span = track.scrollWidth - innerWidth;
    if (span <= 0) return;
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    track.style.transform = `translate3d(${-p * span}px,0,0)`;
  }
  if (!stage) {} else if (reduced) { stage.style.overflowX = 'auto'; }
  else { addEventListener('scroll', drift, { passive: true }); addEventListener('resize', drift); }

  /* ---------- book tilt ---------- */
  const bookStage = $('#bookStage'), bookObj = $('#bookObj');
  if (bookStage && !reduced && matchMedia('(hover: hover)').matches) {
    bookStage.addEventListener('pointermove', e => {
      const r = bookStage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      bookObj.style.setProperty('--ry', `${(-24 + x * 30).toFixed(1)}deg`);
      bookObj.style.setProperty('--rx', `${(4 - y * 14).toFixed(1)}deg`);
    });
    bookStage.addEventListener('pointerleave', () => { bookObj.style.removeProperty('--ry'); bookObj.style.removeProperty('--rx'); });
  }

  /* ---------- plans gantt ---------- */
  if (!reduced) {
    const bars = $$('.g-bar'); bars.forEach(b => b.style.setProperty('--p', 0));
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      bars.forEach((b, i) => setTimeout(() => b.style.setProperty('--p', 1), 150 + i * 160));
    }, { threshold: 0.3 }).observe($('.gantt'));
  }

  /* ---------- track lanes (hero) ---------- */
  (() => {
    const svg = $('#lanes'); if (!svg) return;
    const W = 1200, H = 640, lane = 34, n = 8;
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = i * lane, y = i * lane, w = W - 2 * x, h = H - 2 * y;
      out += `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${(h - 2) / 2}" pathLength="1" style="--i:${i}"/>`;
    }
    const inner = n * lane;
    out += `<line class="lanes-start" x1="${W / 2}" y1="${H - inner}" x2="${W / 2}" y2="${H}" pathLength="1"/>`;
    svg.innerHTML = out;
    requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('drawn')));
  })();

  /* ---------- event archive ---------- */
  // [folder key, photo count, year, city, es, en]
  const EVENTS = [
    ['medellin', 6, 2026, 'Medellín, Colombia', 'II Congreso Internacional de Fútbol Femenino · conferencia magistral', 'II International Women’s Football Congress · keynote'],
    ['campinas', 6, 2026, 'Campinas, Brasil', 'Comitê Brasileiro de Clubes (CBC)', 'Brazilian Clubs Committee (CBC)'],
    ['uax', 2, 2026, 'Madrid, España', 'Grado de Gestión Deportiva, Universidad Alfonso X el Sabio', 'Sport Management degree, Universidad Alfonso X el Sabio'],
    ['qpe', 2, 2025, 'QPE Global', 'Conformación oficial de la red QPE Global', 'Official launch of the QPE Global network'],
    ['areaandina', 13, 2025, 'Bogotá, Colombia', 'Estancia académica, Fundación Universitaria Área Andina', 'Academic stay, Fundación Universitaria Área Andina'],
    ['monterrey', 7, 2024, 'Monterrey, México', 'XXXII Congreso de la Facultad de Organización Deportiva, UANL', '32nd Congress of the Faculty of Sport Organisation, UANL'],
    ['lima', 9, 2024, 'Lima, Perú', 'II Congreso Internacional de Ciencias del Deporte, Olimpismo y Movimiento Olímpico, UPC', '2nd International Congress of Sport Sciences, Olympism and the Olympic Movement, UPC'],
    ['uclm', 1, 2024, 'Toledo, España', 'Alianza con el grupo IGOID, Universidad de Castilla-La Mancha', 'Partnership with the IGOID group, University of Castilla-La Mancha'],
    ['leon', 2, 2023, 'León, México', 'Congreso Internacional del Deporte CODE 2023', 'CODE 2023 International Sport Congress'],
    ['india', 7, 2023, 'Thiruvananthapuram, India', '22nd Biennial Conference, International Society for Comparative Physical Education and Sport', '22nd Biennial Conference, International Society for Comparative Physical Education and Sport'],
    ['santodomingo', 3, 2023, 'Santo Domingo, República Dominicana', 'Congreso Latinoamericano de Gestión Deportiva, ALGEDE', 'Latin American Sport Management Congress, ALGEDE'],
    ['doha', 4, 2023, 'Doha, Qatar', '4th WASM Conference · elegido en el directorio de la WASM', '4th WASM Conference · elected to the WASM board'],
    ['bergen', 3, 2020, 'Bergen, Noruega', 'Investigación doctoral en SLATE, Universidad de Bergen', 'Doctoral research at SLATE, University of Bergen'],
    ['igeo', 1, 2019, 'Valparaíso, Chile', 'Lanzamiento de iGEO, primer grupo de investigación en gestión deportiva de Chile', 'Launch of iGEO, Chile’s first sport management research group'],
    ['ucam', 1, 2018, 'Murcia, España', 'Jornada de Innovación y Tecnología en eSports, UCAM', 'Esports Innovation and Technology Day, UCAM'],
    ['murcia2018', 1, 2018, 'Murcia, España', 'Conferencia «Esports: la evolución del deporte»', 'Talk “Esports: the evolution of sport”'],
  ];
  const evSrc = (f, i) => `assets/photos/events/${f}_${i}.jpg`;
  function renderArchive() {
    $('#archiveGrid').innerHTML = EVENTS.map(([f, n, y, city, es, en], i) => `
      <button type="button" class="ev" data-i="${i}" aria-label="${esc(city)}, ${y}: ${esc(t(es, en))}. ${n} ${n === 1 ? t('foto', 'photo') : t('fotos', 'photos')}">
        <img src="${evSrc(f, 0)}" alt="" loading="lazy">
        ${n > 1 ? `<span class="ev-count">${n}</span>` : ''}
        <span class="ev-cap"><b>${esc(city)} · ${y}</b><span>${esc(t(es, en))}</span></span>
      </button>`).join('');
    $$('.ev').forEach(b => b.addEventListener('click', () => openLb(+b.dataset.i, 0)));
  }
  const lb = $('#lightbox');
  let lbEv = 0, lbPh = 0;
  function showLb() {
    const [f, n, y, city, es, en] = EVENTS[lbEv];
    $('#lbImg').src = evSrc(f, lbPh); $('#lbImg').alt = `${city}, ${y} — ${lbPh + 1}/${n}`;
    $('#lbCap').innerHTML = `<b>${esc(city)} · ${y}</b> ${esc(t(es, en))}<span class="lb-count">${lbPh + 1} / ${n}</span>`;
    $('#lbThumbs').innerHTML = n > 1 ? Array.from({ length: n }, (_, k) => `<button type="button" class="${k === lbPh ? 'on' : ''}" data-k="${k}" aria-label="${t('Foto', 'Photo')} ${k + 1}"><img src="${evSrc(f, k)}" alt="" loading="lazy"></button>`).join('') : '';
    $$('#lbThumbs button').forEach(b => b.addEventListener('click', () => { lbPh = +b.dataset.k; showLb(); }));
    lb.classList.toggle('single', n === 1);
    const on = $('#lbThumbs .on'); on && on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function stepLb(d) { const n = EVENTS[lbEv][1]; lbPh = (lbPh + d + n) % n; showLb(); }
  function openLb(i, k) {
    lbEv = i; lbPh = k; showLb();
    lb.showModal ? lb.showModal() : lb.setAttribute('open', '');
  }
  $('#lbPrev').addEventListener('click', () => stepLb(-1));
  $('#lbNext').addEventListener('click', () => stepLb(1));
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') stepLb(-1); if (e.key === 'ArrowRight') stepLb(1); });
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) stepLb(dx < 0 ? 1 : -1); tx = null; });
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  /* ---------- reveal ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    const els = $$('.section-title, .impact-sentence, .line, .also, .tline, .contact-h, .contact-mail, .book-text, .book-stage, .statement blockquote, .archive, .career-grid');
    els.forEach(el => el.classList.add('reveal-pending'));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('reveal-in'); e.target.classList.remove('reveal-pending'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ---------- press ---------- */
  const PRESS = window.PRESS || [];
  const KINDS = { columna: ['Columna de opinión', 'Opinion column'], prensa: ['Entrevista / nota', 'Interview / feature'], unab: ['Noticias UNAB', 'UNAB news'], tv: ['Televisión', 'Television'], radio: ['Radio', 'Radio'], podcast: ['Podcast', 'Podcast'] };
  const pressState = { k: 'all', shown: 8 };
  function fmtDate(d) {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString(lang() === 'en' ? 'en-GB' : 'es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function renderPress() {
    let list = PRESS.filter(p => pressState.k === 'all' || p.k === pressState.k);
    // keep recency but avoid runs of the same outlet: never repeat a source within the last 3 cards when another is available
    const pool = [...list]; list = [];
    while (pool.length) {
      const recent = list.slice(-3).map(p => p.s);
      let i = pool.findIndex(p => !recent.includes(p.s));
      if (i < 0) i = 0;
      list.push(pool.splice(i, 1)[0]);
    }
    $('#pressGrid').innerHTML = list.slice(0, pressState.shown).map((p, pi) => `
      <li style="--i:${pi % 8}"><a class="press-row" data-k="${p.k}" href="${esc(p.u)}" target="_blank" rel="noopener">
        <time>${fmtDate(p.d)}</time>
        <span class="pr-src">${esc(p.s)}</span>
        <span class="pr-title">${esc(p.t)}</span>
        <span class="pr-kind">${t(...(KINDS[p.k] || KINDS.prensa))}</span>
      </a></li>`).join('');
    $('#pressMore').hidden = list.length <= pressState.shown;
    const outlets = [...new Set(PRESS.map(p => p.s))];
    $('#pressOutlets').innerHTML = outlets.map(o => `<span>${esc(o)}</span>`).join('');
  }
  $$('.press-chips .chip').forEach(c => c.addEventListener('click', () => {
    pressState.k = c.dataset.k; pressState.shown = 8;
    $$('.press-chips .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); renderPress();
  }));
  $('#pressMore').addEventListener('click', () => { pressState.shown += 8; renderPress(); });

  /* ---------- motion ---------- */
  const bar = $('#progressBar');
  function onScrollMotion() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
  }
  addEventListener('scroll', onScrollMotion, { passive: true }); onScrollMotion();
  if (!reduced) {
    // staggered lists
    const groups = ['.tl', '.rlines', '.also', '.archive-grid', '.gantt', '.book-facts', '.beyond-list', '.press-stats'];
    const stgIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); stgIO.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    const markStg = () => groups.forEach(sel => $$(sel).forEach(g => {
      if (g.classList.contains('in')) return;
      g.classList.add('stg'); [...g.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 14))); stgIO.observe(g);
    }));
    markStg(); langListeners.push(() => { $$('.archive-grid').forEach(g => { [...g.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 14))); }); });
    // chart + count-up
    const chart = $('.cites-chart');
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect(); chart.classList.add('on');
      $$('.impact [data-s]').forEach(el => {
        const k = el.dataset.s; if (!['citations', 'h', 'i10', 'floor'].includes(k)) return;
        const target = parseInt(el.textContent.replace(/\D/g, ''), 10); if (!target) return;
        const en = el.closest('[lang="en"]'), t0 = performance.now(), dur = 1600;
        (function step(now) {
          const p = Math.min(1, (now - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 4)));
          el.textContent = v.toLocaleString(en ? 'en-US' : 'es-CL');
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.35 }).observe(chart);
  } else { $('.cites-chart').classList.add('on'); }

  /* ---------- parallax & word-by-word titles ---------- */
  if (!reduced) {
    // parallax
    const par = [['.book-stage', .08], ['.hero-visual', -.06], ['.g-cover', .05], ['.portrait', -.04]];
    const parEls = par.flatMap(([sel, k]) => $$(sel).map(el => [el, k]));
    let ticking = false;
    function parallax() {
      ticking = false; const vh = innerHeight;
      parEls.forEach(([el, k]) => {
        const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
        el.style.setProperty('--py', `${((r.top + r.height / 2 - vh / 2) * k).toFixed(1)}px`);
      });
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
    // split section titles into words
    $$('.section-title [lang]').forEach(sp => {
      if (sp.dataset.split) return; sp.dataset.split = 1;
      sp.innerHTML = sp.textContent.split(/(\s+)/).map((w, i) => /\s+/.test(w) ? w : `<span class="w" style="--w:${i / 2}"><span>${w}</span></span>`).join('');
    });
  }

  /* ---------- small delights ---------- */
  if (!reduced) {
    const mail = $('.contact-mail');
    mail.innerHTML = [...mail.textContent].map((ch, i) => `<span style="--c:${i}">${ch}</span>`).join('');
    mail.setAttribute('aria-label', 'frano.giakoni@unab.cl');
    // clip-path image reveals
    const clipIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('shown'); clipIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    const markClips = () => $$('.g-cover img, .book-cover').forEach(el => { if (!el.classList.contains('clip')) { el.classList.add('clip'); clipIO.observe(el); } });
    markClips(); langListeners.push(markClips);
  }

  /* ---------- boot ---------- */
  langListeners.push(renderDeck, renderPubs, renderCounts, renderTalks, renderArchive, renderPress);
  renderChart();
  renderStats();
  setLang(initial, false);
  requestAnimationFrame(movePill);
  requestAnimationFrame(tick);
  gaze();
  drift();
  buildMap();
})();
