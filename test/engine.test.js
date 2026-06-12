/* drift — test/engine.test.js : proves the steering logic on a sample feed. */
const lex = require('../src/lexicons.js');
const profile = require('../src/profile.js');
const D = require('../src/directions.js');

const FEED = [
  ['How transformers actually work, from scratch', '3Blue1Brown'],
  ['YOU WON\'T BELIEVE What He Said Next 😱 (GONE WRONG)', 'DramaDaily'],
  ['Slow morning routine | sourdough + coffee', 'QuietKitchen'],
  ['Why this stock is ABOUT TO EXPLODE!!! (act now)', 'MoonBoyFinance'],
  ['Timber framing a hip rafter by hand', 'TheCraftsmanShop'],
  ['Lo-fi guitar improvisation in D dorian', 'BedroomTone'],
  ['SHE DESTROYED him in this debate (must watch)', 'OwnedClips'],
  ['Build a REST API with Rust and Axum', 'Fireship'],
  ['Marcus Aurelius on dealing with difficult people', 'DailyStoic'],
  ['ASMR tapping for sleep', 'TingleTown'],
  ['The hidden history of the Venetian salt trade', 'PastLanes'],
  ['Pedalboard signal chain explained: reverb vs delay', 'TonePrimer'],
];
const featur = (t, c) => ({ tokens: lex.tokenize(t, c), arousal: lex.arousal(t) });

const usual = {};
['guitar tone pedalboard reverb delay improvisation',
 'timber framing rafter joinery craftsman hand tools',
 'macro finance stock market economics rates',
 'transformers machine learning rust api code'
].forEach(s => profile.learn(usual, lex.tokenize(s, ''), 3));
const focus = {};
profile.learn(focus, lex.tokenize('pedalboard reverb delay tone guitar', ''), 2);

const ctxBase = {
  usual, focus,
  moreTerms: new Set(['guitar', 'timber', 'macro']),
  lessTerms: new Set(['stock', 'crypto']),
  intensity: 0.6
};
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

// Resolve every item to a final action for a direction (handles all modes).
function resolve(dir) {
  const ctx = Object.assign({}, ctxBase, { direction: dir });
  const mode = D.modeOf(dir);
  const evals = FEED.map(([t, c], i) => ({ i, t, r: D.evaluate(featur(t, c), ctx) }));
  if (mode === 'absolute') return evals.map(e => ({ t: e.t, action: e.r.action, v: e.r.d }));
  if (mode === 'relative') {
    const def = D.DIRECTIONS[dir];
    const m = D.assignByQuantile(evals.map(e => ({ ref: e.i, rank: e.r.rank })), def.boostPct, def.pushPct, ctx.intensity);
    return evals.map(e => ({ t: e.t, action: m.get(e.i), v: e.r.rank }));
  }
  // cap (touchgrass): calmest survive up to cap, loud bait pre-hidden.
  const cap = Math.round(12 - 9 * ctx.intensity);
  const order = evals.slice().sort((a, b) => b.r.rank - a.r.rank);
  let shown = 0; const act = new Map();
  for (const e of order) {
    if (e.r.d <= -0.20) { act.set(e.i, 'HIDE'); continue; }
    if (shown < cap) { act.set(e.i, 'KEEP'); shown++; }
    else act.set(e.i, 'HIDE');
  }
  return evals.map(e => ({ t: e.t, action: act.get(e.i), v: e.r.rank }));
}

console.log('\nAROUSAL (topic-agnostic form detector)\n' + '-'.repeat(72));
for (const [t] of FEED) console.log(`${lex.arousal(t).toFixed(2)}  ${pad(t, 60)}`);

const result = {};
for (const dir of ['novelty', 'rabbithole', 'detox', 'custom', 'touchgrass']) {
  const rows = resolve(dir); result[dir] = rows;
  const tally = { BOOST: 0, KEEP: 0, DIM: 0, HIDE: 0 };
  console.log(`\nDIRECTION: ${dir} (${D.modeOf(dir)})\n` + '-'.repeat(72));
  for (const r of rows) { tally[r.action]++; console.log(`${pad(r.action, 6)} ${String(r.v.toFixed(2)).padStart(6)}  ${pad(r.t, 52)}`); }
  console.log('  -> ' + JSON.stringify(tally));
}

// ---- assertions ----
let fails = 0;
const find = (dir, frag) => result[dir].find(r => r.t.includes(frag));
const must = (cond, msg) => { if (!cond) { console.log('[FAIL] ' + msg); fails++; } };

for (const dir of Object.keys(result)) {
  must(new Set(result[dir].map(r => r.action)).size >= 2, `${dir} produced only one action type`);
}
must(find('detox', 'GONE WRONG').action === 'HIDE', 'detox must hide ragebait');
must(find('detox', 'transformers').action !== 'HIDE', 'detox must not hide a calm video');
must(find('rabbithole', 'Pedalboard').action === 'BOOST', 'rabbithole must boost the on-focus item');
must(find('rabbithole', 'GONE WRONG').action === 'HIDE', 'rabbithole must hide off-thread bait');
must(find('novelty', 'Timber').action !== 'BOOST', 'novelty must not boost a familiar item');
must(result.novelty.some(r => r.action === 'BOOST'), 'novelty must boost something');
must(find('custom', 'Timber').action === 'BOOST', 'custom must boost a wanted-term item');
must(find('custom', 'stock').action === 'HIDE', 'custom must hide an unwanted-term item');
must(result.touchgrass.filter(r => r.action === 'KEEP').length <= 7, 'touchgrass must thin the feed');

console.log(`\n${fails === 0 ? 'ALL CHECKS PASSED' : fails + ' CHECK(S) FAILED'}\n`);
process.exit(fails ? 1 : 0);
