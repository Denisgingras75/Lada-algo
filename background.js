// Background service worker - MEGA ALGORITHM FLOOD
// Opens SEPARATE WINDOW with tabs across ALL platforms
// Auto-closes when done - doesn't interrupt user

let videoQueue = [];
let isProcessing = false;
let processedVideos = new Set();
let activeTabs = new Set();
let trainingWindow = null;
const MAX_PARALLEL_TABS = 20; // Open 20 tabs at once across all platforms

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'likeVideo') {
    handleLikeVideo(message.videoUrl, message.title);
    sendResponse({ success: true });
  } else if (message.action === 'turboTrain') {
    handleMegaTurboTrain(message.persona);
    sendResponse({ success: true });
  } else if (message.action === 'getQueueStatus') {
    sendResponse({ queueLength: videoQueue.length, isProcessing, activeTabs: activeTabs.size });
  }
  return true;
});

// MEGA TURBO: Train across ALL platforms simultaneously
async function handleMegaTurboTrain(persona) {
  console.log(`[Focus Feed MEGA] 🚀🚀🚀 MEGA TURBO ACTIVATED - Persona: ${persona}`);

  // Generate educational URLs across ALL platforms
  const urls = generateEducationalUrls(persona);

  console.log(`[Focus Feed MEGA] Generated ${urls.length} URLs across all platforms`);

  // Create SEPARATE window (doesn't interrupt user)
  trainingWindow = await chrome.windows.create({
    url: urls.slice(0, MAX_PARALLEL_TABS), // First batch
    focused: false, // Don't steal focus
    type: 'normal',
    state: 'minimized' // Minimized so it doesn't interrupt
  });

  // Track tabs in this window
  chrome.tabs.query({ windowId: trainingWindow.id }, (tabs) => {
    tabs.forEach(tab => activeTabs.add(tab.id));
  });

  // Open remaining URLs in batches
  let currentIndex = MAX_PARALLEL_TABS;
  const batchInterval = setInterval(async () => {
    if (currentIndex >= urls.length) {
      clearInterval(batchInterval);
      // Close window after all tabs complete
      setTimeout(() => {
        if (trainingWindow) {
          chrome.windows.remove(trainingWindow.id).catch(() => {});
          console.log('[Focus Feed MEGA] ✓ Training window closed');
        }
      }, 15000); // Keep window open for 15 seconds total
      return;
    }

    // Open next batch
    const batch = urls.slice(currentIndex, currentIndex + 5);
    batch.forEach(url => {
      chrome.tabs.create({
        url: url,
        windowId: trainingWindow.id,
        active: false
      });
    });

    currentIndex += 5;
  }, 3000); // New batch every 3 seconds
}

// Generate educational URLs for all platforms
function generateEducationalUrls(persona) {
  const urls = [];

  // YOUTUBE - Educational videos (20+ URLs)
  const youtubeChannels = [
    // Top educational channels
    'MIT', 'Stanford', 'Harvard', 'Yale', 'Caltech', 'Berkeley',
    'Khan Academy', 'TED', 'TEDEd', 'CrashCourse',
    'Veritasium', 'Kurzgesagt', '3Blue1Brown', 'Numberphile',
    'SmarterEveryDay', 'Vsauce', 'MinutePhysics', 'AsapSCIENCE',
    'SciShow', 'PBS Space Time', 'PBS Eons', 'Physics Girl',
    'Mark Rober', 'Tom Scott', 'CGP Grey', 'Real Engineering',
    'Lex Fridman', 'Andrew Huberman', 'Peter Attia'
  ];

  youtubeChannels.slice(0, 15).forEach(channel => {
    urls.push(`https://www.youtube.com/results?search_query=${encodeURIComponent(channel)}`);
  });

  // X/TWITTER - Educational accounts to visit (20+ URLs)
  const twitterAccounts = [
    // Scientists & Educators
    'elonmusk', 'naval', 'waitbutwhy', 'neiltyson', 'BillNye',
    'michiokaku', 'richard_dawkins', 'SamHarrisOrg', 'sapinker',
    // News & Analysis
    'TheEconomist', 'FT', 'WSJ', 'nytimes', 'Reuters', 'BBCWorld',
    'NPR', 'NatGeo', 'ScienceNews', 'NatureNews',
    // Tech & Business
    'paulg', 'pmarca', 'sama', 'chamath', 'jason',
    'patrickc', 'benedictevans', 'stratechery', 'anothercohen'
  ];

  twitterAccounts.slice(0, 15).forEach(account => {
    urls.push(`https://twitter.com/${account}`);
    urls.push(`https://x.com/${account}`);
  });

  // FACEBOOK - Educational pages (15+ URLs)
  const facebookPages = [
    'TED', 'NationalGeographic', 'NASA', 'ScienceNews', 'BBCNews',
    'TheEconomist', 'MIT', 'Stanford', 'Harvard', 'NPR',
    'PBS', 'SmithsonianMag', 'ScientificAmerican', 'Nature', 'Science'
  ];

  facebookPages.slice(0, 10).forEach(page => {
    urls.push(`https://www.facebook.com/${page}`);
  });

  // INSTAGRAM - Educational profiles (15+ URLs)
  const instagramProfiles = [
    'natgeo', 'nasa', 'science', 'ted_talks', 'smithsonian',
    'sciencenews', 'mit', 'stanford', 'harvard', 'theeconomist',
    'nytimes', 'bbcnews', 'pbs', 'npr', 'scientificamerican'
  ];

  instagramProfiles.slice(0, 10).forEach(profile => {
    urls.push(`https://www.instagram.com/${profile}/`);
  });

  // WIKIPEDIA - Educational articles (30+ URLs)
  const wikiTopics = [
    // Science
    'Quantum_mechanics', 'Theory_of_relativity', 'Evolution', 'DNA', 'Photosynthesis',
    'Climate_change', 'Renewable_energy', 'Artificial_intelligence', 'Machine_learning',
    'Neuroscience', 'Molecular_biology', 'Astrophysics', 'Cosmology',

    // Mathematics
    'Calculus', 'Linear_algebra', 'Number_theory', 'Probability_theory', 'Statistics',

    // History
    'Renaissance', 'Industrial_Revolution', 'Scientific_Revolution', 'World_War_II',
    'Ancient_Greece', 'Roman_Empire', 'Age_of_Enlightenment',

    // Philosophy
    'Philosophy', 'Ethics', 'Epistemology', 'Metaphysics', 'Logic', 'Stoicism',

    // Economics & Business
    'Economics', 'Capitalism', 'Game_theory', 'Behavioral_economics', 'Entrepreneurship'
  ];

  wikiTopics.slice(0, 25).forEach(topic => {
    urls.push(`https://en.wikipedia.org/wiki/${topic}`);
  });

  // REDDIT - Educational subreddits (15+ URLs)
  const redditSubs = [
    'science', 'AskScience', 'space', 'physics', 'math', 'learnprogramming',
    'philosophy', 'history', 'AskHistorians', 'Economics', 'explainlikeimfive',
    'TrueReddit', 'DepthHub', 'lectures', 'documentaries'
  ];

  redditSubs.slice(0, 10).forEach(sub => {
    urls.push(`https://www.reddit.com/r/${sub}/`);
  });

  // MEDIUM - Educational topics (10+ URLs)
  const mediumTopics = [
    'science', 'technology', 'programming', 'artificial-intelligence',
    'data-science', 'philosophy', 'history', 'economics', 'psychology', 'education'
  ];

  mediumTopics.slice(0, 8).forEach(topic => {
    urls.push(`https://medium.com/tag/${topic}`);
  });

  // QUORA - Educational spaces (10+ URLs)
  const quoraTopics = [
    'Science', 'Mathematics', 'Physics', 'Computer-Science', 'Philosophy',
    'History', 'Economics', 'Psychology', 'Technology', 'Education'
  ];

  quoraTopics.slice(0, 8).forEach(topic => {
    urls.push(`https://www.quora.com/topic/${topic}`);
  });

  // COURSERA/EDX - Course pages (10+ URLs)
  const courses = [
    'machine-learning', 'python', 'data-science', 'algorithms',
    'artificial-intelligence', 'computer-science', 'economics', 'finance'
  ];

  courses.slice(0, 5).forEach(course => {
    urls.push(`https://www.coursera.org/search?query=${course}`);
    urls.push(`https://www.edx.org/search?q=${course}`);
  });

  // KHAN ACADEMY - Subject pages (10+ URLs)
  const khanSubjects = [
    'math', 'science', 'economics-finance-domain', 'computing', 'arts-humanities',
    'test-prep', 'college-careers-more'
  ];

  khanSubjects.forEach(subject => {
    urls.push(`https://www.khanacademy.org/${subject}`);
  });

  // GITHUB - Educational repos (10+ URLs)
  const githubTopics = [
    'machine-learning', 'algorithms', 'data-science', 'artificial-intelligence',
    'education', 'tutorial', 'learning-resources', 'course', 'book', 'papers'
  ];

  githubTopics.slice(0, 8).forEach(topic => {
    urls.push(`https://github.com/topics/${topic}`);
  });

  // STACK OVERFLOW - Tag pages (5 URLs)
  const stackTopics = ['python', 'javascript', 'algorithm', 'data-science', 'machine-learning'];
  stackTopics.forEach(topic => {
    urls.push(`https://stackoverflow.com/questions/tagged/${topic}`);
  });

  // Shuffle and return (so different platforms get priority each time)
  return shuffleArray(urls);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Legacy handlers (for backward compatibility)
async function handleTurboTrain(videos) {
  console.log(`[Focus Feed TURBO] 🚀 Starting turbo train with ${videos.length} videos`);
  videos.forEach(({ videoUrl, title }) => {
    if (!processedVideos.has(videoUrl)) {
      videoQueue.push({ videoUrl, title });
      processedVideos.add(videoUrl);
    }
  });

  if (!isProcessing) {
    processQueueParallel();
  }
}

async function handleLikeVideo(videoUrl, title) {
  if (processedVideos.has(videoUrl)) return;
  videoQueue.push({ videoUrl, title });
  processedVideos.add(videoUrl);

  if (processedVideos.size > 500) {
    processedVideos.clear();
  }

  if (!isProcessing) {
    processQueueParallel();
  }
}

async function processQueueParallel() {
  if (videoQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;

  while (videoQueue.length > 0 && activeTabs.size < MAX_PARALLEL_TABS) {
    const { videoUrl, title } = videoQueue.shift();
    processVideoTab(videoUrl, title);
  }

  setTimeout(() => {
    processQueueParallel();
  }, 2000);
}

async function processVideoTab(videoUrl, title) {
  try {
    console.log(`[Focus Feed BG] 🎯 Opening: ${title}`);

    const tab = await chrome.tabs.create({
      url: `https://www.youtube.com${videoUrl}`,
      active: false
    });

    activeTabs.add(tab.id);

    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: 'playAndLikeVideo' }, (response) => {
            setTimeout(() => {
              chrome.tabs.remove(tabId).catch(() => {});
              activeTabs.delete(tabId);
            }, 10000);
          });
        }, 2000);
      }
    });

  } catch (error) {
    console.error('[Focus Feed BG] Error:', error);
  }
}

// Clean up on startup
chrome.runtime.onStartup.addListener(() => {
  processedVideos.clear();
  videoQueue = [];
  activeTabs.clear();
});
