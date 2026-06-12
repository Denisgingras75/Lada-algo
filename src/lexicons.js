/* drift — lexicons.js
 * The ONE honest universal signal: engagement-bait / manufactured-arousal.
 *
 * This is deliberately NOT a taste list. We do not encode "vlogs are junk" or
 * "astrology is junk." Those are preferences, and preferences belong to the
 * user (see the Custom direction). What we detect here is structural: titles
 * engineered to hijack attention regardless of topic — manufactured urgency,
 * outrage framing, withheld payoffs, and SHOUTING. A calm video about makeup
 * and a calm video about quantum field theory both score ~0. A ragebait video
 * about either scores high. That is the only value judgment baked into drift,
 * and it is a judgment about *form*, not *subject*.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  root.FF = root.FF || {};
  root.FF.lex = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Manufactured-arousal phrases. Form, not topic.
  const AROUSAL_PHRASES = [
    "you won't believe", 'you wont believe', 'will shock you', 'shocking',
    'gone wrong', 'gone sexual', 'will change your life', 'changed my life',
    'the truth about', "they don't want you", 'they dont want you',
    'what happened next', 'wait for it', 'wait till the end', 'watch till the end',
    'must watch', 'must see', 'mind blowing', 'mind-blowing', 'blew my mind',
    'secret revealed', 'secrets revealed', 'caught on camera', 'exposed',
    'destroyed', 'obliterated', 'annihilated', 'owned', 'humiliated', 'wrecked',
    'rekt', 'ratioed', 'triggered', 'epic fail', 'i was wrong about',
    'nobody is talking about', 'no one is talking about', 'this is why',
    'before its too late', "before it's too late", 'do this now', 'stop doing',
    'instantly', 'in seconds', 'one weird trick', 'doctors hate', 'big pharma',
    'almost died', 'nearly died', 'i quit', 'the end of', 'is over',
    'finally exposed', 'the real reason', 'what really happened', 'you need to see'
  ];

  // Pure punctuation / formatting tells.
  const STOPWORDS = new Set([
    'the','a','an','and','or','but','if','of','to','in','on','for','with','at',
    'by','from','up','out','as','is','it','this','that','these','those','my',
    'your','our','their','his','her','its','was','were','be','been','being','are',
    'am','do','does','did','how','what','why','when','where','who','which','will',
    'just','not','no','yes','can','could','should','would','about','vs','versus',
    'i','you','we','they','he','she','them','us','me','him','part','full','new',
    'official','video','ft','feat','vol'
  ]);

  function tokenize(title, channel) {
    const raw = `${title || ''} ${channel || ''}`.toLowerCase();
    const words = raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    const out = [];
    for (const w of words) {
      if (w.length < 3) continue;
      if (STOPWORDS.has(w)) continue;
      out.push(w);
    }
    return out;
  }

  // Returns 0..1. Topic-agnostic. Operates on the ORIGINAL title so SHOUTING
  // survives (lowercasing would erase it).
  function arousal(title) {
    if (!title) return 0;
    const lower = title.toLowerCase();

    let phraseHits = 0;
    for (const p of AROUSAL_PHRASES) {
      if (lower.includes(p)) phraseHits++;
    }

    // ALL-CAPS word ratio (length>=3, has a letter). "I" and "A" don't count.
    const words = title.split(/\s+/).filter(Boolean);
    let capsWords = 0, lettered = 0;
    for (const w of words) {
      const letters = w.replace(/[^A-Za-z]/g, '');
      if (letters.length < 3) continue;
      lettered++;
      if (letters === letters.toUpperCase()) capsWords++;
    }
    const capsRatio = lettered ? capsWords / lettered : 0;

    // Excess punctuation: multiple !/? or a cliffhanger ellipsis.
    const bangs = (title.match(/!/g) || []).length;
    const qs = (title.match(/\?/g) || []).length;
    const ellipsis = /\.\.\.|…/.test(title) ? 1 : 0;
    const punct = Math.min(1, Math.max(0, bangs - 1) * 0.4 + Math.max(0, qs - 1) * 0.3 + ellipsis * 0.4);

    const score =
      Math.min(phraseHits, 3) * 0.28 +
      capsRatio * 0.55 +
      punct * 0.25;

    return Math.max(0, Math.min(1, score));
  }

  return { tokenize, arousal, AROUSAL_PHRASES, STOPWORDS };
});
