const toggleSwitch = document.getElementById('toggleFocus');
const personaGrid = document.getElementById('personaGrid');
const status = document.getElementById('status');

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

chrome.storage.sync.get(['focusEnabled', 'selectedPersona'], (result) => {
  const focusEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
  const selectedPersona = result.selectedPersona || 'polymath';

  toggleSwitch.checked = focusEnabled;
  updateStatus(focusEnabled);
  renderPersonas(selectedPersona);
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
  status.textContent = enabled ? 'Active - Blocking algorithmic feeds' : 'Disabled - Showing default feeds';
  status.style.background = enabled ? '#1a3a1a' : '#272727';
  status.style.color = enabled ? '#4ade80' : '#aaa';
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
