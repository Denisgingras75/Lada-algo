const toggleSwitch = document.getElementById('toggleFocus');
const personaGrid = document.getElementById('personaGrid');
const status = document.getElementById('status');

const personas = [
  {
    id: 'builder',
    name: 'The Builder',
    description: 'Engineering, Science & Innovation'
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    description: 'Business, Finance & Markets'
  },
  {
    id: 'stoic',
    name: 'The Stoic',
    description: 'Philosophy, Psychology & Self-Improvement'
  }
];

chrome.storage.sync.get(['focusEnabled', 'selectedPersona'], (result) => {
  const focusEnabled = result.focusEnabled !== undefined ? result.focusEnabled : true;
  const selectedPersona = result.selectedPersona || 'builder';

  toggleSwitch.checked = focusEnabled;
  updateStatus(focusEnabled);
  renderPersonas(selectedPersona);
});

toggleSwitch.addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.sync.set({ focusEnabled: enabled }, () => {
    updateStatus(enabled);
    reloadYouTubeTabs();
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
        reloadYouTubeTabs();
      });
    });

    personaGrid.appendChild(option);
  });
}

function updateStatus(enabled) {
  status.textContent = enabled ? 'Active - YouTube feed is being replaced' : 'Disabled - Showing default YouTube feed';
  status.style.background = enabled ? '#1a3a1a' : '#272727';
  status.style.color = enabled ? '#4ade80' : '#aaa';
}

function reloadYouTubeTabs() {
  chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.reload(tab.id);
    });
  });
}
