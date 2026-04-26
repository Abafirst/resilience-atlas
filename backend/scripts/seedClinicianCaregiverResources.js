'use strict';

/**
 * seedClinicianCaregiverResources.js — Clinician & Caregiver Resource Seed
 *
 * Seeds the Resource collection with evidence-based resources for the
 * 'clinician' and 'caregiver' categories.
 *
 * All resources cite peer-reviewed research, clinical frameworks, or
 * established therapeutic approaches (APA, positive psychology, trauma-
 * informed care, compassion fatigue research, self-compassion, burnout
 * prevention, and caregiver burden literature).
 *
 * The script is IDEMPOTENT — running it more than once will not create
 * duplicates.  Each resource is matched by its slug and upserted.
 *
 * Usage:
 *   MONGODB_URI=<uri> node backend/scripts/seedClinicianCaregiverResources.js
 */

const path     = require('path');
const mongoose = require('mongoose');
const Resource = require(path.join(__dirname, '../models/Resource'));

const { seedResources } = require(path.join(__dirname, '../lib/seedResources'));

// ── Resource data ─────────────────────────────────────────────────────────────

const resources = [

  // ════════════════════════════════════════════════════════════════════════════
  // CLINICIAN  (6 resources)
  // ════════════════════════════════════════════════════════════════════════════

  {
    title:       'Evidence-Based Resilience Interventions for Clinical Practice',
    type:        'article',
    category:    'clinician',
    difficulty:  'intermediate',
    url:         'https://www.apa.org/topics/resilience',
    description: 'American Psychological Association review of validated resilience-building interventions for therapists and counselors, covering CBT, ACT, and positive psychology approaches. Synthesises RCT evidence on what works across clinical populations. [Gov/Academic]',
    excerpt:     'A practical overview of evidence-based resilience interventions you can integrate into therapy sessions.',
    authorName:  'American Psychological Association',
    tags:        ['evidence-based', 'clinical', 'CBT', 'ACT', 'resilience'],
    dimensions:  ['Cognitive-Narrative', 'Agentic-Generative'],
    timeCommitment: 15,
    status:      'published',
    publishedAt: new Date('2024-01-10'),
  },

  {
    title:       'Clinician Self-Care and Compassion Fatigue Prevention',
    type:        'pdf',
    category:    'clinician',
    difficulty:  'beginner',
    url:         'https://www.proqol.org/uploads/ProQOL_5_English_Self-Score.pdf',
    description: "Figley and Stamm's evidence-based Professional Quality of Life (ProQOL) framework for preventing burnout and compassion fatigue in helping professionals. Includes the widely-used ProQOL self-assessment tool. [Peer-reviewed]",
    excerpt:     'Use the ProQOL instrument to measure compassion satisfaction, burnout, and secondary traumatic stress.',
    authorName:  'ProQOL / Beth Hudnall Stamm',
    tags:        ['self-care', 'compassion-fatigue', 'burnout', 'ProQOL'],
    dimensions:  ['Emotional-Somatic', 'Somatic-Regulative'],
    timeCommitment: 20,
    status:      'published',
    publishedAt: new Date('2024-02-05'),
  },

  {
    title:       'Integrating Resilience Assessment into Clinical Workflows',
    type:        'video',
    category:    'clinician',
    difficulty:  'intermediate',
    url:         'https://www.youtube.com/watch?v=XiCrniLQGYc',
    videoProvider: 'youtube',
    videoId:     'XiCrniLQGYc',
    description: 'Dr. Steven Southwick (Yale) explains how to use validated resilience assessments—including the Connor-Davidson Resilience Scale—within therapy and clinical intake workflows. Explores translating assessment results into treatment planning. [Expert-informed]',
    excerpt:     'Learn to incorporate resilience screening tools into routine clinical practice.',
    authorName:  'Dr. Steven Southwick / Yale Medicine',
    tags:        ['assessment', 'clinical-workflow', 'Connor-Davidson', 'screening'],
    dimensions:  ['Cognitive-Narrative', 'Relational-Social'],
    timeCommitment: 12,
    status:      'published',
    publishedAt: new Date('2024-03-01'),
  },

  {
    title:       'Trauma-Informed Resilience Building: Neuroscience-Based Approaches',
    type:        'podcast',
    category:    'clinician',
    difficulty:  'advanced',
    url:         'https://www.bessel.com/podcast',
    description: "Bessel van der Kolk and colleagues explore neurobiological underpinnings of trauma and resilience, drawing on polyvagal theory (Porges) and somatic approaches. Covers integrating body-based interventions into trauma therapy. [Expert-informed]",
    excerpt:     'Deep dive into polyvagal theory and somatic approaches for building resilience in trauma therapy.',
    authorName:  'Bessel van der Kolk / Trauma Research Foundation',
    tags:        ['trauma-informed', 'neuroscience', 'polyvagal', 'somatic'],
    dimensions:  ['Emotional-Somatic', 'Spiritual-Reflective'],
    timeCommitment: 45,
    status:      'published',
    publishedAt: new Date('2024-03-20'),
  },

  {
    title:       'Maslach Burnout Inventory: Clinician Guide & Scoring',
    type:        'pdf',
    category:    'clinician',
    difficulty:  'beginner',
    url:         'https://www.mindgarden.com/117-maslach-burnout-inventory',
    description: "Christina Maslach's gold-standard burnout measurement tool adapted for healthcare and mental-health professionals. Includes administration guidelines, norm tables, and evidence-based intervention pathways for each burnout subscale. [Peer-reviewed]",
    excerpt:     'Measure and address burnout across emotional exhaustion, depersonalisation, and personal accomplishment dimensions.',
    authorName:  'Christina Maslach / Mind Garden',
    tags:        ['burnout', 'Maslach', 'assessment', 'healthcare'],
    dimensions:  ['Emotional-Somatic', 'Agentic-Generative'],
    timeCommitment: 25,
    status:      'published',
    publishedAt: new Date('2024-04-08'),
  },

  {
    title:       'Positive Psychology Interventions in Clinical Settings',
    type:        'article',
    category:    'clinician',
    difficulty:  'intermediate',
    url:         'https://ppc.sas.upenn.edu/research/positive-psychotherapy',
    description: "Seligman and Rashid's Positive Psychotherapy manual overview: empirically-validated exercises (three good things, gratitude letters, signature strengths) shown in RCTs to reduce depression and build durable resilience in clinical populations. [Peer-reviewed]",
    excerpt:     'Apply evidence-backed positive psychology exercises within structured clinical or coaching sessions.',
    authorName:  'University of Pennsylvania Positive Psychology Center',
    tags:        ['positive-psychology', 'Seligman', 'clinical', 'interventions'],
    dimensions:  ['Cognitive-Narrative', 'Spiritual-Reflective'],
    timeCommitment: 18,
    status:      'published',
    publishedAt: new Date('2024-04-25'),
  },

  // ════════════════════════════════════════════════════════════════════════════
  // CAREGIVER  (6 resources)
  // ════════════════════════════════════════════════════════════════════════════

  {
    title:       'Building Resilience While Caregiving: Evidence-Based Strategies',
    type:        'article',
    category:    'caregiver',
    difficulty:  'beginner',
    url:         'https://www.nia.nih.gov/health/caregiving/taking-care-yourself-tips-caregivers',
    description: 'National Institute on Aging research-backed guide covering practical self-care strategies for family caregivers—stress identification, social support, respite planning, and boundary-setting—grounded in caregiver burden literature (Zarit, 1980). [Gov/Academic]',
    excerpt:     'Research-backed methods for maintaining emotional well-being while caring for a loved one.',
    authorName:  'National Institute on Aging (NIH)',
    tags:        ['caregiver', 'self-care', 'caregiver-burden', 'evidence-based'],
    dimensions:  ['Emotional-Somatic', 'Relational-Social'],
    timeCommitment: 10,
    status:      'published',
    publishedAt: new Date('2024-01-20'),
  },

  {
    title:       'Self-Compassion for Caregivers',
    type:        'video',
    category:    'caregiver',
    difficulty:  'beginner',
    url:         'https://www.youtube.com/watch?v=IvtZBUSplr4',
    videoProvider: 'youtube',
    videoId:     'IvtZBUSplr4',
    description: "Kristin Neff's self-compassion practices—mindfulness, common humanity, and self-kindness—adapted specifically for family caregivers. Based on her seminal research showing self-compassion reduces caregiver anxiety, depression, and emotional exhaustion. [Expert-informed]",
    excerpt:     'Apply Kristin Neff\'s evidence-based self-compassion framework to the unique challenges of caregiving.',
    authorName:  'Dr. Kristin Neff / Self-Compassion.org',
    tags:        ['self-compassion', 'Kristin-Neff', 'mindfulness', 'caregiver'],
    dimensions:  ['Spiritual-Reflective', 'Emotional-Somatic'],
    timeCommitment: 8,
    status:      'published',
    publishedAt: new Date('2024-02-12'),
  },

  {
    title:       "The Caregiver's Resilience Toolkit",
    type:        'pdf',
    category:    'caregiver',
    difficulty:  'beginner',
    url:         'https://www.caregiver.org/resource/caregivers-guide-self-care/',
    description: 'Family Caregiver Alliance practical workbook grounded in stress-inoculation training and acceptance-based coping. Provides structured exercises for stress management, boundary-setting, sleep hygiene, and emotional regulation for unpaid caregivers. [Gov/Academic]',
    excerpt:     'Structured exercises for boundary-setting, stress management, and emotional regulation in daily caregiving.',
    authorName:  'Family Caregiver Alliance',
    tags:        ['toolkit', 'workbook', 'stress-management', 'boundaries'],
    dimensions:  ['Somatic-Regulative', 'Agentic-Generative'],
    timeCommitment: 25,
    status:      'published',
    publishedAt: new Date('2024-03-05'),
  },

  {
    title:       'Relational Resilience: Strengthening Connections While Caregiving',
    type:        'article',
    category:    'caregiver',
    difficulty:  'intermediate',
    url:         'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6010980/',
    description: "Peer-reviewed article (Journal of Family Psychology) examining how relational support networks buffer caregiver burden. Draws on Jordan's relational-cultural theory and attachment research to explain how maintaining healthy relationships protects against caregiver isolation. [Peer-reviewed]",
    excerpt:     'Learn how relational support systems protect against isolation and burnout during long-term caregiving.',
    authorName:  'NIH / Journal of Family Psychology',
    tags:        ['relationships', 'relational-resilience', 'social-support', 'caregiver'],
    dimensions:  ['Relational-Social', 'Cognitive-Narrative'],
    timeCommitment: 12,
    status:      'published',
    publishedAt: new Date('2024-03-28'),
  },

  {
    title:       'Mindfulness-Based Stress Reduction for Caregivers',
    type:        'podcast',
    category:    'caregiver',
    difficulty:  'intermediate',
    url:         'https://www.mindful.org/podcast/',
    description: "Explores Jon Kabat-Zinn's MBSR protocol as adapted for family caregivers. Reviews RCT evidence demonstrating that 8-week MBSR programmes reduce caregiver stress, improve sleep, and enhance quality of life compared to usual care. [Expert-informed]",
    excerpt:     'MBSR-based practices that research shows significantly reduce caregiver stress and improve well-being.',
    authorName:  'Mindful.org / Jon Kabat-Zinn',
    tags:        ['MBSR', 'mindfulness', 'stress-reduction', 'caregiver'],
    dimensions:  ['Somatic-Regulative', 'Spiritual-Reflective'],
    timeCommitment: 30,
    status:      'published',
    publishedAt: new Date('2024-04-15'),
  },

  {
    title:       "Understanding and Preventing Caregiver Burnout",
    type:        'article',
    category:    'caregiver',
    difficulty:  'beginner',
    url:         'https://www.helpguide.org/articles/stress/caregiver-stress-and-burnout.htm',
    description: "HelpGuide evidence-based overview of caregiver burnout drawing on Maslach's burnout framework, Figley's compassion fatigue research, and APA guidelines. Covers warning signs, prevention strategies, and how to access respite resources. [Expert-informed]",
    excerpt:     'Recognise early signs of caregiver burnout and apply evidence-based prevention strategies.',
    authorName:  'HelpGuide / Robert Segal & Jeanne Segal',
    tags:        ['burnout', 'compassion-fatigue', 'prevention', 'respite'],
    dimensions:  ['Emotional-Somatic', 'Agentic-Generative'],
    timeCommitment: 12,
    status:      'published',
    publishedAt: new Date('2024-05-01'),
  },

];

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    console.error('Usage: MONGODB_URI=<uri> node backend/scripts/seedClinicianCaregiverResources.js');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const data of resources) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
    const doc = { ...data, slug };

    try {
      const result = await Resource.updateOne(
        { slug },
        { $set: doc },
        { upsert: true, setDefaultsOnInsert: true }
      );
      if (result.upsertedCount > 0) inserted++;
      else if (result.modifiedCount > 0) updated++;
      else skipped++;
    } catch (err) {
      if (err.code === 11000) skipped++;
      else throw err;
    }
  }

  console.log('\nSeed complete.');
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Total processed: ${resources.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
