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
  let debugPanel = null;

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
    createDebugPanel();
  }

  // Debug panel to show what's happening
  function createDebugPanel() {
    if (debugPanel) return; // Already exists

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
  }

  function updateDebugPanel(action = null) {
    if (!debugPanel) return;

    document.getElementById('ff-educational').textContent = stats.liked;
    document.getElementById('ff-junk').textContent = stats.hidden;
    document.getElementById('ff-neutral').textContent = stats.neutral;

    if (action) {
      const lastActionEl = document.getElementById('ff-last-action');
      lastActionEl.textContent = action;
      lastActionEl.style.animation = 'none';
      setTimeout(() => {
        lastActionEl.style.animation = 'pulse 0.5s';
      }, 10);
    }
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
      updateDebugPanel(`✅ Found: ${title.substring(0, 40)}...`);
    } else if (classification === 'junk' && trainingIntensity >= 70) {
      // Only hide junk at 70%+ intensity
      queueAction({
        type: 'youtube-hide',
        element: videoElement,
        title,
        channel
      });
      updateDebugPanel(`❌ Hiding: ${title.substring(0, 40)}...`);
    } else {
      stats.neutral++;
      updateDebugPanel(`Checked: ${title.substring(0, 40)}...`);
    }
  }

  function executeYouTubeLike(videoElement) {
    const titleElement = videoElement.querySelector('#video-title');
    if (!titleElement) return false;

    const videoUrl = titleElement.getAttribute('href');
    if (!videoUrl) return false;

    const title = titleElement.textContent.trim();
    console.log(`[Focus Feed] ✓ Marking educational: "${title}"`);

    // Strategy: Add visual indicator that this was classified as educational
    // YouTube doesn't expose like buttons on feed thumbnails, so we can't directly like
    // The user will naturally click and watch these videos, which trains the algorithm

    // Add a green border to indicate educational content
    videoElement.style.border = '2px solid #4ade80';
    videoElement.style.borderRadius = '8px';

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
      pointer-events: none;
    `;
    badge.textContent = '✓ Educational';

    const thumbnail = videoElement.querySelector('ytd-thumbnail, #thumbnail');
    if (thumbnail) {
      thumbnail.style.position = 'relative';
      thumbnail.appendChild(badge);
    }

    stats.liked++;
    updateStats();
    return true;
  }

  function executeYouTubeHide(videoElement) {
    // Find the 3-dot menu button
    const menuButton = videoElement.querySelector('button[aria-label="Action menu"], button#button[aria-label*="menu"], ytd-menu-renderer button');
    if (!menuButton) {
      console.log('[Focus Feed] ⚠️ Menu button not found');
      return false;
    }

    const titleElement = videoElement.querySelector('#video-title');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown';
    console.log(`[Focus Feed] ✗ Hiding junk: "${title}"`);

    try {
      // Click the menu button
      menuButton.click();

      // Wait for menu to appear, then click "Not interested"
      setTimeout(() => {
        // Look for "Not interested" option in the popup menu
        const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-listbox ytd-menu-service-item-renderer');

        for (let item of menuItems) {
          const text = item.textContent.toLowerCase();
          if (text.includes('not interested') || text.includes('don\'t recommend')) {
            console.log('[Focus Feed] ✓ Clicking "Not interested"');
            item.click();

            // Hide the video visually too
            videoElement.style.transition = 'opacity 0.5s';
            videoElement.style.opacity = '0.2';
            videoElement.style.filter = 'grayscale(100%)';

            stats.hidden++;
            updateStats();
            return true;
          }
        }

        // If we couldn't find "Not interested", just hide visually
        console.log('[Focus Feed] ⚠️ Could not find "Not interested" option, hiding visually');
        videoElement.style.opacity = '0.2';
        videoElement.style.filter = 'grayscale(100%)';
        videoElement.style.pointerEvents = 'none';

        stats.hidden++;
        updateStats();
      }, 500); // Wait 500ms for menu to render

      return true;
    } catch (error) {
      console.error('[Focus Feed] Error hiding video:', error);
      return false;
    }
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
    updateDebugPanel();
  }

  function startObserver() {
    observer = new MutationObserver((mutations) => {
        if (mutations.some(m => m.addedNodes.length)) runScan();
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
        educational: [
          // Universities & Institutions
          'MIT', 'Stanford', 'Harvard', 'Yale', 'Berkeley', 'Oxford', 'Cambridge',
          // Educational Channels
          'Khan Academy', 'TED', 'Crash Course', 'Veritasium', 'Kurzgesagt',
          'SmarterEveryDay', 'Vsauce', '3Blue1Brown', 'Numberphile',
          // Content Types
          'lecture', 'course', 'tutorial', 'explained', 'documentary', 'science',
          'learn', 'education', 'study', 'lesson', 'guide', 'how to', 'introduction',
          'review', 'analysis', 'breakdown', 'deep dive', 'masterclass',
          // Subject Matter
          'physics', 'mathematics', 'chemistry', 'biology', 'history', 'philosophy',
          'engineering', 'programming', 'coding', 'research', 'theory'
        ],
        junk: [
          // Clickbait
          'SHOCKING', 'UNBELIEVABLE', 'WON\'T BELIEVE', 'YOU WON\'T', 'INSANE',
          'MIND BLOWING', 'GONE WRONG', 'GONE SEXUAL',
          // Drama
          'drama', 'exposed', 'cancelled', 'beef', 'diss track', 'tea', 'shade',
          'cringe', 'roast', 'destroyed', 'react',
          // Misinformation
          'flat earth', 'conspiracy', 'illuminati', 'fake', 'hoax',
          // Low quality
          'clickbait', 'vlog', 'prank', 'challenge', '24 hours', 'vs', 'fortnite'
        ]
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
})();
