// Algorithm VPN — Scoring Engine v1
// Pure keyword-based scoring. No network requests, no ML, no privacy concerns.
// Under 1ms per post. Runs entirely in the browser.

const AlgorithmVPN = {
  version: '1.0.0',

  // ── Persona Definitions ──────────────────────────────────────────────

  PERSONAS: {
    raw: {
      id: 'raw',
      name: 'Raw',
      description: 'Pure chronological — no algorithm',
      icon: 'R',
      type: 'chronological'
    },

    calm: {
      id: 'calm',
      name: 'Calm',
      description: 'Downranks outrage and emotional manipulation',
      icon: 'C',
      type: 'keyword',
      negative_keywords: [
        // Outrage / clickbait signals
        'shocking', 'unbelievable', "won't believe", 'gone wrong', 'must watch',
        'secret revealed', 'the truth about', 'destroying', 'slams', 'destroyed',
        'obliterated', 'annihilated', 'eviscerated', 'demolished',
        // Drama / gossip
        'drama', 'exposed', 'beef', 'cancelled', 'tea', 'receipts', 'gossip',
        'paparazzi', 'feud', 'claps back', 'fires back', 'lashes out',
        // Engagement bait
        'clickbait', 'rage bait', 'you need to see this', "i can't believe",
        'wait for it', 'what happens next', 'share before deleted',
        // Fear / doom
        'panic', 'doom', 'catastrophe', 'terrifying', 'horrifying',
        'fear mongering', 'end times', 'collapse', 'nightmare',
        // Manipulation
        'prank', 'social experiment', 'gold digger',
        'pickup artist', 'manipulation', 'mind games',
        // Ideological rage bait
        'owned', 'destroyed with facts', 'triggered', 'snowflake',
        'woke mob', 'cancel culture', 'liberal tears',
        // Scam / hustle
        'get rich quick', 'easy money', 'secret method', 'passive income',
        'scam', 'fraud', 'pyramid scheme', 'mlm',
        // Low-effort viral
        'fail compilation', 'cringe', 'try not to laugh', 'dank memes',
        'mukbang', 'storytime', 'reacting to',
        // Conspiracy
        'flat earth', 'conspiracy', 'illuminati', 'new world order',
        'chemtrails', 'reptilian', 'ancient aliens',
        // Toxic health/body content
        'secret cure', 'doctors hate', 'big pharma', 'miracle cure',
        'detox', 'cleanse'
      ],
      positive_keywords: [
        'research', 'study', 'analysis', 'perspective', 'nuanced',
        'comprehensive', 'evidence', 'peer-reviewed', 'data', 'findings',
        'methodology', 'review', 'thoughtful', 'balanced', 'in-depth',
        'exploration', 'documentary', 'explained', 'understanding', 'insight',
        'discussion', 'conversation', 'interview', 'lecture', 'course',
        'investigation', 'long read', 'deep dive', 'reported'
      ],
      weights: { negative_keyword: -10, negative_pattern: -15, positive_keyword: 5 }
    },

    learn: {
      id: 'learn',
      name: 'Learn',
      description: 'Surfaces educational and informational content',
      icon: 'L',
      type: 'keyword',
      positive_keywords: [
        // Institutions
        'MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge', 'Caltech',
        'Princeton', 'Yale', 'Columbia', 'ETH Zurich', 'Imperial College',
        'Berkeley', 'Carnegie Mellon',
        // Learning platforms
        'OpenCourseWare', 'Khan Academy', 'Crash Course', 'Coursera',
        'edX', 'TED', 'TED-Ed', 'Big Think', 'MasterClass', 'Great Courses',
        'Farnam Street', 'LessWrong',
        // Education signals
        'lecture', 'course', 'tutorial', 'explained', 'documentary',
        'analysis', 'synthesis', 'how it works', 'introduction to',
        'step by step', 'fundamentals', 'from scratch', 'deep dive',
        'complete guide', 'full course', 'masterclass',
        // Sciences
        'physics', 'chemistry', 'biology', 'mathematics', 'neuroscience',
        'quantum mechanics', 'evolution', 'genetics', 'astronomy',
        'psychology', 'anthropology', 'archaeology', 'paleontology',
        'geology', 'ecology', 'climate science',
        // Scientific sources
        'peer-reviewed', 'journal', 'paper', 'study', 'research',
        'experiment', 'clinical trial', 'meta-analysis',
        'Nature', 'Science', 'Cell', 'NASA', 'CERN', 'NIH',
        // Technology
        'programming', 'engineering', 'computer science',
        'software architecture', 'machine learning', 'artificial intelligence',
        'system design', 'distributed systems', 'algorithms',
        // Philosophy & humanities
        'philosophy', 'ethics', 'epistemology', 'history', 'linguistics',
        'cognitive science', 'sociology', 'political science', 'economics',
        'critical thinking', 'logic', 'rhetoric',
        // Educational channels
        'Veritasium', 'Kurzgesagt', '3Blue1Brown', 'SmarterEveryDay',
        'Numberphile', 'Computerphile', 'PBS Space Time', 'SciShow',
        'MinutePhysics', 'Tom Scott', 'Fireship', 'ThePrimeagen',
        'Real Engineering', 'Practical Engineering', 'Ben Eater',
        'Huberman Lab', 'Peter Attia', 'Lex Fridman',
        // Key figures
        'Richard Feynman', 'Carl Sagan', 'David Attenborough',
        'Noam Chomsky', 'Daniel Kahneman', 'Yuval Noah Harari',
        'Sabine Hossenfelder', 'Sean Carroll',
        // Business & strategy (educational)
        'Harvard Business Review', 'The Economist', 'Financial Times',
        'Wall Street Journal', 'valuation', 'competitive advantage',
        'Warren Buffett', 'Charlie Munger', 'Ray Dalio',
        // Health (educational)
        'longevity', 'circadian rhythm', 'microbiome', 'autophagy',
        'nutrition science', 'sleep science', 'exercise physiology'
      ],
      negative_keywords: [
        'clickbait', 'drama', 'exposed', 'prank', 'challenge',
        'conspiracy', 'flat earth', 'pseudoscience', 'hoax',
        'get rich quick', 'scam', 'fraud',
        'mukbang', 'storytime', 'gossip', 'tea', 'receipts',
        'fail compilation', 'cringe', 'try not to laugh',
        'shocking', 'unbelievable', 'gone wrong', 'must watch',
        'secret cure', 'doctors hate', 'miracle cure',
        'ancient aliens', 'paranormal', 'ghost hunting'
      ],
      weights: { positive_keyword: 10, negative_keyword: -8, negative_pattern: -10 }
    },

    discovery: {
      id: 'discovery',
      name: 'Discovery',
      description: 'Breaks your echo chamber — boosts what you rarely see',
      icon: 'D',
      type: 'discovery',
      // Discovery uses engagement heuristics, not pure keywords
      // V1: Inverse popularity scoring + diversity keyword boost
      diversity_boost: [
        'documentary', 'lecture', 'research', 'independent', 'underground',
        'local', 'community', 'alternative', 'experimental', 'niche',
        'deep dive', 'longform', 'essay', 'analysis', 'forgotten',
        'overlooked', 'hidden gem', 'underrated', 'small channel',
        'first video', 'unknown', 'rare', 'unusual', 'uncommon'
      ],
      viral_penalty: [
        'viral', 'trending', 'everyone is', 'the internet is',
        'breaking the internet', 'gone viral', 'millions of views',
        'most watched', 'most popular', 'blowing up', '#1'
      ],
      weights: { diversity_boost: 5, viral_penalty: -5, popularity_scale: -2 }
    },

    focus: {
      id: 'focus',
      name: 'Focus',
      description: 'Shows content matching your specified topics',
      icon: 'F',
      type: 'custom',
      weights: { keyword_match: 20 }
    }
  },

  // ── Pre-computed Caches ──────────────────────────────────────────────

  _lowerCache: new Map(),

  _getLowerKeywords(personaId, field) {
    const key = `${personaId}:${field}`;
    if (!this._lowerCache.has(key)) {
      const persona = this.PERSONAS[personaId];
      const keywords = persona && persona[field];
      if (!keywords) {
        this._lowerCache.set(key, []);
      } else {
        this._lowerCache.set(key, keywords.map(k => k.toLowerCase()));
      }
    }
    return this._lowerCache.get(key);
  },

  // ── Main Scoring Function ────────────────────────────────────────────

  scorePost(text, metadata, personaId, userConfig) {
    if (!text || !personaId) return 0;

    const persona = this.PERSONAS[personaId];
    if (!persona) return 0;

    // Raw = chronological sort by timestamp
    if (persona.type === 'chronological') {
      return metadata.timestamp || 0;
    }

    const normalizedText = text.toLowerCase();
    let score = 0;

    // Keyword-based personas (Calm, Learn)
    if (persona.type === 'keyword') {
      score = this._scoreKeywords(normalizedText, text, personaId, persona);
    }

    // Discovery persona
    if (persona.type === 'discovery') {
      score = this._scoreDiscovery(normalizedText, metadata, personaId);
    }

    // Focus (custom) persona
    if (persona.type === 'custom') {
      score = this._scoreFocus(normalizedText, userConfig, persona);
    }

    return score;
  },

  // ── Keyword Scoring ──────────────────────────────────────────────────

  _scoreKeywords(normalizedText, originalText, personaId, persona) {
    let score = 0;

    // Negative keyword matches
    const negatives = this._getLowerKeywords(personaId, 'negative_keywords');
    for (const keyword of negatives) {
      if (normalizedText.includes(keyword)) {
        score += persona.weights.negative_keyword;
      }
    }

    // Positive keyword matches
    const positives = this._getLowerKeywords(personaId, 'positive_keywords');
    for (const keyword of positives) {
      if (normalizedText.includes(keyword)) {
        score += persona.weights.positive_keyword;
      }
    }

    // Pattern scoring (outrage patterns in original text, case-sensitive)
    if (persona.weights.negative_pattern) {
      score += this._scorePatterns(originalText, persona.weights.negative_pattern);
    }

    return score;
  },

  _scorePatterns(text, patternWeight) {
    let score = 0;

    // ALL CAPS detection: 3+ words that are all uppercase and 2+ chars each
    const words = text.split(/\s+/);
    let capsStreak = 0;
    for (const word of words) {
      if (word.length >= 2 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
        capsStreak++;
        if (capsStreak >= 3) {
          score += patternWeight;
          break;
        }
      } else {
        capsStreak = 0;
      }
    }

    // Excessive punctuation: 3+ consecutive ! or ?
    if (/[!?]{3,}/.test(text)) {
      score += patternWeight;
    }

    return score;
  },

  // ── Discovery Scoring ────────────────────────────────────────────────

  _scoreDiscovery(normalizedText, metadata, personaId) {
    let score = 0;
    const persona = this.PERSONAS[personaId];

    // Inverse popularity: fewer views = higher score
    if (metadata.viewCount && metadata.viewCount > 0) {
      score += Math.max(-Math.log10(metadata.viewCount) * persona.weights.popularity_scale, -20);
    }

    // Boost diversity signals
    const boostKeywords = this._getLowerKeywords(personaId, 'diversity_boost');
    for (const keyword of boostKeywords) {
      if (normalizedText.includes(keyword)) {
        score += persona.weights.diversity_boost;
      }
    }

    // Penalize viral signals
    const penaltyKeywords = this._getLowerKeywords(personaId, 'viral_penalty');
    for (const keyword of penaltyKeywords) {
      if (normalizedText.includes(keyword)) {
        score += persona.weights.viral_penalty;
      }
    }

    return score;
  },

  // ── Focus (Custom) Scoring ───────────────────────────────────────────

  _scoreFocus(normalizedText, userConfig, persona) {
    let score = 0;
    const keywords = (userConfig && userConfig.focusKeywords) || [];
    for (const keyword of keywords) {
      if (keyword && normalizedText.includes(keyword.toLowerCase())) {
        score += persona.weights.keyword_match;
      }
    }
    return score;
  }
};
