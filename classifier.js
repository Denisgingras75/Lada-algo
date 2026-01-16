// Content Classifier - The "Semantic Vacuum" Edition

const CLASSIFIER_RULES = {
  polymath: {
    educational: [
      // Institutions & Prestige
      'MIT', 'Stanford', 'Harvard', 'Oxford', 'Cambridge', 'Caltech', 'Princeton', 'Yale',
      'Columbia', 'Chicago', 'ETH Zurich', 'Imperial College', 'UCL', 'Sorbonne',
      // Learning Platforms & Sources
      'OpenCourseWare', 'Khan Academy', 'Crash Course', 'Coursera', 'edX', 'Udacity',
      'TED', 'TED-Ed', 'Big Think', 'Nautilus', 'Aeon', 'The Atlantic', 'New Yorker',
      'MasterClass', 'Great Courses', 'Farnam Street', 'LessWrong', 'Long Now',
      // Disciplines (Broad)
      'lecture', 'course', 'tutorial', 'explained', 'documentary', 'analysis', 'synthesis',
      'mathematics', 'physics', 'philosophy', 'history', 'linguistics', 'anthropology',
      'epistemology', 'cognitive science', 'neuroscience', 'complexity theory', 'game theory',
      'systems thinking', 'mental models', 'first principles', 'critical thinking',
      'literature', 'classics', 'fine art', 'music theory', 'architecture', 'urban planning',
      'sociology', 'political science', 'geopolitics', 'economics', 'psychology',
      // Specific Concepts
      'interdisciplinary', 'autodidact', 'learning to learn', 'meta-learning',
      'memory palace', 'speed reading', 'logic', 'rhetoric', 'dialectic', 'trivium',
      'quadrivium', 'scientific method', 'empirical', 'rationality', 'bias', 'fallacy',
      'entropy', 'emergence', 'evolution', 'heuristics', 'algorithms', 'paradox',
      // Key Figures (Polymaths & Thinkers)
      'Leonardo da Vinci', 'Benjamin Franklin', 'Richard Feynman', 'Bertrand Russell',
      'Noam Chomsky', 'Douglas Hofstadter', 'Buckminster Fuller', 'John von Neumann',
      'Alan Turing', 'Goethe', 'Leibniz', 'Aristotle', 'Hypatia', 'Ada Lovelace',
      'Naval Ravikant', 'Nassim Taleb', 'Daniel Kahneman', 'Yuval Noah Harari'
    ],
    junk: [
      'SHOCKING', 'UNBELIEVABLE', 'WON\'T BELIEVE', 'GONE WRONG', 'STORYTIME',
      'clickbait', 'drama', 'exposed', 'beef', 'cancelled', 'tea', 'receipts',
      'flat earth', 'conspiracy', 'MUST WATCH', 'SECRET REVEALED', 'THE TRUTH',
      'prank', 'challenge', 'reacting to', 'unboxing', 'haul', 'mukbang', 'asmr',
      'fail compilation', 'cringe', 'satisfying', 'slime', 'fidget', 'viral',
      'illuminati', 'new world order', 'reptilian', 'alien', 'ufo', 'ghost',
      'psychic', 'astrology', 'horoscope', 'tarot', 'palm reading', 'crystal healing',
      'celeb', 'gossip', 'paparazzi', 'red carpet', 'fashion police', 'react',
      'tiktok compilation', 'vine compilation', 'try not to laugh', 'dank memes'
    ]
  },

  engineer: {
    educational: [
      // Core Disciplines
      'engineering', 'coding', 'programming', 'development', 'computer science',
      'mechanical', 'electrical', 'civil', 'chemical', 'aerospace', 'biomedical',
      'structural', 'industrial', 'software', 'hardware', 'firmware',
      // Languages & Frameworks
      'Python', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'C++', 'Java', 'C#',
      'React', 'Vue', 'Angular', 'Svelte', 'Node.js', 'Django', 'Flask', 'Spring',
      'Swift', 'Kotlin', 'Dart', 'Flutter', 'TensorFlow', 'PyTorch', 'Pandas',
      // Infrastructure & Ops
      'system design', 'software architecture', 'microservices', 'distributed systems',
      'DevOps', 'CI/CD', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform',
      'Ansible', 'Jenkins', 'Linux', 'Unix', 'Bash', 'Shell', 'Serverless',
      // Data & Storage
      'database', 'SQL', 'NoSQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka',
      'Elasticsearch', 'Cassandra', 'DynamoDB', 'GraphQL', 'REST API',
      // Hardware, Electronics & Maker
      'Arduino', 'Raspberry Pi', 'microcontroller', 'FPGA', 'PCB design', 'soldering',
      'robotics', 'mechatronics', 'automation', 'IoT', 'embedded systems', 'Verilog',
      '3D printing', 'CAD', 'SolidWorks', 'Fusion 360', 'CNC', 'manufacturing',
      'Esp32', 'STM32', 'circuit', 'schematic', 'breadboard', 'oscilloscope',
      // Channels & Figures
      'ThePrimeagen', 'Fireship', 'NetworkChuck', 'Ben Eater', 'GreatScott!',
      'Engineering Explained', 'Real Engineering', 'Practical Engineering', 'EEVblog',
      'MIT 6.006', 'CS50', 'Computerphile', 'Tom Scott', 'Veritasium', 'Stuff Made Here',
      'Mark Rober', 'Michael Reeves', 'Colin Furze', 'SmarterEveryDay', 'ElectroBOOM'
    ],
    junk: [
      'hacker', 'hacking tutorial', 'dark web', 'deep web', 'virus', 'malware',
      'how to hack', 'free wifi', 'password cracking', 'ddos', 'doxing',
      'scam', 'fraud', 'money glitch', 'infinite money', 'unlimited gems',
      'SHOCKED', 'drama', 'exposed', 'cancelled', 'beef', 'tech support scam',
      'fake', 'counterfeit', 'piracy', 'torrent', 'crack', 'keygen', 'serial',
      'jailbreak', 'root', 'bypass', 'unlock', 'glitch', 'bug', 'fail',
      'gadget review', 'unboxing', 'drop test', 'will it blend', 'destroying',
      'hydraulic press', 'shredder', 'satisfying clean', 'restoration fake',
      'life hack', '5 minute crafts', 'diy fail', 'tech roasting'
    ]
  },

  strategist: {
    educational: [
      // Business & Strategy
      'business', 'strategy', 'finance', 'investing', 'economics', 'macroeconomics',
      'accounting', 'marketing', 'sales', 'management', 'leadership', 'negotiation',
      'entrepreneurship', 'startup', 'venture capital', 'private equity', 'hedge fund',
      'mergers', 'acquisitions', 'IPO', 'SPAC', 'antitrust', 'regulation',
      // Financial Analysis
      'valuation', 'DCF', 'cash flow', 'balance sheet', 'income statement', '10-K',
      'market analysis', 'competitive advantage', 'moat', 'network effect', 'flywheel',
      'ROI', 'ROIC', 'EBITDA', 'margin', 'leverage', 'liquidity', 'solvency',
      // Sources & Institutions
      'Y Combinator', 'Bloomberg', 'CNBC', 'Wall Street Journal', 'Financial Times',
      'Harvard Business Review', 'McKinsey', 'Bain', 'BCG', 'Goldman Sachs',
      'The Economist', 'Forbes', 'Fortune', 'Business Insider', 'TechCrunch',
      // Key Figures
      'Warren Buffett', 'Charlie Munger', 'Ray Dalio', 'Peter Thiel', 'Naval Ravikant',
      'Aswath Damodaran', 'Michael Porter', 'Clayton Christensen', 'Bill Ackman',
      'Elon Musk', 'Jeff Bezos', 'Howard Marks', 'Chamath Palihapitiya',
      'Berkshire Hathaway', 'Bridgewater', 'Sequoia', 'Andreessen Horowitz'
    ],
    junk: [
      'get rich quick', 'EASY MONEY', 'SECRET METHOD', 'passive income',
      'crypto pump', 'moon shot', '100x', '1000x', 'shiba inu', 'dogecoin', 'pepe',
      'nft', 'drop shipping', 'amazon fba', 'affiliate marketing', 'mlm', 'pyramid scheme',
      'forex signal', 'binary options', 'day trading', 'swing trading', 'penny stocks',
      'exposed', 'drama', 'clickbait', 'SHOCKED', 'scam revealed', 'luxury lifestyle',
      'lamborghini', 'mansion', 'yacht', 'flex', 'hustle culture', 'grindset',
      'alpha', 'sigma', 'how to sell', 'closer', 'high ticket', 'course selling',
      'fake guru', 'rented lambo', 'airbnb arbitrage', 'automated store'
    ]
  },

  stoic: {
    educational: [
      // Philosophy & Concepts
      'stoicism', 'philosophy', 'ethics', 'virtue', 'wisdom', 'temperance', 'courage', 'justice',
      'meditation', 'mindfulness', 'reflection', 'journaling', 'contemplation',
      'dichotomy of control', 'amor fati', 'memento mori', 'premeditatio malorum',
      'eudaimonia', 'arete', 'ataraxia', 'logos', 'nature', 'reason', 'sympatheia',
      'epistemology', 'metaphysics', 'logic', 'cynicism', 'epicureanism',
      // Key Figures (Ancient)
      'Marcus Aurelius', 'Seneca', 'Epictetus', 'Cato', 'Zeno', 'Musonius Rufus',
      'Chrysippus', 'Cleanthes', 'Hierocles', 'Panaetius', 'Posidonius',
      // Key Figures (Modern)
      'Ryan Holiday', 'Tim Ferriss', 'Robert Greene', 'Alain de Botton', 'Massimo Pigliucci',
      'The School of Life', 'Daily Stoic', 'Einzelgänger', 'Academy of Ideas',
      'Jordan Peterson', 'Sam Harris', 'Viktor Frankl', 'Jocko Willink', 'Pierre Hadot'
    ],
    junk: [
      'LIFE HACK', 'EASY FIX', 'instant', 'magic pill', 'secret trick',
      'drama', 'exposed', 'cancelled', 'gossip', 'beef', 'tea',
      'pickup artist', 'pua', 'seduction', 'red pill', 'black pill', 'incel',
      'alpha male', 'sigma male', 'beta', 'simp', 'looksmaxxing',
      'prank', 'social experiment', 'gold digger', 'cheating',
      'anxiety inducing', 'panic', 'fear', 'doom scrolling', 'rage bait',
      'destroy', 'own', 'humiliate', 'feminist owned', 'liberal owned',
      'dating advice', 'texting tricks', 'mind games', 'manipulation'
    ]
  },

  scientist: {
    educational: [
      // Core Sciences
      'science', 'research', 'study', 'experiment', 'data', 'analysis',
      'physics', 'chemistry', 'biology', 'astronomy', 'geology', 'mathematics',
      'quantum mechanics', 'relativity', 'thermodynamics', 'evolution', 'genetics',
      'neuroscience', 'psychology', 'anthropology', 'archaeology', 'paleontology',
      'botany', 'zoology', 'mycology', 'entomology', 'marine biology', 'oceanography',
      // Specific Topics
      'CRISPR', 'mRNA', 'fusion', 'fission', 'dark matter', 'black hole', 'supernova',
      'tectonics', 'climate change', 'biodiversity', 'ecosystem', 'photosynthesis',
      'particle physics', 'standard model', 'string theory', 'loop quantum gravity',
      // Sources & Figures
      'Nature', 'Science', 'Cell', 'peer-reviewed', 'journal', 'paper',
      'NASA', 'ESA', 'CERN', 'NOAA', 'NIH', 'CDC', 'Royal Society',
      'SmarterEveryDay', 'Veritasium', 'Kurzgesagt', 'PBS Space Time', 'SciShow',
      'Physics Girl', 'MinutePhysics', '3Blue1Brown', 'Numberphile', 'Sixty Symbols',
      'Richard Feynman', 'Carl Sagan', 'Neil deGrasse Tyson', 'Brian Cox', 'Michio Kaku',
      'Sabine Hossenfelder', 'Sean Carroll', 'Roger Penrose', 'David Attenborough'
    ],
    junk: [
      'pseudoscience', 'flat earth', 'hollow earth', 'young earth', 'creationism',
      'conspiracy', 'debunked', 'exposed', 'coverup', 'hoax', 'fake',
      'SHOCKING', 'clickbait', 'SECRET CURE', 'doctors hate this',
      'ancient aliens', 'ufo', 'bigfoot', 'ghost hunting', 'paranormal',
      'perpetual motion', 'free energy', 'anti-gravity', 'cold fusion',
      'miracle water', 'detox', 'cleanse', 'vibration', 'energy healing', 'quantum mysticism',
      'moon landing fake', 'chemtrails', '5g radiation', 'vaccine autism',
      'reptilian', 'illuminati', 'predictive programming', 'mandela effect'
    ]
  },

  artist: {
    educational: [
      // Visual Arts Techniques
      'art', 'design', 'illustration', 'painting', 'drawing', 'sketching',
      'digital art', 'concept art', 'character design', 'environment design',
      'color theory', 'perspective', 'composition', 'anatomy', 'gesture', 'values',
      'oil painting', 'acrylic', 'watercolor', 'gouache', 'ink', 'charcoal', 'graphite',
      'sculpture', 'ceramics', 'pottery', 'printmaking', 'etching', 'lithography',
      // Design & Photography
      'graphic design', 'typography', 'branding', 'logo design', 'ui/ux', 'web design',
      'photography', 'lighting', 'composition', 'editing', 'retouching', 'color grading',
      'cinema', 'film making', 'directing', 'cinematography', 'storyboarding', 'screenwriting',
      'animation', 'motion graphics', 'vfx', 'cgi', 'stop motion',
      // Sources & Software
      'Proko', 'Draw with Jazza', 'Sycra', 'Feng Zhu', 'Gnomon', 'ArtStation',
      'Adobe Creative Cloud', 'Photoshop', 'Illustrator', 'Procreate', 'Blender', 'Maya',
      'ZBrush', 'Cinema 4D', 'After Effects', 'Premiere', 'Davinci Resolve',
      'James Gurney', 'Aaron Blaise', 'Bobby Chiu', 'Ethan Becker', 'Marco Bucci'
    ],
    junk: [
      'drama', 'exposed', 'cancelled', 'beef', 'thief', 'tracer',
      'clickbait', 'SHOCKING', 'GONE WRONG', 'gossip', 'tea',
      'cringe', 'fail', 'bad art', 'making fun of', 'roasting',
      'tiktok trend', 'challenge', 'prank', 'reaction',
      'nft scam', 'ai art drama', 'stolen art', 'plagiarism',
      'art fix', 'fix my art', 'ruining art', 'destroying art',
      'expensive vs cheap', '100 layers', 'slime', 'squishy'
    ]
  },

  warrior: {
    educational: [
      // Training & Physiology
      'fitness', 'training', 'workout', 'exercise', 'strength', 'hypertrophy',
      'powerlifting', 'weightlifting', 'bodybuilding', 'calisthenics', 'crossfit',
      'mobility', 'flexibility', 'recovery', 'physiology', 'biomechanics', 'anatomy',
      'kinesiology', 'sports science', 'programming', 'periodization', 'progressive overload',
      'cardio', 'conditioning', 'endurance', 'vo2 max', 'heart rate variability',
      // Combat & Martial Arts
      'martial arts', 'boxing', 'kickboxing', 'muay thai', 'jiu jitsu', 'bjj',
      'wrestling', 'judo', 'mma', 'ufc', 'fighting', 'self defense', 'technique',
      'sparring', 'grappling', 'striking', 'takedown', 'submission', 'clinch',
      // Mindset & Discipline
      'discipline', 'resilience', 'toughness', 'grit', 'mindset', 'stoicism',
      'hard work', 'dedication', 'consistency', 'focus', 'determination',
      // Figures
      'Jocko Willink', 'David Goggins', 'Jeff Nippard', 'AthleanX', 'Renaissance Periodization',
      'Squat University', 'Kneesovertoesguy', 'Huberman Lab', 'Peter Attia',
      'Firas Zahabi', 'John Danaher', 'Gordon Ryan', 'Joe Rogan', 'Lex Fridman',
      'Pavel Tsatsouline', 'Kelly Starrett', 'Ross Enamait', 'Iron Wolf'
    ],
    junk: [
      'SHOCKING', 'drama', 'exposed', 'beef', 'cancelled', 'fight',
      'street fight', 'knockout', 'worldstar', 'violence', 'gore',
      'steroids', 'tren', 'sarms', 'natty or not', 'fake weights',
      'EASY TRICK', 'SECRET METHOD', '6 pack in 5 minutes', 'spot reduction',
      'burn belly fat', 'lose weight fast', 'detox', 'cleanse',
      'prank', 'gym fail', 'ego lifting', 'gym creep', 'shaming',
      'food challenge', 'cheat day', '10000 calorie', 'mukbang'
    ]
  },

  healer: {
    educational: [
      // Medical Sciences
      'health', 'medicine', 'wellness', 'longevity', 'nutrition', 'diet',
      'biochemistry', 'physiology', 'endocrinology', 'neuroscience', 'immunology',
      'metabolism', 'hormones', 'gut health', 'microbiome', 'circadian rhythm',
      'autophagy', 'mitochondria', 'inflammation', 'oxidative stress', 'insulin',
      'cardiology', 'oncology', 'neurology', 'psychiatry', 'dermatology',
      // Practices & Protocols
      'sleep', 'fasting', 'intermittent fasting', 'exercise', 'meditation', 'breathwork',
      'therapy', 'psychology', 'CBT', 'DBT', 'trauma', 'addiction', 'recovery', 'healing',
      'sauna', 'cold plunge', 'heat shock proteins', 'zone 2', 'supplements',
      // Figures & Sources
      'Huberman Lab', 'Peter Attia', 'Rhonda Patrick', 'Matthew Walker',
      'David Sinclair', 'Mark Hyman', 'Jason Fung', 'Satchin Panda',
      'peer-reviewed', 'clinical trial', 'meta-analysis', 'cohort study',
      'FoundMyFitness', 'Examine.com', 'PubMed', 'Mayo Clinic', 'Cleveland Clinic'
    ],
    junk: [
      'SECRET CURE', 'doctors hate', 'BIG PHARMA', 'miracle cure',
      'detox', 'cleanse', 'toxins', 'parasites', 'candida', 'rope worms',
      'SHOCKING', 'exposed', 'clickbait', 'fear mongering',
      'homeopathy', 'crystal healing', 'reiki', 'energy healing', 'essential oils',
      'anti-vax', 'conspiracy', '5g', 'chemtrails', 'fluoride',
      'fat burner', 'weight loss pill', 'magic tea', 'flat tummy',
      'raw vegan', 'carnivore drama', 'fruitarian', 'breatharian',
      'fake natty', 'liver king', 'ancestral', 'supplement scam'
    ]
  },

  explorer: {
    educational: [
      // Geography & Places
      'travel', 'geography', 'map', 'cartography', 'culture', 'anthropology',
      'documentary', 'expedition', 'adventure', 'exploration', 'travelogue',
      'nature', 'wildlife', 'biology', 'ecology', 'conservation', 'environment',
      'national park', 'unesco', 'world heritage', 'indigenous', 'nomad',
      // History & Civilization
      'history', 'archaeology', 'civilization', 'ancient', 'empire', 'ruins',
      'prehistory', 'medieval', 'renaissance', 'industrial revolution',
      'Dan Carlin', 'Hardcore History', 'Fall of Civilizations', 'Kings and Generals',
      'History Matters', 'Oversimplified', 'Timeline', 'Invicta',
      // Space & Frontiers
      'space', 'universe', 'cosmos', 'galaxy', 'planet', 'mars', 'moon',
      'NASA', 'SpaceX', 'Blue Origin', 'astronomy', 'astrophysics', 'rocket',
      // Figures
      'Rick Steves', 'Anthony Bourdain', 'David Attenborough', 'Steve Irwin',
      'Jacques Cousteau', 'Bear Grylls', 'Jimmy Donaldson', 'Yes Theory'
    ],
    junk: [
      'SHOCKING', 'GONE WRONG', 'drama', 'exposed', 'clickbait',
      'tourist trap', 'vlog', 'party', 'clubbing', 'drunk', 'wasted',
      'ghost', 'haunted', 'scary', 'creepypasta', 'paranormal',
      'ancient aliens', 'conspiracy', 'flat earth', 'fake history', 'mud flood',
      'prank', 'challenge', 'rich kids', 'luxury travel', 'flex',
      'pickup artist', 'passport bro', 'sex tourism', 'exploitation',
      'begpacker', 'digital nomad scam', 'course selling'
    ]
  },

  sage: {
    educational: [
      // Traditions & Practices
      'wisdom', 'philosophy', 'spirituality', 'meaning', 'purpose', 'consciousness',
      'Buddhism', 'Taoism', 'Zen', 'Vedanta', 'Sufism', 'mysticism', 'Gnosticism',
      'meditation', 'mindfulness', 'contemplation', 'enlightenment', 'awakening',
      'non-duality', 'advaita', 'dzogchen', 'vipassana', 'zazen', 'yoga',
      'mythology', 'symbolism', 'archetype', 'hero\'s journey', 'shadow work',
      // Figures (Historical)
      'Lao Tzu', 'Buddha', 'Rumi', 'Shankara', 'Meister Eckhart', 'Jesus',
      'Carl Jung', 'Joseph Campbell', 'Mircea Eliade', 'Huston Smith',
      // Figures (Modern)
      'Alan Watts', 'Ram Dass', 'Eckhart Tolle', 'Thich Nhat Hanh', 'Dalai Lama',
      'Jiddu Krishnamurti', 'Sadhguru', 'Rupert Spira', 'Adyashanti', 'Mooji',
      'Jordan Peterson', 'Jonathan Pageau', 'John Vervaeke', 'Sam Harris'
    ],
    junk: [
      'SHOCKING', 'SECRET REVEALED', 'clickbait', 'drama', 'exposed',
      'cult', 'brainwashing', 'manipulation', 'scam', 'guru', 'messiah',
      'law of attraction', 'manifestation', 'the secret', 'vibration', 'quantum jumping',
      'psychic', 'medium', 'tarot', 'astrology', 'horoscope', 'twin flame',
      'conspiracy', 'illuminati', 'new world order', 'end times', 'prophecy',
      'rapture', 'antichrist', 'demon', 'exorcism', 'possession',
      'mega church', 'prosperity gospel', 'faith healing', 'televangelist'
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

    // Priority 1: Check for Junk (Safety Filter)
    const hasJunk = this.rules.junk.some(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
    if (hasJunk) return 'junk';

    // Priority 2: Check for Educational (Target)
    const hasEducational = this.rules.educational.some(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
    if (hasEducational) return 'educational';

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

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContentClassifier, CLASSIFIER_RULES };
}
