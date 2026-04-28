/**
 * parentOutcomeForms.js
 * IATLAS Parent-Reported Outcome (PRO) forms for tracking child progress at home.
 */

export const WEEKLY_PARENT_CHECKIN = {
  id: 'weekly-checkin',
  title: "Weekly Parent Check-In",
  frequency: 'weekly',
  estimatedMinutes: 5,
  description: 'A quick 5-minute check-in to share how your child is doing at home this week.',
  sections: [
    {
      id: 'wins',
      title: "This Week's Wins",
      type: 'multiselect',
      description: 'Select all that apply:',
      options: [
        { id: 'tried-new', label: 'Tried a new activity' },
        { id: 'asked-help', label: 'Asked for help when needed' },
        { id: 'named-feelings', label: 'Named their feelings' },
        { id: 'managed-frustration', label: 'Managed frustration well' },
        { id: 'connected-friend', label: 'Connected with a friend' },
        { id: 'completed-challenge', label: 'Completed a challenge' },
        { id: 'showed-kindness', label: 'Showed kindness to someone' },
        { id: 'tried-again', label: 'Tried again after a setback' },
      ],
    },
    {
      id: 'challenges',
      title: "This Week's Challenges",
      type: 'checklist',
      description: 'Select any challenges you noticed:',
      options: [
        { id: 'big-emotions', label: 'Big emotions or meltdowns' },
        { id: 'avoiding', label: 'Avoiding activities or tasks' },
        { id: 'friendship', label: 'Friendship conflict' },
        { id: 'low-motivation', label: 'Low motivation or energy' },
        { id: 'sleep', label: 'Sleep issues' },
        { id: 'school', label: 'School-related stress' },
        { id: 'anxiety', label: 'Worry or anxiety' },
        { id: 'other', label: 'Other (describe below)' },
      ],
    },
    {
      id: 'observations',
      title: 'What I Noticed',
      type: 'textarea',
      prompt: "Share any observations about your child's resilience this week:",
      placeholder: 'e.g. "She handled a disappointment really well at soccer practice…"',
      optional: false,
    },
    {
      id: 'dimension-ratings',
      title: 'Dimension Quick-Ratings',
      type: 'dimension-scale',
      description: 'How is your child doing in each area this week? (1 = Struggling, 5 = Thriving)',
      dimensions: [
        { key: 'emotional-adaptive',   label: 'Managing Emotions',  icon: '/icons/emotional-adaptive.svg' },
        { key: 'agentic-generative',   label: 'Setting Goals',      icon: '/icons/agentic-generative.svg' },
        { key: 'somatic-regulative',   label: 'Body Awareness',     icon: '/icons/somatic-regulative.svg' },
        { key: 'cognitive-narrative',  label: 'Positive Thinking',  icon: '/icons/cognitive-narrative.svg' },
        { key: 'relational-connective',label: 'Connecting With Others', icon: '/icons/relational-connective.svg' },
        { key: 'spiritual-existential',label: 'Sense of Purpose',   icon: '/icons/spiritual-existential.svg' },
      ],
    },
    {
      id: 'questions',
      title: 'Questions for Your Practitioner',
      type: 'textarea',
      prompt: 'Any questions or topics you want to discuss at the next session?',
      placeholder: 'Optional — share anything on your mind…',
      optional: true,
    },
    {
      id: 'celebration',
      title: 'Celebrate Something!',
      type: 'textarea',
      prompt: "What's one thing you want to celebrate about your child this week?",
      placeholder: 'Big or small — all wins count! 🎉',
      optional: true,
    },
  ],
};

export const MONTHLY_PARENT_SUMMARY = {
  id: 'monthly-summary',
  title: 'Monthly Progress Summary',
  frequency: 'monthly',
  estimatedMinutes: 15,
  description: 'A deeper reflection on your child\'s resilience journey this month.',
  sections: [
    {
      id: 'overall-progress',
      title: 'Overall Progress',
      type: 'likert',
      question: 'Compared to last month, how is my child doing overall?',
      scale: [1, 2, 3, 4, 5],
      labels: ['Much Worse', 'Somewhat Worse', 'About the Same', 'Somewhat Better', 'Much Better'],
    },
    {
      id: 'dimension-progress',
      title: 'Progress by Resilience Area',
      type: 'dimension-progress-grid',
      description: 'Rate your child\'s progress in each resilience area this month:',
      dimensions: [
        { key: 'emotional-adaptive',   label: 'Managing Emotions',     description: 'Identifying, expressing, and regulating emotions' },
        { key: 'agentic-generative',   label: 'Goal Power',            description: 'Setting goals, persisting, and bouncing back' },
        { key: 'somatic-regulative',   label: 'Body Wisdom',           description: 'Body awareness, breathing, and self-care' },
        { key: 'cognitive-narrative',  label: 'Story Power',           description: 'Positive thinking, problem-solving, growth mindset' },
        { key: 'relational-connective',label: 'Connection',            description: 'Friendships, empathy, and seeking support' },
        { key: 'spiritual-existential',label: 'Purpose & Meaning',     description: 'Gratitude, hope, and sense of meaning' },
      ],
      scale: [1, 2, 3, 4, 5],
      labels: ['Declining', 'Struggling', 'Stable', 'Growing', 'Thriving'],
    },
    {
      id: 'biggest-growth',
      title: 'Biggest Growth This Month',
      type: 'textarea',
      prompt: 'Describe the most significant growth you observed in your child this month:',
      placeholder: 'What changed? What did you notice?',
      optional: false,
    },
    {
      id: 'ongoing-challenges',
      title: 'Ongoing Challenges',
      type: 'textarea',
      prompt: 'What challenges are still present that you\'d like support with?',
      placeholder: 'Be as specific as possible to help your practitioner plan…',
      optional: false,
    },
    {
      id: 'home-activities',
      title: 'Activities Completed at Home',
      type: 'activity-log',
      prompt: 'Which IATLAS activities did your child do at home this month?',
      description: 'Check off activities and add notes about how they went.',
      optional: true,
    },
    {
      id: 'goal-review',
      title: 'Goal Review',
      type: 'goal-review',
      prompt: 'How is progress toward the goals set with your practitioner?',
      optional: true,
    },
    {
      id: 'parent-wellbeing',
      title: 'Your Wellbeing as a Caregiver',
      type: 'likert',
      question: 'How are YOU doing this month? Caregiver wellbeing matters too.',
      scale: [1, 2, 3, 4, 5],
      labels: ['Very Difficult', 'Difficult', 'Managing', 'Good', 'Great'],
      note: 'Your response is confidential and helps us support you better.',
    },
    {
      id: 'next-month-focus',
      title: 'Focus for Next Month',
      type: 'multiselect',
      description: 'What would you like to focus on next month?',
      options: [
        { id: 'emotions', label: 'Emotion regulation' },
        { id: 'goals', label: 'Goal setting and follow-through' },
        { id: 'body', label: 'Body awareness and calming skills' },
        { id: 'thinking', label: 'Positive thinking and problem-solving' },
        { id: 'social', label: 'Social skills and friendships' },
        { id: 'purpose', label: 'Sense of purpose and gratitude' },
        { id: 'family', label: 'Family connection activities' },
        { id: 'school', label: 'School readiness and transitions' },
      ],
    },
    {
      id: 'practitioner-message',
      title: 'Message for Your Practitioner',
      type: 'textarea',
      prompt: 'Anything else you\'d like your practitioner to know?',
      placeholder: 'Concerns, celebrations, questions, context…',
      optional: true,
    },
  ],
};

/**
 * Returns the appropriate form definition.
 * @param {'weekly'|'monthly'} type
 */
export function getParentForm(type) {
  if (type === 'monthly') return MONTHLY_PARENT_SUMMARY;
  return WEEKLY_PARENT_CHECKIN;
}
