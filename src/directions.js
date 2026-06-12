/* drift — directions.js  (THE HEART)
 *
 * A Direction is a steering policy. Two kinds:
 *
 *   ABSOLUTE  judge each item on its own merits against a threshold.
 *             detox / custom / rabbithole. They ask "is THIS item what I want?"
 *
 *   RELATIVE  rank items against each other, steer the tails.
 *             novelty / touchgrass. They ask "of what's on screen, which?"
 *             Novelty is meaningless in isolation — it only exists relative to
 *             the rest of your feed — so it must be a ranking, not a threshold.
 *
 * Actions: BOOST (pull toward) / KEEP / DIM (push down) / HIDE (push away).
 *
 * Honest primitives, blended:
 *   fam    familiarity to your usual feed   (profile cosine)
 *   focus  similarity to what you're on now  (focus cosine)
 *   arous  manufactured-arousal of the title (topic-agnostic)
 *   more / less  your own custom +/- terms
 *
 * Intensity (0..1) compresses thresholds toward 0 and scales how hard the
 * relative tails get pushed.
 */
(function (root, factory) {
  const deps = (typeof module !== 'undefined' && module.exports)
    ? { profile: require('./profile.js') }
    : { profile: (root.FF || {}).profile };
  const mod = factory(deps);
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  root.FF = root.FF || {};
  root.FF.directions = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';
  const P = deps.profile;

  const DIRECTIONS = {
    novelty: {
      id: 'novelty', label: 'Novelty', mode: 'relative',
      blurb: 'Surface what stands out from your usual feed. Break the loop.',
      boostPct: 0.30, pushPct: 0.30,
      // higher rank = more novel and calm -> pulled toward you.
      rank: (s) => (1 - s.fam) - 0.55 * s.arous
    },
    rabbithole: {
      id: 'rabbithole', label: 'Rabbit hole', mode: 'absolute',
      blurb: 'Go deeper on whatever you just engaged with. Amplify the thread.',
      // strongly on-thread -> boost; unrelated -> dim (not hidden); bait -> hide.
      d: (s) => clamp(1.7 * s.focus - 0.35 * s.arous - 0.15)
    },
    detox: {
      id: 'detox', label: 'Detox', mode: 'absolute',
      blurb: 'Strip out engagement-bait and outrage. Topic-blind, never boosts.',
      // remove-only: calm content rests at KEEP, bait sinks to DIM/HIDE.
      d: (s) => clamp(0.20 - 1.75 * s.arous)
    },
    custom: {
      id: 'custom', label: 'Steer', mode: 'absolute',
      blurb: 'You set the heading: more of these terms, less of those.',
      d: (s) => clamp(1.6 * s.more - 1.6 * s.less - 0.4 * s.arous)
    },
    touchgrass: {
      id: 'touchgrass', label: 'Touch grass', mode: 'cap',
      blurb: 'Thin the feed to a handful. The anti-algorithm.',
      // orchestrator enforces the session cap; this only pre-sinks loud bait.
      d: (s) => clamp(0.1 - 1.9 * s.arous),
      rank: (s) => -s.arous   // calmest survive the cap
    }
  };

  function clamp(x) { return x < -1 ? -1 : x > 1 ? 1 : x; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  function signals(features, ctx) {
    const tokens = features.tokens || [];
    return {
      fam: ctx.usual ? P.similarity(tokens, ctx.usual) : 0,
      focus: ctx.focus ? P.similarity(tokens, ctx.focus) : 0,
      arous: features.arousal || 0,
      more: P.termOverlap(tokens, ctx.moreTerms),
      less: P.termOverlap(tokens, ctx.lessTerms)
    };
  }

  // Absolute desirability -> action.
  function decide(d, intensity) {
    const t = clamp01(intensity == null ? 0.5 : intensity);
    const boostT = 0.55 - 0.30 * t;
    const hideT = -0.45 + 0.25 * t;
    const dimT = -0.12 - 0.10 * (1 - t);
    if (d >= boostT) return 'BOOST';
    if (d <= hideT) return 'HIDE';
    if (d <= dimT) return 'DIM';
    return 'KEEP';
  }

  function modeOf(id) { return (DIRECTIONS[id] || DIRECTIONS.detox).mode; }

  // Per-item evaluation. Absolute -> concrete action. Relative -> DEFER + rank.
  function evaluate(features, ctx) {
    const dir = DIRECTIONS[ctx.direction] || DIRECTIONS.detox;
    const s = signals(features, ctx);
    if (dir.mode === 'absolute') {
      const d = dir.d(s);
      return { action: decide(d, ctx.intensity), d, mode: dir.mode, signals: s, direction: dir.id };
    }
    // relative or cap: orchestrator decides using rank across the batch.
    return { action: 'DEFER', rank: dir.rank(s), d: dir.d ? dir.d(s) : 0, mode: dir.mode, signals: s, direction: dir.id };
  }

  // Relative tail assignment. `scored` = [{ ref, rank }]. Returns Map ref->action.
  // Top boostPct pulled toward; bottom pushPct pushed away (HIDE if intensity is
  // high, else DIM); middle KEPT.
  function assignByQuantile(scored, boostPct, pushPct, intensity) {
    const t = clamp01(intensity == null ? 0.5 : intensity);
    const out = new Map();
    const arr = scored.slice().sort((a, b) => b.rank - a.rank);
    const n = arr.length;
    if (!n) return out;
    const nBoost = Math.max(1, Math.round(boostPct * n));
    const nPush = Math.max(1, Math.round(pushPct * n));
    const pushAction = t >= 0.6 ? 'HIDE' : 'DIM';
    arr.forEach((item, i) => {
      if (i < nBoost) out.set(item.ref, 'BOOST');
      else if (i >= n - nPush) out.set(item.ref, pushAction);
      else out.set(item.ref, 'KEEP');
    });
    return out;
  }

  return { DIRECTIONS, evaluate, decide, signals, assignByQuantile, modeOf, clamp, clamp01 };
});
