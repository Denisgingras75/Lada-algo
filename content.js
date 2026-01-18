(function() {
  'use strict';

  let trainingEnabled = true;
  let selectedPersona = 'common-sense';
  let trainingIntensity = 80;
  let filterMode = 'smart';
  let processedElements = new Set();
  let stats = { liked: 0, hidden: 0, neutral: 0 };
  let debugPanel = null;
  let observer = null;
  const hostname = window.location.hostname;
  let currentPlatform = null;

  // Detect platform
  if (hostname.includes('youtube.com')) {
    currentPlatform = 'youtube';
  } else if (hostname.includes('facebook.com')) {
    currentPlatform = 'facebook';
  } else if (hostname.includes('instagram.com')) {
    currentPlatform = 'instagram';
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    currentPlatform = 'twitter';
  }

  console.log(`[Focus Feed] Platform detected: ${currentPlatform || 'unsupported'}`);

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'likeCurrentVideo') {
      likeCurrentVideoPage();
      sendResponse({ success: true });
    } else if (message.action === 'playAndLikeVideo') {
      playAndLikeVideo();
      sendResponse({ success: true });
    }
    return true;
  });

  // Function to PLAY and LIKE video (YouTube only)
  function playAndLikeVideo() {
    if (currentPlatform !== 'youtube') return false;

    try {
      const playButton = document.querySelector('button.ytp-play-button');
      const video = document.querySelector('video');

      if (video && video.paused) {
        console.log('[Focus Feed] ▶️ Playing video:', document.title);
        video.play();
      } else if (playButton) {
        playButton.click();
      }

      setTimeout(() => {
        const likeButton = document.querySelector(
          'like-button-view-model button[aria-label*="like"], ' +
          'button[aria-label="Like this video"], ' +
          '#segmented-like-button button'
        );

        if (likeButton && likeButton.getAttribute('aria-pressed') !== 'true') {
          console.log('[Focus Feed] ❤️ Liking video:', document.title);
          likeButton.click();
        }
      }, 2000);

      setTimeout(() => {
        const subscribeButton = document.querySelector(
          'ytd-subscribe-button-renderer button[aria-label*="Subscribe"], ' +
          'button.yt-spec-button-shape-next[aria-label*="Subscribe"]'
        );

        if (subscribeButton && subscribeButton.textContent.toLowerCase().includes('subscribe')) {
          console.log('[Focus Feed] 🔔 Subscribing to channel');
          subscribeButton.click();
        }
      }, 4000);

      return true;
    } catch (error) {
      console.error('[Focus Feed] Error playing/liking video:', error);
      return false;
    }
  }

  function likeCurrentVideoPage() {
    if (currentPlatform !== 'youtube') return false;

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
  chrome.storage.sync.get(['focusEnabled', 'selectedPersona', 'trainingIntensity', 'filterMode'], (result) => {
    trainingEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
    selectedPersona = result.selectedPersona || 'common-sense';
    trainingIntensity = result.trainingIntensity !== undefined ? result.trainingIntensity : 80;
    filterMode = result.filterMode || 'smart';

    console.log(`[Focus Feed] Loaded - Mode: ${filterMode.toUpperCase()}, Persona: ${selectedPersona}, Platform: ${currentPlatform}`);

    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) trainingEnabled = changes.focusEnabled.newValue;
    if (changes.selectedPersona) selectedPersona = changes.selectedPersona.newValue;
    if (changes.trainingIntensity) trainingIntensity = changes.trainingIntensity.newValue;
    if (changes.filterMode) {
      filterMode = changes.filterMode.newValue;
      console.log(`[Focus Feed] Mode changed to: ${filterMode.toUpperCase()}`);
      updateDebugPanel(`Switched to ${filterMode.toUpperCase()} MODE`);
    }
  });

  function init() {
    if (!trainingEnabled) {
      console.log('[Focus Feed] Training disabled');
      return;
    }

    if (!currentPlatform) {
      console.log('[Focus Feed] Unsupported platform:', hostname);
      return;
    }

    console.log(`[Focus Feed] 🎯 Active - ${filterMode.toUpperCase()} mode on ${currentPlatform}`);

    createDebugPanel();
    startScanning();
  }

  function startScanning() {
    // Initial scan
    setTimeout(() => {
      scanPlatform();
    }, 2000); // Give page time to load

    // Start observer for new content
    startObserver();

    // Periodic rescan (backup for missed mutations)
    setInterval(() => {
      scanPlatform();
    }, 5000);
  }

  function scanPlatform() {
    if (!trainingEnabled) return;

    switch(currentPlatform) {
      case 'youtube':
        handleYouTube();
        break;
      case 'facebook':
        handleFacebook();
        break;
      case 'instagram':
        handleInstagram();
        break;
      case 'twitter':
        handleTwitter();
        break;
    }
  }

  // ==================== YOUTUBE ====================
  function handleYouTube() {
    console.log('[Focus Feed] Scanning YouTube...');

    // Updated selectors for current YouTube DOM
    const videos = document.querySelectorAll(
      'ytd-rich-item-renderer, ' +
      'ytd-video-renderer, ' +
      'ytd-grid-video-renderer, ' +
      'ytd-compact-video-renderer, ' +
      'ytd-playlist-video-renderer'
    );

    console.log(`[Focus Feed] Found ${videos.length} YouTube videos`);

    videos.forEach(video => processYouTubeVideo(video));
  }

  function processYouTubeVideo(videoElement) {
    if (processedElements.has(videoElement)) return;
    processedElements.add(videoElement);

    const titleElement = videoElement.querySelector('#video-title, #video-title-link, a#video-title');
    const channelElement = videoElement.querySelector('#channel-name a, #text.ytd-channel-name a, ytd-channel-name a');

    if (!titleElement) {
      console.log('[Focus Feed] YouTube video missing title element');
      return;
    }

    const title = titleElement.textContent?.trim() || titleElement.getAttribute('title') || '';
    const channel = channelElement ? channelElement.textContent.trim() : '';

    if (!title) {
      console.log('[Focus Feed] YouTube video has empty title');
      return;
    }

    const classification = classifyContent(title, channel);
    console.log(`[Focus Feed] YT: "${title.substring(0, 50)}..." → ${classification} (${filterMode} mode)`);

    applyClassification(videoElement, title, classification, 'youtube');
  }

  // ==================== FACEBOOK ====================
  function handleFacebook() {
    console.log('[Focus Feed] Scanning Facebook...');

    // Facebook post selectors (updated for current FB DOM)
    const posts = document.querySelectorAll(
      'div[data-pagelet^="FeedUnit"], ' +
      'div[role="article"], ' +
      'div.x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z'
    );

    console.log(`[Focus Feed] Found ${posts.length} Facebook posts`);

    posts.forEach(post => processFacebookPost(post));
  }

  function processFacebookPost(postElement) {
    if (processedElements.has(postElement)) return;
    processedElements.add(postElement);

    // Try to find post text content
    const textElements = postElement.querySelectorAll(
      'div[data-ad-preview="message"], ' +
      'div[data-ad-comet-preview="message"], ' +
      'div.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.x1vvkbs, ' +
      'div[dir="auto"]'
    );

    let text = '';
    textElements.forEach(el => {
      const content = el.textContent?.trim() || '';
      if (content.length > text.length) text = content;
    });

    // Get author if possible
    const authorElement = postElement.querySelector(
      'a[role="link"] strong, ' +
      'h2 a, ' +
      'h3 a, ' +
      'h4 a'
    );
    const author = authorElement ? authorElement.textContent.trim() : '';

    if (!text || text.length < 10) {
      console.log('[Focus Feed] FB post too short or empty');
      return;
    }

    const classification = classifyContent(text, author);
    console.log(`[Focus Feed] FB: "${text.substring(0, 50)}..." → ${classification} (${filterMode} mode)`);

    applyClassification(postElement, text, classification, 'facebook');
  }

  // ==================== INSTAGRAM ====================
  function handleInstagram() {
    console.log('[Focus Feed] Scanning Instagram...');

    // Instagram post selectors
    const posts = document.querySelectorAll(
      'article[role="presentation"], ' +
      'div._aagu, ' +
      'div._ab6k'
    );

    console.log(`[Focus Feed] Found ${posts.length} Instagram posts`);

    posts.forEach(post => processInstagramPost(post));
  }

  function processInstagramPost(postElement) {
    if (processedElements.has(postElement)) return;
    processedElements.add(postElement);

    // Try to find caption
    const captionElement = postElement.querySelector(
      'h1._aacl._aacs._aact._aacx._aada, ' +
      'span._aacl._aaco._aacu._aacx._aad7._aade, ' +
      'div.C4VMK > span'
    );

    const caption = captionElement ? captionElement.textContent.trim() : '';

    // Get username
    const usernameElement = postElement.querySelector(
      'a.x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz._acan._acao._acat._acaw._aj1-, ' +
      'span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x5n08af.x10wh9bi.x1wdrske.x8viiok.x18hxmgj'
    );
    const username = usernameElement ? usernameElement.textContent.trim() : '';

    if (!caption || caption.length < 5) {
      console.log('[Focus Feed] IG post has no caption or too short');
      return;
    }

    const classification = classifyContent(caption, username);
    console.log(`[Focus Feed] IG: "${caption.substring(0, 50)}..." → ${classification} (${filterMode} mode)`);

    applyClassification(postElement, caption, classification, 'instagram');
  }

  // ==================== TWITTER ====================
  function handleTwitter() {
    console.log('[Focus Feed] Scanning Twitter/X...');

    const tweets = document.querySelectorAll(
      'article[data-testid="tweet"], ' +
      'div[data-testid="cellInnerDiv"]'
    );

    console.log(`[Focus Feed] Found ${tweets.length} tweets`);

    tweets.forEach(tweet => processTwitterPost(tweet));
  }

  function processTwitterPost(tweetElement) {
    if (processedElements.has(tweetElement)) return;
    processedElements.add(tweetElement);

    const textElement = tweetElement.querySelector(
      'div[data-testid="tweetText"], ' +
      'div[lang]'
    );

    const text = textElement ? textElement.textContent.trim() : '';

    if (!text || text.length < 10) {
      console.log('[Focus Feed] Tweet too short or empty');
      return;
    }

    const classification = classifyContent(text, '');
    console.log(`[Focus Feed] X: "${text.substring(0, 50)}..." → ${classification} (${filterMode} mode)`);

    applyClassification(tweetElement, text, classification, 'twitter');
  }

  // ==================== CLASSIFICATION ====================
  function applyClassification(element, text, classification, platform) {
    // SMART MODE: Focus on removing junk, suggest educational, leave neutral alone
    if (filterMode === 'smart') {
      if (classification === 'junk') {
        hideContent(element, text, platform);
        stats.hidden++;
        updateDebugPanel(`❌ Removed junk: ${text.substring(0, 40)}...`);
      } else if (classification === 'educational') {
        suggestEducational(element, text, platform);
        stats.liked++;
        updateDebugPanel(`✅ Suggested: ${text.substring(0, 40)}...`);
      } else {
        stats.neutral++;
        updateDebugPanel(`○ Passed: ${text.substring(0, 40)}...`);
      }
    }
    // MEGA MODE: Nuclear option - force educational, hide junk aggressively
    else if (filterMode === 'mega') {
      if (classification === 'educational' && trainingIntensity >= 30) {
        markEducational(element, text, platform);
        stats.liked++;
        updateDebugPanel(`✅ Training: ${text.substring(0, 40)}...`);
      } else if (classification === 'junk' && trainingIntensity >= 70) {
        hideContent(element, text, platform);
        stats.hidden++;
        updateDebugPanel(`❌ Hiding: ${text.substring(0, 40)}...`);
      } else {
        stats.neutral++;
        updateDebugPanel(`Checked: ${text.substring(0, 40)}...`);
      }
    }

    chrome.storage.local.set({ sessionStats: stats });
  }

  // ==================== ACTIONS ====================

  // SMART MODE: Gentle educational suggestion
  function suggestEducational(element, text, platform) {
    element.style.border = '1px solid rgba(74, 222, 128, 0.5)';
    element.style.borderRadius = '8px';

    const badge = document.createElement('div');
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(74, 222, 128, 0.9);
      color: #000;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      z-index: 100;
      pointer-events: none;
    `;
    badge.textContent = '📚 Educational';

    // Make element position relative so badge positions correctly
    if (element.style.position === '' || element.style.position === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(badge);
  }

  // MEGA MODE: Aggressive educational marking
  function markEducational(element, text, platform) {
    element.style.border = '2px solid #4ade80';
    element.style.borderRadius = '8px';

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
      pointer-events: none;
    `;
    badge.textContent = '✓ Educational';

    if (element.style.position === '' || element.style.position === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(badge);

    // Platform-specific auto-like logic
    if (platform === 'youtube') {
      const videoUrl = element.querySelector('#video-title')?.getAttribute('href');
      if (videoUrl) {
        chrome.runtime.sendMessage({
          action: 'likeVideo',
          videoUrl: videoUrl,
          title: text
        });
      }
    }
  }

  // Hide junk content
  function hideContent(element, text, platform) {
    element.style.transition = 'opacity 0.5s, filter 0.5s';
    element.style.opacity = '0.2';
    element.style.filter = 'grayscale(100%)';

    const badge = document.createElement('div');
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 75, 87, 0.9);
      color: white;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      z-index: 100;
      pointer-events: none;
    `;
    badge.textContent = '❌ Junk';

    if (element.style.position === '' || element.style.position === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(badge);

    // Try to click "not interested" on YouTube
    if (platform === 'youtube') {
      setTimeout(() => {
        const menuButton = element.querySelector('button[aria-label="Action menu"], button#button[aria-label*="menu"]');
        if (menuButton) {
          try {
            menuButton.click();
            setTimeout(() => {
              const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-listbox ytd-menu-service-item-renderer');
              for (let item of menuItems) {
                const itemText = item.textContent.toLowerCase();
                if (itemText.includes('not interested') || itemText.includes('don\'t recommend')) {
                  console.log(`[Focus Feed] ✓ Clicking "Not interested" on: ${text}`);
                  item.click();
                  break;
                }
              }
            }, 300);
          } catch (error) {
            console.error('[Focus Feed] Error hiding YouTube video:', error);
          }
        }
      }, 100);
    }
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
      'common-sense': {
        educational: [
          // Practical skills
          'how to', 'tutorial', 'guide', 'explained', 'learn', 'teach', 'education',
          'lesson', 'course', 'masterclass', 'fundamentals', 'basics', 'advanced',
          'step by step', 'beginner guide', 'complete guide', 'full course',
          'deep dive', 'breakdown', 'analysis', 'review', 'critical thinking',

          // Life skills
          'productivity', 'self improvement', 'personal development', 'habits',
          'time management', 'problem solving', 'decision making',
          'communication skills', 'public speaking', 'writing skills', 'reading',

          // Finance & career
          'financial literacy', 'budgeting', 'investing', 'career advice', 'resume',
          'interview tips', 'negotiation', 'salary', 'retirement', 'taxes',

          // Health & wellness
          'nutrition', 'exercise', 'mental health', 'sleep', 'stress management',
          'mindfulness', 'meditation', 'therapy', 'psychology', 'neuroscience',

          // General knowledge
          'history', 'geography', 'science', 'technology', 'current events',
          'documentary', 'informative', 'educational', 'factual', 'evidence based',

          // Trusted sources
          'NPR', 'BBC', 'PBS', 'National Geographic', 'Scientific American',
          'The Economist', 'Wall Street Journal', 'New York Times', 'Reuters'
        ],
        junk: [
          // Clickbait phrases
          'YOU WON\'T BELIEVE', 'SHOCKING', 'UNBELIEVABLE', 'INSANE', 'CRAZY',
          'MIND BLOWING', 'MUST SEE', 'MUST WATCH', 'THIS WILL CHANGE',
          'LIFE CHANGING', 'GAME CHANGER', 'SECRET REVEALED', 'THEY DON\'T WANT',
          'GONE WRONG', 'GONE SEXUAL', 'ALMOST DIED', 'EMOTIONAL', 'IN TEARS',

          // Drama & gossip
          'drama', 'tea', 'spill', 'exposed', 'cancelled', 'beef', 'diss track',
          'shade', 'feud', 'fight', 'destroyed', 'roasted', 'cringe', 'react',

          // Low effort content
          'prank', 'challenge', 'mukbang', 'haul', 'unboxing', 'vlog', 'vlogging',
          '24 hours', 'last to', 'who can', 'vs', 'versus', 'battle',

          // Misinformation
          'flat earth', 'conspiracy', 'illuminati', 'reptilian', 'fake moon landing',
          'chemtrails', 'anti vax', 'miracle cure', 'doctors hate', 'big pharma',

          // Toxic patterns
          'DESTROYING', 'OBLITERATES', 'ANNIHILATES', 'OWNS', 'WRECKS', 'SLAMS'
        ]
      }
    };

    return allRules[persona] || allRules['common-sense'];
  }

  // ==================== OBSERVER ====================
  let observerTimeout = null;
  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        console.log('[Focus Feed] Content changed, rescanning...');
        scanPlatform();
      }, 300); // Faster response: 300ms instead of 1000ms
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Focus Feed] ✓ Observer started (300ms debounce)');
  }

  // ==================== DEBUG PANEL ====================
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
      z-index: 999999;
      min-width: 250px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;

    debugPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">🎯 Focus Feed Active</div>
      <div style="margin-bottom: 5px;">
        <span style="font-size: 12px; font-weight: bold; color: #4ade80;">Mode: <span id="ff-mode">${filterMode.toUpperCase()}</span></span>
      </div>
      <div style="margin-bottom: 5px; font-size: 11px;">Platform: <span id="ff-platform">${currentPlatform || 'unknown'}</span></div>
      <div style="margin-bottom: 5px; font-size: 11px;">Persona: <span id="ff-persona">${selectedPersona}</span></div>
      <div style="margin-bottom: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);">
        <div style="margin-bottom: 3px;">✅ Educational: <span id="ff-educational">0</span></div>
        <div style="margin-bottom: 3px;">❌ Junk: <span id="ff-junk">0</span></div>
        <div style="margin-bottom: 3px;">○ Neutral: <span id="ff-neutral">0</span></div>
      </div>
      <button id="ff-mode-toggle" style="
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        background: ${filterMode === 'smart' ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${filterMode === 'smart' ? '🧠 SMART MODE (ON)' : '💥 MEGA MODE (ON)'}</button>
      <div style="font-size: 9px; color: rgba(255,255,255,0.7); margin-top: 3px; text-align: center;">${filterMode === 'smart' ? 'Removes junk, keeps your interests' : 'Nuclear option - floods everything'}</div>
      <button id="ff-turbo-btn" style="
        width: 100%;
        padding: 10px;
        margin-top: 10px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(255,75,87,0.4);
      ">🚀 MEGA TURBO TRAIN</button>
      <div style="font-size: 9px; color: rgba(255,255,255,0.7); margin-top: 3px; text-align: center;">Weekly reset - trains ALL platforms!</div>
      <div id="ff-progress" style="margin-top: 10px; display: none;">
        <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
          <div id="ff-progress-bar" style="background: #4ade80; height: 100%; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div style="font-size: 10px; margin-top: 5px; text-align: center;" id="ff-progress-text">Training...</div>
      </div>
      <div id="ff-last-action" style="font-size: 11px; opacity: 0.8; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.3);"></div>
    `;

    document.body.appendChild(debugPanel);
    console.log('[Focus Feed] ✓ Debug panel created');

    document.getElementById('ff-mode-toggle').addEventListener('click', toggleFilterMode);
    document.getElementById('ff-turbo-btn').addEventListener('click', activateTurboMode);
  }

  function toggleFilterMode() {
    const newMode = filterMode === 'smart' ? 'mega' : 'smart';
    filterMode = newMode;

    chrome.storage.sync.set({ filterMode: newMode });

    const modeEl = document.getElementById('ff-mode');
    const modeBtn = document.getElementById('ff-mode-toggle');
    const modeDesc = modeBtn.nextElementSibling;

    if (modeEl) modeEl.textContent = newMode.toUpperCase();
    if (modeBtn) {
      if (newMode === 'smart') {
        modeBtn.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
        modeBtn.textContent = '🧠 SMART MODE (ON)';
        if (modeDesc) modeDesc.textContent = 'Removes junk, keeps your interests';
      } else {
        modeBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        modeBtn.textContent = '💥 MEGA MODE (ON)';
        if (modeDesc) modeDesc.textContent = 'Nuclear option - floods everything';
      }
    }

    console.log(`[Focus Feed] Switched to ${newMode.toUpperCase()} MODE`);
    updateDebugPanel(`✓ Switched to ${newMode.toUpperCase()} MODE`);
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

  function activateTurboMode() {
    console.log('[Focus Feed] 🚀🚀🚀 MEGA TURBO MODE ACTIVATED');

    const btn = document.getElementById('ff-turbo-btn');
    const progressDiv = document.getElementById('ff-progress');
    const progressBar = document.getElementById('ff-progress-bar');
    const progressText = document.getElementById('ff-progress-text');

    btn.disabled = true;
    btn.textContent = '⚡ FLOODING ALGORITHMS...';
    progressDiv.style.display = 'block';
    progressBar.style.width = '30%';
    progressText.textContent = 'Opening separate window...';

    chrome.runtime.sendMessage({
      action: 'turboTrain',
      persona: selectedPersona
    }, () => {
      progressBar.style.width = '100%';
      progressText.textContent = '200+ URLs across ALL platforms!';

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '🚀 MEGA TURBO TRAIN';
        progressDiv.style.display = 'none';
        progressBar.style.width = '0%';

        updateDebugPanel('✓ MEGA trained: YouTube, X, Facebook, Instagram, Wikipedia, Reddit...');
      }, 5000);
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
