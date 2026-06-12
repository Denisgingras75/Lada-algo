/* drift — popup.js */
(function () {
  'use strict';
  const FF = window.FF;
  const DEFAULTS = { enabled: true, direction: 'detox', intensity: 60, sendSignals: false, moreTerms: '', lessTerms: '' };
  let cfg = Object.assign({}, DEFAULTS);
  let profile = { usual: {}, focus: {} };

  const $ = (id) => document.getElementById(id);

  function set(patch) {
    cfg = Object.assign(cfg, patch);
    chrome.storage.sync.set(patch);
    render();
  }

  function renderDirs() {
    const wrap = $('dirs'); wrap.innerHTML = '';
    Object.values(FF.directions.DIRECTIONS).forEach((d) => {
      const el = document.createElement('div');
      el.className = 'dir' + (cfg.direction === d.id ? ' sel' : '');
      el.innerHTML = `<div class="t">${d.label}</div><div class="b">${d.blurb}</div>`;
      el.addEventListener('click', () => set({ direction: d.id }));
      wrap.appendChild(el);
    });
  }

  function render() {
    $('dot').classList.toggle('off', !cfg.enabled);
    $('enabled').checked = cfg.enabled;
    $('intensity').value = cfg.intensity;
    $('intval').textContent = cfg.intensity;
    $('sendSignals').checked = cfg.sendSignals;
    $('moreTerms').value = cfg.moreTerms || '';
    $('lessTerms').value = cfg.lessTerms || '';
    $('customFields').classList.toggle('show', cfg.direction === 'custom');
    renderDirs();
    inspect();
  }

  function ctx() {
    return {
      direction: cfg.direction,
      intensity: (cfg.intensity || 0) / 100,
      usual: profile.usual || {},
      focus: profile.focus || {},
      moreTerms: new Set((cfg.moreTerms || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean)),
      lessTerms: new Set((cfg.lessTerms || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean))
    };
  }

  function inspect() {
    const v = $('inspInput').value.trim();
    const out = $('inspOut');
    if (!v) { out.classList.remove('show'); return; }
    out.classList.add('show');
    const f = { tokens: FF.lex.tokenize(v, ''), arousal: FF.lex.arousal(v) };
    const c = ctx();
    const r = FF.directions.evaluate(f, c);
    const mode = FF.directions.modeOf(cfg.direction);

    // relative/cap directions can't decide a single item in isolation — say so honestly.
    let action = r.action;
    if (action === 'DEFER') action = mode === 'relative'
      ? '(ranked vs feed)' : '(capped vs feed)';

    const pill = $('inspPill');
    pill.className = 'pill ' + (['BOOST', 'KEEP', 'DIM', 'HIDE'].includes(action) ? action : 'KEEP');
    pill.textContent = action;

    $('inspArous').textContent = (r.signals.arous).toFixed(2);
    $('inspFam').textContent = (r.signals.fam).toFixed(2);

    const extraRow = $('inspExtraRow');
    if (cfg.direction === 'rabbithole') { extraRow.style.display = ''; $('inspExtraLab').textContent = 'match to current focus'; $('inspExtra').textContent = r.signals.focus.toFixed(2); }
    else if (cfg.direction === 'custom') { extraRow.style.display = ''; $('inspExtraLab').textContent = 'wanted − unwanted'; $('inspExtra').textContent = (r.signals.more - r.signals.less).toFixed(2); }
    else extraRow.style.display = 'none';

    $('inspToks').textContent = f.tokens.length ? 'tokens: ' + f.tokens.join(' · ') : 'no salient tokens';
  }

  // wire static controls
  $('enabled').addEventListener('change', (e) => set({ enabled: e.target.checked }));
  $('sendSignals').addEventListener('change', (e) => set({ sendSignals: e.target.checked }));
  $('intensity').addEventListener('input', (e) => set({ intensity: +e.target.value }));
  $('moreTerms').addEventListener('input', (e) => set({ moreTerms: e.target.value }));
  $('lessTerms').addEventListener('input', (e) => set({ lessTerms: e.target.value }));
  $('inspInput').addEventListener('input', inspect);

  // boot
  chrome.storage.sync.get(DEFAULTS, (c) => {
    cfg = Object.assign({}, DEFAULTS, c);
    chrome.storage.local.get({ driftProfile: profile }, (l) => {
      profile = l.driftProfile || profile;
      render();
    });
  });
})();
