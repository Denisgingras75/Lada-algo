/* drift — content.js  (orchestrator)
 * Loaded after lexicons/profile/directions/adapters (they share this scope via
 * the FF namespace). Ties the engine to the live page.
 *
 * Honest mechanism, stated plainly: this does NOT reach YouTube's servers and
 * rewrite your recommendations. It does two real things — (1) reshapes what you
 * see right now (boost / dim / hide tiles), and (2), only if you switch it on,
 * sends the platform's own "Not interested" — the same signal you'd send by
 * hand. Everything is local; the profile never leaves your browser.
 */
(function () {
  'use strict';
  const FF = globalThis.FF;
  if (!FF || !FF.adapters) return;

  const adapter = FF.adapters.forHost(location.hostname);
  if (!adapter) return;

  const DEFAULTS = {
    enabled: true, direction: 'detox', intensity: 60,
    sendSignals: false, moreTerms: '', lessTerms: ''
  };
  let cfg = Object.assign({}, DEFAULTS);
  let profile = { usual: {}, focus: {}, scans: 0 };
  let session = { toward: 0, away: 0 };
  const signaled = new WeakSet();
  let signalBudget = 20;
  let signalQueue = [];
  let panel = null;

  // ---- styles for tile treatments (separate from the console panel) ----
  function injectTileCSS() {
    if (document.getElementById('ff-tile-css')) return;
    const s = document.createElement('style');
    s.id = 'ff-tile-css';
    s.textContent = `
      .ff-hide { display: none !important; }
      .ff-dim { opacity: .28 !important; filter: grayscale(85%) !important; transition: opacity .3s, filter .3s; }
      .ff-dim:hover { opacity: .85 !important; filter: none !important; }
      .ff-boost { position: relative; outline: 2px solid #F2A65A !important; outline-offset: 2px; border-radius: 10px; }
      .ff-boost[data-ff-tag="toward"]::after {
        content: "↑ toward"; position: absolute; top: 6px; left: 6px; z-index: 50;
        background: #F2A65A; color: #1a1205; font: 600 10px/1 ui-sans-serif,system-ui;
        padding: 4px 6px; border-radius: 5px; letter-spacing: .04em; }
    `;
    (document.head || document.documentElement).appendChild(s);
  }

  // ---- config / profile persistence ----
  function loadState() {
    return new Promise((res) => {
      chrome.storage.sync.get(DEFAULTS, (c) => {
        cfg = Object.assign({}, DEFAULTS, c);
        chrome.storage.local.get({ driftProfile: profile }, (l) => {
          profile = l.driftProfile || profile;
          res();
        });
      });
    });
  }
  let saveTimer = null;
  function saveProfileSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      profile.usual = FF.profile.prune(profile.usual, 400);
      profile.focus = FF.profile.prune(profile.focus, 120);
      chrome.storage.local.set({ driftProfile: profile });
    }, 1500);
  }

  function ctx() {
    return {
      direction: cfg.direction,
      intensity: (cfg.intensity || 0) / 100,
      usual: profile.usual,
      focus: profile.focus,
      moreTerms: termSet(cfg.moreTerms),
      lessTerms: termSet(cfg.lessTerms)
    };
  }
  function termSet(str) {
    const s = new Set();
    (str || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean).forEach(t => s.add(t));
    return s;
  }

  // ---- the scan: evaluate everything visible, apply per mode ----
  const MAX_TILES = 250;
  function scan() {
    if (!cfg.enabled) return;
    const items = adapter.getItems().slice(0, MAX_TILES);
    if (!items.length) return;

    const c = ctx();
    const mode = FF.directions.modeOf(cfg.direction);
    const feats = items.map(it => ({
      it,
      f: { tokens: FF.lex.tokenize(it.title, it.channel), arousal: FF.lex.arousal(it.title) }
    }));

    let decisions; // [{ it, action }]
    if (mode === 'absolute') {
      decisions = feats.map(({ it, f }) => ({ it, action: FF.directions.evaluate(f, c).action }));
    } else if (mode === 'relative') {
      const def = FF.directions.DIRECTIONS[cfg.direction];
      const scored = feats.map(({ it, f }, i) => ({ ref: i, rank: FF.directions.evaluate(f, c).rank }));
      const map = FF.directions.assignByQuantile(scored, def.boostPct, def.pushPct, c.intensity);
      decisions = feats.map(({ it }, i) => ({ it, action: map.get(i) || 'KEEP' }));
    } else { // cap (touch grass)
      const cap = Math.max(3, Math.round(12 - 9 * c.intensity));
      const scored = feats.map(({ it, f }, i) => {
        const r = FF.directions.evaluate(f, c);
        return { i, it, rank: r.rank, bait: r.d <= -0.20 };
      }).sort((a, b) => b.rank - a.rank);
      let shown = 0;
      const act = new Array(feats.length).fill('HIDE');
      for (const s of scored) {
        if (s.bait) { act[s.i] = 'HIDE'; continue; }
        if (shown < cap) { act[s.i] = 'KEEP'; shown++; } else act[s.i] = 'HIDE';
      }
      decisions = feats.map(({ it }, i) => ({ it, action: act[i] }));
    }

    // apply (only when changed), tally session, queue consent-gated signals
    session.toward = 0; session.away = 0;
    for (const { it, action } of decisions) {
      if (it.el.dataset.ffAction !== action) adapter.apply(it.el, action);
      if (action === 'BOOST') session.toward++;
      if (action === 'HIDE' || action === 'DIM') session.away++;
      if (action === 'HIDE' && cfg.sendSignals && adapter.supportsNegativeSignal && !signaled.has(it.el)) {
        signaled.add(it.el);
        if (signalBudget > 0) { signalQueue.push(it.el); signalBudget--; }
      }
    }
    profile.scans++;
    updatePanel();
  }

  // ---- consent-gated negative signals, drained slowly to look human ----
  setInterval(() => {
    if (!signalQueue.length) return;
    const el = signalQueue.shift();
    if (el && el.isConnected) { try { adapter.sendNegativeSignal(el); } catch (e) {} }
  }, 4000);

  // ---- learning: clicks + watch page ----
  function learnFrom(item, toFocusWeight, toUsualWeight) {
    if (!item || !item.title) return;
    const toks = FF.lex.tokenize(item.title, item.channel);
    if (toFocusWeight) { FF.profile.decay(profile.focus, 0.85); FF.profile.learn(profile.focus, toks, toFocusWeight); }
    if (toUsualWeight) FF.profile.learn(profile.usual, toks, toUsualWeight);
    if (profile.scans % 25 === 0) FF.profile.decay(profile.usual, 0.97);
    saveProfileSoon();
  }
  document.addEventListener('click', (e) => {
    const item = adapter.itemFromEvent(e.target);
    if (item) learnFrom(item, 2, 1); // engaging with something is a strong focus signal
  }, true);

  function learnWatch() {
    const w = adapter.watchContext && adapter.watchContext();
    if (w) learnFrom(w, 2.5, 1.2);
  }

  // ---- in-page console (the signature: a two-sided drift meter) ----
  function buildPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'ff-console';
    panel.innerHTML = `
      <style>
        #ff-console{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:248px;
          background:#0E1116;color:#E6EDF3;border:1px solid #232A33;border-radius:14px;
          font:13px/1.4 ui-sans-serif,system-ui,-apple-system;box-shadow:0 12px 40px rgba(0,0,0,.5);overflow:hidden}
        #ff-console *{box-sizing:border-box}
        .ffc-head{display:flex;align-items:center;gap:8px;padding:11px 13px;border-bottom:1px solid #1c232c}
        .ffc-dot{width:8px;height:8px;border-radius:50%;background:#3FB950;box-shadow:0 0 8px #3FB95088}
        .ffc-dot.off{background:#6E7681;box-shadow:none}
        .ffc-name{font-weight:700;letter-spacing:.12em;font-size:11px;text-transform:uppercase;color:#fff}
        .ffc-min{margin-left:auto;cursor:pointer;color:#8B949E;font-size:15px;line-height:1;background:none;border:0}
        .ffc-body{padding:12px 13px;display:flex;flex-direction:column;gap:11px}
        .ffc-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
        .ffc-lab{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8B949E}
        select,input[type=range]{accent-color:#F2A65A}
        #ff-dir{background:#161B22;color:#E6EDF3;border:1px solid #2D333B;border-radius:8px;padding:6px 8px;font:inherit;width:130px}
        #ff-int{width:120px}
        .ffc-blurb{font-size:11px;color:#8B949E;min-height:28px}
        .ffc-meter{height:10px;border-radius:6px;background:#161B22;display:flex;overflow:hidden;border:1px solid #21272f}
        .ffc-away{background:#5B8CFF}.ffc-toward{background:#F2A65A;margin-left:auto}
        .ffc-mlab{display:flex;justify-content:space-between;font-size:10px;color:#8B949E;margin-top:3px}
        .ffc-toggle{display:flex;align-items:center;gap:7px;font-size:11px;color:#C9D1D9;cursor:pointer}
        .ffc-foot{font-size:9.5px;color:#586069;border-top:1px solid #1c232c;padding:8px 13px;line-height:1.35}
        #ff-console.min .ffc-body,#ff-console.min .ffc-foot{display:none}
      </style>
      <div class="ffc-head">
        <span class="ffc-dot" id="ff-dot"></span><span class="ffc-name">drift</span>
        <button class="ffc-min" id="ff-min" title="collapse">–</button>
      </div>
      <div class="ffc-body">
        <div class="ffc-row"><span class="ffc-lab">Direction</span>
          <select id="ff-dir"></select></div>
        <div class="ffc-blurb" id="ff-blurb"></div>
        <div class="ffc-row"><span class="ffc-lab">Intensity</span>
          <input type="range" id="ff-int" min="10" max="100" step="5"></div>
        <div>
          <div class="ffc-meter"><span class="ffc-away" id="ff-away"></span><span class="ffc-toward" id="ff-toward"></span></div>
          <div class="ffc-mlab"><span id="ff-awayn">0 pushed away</span><span id="ff-towardn">0 pulled toward</span></div>
        </div>
        <label class="ffc-toggle"><input type="checkbox" id="ff-sig"> send real "not interested" signals</label>
        <label class="ffc-toggle"><input type="checkbox" id="ff-on"> drift active</label>
      </div>
      <div class="ffc-foot">Reshapes what's on screen now and (if enabled) sends the platform's own
        feedback. It can't rewrite the server. Your profile stays in this browser.</div>`;
    document.documentElement.appendChild(panel);

    const dir = panel.querySelector('#ff-dir');
    Object.values(FF.directions.DIRECTIONS).forEach(d => {
      const o = document.createElement('option'); o.value = d.id; o.textContent = d.label; dir.appendChild(o);
    });
    dir.value = cfg.direction;
    panel.querySelector('#ff-int').value = cfg.intensity;
    panel.querySelector('#ff-sig').checked = cfg.sendSignals;
    panel.querySelector('#ff-on').checked = cfg.enabled;

    dir.addEventListener('change', () => setCfg({ direction: dir.value, _repaint: true }));
    panel.querySelector('#ff-int').addEventListener('input', (e) => setCfg({ intensity: +e.target.value, _repaint: true }));
    panel.querySelector('#ff-sig').addEventListener('change', (e) => setCfg({ sendSignals: e.target.checked }));
    panel.querySelector('#ff-on').addEventListener('change', (e) => setCfg({ enabled: e.target.checked, _repaint: true }));
    panel.querySelector('#ff-min').addEventListener('click', () => panel.classList.toggle('min'));
    updatePanel();
  }

  function updatePanel() {
    if (!panel) return;
    const def = FF.directions.DIRECTIONS[cfg.direction];
    panel.querySelector('#ff-blurb').textContent = def ? def.blurb : '';
    panel.querySelector('#ff-dot').classList.toggle('off', !cfg.enabled);
    const total = Math.max(1, session.toward + session.away);
    panel.querySelector('#ff-away').style.width = (session.away / total * 100) + '%';
    panel.querySelector('#ff-toward').style.width = (session.toward / total * 100) + '%';
    panel.querySelector('#ff-awayn').textContent = session.away + ' pushed away';
    panel.querySelector('#ff-towardn').textContent = session.toward + ' pulled toward';
  }

  function setCfg(patch) {
    const repaint = patch._repaint; delete patch._repaint;
    cfg = Object.assign(cfg, patch);
    chrome.storage.sync.set(patch);
    if (repaint) { clearAll(); scan(); }
    updatePanel();
  }
  function clearAll() {
    adapter.getItems().forEach(it => adapter.clear(it.el));
  }

  // react to changes from the popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    let touched = false, repaint = false;
    for (const k of Object.keys(changes)) {
      if (k in cfg) { cfg[k] = changes[k].newValue; touched = true; if (k !== 'sendSignals') repaint = true; }
    }
    if (touched) {
      if (panel) {
        panel.querySelector('#ff-dir').value = cfg.direction;
        panel.querySelector('#ff-int').value = cfg.intensity;
        panel.querySelector('#ff-sig').checked = cfg.sendSignals;
        panel.querySelector('#ff-on').checked = cfg.enabled;
      }
      if (repaint) { clearAll(); scan(); }
      updatePanel();
    }
  });

  // ---- boot ----
  let rescan = null;
  function start() {
    injectTileCSS();
    buildPanel();
    learnWatch();
    scan();
    const obs = new MutationObserver(() => {
      clearTimeout(rescan);
      rescan = setTimeout(scan, 700);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    // YouTube is an SPA: watch-page changes don't reload. Re-learn on nav.
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) { lastPath = location.pathname; learnWatch(); }
    }, 1500);
  }

  loadState().then(() => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  });
})();
