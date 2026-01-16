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

    // Initialize the Classifier from classifier.js
    initClassifier(result.customKeywords, result.customPersonas);
    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) trainingEnabled = changes.focusEnabled.newValue;
    if (changes.selectedPersona) selectedPersona = changes.selectedPersona.newValue;
    if (changes.trainingIntensity) trainingIntensity = changes.trainingIntensity.newValue;
    if (changes.trustedChannels) trustedChannels = changes.trustedChannels.newValue || [];
    if (changes.blockedChannels) blockedChannels = changes.blockedChannels.newValue || [];

    if (changes.selectedPersona || changes.customKeywords || changes.customPersonas) {
      chrome.storage.sync.get(['customKeywords', 'customPersonas'], (result) => {
        initClassifier(result.customKeywords, result.customPersonas);
      });
    }
  });

  function initClassifier(customKeywords, customPersonas) {
    // We now rely on ContentClassifier from classifier.js
    // If the user has custom keywords/personas, we would pass them into a modified constructor
    // For now, we instantiate the base classifier with the selected persona
    if (typeof ContentClassifier !== 'undefined') {
        classifier = new ContentClassifier(selectedPersona);
        // Note: Full custom keyword support would require updating classifier.js to accept overrides
        // For this update, we are focusing on connecting the files.
    } else {
        console.error("[Focus Feed] classifier.js not loaded!");
    }
  }

  function init() {
    if (observer) observer.disconnect();
    if (!trainingEnabled) {
      console.log('[Focus Feed] Training disabled');
      return;
    }

    console.log(`[Focus Feed] Training active - Persona: ${selectedPersona}`);
    
    // Initial scan
    runScan();

    startObserver();
    startActionProcessor();
  }

  function runScan() {
    if (hostname.includes('youtube.com')) handleYouTube();
    else if (hostname.includes('tiktok.com')) handleTikTok();
    else if (hostname.includes('facebook.com')) handleFacebook();
    else if (hostname.includes('instagram.com')) handleInstagram();
  }

  // --- PRESET REPLACEMENT ENGINE ---
  function replaceWithPreset(element, contentTitle) {
    if (!element) return;
    
    // Access the global FOCUS_PRESETS from presets.js
    // If undefined, fallback or exit
    if (typeof FOCUS_PRESETS === 'undefined' || !FOCUS_PRESETS[selectedPersona]) return;

    const personaContent = FOCUS_PRESETS[selectedPersona];
    
    // Pick a random type of content to show
    const types = ['fact', 'quote', 'headline'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let htmlContent = '';
    
    // Generate HTML based on styles.css classes
    if (type === 'fact') {
        const fact = personaContent.facts[Math.floor(Math.random() * personaContent.facts.length)];
        htmlContent = `
            <div class="focus-ad-replacement focus-fact" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <div class="focus-ad-badge">Did You Know?</div>
                <div class="focus-ad-content">${fact}</div>
            </div>
        `;
    } else if (type === 'quote') {
        const quote = personaContent.quotes[Math.floor(Math.random() * personaContent.quotes.length)];
        htmlContent = `
            <div class="focus-ad-replacement focus-quote" style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <div class="focus-ad-badge">Wisdom</div>
                <div class="focus-ad-content" style="font-style: italic;">${quote}</div>
            </div>
        `;
    } else {
        const headline = personaContent.headlines[Math.floor(Math.random() * personaContent.headlines.length)];
        htmlContent = `
            <div class="focus-ad-replacement" style="background: #1a1a1a; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <div class="focus-ad-badge">Relevant News</div>
                <a href="${headline.link}" target="_blank" class="focus-ad-content" style="text-decoration: none; font-weight: bold;">${headline.title}</a>
                <div style="font-size: 11px; color: #666; margin-top: 4px;">Source: ${headline.source}</div>
            </div>
        `;
    }

    // Replace the content
    // We preserve the element dimensions but swap innerHTML
    element.innerHTML = htmlContent;
    element.style.opacity = '1'; // Ensure it's visible
    element.style.pointerEvents = 'auto'; // Allow clicking links
    
    // Mark as processed/hidden so we don't process again
    stats.hidden++;
    updateStats();
  }

  // --- PLATFORM HANDLERS ---

  // YOUTUBE
  function handleYouTube() {
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/feed')) return;
    const videoSelectors = ['ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-grid-video-renderer'];
    videoSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(video => processYouTubeVideo(video));
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
    const classification = classifier.classifyVideo(title, channel);

    if (classification === 'educational' && trainingIntensity >= 30) {
      queueAction({ type: 'youtube-like', element: videoElement, title });
    } else if (classification === 'junk' && trainingIntensity >= 70) {
      // INSTEAD OF HIDING, WE REPLACE
      replaceWithPreset(videoElement, title);
    } else {
      stats.neutral++;
    }
  }

  function executeYouTubeLike(videoElement) {
    // Try to find the inline like button (shorts or grid sometimes show it on hover)
    // For main feed, we often can't click 'like' without opening the video.
    // However, if this is a Short or active video page:
    const likeButton = videoElement.querySelector('button[aria-label*="like this video"], #like-button button');
    
    if (likeButton) {
        likeButton.click();
        console.log(`[Focus Feed] ✓ Liked video`);
        stats.liked++;
        updateStats();
        return true;
    }
    // If we can't click it (because it's just a thumbnail in the feed), we skip the action 
    // to avoid false positives in stats, or we could add to a "Watch Later" queue if we wanted to get fancy.
    return false;
  }


  // TIKTOK
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
      queueAction({ type: 'tiktok-like', element: videoElement });
    } else if (classification === 'junk') {
       // Replace the entire container content
       replaceWithPreset(videoElement, caption);
    }
  }

  function executeTikTokLike(videoElement) {
    const likeButton = videoElement.querySelector('[data-e2e="like-icon"], [data-e2e="browse-like"]');
    if (likeButton) {
        likeButton.click();
        console.log(`[Focus Feed] ✓ Liked TikTok`);
        stats.liked++;
        updateStats();
        return true;
    }
    return false;
  }

  // --- GENERIC UTILS ---

  function queueAction(action) {
    if (dailyActionCount >= RATE_LIMITS.dailyActionLimit) return;
    actionQueue.push(action);
  }

  function startActionProcessor() {
    if (actionProcessorInterval) clearInterval(actionProcessorInterval);
    actionProcessorInterval = setInterval(() => {
      if (actionQueue.length === 0 || !trainingEnabled) return;
      
      const now = Date.now();
      if (now - lastActionTime < 3000) return; // Minimum 3s delay

      const action = actionQueue.shift();
      executeAction(action);
      lastActionTime = now;
      dailyActionCount++;
      
      chrome.storage.sync.set({ dailyStats: { date: new Date().toDateString(), count: dailyActionCount } });
    }, 2000);
  }

  function executeAction(action) {
    try {
      if (action.type === 'youtube-like') executeYouTubeLike(action.element);
      else if (action.type === 'tiktok-like') executeTikTokLike(action.element);
      // Add other handlers...
    } catch (error) {
      console.error('[Focus Feed] Execution error:', error);
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

  // FIFO Memory Management for performance
  function startObserver() {
    observer = new MutationObserver((mutations) => {
       // Debounce slightly
       if (window.feedUpdateTimeout) clearTimeout(window.feedUpdateTimeout);
       window.feedUpdateTimeout = setTimeout(runScan, 1000);
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Clean up memory periodically
    setInterval(() => {
        if (processedElements.size > 500) {
            // Convert to array, slice, recreate set (simple FIFO approximation)
            const arr = Array.from(processedElements);
            processedElements = new Set(arr.slice(200)); 
        }
    }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
