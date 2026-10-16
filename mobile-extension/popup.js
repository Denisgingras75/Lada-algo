const $ = id => document.getElementById(id);
const TOGGLES = ['autoDaily', 'autoLike', 'showTabs'];
const DEFAULTS = { persona: 'common-sense', autoDaily: true, autoLike: true, showTabs: false };

Object.entries(PERSONAS).forEach(([id, p]) => {
  const o = document.createElement('option');
  o.value = id; o.textContent = p.name;
  $('persona').appendChild(o);
});

chrome.storage.local.get(Object.keys(DEFAULTS), (s) => {
  const settings = { ...DEFAULTS, ...s };
  $('persona').value = settings.persona;
  $('desc').textContent = PERSONAS[settings.persona].desc;
  TOGGLES.forEach(k => { $(k).checked = !!settings[k]; });
});

$('persona').addEventListener('change', (e) => {
  chrome.storage.local.set({ persona: e.target.value });
  $('desc').textContent = PERSONAS[e.target.value].desc;
});

TOGGLES.forEach(k => $(k).addEventListener('change', (e) => {
  chrome.storage.local.set({ [k]: e.target.checked }, () => {
    chrome.runtime.sendMessage({ action: 'settingsChanged' });
  });
}));

let running = false;
$('startStop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: running ? 'stop' : 'start' }, refresh);
});

function refresh() {
  chrome.runtime.sendMessage({ action: 'status' }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    const run = res.run;
    running = !!(run && run.running);
    $('startStop').textContent = running ? 'Stop' : 'Start training';
    $('startStop').classList.toggle('stop', running);
    if (run) {
      const total = run.queue.length;
      $('bar').style.width = (total ? (run.pos / total) * 100 : 0) + '%';
      $('meta').textContent = run.pos + ' of ' + total + ' done · ' + run.liked + ' liked';
    }
    if (running) {
      const item = run.queue[run.pos];
      $('state').textContent = 'Training · ' + PERSONAS[run.persona].name;
      $('now').textContent = item ? item.label : 'Finishing…';
    } else if (run && run.reason === 'finished') {
      $('state').textContent = 'Last run finished';
      $('now').textContent = 'Done ' + new Date(run.finishedAt).toLocaleString() + '. Check your feeds tomorrow.';
    } else {
      $('state').textContent = 'Idle';
    }
  });
}

refresh();
setInterval(refresh, 2000);
