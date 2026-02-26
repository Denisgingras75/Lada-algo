// Algorithm VPN — Background Service Worker
// Handles state persistence and message routing between popup and content scripts.
// No network requests. No data collection. No external communication.

// ── Default State ──────────────────────────────────────────────────────

const DEFAULT_STATE = {
  persona: 'calm',
  enabled: true,
  focusKeywords: []
};

// ── Installation ───────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set(DEFAULT_STATE);
  }
});

// ── Message Handling ───────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    chrome.storage.local.get(['persona', 'enabled', 'focusKeywords'], (data) => {
      sendResponse({
        persona: data.persona || DEFAULT_STATE.persona,
        enabled: data.enabled !== false,
        focusKeywords: data.focusKeywords || []
      });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'SET_PERSONA') {
    chrome.storage.local.set({ persona: message.persona }, () => {
      // Notify all matching tabs about the persona change
      notifyContentScripts({
        type: 'SET_PERSONA',
        persona: message.persona,
        userConfig: { focusKeywords: message.focusKeywords || [] }
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'SET_ENABLED') {
    chrome.storage.local.set({ enabled: message.enabled }, () => {
      notifyContentScripts({
        type: 'SET_ENABLED',
        enabled: message.enabled
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'SET_FOCUS_KEYWORDS') {
    chrome.storage.local.set({ focusKeywords: message.keywords }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});

// ── Notify Content Scripts ─────────────────────────────────────────────

function notifyContentScripts(message) {
  const patterns = [
    'https://*.youtube.com/*',
    'https://*.twitter.com/*',
    'https://*.x.com/*'
  ];

  chrome.tabs.query({ url: patterns }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Tab might not have content script loaded yet — safe to ignore
      });
    }
  });
}
