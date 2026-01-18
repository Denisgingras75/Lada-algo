// Background service worker for Focus Feed
// Handles opening videos in background tabs to like them

let videoQueue = [];
let isProcessing = false;
let processedVideos = new Set();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'likeVideo') {
    handleLikeVideo(message.videoUrl, message.title);
    sendResponse({ success: true });
  } else if (message.action === 'getQueueStatus') {
    sendResponse({ queueLength: videoQueue.length, isProcessing });
  }
  return true;
});

async function handleLikeVideo(videoUrl, title) {
  // Don't process same video twice
  if (processedVideos.has(videoUrl)) {
    console.log('[Focus Feed BG] Already processed:', videoUrl);
    return;
  }

  // Add to queue
  videoQueue.push({ videoUrl, title });
  processedVideos.add(videoUrl);

  // Limit processed videos set size to prevent memory bloat
  if (processedVideos.size > 500) {
    processedVideos.clear();
  }

  // Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue() {
  if (videoQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { videoUrl, title } = videoQueue.shift();

  try {
    console.log(`[Focus Feed BG] Opening video to like: ${title}`);

    // Open video in new tab (in background)
    const tab = await chrome.tabs.create({
      url: `https://www.youtube.com${videoUrl}`,
      active: false // Don't switch to this tab
    });

    // Wait for page to load, then like and close
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);

        // Wait a bit for YouTube to fully load, then send message to like
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: 'likeCurrentVideo' }, (response) => {
            // Close the tab after liking (or after timeout)
            setTimeout(() => {
              chrome.tabs.remove(tabId).catch(() => {});
            }, 2000);
          });
        }, 3000); // Wait 3 seconds for full load
      }
    });

    // Continue processing next video after delay
    setTimeout(() => {
      processQueue();
    }, 8000); // 8 second delay between opening tabs

  } catch (error) {
    console.error('[Focus Feed BG] Error processing video:', error);
    // Continue with next video
    setTimeout(() => {
      processQueue();
    }, 5000);
  }
}

// Clean up old processed videos on extension startup
chrome.runtime.onStartup.addListener(() => {
  processedVideos.clear();
  videoQueue = [];
});
