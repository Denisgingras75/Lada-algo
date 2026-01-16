(function() {
  'use strict';

  // --- SAFETY CHECK ---
  if (typeof FOCUS_PRESETS === 'undefined') {
    console.error("[Focus Feed] ❌ CRITICAL ERROR: presets.js is missing or not loaded. Replacements will fail.");
  }
  if (typeof ContentClassifier === 'undefined') {
    console.error("[Focus Feed] ❌ CRITICAL ERROR: classifier.js is missing or not loaded. Detection will fail.");
  }

  // --- CONFIG ---
  let trainingEnabled = true;
  let selectedPersona = 'polymath';
  let trainingIntensity = 80;
  let classifier = null;
  let observer = null;
  let processedElements = new Set();
  const hostname = window.location.hostname;
  
  // Rate limits
  const RATE_LIMITS = { maxActionsPerMinute: 60, minDelayBetweenActions: 500, dailyActionLimit: 2000 };
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
    
    // Ensure Stats Exist
    if (!result.lifetimeStats) {
        chrome.storage.sync.set({ lifetimeStats: { liked: 0, hidden: 0 } });
    }

    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusEnabled) trainingEnabled = changes.focusEnabled.newValue;
    if (changes.selectedPersona) {
        selectedPersona = changes.selectedPersona.newValue;
        if (typeof ContentClassifier !== 'undefined') classifier = new ContentClassifier(selectedPersona);
    }
  });

  function init() {
    if (!trainingEnabled) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('focus_mode') === 'turbo') {
        console.log(`[Focus Feed] 👻 GHOST MODE ACTIVE`);
        runTurboSequence();
        return;
    }

    console.log(`[Focus Feed] Active: ${selectedPersona}`);
    runScan();
    startObserver();
    startActionProcessor();
  }

  // --- TURBO SEQUENCE ---
  function runTurboSequence() {
     let attempts = 0;
     const interval = setInterval(() => {
         const results = document.querySelectorAll('ytd-video-renderer');
         if (results.length > 0) {
             clearInterval(interval);
             let actions = 0;
             for (let i = 0; i < Math.min(results.length, 3); i++) {
                 const video = results[i];
                 const likeBtn = video.querySelector('#like-button button, button[aria-label*="like"]');
                 if (likeBtn) { likeBtn.click(); actions++; }
                 
                 const subBtn = video.querySelector('ytd-subscribe-button-renderer button');
                 if (subBtn && !subBtn.hasAttribute('subscribed')) { subBtn.click(); actions++; }
             }
             
             if (actions > 0) incrementLifetimeStats('liked', actions);

             setTimeout(() => { window.close(); }, 2500);
         }
         attempts++;
         if (attempts > 20) { clearInterval(interval); window.close(); }
     }, 500);
  }

  // --- NORMAL SCAN ---
  function runScan() {
    if (hostname.includes('youtube.com')) handleYouTube();
    else if (hostname.includes('tiktok.com')) handleTikTok();
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) handleX();
  }

  // --- REPLACEMENT ENGINE ---
  function replaceWithPreset(element, contentTitle) {
    if (!element || element.dataset.focusProcessed) return;
    
    // PRESET CHECK
    if (typeof FOCUS_PRESETS === 'undefined' || !FOCUS_PRESETS[selectedPersona]) {
        console.warn(`[Focus Feed] Missing presets for ${selectedPersona}`);
        return;
    }

    const personaContent = FOCUS_PRESETS[selectedPersona];
    const types = ['fact', 'quote', 'headline'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let htmlContent = '';
    
    if (type === 'fact') {
        const fact = personaContent.facts[Math.floor(Math.random() * personaContent.facts.length)];
        htmlContent = `<div class="focus-ad-replacement focus-fact" style="padding:20px; border:1px solid #333; border-radius:8px; background:#111; color:#eee; height:100%; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:10px; color:#667eea; text-transform:uppercase; margin-bottom:5px;">${selectedPersona} Fact</div><div style="font-size:14px; line-height:1.4;">${fact}</div></div>`;
    } else if (type === 'quote') {
        const quote = personaContent.quotes[Math.floor(Math.random() * personaContent.quotes.length)];
        htmlContent = `<div class="focus-ad-replacement focus-quote" style="padding:20px; border:1px solid #333; border-radius:8px; background:#111; color:#eee; height:100%; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:10px; color:#f093fb; text-transform:uppercase; margin-bottom:5px;">Wisdom</div><div style="font-size:14px; font-style:italic;">${quote}</div></div>`;
    } else {
        const headline = personaContent.headlines[Math.floor(Math.random() * personaContent.headlines.length)];
        htmlContent = `<div class="focus-ad-replacement" style="padding:20px; border:1px solid #333; border-radius:8px; background:#111; color:#eee; height:100%; display:flex; flex-direction:column; justify-content:center;"><div style="font-size:10px; color:#aaa; text-transform:uppercase; margin-bottom:5px;">Recommended</div><a href="${headline.link}" target="_blank" style="color:#fff; text-decoration:none; font-weight:bold; font-size:14px;">${headline.title}</a></div>`;
    }

    element.innerHTML = htmlContent;
    element.dataset.focusProcessed = "true";
    incrementLifetimeStats('hidden', 1);
  }

  // --- HANDLERS ---
  function handleYouTube() {
    const selectors = ['ytd-rich-item-renderer', 'ytd-compact-video-renderer', 'ytd-video-renderer'];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(video => {
            if (processedElements.has(video)) return;
            processedElements.add(video);

            const title = video.querySelector('#video-title')?.textContent.trim();
            if (title) {
                const classification = classifier.classify(title);
                if (classification === 'educational' && Math.random() * 100 < trainingIntensity) {
                    queueAction({ type: 'youtube-like', element: video });
                } else if (classification === 'junk') {
                    replaceWithPreset(video, title);
                }
            }
        });
    });
  }

  function handleX() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(tweet => {
        if (processedElements.has(tweet)) return;
        processedElements.add(tweet);
        const textEl = tweet.querySelector('[data-testid="tweetText"]');
        if (textEl) {
            const text = textEl.textContent;
            const classification = classifier.classify(text);
            if (classification === 'educational') queueAction({ type: 'x-like', element: tweet });
            else if (classification === 'junk') {
                 const container = textEl.closest('div[lang]') || textEl.parentElement;
                 if (container) replaceWithPreset(container, text);
            }
        }
    });
  }

  function handleTikTok() {
     const videos = document.querySelectorAll('[data-e2e="recommend-list-item-container"]');
     videos.forEach(video => {
        if (processedElements.has(video)) return;
        processedElements.add(video);
        const desc = video.querySelector('[data-e2e="browse-video-desc"]');
        if (desc) {
            const classification = classifier.classify(desc.textContent);
            if (classification === 'educational') queueAction({ type: 'tiktok-like', element: video });
            else if (classification === 'junk') replaceWithPreset(video, desc.textContent);
        }
    });
  }

  // --- ACTIONS ---
  function executeYouTubeLike(el) {
    const btn = el.querySelector('#like-button button, button[aria-label*="like"]');
    if (btn && btn.getAttribute('aria-pressed') !== 'true') { btn.click(); return true; }
    return false;
  }
  function executeXLike(el) {
    const btn = el.querySelector('[data-testid="like"]');
    const unlike = el.querySelector('[data-testid="unlike"]');
    if (btn && !unlike) { btn.click(); return true; }
    return false;
  }
  function executeTikTokLike(el) {
    const btn = el.querySelector('[data-e2e="like-icon"]');
    if (btn) { btn.click(); return true; }
    return false;
  }

  // --- QUEUE ---
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
          incrementLifetimeStats('liked', 1);
      }
    }, 200);
  }

  function executeAction(action) {
    try {
        if (action.type === 'youtube-like') return executeYouTubeLike(action.element);
        if (action.type === 'x-like') return executeXLike(action.element);
        if (action.type === 'tiktok-like') return executeTikTokLike(action.element);
    } catch(e) { console.error(e); }
    return false;
  }

  function incrementLifetimeStats(type, amount) {
    chrome.storage.sync.get(['lifetimeStats'], (res) => {
        const stats = res.lifetimeStats || { liked: 0, hidden: 0 };
        stats[type] = (stats[type] || 0) + (amount || 0);
        chrome.storage.sync.set({ lifetimeStats: stats });
    });
  }

  function startObserver() {
    observer = new MutationObserver((mutations) => {
        if (mutations.some(m => m.addedNodes.length)) runScan();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    setInterval(() => {
        if (processedElements.size > 800) {
            const arr = Array.from(processedElements);
            processedElements = new Set(arr.slice(300));
        }
    }, 30000);
  }
})();
