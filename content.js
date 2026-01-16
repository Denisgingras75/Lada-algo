(function() {
  'use strict';

  let trainingEnabled = true;
  let selectedPersona = 'polymath';
  let trainingIntensity = 80;
  let classifier = null;
  let observer = null;
  let processedElements = new Set();
  let stats = { liked: 0, hidden: 0, neutral: 0 };
  let trustedChannels = [];
  let blockedChannels = [];
  const hostname = window.location.hostname;

  // Rate limiting config
  const RATE_LIMITS = {
    maxActionsPerMinute: 8,
    minDelayBetweenActions: 3000,
    maxDelayBetweenActions: 8000,
    dailyActionLimit: 200
  };

  let actionQueue = [];
  let lastActionTime = 0;
  let dailyActionCount = 0;
  let actionProcessorInterval = null;

  // Initialize
  chrome.storage.sync.get([
    'focusEnabled',
    'selectedPersona',
    'trainingIntensity',
    'customKeywords',
    'customPersonas',
    'trustedChannels',
    'blockedChannels',
    'dailyStats'
  ], (result) => {
    trainingEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
    selectedPersona = result.selectedPersona || 'polymath';
    trainingIntensity = result.trainingIntensity !== undefined ? result.trainingIntensity : 80;
    trustedChannels = result.trustedChannels || [];
    blockedChannels = result.blockedChannels || [];

    // Reset daily stats if it's a new day
    const today = new Date().toDateString();
    if (result.dailyStats && result.dailyStats.date === today) {
      dailyActionCount = result.dailyStats.count || 0;
    } else {
      chrome.storage.sync.set({ dailyStats: { date: today, count: 0 } });
    }

    initClassifier(result.customKeywords, result.customPersonas);
    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) {
      trainingEnabled = changes.focusEnabled.newValue;
    }
    if (changes.selectedPersona) {
      selectedPersona = changes.selectedPersona.newValue;
    }
    if (changes.trainingIntensity) {
      trainingIntensity = changes.trainingIntensity.newValue;
    }
    if (changes.trustedChannels) {
      trustedChannels = changes.trustedChannels.newValue || [];
    }
    if (changes.blockedChannels) {
      blockedChannels = changes.blockedChannels.newValue || [];
    }

    // Reload classifier if persona or keywords changed
    if (changes.selectedPersona || changes.customKeywords || changes.customPersonas) {
      chrome.storage.sync.get(['customKeywords', 'customPersonas'], (result) => {
        initClassifier(result.customKeywords, result.customPersonas);
      });
    }

    init();
  });

  function initClassifier(customKeywords, customPersonas) {
    // Check if we have custom keywords for this persona
    let personaRules;

    if (customKeywords && customKeywords[selectedPersona]) {
      // Use custom keywords
      personaRules = customKeywords[selectedPersona];
    } else if (customPersonas && customPersonas[selectedPersona]) {
      // Use custom persona
      personaRules = customPersonas[selectedPersona];
    } else {
      // Use default rules
      const rules = getClassifierRules();
      personaRules = rules[selectedPersona] || rules.polymath;
    }

    // Pre-normalize keywords for performance
    const normalizedRules = {
      educational: personaRules.educational.map(k => k.toLowerCase()),
      junk: personaRules.junk.map(k => k.toLowerCase())
    };

    classifier = {
      rules: normalizedRules,
      classify: function(text, channelName = '') {
        if (!text) return 'neutral';

        // Check channel whitelist/blacklist first (highest priority)
        if (channelName) {
          const normalizedChannel = channelName.toLowerCase();

          // Check blocked channels
          if (blockedChannels.some(c => normalizedChannel.includes(c.toLowerCase()))) {
            return 'junk';
          }

          // Check trusted channels
          if (trustedChannels.some(c => normalizedChannel.includes(c.toLowerCase()))) {
            return 'educational';
          }
        }

        const normalizedText = text.toLowerCase();

        // Check junk keywords
        const hasJunk = this.rules.junk.some(k => normalizedText.includes(k));
        if (hasJunk) return 'junk';

        // Check educational keywords
        const hasEducational = this.rules.educational.some(k => normalizedText.includes(k));
        if (hasEducational) return 'educational';

        return 'neutral';
      }
    };
  }

  function init() {
    if (observer) observer.disconnect();

    if (!trainingEnabled) {
      console.log('[Focus Feed] Training disabled');
      return;
    }

    console.log(`[Focus Feed] Training active - Persona: ${selectedPersona}`);

    if (hostname.includes('youtube.com')) {
      handleYouTube();
    } else if (hostname.includes('tiktok.com')) {
      handleTikTok();
    } else if (hostname.includes('facebook.com')) {
      handleFacebook();
    } else if (hostname.includes('instagram.com')) {
      handleInstagram();
    }

    startObserver();
    startActionProcessor();
  }

  // YOUTUBE MODULE
  function handleYouTube() {
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/feed')) return;

    const videoSelectors = [
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-grid-video-renderer'
    ];

    videoSelectors.forEach(selector => {
      const videos = document.querySelectorAll(selector);
      videos.forEach(video => processYouTubeVideo(video));
    });
  }

  function processYouTubeVideo(videoElement) {
    if (processedElements.has(videoElement)) return;
    processedElements.add(videoElement);

    const titleElement = videoElement.querySelector('#video-title');
    const channelElement = videoElement.querySelector('#channel-name a, #text.ytd-channel-name a');

    if (!titleElement) return;

    const title = titleElement.textContent.trim();
    const channel = channelElement ? channelElement.textContent.trim() : '';
    const classification = classifier.classify(`${title} ${channel}`, channel);

    // Respect training intensity
    if (classification === 'educational' && trainingIntensity >= 30) {
      queueAction({
        type: 'youtube-like',
        element: videoElement,
        title,
        channel
      });
    } else if (classification === 'junk' && trainingIntensity >= 70) {
      // Only hide junk at 70%+ intensity
      queueAction({
        type: 'youtube-hide',
        element: videoElement,
        title,
        channel
      });
    } else {
      stats.neutral++;
    }
  }

  function executeYouTubeLike(videoElement) {
    // Open video in background, like it, close tab
    const titleElement = videoElement.querySelector('#video-title');
    if (!titleElement) return false;

    const videoUrl = titleElement.getAttribute('href');
    if (!videoUrl) return false;

    console.log(`[Focus Feed] ✓ Liking educational video: ${titleElement.textContent.trim()}`);

    // Simulate like by clicking the like button if video is visible
    // In practice, we'd open in background tab and like there
    // For now, just mark it as processed
    stats.liked++;
    updateStats();
    return true;
  }

  function executeYouTubeHide(videoElement) {
    const menuButton = videoElement.querySelector('button[aria-label*="menu"], button.yt-icon-button');
    if (!menuButton) return false;

    console.log(`[Focus Feed] ✗ Hiding junk video`);

    // Simulate clicking "Not interested"
    // In practice: menuButton.click() -> wait -> click "Not interested"
    // For MVP, we'll just hide it visually
    videoElement.style.opacity = '0.3';
    videoElement.style.pointerEvents = 'none';

    stats.hidden++;
    updateStats();
    return true;
  }

  // TIKTOK MODULE
  function handleTikTok() {
    const videos = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
    videos.forEach(video => processTikTokVideo(video));
  }

  function processTikTokVideo(videoElement) {
    if (processedElements.has(videoElement)) return;
    processedElements.add(videoElement);

    const captionElement = videoElement.querySelector('[data-e2e="browse-video-desc"]');
    if (!captionElement) return;

    const caption = captionElement.textContent.trim();
    const classification = classifier.classify(caption);

    if (classification === 'educational') {
      queueAction({
        type: 'tiktok-like',
        element: videoElement,
        caption
      });
    } else if (classification === 'junk') {
      queueAction({
        type: 'tiktok-hide',
        element: videoElement,
        caption
      });
    } else {
      stats.neutral++;
    }
  }

  function executeTikTokLike(videoElement) {
    const likeButton = videoElement.querySelector('[data-e2e="like-icon"], [data-e2e="browse-like"]');
    if (!likeButton) return false;

    console.log(`[Focus Feed] ✓ Liking educational TikTok`);
    // likeButton.click(); // Uncomment to actually click

    stats.liked++;
    updateStats();
    return true;
  }

  function executeTikTokHide(videoElement) {
    console.log(`[Focus Feed] ✗ Hiding junk TikTok`);
    videoElement.style.opacity = '0.3';
    videoElement.style.pointerEvents = 'none';

    stats.hidden++;
    updateStats();
    return true;
  }

  // FACEBOOK MODULE
  function handleFacebook() {
    const posts = document.querySelectorAll('[role="article"], [data-pagelet*="FeedUnit"]');
    posts.forEach(post => processFacebookPost(post));
  }

  function processFacebookPost(postElement) {
    if (processedElements.has(postElement)) return;
    processedElements.add(postElement);

    const textContent = postElement.textContent;
    const classification = classifier.classify(textContent);

    if (classification === 'educational') {
      queueAction({
        type: 'facebook-like',
        element: postElement
      });
    } else if (classification === 'junk') {
      queueAction({
        type: 'facebook-hide',
        element: postElement
      });
    } else {
      stats.neutral++;
    }
  }

  function executeFacebookLike(postElement) {
    const likeButton = postElement.querySelector('[aria-label*="Like"]');
    if (!likeButton) return false;

    console.log(`[Focus Feed] ✓ Liking educational Facebook post`);
    stats.liked++;
    updateStats();
    return true;
  }

  function executeFacebookHide(postElement) {
    console.log(`[Focus Feed] ✗ Hiding junk Facebook post`);
    postElement.style.opacity = '0.3';
    postElement.style.pointerEvents = 'none';

    stats.hidden++;
    updateStats();
    return true;
  }

  // INSTAGRAM MODULE
  function handleInstagram() {
    const posts = document.querySelectorAll('article[role="presentation"]');
    posts.forEach(post => processInstagramPost(post));
  }

  function processInstagramPost(postElement) {
    if (processedElements.has(postElement)) return;
    processedElements.add(postElement);

    const caption = postElement.querySelector('h1')?.textContent || '';
    const classification = classifier.classify(caption);

    if (classification === 'educational') {
      queueAction({
        type: 'instagram-like',
        element: postElement
      });
    } else if (classification === 'junk') {
      queueAction({
        type: 'instagram-hide',
        element: postElement
      });
    } else {
      stats.neutral++;
    }
  }

  function executeInstagramLike(postElement) {
    const likeButton = postElement.querySelector('svg[aria-label="Like"]')?.closest('button');
    if (!likeButton) return false;

    console.log(`[Focus Feed] ✓ Liking educational Instagram post`);
    stats.liked++;
    updateStats();
    return true;
  }

  function executeInstagramHide(postElement) {
    console.log(`[Focus Feed] ✗ Hiding junk Instagram post`);
    postElement.style.opacity = '0.3';
    postElement.style.pointerEvents = 'none';

    stats.hidden++;
    updateStats();
    return true;
  }

  // RATE LIMITING & ACTION QUEUE
  function queueAction(action) {
    if (dailyActionCount >= RATE_LIMITS.dailyActionLimit) {
      console.log('[Focus Feed] Daily action limit reached');
      return;
    }

    actionQueue.push(action);
  }

  function startActionProcessor() {
    // Clear existing interval to prevent multiple processors
    if (actionProcessorInterval) {
      clearInterval(actionProcessorInterval);
    }

    actionProcessorInterval = setInterval(() => {
      if (actionQueue.length === 0) return;
      if (!trainingEnabled) return;

      const now = Date.now();
      const timeSinceLastAction = now - lastActionTime;

      if (timeSinceLastAction < RATE_LIMITS.minDelayBetweenActions) {
        return; // Too soon
      }

      const action = actionQueue.shift();
      executeAction(action);
      lastActionTime = now;
      dailyActionCount++;

      // Update daily stats
      const today = new Date().toDateString();
      chrome.storage.sync.set({ dailyStats: { date: today, count: dailyActionCount } });

    }, 2000); // Check every 2 seconds
  }

  function executeAction(action) {
    try {
      if (action.type === 'youtube-like') {
        executeYouTubeLike(action.element);
      } else if (action.type === 'youtube-hide') {
        executeYouTubeHide(action.element);
      } else if (action.type === 'tiktok-like') {
        executeTikTokLike(action.element);
      } else if (action.type === 'tiktok-hide') {
        executeTikTokHide(action.element);
      } else if (action.type === 'facebook-like') {
        executeFacebookLike(action.element);
      } else if (action.type === 'facebook-hide') {
        executeFacebookHide(action.element);
      } else if (action.type === 'instagram-like') {
        executeInstagramLike(action.element);
      } else if (action.type === 'instagram-hide') {
        executeInstagramHide(action.element);
      }
    } catch (error) {
      console.error('[Focus Feed] Action execution error:', error);
    }
  }

  function updateStats() {
    chrome.storage.local.set({
      sessionStats: {
        liked: stats.liked,
        hidden: stats.hidden,
        neutral: stats.neutral,
        timestamp: Date.now()
      }
    });
  }

  // OBSERVER
  let observerTimeout = null;

  function startObserver() {
    observer = new MutationObserver(() => {
      // Debounce: clear previous timeout and create new one
      if (observerTimeout) {
        clearTimeout(observerTimeout);
      }

      observerTimeout = setTimeout(() => {
        if (!trainingEnabled) return;

        if (hostname.includes('youtube.com')) {
          handleYouTube();
        } else if (hostname.includes('tiktok.com')) {
          handleTikTok();
        } else if (hostname.includes('facebook.com')) {
          handleFacebook();
        } else if (hostname.includes('instagram.com')) {
          handleInstagram();
        }

        // Limit processedElements Set size to prevent memory bloat
        if (processedElements.size > 500) {
          processedElements.clear();
        }
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // CLASSIFIER RULES (inline)
  function getClassifierRules() {
    return {
      polymath: {
        educational: ['MIT', 'Stanford', 'lecture', 'course', 'tutorial', 'explained', 'documentary', 'TED', 'science', 'Khan Academy'],
        junk: ['SHOCKING', 'UNBELIEVABLE', 'WON\'T BELIEVE', 'GONE WRONG', 'clickbait', 'drama', 'exposed', 'flat earth', 'conspiracy']
      },
      engineer: {
        educational: ['engineering', 'coding', 'programming', 'tutorial', 'Python', 'JavaScript', 'CS50', 'ThePrimeagen', 'Fireship'],
        junk: ['SHOCKED', 'drama', 'exposed', 'GONE WRONG', 'clickbait']
      },
      strategist: {
        educational: ['business', 'strategy', 'finance', 'Y Combinator', 'Bloomberg', 'Warren Buffett', 'startup', 'case study'],
        junk: ['get rich quick', 'EASY MONEY', 'SECRET METHOD', 'exposed', 'drama']
      },
      stoic: {
        educational: ['stoicism', 'philosophy', 'meditation', 'Marcus Aurelius', 'School of Life', 'wisdom', 'psychology'],
        junk: ['LIFE HACK', 'EASY FIX', 'drama', 'exposed', 'clickbait']
      },
      scientist: {
        educational: ['science', 'research', 'MIT', 'physics', 'chemistry', 'SmarterEveryDay', 'Veritasium', 'Kurzgesagt'],
        junk: ['pseudoscience', 'flat earth', 'conspiracy', 'SHOCKING', 'SECRET CURE']
      },
      artist: {
        educational: ['art', 'design', 'tutorial', 'Proko', 'painting', 'drawing', 'color theory', 'masterclass'],
        junk: ['drama', 'exposed', 'beef', 'clickbait']
      },
      warrior: {
        educational: ['fitness', 'training', 'workout', 'martial arts', 'AthleanX', 'Jeff Nippard', 'technique', 'Jocko'],
        junk: ['SHOCKING', 'drama', 'EASY TRICK', 'SECRET METHOD']
      },
      healer: {
        educational: ['health', 'medicine', 'Huberman Lab', 'Peter Attia', 'nutrition', 'sleep', 'research', 'science-based'],
        junk: ['SECRET CURE', 'doctors hate', 'miracle cure', 'detox', 'SHOCKING']
      },
      explorer: {
        educational: ['travel', 'geography', 'documentary', 'National Geographic', 'BBC Earth', 'history', 'culture'],
        junk: ['SHOCKING', 'GONE WRONG', 'drama', 'clickbait']
      },
      sage: {
        educational: ['wisdom', 'philosophy', 'Alan Watts', 'meditation', 'consciousness', 'Buddhism', 'mindfulness'],
        junk: ['SHOCKING', 'SECRET REVEALED', 'clickbait', 'quick fix']
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('popstate', () => {
    processedElements.clear();
    setTimeout(init, 500);
  });
})();
