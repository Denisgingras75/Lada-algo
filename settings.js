// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.dataset.tab;

    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabId}-tab`).classList.add('active');
  });
});

// Load current settings
chrome.storage.sync.get(['selectedPersona', 'customKeywords', 'customPersonas', 'trustedChannels', 'blockedChannels'], (result) => {
  const personaId = result.selectedPersona || 'polymath';

  // Load keywords for current persona
  if (result.customKeywords && result.customKeywords[personaId]) {
    const keywords = result.customKeywords[personaId];
    document.getElementById('educational-keywords').value = keywords.educational.join('\n');
    document.getElementById('junk-keywords').value = keywords.junk.join('\n');
  } else {
    // Load default keywords from the persona
    loadDefaultKeywords(personaId);
  }

  // Load trusted/blocked channels
  if (result.trustedChannels) {
    document.getElementById('trusted-channels').value = result.trustedChannels.join('\n');
  }
  if (result.blockedChannels) {
    document.getElementById('blocked-channels').value = result.blockedChannels.join('\n');
  }

  // Load custom personas
  if (result.customPersonas) {
    renderCustomPersonas(result.customPersonas);
  }
});

function loadDefaultKeywords(personaId) {
  // Default keywords for each persona (matching content.js)
  const defaults = {
    polymath: {
      educational: ['MIT', 'Stanford', 'lecture', 'course', 'tutorial', 'explained', 'documentary', 'TED', 'science', 'Khan Academy'],
      junk: ['SHOCKING', 'UNBELIEVABLE', 'WON\'T BELIEVE', 'GONE WRONG', 'clickbait', 'drama', 'exposed', 'flat earth', 'conspiracy']
    },
    engineer: {
      educational: ['engineering', 'coding', 'programming', 'tutorial', 'Python', 'JavaScript', 'CS50', 'ThePrimeagen', 'Fireship'],
      junk: ['SHOCKED', 'drama', 'exposed', 'GONE WRONG', 'clickbait']
    },
    scientist: {
      educational: ['science', 'research', 'MIT', 'physics', 'chemistry', 'SmarterEveryDay', 'Veritasium', 'Kurzgesagt'],
      junk: ['pseudoscience', 'flat earth', 'conspiracy', 'SHOCKING', 'SECRET CURE']
    }
    // ... add others as needed
  };

  const keywords = defaults[personaId] || defaults.polymath;
  document.getElementById('educational-keywords').value = keywords.educational.join('\n');
  document.getElementById('junk-keywords').value = keywords.junk.join('\n');
}

// Save keywords
document.getElementById('save-keywords').addEventListener('click', () => {
  const eduKeywords = document.getElementById('educational-keywords').value
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  const junkKeywords = document.getElementById('junk-keywords').value
    .split('\n')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  chrome.storage.sync.get(['selectedPersona', 'customKeywords'], (result) => {
    const personaId = result.selectedPersona || 'polymath';
    const customKeywords = result.customKeywords || {};

    customKeywords[personaId] = {
      educational: eduKeywords,
      junk: junkKeywords
    };

    chrome.storage.sync.set({ customKeywords }, () => {
      showSuccess('keywords');
      // Reload all social media tabs to apply new keywords
      reloadTabs();
    });
  });
});

// Reset keywords
document.getElementById('reset-keywords').addEventListener('click', () => {
  if (confirm('Reset keywords to default? This cannot be undone.')) {
    chrome.storage.sync.get(['selectedPersona', 'customKeywords'], (result) => {
      const personaId = result.selectedPersona || 'polymath';
      const customKeywords = result.customKeywords || {};
      delete customKeywords[personaId];

      chrome.storage.sync.set({ customKeywords }, () => {
        loadDefaultKeywords(personaId);
        showSuccess('keywords');
        reloadTabs();
      });
    });
  }
});

// Save custom persona
document.getElementById('save-persona').addEventListener('click', () => {
  const name = document.getElementById('persona-name').value.trim();
  const desc = document.getElementById('persona-desc').value.trim();
  const eduKeywords = document.getElementById('persona-edu').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);
  const junkKeywords = document.getElementById('persona-junk').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  if (!name) {
    alert('Please enter a persona name');
    return;
  }

  const personaId = name.toLowerCase().replace(/\s+/g, '-');

  chrome.storage.sync.get(['customPersonas'], (result) => {
    const customPersonas = result.customPersonas || {};

    customPersonas[personaId] = {
      id: personaId,
      name: name,
      description: desc,
      educational: eduKeywords,
      junk: junkKeywords,
      custom: true
    };

    chrome.storage.sync.set({ customPersonas }, () => {
      showSuccess('persona');
      renderCustomPersonas(customPersonas);
      // Clear form
      document.getElementById('persona-name').value = '';
      document.getElementById('persona-desc').value = '';
      document.getElementById('persona-edu').value = '';
      document.getElementById('persona-junk').value = '';
    });
  });
});

// Import persona
document.getElementById('import-persona').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const persona = JSON.parse(event.target.result);

      if (!persona.name || !persona.educational || !persona.junk) {
        alert('Invalid persona file format');
        return;
      }

      chrome.storage.sync.get(['customPersonas'], (result) => {
        const customPersonas = result.customPersonas || {};
        const personaId = persona.id || persona.name.toLowerCase().replace(/\s+/g, '-');

        customPersonas[personaId] = {
          ...persona,
          id: personaId,
          custom: true
        };

        chrome.storage.sync.set({ customPersonas }, () => {
          showSuccess('persona');
          renderCustomPersonas(customPersonas);
        });
      });
    } catch (error) {
      alert('Error parsing persona file: ' + error.message);
    }
  };
  reader.readAsText(file);
});

// Render custom personas list
function renderCustomPersonas(customPersonas) {
  const container = document.getElementById('custom-personas-list');

  if (Object.keys(customPersonas).length === 0) {
    container.innerHTML = '<p style="color: #888; font-size: 13px;">No custom personas yet. Create one above!</p>';
    return;
  }

  container.innerHTML = '';

  Object.values(customPersonas).forEach(persona => {
    const item = document.createElement('div');
    item.className = 'persona-item';
    item.innerHTML = `
      <div class="persona-info">
        <h3>${persona.name}</h3>
        <p>${persona.description || 'No description'}</p>
      </div>
      <div class="persona-actions">
        <button class="icon-btn export-btn" data-id="${persona.id}">📥 Export</button>
        <button class="icon-btn delete-btn" data-id="${persona.id}">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(item);
  });

  // Add event listeners
  container.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const personaId = btn.dataset.id;
      const persona = customPersonas[personaId];
      downloadJSON(persona, `${personaId}-persona.json`);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const personaId = btn.dataset.id;
      if (confirm(`Delete ${customPersonas[personaId].name}?`)) {
        delete customPersonas[personaId];
        chrome.storage.sync.set({ customPersonas }, () => {
          renderCustomPersonas(customPersonas);
        });
      }
    });
  });
}

// Save channels
document.getElementById('save-channels').addEventListener('click', () => {
  const trusted = document.getElementById('trusted-channels').value
    .split('\n')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  const blocked = document.getElementById('blocked-channels').value
    .split('\n')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  chrome.storage.sync.set({ trustedChannels: trusted, blockedChannels: blocked }, () => {
    showSuccess('channels');
    reloadTabs();
  });
});

// Reset channels
document.getElementById('reset-channels').addEventListener('click', () => {
  if (confirm('Clear all channel lists?')) {
    chrome.storage.sync.set({ trustedChannels: [], blockedChannels: [] }, () => {
      document.getElementById('trusted-channels').value = '';
      document.getElementById('blocked-channels').value = '';
      showSuccess('channels');
      reloadTabs();
    });
  }
});

// Utility functions
function showSuccess(type) {
  const msg = document.getElementById(`success-${type}`);
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 3000);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function reloadTabs() {
  const platforms = [
    '*://*.youtube.com/*',
    '*://*.facebook.com/*',
    '*://*.instagram.com/*',
    '*://*.twitter.com/*',
    '*://*.x.com/*',
    '*://*.tiktok.com/*'
  ];

  platforms.forEach(url => {
    chrome.tabs.query({ url }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
  });
}
