// Background service worker for Focus Feed - TURBO MODE
// Opens a SEPARATE WINDOW with multiple tabs to FLOOD all algorithms

let videoQueue = [];
let isProcessing = false;
let processedVideos = new Set();
let activeTabs = new Set();
let trainingWindow = null;
const MAX_PARALLEL_TABS = 15; // Open 15 tabs at once for FAST results

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'likeVideo') {
    handleLikeVideo(message.videoUrl, message.title);
    sendResponse({ success: true });
  } else if (message.action === 'turboTrain') {
    handleTurboTrain(message.videos);
    sendResponse({ success: true });
  } else if (message.action === 'getQueueStatus') {
    sendResponse({ queueLength: videoQueue.length, isProcessing, activeTabs: activeTabs.size });
  }
  return true;
});

// TURBO MODE: Process multiple videos at once
async function handleTurboTrain(videos) {
  console.log(`[Focus Feed TURBO] 🚀 Starting turbo train with ${videos.length} videos`);

  // Add all videos to queue
  videos.forEach(({ videoUrl, title }) => {
    if (!processedVideos.has(videoUrl)) {
      videoQueue.push({ videoUrl, title });
      processedVideos.add(videoUrl);
    }
  });

  // Start processing in parallel
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

// Process multiple videos in parallel
async function processQueueParallel() {
  if (videoQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;

  // Process up to MAX_PARALLEL_TABS videos at once
  while (videoQueue.length > 0 && activeTabs.size < MAX_PARALLEL_TABS) {
    const { videoUrl, title } = videoQueue.shift();
    processVideoTab(videoUrl, title);
  }

  // Check again after delay
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

    // Listen for page load
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        // CRITICAL: Wait for video to load, then PLAY + LIKE
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: 'playAndLikeVideo' }, (response) => {
            // Let video play for 10 seconds (enough to register view)
            setTimeout(() => {
              chrome.tabs.remove(tabId).catch(() => {});
              activeTabs.delete(tabId);
            }, 10000); // 10 second watch time
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
