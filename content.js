(function() {
  'use strict';

  let focusEnabled = true;
  let selectedPersona = 'polymath';
  let observer = null;
  let injectedElements = new Set();
  const hostname = window.location.hostname;

  chrome.storage.sync.get(['focusEnabled', 'selectedPersona'], (result) => {
    focusEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
    selectedPersona = result.selectedPersona || 'polymath';
    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) {
      focusEnabled = changes.focusEnabled.newValue;
    }
    if (changes.selectedPersona) {
      selectedPersona = changes.selectedPersona.newValue;
    }
    cleanup();
    init();
  });

  function init() {
    if (observer) observer.disconnect();

    if (!focusEnabled) {
      cleanup();
      return;
    }

    if (hostname.includes('youtube.com')) {
      handleYouTube();
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      handleTwitter();
    } else if (hostname.includes('facebook.com')) {
      handleFacebook();
    } else if (hostname.includes('instagram.com')) {
      handleInstagram();
    } else if (hostname.includes('tiktok.com')) {
      handleTikTok();
    }

    replaceAllAds();
    observePageChanges();
  }

  function cleanup() {
    injectedElements.forEach(el => {
      if (el && el.parentNode) el.remove();
    });
    injectedElements.clear();
  }

  // MODULE A: YOUTUBE - Inject videos at TOP of feed
  function handleYouTube() {
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/feed')) return;

    const selectors = [
      'ytd-browse[page-subtype="home"] #contents',
      'ytd-rich-grid-renderer #contents',
      'ytd-two-column-browse-results-renderer #primary'
    ];

    let feedContainer = null;
    for (const selector of selectors) {
      feedContainer = document.querySelector(selector);
      if (feedContainer) break;
    }

    if (!feedContainer || document.getElementById('focus-youtube-inject')) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const container = document.createElement('div');
    container.id = 'focus-youtube-inject';
    container.className = 'focus-inject focus-youtube';

    const header = document.createElement('div');
    header.className = 'focus-header';
    header.innerHTML = `
      <div class="focus-badge">⚡ Focus Feed</div>
      <h2>${preset.name} - Curated for Growth</h2>
    `;

    const grid = document.createElement('div');
    grid.className = 'focus-grid youtube-grid';

    preset.videos.slice(0, 6).forEach(video => {
      const card = document.createElement('a');
      card.className = 'focus-video-card';
      card.href = video.link;
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = `
        <div class="focus-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
          <div class="focus-duration">${video.duration || '12:34'}</div>
        </div>
        <div class="focus-video-info">
          <h3 class="focus-video-title">${video.title}</h3>
          <p class="focus-video-channel">${video.channel}</p>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(grid);

    feedContainer.insertBefore(container, feedContainer.firstChild);
    injectedElements.add(container);
  }

  // MODULE B: TWITTER/X - Inject educational tweets at TOP
  function handleTwitter() {
    const selectors = [
      '[data-testid="primaryColumn"]',
      '[aria-label="Timeline: Your Home Timeline"]',
      'main[role="main"]'
    ];

    let timeline = null;
    for (const selector of selectors) {
      timeline = document.querySelector(selector);
      if (timeline) break;
    }

    if (!timeline || document.getElementById('focus-twitter-inject')) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const container = document.createElement('div');
    container.id = 'focus-twitter-inject';
    container.className = 'focus-inject focus-twitter';

    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    container.innerHTML = `
      <div class="focus-twitter-header">
        <span class="focus-badge">⚡ Focus Feed</span>
        <h2>${preset.name} Daily Brief</h2>
        <span class="focus-date">${today}</span>
      </div>
      <div class="focus-twitter-content">
        ${preset.headlines.slice(0, 4).map(h => `
          <a href="${h.link}" class="focus-tweet-card" target="_blank" rel="noopener">
            <div class="focus-tweet-header">
              <div class="focus-tweet-avatar">${preset.name[0]}</div>
              <div class="focus-tweet-meta">
                <span class="focus-tweet-name">${h.source}</span>
                <span class="focus-tweet-time">Recommended</span>
              </div>
            </div>
            <div class="focus-tweet-body">${h.title}</div>
          </a>
        `).join('')}
      </div>
    `;

    timeline.insertBefore(container, timeline.firstChild);
    injectedElements.add(container);
  }

  // MODULE C: FACEBOOK - Inject posts at TOP of feed
  function handleFacebook() {
    const selectors = [
      'div[role="feed"]',
      'div[role="main"]',
      'div[data-pagelet="MainFeed"]'
    ];

    let feed = null;
    for (const selector of selectors) {
      feed = document.querySelector(selector);
      if (feed) break;
    }

    if (!feed || document.getElementById('focus-facebook-inject')) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const container = document.createElement('div');
    container.id = 'focus-facebook-inject';
    container.className = 'focus-inject focus-facebook';

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });

    container.innerHTML = `
      <div class="focus-fb-card">
        <div class="focus-fb-header">
          <div class="focus-badge">⚡ Focus Feed</div>
          <div class="focus-fb-title">${preset.name} Dashboard</div>
          <div class="focus-date">${today}</div>
        </div>
        <div class="focus-fb-content">
          ${preset.headlines.slice(0, 3).map(h => `
            <a href="${h.link}" class="focus-fb-item" target="_blank" rel="noopener">
              <div class="focus-fb-item-title">${h.title}</div>
              <div class="focus-fb-item-source">${h.source}</div>
            </a>
          `).join('')}
        </div>
      </div>
    `;

    feed.insertBefore(container, feed.firstChild);
    injectedElements.add(container);
  }

  // MODULE D: INSTAGRAM - Inject inspirational card at TOP
  function handleInstagram() {
    const selectors = [
      'main[role="main"]',
      'section > div > div'
    ];

    let main = null;
    for (const selector of selectors) {
      main = document.querySelector(selector);
      if (main) break;
    }

    if (!main || document.getElementById('focus-instagram-inject')) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const randomQuote = preset.quotes[Math.floor(Math.random() * preset.quotes.length)];

    const container = document.createElement('div');
    container.id = 'focus-instagram-inject';
    container.className = 'focus-inject focus-instagram';

    container.innerHTML = `
      <div class="focus-ig-card">
        <div class="focus-badge">⚡ Focus Mode</div>
        <blockquote class="focus-ig-quote">${randomQuote}</blockquote>
        <div class="focus-ig-persona">${preset.name}</div>
      </div>
    `;

    main.insertBefore(container, main.firstChild);
    injectedElements.add(container);
  }

  // MODULE E: TIKTOK - Inject at TOP with educational content
  function handleTikTok() {
    const selectors = [
      '[data-e2e="recommend-list"]',
      'div[id*="app"]',
      'main'
    ];

    let feed = null;
    for (const selector of selectors) {
      feed = document.querySelector(selector);
      if (feed) break;
    }

    if (!feed || document.getElementById('focus-tiktok-inject')) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const container = document.createElement('div');
    container.id = 'focus-tiktok-inject';
    container.className = 'focus-inject focus-tiktok';

    const randomFact = preset.facts[Math.floor(Math.random() * preset.facts.length)];

    container.innerHTML = `
      <div class="focus-tiktok-card">
        <div class="focus-badge">⚡ Focus Break</div>
        <h2>Before You Scroll...</h2>
        <p class="focus-tiktok-fact">${randomFact}</p>
        <div class="focus-tiktok-actions">
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(preset.name + ' education')}"
             class="focus-tiktok-btn" target="_blank" rel="noopener">
            Watch Educational Content
          </a>
          <a href="https://en.wikipedia.org/wiki/Special:Random"
             class="focus-tiktok-btn focus-tiktok-btn-secondary" target="_blank" rel="noopener">
            Learn Something Random
          </a>
        </div>
      </div>
    `;

    feed.insertBefore(container, feed.firstChild);
    injectedElements.add(container);
  }

  // MODULE F: UNIVERSAL AD REPLACER
  function replaceAllAds() {
    if (!focusEnabled) return;

    const adSelectors = [
      'iframe[id*="google_ads"]',
      'iframe[id*="aswift"]',
      'div[id*="google_ads"]',
      'div[class*="adsbygoogle"]',
      'div[id*="taboola"]',
      'div[id*="outbrain"]',
      'div[class*="advertisement"]',
      'div[class*="_ad_"]',
      '[data-ad-slot]',
      '[data-ad-unit]',
      'aside[class*="ad"]'
    ];

    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(ad => {
        if (!ad.hasAttribute('data-focus-replaced') && ad.offsetParent !== null) {
          replaceAdWithContent(ad);
        }
      });
    });
  }

  function replaceAdWithContent(adElement) {
    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const contentType = Math.random();
    let replacement;

    if (contentType < 0.5) {
      const randomFact = preset.facts[Math.floor(Math.random() * preset.facts.length)];
      replacement = document.createElement('div');
      replacement.className = 'focus-ad-replacement focus-fact';
      replacement.innerHTML = `
        <div class="focus-ad-badge">Did You Know?</div>
        <div class="focus-ad-content">${randomFact}</div>
      `;
    } else {
      const randomQuote = preset.quotes[Math.floor(Math.random() * preset.quotes.length)];
      replacement = document.createElement('div');
      replacement.className = 'focus-ad-replacement focus-quote';
      replacement.innerHTML = `
        <div class="focus-ad-badge">${preset.name}</div>
        <div class="focus-ad-content">"${randomQuote}"</div>
      `;
    }

    replacement.setAttribute('data-focus-replaced', 'true');
    adElement.style.display = 'none';
    adElement.parentNode.insertBefore(replacement, adElement);
    injectedElements.add(replacement);
  }

  // UTILITIES
  function observePageChanges() {
    let debounceTimer;

    observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!focusEnabled) return;

        if (hostname.includes('youtube.com') && !document.getElementById('focus-youtube-inject')) {
          handleYouTube();
        } else if ((hostname.includes('twitter.com') || hostname.includes('x.com')) && !document.getElementById('focus-twitter-inject')) {
          handleTwitter();
        } else if (hostname.includes('facebook.com') && !document.getElementById('focus-facebook-inject')) {
          handleFacebook();
        } else if (hostname.includes('instagram.com') && !document.getElementById('focus-instagram-inject')) {
          handleInstagram();
        } else if (hostname.includes('tiktok.com') && !document.getElementById('focus-tiktok-inject')) {
          handleTikTok();
        }

        replaceAllAds();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('popstate', () => {
    cleanup();
    setTimeout(init, 500);
  });
})();
