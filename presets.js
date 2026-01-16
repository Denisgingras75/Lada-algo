const FOCUS_PRESETS = {
  polymath: {
    facts: [
      "Leonardo da Vinci's to-do list included 'Describe the tongue of the woodpecker'.",
      "Benjamin Franklin was a writer, printer, politician, scientist, inventor, statesman, and diplomat.",
      "Learning a new skill physically changes the structure of your brain (neuroplasticity).",
      "The 'Memory Palace' technique uses spatial memory to store infinite information."
    ],
    quotes: [
      "Study the science of art. Study the art of science. Develop your senses. — Da Vinci",
      "An investment in knowledge pays the best interest. — Benjamin Franklin",
      "I have no special talent. I am only passionately curious. — Albert Einstein"
    ],
    headlines: [
      { title: "How to Think Like Leonardo da Vinci", source: "Big Think", link: "https://bigthink.com" },
      { title: "The Feynman Technique: Learn Anything Faster", source: "Farnam Street", link: "https://fs.blog" },
      { title: "MIT OpenCourseWare: Introduction to Psychology", source: "MIT", link: "https://ocw.mit.edu" }
    ]
  },
  engineer: {
    facts: [
      "The Apollo 11 guidance computer had less processing power than a modern toaster.",
      "The first computer bug was an actual moth trapped in a relay.",
      "TCP/IP is the fundamental protocol suite that makes the internet possible.",
      "Moore's Law states that the number of transistors on a chip doubles every two years."
    ],
    quotes: [
      "Scientists investigate that which already is; Engineers create that which has never been. — Einstein",
      "The best way to predict the future is to invent it. — Alan Kay",
      "Talk is cheap. Show me the code. — Linus Torvalds"
    ],
    headlines: [
      { title: "System Design Primer: Scalability", source: "GitHub", link: "https://github.com" },
      { title: "How Transistors Work - The Learning Circuit", source: "YouTube", link: "https://youtube.com" },
      { title: "Rust vs C++: Memory Safety Explained", source: "Ars Technica", link: "https://arstechnica.com" }
    ]
  },
  strategist: {
    facts: [
      "Compound interest is the eighth wonder of the world.",
      "The Pareto Principle states that 80% of effects come from 20% of causes.",
      "Game Theory mathematically models conflict and cooperation.",
      "A 'Moat' in business is a competitive advantage that protects market share."
    ],
    quotes: [
      "Price is what you pay. Value is what you get. — Warren Buffett",
      "Strategy is not the consequence of planning, but the opposite: its starting point. — Henry Mintzberg",
      "In the short run, the market is a voting machine but in the long run, it is a weighing machine. — Benjamin Graham"
    ],
    headlines: [
      { title: "Porter's Five Forces Analysis", source: "HBR", link: "https://hbr.org" },
      { title: "Understanding the Cash Flow Statement", source: "Investopedia", link: "https://investopedia.com" },
      { title: "Ray Dalio: How the Economic Machine Works", source: "Bridgewater", link: "https://bridgewater.com" }
    ]
  },
  stoic: {
    facts: [
      "Marcus Aurelius wrote 'Meditations' as a private journal while commanding an army.",
      "Stoicism teaches that we cannot control external events, only our reactions to them.",
      "Amor Fati means 'Love of Fate'—embracing everything that happens.",
      "Seneca was one of the wealthiest men in Rome but practiced poverty to build resilience."
    ],
    quotes: [
      "You have power over your mind - not outside events. Realize this, and you will find strength. — Marcus Aurelius",
      "We suffer more often in imagination than in reality. — Seneca",
      "The obstacle is the way. — Ryan Holiday"
    ],
    headlines: [
      { title: "The Daily Stoic: Ancient Wisdom for Modern Life", source: "Daily Stoic", link: "https://dailystoic.com" },
      { title: "Stanford Encyclopedia of Philosophy: Stoicism", source: "Stanford", link: "https://plato.stanford.edu" },
      { title: "How to Practice Negative Visualization", source: "Psychology Today", link: "https://psychologytoday.com" }
    ]
  },
  scientist: {
    facts: [
      "A teaspoon of a neutron star weighs about 6 billion tons.",
      "Your body replaces 98% of its atoms every year.",
      "Quantum entanglement allows particles to affect each other instantly across any distance.",
      "The mitochondria is the powerhouse of the cell (and has its own DNA)."
    ],
    quotes: [
      "Somewhere, something incredible is waiting to be known. — Carl Sagan",
      "The good thing about science is that it's true whether or not you believe in it. — Neil deGrasse Tyson",
      "If I have seen further it is by standing on the shoulders of Giants. — Isaac Newton"
    ],
    headlines: [
      { title: "Latest Discoveries from the James Webb Telescope", source: "NASA", link: "https://nasa.gov" },
      { title: "The Standard Model of Particle Physics Explained", source: "CERN", link: "https://home.cern" },
      { title: "Nature Journal: Weekly Science Highlights", source: "Nature", link: "https://nature.com" }
    ]
  },
  artist: {
    facts: [
      "Complementary colors sit opposite each other on the color wheel and create high contrast.",
      "The Golden Ratio (1.618) is found in nature, architecture, and classical art.",
      "Van Gogh only sold one painting during his lifetime.",
      "Negative space is just as important as the subject in composition."
    ],
    quotes: [
      "Creativity takes courage. — Henri Matisse",
      "Art is not what you see, but what you make others see. — Edgar Degas",
      "Design is intelligence made visible. — Alina Wheeler"
    ],
    headlines: [
      { title: "Color Theory for Designers", source: "Smashing Mag", link: "https://smashingmagazine.com" },
      { title: "Proko: Figure Drawing Fundamentals", source: "Proko", link: "https://proko.com" },
      { title: "The History of Typography", source: "Flux", link: "https://youtube.com" }
    ]
  },
  warrior: {
    facts: [
      "Progressive overload is the key principle for building muscle strength.",
      "Zone 2 cardio improves mitochondrial efficiency and metabolic health.",
      "Jiu-Jitsu allows a smaller opponent to defeat a larger one using leverage.",
      "Grip strength is one of the strongest predictors of longevity."
    ],
    quotes: [
      "Discipline equals freedom. — Jocko Willink",
      "The only easy day was yesterday. — Navy SEALs",
      "Civilize the mind, but make savage the body. — Mao"
    ],
    headlines: [
      { title: "Huberman Lab: Protocol for Strength & Hypertrophy", source: "Huberman Lab", link: "https://hubermanlab.com" },
      { title: "Starting Strength: Basic Barbell Training", source: "Mark Rippetoe", link: "https://startingstrength.com" },
      { title: "John Danaher: The Art of Jiu Jitsu", source: "BJJ Fanatics", link: "https://bjjfanatics.com" }
    ]
  },
  healer: {
    facts: [
      "Intermittent fasting can trigger autophagy, the body's cellular cleanup process.",
      "Sleep is when the brain clears out beta-amyloid toxins via the glymphatic system.",
      "Chronic inflammation is the root cause of most modern diseases.",
      "Your gut microbiome affects your mood via the vagus nerve."
    ],
    quotes: [
      "Let food be thy medicine. — Hippocrates",
      "The doctor of the future will give no medicine. — Thomas Edison",
      "Sleep is the best meditation. — Dalai Lama"
    ],
    headlines: [
      { title: "The Science of Longevity: Peter Attia", source: "The Drive", link: "https://peterattiamd.com" },
      { title: "Circadian Rhythms and Health", source: "NIH", link: "https://nih.gov" },
      { title: "FoundMyFitness: Sulforaphane Benefits", source: "Rhonda Patrick", link: "https://foundmyfitness.com" }
    ]
  },
  explorer: {
    facts: [
      "We have explored less than 5% of Earth's oceans.",
      "Antarctica is technically the world's largest desert.",
      "Göbekli Tepe is a temple complex 6,000 years older than Stonehenge.",
      "Voyager 1 is the most distant human-made object in space."
    ],
    quotes: [
      "Not all those who wander are lost. — Tolkien",
      "Adventure is worthwhile in itself. — Amelia Earhart",
      "The world is a book and those who do not travel read only one page. — St. Augustine"
    ],
    headlines: [
      { title: "National Geographic: Explorer Magazine", source: "NatGeo", link: "https://nationalgeographic.com" },
      { title: "Hardcore History: Wrath of the Khans", source: "Dan Carlin", link: "https://dancarlin.com" },
      { title: "NASA's Mars Exploration Program", source: "NASA", link: "https://mars.nasa.gov" }
    ]
  },
  sage: {
    facts: [
      "Mindfulness meditation increases the density of gray matter in the brain.",
      "The Tao that can be told is not the eternal Tao.",
      "Jung's 'Shadow' refers to the unconscious parts of our personality we deny.",
      "Neurotheology studies the relationship between the brain and spiritual experiences."
    ],
    quotes: [
      "The unexamined life is not worth living. — Socrates",
      "You are the universe experiencing itself. — Alan Watts",
      "He who knows others is wise; he who knows himself is enlightened. — Lao Tzu"
    ],
    headlines: [
      { title: "Waking Up: A Guide to Spirituality Without Religion", source: "Sam Harris", link: "https://wakingup.com" },
      { title: "The Meaning of Life (Stanford Encyclopedia)", source: "Stanford", link: "https://plato.stanford.edu" },
      { title: "Alan Watts: The Nature of Consciousness", source: "AlanWatts.org", link: "https://alanwatts.org" }
    ]
  }
};
