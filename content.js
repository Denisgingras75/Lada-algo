(function() {
  'use strict';

  let trainingEnabled = true;
  let selectedPersona = 'polymath';
  let trainingIntensity = 80;
  let classifier = null;
  let observer = null;
  let processedElements = new Set();
  // We use local stats for speed, sync for persistence
  let stats = { liked: 0, hidden: 0, neutral: 0 };
  let trustedChannels = [];
  let blockedChannels = [];
  const hostname = window.location.hostname;

  // --- AGGRESSIVE CONFIG ---
  const RATE_LIMITS = {
    maxActionsPerMinute: 60,      // increased from 8
    minDelayBetweenActions: 500,  // reduced from 3000ms to 500ms
    dailyActionLimit: 1000        // increased from 200
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

    const today = new Date().toDateString();
    if (result.dailyStats && result.dailyStats.date === today) {
      dailyActionCount = result.dailyStats.count || 0;
    } else {
      chrome.storage.sync.set({ dailyStats: { date: today, count: 0 } });
    }

    // Init classifier from the shared file
    if (typeof ContentClassifier !== 'undefined') {
        classifier = new ContentClassifier(selectedPersona);
    } else {
        console.error("[Focus Feed] CRITICAL: classifier.js not loaded.");
    }

    init();
  });

  // Listen for live setting changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) trainingEnabled = changes.focusEnabled.newValue;
    if (changes.selectedPersona) {
        selectedPersona = changes.selectedPersona.newValue;
        // Re-init classifier on persona change
        if (typeof ContentClassifier !== 'undefined') {
            classifier = new ContentClassifier(selectedPersona);
        }
    }
  });

  function init() {
    if (observer) observer.disconnect();
    if (!trainingEnabled) return;

    console.log(`[Focus Feed] 🚀 ENGINE STARTED: ${selectedPersona} @ ${trainingIntensity}% intensity`);
    
    // Initial Scan
    runScan();

    // Start observing DOM for scrolling
    startObserver();
    
    // Start the action worker
    startActionProcessor();
  }

  function runScan() {
    // Dispatch to correct platform handler
    if (hostname.includes('youtube.com')) handleYouTube();
    else if (hostname.includes('tiktok.com')) handleTikTok();
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) handleX();
    else if (hostname.includes('facebook.com')) handleFacebook();
    else if (hostname.includes('instagram.com')) handleInstagram();
  }

  // --- REPLACEMENT ENGINE (Visual Feedback) ---
  function replaceWithPreset(element, contentTitle) {
    if (!element || element.dataset.focusProcessed) return;
    
    // Fallback if presets aren't loaded
    if (typeof FOCUS_PRESETS === 'undefined' || !FOCUS_PRESETS[selectedPersona]) return;

    const personaContent = FOCUS_PRESETS[selectedPersona];
    const types = ['fact', 'quote', 'headline'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let htmlContent = '';
    
    if (type === 'fact') {
        const fact = personaContent.facts[Math.floor(Math.random() * personaContent.facts.length)];
        htmlContent = `
            <div class="focus-ad-replacement focus-fact" style="padding:20px; border:1px solid #333; border-radius:8px; background:#111; color:#eee; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:10px; color:#667eea; text-transform:uppercase; margin-bottom:5px;">${selectedPersona} Fact</div>
                <div style="font-size:14px; line-height:1.4;">${fact}</div>
            </div>`;
    } else if (type === 'quote') {
        const quote = personaContent.quotes[Math.floor(Math.random() * personaContent.quotes.length)];
        htmlContent = `
            <div class="focus-ad-replacement focus-quote" style="padding:20px; border:1px solid #333; border-radius:8px; background:#111; color:#eee; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:10px; color:#f093fb; text-transform:uppercase; margin-bottom:5px;">Wisdom</div>
                <div style="font-size:14px; font-style:italic;">${quote}</div>
            </div>`;
    } else {
        const headline = personaContent.headlines[Math.floor(Math.random() * personaContent.headlines.length)];
        htmlContent = `
            <div class="focus-ad-replacement" style="padding:20px; border:1px solid #333; border-radius:8px; background:#111; color:#eee; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:10px; color:#aaa; text-transform:uppercase; margin-bottom:5px;">Recommended</div>
                <a href="${headline.link}" target="_blank" style="color:#fff; text-decoration:none; font-weight:bold; font-size:14px;">${headline.title}</a>
            </div>`;
    }

    // Force replacement
    element.innerHTML = htmlContent;
    element.dataset.focusProcessed = "true"; // Mark DOM
    
    stats.hidden++;
    updateStats();
  }

  // --- X / TWITTER HANDLER (NEW) ---
  function handleX() {
    // Select tweets in the timeline
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(tweet => {
        if (processedElements.has(tweet)) return;
        processedElements.add(tweet);

        const textEl = tweet.querySelector('[data-testid="tweetText"]');
        if (!textEl) return;

        const text = textEl.textContent;
        const classification = classifier.classify(text);

        if (classification === 'educational') {
            queueAction({ type: 'x-like', element: tweet });
        } else if (classification === 'junk') {
            // Replace the tweet content (keep the container so timeline flow works)
            const contentContainer = textEl.closest('div[lang]') || textEl.parentElement;
            if (contentContainer) replaceWithPreset(contentContainer, text);
        } else {
            stats.neutral++;
            updateStats();
        }
    });
  }

  function executeXLike(tweetElement) {
    const likeButton = tweetElement.querySelector('[data-testid="like"]');
    const unlikeButton = tweetElement.querySelector('[data-testid="unlike"]');
    
    // If already liked, skip
    if (unlikeButton) return false;

    if (likeButton) {
        likeButton.click();
        console.log(`[Focus Feed] ✓ Liked Tweet`);
        stats.liked++;
        updateStats();
        return true;
    }
    return false;
  }

  // --- YOUTUBE HANDLER ---
  function handleYouTube() {
    // Handles Home, Feed, and Watch Next
    const selectors = [
        'ytd-rich-item-renderer', // Home feed
        'ytd-compact-video-renderer', // Sidebar
        'ytd-video-renderer', // Search results
        'ytd-reel-item-renderer' // Shorts
    ];
    
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(video => {
            if (processedElements.has(video)) return;
            processedElements.add(video);

            const titleEl = video.querySelector('#video-title');
            if (!titleEl) return;
            
            const title = titleEl.textContent.trim();
            const classification = classifier.classify(title); // Simple classify for speed

            if (classification === 'educational' && trainingIntensity >= 30) {
                queueAction({ type: 'youtube-like', element: video });
            } else if (classification === 'junk') {
                replaceWithPreset(video, title);
            }
        });
    });
  }

  function executeYouTubeLike(videoElement) {
    // YouTube Home feed videos often DON'T have a like button visible. 
    // We only try to click if it exists (e.g. Shorts or inline player).
    const likeButton = videoElement.querySelector('#like-button button, button[aria-label*="like this video"]');
    if (likeButton) {
        likeButton.click();
        console.log(`[Focus Feed] ✓ Liked YouTube Video`);
        stats.liked++;
        updateStats();
        return true;
    }
    // Note: We cannot like standard home feed videos without opening them. 
    return false;
  }

  // --- TIKTOK HANDLER ---
  function handleTikTok() {
    const videos = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
    videos.forEach(video => {
        if (processedElements.has(video)) return;
        processedElements.add(video);

        const desc = video.querySelector('[data-e2e="browse-video-desc"]');
        if (!desc) return;

        const text = desc.textContent;
        const classification = classifier.classify(text);

        if (classification === 'educational') {
            queueAction({ type: 'tiktok-like', element: video });
        } else if (classification === 'junk') {
            replaceWithPreset(video, text);
        }
    });
  }

  function executeTikTokLike(videoElement) {
    const likeBtn = videoElement.querySelector('[data-e2e="like-icon"]');
    if (likeBtn) {
        likeBtn.click();
        console.log(`[Focus Feed] ✓ Liked TikTok`);
        stats.liked++;
        updateStats();
        return true;
    }
    return false;
  }

  // --- FACEBOOK & INSTAGRAM STUBS (Similar Logic) ---
  function handleFacebook() { /* ... implementation similar to X ... */ }
  function handleInstagram() { /* ... implementation similar to X ... */ }

  // --- ACTION PROCESSOR ---
  function queueAction(action) {
    if (dailyActionCount >= RATE_LIMITS.dailyActionLimit) return;
    actionQueue.push(action);
  }

  function startActionProcessor() {
    if (actionProcessorInterval) clearInterval(actionProcessorInterval);
    
    actionProcessorInterval = setInterval(() => {
      if (actionQueue.length === 0 || !trainingEnabled) return;

      const now = Date.now();
      if (now - lastActionTime < RATE_LIMITS.minDelayBetweenActions) return;

      const action = actionQueue.shift();
      const success = executeAction(action);
      
      if (success) {
          lastActionTime = now;
          dailyActionCount++;
          chrome.storage.sync.set({ dailyStats: { date: new Date().toDateString(), count: dailyActionCount } });
      }
    }, 200); // Check queue very frequently (200ms)
  }

  function executeAction(action) {
    try {
        if (action.type === 'x-like') return executeXLike(action.element);
        if (action.type === 'youtube-like') return executeYouTubeLike(action.element);
        if (action.type === 'tiktok-like') return executeTikTokLike(action.element);
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
  }

  // --- STATS SYNC ---
  function updateStats() {
    // Save to local storage immediately for popup to read
    chrome.storage.local.set({
        sessionStats: {
            liked: stats.liked,
            hidden: stats.hidden,
            neutral: stats.neutral,
            timestamp: Date.now()
        }
    });
  }

  // --- OBSERVER (SCROLL DETECTOR) ---
  function startObserver() {
    // 1. Run immediately
    runScan();

    // 2. Observer for scrolling
    observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        for (const m of mutations) {
            if (m.addedNodes.length > 0) {
                shouldScan = true; 
                break;
            }
        }
        if (shouldScan) runScan();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Memory Cleanup (FIFO)
    setInterval(() => {
        if (processedElements.size > 800) {
            const arr = Array.from(processedElements);
            processedElements = new Set(arr.slice(300));
        }
    }, 30000);
  }
})();
