(function() {
  'use strict';

  let focusEnabled = true;
  let selectedPersona = 'builder';
  let observer = null;

  chrome.storage.sync.get(['focusEnabled', 'selectedPersona'], (result) => {
    focusEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
    selectedPersona = result.selectedPersona || 'builder';
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
    if (window.location.pathname === '/' || window.location.pathname === '/feed/explore') {
      handleHomePage();
    }
  }

  function handleHomePage() {
    if (observer) {
      observer.disconnect();
    }

    if (focusEnabled) {
      nukeYouTubeFeed();
      injectFocusFeed();
      observePageChanges();
    } else {
      restoreYouTubeFeed();
      removeFocusFeed();
    }
  }

  function nukeYouTubeFeed() {
    const styles = document.getElementById('focus-feed-nuke-styles');
    if (!styles) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'focus-feed-nuke-styles';
      styleSheet.textContent = `
        ytd-browse[page-subtype="home"] #contents,
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer,
        ytd-browse[page-subtype="home"] ytd-two-column-browse-results-renderer #primary {
          display: none !important;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  }

  function restoreYouTubeFeed() {
    const styles = document.getElementById('focus-feed-nuke-styles');
    if (styles) {
      styles.remove();
    }
  }

  function injectFocusFeed() {
    let container = document.getElementById('focus-feed-container');

    if (container) {
      container.remove();
    }

    const ytdBrowse = document.querySelector('ytd-browse[page-subtype="home"]');
    if (!ytdBrowse) return;

    container = document.createElement('div');
    container.id = 'focus-feed-container';

    const preset = FOCUS_PRESETS[selectedPersona];
    if (!preset) return;

    const header = document.createElement('div');
    header.className = 'focus-feed-header';
    header.innerHTML = `
      <h2>${preset.name}</h2>
      <p>Curated content to help you focus and grow</p>
    `;

    const grid = document.createElement('div');
    grid.className = 'focus-feed-grid';

    preset.videos.forEach(video => {
      const card = document.createElement('a');
      card.className = 'focus-feed-card';
      card.href = video.link;
      card.innerHTML = `
        <div class="focus-feed-thumbnail">
          <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
        </div>
        <div class="focus-feed-info">
          <h3 class="focus-feed-title">${video.title}</h3>
          <p class="focus-feed-channel">${video.channel}</p>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(grid);

    const primaryContent = ytdBrowse.querySelector('#primary') || ytdBrowse;
    primaryContent.appendChild(container);
  }

  function removeFocusFeed() {
    const container = document.getElementById('focus-feed-container');
    if (container) {
      container.remove();
    }
  }

  function observePageChanges() {
    observer = new MutationObserver(() => {
      if (focusEnabled && (window.location.pathname === '/' || window.location.pathname === '/feed/explore')) {
        const container = document.getElementById('focus-feed-container');
        if (!container) {
          nukeYouTubeFeed();
          injectFocusFeed();
        }
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
