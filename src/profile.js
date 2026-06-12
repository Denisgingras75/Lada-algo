/* drift — profile.js
 * A local, on-device model of YOUR feed. Never leaves the browser.
 *
 * Two structures, both plain token->weight maps:
 *   usual  — what you habitually engage with (slow, decayed). Drives "familiarity".
 *   focus  — what you've engaged with most recently (fast). Drives "Rabbit hole".
 *
 * "Familiarity" is cosine similarity between an item and `usual`. Novelty
 * direction wants low familiarity; Rabbit hole wants high similarity to `focus`.
 * This is what makes the presets DIRECTIONS instead of fixed categories: they
 * steer relative to you, not relative to a hardcoded idea of good content.
 *
 * It is a keyword/frequency heuristic, not embeddings. Honest about that: it
 * captures topical overlap by shared vocabulary, which is coarse but runs
 * instantly in a content script with zero network calls.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  root.FF = root.FF || {};
  root.FF.profile = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function learn(map, tokens, weight) {
    weight = weight == null ? 1 : weight;
    for (const t of tokens) map[t] = (map[t] || 0) + weight;
    return map;
  }

  // Multiplicative decay so old interests fade. Drop near-zero keys to stay small.
  function decay(map, factor) {
    factor = factor == null ? 0.92 : factor;
    for (const k of Object.keys(map)) {
      const v = map[k] * factor;
      if (v < 0.05) delete map[k];
      else map[k] = v;
    }
    return map;
  }

  // Keep the map bounded: retain the top-N heaviest tokens.
  function prune(map, keep) {
    keep = keep || 400;
    const keys = Object.keys(map);
    if (keys.length <= keep) return map;
    keys.sort((a, b) => map[b] - map[a]);
    const next = {};
    for (let i = 0; i < keep; i++) next[keys[i]] = map[keys[i]];
    return next;
  }

  function counts(tokens) {
    const m = {};
    for (const t of tokens) m[t] = (m[t] || 0) + 1;
    return m;
  }

  // Cosine similarity between an item (token list) and a weight map -> 0..1.
  function similarity(tokens, map) {
    if (!tokens || !tokens.length) return 0;
    const keys = Object.keys(map);
    if (!keys.length) return 0;
    const itemVec = counts(tokens);

    let dot = 0, magItem = 0, magMap = 0;
    for (const k of Object.keys(itemVec)) {
      const iv = itemVec[k];
      magItem += iv * iv;
      if (map[k]) dot += iv * map[k];
    }
    for (const k of keys) magMap += map[k] * map[k];
    if (!magItem || !magMap) return 0;
    return dot / (Math.sqrt(magItem) * Math.sqrt(magMap));
  }

  // Fraction of an item's wanted/unwanted terms present -> saturating 0..1.
  // Two matched terms is "fully on", so a single keyword can't dominate.
  function termOverlap(tokens, termSet) {
    if (!termSet || !termSet.size || !tokens.length) return 0;
    const seen = new Set(tokens);
    let hits = 0;
    for (const t of termSet) {
      // allow multi-word terms by substring against the joined token blob
      if (t.includes(' ')) {
        if (tokens.join(' ').includes(t)) hits++;
      } else if (seen.has(t)) hits++;
    }
    return Math.max(0, Math.min(1, hits / 2));
  }

  return { learn, decay, prune, counts, similarity, termOverlap };
});
