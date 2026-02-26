// Algorithm VPN — Content Script Entry Point
// Detects platform, initializes the appropriate interception layer,
// and handles communication with the popup/background.

(function () {
  'use strict';

  let activePlatform = null;
  let currentPersona = 'calm'; // Default persona
  let userConfig = {};

  // ── Platform Detection ───────────────────────────────────────────────

  function detectPlatform() {
    if (AlgorithmVPN.YouTube.isActive()) return 'youtube';
    if (AlgorithmVPN.Twitter.isActive()) return 'twitter';
    return null;
  }

  // ── Initialization ───────────────────────────────────────────────────

  function init() {
    activePlatform = detectPlatform();
    if (!activePlatform) return;

    // Load saved persona and config
    chrome.storage.local.get(['persona', 'focusKeywords', 'enabled'], (data) => {
      // Default to enabled
      const enabled = data.enabled !== false;
      if (!enabled) return;

      currentPersona = data.persona || 'calm';
      userConfig = { focusKeywords: data.focusKeywords || [] };

      startPlatform();
    });

    // Listen for persona changes from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SET_PERSONA') {
        currentPersona = message.persona;
        userConfig = message.userConfig || userConfig;
        updatePlatform();
        sendResponse({ ok: true });
      }

      if (message.type === 'SET_ENABLED') {
        if (message.enabled) {
          startPlatform();
        } else {
          stopPlatform();
        }
        sendResponse({ ok: true });
      }

      if (message.type === 'GET_STATUS') {
        sendResponse({
          platform: activePlatform,
          persona: currentPersona,
          enabled: activePlatform !== null
        });
      }
    });

    // Also listen for storage changes (cross-tab sync)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;

      if (changes.persona) {
        currentPersona = changes.persona.newValue || 'calm';
        updatePlatform();
      }
      if (changes.focusKeywords) {
        userConfig.focusKeywords = changes.focusKeywords.newValue || [];
        updatePlatform();
      }
      if (changes.enabled) {
        if (changes.enabled.newValue === false) {
          stopPlatform();
        } else {
          startPlatform();
        }
      }
    });
  }

  // ── Platform Control ─────────────────────────────────────────────────

  function startPlatform() {
    if (!activePlatform) return;

    if (activePlatform === 'youtube') {
      AlgorithmVPN.YouTube.init(currentPersona, userConfig);
    } else if (activePlatform === 'twitter') {
      AlgorithmVPN.Twitter.init(currentPersona, userConfig);
    }
  }

  function updatePlatform() {
    if (!activePlatform) return;

    if (activePlatform === 'youtube') {
      AlgorithmVPN.YouTube.updatePersona(currentPersona, userConfig);
    } else if (activePlatform === 'twitter') {
      AlgorithmVPN.Twitter.updatePersona(currentPersona, userConfig);
    }
  }

  function stopPlatform() {
    if (activePlatform === 'youtube') {
      AlgorithmVPN.YouTube.destroy();
    } else if (activePlatform === 'twitter') {
      AlgorithmVPN.Twitter.destroy();
    }
  }

  // ── Start ────────────────────────────────────────────────────────────

  init();
})();
