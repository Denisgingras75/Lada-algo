// Focus Feed Mobile - background driver.
// Opens ONE training tab at a time (phones choke on 20), lets trainer.js do the
// work on the page, closes the tab when trainer.js reports done, then opens the
// next. All state lives in storage so a killed background script can resume.

if (typeof PERSONAS === 'undefined' && typeof importScripts === 'function') {
  importScripts('personas.js');
}

const VIDEOS_PER_SEARCH = 2;
const TAB_TIMEOUT_MS = 90 * 1000; // watchdog: give up on a stuck tab after this
const DAY_MINUTES = 24 * 60;

const DEFAULTS = {
  persona: 'common-sense',
  autoDaily: true,
  watchSeconds: 35,
  dwellSeconds: 8,
  autoLike: true,
  showTabs: false
};

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(personaId) {
  const p = PERSONAS[personaId] || PERSONAS['common-sense'];
  const q = [];
  p.yt.forEach(s => q.push({ kind: 'yt-search', label: 'YouTube: ' + s,
    url: 'https://m.youtube.com/results?search_query=' + encodeURIComponent(s) }));
  p.reddit.forEach(s => q.push({ kind: 'dwell', label: 'r/' + s, url: 'https://www.reddit.com/r/' + s + '/top/?t=month' }));
  p.ig.forEach(s => q.push({ kind: 'dwell', label: 'Instagram @' + s, url: 'https://www.instagram.com/' + s + '/' }));
  p.x.forEach(s => q.push({ kind: 'dwell', label: 'X @' + s, url: 'https://x.com/' + s }));
  p.wiki.forEach(s => q.push({ kind: 'dwell', label: 'Wikipedia: ' + s.replace(/_/g, ' '), url: 'https://en.m.wikipedia.org/wiki/' + s }));
  return shuffle(q);
}

async function getSettings() {
  const s = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...s };
}

async function getRun() {
  const { run } = await chrome.storage.local.get('run');
  return run || null;
}

async function setRun(run) {
  await chrome.storage.local.set({ run });
}

async function startRun() {
  const settings = await getSettings();
  const current = await getRun();
  if (current && current.running) return current;
  const run = {
    running: true,
    persona: settings.persona,
    queue: buildQueue(settings.persona),
    pos: 0,
    done: 0,
    liked: 0,
    tabId: null,
    tabStarted: 0,
    startedAt: Date.now()
  };
  await setRun(run);
  await openNext();
  return run;
}

async function stopRun(reason) {
  const run = await getRun();
  if (!run) return;
  if (run.tabId) chrome.tabs.remove(run.tabId).catch(() => {});
  run.running = false;
  run.tabId = null;
  run.finishedAt = Date.now();
  run.reason = reason || 'stopped';
  await setRun(run);
  if (reason === 'finished') await chrome.storage.local.set({ lastRunAt: Date.now() });
}

async function openNext() {
  const run = await getRun();
  if (!run || !run.running) return;
  if (run.pos >= run.queue.length) {
    await stopRun('finished');
    return;
  }
  const settings = await getSettings();
  const item = run.queue[run.pos];
  try {
    const tab = await chrome.tabs.create({ url: item.url, active: !!settings.showTabs });
    run.tabId = tab.id;
    run.tabStarted = Date.now();
    await setRun(run);
  } catch (e) {
    run.pos++;
    await setRun(run);
    openNext();
  }
}

async function finishCurrent(result) {
  const run = await getRun();
  if (!run || !run.running) return;
  const item = run.queue[run.pos];
  if (result && Array.isArray(result.found) && item && item.kind === 'yt-search') {
    // Queue the top videos from this search right after it.
    const vids = result.found.slice(0, VIDEOS_PER_SEARCH).map(href => ({
      kind: 'yt-watch', label: 'Watching: ' + (item.label.replace('YouTube: ', '')),
      url: href.startsWith('http') ? href : 'https://m.youtube.com' + href
    }));
    run.queue.splice(run.pos + 1, 0, ...vids);
  }
  if (result && result.liked) run.liked++;
  const closing = run.tabId;
  run.tabId = null;
  run.pos++;
  run.done++;
  await setRun(run);
  if (closing) chrome.tabs.remove(closing).catch(() => {});
  openNext();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.action === 'whoami') {
      // trainer.js asks whether its tab is a training tab, and what to do there.
      const run = await getRun();
      const settings = await getSettings();
      if (run && run.running && sender.tab && sender.tab.id === run.tabId) {
        const item = run.queue[run.pos];
        sendResponse({ train: true, kind: item.kind, watchSeconds: settings.watchSeconds,
          dwellSeconds: settings.dwellSeconds, autoLike: settings.autoLike });
      } else {
        sendResponse({ train: false });
      }
    } else if (msg.action === 'taskDone') {
      const run = await getRun();
      if (run && sender.tab && sender.tab.id === run.tabId) await finishCurrent(msg.result);
      sendResponse({ ok: true });
    } else if (msg.action === 'start') {
      sendResponse(await startRun());
    } else if (msg.action === 'stop') {
      await stopRun('stopped');
      sendResponse({ ok: true });
    } else if (msg.action === 'status') {
      const { lastRunAt } = await chrome.storage.local.get('lastRunAt');
      sendResponse({ run: await getRun(), lastRunAt: lastRunAt || null });
    } else if (msg.action === 'settingsChanged') {
      await scheduleDaily();
      sendResponse({ ok: true });
    }
  })();
  return true;
});

// If the user closes the training tab by hand, move on.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const run = await getRun();
  if (run && run.running && run.tabId === tabId) finishCurrent(null);
});

async function scheduleDaily() {
  const settings = await getSettings();
  await chrome.alarms.clear('daily');
  if (settings.autoDaily) chrome.alarms.create('daily', { delayInMinutes: 1, periodInMinutes: 60 });
  chrome.alarms.create('watchdog', { periodInMinutes: 1 });
}

async function maybeRunDaily() {
  const settings = await getSettings();
  if (!settings.autoDaily) return;
  const { lastRunAt } = await chrome.storage.local.get('lastRunAt');
  const run = await getRun();
  if (run && run.running) return;
  if (!lastRunAt || Date.now() - lastRunAt > DAY_MINUTES * 60 * 1000) startRun();
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily') {
    maybeRunDaily();
  } else if (alarm.name === 'watchdog') {
    const run = await getRun();
    if (run && run.running) {
      if (!run.tabId) openNext();
      else if (Date.now() - run.tabStarted > TAB_TIMEOUT_MS) finishCurrent(null);
    }
  }
});

chrome.runtime.onInstalled.addListener(scheduleDaily);
chrome.runtime.onStartup.addListener(async () => {
  await scheduleDaily();
  maybeRunDaily();
});
