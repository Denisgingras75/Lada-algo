const FOCUS_PRESETS = {
  polymath: {
    name: 'The Polymath',
    videos: [
      { title: 'How to Think Like a Renaissance Person', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'Big Think' },
      { title: 'Da Vinci\'s Principles of Innovation', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'TED-Ed' },
      { title: 'The Art of Learning - Josh Waitzkin', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'Tim Ferriss' },
      { title: 'How to Read 100 Books a Year', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'Matt D\'Avella' },
      { title: 'Richard Feynman on Curiosity', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'Feynman Lectures' },
      { title: 'Interdisciplinary Thinking in the 21st Century', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', channel: 'Stanford' }
    ],
    headlines: [
      { title: 'New study reveals cross-disciplinary teams innovate 40% faster', source: 'Nature', link: 'https://nature.com' },
      { title: 'MIT launches new interdisciplinary degree program', source: 'MIT News', link: 'https://news.mit.edu' },
      { title: 'How polymaths are shaping the future of work', source: 'Harvard Business Review', link: 'https://hbr.org' }
    ],
    facts: [
      'Leonardo da Vinci studied anatomy, engineering, painting, sculpture, and architecture simultaneously.',
      'Benjamin Franklin excelled in science, writing, diplomacy, and invention.',
      'Studies show learning multiple disciplines strengthens neural pathways and cognitive flexibility.'
    ],
    quotes: [
      '"The more you know, the more you realize you don\'t know." - Aristotle',
      '"An investment in knowledge pays the best interest." - Benjamin Franklin',
      '"Intelligence is the ability to adapt to change." - Stephen Hawking'
    ]
  },
  engineer: {
    name: 'The Engineer',
    videos: [
      { title: 'How Microprocessors Actually Work', thumbnail: 'https://i.ytimg.com/vi/IcrBqCFLHIY/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=IcrBqCFLHIY', channel: 'Veritasium' },
      { title: 'Building a Computer from NAND Gates', thumbnail: 'https://i.ytimg.com/vi/HyznrdDSSGM/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=HyznrdDSSGM', channel: 'Ben Eater' },
      { title: 'SpaceX Starship Engineering Deep Dive', thumbnail: 'https://i.ytimg.com/vi/cIQ36Kt7UVg/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=cIQ36Kt7UVg', channel: 'Real Engineering' },
      { title: 'MIT 6.006 Introduction to Algorithms', thumbnail: 'https://i.ytimg.com/vi/HtSuA80QTyo/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=HtSuA80QTyo', channel: 'MIT OpenCourseWare' },
      { title: 'The Beauty of Bezier Curves', thumbnail: 'https://i.ytimg.com/vi/aVwxzDHniEw/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=aVwxzDHniEw', channel: 'Freya Holmér' },
      { title: 'Quantum Computing Explained', thumbnail: 'https://i.ytimg.com/vi/g_IaVepNDT4/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=g_IaVepNDT4', channel: 'Veritasium' }
    ],
    headlines: [
      { title: 'Breakthrough in room-temperature superconductors', source: 'Science Daily', link: 'https://sciencedaily.com' },
      { title: 'New battery technology promises 10x energy density', source: 'IEEE Spectrum', link: 'https://spectrum.ieee.org' },
      { title: 'Open-source RISC-V chips challenge ARM dominance', source: 'ArsTechnica', link: 'https://arstechnica.com' }
    ],
    facts: [
      'The first computer bug was an actual moth found in a Harvard Mark II computer in 1947.',
      'A Boeing 747 contains 6 million parts, half of which are fasteners.',
      'The code that sent humans to the moon had less processing power than a modern calculator.'
    ],
    quotes: [
      '"First, solve the problem. Then, write the code." - John Johnson',
      '"Simplicity is the ultimate sophistication." - Leonardo da Vinci',
      '"The scientist discovers a new type of material or energy and the engineer discovers a new use for it." - Gordon Lindsay Glegg'
    ]
  },
  strategist: {
    name: 'The Strategist',
    videos: [
      { title: 'How to Start a Startup - Sam Altman', thumbnail: 'https://i.ytimg.com/vi/CBYhVcO4WgI/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=CBYhVcO4WgI', channel: 'Y Combinator' },
      { title: 'Valuation Masterclass - Aswath Damodaran', thumbnail: 'https://i.ytimg.com/vi/Z5chrxMuBoo/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=Z5chrxMuBoo', channel: 'Aswath Damodaran' },
      { title: 'Ray Dalio: Principles for Success', thumbnail: 'https://i.ytimg.com/vi/B9XGUpQZY38/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=B9XGUpQZY38', channel: 'Principles by Ray Dalio' },
      { title: 'Naval Ravikant on Wealth Creation', thumbnail: 'https://i.ytimg.com/vi/1-TZqOsVCNM/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=1-TZqOsVCNM', channel: 'Naval' },
      { title: 'Warren Buffett on Investment Strategy', thumbnail: 'https://i.ytimg.com/vi/2a9Lx9J8uSs/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=2a9Lx9J8uSs', channel: 'Bloomberg' },
      { title: 'The Art of War in Business', thumbnail: 'https://i.ytimg.com/vi/lDq9-QxvsNU/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=lDq9-QxvsNU', channel: 'HBR' }
    ],
    headlines: [
      { title: 'Y Combinator\'s latest batch raises $500M in total funding', source: 'TechCrunch', link: 'https://techcrunch.com' },
      { title: 'How compound annual growth deceives most investors', source: 'Wall Street Journal', link: 'https://wsj.com' },
      { title: 'AI startups shift from growth-at-all-costs to profitability', source: 'Bloomberg', link: 'https://bloomberg.com' }
    ],
    facts: [
      'Warren Buffett reads 500 pages every day to build knowledge that compounds over time.',
      'The Rule of 72: Divide 72 by your annual return rate to find how long it takes to double your money.',
      '90% of all startups fail, but those that succeed often validate uncommon hypotheses.'
    ],
    quotes: [
      '"Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat." - Sun Tzu',
      '"The best way to predict the future is to create it." - Peter Drucker',
      '"Risk comes from not knowing what you\'re doing." - Warren Buffett'
    ]
  },
  stoic: {
    name: 'The Stoic',
    videos: [
      { title: 'Marcus Aurelius: How to Think Clearly', thumbnail: 'https://i.ytimg.com/vi/Auuk1y4DRgk/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=Auuk1y4DRgk', channel: 'Einzelgänger' },
      { title: 'Andrew Huberman: Science of Focus', thumbnail: 'https://i.ytimg.com/vi/ze2nb6KfNyw/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=ze2nb6KfNyw', channel: 'Huberman Lab' },
      { title: 'Stoicism: Practical Philosophy', thumbnail: 'https://i.ytimg.com/vi/yu7n0XzqtfA/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=yu7n0XzqtfA', channel: 'The School of Life' },
      { title: 'The Science of Well-Being', thumbnail: 'https://i.ytimg.com/vi/ZizdB0TgAVM/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=ZizdB0TgAVM', channel: 'Yale University' },
      { title: 'How to Build Mental Resilience', thumbnail: 'https://i.ytimg.com/vi/gMKqNH9QLCA/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=gMKqNH9QLCA', channel: 'Andrew Huberman' },
      { title: 'Seneca on the Shortness of Life', thumbnail: 'https://i.ytimg.com/vi/8aF2GxWi7Ag/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=8aF2GxWi7Ag', channel: 'Philosophies for Life' }
    ],
    headlines: [
      { title: 'Neuroscience confirms ancient Stoic techniques reduce anxiety by 60%', source: 'Psychology Today', link: 'https://psychologytoday.com' },
      { title: 'Silicon Valley executives credit Stoicism for decision-making clarity', source: 'Fast Company', link: 'https://fastcompany.com' },
      { title: 'Marcus Aurelius\' Meditations becomes #1 bestseller 1,800 years later', source: 'The Guardian', link: 'https://theguardian.com' }
    ],
    facts: [
      'Stoicism teaches that we control our reactions, not external events.',
      'The dichotomy of control: Focus only on what you can influence.',
      'Negative visualization (premeditatio malorum) builds resilience by mentally rehearsing challenges.'
    ],
    quotes: [
      '"You have power over your mind—not outside events. Realize this, and you will find strength." - Marcus Aurelius',
      '"He who fears death will never do anything worth of a man who is alive." - Seneca',
      '"The obstacle is the way." - Marcus Aurelius'
    ]
  },
  scientist: {
    name: 'The Scientist',
    videos: [
      { title: 'The Map of Physics', thumbnail: 'https://i.ytimg.com/vi/ZihywtixUYo/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=ZihywtixUYo', channel: 'Domain of Science' },
      { title: 'Richard Feynman: The Character of Physical Law', thumbnail: 'https://i.ytimg.com/vi/j3mhkYbznBk/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=j3mhkYbznBk', channel: 'Feynman Lectures' },
      { title: 'How CRISPR Gene Editing Works', thumbnail: 'https://i.ytimg.com/vi/jAhjPd4uNFY/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=jAhjPd4uNFY', channel: 'Kurzgesagt' },
      { title: 'The Most Important Molecule for Health', thumbnail: 'https://i.ytimg.com/vi/gCzkaGXCMQY/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=gCzkaGXCMQY', channel: 'Veritasium' },
      { title: 'Entropy: The Arrow of Time', thumbnail: 'https://i.ytimg.com/vi/vSgPRj207uE/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=vSgPRj207uE', channel: '3Blue1Brown' },
      { title: 'Why the Universe is Finely Tuned for Life', thumbnail: 'https://i.ytimg.com/vi/EjaGktVQdNg/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=EjaGktVQdNg', channel: 'PBS Space Time' }
    ],
    headlines: [
      { title: 'James Webb Telescope discovers galaxy that challenges cosmology models', source: 'NASA', link: 'https://nasa.gov' },
      { title: 'mRNA technology wins Nobel Prize in Medicine', source: 'Nature', link: 'https://nature.com' },
      { title: 'Nuclear fusion breakthrough achieves net energy gain', source: 'Science', link: 'https://science.org' }
    ],
    facts: [
      'A teaspoon of a neutron star weighs about 6 billion tons.',
      'Your body completely replaces all its atoms every 7-10 years.',
      'The human genome contains about 3 billion base pairs, but only 2% codes for proteins.'
    ],
    quotes: [
      '"The good thing about science is that it\'s true whether or not you believe in it." - Neil deGrasse Tyson',
      '"Science is not only compatible with spirituality; it is a profound source of spirituality." - Carl Sagan',
      '"What I cannot create, I do not understand." - Richard Feynman'
    ]
  },
  artist: {
    name: 'The Artist',
    videos: [
      { title: 'The Philosophy of Color', thumbnail: 'https://i.ytimg.com/vi/evQsOFQju08/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=evQsOFQju08', channel: 'Nerdwriter1' },
      { title: 'How Pixar Creates Emotion Through Animation', thumbnail: 'https://i.ytimg.com/vi/SWxcJq8PKa8/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=SWxcJq8PKa8', channel: 'Pixar' },
      { title: 'The Beauty of Mathematics in Art', thumbnail: 'https://i.ytimg.com/vi/kkGeOWYOFoA/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=kkGeOWYOFoA', channel: 'Numberphile' },
      { title: 'How Film Composers Work', thumbnail: 'https://i.ytimg.com/vi/UcXsH88XlKM/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=UcXsH88XlKM', channel: 'Hans Zimmer' },
      { title: 'The Art of Visual Storytelling', thumbnail: 'https://i.ytimg.com/vi/5V-k-p4wzxg/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=5V-k-p4wzxg', channel: 'Every Frame a Painting' },
      { title: 'How Typography Shapes Perception', thumbnail: 'https://i.ytimg.com/vi/wOgIkxAfJsk/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=wOgIkxAfJsk', channel: 'Vox' }
    ],
    headlines: [
      { title: 'AI-generated art wins state fair competition, sparks debate', source: 'The Verge', link: 'https://theverge.com' },
      { title: 'Renaissance masters used optical tools, new study reveals', source: 'Smithsonian', link: 'https://smithsonianmag.com' },
      { title: 'Digital art NFTs reshape how artists monetize creativity', source: 'Wired', link: 'https://wired.com' }
    ],
    facts: [
      'The golden ratio (1.618) appears in art, architecture, and nature.',
      'Picasso could draw before he could walk; his first word was "pencil" (lápiz in Spanish).',
      'The Mona Lisa has no eyebrows—it was fashionable for Renaissance women to shave them.'
    ],
    quotes: [
      '"Art is not what you see, but what you make others see." - Edgar Degas',
      '"Every artist was first an amateur." - Ralph Waldo Emerson',
      '"Creativity is intelligence having fun." - Albert Einstein'
    ]
  },
  warrior: {
    name: 'The Warrior',
    videos: [
      { title: 'David Goggins: How to Build Mental Toughness', thumbnail: 'https://i.ytimg.com/vi/5tSTk1083VY/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=5tSTk1083VY', channel: 'David Goggins' },
      { title: 'Jocko Willink: Discipline Equals Freedom', thumbnail: 'https://i.ytimg.com/vi/S6vo2j4sFt8/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=S6vo2j4sFt8', channel: 'Jocko Podcast' },
      { title: 'The Science of Peak Performance', thumbnail: 'https://i.ytimg.com/vi/hBSVZdTQmDs/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=hBSVZdTQmDs', channel: 'Andrew Huberman' },
      { title: 'How Navy SEALs Build Unbreakable Teams', thumbnail: 'https://i.ytimg.com/vi/ljqra3BcqWM/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=ljqra3BcqWM', channel: 'TEDx' },
      { title: 'Ancient Spartan Training Methods', thumbnail: 'https://i.ytimg.com/vi/0A_YTTH8ESI/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=0A_YTTH8ESI', channel: 'History Channel' },
      { title: 'The Psychology of Winning', thumbnail: 'https://i.ytimg.com/vi/ueqCkeFAI58/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=ueqCkeFAI58', channel: 'Tony Robbins' }
    ],
    headlines: [
      { title: 'Elite military training reveals secrets to mental resilience', source: 'Military Times', link: 'https://militarytimes.com' },
      { title: 'Sports science shows adversity training improves performance 35%', source: 'Journal of Sports Medicine', link: 'https://jsm.org' },
      { title: 'Former Navy SEAL launches leadership consulting empire', source: 'Forbes', link: 'https://forbes.com' }
    ],
    facts: [
      'The human body can endure 40% more than the mind thinks it can.',
      'Elite athletes visualize success with the same brain regions used during actual performance.',
      'Cold exposure training increases dopamine by 250% and norepinephrine by 530%.'
    ],
    quotes: [
      '"The only easy day was yesterday." - Navy SEAL motto',
      '"Discipline is doing what you hate to do, but doing it like you love it." - Mike Tyson',
      '"In the midst of chaos, there is also opportunity." - Sun Tzu'
    ]
  },
  healer: {
    name: 'The Healer',
    videos: [
      { title: 'How Meditation Changes the Brain', thumbnail: 'https://i.ytimg.com/vi/m8rRzTtP7Tc/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=m8rRzTtP7Tc', channel: 'Sam Harris' },
      { title: 'The Science of Sleep and Recovery', thumbnail: 'https://i.ytimg.com/vi/pwaWilO_Pig/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=pwaWilO_Pig', channel: 'Andrew Huberman' },
      { title: 'Nutrition: The Ultimate Biohack', thumbnail: 'https://i.ytimg.com/vi/TXlVfwlaMYU/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=TXlVfwlaMYU', channel: 'Peter Attia MD' },
      { title: 'The Gut-Brain Connection', thumbnail: 'https://i.ytimg.com/vi/awtmTJW9ic8/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=awtmTJW9ic8', channel: 'Dr. Rhonda Patrick' },
      { title: 'How Exercise Rewires the Brain', thumbnail: 'https://i.ytimg.com/vi/BHY0FxzoKZE/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=BHY0FxzoKZE', channel: 'Wendy Suzuki' },
      { title: 'Longevity: Living to 100+', thumbnail: 'https://i.ytimg.com/vi/sD7bLuwqKDI/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=sD7bLuwqKDI', channel: 'David Sinclair' }
    ],
    headlines: [
      { title: 'New longevity drug extends lifespan by 25% in trials', source: 'Nature Medicine', link: 'https://nature.com' },
      { title: 'Meditation shown to reduce inflammation markers by 30%', source: 'Harvard Medical School', link: 'https://hms.harvard.edu' },
      { title: 'Fasting triggers cellular regeneration pathways', source: 'Cell', link: 'https://cell.com' }
    ],
    facts: [
      'The human body has 37.2 trillion cells, each performing complex functions.',
      'Walking 30 minutes daily reduces all-cause mortality by 20%.',
      'Deep sleep is when the brain clears metabolic waste, including Alzheimer\'s-related proteins.'
    ],
    quotes: [
      '"Let food be thy medicine and medicine be thy food." - Hippocrates',
      '"The greatest wealth is health." - Virgil',
      '"He who has health has hope, and he who has hope has everything." - Arabian Proverb'
    ]
  },
  explorer: {
    name: 'The Explorer',
    videos: [
      { title: 'What\'s at the Bottom of the Mariana Trench?', thumbnail: 'https://i.ytimg.com/vi/UwVNkfCov1k/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=UwVNkfCov1k', channel: 'Real Science' },
      { title: 'First Photos from Mars Perseverance Rover', thumbnail: 'https://i.ytimg.com/vi/gYQwuYZbA6o/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=gYQwuYZbA6o', channel: 'NASA' },
      { title: 'Exploring Antarctica\'s Hidden World', thumbnail: 'https://i.ytimg.com/vi/snAvAqXHAVQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=snAvAqXHAVQ', channel: 'BBC Earth' },
      { title: 'The Mystery of Dark Matter', thumbnail: 'https://i.ytimg.com/vi/QAa2O_8wBUQ/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=QAa2O_8wBUQ', channel: 'PBS Space Time' },
      { title: 'Lost Cities Discovered by Satellite', thumbnail: 'https://i.ytimg.com/vi/3WRa6VLKR8Y/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=3WRa6VLKR8Y', channel: 'National Geographic' },
      { title: 'Journey to the Center of the Earth', thumbnail: 'https://i.ytimg.com/vi/tB51uHNVDso/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=tB51uHNVDso', channel: 'Kurzgesagt' }
    ],
    headlines: [
      { title: 'Scientists discover massive underground ocean beneath Earth\'s surface', source: 'Science Daily', link: 'https://sciencedaily.com' },
      { title: 'SpaceX announces plans for Mars colony by 2030', source: 'Space.com', link: 'https://space.com' },
      { title: 'New species discovered in unexplored Amazon region', source: 'National Geographic', link: 'https://nationalgeographic.com' }
    ],
    facts: [
      'We\'ve explored less than 5% of Earth\'s oceans.',
      'There are more stars in the universe than grains of sand on all Earth\'s beaches.',
      'The deepest hole ever dug (Kola Superdeep Borehole) reached only 0.2% through the Earth\'s crust.'
    ],
    quotes: [
      '"The universe is not only stranger than we imagine, it is stranger than we can imagine." - J.B.S. Haldane',
      '"Adventure is worthwhile in itself." - Amelia Earhart',
      '"Not all those who wander are lost." - J.R.R. Tolkien'
    ]
  },
  sage: {
    name: 'The Sage',
    videos: [
      { title: 'The Wisdom of Confucius', thumbnail: 'https://i.ytimg.com/vi/W3FhT6pjrPA/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=W3FhT6pjrPA', channel: 'The School of Life' },
      { title: 'Alan Watts: The Nature of Consciousness', thumbnail: 'https://i.ytimg.com/vi/mMRrCYPxD0I/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=mMRrCYPxD0I', channel: 'After Skool' },
      { title: 'Jordan Peterson: Meaning and Purpose', thumbnail: 'https://i.ytimg.com/vi/NX2ep5fCJZ8/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=NX2ep5fCJZ8', channel: 'Jordan B Peterson' },
      { title: 'The Tao of Pooh: Eastern Philosophy', thumbnail: 'https://i.ytimg.com/vi/JoIwnFQB_4Y/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=JoIwnFQB_4Y', channel: 'Philosophize This' },
      { title: 'Socrates and the Examined Life', thumbnail: 'https://i.ytimg.com/vi/5K_lJXQuqWg/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=5K_lJXQuqWg', channel: 'Academy of Ideas' },
      { title: 'Viktor Frankl: Man\'s Search for Meaning', thumbnail: 'https://i.ytimg.com/vi/fD1512_XJEw/mqdefault.jpg', link: 'https://www.youtube.com/watch?v=fD1512_XJEw', channel: 'Pursuit of Wonder' }
    ],
    headlines: [
      { title: 'Ancient philosophy courses become most popular at top universities', source: 'Chronicle of Higher Education', link: 'https://chronicle.com' },
      { title: 'CEOs turn to philosophers for ethical guidance in AI era', source: 'MIT Technology Review', link: 'https://technologyreview.com' },
      { title: 'Study shows reading philosophy improves critical thinking by 40%', source: 'Journal of Education', link: 'https://jed.org' }
    ],
    facts: [
      'Socrates never wrote anything down—all we know comes from his students\' writings.',
      'The word "philosophy" literally means "love of wisdom" in Greek.',
      'Stoic philosophy influenced Cognitive Behavioral Therapy (CBT), a leading modern psychotherapy.'
    ],
    quotes: [
      '"The unexamined life is not worth living." - Socrates',
      '"We are what we repeatedly do. Excellence, then, is not an act, but a habit." - Aristotle',
      '"He who knows others is wise; he who knows himself is enlightened." - Lao Tzu'
    ]
  }
};
