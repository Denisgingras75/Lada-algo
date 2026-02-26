// Algorithm VPN — YouTube Interception Layer
// MutationObserver-based DOM reranking for YouTube homepage and sidebar.

AlgorithmVPN.YouTube = {

  // ── DOM Selectors ────────────────────────────────────────────────────
  // YouTube uses Polymer/Lit custom elements. These names are stable.

  SELECTORS: {
    // Homepage grid
    gridContainer: 'ytd-rich-grid-renderer #contents',
    gridItem: 'ytd-rich-item-renderer',
    // Video info
    videoTitle: '#video-title',
    channelName: '#channel-name a, ytd-channel-name a, ytd-channel-name #text',
    metadataLine: '#metadata-line span',
    // Sidebar recommendations (watch page)
    sidebarContainer: '#secondary #items, #related #items, ytd-watch-next-secondary-results-renderer #items',
    sidebarItem: 'ytd-compact-video-renderer',
    // Search results
    searchContainer: 'ytd-section-list-renderer #contents',
    searchItem: 'ytd-video-renderer'
  },

  // ── State ────────────────────────────────────────────────────────────

  observer: null,
  debounceTimer: null,
  currentPersona: null,
  userConfig: null,
  isRanking: false,
  lastRankTime: 0,
  DEBOUNCE_MS: 300,
  MIN_RANK_INTERVAL: 500,

  // ── Lifecycle ────────────────────────────────────────────────────────

  init(persona, userConfig) {
    this.currentPersona = persona;
    this.userConfig = userConfig;
    this.observeFeed();
    this.rankFeed();

    // YouTube is a SPA — listen for navigation events
    document.addEventListener('yt-navigate-finish', () => {
      this.rankFeed();
    });
  },

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  },

  updatePersona(persona, userConfig) {
    this.currentPersona = persona;
    this.userConfig = userConfig;
    this.rankFeed();
  },

  // ── Feed Observation ─────────────────────────────────────────────────

  observeFeed() {
    this.observer = new MutationObserver(() => {
      // Debounce: wait for YouTube to finish loading a batch of items
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.rankFeed(), this.DEBOUNCE_MS);
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  // ── Feed Ranking ─────────────────────────────────────────────────────

  rankFeed() {
    if (this.isRanking || !this.currentPersona) return;

    // Throttle: don't rerank more often than MIN_RANK_INTERVAL
    const now = Date.now();
    if (now - this.lastRankTime < this.MIN_RANK_INTERVAL) return;

    this.isRanking = true;
    this.lastRankTime = now;

    requestAnimationFrame(() => {
      try {
        this._rankHomepage();
        this._rankSidebar();
      } finally {
        this.isRanking = false;
      }
    });
  },

  _rankHomepage() {
    const container = document.querySelector(this.SELECTORS.gridContainer);
    if (!container) return;
    this._rankContainer(container, this.SELECTORS.gridItem);
  },

  _rankSidebar() {
    // Try multiple sidebar selectors (YouTube changes these)
    const selectors = this.SELECTORS.sidebarContainer.split(', ');
    for (const sel of selectors) {
      const container = document.querySelector(sel);
      if (container) {
        this._rankContainer(container, this.SELECTORS.sidebarItem);
        break;
      }
    }
  },

  _rankContainer(container, itemSelector) {
    const items = Array.from(container.querySelectorAll(`:scope > ${itemSelector}`));
    if (items.length < 2) return;

    // Score each item
    const scored = [];
    for (const element of items) {
      const data = this._extractItemData(element);
      if (!data.text.trim()) continue; // Skip items that haven't loaded yet

      const score = AlgorithmVPN.scorePost(
        data.text, data.metadata, this.currentPersona, this.userConfig
      );
      scored.push({ element, score });
    }

    if (scored.length < 2) return;

    // Sort: highest score first
    scored.sort((a, b) => b.score - a.score);

    // Pause the observer while we reorder to avoid infinite loops
    if (this.observer) this.observer.disconnect();

    // Reorder DOM elements
    for (const { element } of scored) {
      container.appendChild(element);
    }

    // Resume observer
    if (this.observer) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  },

  // ── Data Extraction ──────────────────────────────────────────────────

  _extractItemData(item) {
    const titleEl = item.querySelector(this.SELECTORS.videoTitle);
    const channelEl = item.querySelector(this.SELECTORS.channelName);
    const metaEls = item.querySelectorAll(this.SELECTORS.metadataLine);

    const title = titleEl ? titleEl.textContent.trim() : '';
    const channel = channelEl ? channelEl.textContent.trim() : '';

    let viewCount = 0;
    let timeText = '';

    for (const el of metaEls) {
      const text = el.textContent.trim();
      const viewMatch = text.match(/([\d,.]+)\s*([KMB]?)\s*views?/i);
      if (viewMatch) {
        viewCount = this._parseCount(viewMatch[1], viewMatch[2]);
      }
      if (text.match(/\d+\s*(second|minute|hour|day|week|month|year)s?\s*ago/i)) {
        timeText = text;
      }
      // Also handle "Streamed X ago" format
      if (text.match(/streamed\s+\d+/i)) {
        timeText = text;
      }
    }

    return {
      text: `${title} ${channel}`,
      metadata: {
        title,
        channel,
        viewCount,
        timestamp: this._parseTimeAgo(timeText)
      }
    };
  },

  _parseCount(numStr, suffix) {
    const n = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(n)) return 0;
    switch ((suffix || '').toUpperCase()) {
      case 'K': return n * 1_000;
      case 'M': return n * 1_000_000;
      case 'B': return n * 1_000_000_000;
      default: return n;
    }
  },

  _parseTimeAgo(text) {
    if (!text) return 0;
    const match = text.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i);
    if (!match) return 0;

    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const now = Date.now();
    const msPerUnit = {
      second: 1_000,
      minute: 60_000,
      hour: 3_600_000,
      day: 86_400_000,
      week: 604_800_000,
      month: 2_592_000_000,
      year: 31_536_000_000
    };

    return now - (num * (msPerUnit[unit] || 0));
  },

  // ── Platform Detection ───────────────────────────────────────────────

  isActive() {
    return window.location.hostname.includes('youtube.com');
  }
};
