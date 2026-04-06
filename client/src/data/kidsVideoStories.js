/**
 * Resilience Atlas — Kids Video Stories Data
 * YouTube-embedded video stories for the Kids & Teen program.
 */

export const KIDS_VIDEO_STORIES = [
  {
    id: 'video-1',
    youtubeId: 'ace3Camy_9U',
    title: 'Finding Your Strength',
    subtitle: 'Emotional-Adaptive · All Ages',
    description:
      'Discover how recognising your feelings and leaning on the people around you can help you bounce back from even the hardest days.',
    duration: '3:45',
    dimension: 'Emotional-Adaptive',
    ageGroup: 'age-5-7',
    ageLabel: 'Ages 5–7',
  },
  {
    id: 'video-2',
    youtubeId: 'MRV3XZImZwI',
    title: 'Building Connections',
    subtitle: 'Relational-Connective · Ages 8–14',
    description:
      'Explore how asking for help, making new friends, and staying connected to your community are real signs of resilience.',
    duration: '4:20',
    dimension: 'Relational-Connective',
    ageGroup: 'age-8-10',
    ageLabel: 'Ages 8–10',
  },
];

export const VIDEO_AGE_FILTERS = [
  { id: 'all',       label: 'All Ages' },
  { id: 'age-5-7',   label: 'Ages 5–7' },
  { id: 'age-8-10',  label: 'Ages 8–10' },
  { id: 'age-11-14', label: 'Ages 11–14' },
  { id: 'age-15-18', label: 'Ages 15–18' },
];
