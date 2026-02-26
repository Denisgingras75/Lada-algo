// Algorithm VPN — Popup Controller

const PERSONAS = [
  { id: 'raw',       name: 'Raw',       desc: 'Pure chronological — no algorithm',              iconClass: 'raw' },
  { id: 'calm',      name: 'Calm',      desc: 'Downranks outrage and manipulation',             iconClass: 'calm' },
  { id: 'learn',     name: 'Learn',     desc: 'Surfaces educational content',                   iconClass: 'learn' },
  { id: 'discovery', name: 'Discovery', desc: 'Breaks your echo chamber',                       iconClass: 'discovery' },
  { id: 'focus',     name: 'Focus',     desc: 'Shows your specified topics only',               iconClass: 'focus' }
];

// ── DOM References ─────────────────────────────────────────────────────

const enabledToggle = document.getElementById('enabled-toggle');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('status-text');
const personaList = document.getElementById('persona-list');
const focusConfig = document.getElementById('focus-config');
const focusInput = document.getElementById('focus-keywords');
const saveKeywordsBtn = document.getElementById('save-keywords');
const platformBadge = document.getElementById('platform-badge');

// ── State ──────────────────────────────────────────────────────────────

let currentPersona = 'calm';
let isEnabled = true;
let focusKeywords = [];

// ── Initialize ─────────────────────────────────────────────────────────

async function init() {
  // Load state from background
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
    if (chrome.runtime.lastError || !response) return;

    currentPersona = response.persona || 'calm';
    isEnabled = response.enabled !== false;
    focusKeywords = response.focusKeywords || [];

    render();
  });

  // Detect which platform the active tab is on
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const url = tabs[0].url || '';
    if (url.includes('youtube.com')) {
      platformBadge.textContent = 'YouTube';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      platformBadge.textContent = 'X / Twitter';
    } else {
      platformBadge.textContent = 'No supported site';
    }
  });
}

// ── Render ─────────────────────────────────────────────────────────────

function render() {
  // Toggle
  enabledToggle.checked = isEnabled;
  document.body.classList.toggle('disabled', !isEnabled);

  // Status
  statusDot.className = `status-dot ${isEnabled ? 'active' : 'inactive'}`;
  if (isEnabled) {
    const persona = PERSONAS.find(p => p.id === currentPersona);
    statusText.textContent = `Connected — ${persona ? persona.name : 'Unknown'} mode`;
  } else {
    statusText.textContent = 'Disconnected';
  }

  // Persona list
  personaList.innerHTML = '';
  for (const p of PERSONAS) {
    const btn = document.createElement('button');
    btn.className = `persona-btn${p.id === currentPersona ? ' selected' : ''}`;
    btn.innerHTML = `
      <div class="persona-icon ${p.iconClass}">${p.name[0]}</div>
      <div class="persona-info">
        <div class="persona-name">${p.name}</div>
        <div class="persona-desc">${p.desc}</div>
      </div>
    `;
    btn.addEventListener('click', () => selectPersona(p.id));
    personaList.appendChild(btn);
  }

  // Focus config
  focusConfig.style.display = currentPersona === 'focus' ? 'block' : 'none';
  focusInput.value = focusKeywords.join(', ');
}

// ── Actions ────────────────────────────────────────────────────────────

function selectPersona(personaId) {
  currentPersona = personaId;

  // Save and notify
  chrome.runtime.sendMessage({
    type: 'SET_PERSONA',
    persona: personaId,
    focusKeywords: focusKeywords
  });

  render();
}

function toggleEnabled(enabled) {
  isEnabled = enabled;
  chrome.runtime.sendMessage({
    type: 'SET_ENABLED',
    enabled: enabled
  });
  render();
}

function saveFocusKeywords() {
  const raw = focusInput.value;
  focusKeywords = raw
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  chrome.runtime.sendMessage({
    type: 'SET_FOCUS_KEYWORDS',
    keywords: focusKeywords
  });

  // Re-send persona to trigger re-rank with new keywords
  chrome.runtime.sendMessage({
    type: 'SET_PERSONA',
    persona: currentPersona,
    focusKeywords: focusKeywords
  });

  // Visual feedback
  saveKeywordsBtn.textContent = 'Saved';
  setTimeout(() => { saveKeywordsBtn.textContent = 'Save'; }, 1000);
}

// ── Event Listeners ────────────────────────────────────────────────────

enabledToggle.addEventListener('change', (e) => toggleEnabled(e.target.checked));
saveKeywordsBtn.addEventListener('click', saveFocusKeywords);

// Save keywords on Enter key
focusInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveFocusKeywords();
});

// ── Start ──────────────────────────────────────────────────────────────

init();
