(() => {
  const GH_USER = 'Hwang9170';
  const root = document.documentElement;
  root.classList.add('js');

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ── Theme ── */
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  $('#themeBtn').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('theme', next);
  });

  $('#year').textContent = new Date().getFullYear();

  /* ── Selected Work ── */
  const projects = window.PROJECTS || [];
  const grid = $('#workGrid');
  const filters = $('#workFilters');

  grid.innerHTML = projects.map((p, i) => {
    const code = `https://github.com/${GH_USER}/${p.repo}`;
    const href = p.demo || code;
    return `
      <article class="card${p.featured ? ' card--featured' : ''} reveal" data-cat="${esc(p.category)}">
        <a class="card__cover" href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(p.title)} 열기"></a>
        <a class="card__code" href="${esc(code)}" target="_blank" rel="noopener">Code ↗</a>
        <div class="card__meta"><span>${String(i + 1).padStart(2, '0')} · ${esc(p.category)}</span></div>
        <h3 class="card__title">${esc(p.title)}</h3>
        <p class="card__desc">${esc(p.desc)}</p>
        <div class="card__foot">
          <div class="tags">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">${p.year}</span></div>
          <span class="card__arrow" aria-hidden="true">→</span>
        </div>
      </article>`;
  }).join('');

  const cats = ['All', ...new Set(projects.map(p => p.category))];
  const count = c => c === 'All' ? projects.length : projects.filter(p => p.category === c).length;
  filters.innerHTML = cats.map((c, i) =>
    `<button role="tab" aria-selected="${i === 0}" data-cat="${esc(c)}">${esc(c)}<sup>${count(c)}</sup></button>`
  ).join('');
  filters.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b === btn));
    const cat = btn.dataset.cat;
    grid.querySelectorAll('.card').forEach(card => {
      card.classList.toggle('is-hidden', cat !== 'All' && card.dataset.cat !== cat);
    });
  });

  /* ── Archive (live from GitHub) ── */
  const LANG_COLORS = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', HTML: '#e34c26', CSS: '#663399',
    Python: '#3572A5', 'Jupyter Notebook': '#DA5B0B', PHP: '#4F5D95', Dart: '#00B4AB',
  };
  const list = $('#archiveList');
  const search = $('#archiveSearch');
  const liveOnly = $('#liveOnly');
  const PAGE = 15;
  let repos = [];
  let shown = PAGE;

  const renderArchive = () => {
    const q = search.value.trim().toLowerCase();
    const rows = repos.filter(r =>
      (!liveOnly.checked || r.homepage) &&
      (!q || `${r.name} ${r.description || ''} ${r.language || ''}`.toLowerCase().includes(q))
    );
    if (!rows.length) {
      list.innerHTML = `<li class="archive__empty">조건에 맞는 저장소가 없어요.</li>`;
      return;
    }
    list.innerHTML = rows.slice(0, shown).map(r => `
      <li>
        <a class="archive__row" href="${esc(r.homepage || r.html_url)}" target="_blank" rel="noopener">
          <span class="archive__year">${r.pushed_at.slice(0, 4)}</span>
          <span class="archive__name">${esc(r.name)}</span>
          <span class="archive__desc">${esc(r.description || '')}</span>
          <span class="archive__lang">${r.language ? `<i style="background:${LANG_COLORS[r.language] || 'var(--muted)'}"></i>${esc(r.language)}` : ''}</span>
          <span class="archive__live">${r.homepage ? 'LIVE ↗' : ''}</span>
        </a>
      </li>`).join('') + (rows.length > shown
        ? `<li style="border:0"><button class="btn archive__more" id="moreBtn">더 보기 (${rows.length - shown})</button></li>`
        : '');
  };

  list.addEventListener('click', e => {
    if (e.target.id === 'moreBtn') { shown += PAGE; renderArchive(); }
  });
  search.addEventListener('input', () => { shown = PAGE; renderArchive(); });
  liveOnly.addEventListener('change', () => { shown = PAGE; renderArchive(); });

  const loadRepos = async () => {
    const CACHE_KEY = 'gh-repos-v1';
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (cached) return cached;
    } catch (e) {}
    const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`);
    if (!res.ok) throw new Error(res.status);
    const data = (await res.json())
      .filter(r => !r.fork && r.name !== `${GH_USER}`)
      .map(({ name, description, language, homepage, html_url, pushed_at }) =>
        ({ name, description, language, homepage, html_url, pushed_at }));
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  };

  loadRepos().then(data => {
    repos = data;
    const live = data.filter(r => r.homepage).length;
    $('[data-stat="repos"]').textContent = data.length;
    $('[data-stat="live"]').textContent = live;
    renderArchive();
  }).catch(() => {
    list.innerHTML = `<li class="archive__empty">GitHub에서 목록을 불러오지 못했어요. <a href="https://github.com/${GH_USER}?tab=repositories" target="_blank" rel="noopener">GitHub에서 직접 보기 ↗</a></li>`;
  });

  /* ── Reveal on scroll ── */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  document.querySelectorAll('.reveal').forEach((el, i) => {
    if (!io) return el.classList.add('is-in');
    el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
    io.observe(el);
  });

  /* ── Active nav link ── */
  const links = [...document.querySelectorAll('.nav__links a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section[id]').forEach(s => spy.observe(s));
})();
