/* drift — adapters.js
 * Per-platform DOM knowledge behind one interface. The orchestrator is
 * platform-agnostic; everything site-specific lives here.
 *
 * A SiteAdapter implements:
 *   name                       string
 *   supportsNegativeSignal     bool   (can we send the platform's own "not interested"?)
 *   getItems()                 -> [{ el, title, channel }]   (feed tiles on screen)
 *   apply(el, action)          paint BOOST | KEEP | DIM | HIDE
 *   clear(el)                  remove drift treatment
 *   sendNegativeSignal(el)     fire the platform's native negative feedback
 *   itemFromEvent(target)      -> { title, channel } | null  (for learning on click)
 *   watchContext()             -> { title } | null           (watch-page focus learning)
 *
 * Honesty note: only YouTube is fully wired. Twitter/X is best-effort — its DOM
 * is obfuscated and changes often, and its negative-signal path is marked
 * experimental. We do NOT claim platforms we haven't implemented.
 */
(function (root) {
  'use strict';

  const CLASS = { hide: 'ff-hide', dim: 'ff-dim', boost: 'ff-boost' };

  function paint(el, action) {
    el.classList.remove(CLASS.hide, CLASS.dim, CLASS.boost);
    el.removeAttribute('data-ff-tag');
    if (action === 'HIDE') el.classList.add(CLASS.hide);
    else if (action === 'DIM') el.classList.add(CLASS.dim);
    else if (action === 'BOOST') { el.classList.add(CLASS.boost); el.setAttribute('data-ff-tag', 'toward'); }
    el.dataset.ffAction = action;
  }
  function clearPaint(el) {
    el.classList.remove(CLASS.hide, CLASS.dim, CLASS.boost);
    el.removeAttribute('data-ff-tag');
    delete el.dataset.ffAction;
  }

  // ---------------------------------------------------------------- YouTube
  const YouTube = {
    name: 'youtube',
    supportsNegativeSignal: true,
    TILE: 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer',

    getItems() {
      const tiles = document.querySelectorAll(this.TILE);
      const out = [];
      tiles.forEach((el) => {
        const titleEl = el.querySelector('#video-title, a#video-title-link yt-formatted-string');
        if (!titleEl) return;
        const title = (titleEl.textContent || titleEl.getAttribute('title') || '').trim();
        if (!title) return;
        const chEl = el.querySelector('#channel-name a, #text.ytd-channel-name a, ytd-channel-name #text a, ytd-channel-name #text');
        const channel = chEl ? chEl.textContent.trim() : '';
        out.push({ el, title, channel });
      });
      return out;
    },

    apply(el, action) { paint(el, action); },
    clear(el) { clearPaint(el); },

    sendNegativeSignal(el) {
      const menuBtn = el.querySelector('button[aria-label="Action menu"], ytd-menu-renderer button, button#button[aria-label*="menu" i]');
      if (!menuBtn) return false;
      try {
        menuBtn.click();
        setTimeout(() => {
          const items = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item');
          for (const it of items) {
            const t = (it.textContent || '').toLowerCase();
            if (t.includes('not interested') || t.includes("don't recommend")) { it.click(); break; }
          }
          // close any leftover menu
          document.body.click();
        }, 250);
        return true;
      } catch (e) { return false; }
    },

    itemFromEvent(target) {
      const tile = target.closest && target.closest(this.TILE);
      if (!tile) return null;
      const titleEl = tile.querySelector('#video-title');
      if (!titleEl) return null;
      const chEl = tile.querySelector('#channel-name a, #text.ytd-channel-name a');
      return { title: titleEl.textContent.trim(), channel: chEl ? chEl.textContent.trim() : '' };
    },

    watchContext() {
      if (!location.pathname.startsWith('/watch')) return null;
      const h1 = document.querySelector('h1.ytd-watch-metadata #video-title, h1.title yt-formatted-string, h1.ytd-watch-metadata');
      const title = h1 ? h1.textContent.trim() : document.title.replace(/ - YouTube$/, '');
      const ch = document.querySelector('ytd-channel-name#channel-name a, #owner #channel-name a');
      return title ? { title, channel: ch ? ch.textContent.trim() : '' } : null;
    }
  };

  // -------------------------------------------------------------- Twitter/X
  // Best-effort. DOM is obfuscated; selectors are the stable testids that have
  // held up, but treat as experimental.
  const Twitter = {
    name: 'twitter',
    supportsNegativeSignal: false, // path is fragile; left off rather than fake it
    TILE: 'article[data-testid="tweet"]',

    getItems() {
      const tiles = document.querySelectorAll(this.TILE);
      const out = [];
      tiles.forEach((el) => {
        const textEl = el.querySelector('[data-testid="tweetText"]');
        const title = textEl ? textEl.textContent.trim() : '';
        if (!title) return;
        const userEl = el.querySelector('[data-testid="User-Name"]');
        const channel = userEl ? userEl.textContent.trim() : '';
        out.push({ el, title, channel });
      });
      return out;
    },
    apply(el, action) { paint(el, action); },
    clear(el) { clearPaint(el); },
    sendNegativeSignal() { return false; },
    itemFromEvent(target) {
      const tile = target.closest && target.closest(this.TILE);
      if (!tile) return null;
      const textEl = tile.querySelector('[data-testid="tweetText"]');
      if (!textEl) return null;
      const userEl = tile.querySelector('[data-testid="User-Name"]');
      return { title: textEl.textContent.trim(), channel: userEl ? userEl.textContent.trim() : '' };
    },
    watchContext() { return null; }
  };

  function forHost(hostname) {
    if (hostname.includes('youtube.com')) return YouTube;
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return Twitter;
    return null;
  }

  root.FF = root.FF || {};
  root.FF.adapters = { forHost, YouTube, Twitter, CLASS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
