// ... (Keep existing variable declarations) ...
const turboBtn = document.getElementById('turboBtn');

// ... (Keep existing storage/listeners) ...

// TURBO TRAIN LOGIC
turboBtn.addEventListener('click', () => {
  chrome.storage.sync.get(['selectedPersona'], (result) => {
    const persona = result.selectedPersona || 'polymath';
    
    // Access rules from the loaded classifier.js
    if (!CLASSIFIER_RULES || !CLASSIFIER_RULES[persona]) {
      status.textContent = "Error loading persona rules";
      return;
    }

    const keywords = CLASSIFIER_RULES[persona].educational;
    const shuffled = keywords.sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, 5); // Pick 5 random topics

    status.textContent = `🚀 Launching training for: ${targets[0]}...`;
    
    // Open tabs
    targets.forEach((keyword, index) => {
      setTimeout(() => {
        const query = encodeURIComponent(keyword);
        chrome.tabs.create({
          url: `https://www.youtube.com/results?search_query=${query}&sp=EgIQAQ%253D%253D`, // sp param filters for video only to avoid playlists
          active: false // Open in background
        });
      }, index * 500); // Stagger opens
    });
  });
});

// ... (Keep rest of existing file: renderPersonas, toggle listeners, etc.) ...
// Ensure you keep the renderPersonas function and initialization calls!
// Copy the bottom half of your previous popup.js here.
