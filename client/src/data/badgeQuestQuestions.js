/**
 * Resilience Atlas — Badge Quest Questions
 * Multiple-choice question bank organized by age group.
 * Each question has one correct option and two or three incorrect options.
 */

export const BADGE_QUEST_QUESTIONS = {
  /* ── Ages 5–8 ── */
  ages_5_7: [
    {
      id: 'bq-y1',
      question: 'When you feel sad, what helps?',
      options: [
        { text: 'Cry more and stay upset', correct: false },
        { text: 'Take deep breaths', correct: true },
        { text: 'Hide away by yourself', correct: false },
        { text: 'Ignore the feeling', correct: false },
      ],
      explanation: 'Deep breathing helps calm your body when you feel sad! 🌬️',
      badge: { id: 'bq-calm', name: 'Calm Champion', emoji: '🧘' },
    },
    {
      id: 'bq-y2',
      question: 'Trying something new is…',
      options: [
        { text: 'Only scary', correct: false },
        { text: 'Fun and helps you learn', correct: true },
        { text: 'Something you should avoid', correct: false },
        { text: 'Only for grown-ups', correct: false },
      ],
      explanation: 'Trying new things helps your brain grow and learn! 🌱',
      badge: { id: 'bq-brave', name: 'Brave Learner', emoji: '🌱' },
    },
    {
      id: 'bq-y3',
      question: 'When you make a mistake, you should…',
      options: [
        { text: 'Give up straight away', correct: false },
        { text: 'Keep trying and learn from it', correct: true },
        { text: 'Feel bad about yourself', correct: false },
        { text: 'Pretend it did not happen', correct: false },
      ],
      explanation: 'Mistakes are how we learn! Keep trying — that is resilience! 💪',
      badge: { id: 'bq-growth', name: 'Growth Hero', emoji: '🔨' },
    },
    {
      id: 'bq-y4',
      question: 'A friend is sad. You should…',
      options: [
        { text: 'Ignore them', correct: false },
        { text: 'Ask if they are okay', correct: true },
        { text: 'Laugh at them', correct: false },
        { text: 'Walk away', correct: false },
      ],
      explanation: 'Asking "are you okay?" shows you care and helps your friend feel less alone! 🤝',
      badge: { id: 'bq-helper', name: 'Kind Helper', emoji: '🤝' },
    },
    {
      id: 'bq-y5',
      question: 'Being brave means…',
      options: [
        { text: 'Never ever feeling scared', correct: false },
        { text: 'Feeling scared but trying anyway', correct: true },
        { text: 'Not trying hard things', correct: false },
        { text: 'Showing off to everyone', correct: false },
      ],
      explanation: 'Real bravery is doing something even when you feel scared! 🦁',
      badge: { id: 'bq-courage', name: 'Courage Star', emoji: '🦁' },
    },
  ],

  /* ── Ages 8–12 ── */
  ages_8_12: [
    {
      id: 'bq-m1',
      question: 'Growth mindset means…',
      options: [
        { text: 'You are born with fixed abilities', correct: false },
        { text: 'You can develop skills with effort', correct: true },
        { text: 'Your IQ never changes', correct: false },
        { text: 'Some people just cannot improve', correct: false },
      ],
      explanation: 'Growth mindset means believing you can improve through practice and effort! 🧠',
      badge: { id: 'bq-mindset', name: 'Mindset Master', emoji: '🧠' },
    },
    {
      id: 'bq-m2',
      question: 'Resilience is about…',
      options: [
        { text: 'Never failing at anything', correct: false },
        { text: 'Bouncing back from challenges', correct: true },
        { text: 'Being perfect all the time', correct: false },
        { text: 'Avoiding hard situations', correct: false },
      ],
      explanation: 'Resilience means getting back up after challenges — not avoiding them! 🏀',
      badge: { id: 'bq-bounce', name: 'Bounce Back', emoji: '🏀' },
    },
    {
      id: 'bq-m3',
      question: 'When stressed, a good coping skill is…',
      options: [
        { text: 'Skip school or responsibilities', correct: false },
        { text: 'Exercise or deep breathing', correct: true },
        { text: 'Avoid the problem forever', correct: false },
        { text: 'Distract yourself with screens all day', correct: false },
      ],
      explanation: 'Exercise and deep breathing help your nervous system calm down! 🌬️',
      badge: { id: 'bq-cope', name: 'Coping Pro', emoji: '🌬️' },
    },
    {
      id: 'bq-m4',
      question: 'Emotional intelligence includes…',
      options: [
        { text: 'Never showing any feelings', correct: false },
        { text: 'Understanding and managing your emotions', correct: true },
        { text: 'Hiding sadness always', correct: false },
        { text: 'Ignoring how others feel', correct: false },
      ],
      explanation: 'Emotional intelligence means knowing, understanding, and managing emotions — yours and others\'! 💜',
      badge: { id: 'bq-eq', name: 'Emotion Expert', emoji: '💜' },
    },
    {
      id: 'bq-m5',
      question: 'Working as a team helps because…',
      options: [
        { text: 'You never have to work alone', correct: false },
        { text: 'Different skills and ideas combine', correct: true },
        { text: 'Everyone does exactly the same', correct: false },
        { text: 'It is always easier than working alone', correct: false },
      ],
      explanation: 'Teams bring different strengths together to solve problems better! 🤝',
      badge: { id: 'bq-team', name: 'Team Player', emoji: '🤝' },
    },
  ],

  /* ── Ages 13–18 ── */
  ages_13_18: [
    {
      id: 'bq-o1',
      question: 'Neuroplasticity means…',
      options: [
        { text: 'The brain cannot change after childhood', correct: false },
        { text: 'The brain can form new connections throughout life', correct: true },
        { text: 'Only children are capable of learning', correct: false },
        { text: 'Intelligence is entirely fixed at birth', correct: false },
      ],
      explanation: 'Neuroplasticity shows the brain keeps rewiring itself through learning and experience! 🔬',
      badge: { id: 'bq-neuro', name: 'Neuro Thinker', emoji: '🔬' },
    },
    {
      id: 'bq-o2',
      question: 'Psychological resilience involves…',
      options: [
        { text: 'Avoiding all difficult problems', correct: false },
        { text: 'Coping with and recovering from adversity', correct: true },
        { text: 'Never struggling or feeling pain', correct: false },
        { text: 'Always staying emotionally neutral', correct: false },
      ],
      explanation: 'Resilience is not about avoiding hardship — it is about navigating it and bouncing back! 💪',
      badge: { id: 'bq-psych', name: 'Resilience Ace', emoji: '💪' },
    },
    {
      id: 'bq-o3',
      question: 'Self-compassion differs from self-esteem because…',
      options: [
        { text: 'Self-esteem is based only on success', correct: false },
        { text: 'Compassion supports you during struggle, not just success', correct: true },
        { text: 'They mean exactly the same thing', correct: false },
        { text: 'Self-compassion means always feeling good', correct: false },
      ],
      explanation: 'Self-compassion means treating yourself kindly even when you struggle — not just when you succeed! 🌸',
      badge: { id: 'bq-compassion', name: 'Self-Compassion', emoji: '🌸' },
    },
    {
      id: 'bq-o4',
      question: 'Interpersonal resilience includes…',
      options: [
        { text: 'Complete independence from everyone', correct: false },
        { text: 'Social support and meaningful relationships', correct: true },
        { text: 'Isolation to protect yourself', correct: false },
        { text: 'Avoiding conflict at all costs', correct: false },
      ],
      explanation: 'Strong relationships and social support are key pillars of resilience! 🤝',
      badge: { id: 'bq-social', name: 'Social Strength', emoji: '🫂' },
    },
    {
      id: 'bq-o5',
      question: 'Post-traumatic growth refers to…',
      options: [
        { text: 'Trauma always being a positive experience', correct: false },
        { text: 'Positive personal change that can follow difficult experiences', correct: true },
        { text: 'The idea that suffering has no meaning', correct: false },
        { text: 'Returning to exactly who you were before trauma', correct: false },
      ],
      explanation: 'Post-traumatic growth is when people discover new strengths or meaning after facing serious adversity! 🌟',
      badge: { id: 'bq-growth-adv', name: 'Growth Pioneer', emoji: '🌟' },
    },
  ],
};

/** Map hub age group keys to question bank keys */
export const AGE_GROUP_MAP = {
  young:  'ages_5_7',
  middle: 'ages_8_12',
  older:  'ages_13_18',
};

/** How many questions to show per session */
export const QUESTIONS_PER_SESSION = 3;

/**
 * Return a shuffled copy of an array (Fisher-Yates).
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pick `count` random questions from the correct age-group pool,
 * with each question's options shuffled.
 */
export function pickQuestions(ageGroupKey, count = QUESTIONS_PER_SESSION) {
  const pool = BADGE_QUEST_QUESTIONS[ageGroupKey] ?? BADGE_QUEST_QUESTIONS.ages_5_7;
  const selected = shuffle(pool).slice(0, count);
  return selected.map(q => ({ ...q, options: shuffle(q.options) }));
}
