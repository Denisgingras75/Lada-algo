// Content Classifier - Determines if content is educational, junk, or neutral

const CLASSIFIER_RULES = {
  polymath: {
    educational: [
      'MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge',
      'lecture', 'course', 'tutorial', 'explained', 'documentary',
      'TED', 'science', 'history', 'philosophy', 'mathematics',
      'OpenCourseWare', 'Khan Academy', 'Crash Course'
    ],
    junk: [
      'SHOCKING', 'UNBELIEVABLE', 'WON\'T BELIEVE', 'GONE WRONG',
      'clickbait', 'drama', 'exposed', 'beef', 'cancelled',
      'flat earth', 'conspiracy', 'MUST WATCH', 'SECRET REVEALED'
    ]
  },

  engineer: {
    educational: [
      'engineering', 'coding', 'programming', 'tutorial', 'how to build',
      'Python', 'JavaScript', 'React', 'system design', 'architecture',
      'MIT', 'CS50', 'ThePrimeagen', 'Fireship', 'NetworkChuck',
      'backend', 'frontend', 'DevOps', 'cloud', 'AWS', 'Docker'
    ],
    junk: [
      'SHOCKED', 'drama', 'exposed', 'cancelled', 'beef',
      'GONE WRONG', 'clickbait', 'conspiracy', 'hack your brain'
    ]
  },

  strategist: {
    educational: [
      'business', 'strategy', 'finance', 'investing', 'economics',
      'Y Combinator', 'Bloomberg', 'CNBC', 'Warren Buffett', 'Charlie Munger',
      'startup', 'entrepreneurship', 'MBA', 'case study', 'analysis',
      'Aswath Damodaran', 'Michael Porter', 'McKinsey', 'BCG'
    ],
    junk: [
      'get rich quick', 'EASY MONEY', 'SECRET METHOD', 'crypto pump',
      'exposed', 'drama', 'clickbait', 'SHOCKED', 'scam revealed'
    ]
  },

  stoic: {
    educational: [
      'stoicism', 'philosophy', 'meditation', 'Marcus Aurelius', 'Epictetus',
      'Seneca', 'mindfulness', 'psychology', 'CBT', 'mental health',
      'School of Life', 'Alan Watts', 'wisdom', 'self-improvement',
      'Jordan Peterson', 'Sam Harris', 'Viktor Frankl'
    ],
    junk: [
      'LIFE HACK', 'EASY FIX', 'drama', 'exposed', 'cancelled',
      'clickbait', 'SHOCKING', 'gossip', 'beef'
    ]
  },

  scientist: {
    educational: [
      'science', 'research', 'study', 'MIT', 'Stanford', 'Nature', 'Cell',
      'physics', 'chemistry', 'biology', 'astronomy', 'neuroscience',
      'SmarterEveryDay', 'Veritasium', 'Kurzgesagt', 'PBS Space Time',
      'experiment', 'data', 'peer-reviewed', 'journal', 'Nobel Prize'
    ],
    junk: [
      'pseudoscience', 'flat earth', 'conspiracy', 'debunked', 'exposed',
      'SHOCKING', 'clickbait', 'SECRET CURE', 'doctors hate this'
    ]
  },

  artist: {
    educational: [
      'art', 'design', 'creative', 'tutorial', 'technique', 'process',
      'Proko', 'painting', 'drawing', 'sculpture', 'photography',
      'composition', 'color theory', 'perspective', 'anatomy',
      'portfolio', 'exhibition', 'museum', 'masterclass'
    ],
    junk: [
      'drama', 'exposed', 'cancelled', 'beef', 'clickbait',
      'SHOCKING', 'GONE WRONG', 'gossip'
    ]
  },

  warrior: {
    educational: [
      'fitness', 'training', 'workout', 'strength', 'discipline',
      'martial arts', 'boxing', 'MMA', 'technique', 'form',
      'AthleanX', 'Jeff Nippard', 'Renaissance Periodization',
      'nutrition', 'exercise science', 'biomechanics', 'Jocko Willink'
    ],
    junk: [
      'SHOCKING', 'drama', 'exposed', 'beef', 'cancelled',
      'clickbait', 'EASY TRICK', 'SECRET METHOD', 'doctors hate'
    ]
  },

  healer: {
    educational: [
      'health', 'medicine', 'wellness', 'nutrition', 'longevity',
      'Huberman Lab', 'Peter Attia', 'Andrew Huberman', 'Dr. Rhonda Patrick',
      'sleep', 'fitness', 'diet', 'mental health', 'therapy',
      'peer-reviewed', 'study', 'research', 'medical', 'science-based'
    ],
    junk: [
      'SECRET CURE', 'doctors hate', 'BIG PHARMA', 'miracle cure',
      'detox', 'cleanse', 'SHOCKING', 'exposed', 'clickbait'
    ]
  },

  explorer: {
    educational: [
      'travel', 'geography', 'culture', 'documentary', 'adventure',
      'National Geographic', 'BBC Earth', 'history', 'anthropology',
      'exploration', 'expedition', 'nature', 'wildlife', 'Rick Steves',
      'language', 'civilization', 'archaeology'
    ],
    junk: [
      'SHOCKING', 'GONE WRONG', 'drama', 'exposed', 'clickbait',
      'beef', 'cancelled', 'gossip', 'conspiracy'
    ]
  },

  sage: {
    educational: [
      'wisdom', 'philosophy', 'spirituality', 'meditation', 'consciousness',
      'Alan Watts', 'Ram Dass', 'Eckhart Tolle', 'Joseph Campbell',
      'mythology', 'meaning', 'purpose', 'enlightenment', 'Buddhism',
      'Taoism', 'Vedanta', 'contemplation', 'mindfulness'
    ],
    junk: [
      'SHOCKING', 'SECRET REVEALED', 'clickbait', 'drama', 'exposed',
      'quick fix', 'EASY METHOD', 'conspiracy', 'cult'
    ]
  }
};

class ContentClassifier {
  constructor(persona) {
    this.persona = persona;
    this.rules = CLASSIFIER_RULES[persona] || CLASSIFIER_RULES.polymath;
  }

  classify(text) {
    if (!text) return 'neutral';

    const normalizedText = text.toLowerCase();

    // Check for educational keywords
    const educationalMatches = this.rules.educational.filter(keyword =>
      normalizedText.includes(keyword.toLowerCase())
    );

    // Check for junk keywords
    const junkMatches = this.rules.junk.filter(keyword =>
      normalizedText.includes(keyword.toLowerCase())
    );

    // Scoring system
    if (junkMatches.length > 0) {
      return 'junk';
    }

    if (educationalMatches.length >= 1) {
      return 'educational';
    }

    return 'neutral';
  }

  classifyVideo(title, channelName, description = '') {
    const combinedText = `${title} ${channelName} ${description}`;
    return this.classify(combinedText);
  }

  shouldInteract(classification) {
    return classification === 'educational' || classification === 'junk';
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContentClassifier, CLASSIFIER_RULES };
}
