const toggleSwitch = document.getElementById('toggleFocus');
const personaGrid = document.getElementById('personaGrid');
const status = document.getElementById('status');
const likedCount = document.getElementById('likedCount');
const hiddenCount = document.getElementById('hiddenCount');
const dailyCount = document.getElementById('dailyCount');

const personas = [
  {
    id: 'polymath',
    name: 'The Polymath',
    description: 'Renaissance thinking across disciplines'
  },
  {
    id: 'engineer',
    name: 'The Engineer',
    description: 'Technology, systems & building'
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    description: 'Business, finance & planning'
  },
  {
    id: 'stoic',
    name: 'The Stoic',
    description: 'Philosophy & mental resilience'
  },
  {
    id: 'scientist',
    name: 'The Scientist',
    description: 'Research, discovery & inquiry'
  },
  {
    id: 'artist',
    name: 'The Artist',
    description: 'Creativity, design & expression'
  },
  {
    id: 'warrior',
    name: 'The Warrior',
    description: 'Discipline, strength & performance'
  },
  {
    id: 'healer',
    name: 'The Healer',
    description: 'Health, longevity & wellness'
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    description: 'Discovery, adventure & frontiers'
  },
  {
    id: 'sage',
    name: 'The Sage',
    description: 'Wisdom, meaning & understanding'
  }
];

chrome.storage.sync.get(['focusEnabled', 'selectedPersona', 'dailyStats'], (result) => {
  const focusEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
  const selectedPersona = result.selectedPersona || 'polymath';

  toggleSwitch.checked = focusEnabled;
  updateStatus(focusEnabled);
  renderPersonas(selectedPersona);
  loadStats();
});

toggleSwitch.addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.sync.set({ focusEnabled: enabled }, () => {
    updateStatus(enabled);
    reloadSocialMediaTabs();
  });
});

function renderPersonas(selected) {
  personaGrid.innerHTML = '';

  personas.forEach(persona => {
    const option = document.createElement('div');
    option.className = `persona-option ${persona.id === selected ? 'active' : ''}`;
    option.innerHTML = `
      <div class="persona-name">${persona.name}</div>
      <div class="persona-desc">${persona.description}</div>
    `;

    option.addEventListener('click', () => {
      chrome.storage.sync.set({ selectedPersona: persona.id }, () => {
        renderPersonas(persona.id);
        reloadSocialMediaTabs();
      });
    });

    personaGrid.appendChild(option);
  });
}

function updateStatus(enabled) {
  status.textContent = enabled ? 'Active - Training your algorithm' : 'Disabled - No training in progress';
  status.style.background = enabled ? '#1a3a1a' : '#272727';
  status.style.color = enabled ? '#4ade80' : '#aaa';
}

let statsInterval = null;

function loadStats() {
  // Load session stats from local storage
  chrome.storage.local.get(['sessionStats'], (result) => {
    if (result.sessionStats) {
      likedCount.textContent = result.sessionStats.liked || 0;
      hiddenCount.textContent = result.sessionStats.hidden || 0;
    }
  });

  // Load daily stats
  chrome.storage.sync.get(['dailyStats'], (result) => {
    if (result.dailyStats) {
      dailyCount.textContent = result.dailyStats.count || 0;
    }
  });
}

// Auto-refresh stats every 5 seconds (run once)
if (!statsInterval) {
  statsInterval = setInterval(loadStats, 5000);
}

function reloadSocialMediaTabs() {
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
