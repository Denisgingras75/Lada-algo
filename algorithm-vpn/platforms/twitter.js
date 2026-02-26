// Algorithm VPN — X/Twitter Interception Layer
// DOM-based reranking using data-testid attributes (stable across redesigns).
// V1 uses DOM observation. V1.5 will upgrade to XHR interception (Stanford approach).

AlgorithmVPN.Twitter = {

  // ── DOM Selectors ────────────────────────────────────────────────────
  // X uses data-testid attributes that are relatively stable.

  SELECTORS: {
    // Timeline container
    timeline: '[data-testid="primaryColumn"] section > div > div',
    // Individual tweet wrapper
    tweetCell: '[data-testid="cellInnerDiv"]',
    // Tweet article
    tweet: 'article[data-testid="tweet"]',
    // Tweet text content
    tweetText: '[data-testid="tweetText"]',
    // User info
    userName: '[data-testid="User-Name"]',
    // Timestamp
    timeElement: 'time[datetime]',
    // Engagement metrics
    replyCount: '[data-testid="reply"]',
    retweetCount: '[data-testid="retweet"]',
    likeCount: '[data-testid="like"]'
  },

  // ── State ────────────────────────────────────────────────────────────

  observer: null,
  debounceTimer: null,
  currentPersona: null,
  userConfig: null,
  isRanking: false,
  lastRankTime: 0,
  DEBOUNCE_MS: 400,
  MIN_RANK_INTERVAL: 600,

  // ── Lifecycle ────────────────────────────────────────────────────────

  init(persona, userConfig) {
    this.currentPersona = persona;
    this.userConfig = userConfig;
    // Wait for timeline to load, then observe and rank
    this._waitForTimeline();
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

  _waitForTimeline() {
    const check = () => {
      const timeline = document.querySelector(this.SELECTORS.timeline);
      if (timeline) {
        this.observeFeed();
        this.rankFeed();
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  },

  // ── Feed Observation ─────────────────────────────────────────────────

  observeFeed() {
    const timeline = document.querySelector(this.SELECTORS.timeline);
    if (!timeline) return;

    this.observer = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.rankFeed(), this.DEBOUNCE_MS);
    });

    this.observer.observe(timeline, {
      childList: true,
      subtree: true
    });
  },

  // ── Feed Ranking ─────────────────────────────────────────────────────

  rankFeed() {
    if (this.isRanking || !this.currentPersona) return;

    const now = Date.now();
    if (now - this.lastRankTime < this.MIN_RANK_INTERVAL) return;

    this.isRanking = true;
    this.lastRankTime = now;

    requestAnimationFrame(() => {
      try {
        this._rankTimeline();
      } finally {
        this.isRanking = false;
      }
    });
  },

  _rankTimeline() {
    const timeline = document.querySelector(this.SELECTORS.timeline);
    if (!timeline) return;

    // Get all tweet cells (direct children of timeline)
    const cells = Array.from(timeline.querySelectorAll(`:scope > ${this.SELECTORS.tweetCell}`));
    if (cells.length < 2) return;

    // Separate tweet cells from non-tweet cells (promoted, "who to follow", etc.)
    const tweetCells = [];
    const nonTweetCells = [];

    for (const cell of cells) {
      const tweet = cell.querySelector(this.SELECTORS.tweet);
      if (tweet) {
        const data = this._extractTweetData(cell, tweet);
        const score = AlgorithmVPN.scorePost(
          data.text, data.metadata, this.currentPersona, this.userConfig
        );
        tweetCells.push({ element: cell, score, data });
      } else {
        // Non-tweet content (ads, suggestions, etc.) — keep in place
        nonTweetCells.push(cell);
      }
    }

    if (tweetCells.length < 2) return;

    // Sort tweets by score (highest first)
    tweetCells.sort((a, b) => b.score - a.score);

    // Pause observer
    if (this.observer) this.observer.disconnect();

    // Force the timeline container to use flex layout for ordering
    timeline.style.display = 'flex';
    timeline.style.flexDirection = 'column';

    // Apply CSS order to rerank without removing elements from DOM
    // This avoids breaking X's virtual scroll and event handlers
    let order = 0;
    const allCellsMap = new Map();

    // Non-tweet cells keep their relative position at the top
    for (const cell of nonTweetCells) {
      cell.style.order = String(order++);
      allCellsMap.set(cell, order);
    }

    // Tweet cells get ordered by score
    for (const { element } of tweetCells) {
      element.style.order = String(order++);
      allCellsMap.set(element, order);
    }

    // Resume observer
    const timelineEl = document.querySelector(this.SELECTORS.timeline);
    if (timelineEl && this.observer) {
      this.observer.observe(timelineEl, {
        childList: true,
        subtree: true
      });
    } else {
      // Re-init observer if timeline reference changed
      this.observeFeed();
    }
  },

  // ── Data Extraction ──────────────────────────────────────────────────

  _extractTweetData(cell, tweet) {
    // Tweet text
    const textEl = tweet.querySelector(this.SELECTORS.tweetText);
    const tweetText = textEl ? textEl.textContent.trim() : '';

    // User name
    const userEl = tweet.querySelector(this.SELECTORS.userName);
    const userName = userEl ? userEl.textContent.trim() : '';

    // Timestamp
    const timeEl = tweet.querySelector(this.SELECTORS.timeElement);
    let timestamp = 0;
    if (timeEl) {
      const dt = timeEl.getAttribute('datetime');
      if (dt) {
        timestamp = new Date(dt).getTime();
      }
    }

    // Engagement counts (for Discovery persona)
    const likeCount = this._parseEngagement(
      tweet.querySelector(this.SELECTORS.likeCount)
    );
    const retweetCount = this._parseEngagement(
      tweet.querySelector(this.SELECTORS.retweetCount)
    );

    return {
      text: `${userName} ${tweetText}`,
      metadata: {
        title: tweetText,
        channel: userName,
        timestamp,
        viewCount: likeCount + retweetCount, // Proxy for "popularity"
        likeCount,
        retweetCount
      }
    };
  },

  _parseEngagement(element) {
    if (!element) return 0;
    const text = element.getAttribute('aria-label') || element.textContent || '';
    const match = text.match(/([\d,.]+)\s*([KMB]?)/i);
    if (!match) return 0;

    const n = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(n)) return 0;

    switch ((match[2] || '').toUpperCase()) {
      case 'K': return n * 1_000;
      case 'M': return n * 1_000_000;
      case 'B': return n * 1_000_000_000;
      default: return n;
    }
  },

  // ── Platform Detection ───────────────────────────────────────────────

  isActive() {
    const host = window.location.hostname;
    return host.includes('twitter.com') || host.includes('x.com');
  }
};
