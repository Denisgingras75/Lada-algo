(function() {
  'use strict';

  let trainingEnabled = true;
  let selectedPersona = 'common-sense';
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
    } else if (message.action === 'playAndLikeVideo') {
      playAndLikeVideo();
      sendResponse({ success: true });
    }
    return true;
  });

  // Function to PLAY and LIKE video (stronger signal)
  function playAndLikeVideo() {
    try {
      // First, try to play the video
      const playButton = document.querySelector('button.ytp-play-button');
      const video = document.querySelector('video');

      if (video && video.paused) {
        console.log('[Focus Feed] ▶️ Playing video:', document.title);
        video.play();
      } else if (playButton) {
        playButton.click();
      }

      // Then like it (after 2 second delay)
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

      // ALSO SUBSCRIBE to channel (even stronger signal)
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
    selectedPersona = result.selectedPersona || 'common-sense';
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
      <div style="font-size: 9px; color: rgba(255,255,255,0.7); margin-top: 3px; text-align: center;">Trains ALL platforms at once!</div>
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

    // Add turbo button click handler
    document.getElementById('ff-turbo-btn').addEventListener('click', activateTurboMode);
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
      'common-sense': {
        educational: [
          // Practical skills
          'how to', 'tutorial', 'guide', 'explained', 'learn', 'teach', 'education',
          'lesson', 'course', 'masterclass', 'fundamentals', 'basics', 'advanced',
          'step by step', 'beginner guide', 'complete guide', 'full course',
          'deep dive', 'breakdown', 'analysis', 'review', 'critical thinking',

          // Life skills
          'productivity', 'self improvement', 'personal development', 'habits',
          'time management', 'critical thinking', 'problem solving', 'decision making',
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
      },

      polymath: {
        educational: [
          // Universities & Institutions (expanded)
          'MIT', 'Stanford', 'Harvard', 'Yale', 'Princeton', 'Berkeley', 'Caltech',
          'Oxford', 'Cambridge', 'Imperial College', 'ETH Zurich', 'Carnegie Mellon',
          'Columbia', 'Cornell', 'Duke', 'Johns Hopkins', 'Northwestern', 'Penn',
          'University of Chicago', 'UCLA', 'Michigan', 'UC Berkeley', 'UT Austin',

          // Educational Channels (massive expansion)
          'Khan Academy', 'TED', 'TED-Ed', 'TEDx', 'Crash Course', 'CrashCourse',
          'Veritasium', 'Kurzgesagt', 'SmarterEveryDay', 'Vsauce', 'Vsauce2', 'Vsauce3',
          '3Blue1Brown', 'Numberphile', 'Computerphile', 'Periodic Videos',
          'MinutePhysics', 'MinuteEarth', 'AsapSCIENCE', 'SciShow', 'PBS Space Time',
          'PBS Eons', 'Physics Girl', 'ElectroBOOM', 'NileRed', 'NileBlue',
          'Steve Mould', 'Mark Rober', 'Tom Scott', 'CGP Grey', 'Wendover',
          'Real Engineering', 'Practical Engineering', 'Technology Connections',
          'Up and Atom', 'Looking Glass Universe', 'Domain of Science',
          'Two Minute Papers', 'Lex Fridman', 'Andrew Huberman', 'Peter Attia',

          // Content Type Phrases (multi-word strings)
          'explained simply', 'explained in', 'how it works', 'introduction to',
          'beginner guide', 'complete guide', 'full course', 'free course',
          'online course', 'lecture series', 'lecture notes', 'study guide',
          'learn in', 'master class', 'deep dive into', 'breakdown of',
          'analysis of', 'understanding', 'comprehensive guide', 'step by step',
          'from scratch', 'for beginners', 'fundamentals of', 'basics of',
          'advanced', 'intermediate', 'tutorial series', 'educational video',
          'documentary film', 'scientific explanation', 'research paper',
          'peer reviewed', 'evidence based', 'data driven', 'case study',

          // Academic Terms
          'lecture', 'seminar', 'symposium', 'conference', 'presentation',
          'dissertation', 'thesis', 'research', 'study', 'experiment', 'theory',
          'hypothesis', 'methodology', 'empirical', 'quantitative', 'qualitative',

          // Subjects (massive expansion)
          // STEM
          'physics', 'quantum physics', 'astrophysics', 'cosmology', 'astronomy',
          'mathematics', 'calculus', 'linear algebra', 'differential equations',
          'statistics', 'probability', 'number theory', 'topology', 'geometry',
          'chemistry', 'organic chemistry', 'biochemistry', 'molecular biology',
          'genetics', 'microbiology', 'neuroscience', 'cognitive science',
          'computer science', 'algorithms', 'data structures', 'machine learning',
          'artificial intelligence', 'programming', 'coding', 'software engineering',
          'electrical engineering', 'mechanical engineering', 'civil engineering',

          // Humanities & Social Sciences
          'philosophy', 'ethics', 'epistemology', 'metaphysics', 'logic',
          'history', 'world history', 'ancient history', 'medieval history',
          'economics', 'microeconomics', 'macroeconomics', 'behavioral economics',
          'psychology', 'sociology', 'anthropology', 'political science',
          'linguistics', 'literature', 'poetry', 'rhetoric', 'critical theory',

          // Arts & Culture
          'art history', 'music theory', 'film analysis', 'architecture',
          'classical music', 'opera', 'jazz theory', 'composition',

          // Skills
          'critical thinking', 'scientific method', 'logical reasoning',
          'problem solving', 'analytical thinking', 'systems thinking',

          // Formats
          'documentary', 'educational', 'informative', 'instructional',
          'academic', 'scholarly', 'intellectual', 'cerebral', 'rigorous'
        ],
        junk: [
          // Extreme clickbait (expanded)
          'YOU WON\'T BELIEVE', 'WILL SHOCK YOU', 'SHOCKING TRUTH', 'UNBELIEVABLE',
          'MOST INSANE', 'CRAZIEST', 'WILDEST', 'MOST SHOCKING', 'INCREDIBLE',
          'MIND BLOWING', 'MIND BLOWN', 'BLEW MY MIND', 'CHANGED MY LIFE',
          'LIFE CHANGING', 'GAME CHANGER', 'EVERYTHING CHANGED', 'RUINED MY LIFE',
          'ALMOST DIED', 'NEARLY KILLED', 'WENT HORRIBLY WRONG', 'TOTAL DISASTER',
          'EPIC FAIL', 'FAIL COMPILATION', 'FAILS', 'FUNNY FAILS',

          // Secret/conspiracy clickbait
          'SECRET', 'SECRETS REVEALED', 'HIDDEN TRUTH', 'THEY DON\'T WANT YOU',
          'THEY\'RE HIDING', 'COVER UP', 'EXPOSED', 'TRUTH EXPOSED',
          'WHAT THEY DON\'T TELL YOU', 'INDUSTRY SECRET', 'LEAKED',

          // Emotional manipulation
          'EMOTIONAL', 'CRIED', 'IN TEARS', 'CRYING', 'HEARTBREAKING',
          'WILL MAKE YOU CRY', 'SAD STORY', 'TOUCHING', 'INSPIRATIONAL FAIL',

          // Drama & gossip (expanded)
          'drama', 'tea', 'spilling tea', 'all the tea', 'drama alert',
          'exposed', 'exposing', 'calling out', 'cancelled', 'cancel culture',
          'beef', 'diss track', 'diss', 'shots fired', 'shade', 'throwing shade',
          'feud', 'fight', 'argument', 'destroyed', 'roasted', 'roasting',
          'cringe', 'cringe compilation', 'reaction', 'reacting to', 'react',
          'commentary', 'my thoughts on', 'hot take', 'unpopular opinion',

          // Low quality formats
          'prank', 'pranking', 'prank war', 'epic prank', 'gone wrong',
          'challenge', 'challenges', '24 hour challenge', '24 hours in',
          'last to leave', 'last to', 'who can', 'trying', 'we tried',
          'mukbang', 'eating', 'food challenge', 'taste test',
          'haul', 'shopping haul', 'unboxing', 'unbox', 'first impressions',
          'vlog', 'daily vlog', 'day in my life', 'vlogging',
          'among us', 'fortnite', 'minecraft', 'roblox', 'tiktok',

          // Versus/battle content
          'vs', 'versus', 'battle', 'rap battle', 'roast battle',
          'who wore it better', 'comparison', 'tier list',

          // Misinformation & pseudoscience
          'flat earth', 'flat earther', 'conspiracy', 'conspiracy theory',
          'illuminati', 'reptilian', 'new world order', 'deep state',
          'fake moon landing', 'moon landing hoax', 'chemtrails',
          'anti vax', 'anti vaxx', 'vaccine injury', 'big pharma conspiracy',
          'miracle cure', 'doctors hate this', 'one weird trick',
          'detox', 'cleanse', 'toxins', 'manifesting', 'law of attraction',

          // Toxic/aggressive language
          'DESTROYING', 'DESTROYS', 'DESTROYED', 'OBLITERATES', 'OBLITERATED',
          'ANNIHILATES', 'OWNS', 'OWNED', 'WRECKS', 'WRECKED', 'SLAMS',
          'DEMOLISHES', 'CRUSHES', 'HUMILIATES', 'EMBARRASSES',

          // Spam patterns
          'LIKE AND SUBSCRIBE', 'SMASH THAT LIKE', 'HIT THE BELL',
          'DON\'T FORGET TO', 'MAKE SURE TO', 'BEFORE YOU GO',
          'WAIT UNTIL THE END', 'WATCH TILL THE END', 'ENDING WILL',

          // Sexual/inappropriate
          'GONE SEXUAL', 'SEXUAL', 'SEXY', 'HOT', 'THICC', 'THIRST TRAP',
          'ONLY FANS', 'ONLYFANS', 'SPICY', 'NAUGHTY', 'INAPPROPRIATE'
        ]
      },

      engineer: {
        educational: [
          // Programming languages & frameworks
          'programming', 'coding', 'software engineering', 'development',
          'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift',
          'Kotlin', 'TypeScript', 'Ruby', 'PHP', 'SQL', 'R', 'Scala',
          'React', 'Angular', 'Vue', 'Node', 'Django', 'Flask', 'Spring',
          'TensorFlow', 'PyTorch', 'Kubernetes', 'Docker', 'AWS', 'Azure',

          // CS Fundamentals
          'algorithm', 'data structure', 'Big O', 'complexity', 'optimization',
          'sorting', 'searching', 'graph', 'tree', 'linked list', 'hash table',
          'dynamic programming', 'recursion', 'object oriented', 'functional',

          // Educational channels
          'CS50', 'freeCodeCamp', 'Traversy Media', 'The Net Ninja',
          'Fireship', 'ThePrimeagen', 'Code Bullet', 'Computerphile',
          'Hussein Nasser', 'Coding Train', 'Derek Banas', 'Sentdex',
          'Tech With Tim', 'Corey Schafer', 'ArjanCodes', 'mCoding',

          // Topics
          'system design', 'architecture', 'design patterns', 'clean code',
          'testing', 'debugging', 'refactoring', 'performance', 'security',
          'database design', 'API design', 'microservices', 'DevOps',
          'CI/CD', 'git', 'version control', 'agile', 'scrum',

          // Learning phrases
          'tutorial', 'course', 'bootcamp', 'project', 'build', 'create',
          'explained', 'guide to', 'introduction to', 'how to build',
          'step by step', 'from scratch', 'for beginners', 'crash course'
        ],
        junk: [
          'SHOCKING', 'drama', 'exposed', 'GONE WRONG', 'clickbait',
          'prank', 'challenge', 'react', 'roast', 'beef', 'cancelled',
          'UNBELIEVABLE', 'INSANE', 'MIND BLOWING', 'SECRET', 'THEY HIDE',
          'get rich quick', 'make money fast', 'easy money', 'passive income scam'
        ]
      },

      strategist: {
        educational: [
          // Business & Strategy
          'business', 'strategy', 'business strategy', 'competitive advantage',
          'market analysis', 'business model', 'value proposition', 'disruption',
          'innovation', 'entrepreneurship', 'startup', 'scale up', 'growth',

          // Finance & Investing
          'finance', 'investing', 'investment', 'stock market', 'portfolio',
          'diversification', 'asset allocation', 'risk management', 'valuation',
          'financial analysis', 'fundamental analysis', 'technical analysis',
          'value investing', 'index fund', 'ETF', 'dividend', 'compound interest',

          // Economics
          'economics', 'microeconomics', 'macroeconomics', 'monetary policy',
          'fiscal policy', 'supply and demand', 'market efficiency', 'game theory',
          'behavioral economics', 'incentives', 'trade', 'globalization',

          // Sources & Channels
          'Y Combinator', 'Stanford Business', 'Harvard Business Review',
          'Bloomberg', 'CNBC', 'Financial Times', 'Wall Street Journal',
          'Warren Buffett', 'Charlie Munger', 'Ray Dalio', 'Peter Thiel',
          'Naval Ravikant', 'Patrick O\'Shaughnessy', 'Ben Thompson',
          'The Economist', 'McKinsey', 'BCG', 'Bain',

          // Topics
          'case study', 'business case', 'ROI', 'unit economics', 'metrics',
          'KPI', 'OKR', 'product market fit', 'go to market', 'pricing',
          'marketing', 'sales', 'operations', 'supply chain', 'logistics',
          'management', 'leadership', 'negotiation', 'decision making',

          // Learning phrases
          'explained', 'analysis', 'breakdown', 'deep dive', 'framework',
          'model', 'theory', 'principle', 'lesson', 'insight'
        ],
        junk: [
          'get rich quick', 'EASY MONEY', 'SECRET METHOD', 'MILLIONAIRE OVERNIGHT',
          'passive income lie', 'dropshipping scam', 'crypto scam', 'NFT scam',
          'forex scam', 'binary options', 'pump and dump', 'ponzi scheme',
          'multi level marketing', 'MLM', 'pyramid scheme',
          'exposed', 'drama', 'beef', 'cancelled', 'SHOCKING', 'UNBELIEVABLE',
          'one weird trick', 'secret the rich', 'what billionaires', 'they hide'
        ]
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

  // MEGA TURBO MODE: Floods ALL algorithms across ALL platforms
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

    // Send MEGA TURBO command with current persona
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

        updateDebugPanel('✓ MEGA trained: YouTube, X, Facebook, Instagram, Wikipedia, Reddit, Medium, Quora, GitHub...');
      }, 5000);
    });
  }

  function searchAndAddEducationalVideos(videos, progressBar, progressText, btn) {
    // Educational search queries
    const searches = [
      'MIT OpenCourseWare',
      'Stanford lecture',
      'Veritasium',
      'Kurzgesagt',
      '3Blue1Brown',
      'Khan Academy tutorial',
      'TED talk science',
      'Harvard lecture'
    ];

    const searchQuery = searches[Math.floor(Math.random() * searches.length)];

    progressText.textContent = `Searching for: ${searchQuery}...`;
    progressBar.style.width = '50%';

    // Navigate to search (will trigger new scan)
    window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
