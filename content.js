(function() {
  'use strict';

  // --- CONFIG ---
  let trainingEnabled = true;
  let selectedPersona = 'polymath';
  let trainingIntensity = 80;
  let classifier = null;
  let observer = null;
  let processedElements = new Set();
  const hostname = window.location.hostname;
  
  // Rate limits (Aggressive)
  const RATE_LIMITS = { maxActionsPerMinute: 60, minDelayBetweenActions: 800, dailyActionLimit: 1000 };
  let actionQueue = [];
  let lastActionTime = 0;
  let dailyActionCount = 0;
  let actionProcessorInterval = null;

  // --- INIT ---
  chrome.storage.sync.get(['focusEnabled', 'selectedPersona', 'trainingIntensity', 'dailyStats', 'lifetimeStats'], (result) => {
    trainingEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
    selectedPersona = result.selectedPersona || 'polymath';
    trainingIntensity = result.trainingIntensity !== undefined ? result.trainingIntensity : 80;
    
    // Init Classifier
    if (typeof ContentClassifier !== 'undefined') {
        classifier = new ContentClassifier(selectedPersona);
    }

    init();
  });

  // (Keep your storage listeners here...)

  function init() {
    if (observer) observer.disconnect();
    if (!trainingEnabled) return;
    console.log(`[Focus Feed] ⚡ SIGNAL FLOODING ACTIVE: ${selectedPersona}`);
    runScan();
    startObserver();
    startActionProcessor();
  }

  function runScan() {
    // Platform Routing
    if (hostname.includes('youtube.com')) {
        if (window.location.pathname.includes('/results')) handleYouTubeSearch(); // NEW
        else handleYouTube();
    } 
    else if (hostname.includes('tiktok.com')) handleTikTok();
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) handleX();
  }

  // --- PRESET REPLACEMENT (Keep your existing function) ---
  function replaceWithPreset(element, contentTitle) {
     // ... (Your existing replacement logic) ...
     // Make sure you update stats!
     incrementLifetimeStats('hidden');
  }

  // --- NEW: YOUTUBE SEARCH HANDLER (For Turbo Train) ---
  function handleYouTubeSearch() {
    const results = document.querySelectorAll('ytd-video-renderer, ytd-reel-item-renderer');
    
    // Only process the top 3 results to save resources/prevent spam detection
    for (let i = 0; i < Math.min(results.length, 3); i++) {
        const video = results[i];
        if (processedElements.has(video)) continue;
        processedElements.add(video);

        const title = video.querySelector('#video-title')?.textContent.trim();
        const classification = classifier.classify(title);

        if (classification === 'educational') {
            // Queue a like/interaction
            queueAction({ type: 'youtube-like', element: video });
            
            // STRONG SIGNAL: Queue a subscribe if possible
            queueAction({ type: 'youtube-subscribe', element: video });
        }
    }
  }

  // --- UPDATED YOUTUBE FEED HANDLER ---
  function handleYouTube() {
    const selectors = ['ytd-rich-item-renderer', 'ytd-compact-video-renderer', 'ytd-video-renderer'];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(video => {
            if (processedElements.has(video)) return;
            processedElements.add(video);

            const title = video.querySelector('#video-title')?.textContent.trim();
            const classification = classifier.classify(title);

            if (classification === 'educational') {
                if (Math.random() * 100 < trainingIntensity) {
                    queueAction({ type: 'youtube-like', element: video });
                    
                    // 20% chance to Subscribe on regular feed (don't overdo it)
                    if (Math.random() < 0.2) queueAction({ type: 'youtube-subscribe', element: video });
                }
            } else if (classification === 'junk') {
                replaceWithPreset(video, title);
            }
        });
    });
  }

  // --- EXECUTION LOGIC (Added Subscribe) ---
  function executeYouTubeLike(el) {
    // Look for various button types (inline, shorts, etc)
    const btn = el.querySelector('#like-button button, button[aria-label*="like"]');
    if (btn && btn.getAttribute('aria-pressed') !== 'true') {
        btn.click();
        console.log(`[Focus Feed] Like sent.`);
        return true;
    }
    return false;
  }

  function executeYouTubeSubscribe(el) {
    // This is tricky as the subscribe button isn't always inside the video card in feeds.
    // It usually works best on the Watch Page or Search Results.
    const subBtn = el.querySelector('ytd-subscribe-button-renderer button, button[aria-label*="Subscribe"]');
    
    // Check if valid and NOT already subscribed
    if (subBtn && !subBtn.hasAttribute('subscribed') && subBtn.textContent.includes('Subscribe')) {
        subBtn.click();
        console.log(`[Focus Feed] 🌟 AUTO-SUBSCRIBED for maximum signal.`);
        return true;
    }
    return false;
  }

  // ... (Keep TikTok/X Handlers from previous turn) ...

  // --- ACTION QUEUE ---
  function executeAction(action) {
    try {
        let success = false;
        if (action.type === 'youtube-like') success = executeYouTubeLike(action.element);
        if (action.type === 'youtube-subscribe') success = executeYouTubeSubscribe(action.element); // NEW
        if (action.type === 'tiktok-like') success = executeTikTokLike(action.element);
        if (action.type === 'x-like') success = executeXLike(action.element);
        
        if (success) incrementLifetimeStats('liked');
        return success;
    } catch(e) { console.error(e); return false; }
  }

  // ... (Keep queue processing and stats logic from previous turn) ...
  
  function incrementLifetimeStats(type) {
    chrome.storage.sync.get(['lifetimeStats'], (result) => {
        const stats = result.lifetimeStats || { liked: 0, hidden: 0 };
        stats[type] = (stats[type] || 0) + 1;
        chrome.storage.sync.set({ lifetimeStats: stats });
    });
  }

  // ... (Keep Observer logic) ...
  function startObserver() {
    observer = new MutationObserver((mutations) => {
        if (mutations.some(m => m.addedNodes.length)) runScan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

})();
