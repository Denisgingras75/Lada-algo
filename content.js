(function() {
  'use strict';

  let trainingEnabled = true;
  let selectedPersona = 'polymath';
  let trainingIntensity = 80;
  let processedElements = new Set();
  let stats = { liked: 0, hidden: 0, neutral: 0 };
  let debugPanel = null;
  let observer = null;
  const hostname = window.location.hostname;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'likeCurrentVideo') {
      likeCurrentVideoPage();
      sendResponse({ success: true });
    }
    return true;
  });

  // Function to like video when on video watch page
  function likeCurrentVideoPage() {
    try {
      const likeButton = document.querySelector(
        'like-button-view-model button[aria-label*="like"], ' +
        'button[aria-label="Like this video"], ' +
        '#segmented-like-button button'
      );

      if (likeButton && likeButton.getAttribute('aria-pressed') !== 'true') {
        console.log('[Focus Feed] ✓ Liking video:', document.title);
        likeButton.click();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Focus Feed] Error liking video:', error);
      return false;
    }
  }

  // Initialize
  chrome.storage.sync.get(['focusEnabled', 'selectedPersona', 'trainingIntensity'], (result) => {
    trainingEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
    selectedPersona = result.selectedPersona || 'polymath';
    trainingIntensity = result.trainingIntensity !== undefined ? result.trainingIntensity : 80;

    console.log(`[Focus Feed] Loaded - Persona: ${selectedPersona}, Intensity: ${trainingIntensity}%`);

    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) trainingEnabled = changes.focusEnabled.newValue;
    if (changes.selectedPersona) selectedPersona = changes.selectedPersona.newValue;
    if (changes.trainingIntensity) trainingIntensity = changes.trainingIntensity.newValue;
  });

  function init() {
    if (!trainingEnabled) {
      console.log('[Focus Feed] Training disabled');
      return;
    }

    console.log(`[Focus Feed] 🎯 Active - ${selectedPersona} persona`);

    createDebugPanel();

    if (hostname.includes('youtube.com')) {
      handleYouTube();
      startObserver();
    }
  }

  // Debug panel
  function createDebugPanel() {
    if (debugPanel) return;

    debugPanel = document.createElement('div');
    debugPanel.id = 'focus-feed-debug';
    debugPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 10000;
      min-width: 250px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;

    debugPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">🎯 Focus Feed Active</div>
      <div style="margin-bottom: 5px;">Persona: <span id="ff-persona">${selectedPersona}</span></div>
      <div style="margin-bottom: 5px;">Intensity: <span id="ff-intensity">${trainingIntensity}%</span></div>
      <div style="margin-bottom: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="margin-bottom: 3px;">✅ Educational: <span id="ff-educational">0</span></div>
        <div style="margin-bottom: 3px;">❌ Junk: <span id="ff-junk">0</span></div>
        <div style="margin-bottom: 3px;">○ Neutral: <span id="ff-neutral">0</span></div>
      </div>
      <div id="ff-last-action" style="font-size: 11px; opacity: 0.8; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);"></div>
    `;

    document.body.appendChild(debugPanel);
    console.log('[Focus Feed] ✓ Debug panel created');
  }

  function updateDebugPanel(action = null) {
    if (!debugPanel) return;

    const eduEl = document.getElementById('ff-educational');
    const junkEl = document.getElementById('ff-junk');
    const neutralEl = document.getElementById('ff-neutral');

    if (eduEl) eduEl.textContent = stats.liked;
    if (junkEl) junkEl.textContent = stats.hidden;
    if (neutralEl) neutralEl.textContent = stats.neutral;

    if (action) {
      const lastActionEl = document.getElementById('ff-last-action');
      if (lastActionEl) lastActionEl.textContent = action;
    }
  }

  // YOUTUBE MODULE
  function handleYouTube() {
    console.log('[Focus Feed] Scanning YouTube...');

    const videos = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');
    console.log(`[Focus Feed] Found ${videos.length} videos`);

    videos.forEach(video => processYouTubeVideo(video));
  }

  function processYouTubeVideo(videoElement) {
    if (processedElements.has(videoElement)) return;
    processedElements.add(videoElement);

    const titleElement = videoElement.querySelector('#video-title');
    const channelElement = videoElement.querySelector('#channel-name a, #text.ytd-channel-name a');

    if (!titleElement) return;

    const title = titleElement.textContent.trim();
    const channel = channelElement ? channelElement.textContent.trim() : '';
    const classification = classifyContent(title, channel);

    console.log(`[Focus Feed] "${title}" → ${classification}`);

    if (classification === 'educational' && trainingIntensity >= 30) {
      markEducational(videoElement, title);
      stats.liked++;
      updateDebugPanel(`✅ Found: ${title.substring(0, 40)}...`);
    } else if (classification === 'junk' && trainingIntensity >= 70) {
      hideJunk(videoElement, title);
      stats.hidden++;
      updateDebugPanel(`❌ Hiding: ${title.substring(0, 40)}...`);
    } else {
      stats.neutral++;
      updateDebugPanel(`Checked: ${title.substring(0, 40)}...`);
    }

    // Update stats storage
    chrome.storage.local.set({ sessionStats: stats });
  }

  function markEducational(videoElement, title) {
    videoElement.style.border = '2px solid #4ade80';
    videoElement.style.borderRadius = '8px';

    const videoUrl = videoElement.querySelector('#video-title')?.getAttribute('href');
    if (videoUrl) {
      // Send to background to open and like
      chrome.runtime.sendMessage({
        action: 'likeVideo',
        videoUrl: videoUrl,
        title: title
      });
    }

    // Add badge
    const badge = document.createElement('div');
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: #4ade80;
      color: #000;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      z-index: 100;
    `;
    badge.textContent = '✓ Educational';

    const thumbnail = videoElement.querySelector('ytd-thumbnail, #thumbnail');
    if (thumbnail) {
      thumbnail.style.position = 'relative';
      thumbnail.appendChild(badge);
    }
  }

  function hideJunk(videoElement, title) {
    const menuButton = videoElement.querySelector('button[aria-label="Action menu"], button#button[aria-label*="menu"]');

    if (menuButton) {
      try {
        menuButton.click();

        setTimeout(() => {
          const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-listbox ytd-menu-service-item-renderer');

          for (let item of menuItems) {
            const text = item.textContent.toLowerCase();
            if (text.includes('not interested') || text.includes('don\'t recommend')) {
              console.log(`[Focus Feed] ✓ Clicking "Not interested" on: ${title}`);
              item.click();
              break;
            }
          }
        }, 300);
      } catch (error) {
        console.error('[Focus Feed] Error hiding video:', error);
      }
    }

    // Visual hiding
    videoElement.style.transition = 'opacity 0.5s';
    videoElement.style.opacity = '0.2';
    videoElement.style.filter = 'grayscale(100%)';
  }

  function classifyContent(title, channel) {
    const text = `${title} ${channel}`.toLowerCase();

    const rules = getPersonaRules(selectedPersona);

    // Check educational keywords
    for (let keyword of rules.educational) {
      if (text.includes(keyword.toLowerCase())) {
        return 'educational';
      }
    }

    // Check junk keywords
    for (let keyword of rules.junk) {
      if (text.includes(keyword.toLowerCase())) {
        return 'junk';
      }
    }

    return 'neutral';
  }

  function getPersonaRules(persona) {
    const allRules = {
      polymath: {
        educational: [
          'MIT', 'Stanford', 'Harvard', 'Yale', 'Berkeley', 'Oxford', 'Cambridge',
          'Khan Academy', 'TED', 'Crash Course', 'Veritasium', 'Kurzgesagt',
          'SmarterEveryDay', 'Vsauce', '3Blue1Brown', 'Numberphile',
          'lecture', 'course', 'tutorial', 'explained', 'documentary', 'science',
          'learn', 'education', 'study', 'lesson', 'guide', 'how to',
          'physics', 'mathematics', 'chemistry', 'biology', 'history', 'philosophy',
          'engineering', 'programming', 'research'
        ],
        junk: [
          'SHOCKING', 'UNBELIEVABLE', 'WON\'T BELIEVE', 'YOU WON\'T', 'INSANE',
          'MIND BLOWING', 'GONE WRONG', 'GONE SEXUAL',
          'drama', 'exposed', 'cancelled', 'beef', 'cringe', 'roast',
          'flat earth', 'conspiracy', 'clickbait', 'prank', 'challenge'
        ]
      },
      engineer: {
        educational: ['engineering', 'coding', 'programming', 'tutorial', 'Python', 'JavaScript', 'CS50', 'algorithm', 'database'],
        junk: ['SHOCKED', 'drama', 'exposed', 'GONE WRONG', 'clickbait']
      },
      strategist: {
        educational: ['business', 'strategy', 'finance', 'Y Combinator', 'Bloomberg', 'Warren Buffett', 'startup', 'economics'],
        junk: ['get rich quick', 'EASY MONEY', 'SECRET METHOD', 'exposed', 'drama']
      }
    };

    return allRules[persona] || allRules.polymath;
  }

  // Observer for new videos
  let observerTimeout = null;
  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        handleYouTube();
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Focus Feed] ✓ Observer started');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
