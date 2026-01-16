(function() {
  'use strict';

  let focusEnabled = true;
  let selectedPersona = 'polymath';
  let observer = null;
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
    init();
  });

  function init() {
    if (observer) observer.disconnect();

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

    blockUniversalAds();
    observePageChanges();
  }

  // MODULE A: YOUTUBE
  function handleYouTube() {
    if (window.location.pathname !== '/' && window.location.pathname !== '/feed/explore') return;

    if (focusEnabled) {
      nukeYouTubeFeed();
      injectYouTubeFeed();
    } else {
      restoreYouTubeFeed();
      removeInjection('focus-youtube-container');
    }
  }

  function nukeYouTubeFeed() {
    let styles = document.getElementById('focus-nuke-youtube');
    if (!styles) {
      styles = document.createElement('style');
      styles.id = 'focus-nuke-youtube';
      styles.textContent = `
        ytd-browse[page-subtype="home"] #contents,
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer,
        ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer #primary {
          display: none !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  function restoreYouTubeFeed() {
    const styles = document.getElementById('focus-nuke-youtube');
    if (styles) styles.remove();
  }

  function injectYouTubeFeed() {
    let container = document.getElementById('focus-youtube-container');
    if (container) container.remove();

    const ytdBrowse = document.querySelector('ytd-browse[page-subtype="home"]');
    if (!ytdBrowse) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    container = document.createElement('div');
    container.id = 'focus-youtube-container';
    container.className = 'focus-container focus-youtube';

    const header = document.createElement('div');
    header.className = 'focus-header';
    header.innerHTML = `
      <h2>${preset.name}</h2>
      <p>Curated content to help you focus and grow</p>
    `;

    const grid = document.createElement('div');
    grid.className = 'focus-grid';

    preset.videos.forEach(video => {
      const card = document.createElement('a');
      card.className = 'focus-card';
      card.href = video.link;
      card.innerHTML = `
        <div class="focus-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
        </div>
        <div class="focus-info">
          <h3 class="focus-title">${video.title}</h3>
          <p class="focus-channel">${video.channel}</p>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(grid);

    const primaryContent = ytdBrowse.querySelector('#primary') || ytdBrowse;
    primaryContent.appendChild(container);
  }

  // MODULE B: TWITTER/X
  function handleTwitter() {
    if (focusEnabled) {
      nukeTwitterFeed();
      injectTwitterBriefing();
    } else {
      restoreTwitterFeed();
      removeInjection('focus-twitter-container');
    }
  }

  function nukeTwitterFeed() {
    let styles = document.getElementById('focus-nuke-twitter');
    if (!styles) {
      styles = document.createElement('style');
      styles.id = 'focus-nuke-twitter';
      styles.textContent = `
        [aria-label="Timeline: Your Home Timeline"],
        [aria-label="Timeline: Trending now"],
        div[data-testid="primaryColumn"] section[role="region"] {
          display: none !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  function restoreTwitterFeed() {
    const styles = document.getElementById('focus-nuke-twitter');
    if (styles) styles.remove();
  }

  function injectTwitterBriefing() {
    let container = document.getElementById('focus-twitter-container');
    if (container) return;

    const timeline = document.querySelector('[data-testid="primaryColumn"]');
    if (!timeline) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    container = document.createElement('div');
    container.id = 'focus-twitter-container';
    container.className = 'focus-container focus-twitter';

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    container.innerHTML = `
      <div class="focus-header">
        <h2>Daily Briefing - ${preset.name}</h2>
        <p>${today}</p>
      </div>
      <div class="focus-briefing">
        ${preset.headlines.map(h => `
          <a href="${h.link}" class="focus-headline" target="_blank" rel="noopener">
            <h3>${h.title}</h3>
            <p class="focus-source">${h.source}</p>
          </a>
        `).join('')}
      </div>
    `;

    timeline.insertBefore(container, timeline.firstChild);
  }

  // MODULE C: FACEBOOK
  function handleFacebook() {
    if (focusEnabled) {
      nukeFacebookFeed();
      injectFacebookDashboard();
    } else {
      restoreFacebookFeed();
      removeInjection('focus-facebook-container');
    }
  }

  function nukeFacebookFeed() {
    let styles = document.getElementById('focus-nuke-facebook');
    if (!styles) {
      styles = document.createElement('style');
      styles.id = 'focus-nuke-facebook';
      styles.textContent = `
        div[role="feed"],
        div[aria-label="Stories"],
        div[data-pagelet*="FeedUnit"] {
          display: none !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  function restoreFacebookFeed() {
    const styles = document.getElementById('focus-nuke-facebook');
    if (styles) styles.remove();
  }

  function injectFacebookDashboard() {
    let container = document.getElementById('focus-facebook-container');
    if (container) return;

    const feed = document.querySelector('div[role="main"]');
    if (!feed) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    container = document.createElement('div');
    container.id = 'focus-facebook-container';
    container.className = 'focus-container focus-facebook';

    container.innerHTML = `
      <div class="focus-dashboard">
        <h2>Focus Dashboard - ${preset.name}</h2>
        <p class="focus-date">${today}</p>
        <div class="focus-headlines-list">
          ${preset.headlines.map(h => `
            <a href="${h.link}" class="focus-headline-card" target="_blank" rel="noopener">
              <h3>${h.title}</h3>
              <span class="focus-source">${h.source}</span>
            </a>
          `).join('')}
        </div>
      </div>
    `;

    feed.insertBefore(container, feed.firstChild);
  }

  // MODULE D: INSTAGRAM
  function handleInstagram() {
    if (focusEnabled) {
      nukeInstagramFeed();
      injectInstagramQuote();
    } else {
      restoreInstagramFeed();
      removeInjection('focus-instagram-container');
    }
  }

  function nukeInstagramFeed() {
    let styles = document.getElementById('focus-nuke-instagram');
    if (!styles) {
      styles = document.createElement('style');
      styles.id = 'focus-nuke-instagram';
      styles.textContent = `
        main article,
        div[role="presentation"],
        section > div > div > div:has(img[alt*="profile picture"]) {
          display: none !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  function restoreInstagramFeed() {
    const styles = document.getElementById('focus-nuke-instagram');
    if (styles) styles.remove();
  }

  function injectInstagramQuote() {
    let container = document.getElementById('focus-instagram-container');
    if (container) return;

    const main = document.querySelector('main');
    if (!main) return;

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const randomQuote = preset.quotes[Math.floor(Math.random() * preset.quotes.length)];

    container = document.createElement('div');
    container.id = 'focus-instagram-container';
    container.className = 'focus-container focus-instagram';

    container.innerHTML = `
      <div class="focus-quote-card">
        <h2>Focus Mode Active</h2>
        <blockquote class="focus-quote">${randomQuote}</blockquote>
        <p class="focus-persona-label">${preset.name}</p>
      </div>
    `;

    main.appendChild(container);
  }

  // MODULE E: TIKTOK
  function handleTikTok() {
    if (focusEnabled) {
      nukeTikTokFeed();
      injectTikTokBlock();
    } else {
      restoreTikTokFeed();
      removeInjection('focus-tiktok-container');
    }
  }

  function nukeTikTokFeed() {
    let styles = document.getElementById('focus-nuke-tiktok');
    if (!styles) {
      styles = document.createElement('style');
      styles.id = 'focus-nuke-tiktok';
      styles.textContent = `
        [data-e2e="for-you-feed"],
        [data-e2e="recommend-list-item-container"],
        div[id*="SIGI_STATE"] {
          display: none !important;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  function restoreTikTokFeed() {
    const styles = document.getElementById('focus-nuke-tiktok');
    if (styles) styles.remove();
  }

  function injectTikTokBlock() {
    let container = document.getElementById('focus-tiktok-container');
    if (container) return;

    const body = document.querySelector('body');
    if (!body) return;

    container = document.createElement('div');
    container.id = 'focus-tiktok-container';
    container.className = 'focus-container focus-tiktok';

    container.innerHTML = `
      <div class="focus-tiktok-block">
        <h1>Avoid the Rot.</h1>
        <p>TikTok's algorithm is designed for addiction, not growth.</p>
        <a href="https://en.wikipedia.org/wiki/Special:Random" class="focus-tiktok-link" target="_blank" rel="noopener">
          Learn Something Random Instead →
        </a>
      </div>
    `;

    body.appendChild(container);
  }

  // MODULE F: UNIVERSAL AD BLOCKER
  function blockUniversalAds() {
    if (!focusEnabled) return;

    const adSelectors = [
      '.ad-slot',
      'iframe[id*="google_ads"]',
      'div[id*="taboola"]',
      'div[id*="outbrain"]',
      'div[class*="advertisement"]',
      '[data-ad-slot]'
    ];

    adSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(ad => {
        if (!ad.hasAttribute('data-focus-replaced')) {
          replaceAdWithFact(ad);
        }
      });
    });
  }

  function replaceAdWithFact(adElement) {
    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const randomFact = preset.facts[Math.floor(Math.random() * preset.facts.length)];

    const factCard = document.createElement('div');
    factCard.className = 'focus-fact-card';
    factCard.setAttribute('data-focus-replaced', 'true');
    factCard.innerHTML = `
      <div class="focus-fact-header">Did You Know?</div>
      <div class="focus-fact-content">${randomFact}</div>
    `;

    adElement.replaceWith(factCard);
  }

  // UTILITIES
  function removeInjection(id) {
    const container = document.getElementById(id);
    if (container) container.remove();
  }

  function observePageChanges() {
    observer = new MutationObserver(() => {
      if (focusEnabled) {
        if (hostname.includes('youtube.com')) {
          const container = document.getElementById('focus-youtube-container');
          if (!container && (window.location.pathname === '/' || window.location.pathname === '/feed/explore')) {
            handleYouTube();
          }
        } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
          const container = document.getElementById('focus-twitter-container');
          if (!container) handleTwitter();
        } else if (hostname.includes('facebook.com')) {
          const container = document.getElementById('focus-facebook-container');
          if (!container) handleFacebook();
        } else if (hostname.includes('instagram.com')) {
          const container = document.getElementById('focus-instagram-container');
          if (!container) handleInstagram();
        } else if (hostname.includes('tiktok.com')) {
          const container = document.getElementById('focus-tiktok-container');
          if (!container) handleTikTok();
        }

        blockUniversalAds();
      }
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
})();
