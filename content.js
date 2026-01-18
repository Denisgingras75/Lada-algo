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
  } else if (hostname.includes('reddit.com')) {
    currentPlatform = 'reddit';
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
      case 'reddit':
        handleReddit();
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

  // ==================== REDDIT ====================
  function handleReddit() {
    console.log('[Focus Feed] Scanning Reddit...');

    // Reddit post selectors (new and old Reddit)
    const posts = document.querySelectorAll(
      'shreddit-post, ' +                    // New Reddit
      'div[data-testid="post-container"], ' + // New Reddit alternative
      'div.Post, ' +                          // Old Reddit
      'div[data-click-id="body"]'            // Old Reddit alternative
    );

    console.log(`[Focus Feed] Found ${posts.length} Reddit posts`);

    posts.forEach(post => processRedditPost(post));
  }

  function processRedditPost(postElement) {
    if (processedElements.has(postElement)) return;
    processedElements.add(postElement);

    // Try to find post title and content
    const titleElement = postElement.querySelector(
      'h1, ' +                                       // New Reddit
      'a[slot="title"], ' +                          // New Reddit alternative
      'h3.PostHeader__post-title-line, ' +          // Old Reddit
      'h3 a.title, ' +                               // Old Reddit alternative
      '[data-adclicklocation="title"]'              // Old Reddit
    );

    const textElements = postElement.querySelectorAll(
      'div[slot="text-body"], ' +                    // New Reddit
      'div.RichTextJSON-root, ' +                    // Old Reddit
      'div.md, ' +                                   // Old Reddit markdown
      'div[data-click-id="text"]'                    // Old Reddit alternative
    );

    let title = titleElement ? titleElement.textContent.trim() : '';
    let bodyText = '';
    textElements.forEach(el => {
      const content = el.textContent?.trim() || '';
      if (content.length > bodyText.length) bodyText = content;
    });

    const fullText = `${title} ${bodyText}`;

    if (!title || title.length < 5) {
      console.log('[Focus Feed] Reddit post has no title or too short');
      return;
    }

    // Get subreddit if possible
    const subredditElement = postElement.querySelector(
      'a[slot="subreddit-prefixed-name"], ' +        // New Reddit
      'faceplate-tracker[source="community_menu"] a, ' + // New Reddit alt
      'a.subreddit'                                  // Old Reddit
    );
    const subreddit = subredditElement ? subredditElement.textContent.trim() : '';

    const classification = classifyContent(fullText, subreddit);
    console.log(`[Focus Feed] Reddit: "${title.substring(0, 50)}..." → ${classification} (${filterMode} mode)`);

    applyClassification(postElement, title, classification, 'reddit');
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
          // Practical skills & tutorials
          'how to', 'tutorial', 'guide', 'explained', 'learn', 'teach', 'education',
          'lesson', 'course', 'masterclass', 'fundamentals', 'basics', 'advanced',
          'step by step', 'beginner guide', 'complete guide', 'full course',
          'deep dive', 'breakdown', 'analysis', 'review', 'critical thinking',
          'walkthrough', 'demonstration', 'instruction', 'training',

          // Life skills
          'productivity', 'self improvement', 'personal development', 'habits',
          'time management', 'problem solving', 'decision making', 'goal setting',
          'communication skills', 'public speaking', 'writing skills', 'reading',
          'organization', 'focus', 'discipline', 'motivation', 'workflow',

          // Finance & career
          'financial literacy', 'budgeting', 'investing', 'career advice', 'resume',
          'interview tips', 'negotiation', 'salary', 'retirement', 'taxes',
          'passive income', 'side hustle', 'freelance', 'entrepreneurship',
          'networking', 'professional development', 'job search', 'career change',
          'financial planning', 'debt management', 'credit score', 'savings',

          // Health & wellness
          'nutrition', 'exercise', 'mental health', 'sleep', 'stress management',
          'mindfulness', 'meditation', 'therapy', 'psychology', 'neuroscience',
          'fitness', 'workout', 'healthy eating', 'wellness', 'self care',
          'anxiety', 'depression', 'cognitive', 'brain health', 'longevity',

          // Home & practical
          'cooking', 'recipe', 'home improvement', 'DIY', 'repair', 'maintenance',
          'gardening', 'cleaning', 'organization', 'decluttering', 'minimalism',

          // General knowledge
          'history', 'geography', 'science', 'technology', 'current events',
          'documentary', 'informative', 'educational', 'factual', 'evidence based',
          'research', 'study', 'academic', 'lecture', 'interview', 'podcast',

          // Trusted sources
          'NPR', 'BBC', 'PBS', 'National Geographic', 'Scientific American',
          'The Economist', 'Wall Street Journal', 'New York Times', 'Reuters',
          'TED', 'Khan Academy', 'Coursera', 'edX', 'MIT', 'Stanford', 'Harvard'
        ],
        junk: [
          // Clickbait all-caps
          'YOU WON\'T BELIEVE', 'SHOCKING', 'UNBELIEVABLE', 'INSANE', 'CRAZY',
          'MIND BLOWING', 'MUST SEE', 'MUST WATCH', 'THIS WILL CHANGE',
          'LIFE CHANGING', 'GAME CHANGER', 'SECRET REVEALED', 'THEY DON\'T WANT',
          'GONE WRONG', 'GONE SEXUAL', 'ALMOST DIED', 'EMOTIONAL', 'IN TEARS',
          'NEVER EXPECTED', 'CAN\'T BELIEVE', 'OMG', 'WTF', 'NO WAY',
          'CRAZY STORY', 'WILD', 'INSANE STORY', 'UNREAL', 'EPIC',

          // Drama & gossip
          'drama', 'tea', 'spill', 'spilling tea', 'exposed', 'exposing',
          'cancelled', 'cancel', 'beef', 'diss track', 'diss', 'shade',
          'throwing shade', 'feud', 'fight', 'destroyed', 'roasted', 'roasting',
          'cringe', 'react', 'reacting', 'reaction', 'response video',
          'calling out', 'clap back', 'rant', 'controversial', 'hot take',

          // Low effort content
          'prank', 'pranking', 'pranks', 'challenge', 'challenges',
          'mukbang', 'haul', 'unboxing', 'unbox', 'vlog', 'vlogging', 'daily vlog',
          '24 hours', '24 hour challenge', 'last to', 'who can', 'trying',
          'vs', 'versus', 'battle', 'tier list', 'ranking',
          'among us', 'fortnite', 'roblox', 'minecraft', 'tiktok compilation',

          // Engagement bait
          'like and subscribe', 'smash that like', 'hit the bell', 'notification squad',
          'comment below', 'let me know', 'drop a comment', 'in the comments',
          'before you go', 'wait till the end', 'watch till end', 'ending will',

          // Misinformation
          'flat earth', 'conspiracy', 'conspiracy theory', 'illuminati',
          'reptilian', 'fake moon landing', 'moon landing hoax', 'chemtrails',
          'anti vax', 'anti vaxx', 'vaccine injury', 'big pharma',
          'miracle cure', 'doctors hate', 'one weird trick', 'secret method',

          // Toxic/aggressive
          'DESTROYING', 'DESTROYS', 'DESTROYED', 'OBLITERATES', 'OBLITERATED',
          'ANNIHILATES', 'OWNS', 'OWNED', 'WRECKS', 'WRECKED', 'SLAMS',
          'DEMOLISHES', 'CRUSHES', 'HUMILIATES', 'EMBARRASSES', 'MURDERS',

          // Spam/scam patterns
          'get rich quick', 'make money fast', 'easy money', 'passive income scam',
          'dropshipping', 'forex trading', 'crypto pump', 'NFT flip',
          'only fans', 'onlyfans', 'link in bio', 'check description'
        ]
      },

      'polymath': {
        educational: [
          // Universities & Institutions
          'MIT', 'Stanford', 'Harvard', 'Yale', 'Princeton', 'Berkeley', 'Caltech',
          'Oxford', 'Cambridge', 'Imperial College', 'ETH Zurich', 'Carnegie Mellon',
          'Columbia', 'Cornell', 'Duke', 'Johns Hopkins', 'Northwestern',
          'University', 'College', 'Institute', 'Academy',

          // Educational Channels
          'Khan Academy', 'TED', 'TED-Ed', 'TEDx', 'Crash Course', 'CrashCourse',
          'Veritasium', 'Kurzgesagt', 'SmarterEveryDay', 'Vsauce',
          '3Blue1Brown', 'Numberphile', 'Computerphile', 'Periodic Videos',
          'MinutePhysics', 'MinuteEarth', 'AsapSCIENCE', 'SciShow',
          'PBS Space Time', 'PBS Eons', 'Physics Girl', 'NileRed',
          'Tom Scott', 'CGP Grey', 'Wendover', 'Real Engineering',
          'Practical Engineering', 'Technology Connections',
          'Lex Fridman', 'Andrew Huberman', 'Peter Attia',

          // STEM Subjects
          'physics', 'quantum physics', 'astrophysics', 'cosmology', 'astronomy',
          'mathematics', 'calculus', 'linear algebra', 'differential equations',
          'statistics', 'probability', 'number theory', 'topology', 'geometry',
          'chemistry', 'organic chemistry', 'biochemistry', 'molecular biology',
          'genetics', 'microbiology', 'neuroscience', 'cognitive science',
          'computer science', 'algorithm', 'data structure', 'machine learning',
          'artificial intelligence', 'programming', 'software engineering',
          'engineering', 'electrical engineering', 'mechanical engineering',

          // Humanities & Social Sciences
          'philosophy', 'ethics', 'epistemology', 'metaphysics', 'logic',
          'history', 'world history', 'ancient history', 'medieval',
          'economics', 'microeconomics', 'macroeconomics', 'behavioral economics',
          'psychology', 'sociology', 'anthropology', 'political science',
          'linguistics', 'literature', 'poetry', 'rhetoric',

          // Academic terms
          'lecture', 'seminar', 'symposium', 'conference', 'presentation',
          'dissertation', 'thesis', 'research', 'study', 'experiment',
          'theory', 'hypothesis', 'methodology', 'empirical', 'quantitative',
          'peer reviewed', 'scholarly', 'academic', 'scientific method',

          // Learning phrases
          'explained simply', 'explained in', 'introduction to', 'fundamentals of',
          'beginner guide', 'complete guide', 'comprehensive', 'in-depth',
          'from scratch', 'step by step', 'deep dive', 'breakdown',
          'case study', 'analysis', 'critical analysis'
        ],
        junk: [
          // All common-sense junk keywords
          'YOU WON\'T BELIEVE', 'SHOCKING', 'UNBELIEVABLE', 'INSANE', 'CRAZY',
          'drama', 'tea', 'exposed', 'cancelled', 'beef',
          'prank', 'challenge', 'mukbang', 'haul', 'vlog',
          'flat earth', 'conspiracy', 'anti vax', 'miracle cure',
          'DESTROYING', 'OBLITERATES', 'OWNS', 'SLAMS',

          // Academic pseudoscience
          'debunked', 'mainstream science wrong', 'they don\'t teach',
          'hidden knowledge', 'suppressed research', 'big science',
          'quantum healing', 'law of attraction', 'manifesting'
        ]
      },

      'engineer': {
        educational: [
          // Programming Languages
          'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust',
          'Swift', 'Kotlin', 'Ruby', 'PHP', 'SQL', 'R', 'Scala', 'Elixir',
          'Haskell', 'Clojure', 'Dart', 'Shell', 'Bash', 'PowerShell',

          // Frameworks & Libraries
          'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Node.js',
          'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'Spring Boot',
          'Rails', 'Laravel', 'TensorFlow', 'PyTorch', 'Keras',
          'jQuery', 'Bootstrap', 'Tailwind', 'Material UI',

          // DevOps & Cloud
          'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'GCP',
          'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI',
          'Terraform', 'Ansible', 'Chef', 'Puppet',
          'microservices', 'serverless', 'lambda', 'containers',

          // CS Fundamentals
          'algorithm', 'data structure', 'Big O', 'complexity', 'optimization',
          'sorting', 'searching', 'graph', 'tree', 'linked list', 'hash table',
          'dynamic programming', 'recursion', 'object oriented', 'functional',
          'design pattern', 'SOLID', 'clean code', 'refactoring',

          // Development Topics
          'tutorial', 'course', 'bootcamp', 'project', 'build', 'create',
          'explained', 'guide', 'introduction', 'how to build', 'from scratch',
          'system design', 'architecture', 'API design', 'database design',
          'testing', 'unit test', 'integration test', 'TDD', 'debugging',
          'performance', 'security', 'authentication', 'authorization',
          'git', 'version control', 'CI/CD', 'agile', 'scrum',

          // Educational Channels/People
          'CS50', 'freeCodeCamp', 'Traversy Media', 'The Net Ninja',
          'Fireship', 'ThePrimeagen', 'Computerphile', 'Hussein Nasser',
          'Coding Train', 'Tech With Tim', 'Corey Schafer', 'ArjanCodes',
          'Theo', 'Web Dev Simplified', 'Kevin Powell', 'Ben Awad'
        ],
        junk: [
          // All common-sense junk
          'SHOCKING', 'drama', 'exposed', 'GONE WRONG', 'clickbait',
          'prank', 'challenge', 'react', 'roast', 'beef', 'cancelled',

          // Tech scams
          'get rich quick', 'make money coding', 'easy money', 'passive income',
          'coding bootcamp scam', '$100k in 3 months', 'learn to code fast',
          'AI will replace', 'coding is dead', 'you don\'t need',

          // Hype/bandwagon
          'is dead', 'will kill', 'the future of', 'game changer',
          'revolutionary', 'disrupting', 'the next big thing'
        ]
      },

      'strategist': {
        educational: [
          // Business & Strategy
          'business', 'strategy', 'business strategy', 'competitive advantage',
          'market analysis', 'business model', 'value proposition', 'disruption',
          'innovation', 'entrepreneurship', 'startup', 'scale', 'growth',
          'product market fit', 'go to market', 'GTM', 'TAM', 'SAM', 'SOM',

          // Finance & Investing
          'finance', 'investing', 'investment', 'stock market', 'portfolio',
          'diversification', 'asset allocation', 'risk management', 'valuation',
          'financial analysis', 'fundamental analysis', 'technical analysis',
          'value investing', 'index fund', 'ETF', 'dividend', 'compound interest',
          'DCF', 'P/E ratio', 'cash flow', 'balance sheet', 'income statement',

          // Economics
          'economics', 'microeconomics', 'macroeconomics', 'monetary policy',
          'fiscal policy', 'supply and demand', 'market efficiency', 'game theory',
          'behavioral economics', 'incentives', 'trade', 'globalization',
          'GDP', 'inflation', 'interest rates', 'recession', 'market cycle',

          // Business Sources
          'Y Combinator', 'Harvard Business Review', 'HBR', 'a16z',
          'Bloomberg', 'CNBC', 'Financial Times', 'Wall Street Journal', 'WSJ',
          'The Economist', 'McKinsey', 'BCG', 'Bain', 'Deloitte',
          'Warren Buffett', 'Charlie Munger', 'Ray Dalio', 'Peter Thiel',
          'Naval Ravikant', 'Patrick O\'Shaughnessy', 'Ben Thompson',

          // Business Topics
          'case study', 'business case', 'ROI', 'unit economics', 'metrics',
          'KPI', 'OKR', 'pricing', 'marketing', 'sales', 'operations',
          'supply chain', 'logistics', 'management', 'leadership',
          'negotiation', 'decision making', 'critical thinking',

          // Analysis Terms
          'explained', 'analysis', 'breakdown', 'deep dive', 'framework',
          'model', 'theory', 'principle', 'lesson', 'insight', 'strategy'
        ],
        junk: [
          // All common-sense junk
          'SHOCKING', 'drama', 'exposed', 'beef', 'cancelled',
          'prank', 'challenge', 'vlog', 'INSANE',

          // Get-rich-quick
          'get rich quick', 'EASY MONEY', 'SECRET METHOD', 'MILLIONAIRE OVERNIGHT',
          'passive income lie', 'dropshipping scam', 'crypto scam', 'NFT scam',
          'forex scam', 'binary options', 'pump and dump', 'ponzi scheme',
          'multi level marketing', 'MLM', 'pyramid scheme', 'network marketing',
          'make money while you sleep', 'quit your job', 'financial freedom hack',

          // Guru/hustle culture
          'grind culture', 'hustle porn', 'rise and grind', '10X',
          'sigma male', 'alpha', 'mindset shift', 'victim mentality',
          'limiting beliefs', 'manifestation', 'law of attraction'
        ]
      },

      'health': {
        educational: [
          // Medical & Science
          'medicine', 'medical', 'health', 'healthcare', 'doctor', 'physician',
          'research', 'study', 'clinical trial', 'peer reviewed', 'evidence based',
          'Mayo Clinic', 'Johns Hopkins', 'Cleveland Clinic', 'WebMD',
          'NIH', 'CDC', 'WHO', 'FDA', 'medical journal',

          // Nutrition & Diet
          'nutrition', 'diet', 'healthy eating', 'meal prep', 'macros',
          'protein', 'carbohydrates', 'fats', 'vitamins', 'minerals',
          'registered dietitian', 'nutritionist', 'whole foods', 'plant based',
          'mediterranean diet', 'balanced diet', 'calorie', 'metabolism',

          // Fitness & Exercise
          'exercise', 'workout', 'training', 'fitness', 'strength training',
          'cardio', 'HIIT', 'yoga', 'pilates', 'running', 'cycling',
          'form check', 'technique', 'progressive overload', 'recovery',
          'physical therapy', 'physiotherapy', 'mobility', 'flexibility',

          // Mental Health
          'mental health', 'therapy', 'counseling', 'psychology', 'psychiatry',
          'cognitive behavioral therapy', 'CBT', 'mindfulness', 'meditation',
          'anxiety', 'depression', 'stress management', 'coping strategies',
          'emotional regulation', 'self care', 'boundaries',

          // Sleep & Recovery
          'sleep', 'sleep hygiene', 'circadian rhythm', 'REM sleep', 'recovery',
          'rest', 'sleep quality', 'insomnia', 'sleep science',

          // Experts & Channels
          'Dr.', 'MD', 'PhD', 'Andrew Huberman', 'Peter Attia', 'Rhonda Patrick',
          'Matthew Walker', 'Layne Norton', 'Jeff Nippard', 'Renaissance Periodization'
        ],
        junk: [
          // All common-sense junk
          'SHOCKING', 'INSANE', 'drama', 'exposed', 'GONE WRONG',

          // Health misinformation
          'miracle cure', 'doctors hate', 'big pharma doesn\'t want',
          'cure cancer', 'secret remedy', 'ancient secret', 'detox',
          'cleanse', 'toxins', 'superfoods', 'fat burning',
          'lose weight fast', 'belly fat', 'get abs in', 'transformation',
          'before and after', 'quick fix', 'easy trick',

          // Pseudoscience
          'anti vax', 'vaccine injury', 'natural immunity',
          'essential oils cure', 'alkaline', 'gluten free' (when not celiac),
          'raw water', 'activated charcoal', 'juice cleanse'
        ]
      },

      'creative': {
        educational: [
          // Art & Design
          'art', 'design', 'graphic design', 'illustration', 'drawing',
          'painting', 'digital art', 'traditional art', 'concept art',
          'character design', 'environment design', 'color theory',
          'composition', 'perspective', 'anatomy', 'lighting',
          'Adobe', 'Photoshop', 'Illustrator', 'Procreate', 'Blender',

          // Music
          'music theory', 'composition', 'songwriting', 'production',
          'mixing', 'mastering', 'recording', 'DAW', 'Ableton', 'Logic Pro',
          'guitar lesson', 'piano lesson', 'vocal technique', 'harmony',
          'melody', 'rhythm', 'chord progression', 'scales',

          // Video & Film
          'filmmaking', 'cinematography', 'video editing', 'directing',
          'screenwriting', 'color grading', 'sound design', 'lighting',
          'camera', 'lens', 'composition', 'storytelling',
          'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve',

          // Writing
          'writing', 'creative writing', 'storytelling', 'narrative',
          'character development', 'plot', 'structure', 'dialogue',
          'editing', 'grammar', 'style', 'voice', 'poetry',

          // Photography
          'photography', 'camera', 'exposure', 'aperture', 'shutter speed',
          'ISO', 'composition', 'lighting', 'portrait', 'landscape',
          'Lightroom', 'photo editing',

          // Channels/Resources
          'tutorial', 'lesson', 'course', 'masterclass', 'workshop',
          'critique', 'review', 'analysis', 'technique', 'fundamentals'
        ],
        junk: [
          // All common-sense junk
          'SHOCKING', 'drama', 'tea', 'exposed', 'cancelled', 'beef',
          'prank', 'challenge', 'vlog', 'haul', 'unboxing',

          // Art drama
          'art drama', 'artist beef', 'calling out', 'cancelled artist',
          'art theft', 'traced', 'stolen art' (unless educational),

          // Low effort
          'speedpaint', 'satisfying', 'oddly satisfying', 'ASMR',
          'beginner vs pro', 'cheap vs expensive', '$1 vs $1000'
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
