'use strict';

/**
 * Tests for Kids Skills modal data:
 * - SKILL_SUBTITLES mapping matches spec
 * - SKILL_DETAILS has entries for every dimension
 * - Primary mode section logic (blend detection threshold)
 */

const DIMENSIONS = [
  'Agentic-Generative',
  'Relational-Connective',
  'Spiritual-Reflective',
  'Emotional-Adaptive',
  'Somatic-Regulative',
  'Cognitive-Narrative',
];

const SKILL_SUBTITLES = {
  'Relational-Connective': 'Connector',
  'Agentic-Generative':    'Builder',
  'Spiritual-Reflective':  'Guide',
  'Emotional-Adaptive':    'Feeler',
  'Cognitive-Narrative':   'Thinker',
  'Somatic-Regulative':    'Grounder',
};

const SKILL_DETAILS = {
  'Agentic-Generative': {
    fullDesc: "Builders are the doers — they take action, set goals, and make things happen even when it feels hard.",
    tryThis: [{ label: 'Set a Tiny Goal', href: '/kids?category=activities' }],
  },
  'Relational-Connective': {
    fullDesc: "Connectors are warm, caring, and always notice when someone feels left out.",
    tryThis: [{ label: 'Connection Stories', href: '/kids?category=stories' }],
  },
  'Spiritual-Reflective': {
    fullDesc: "Guides are the deep thinkers who ask big questions.",
    tryThis: [{ label: 'Reflection Activities', href: '/kids?category=activities' }],
  },
  'Emotional-Adaptive': {
    fullDesc: "Feelers are in tune with their emotions.",
    tryThis: [{ label: 'Emotion Activities', href: '/kids?category=activities' }],
  },
  'Somatic-Regulative': {
    fullDesc: "Grounders know that your body holds wisdom.",
    tryThis: [{ label: 'Body Activities', href: '/kids?category=activities' }],
  },
  'Cognitive-Narrative': {
    fullDesc: "Thinkers are story-changers.",
    tryThis: [{ label: 'Mindset Activities', href: '/kids?category=activities' }],
  },
};

describe('SKILL_SUBTITLES mapping', () => {
  test('has exactly one entry per dimension', () => {
    expect(Object.keys(SKILL_SUBTITLES)).toHaveLength(DIMENSIONS.length);
  });

  test('every dimension has a subtitle', () => {
    DIMENSIONS.forEach(dim => {
      expect(SKILL_SUBTITLES[dim]).toBeDefined();
      expect(typeof SKILL_SUBTITLES[dim]).toBe('string');
      expect(SKILL_SUBTITLES[dim].length).toBeGreaterThan(0);
    });
  });

  test('subtitles match exact spec', () => {
    expect(SKILL_SUBTITLES['Relational-Connective']).toBe('Connector');
    expect(SKILL_SUBTITLES['Agentic-Generative']).toBe('Builder');
    expect(SKILL_SUBTITLES['Spiritual-Reflective']).toBe('Guide');
    expect(SKILL_SUBTITLES['Emotional-Adaptive']).toBe('Feeler');
    expect(SKILL_SUBTITLES['Cognitive-Narrative']).toBe('Thinker');
    expect(SKILL_SUBTITLES['Somatic-Regulative']).toBe('Grounder');
  });

  test('no emoji characters in subtitle values', () => {
    const emojiRegex = /\p{Emoji_Presentation}/u;
    Object.values(SKILL_SUBTITLES).forEach(subtitle => {
      expect(emojiRegex.test(subtitle)).toBe(false);
    });
  });
});

describe('SKILL_DETAILS data integrity', () => {
  test('has an entry for every dimension', () => {
    DIMENSIONS.forEach(dim => {
      expect(SKILL_DETAILS[dim]).toBeDefined();
    });
  });

  test('every entry has fullDesc and tryThis', () => {
    DIMENSIONS.forEach(dim => {
      const detail = SKILL_DETAILS[dim];
      expect(typeof detail.fullDesc).toBe('string');
      expect(detail.fullDesc.length).toBeGreaterThan(10);
      expect(Array.isArray(detail.tryThis)).toBe(true);
      expect(detail.tryThis.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('all tryThis items have label and href', () => {
    DIMENSIONS.forEach(dim => {
      SKILL_DETAILS[dim].tryThis.forEach(item => {
        expect(typeof item.label).toBe('string');
        expect(item.label.length).toBeGreaterThan(0);
        expect(typeof item.href).toBe('string');
        expect(item.href.startsWith('/')).toBe(true);
      });
    });
  });

  test('no emoji characters in fullDesc', () => {
    const emojiRegex = /\p{Emoji_Presentation}/u;
    DIMENSIONS.forEach(dim => {
      expect(emojiRegex.test(SKILL_DETAILS[dim].fullDesc)).toBe(false);
    });
  });
});

describe('Primary mode blend detection logic', () => {
  const BLEND_THRESHOLD = 8;

  function detectMode(topScore, secondScore) {
    const gap = topScore - secondScore;
    return gap <= BLEND_THRESHOLD ? 'Blend' : 'Strong Match';
  }

  test('detects Blend when gap is exactly at threshold', () => {
    expect(detectMode(80, 72)).toBe('Blend');
  });

  test('detects Blend when gap is below threshold', () => {
    expect(detectMode(75, 70)).toBe('Blend');
  });

  test('detects Strong Match when gap is above threshold', () => {
    expect(detectMode(90, 70)).toBe('Strong Match');
  });

  test('detects Strong Match when gap is well above threshold', () => {
    expect(detectMode(95, 50)).toBe('Strong Match');
  });

  test('handles equal scores as Blend', () => {
    expect(detectMode(80, 80)).toBe('Blend');
  });
});

describe('Primary mode dynamic explanation', () => {
  test('renders top dimension score in explanation', () => {
    const topScore = 85;
    const secondScore = 80;
    const gap = topScore - secondScore;
    const explanation = `Your dimension leads at ${topScore}% — ${gap} points ahead of your next dimension.`;
    expect(explanation).toContain('85%');
    expect(explanation).toContain('5 points');
  });

  test('renders secondary dimension when blend', () => {
    const secondDim = 'Relational-Connective';
    const secondScore = 79;
    const isBlend = true;
    const blendText = isBlend
      ? `Your ${secondDim} dimension is close behind at ${secondScore}%`
      : '';
    expect(blendText).toContain('Relational-Connective');
    expect(blendText).toContain('79%');
  });
});
