// Focus Feed Mobile - runs on every supported page, but only acts in tabs the
// background opened for training. Everything else is left alone.
(function () {
  'use strict';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  chrome.runtime.sendMessage({ action: 'whoami' }, (task) => {
    if (chrome.runtime.lastError || !task || !task.train) return;
    run(task).catch(() => done({}));
  });

  function done(result) {
    chrome.runtime.sendMessage({ action: 'taskDone', result });
  }

  async function waitFor(fn, timeoutMs) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const v = fn();
      if (v) return v;
      await sleep(500);
    }
    return null;
  }

  async function run(task) {
    if (task.kind === 'yt-search') return ytSearch();
    if (task.kind === 'yt-watch') return ytWatch(task);
    return dwell(task);
  }

  // Collect the top regular videos (not Shorts) from a mobile YouTube search.
  async function ytSearch() {
    const links = await waitFor(() => {
      const hrefs = [...document.querySelectorAll('a[href*="/watch?v="]')]
        .map(a => a.getAttribute('href'))
        .filter(h => h && !h.includes('&list='));
      const unique = [...new Set(hrefs.map(h => h.split('&')[0]))];
      return unique.length ? unique : null;
    }, 15000);
    await sleep(2000);
    done({ found: links || [] });
  }

  async function ytWatch(task) {
    const video = await waitFor(() => document.querySelector('video'), 15000);
    if (video) {
      video.muted = true;
      video.play().catch(() => {
        const btn = document.querySelector('.ytp-large-play-button, button.ytp-play-button, .player-controls-middle button');
        if (btn) btn.click();
      });
    }
    // Watch time is the strongest signal YouTube has, so stay for a while.
    const watchMs = Math.max(10, task.watchSeconds) * 1000;
    await sleep(Math.min(watchMs, 20000));
    let liked = false;
    if (task.autoLike) liked = clickLike();
    await sleep(Math.max(0, watchMs - 20000));
    done({ liked });
  }

  function clickLike() {
    const candidates = document.querySelectorAll([
      'like-button-view-model button',
      'ytm-like-button-renderer button',
      'segmented-like-dislike-button-view-model button',
      'ytm-segmented-like-dislike-button-renderer button',
      'button[aria-label*="like this video" i]'
    ].join(','));
    for (const b of candidates) {
      const label = (b.getAttribute('aria-label') || '').toLowerCase();
      if (label.includes('dislike')) continue;
      if (b.getAttribute('aria-pressed') === 'true') return false;
      b.click();
      return true;
    }
    return false;
  }

  // Everything else: stay on the page and scroll like a person reading.
  async function dwell(task) {
    const total = Math.max(4, task.dwellSeconds) * 1000;
    const steps = 4;
    for (let i = 0; i < steps; i++) {
      await sleep(total / steps);
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
    done({});
  }
})();
