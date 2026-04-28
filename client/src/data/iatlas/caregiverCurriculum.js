/**
 * caregiverCurriculum.js
 * Topic-based Caregiver Learning curriculum for the IATLAS Family tier ($39.99/mo).
 *
 * 15 evidence-based parent guides organised into 6 practical topic categories
 * that complement the IATLAS resilience dimensions.
 *
 * Each guide includes:
 *  - Intro paragraphs (why this topic matters)
 *  - Core content (practical strategies, 500-800 words)
 *  - Key takeaways (3-5 bullet points)
 *  - Try this week (1-2 concrete action items)
 *  - Related activities (links to IATLAS kids activities)
 *  - Evidence base (research backing)
 *
 * References:
 *  - Siegel, D. & Bryson, T. (2011). The Whole-Brain Child.
 *  - Siegel, D. & Bryson, T. (2020). The Power of Showing Up.
 *  - van der Kolk, B. (2014). The Body Keeps the Score.
 *  - Dweck, C. (2006). Mindset: The New Psychology of Success.
 *  - Perry, B. & Winfrey, O. (2021). What Happened to You?
 *  - Greenspan, S. & Wieder, S. (2006). Engaging Autism.
 *  - Hallowell, E. & Ratey, J. (2021). ADHD 2.0.
 */

export const CAREGIVER_CURRICULUM = {
  'building-routines': {
    id: 'building-routines',
    title: 'Building Resilience Through Routines',
    description: 'Daily and weekly routines create the predictable structure children need to feel safe, regulated, and ready to face challenges.',
    icon: '/icons/planning.svg',
    color: '#4f46e5',
    modules: [
      {
        id: 'morning-routine-resilience',
        title: 'Morning Routines That Build Resilience',
        duration: '9 min read',
        ageGroups: ['ages-5-7', 'ages-8-10'],
        intro: [
          'How a family starts the morning sets the emotional tone for the entire day. A predictable, calm morning routine does far more than get children out the door on time — it signals to their nervous systems that the world is safe and manageable. When children know what to expect, they spend less energy on vigilance and more energy on learning, creativity, and connection.',
          'Research on stress and the developing brain shows that unpredictable environments activate the amygdala — the brain\'s threat-detection system — keeping children in a heightened state of alertness. Consistent morning routines lower this baseline arousal, making children more emotionally available for the demands of school and social life.',
          'The goal is not a rigid military schedule, but a reliable sequence of events that your child can anticipate and, over time, self-manage. This progressive handover of morning responsibility is itself a powerful resilience builder.',
        ],
        content: `**Why Sequence Matters More Than Timing**

Children thrive on sequence ("breakfast, then get dressed, then pack bag") more than fixed times. A sequence-based routine is resilient to disruptions — running 15 minutes late doesn't collapse the whole system when children know *what comes next* rather than what time things happen.

Introduce your morning sequence visually. For ages 5-7, draw or photograph each step and post it at child height. For ages 8-10, create a simple checklist they can tick off themselves. Ownership of the checklist is itself a daily practice in self-management and agency.

**The Connection Buffer**

One of the most effective resilience practices you can embed in a morning routine costs zero time: genuine connection before separation. Two minutes of full-presence connection — crouching to their level, making eye contact, a specific phrase or physical ritual — dramatically reduces separation anxiety and school-day dysregulation.

Try a morning "launch ritual": a specific handshake, a shared phrase ("Tackle the day like a lion"), or three seconds of eye contact and a smile. Consistency is what makes it powerful, not complexity.

**Progressive Independence by Age**

Ages 5-7: Your role is to coach the sequence, not manage every step. "What comes after breakfast?" rather than "Now go get dressed." Celebrate when they move through without prompting.

Ages 8-10: The goal is full morning independence with minimal adult involvement by the end of the school year. Start by removing one adult prompt per week. Expect some regression — treat it matter-of-factly and restore the cue without drama.

**Handling Morning Dysregulation**

When children wake dysregulated (a difficult dream, anxiety about the day, unresolved conflict from the previous night), the worst response is to escalate. Keep your voice low, reduce sensory input where possible, and connect before you correct. A two-minute co-regulation window — sitting quietly together, matching their breathing — costs less time than a ten-minute conflict.

Build a "regulation reset" into the routine for children who need it: five minutes of quiet play, a brief walk outside, or a simple breathing exercise before the morning sequence begins.`,
        keyTakeaways: [
          'A predictable morning sequence lowers stress hormones and improves emotional readiness for school',
          'Sequence-based routines ("what comes next") are more resilient than time-based ones',
          'A two-minute connection ritual before school departure reduces separation anxiety',
          'Progressive independence transfers morning management to children across the school year',
          'Morning dysregulation calls for connection first, then the routine — not correction first',
        ],
        tryThisWeek: [
          'Create a visual morning sequence chart with your child (draw pictures or take photos of each step). Post it at their eye level and let them "tick" each step as they go.',
          'Introduce one specific morning goodbye ritual — a phrase, handshake, or brief hug — and use it every single school morning for two weeks.',
        ],
        relatedActivities: [
          { title: 'Box Breathing Adventure', dimension: 'somatic-regulative' },
          { title: 'The Morning Goals Explorer', dimension: 'agentic-generative' },
        ],
        evidenceBase: 'Research on the hypothalamic-pituitary-adrenal (HPA) axis shows that predictable environments reduce cortisol output in children (Gunnar & Quevedo, 2007). Studies on school readiness consistently identify home routine stability as a top predictor of early academic success (Fiese et al., 2002).',
      },

      {
        id: 'bedtime-emotional-regulation',
        title: 'Bedtime Routines for Emotional Regulation',
        duration: '8 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        intro: [
          'Bedtime is the most emotionally loaded transition of the day. Children (and parents) arrive at it tired, often overstimulated, and carrying the emotional residue of everything that happened since morning. A well-designed bedtime routine doesn\'t just improve sleep — it creates a daily emotional processing window that builds regulation capacity over time.',
          'Sleep deprivation is one of the most underappreciated contributors to childhood emotional dysregulation. Children who consistently get insufficient sleep show elevated cortisol, reduced impulse control, lower frustration tolerance, and poorer social functioning — all of which look like "behaviour problems" but have a physiological root cause.',
          'The good news is that bedtime routines are highly modifiable and respond quickly to change. Most families notice meaningful improvement in emotional regulation within two to three weeks of establishing a consistent bedtime sequence.',
        ],
        content: `**The Physiology of Wind-Down**

The transition from wakefulness to sleep requires a drop in core body temperature, a rise in melatonin, and a calming of the sympathetic nervous system. Screens, high-stimulation play, and intense emotional conversations within 60-90 minutes of bedtime all counteract this process.

Practical wind-down signals: dim lights 45 minutes before sleep, stop screens 60 minutes before sleep, shift from active to quiet activities (reading, drawing, puzzle). The environment does much of the regulatory work — you don't have to manage the transition, you engineer the conditions.

**The Bedtime Debrief**

Bedtime is neuroscience-optimal for emotional processing. Lying down, in low light, physically close to a trusted caregiver — this is when children's nervous systems are most receptive to emotional reflection.

A simple "best-hardest" check-in: "What was the best part of your day? What was the hardest?" takes two minutes and accomplishes multiple resilience goals: it models that both positive and negative experiences are worth acknowledging, it provides a daily emotional vocabulary workout, and it gives you a window into your child's inner world that you might otherwise miss.

For ages 11-14, the check-in may need to feel more like a conversation and less like a ritual. Try "anything on your mind from today?" during a side-by-side activity (folding laundry, looking at phones together briefly) rather than a face-to-face format that can feel interrogative to adolescents.

**Ages 5-7: Sensory Regulation Strategies**

Young children often need physical support to downregulate at bedtime. Deep pressure (a firm hug, weighted blanket, or back rub) activates the parasympathetic nervous system. Simple guided imagery ("imagine a cosy cave where nothing can disturb you...") helps younger children transition out of active thinking mode.

**Ages 8-14: Anxiety at Bedtime**

Worry amplifies at bedtime because there are no competing demands occupying the mind. For children prone to anxiety, the "worry dump" technique is effective: five minutes before lights out, write or draw everything worrying you onto paper, then physically close the notebook. The externalisation of worry onto paper interrupts the ruminative cycle.

If bedtime anxiety is persistent and significant, consider a brief daytime "worry time" window (15 minutes where all worries are welcomed and addressed) which has been shown to reduce bedtime worry intrusion.`,
        keyTakeaways: [
          'Sleep deprivation is a major contributor to emotional dysregulation — protecting sleep is resilience work',
          'A consistent wind-down sequence (dim lights, no screens 60 min before bed) supports the physiology of sleep',
          'The "best-hardest" bedtime check-in builds emotional vocabulary and parent-child attunement daily',
          'Deep pressure and guided imagery help younger children shift from arousal to rest',
          'The "worry dump" technique helps anxious children externalise and contain bedtime rumination',
        ],
        tryThisWeek: [
          'Implement a "no screens 45 minutes before bed" rule for one week and note any changes in your child\'s bedtime behaviour.',
          'Introduce the "best-hardest" check-in tonight — keep it to two questions and two minutes. Listen without redirecting.',
        ],
        relatedActivities: [
          { title: 'The Worry Jar', dimension: 'cognitive-narrative' },
          { title: 'Body Scan for Kids', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'The American Academy of Sleep Medicine recommends 9-12 hours for ages 6-12 and 8-10 hours for ages 13-18. Studies show that consistent bedtime routines improve sleep onset, duration, and daytime behaviour in children (Mindell et al., 2015). Screen-free wind-down has been shown to improve sleep quality independently of total screen time (Janssen et al., 2020).',
      },

      {
        id: 'transition-routines',
        title: 'Transition Routines: School, Activities & Family Changes',
        duration: '10 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'Transitions — between activities, between environments, between life chapters — are among the most challenging moments for children and families. Many children who appear to have "behaviour problems" are actually children who struggle specifically with transitions: the moment of shifting from one state, place, or activity to another.',
          'Understanding transitions as a distinct skill (not just compliance or mood) opens up different interventions. Children who struggle with transitions are not being deliberately difficult — they are experiencing a genuine regulatory challenge that can be directly supported.',
          'This guide covers three types of transitions: daily micro-transitions (morning → school, school → home), activity transitions (ending screen time, leaving a playdate), and major life transitions (new school, divorce, new sibling).',
        ],
        content: `**Why Transitions Are Hard: The Neuroscience**

Every transition requires the brain to do three things simultaneously: disengage from the current state (which may be pleasurable or activating), hold the new state in working memory, and shift executive attention. For children with immature prefrontal cortex function — which includes all children under roughly 25, but especially younger children and those with ADHD or anxiety — this is cognitively expensive.

The key insight: transitions are not about willingness, they are about capacity. Framing them as a skill you support rather than a battle you win changes the entire interaction.

**Strategies for Daily Micro-Transitions**

Advance notice: "In five minutes we're leaving for school" gives the brain time to begin disengaging. Two warnings (five minutes, then one minute) work better than one. Avoid "just one more minute" — it extends the disengagement indefinitely.

Transition objects: For younger children, allowing them to bring a small item from one context to another (a toy from home to school, or a favourite book from school to home) bridges the transition neurologically. The object carries safety signals across environments.

Connecting rituals: Brief arrival rituals at the new environment ("when we get to school, we always find your peg and hang your bag together") reduce the novelty stress of the new context.

**Activity Transitions: Ending Screen Time**

Screen-to-reality transitions are particularly challenging because screens deliver constant novelty and dopamine — making the real world feel dull by comparison immediately after. Strategies:

Set a clear endpoint before screens begin: "You can watch until 4pm" is cleaner than "thirty more minutes" which children know is negotiable.

Use natural stopping points: "You can finish this episode/level, then it's done." Asking a child to stop mid-episode creates a Zeigarnik effect (unfinished tasks occupy working memory).

Build a "re-entry ritual" for after screens: a physical activity, a snack with a conversation, or outdoor time. The contrast helps the nervous system reset.

**Major Life Transitions**

For significant transitions (school change, family structure change, bereavement, new city), children need:

Preparation: Advanced notice proportionate to the child's developmental stage. Toddlers need days, older children weeks, teenagers months.

Narrative: Help them construct a coherent story about the change. "We're moving to a new house because..." gives the transition meaning rather than arbitrary disruption.

Preserved continuity: Maintain as many existing routines as possible during major transitions. When the external world is changing, internal rituals provide an anchor.

Permission to grieve: Every transition involves loss, even positive ones. Validate grief about what is ending alongside excitement about what is beginning.`,
        keyTakeaways: [
          'Transitions are a regulatory challenge, not a compliance issue — approach them as a skill to support',
          'Advance warnings (5 min, then 1 min) allow the brain to begin disengaging from the current activity',
          'Screen-to-reality transitions are particularly difficult; natural stopping points and re-entry rituals help',
          'Major life transitions require preparation, narrative, preserved routines, and permission to grieve',
          'Transition objects bridge safety signals across different environments for younger children',
        ],
        tryThisWeek: [
          'Practice the two-warning system for one daily transition that is currently challenging (e.g., screen time ending). Give a 5-minute warning and a 1-minute warning for five consecutive days and notice the difference.',
          'For a major transition your family is currently navigating, write down together "three things that will stay the same" after the change. Review the list with your child when anxiety peaks.',
        ],
        relatedActivities: [
          { title: 'The Change Navigator', dimension: 'cognitive-narrative' },
          { title: 'Grounding in the Senses', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'Executive function research identifies cognitive flexibility and inhibitory control as the skills underlying successful transitions (Zelazo et al., 2016). Studies of children with ADHD show that environmental structure — not willpower — is the most effective transition support (Barkley, 2015). Research on major life transitions identifies narrative coherence as a key protective factor (McAdams, 2001).',
      },
    ],
  },

  'co-regulation': {
    id: 'co-regulation',
    title: 'Co-Regulation',
    description: 'Learn how your calm nervous system regulates your child\'s, and build practical strategies for helping children through emotional storms.',
    icon: '/icons/connection.svg',
    color: '#059669',
    modules: [
      {
        id: 'co-regulation-why-it-matters',
        title: 'What Is Co-Regulation and Why It Matters',
        duration: '8 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'Co-regulation is one of the most important concepts in developmental science — yet it remains unfamiliar to many parents. Simply put, co-regulation is the process by which a calm, regulated adult nervous system helps stabilise a dysregulated child\'s nervous system. This is not metaphorical: it is neurobiological.',
          'When you stay calm during your child\'s meltdown, your regulated breathing, slow heartbeat, and warm vocal tone send safety signals through multiple channels — including facial expression, touch, and prosodic voice quality — that help your child\'s amygdala downshift from threat mode. You are, quite literally, lending your nervous system to your child.',
          'Understanding co-regulation reframes the question "How do I get my child to calm down?" into "How do I stay regulated so that I can help my child regulate?" This shift is both humbling and empowering.',
        ],
        content: `**The Polyvagal Foundation**

Neuroscientist Stephen Porges\' Polyvagal Theory explains why co-regulation works. The vagus nerve — the longest cranial nerve — connects the brain to the heart, lungs, and gut, and acts as a biological safety-detection system. When the social engagement system (activated by a calm, warm presence) is triggered, the fight-or-flight system downregulates automatically.

In practical terms: when you make eye contact, use a slow and warm voice, and maintain an open, non-threatening posture during your child\'s distress, you are directly activating their social engagement system. This is why presence and attunement work, and why commands to "calm down" do not.

**Self-Regulation Comes After Co-Regulation**

Children\'s prefrontal cortex — the brain\'s executive control centre — is not fully developed until the mid-20s. Asking a distressed 7-year-old to "use their words" or "manage their feelings independently" is asking them to use hardware they do not yet have fully operational.

Self-regulation is built through thousands of co-regulation experiences. Each time a caregiver successfully helps a child move through a difficult emotion, the neural pathways supporting self-regulation become more myelinated — literally better connected. Co-regulation is not a crutch that prevents self-regulation; it is the necessary scaffold that builds it.

**The Three-Step Co-Regulation Sequence**

Step 1 — Be present, not absent: Move toward your child, not away. Get physically close. Your presence communicates safety before any words are exchanged.

Step 2 — Regulate your own nervous system first: Take one slow breath before you speak. If you are triggered (and all parents are sometimes), ground yourself physically — feel your feet on the floor, take three breaths — before responding.

Step 3 — Match, then lead: Briefly acknowledge the emotion at the same intensity before gently moving to calmer energy. "I can see you\'re really, really upset right now" — then pause and lower your voice slightly. You match their experience without matching their dysregulation, then lead them to calmer ground.

**Common Co-Regulation Mistakes**

Talking too much: Language is a higher-order cortical function that comes offline under stress. Save the words for after the emotion has passed. Presence and proximity are more effective than explanation during dysregulation.

Requiring eye contact: When children are dysregulated, forced eye contact can feel threatening. Side-by-side is often safer than face-to-face during acute distress.

Consequences during crisis: Consequences require the capacity for rational thinking. A child in the midst of emotional flooding cannot process cause-and-effect reasoning. Address consequences after regulation is restored — minimum 20-30 minutes later.`,
        keyTakeaways: [
          'Your nervous system literally helps regulate your child\'s — calm is not passive, it is active co-regulation',
          'Self-regulation is built through repeated co-regulation experiences; it cannot be demanded directly',
          'The Polyvagal theory explains why warmth, slow voice, and open posture work better than commands',
          'Match then lead: acknowledge the emotion at their intensity, then gently guide to calmer ground',
          'Consequences and explanations belong after regulation, not during the emotional storm',
        ],
        tryThisWeek: [
          'During the next emotional upset, practice the three-step sequence: move toward your child, take one breath to regulate yourself, then speak. Notice what shifts compared to your usual response.',
          'Identify one "trigger moment" (a type of situation that reliably dysregulates you as a parent). Plan specifically how you will ground yourself in that moment before responding to your child.',
        ],
        relatedActivities: [
          { title: 'Calm-Together Breathing', dimension: 'somatic-regulative' },
          { title: 'The Feelings Detective', dimension: 'emotional-adaptive' },
        ],
        evidenceBase: 'Porges (2011) Polyvagal Theory provides the neurobiological basis for co-regulation via the social engagement system. Siegel & Bryson (2020) synthesise attachment and neuroscience to explain how parental attunement builds children\'s self-regulation capacity. Schore (2012) documents the neurobiological mechanisms through which caregiver affect regulation shapes infant and child brain development.',
      },

      {
        id: 'co-regulation-by-age',
        title: 'Co-Regulation Strategies by Age Group',
        duration: '11 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'Co-regulation strategies that work beautifully for a 6-year-old will fall flat or even backfire with a 14-year-old — and vice versa. Understanding how co-regulation needs shift across development allows caregivers to match their support to where the child actually is, rather than where they wish the child was.',
          'Across all ages, the fundamental mechanism is the same: your regulated presence helps regulate theirs. What changes is the form that presence takes — the proximity, the words used, the level of physical contact, and how much space the child needs before they can accept support.',
          'This guide walks through co-regulation strategies for four developmental windows: early childhood (5-7), middle childhood (8-10), pre-adolescence (11-14), and adolescence (15-18).',
        ],
        content: `**Ages 5-7: Physical Presence and Sensory Regulation**

Young children regulate primarily through sensory and physical channels. At this age, your physical proximity is the intervention. Strategies that work:

Physical closeness: Sitting next to them, offering a lap, holding their hand (if accepted). Don\'t force touch if they push away — respect the signal, stay nearby.

Deep pressure: Firm hugs, weighted blankets, or gentle joint compression (holding their hands between both of yours and pressing gently) activate the proprioceptive system and downregulate the sympathetic nervous system.

Simple rhythmic activities: Rocking, rhythmic tapping, repetitive physical movements all engage the parasympathetic nervous system. Singing a simple song together works for many young children.

Short validation + physical comfort: "That was really hard. I\'m right here." Then sit quietly. At this age, extended verbal explanation is counterproductive.

**Ages 8-10: Language Bridges**

Middle childhood brings more language and narrative capacity, but stress still shuts down higher language processing. The bridge between physical co-regulation and verbal co-regulation works well at this age.

Emotion naming: "I notice you seem really frustrated right now." Wait. Let them respond or stay silent. Offer two emotion words if they seem stuck: "Is it more like angry, or more like disappointed?"

Permission to not talk: "You don\'t have to talk right now. I\'m here if you want to." Children this age often need to know connection is available without feeling obligated to perform emotional processing.

Side-by-side regulation: Drawing, building LEGO, going for a walk together — doing something alongside them without discussing the problem. Once the nervous system has settled (often 10-20 minutes), they will usually bring it up themselves.

**Ages 11-14: Space with a Tether**

Pre-adolescence brings a real push for privacy and independence — which can look like rejection of parental co-regulation. It is not rejection; it is developmental repositioning. The skill is offering connection without imposing it.

The "I\'m here" message: "I can see something is hard. I\'m not going to push. I\'m around if you want to talk." Then actually be around — do nearby activities, don\'t leave the building.

Text as a bridge: Many 11-14 year-olds find it easier to share difficult emotions via text or note than face-to-face. Consider texting "hey, noticed you seemed off today. you okay?" This respects their need for privacy while holding the connection.

Interest-based co-regulation: Joining their world (watching their show with them, asking about their game) without an agenda. When they feel accepted, co-regulation happens through the connection itself.

**Ages 15-18: Peer-Referenced but Caregiver-Anchored**

Teenagers\' primary reference group has shifted to peers, but research consistently shows that adolescents need their parents more than they appear to. The adolescent who pushes hardest for autonomy is often the one who most needs the secure base to push against.

Autonomy-preserving language: Replace "you should" with "I wonder if..." Replace "calm down" with "I\'m not going anywhere." Give them the choice to engage: "Do you want to talk, or would it help to just go for a drive?"

Non-judgmental presence: Resist the urge to problem-solve, educate, or share your feelings about their situation during dysregulation. Your job is presence first. Analysis and advice — if wanted — come later.

The repair conversation: Adolescents do not always accept co-regulation in the moment. The repair — returning hours later to say "I wasn\'t sure how to help earlier. How are you now?" — is its own powerful co-regulation offer.`,
        keyTakeaways: [
          'Ages 5-7: Physical presence, deep pressure, and short validation are the primary tools',
          'Ages 8-10: Side-by-side activities and emotion naming bridge physical and verbal regulation',
          'Ages 11-14: Space with a tether — offer connection without imposing it; text may be easier than talk',
          'Ages 15-18: Autonomy-preserving language and non-judgmental presence; the repair matters as much as the moment',
          'Across all ages: co-regulation happens through connection, not correction',
        ],
        tryThisWeek: [
          'Identify your child\'s current age group and choose one strategy from that section to try this week during a moment of dysregulation.',
          'Practice the "I\'m here" message today without any follow-up pressure: simply say it once and then give space.',
        ],
        relatedActivities: [
          { title: 'Emotions on a Scale', dimension: 'emotional-adaptive' },
          { title: 'The Body Scan Check-In', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'Developmental co-regulation research by Calkins & Hill (2007) documents how regulatory support changes form but remains critical across the full developmental span. Steinberg (2014) provides evidence that adolescent risk-taking is modulated by parental connection, even when teens do not seek it openly. Research on the ACE (Adverse Childhood Experiences) study shows that one secure parental relationship buffers against all other risk factors.',
      },

      {
        id: 'dysregulation-toolkit',
        title: 'When Your Child Is Dysregulated: A Caregiver Toolkit',
        duration: '10 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        intro: [
          'Dysregulation — when a child\'s emotional response overwhelms their regulatory capacity — can feel chaotic and frightening, for both the child and the caregiver. Having a toolkit means you don\'t have to think clearly in the moment; you have a menu of responses to choose from.',
          'The toolkit in this guide is organised into three phases: Before (what to do before dysregulation to reduce frequency), During (what to do in the midst of an emotional storm), and After (what to do once calm is restored). All three phases matter — many parents focus only on the During phase and miss the opportunities that the Before and After phases offer.',
          'It\'s worth noting: dysregulation is normal. Every child dysregulates. The goal is not to eliminate all emotional storms — it is to help children move through them with increasing ease, and to repair connection quickly when storms occur.',
        ],
        content: `**Before: Prevention Is Possible**

Not all dysregulation can be prevented, but many recurring episodes follow a pattern. Common triggers: hunger (the HALT acronym — Hungry, Angry, Lonely, Tired — is useful), transitions (see the Transition Routines guide), specific sensory triggers, and cumulative fatigue at the end of the week.

Keep a simple trigger log for two weeks: note what was happening in the hour before significant dysregulation. Patterns usually emerge. Once you know the pattern, you can intervene upstream.

Preventive regulation filling: Regular co-regulation deposits — play, physical closeness, shared laughter, undivided attention — reduce the frequency of dysregulation by ensuring the child\'s "connection tank" is full before stressors arrive.

**During: The PACE Framework**

PACE (Playfulness, Acceptance, Curiosity, Empathy) — developed by psychologist Dan Hughes — provides a framework for the caregiver\'s attitude during dysregulation:

Playfulness: Retain a light, warm quality (not joking about the emotion, but not collapsing into gravity either). A small smile, a gentle playful tone, communicates safety.

Acceptance: Accept the emotion, not necessarily the behaviour. "I accept that you\'re really angry right now" is very different from "I accept that you hit your sister."

Curiosity: Approach the emotion with genuine interest, not alarm. "I wonder what was underneath all that?" Open curiosity keeps the caregiver out of threat mode.

Empathy: "That sounds really hard. I get why that felt so unfair." Empathy before advice. Always.

**During: Environmental Interventions**

Before words, adjust the environment:
- Lower sensory input: dim lights, reduce noise, move to a calmer space
- Reduce social pressure: other people watching escalates dysregulation
- Change your position: sitting or kneeling reduces perceived threat
- Reduce demands: stop asking questions, stop adding tasks

**After: The Repair Conversation**

The repair conversation is among the most powerful resilience tools available to parents. It communicates: this relationship is more important than being right, ruptures can be mended, and difficult feelings are survivable.

Wait until all parties are genuinely calm (minimum 20 minutes after calm is restored). Then:

"I want to talk about what happened earlier, when you\'re ready." If they\'re not ready, schedule it: "Can we talk tonight before bed?"

Share your own experience briefly: "When that happened, I felt worried and a bit overwhelmed."

Ask about theirs: "What was happening for you?"

Focus on repair, not re-litigation: the goal is reconnection and mutual understanding, not establishing who was right.

Plan together: "Is there anything we could do differently next time?" This collaborative problem-solving builds metacognitive awareness and agency.

**When to Get Extra Support**

Dysregulation that is increasing in frequency or intensity, that involves danger to the child or others, or that significantly impairs daily functioning warrants professional consultation. This is not failure — it is informed parenting. Contact your paediatrician or a child psychologist for an assessment.`,
        keyTakeaways: [
          'Organise your response in three phases: Before (prevention), During (co-regulation), After (repair)',
          'The PACE framework — Playfulness, Acceptance, Curiosity, Empathy — guides caregiver attitude during storms',
          'Environmental adjustments (lower sensory input, reduce social pressure) precede verbal intervention',
          'The repair conversation after dysregulation is as powerful as the co-regulation during it',
          'A trigger log over two weeks reveals patterns that allow upstream prevention',
        ],
        tryThisWeek: [
          'Start a simple trigger log: for the next week, note what was happening in the hour before any significant dysregulation. Look for patterns at the end of the week.',
          'After the next difficult moment, practice the repair conversation: wait until fully calm, share your own experience briefly, ask about theirs.',
        ],
        relatedActivities: [
          { title: 'Name That Feeling', dimension: 'emotional-adaptive' },
          { title: 'The Safe Space Visualisation', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'Dan Hughes\' PACE model is supported by research on the therapeutic stance in dyadic developmental psychotherapy (Hughes, 2009). Research on relationship repair (Rupture and Repair) by Tronick (1989) demonstrates that repair is more important for secure attachment than the absence of rupture. Studies on the HALT framework link hunger and fatigue specifically to reduced regulatory capacity in children (Dahl, 1996).',
      },
    ],
  },

  'developmental-milestones': {
    id: 'developmental-milestones',
    title: 'Developmental Milestones',
    description: 'Understand what healthy resilience development looks like at each stage — and when to seek additional support.',
    icon: '/icons/growth.svg',
    color: '#0284c7',
    modules: [
      {
        id: 'resilience-milestones-by-age',
        title: 'Resilience Milestones by Age (5–18)',
        duration: '12 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'Resilience is not a fixed trait that children either have or don\'t have — it is a set of capacities that develop in a predictable sequence, each building on the last. Understanding what is developmentally typical at each age helps caregivers calibrate their expectations, celebrate appropriate milestones, and recognise when support is warranted.',
          'The milestones below are developmental benchmarks, not prescriptions. Individual variation is enormous, and many factors — temperament, experience, neurology, and culture — influence pace and profile. Use this as a compass, not a checklist.',
          'IATLAS organises resilience across six dimensions: Agentic-Generative, Somatic-Regulative, Cognitive-Narrative, Relational-Connective, Emotional-Adaptive, and Spiritual-Existential. Each dimension shows a characteristic developmental arc across childhood and adolescence.',
        ],
        content: `**Ages 5-7: The Foundation Window**

This is a critical period for laying the neurological foundations of resilience. Children at this stage are building the basic circuits of emotional regulation, social cognition, and self-concept.

Expected milestones:
- Can identify at least 3-5 basic emotions in themselves and others
- Can wait briefly for a want (not a need) with reminders
- Recovers from minor disappointments within 15-30 minutes with caregiver support
- Can describe what they are good at (emerging self-efficacy)
- Shows interest in friendships and can play cooperatively for short periods
- Begins to understand simple cause-and-effect in social situations
- With support, can identify one strategy for feeling better when upset

Support activities in IATLAS: Feelings Wheel, Box Breathing, The Gratitude Jar, Simple Goal-Setting.

**Ages 8-10: Building Complexity**

The middle childhood years bring rapid development of metacognition (thinking about thinking), emotional vocabulary, and the capacity for reciprocal friendships. Children begin to apply regulatory strategies independently.

Expected milestones:
- Expanding emotional vocabulary (can distinguish frustrated from disappointed, nervous from scared)
- Can use at least two self-regulation strategies without adult prompting (breathing, walking away, drawing)
- Recovers from setbacks with less caregiver scaffolding (10-15 minutes independently)
- Developing capacity for perspective-taking (understanding others' viewpoints)
- Can articulate personal strengths and areas of growth
- Sustaining friendships over time with some conflict navigation
- Beginning to identify patterns in their own emotional responses ("I usually get cranky when I\'m hungry")

Support activities in IATLAS: Growth Mindset Journal, Emotion Regulation Menu, Perspective-Taking Stories.

**Ages 11-14: The Adolescent Reorganisation**

Early adolescence involves a significant neurological reorganisation. The limbic system (emotional) develops ahead of the prefrontal cortex (regulation), creating a temporary gap between emotional intensity and regulatory capacity. This is normal and expected.

Expected milestones (with significant individual variation):
- Can identify complex emotions and ambivalence (feeling two things at once)
- Developing personal values and moral reasoning
- Increased independence in self-regulation, with some regression under stress
- Primary peer relationships becoming more important than family relationships
- Questioning of family values and parental authority (healthy identity development)
- Capacity for abstract thinking about the future, identity, and meaning
- Beginning to develop coping strategies matched to different stressor types

Support: normalise the emotional intensity of this period; maintain connection while respecting emerging autonomy.

**Ages 15-18: Identity Consolidation**

Late adolescence moves toward identity consolidation, values clarification, and preparation for adult autonomy. Resilience capacities should be becoming more internally located.

Expected milestones:
- Can reflect on emotional experiences after the fact with insight
- Has developed a repertoire of situation-specific coping strategies
- Can identify and pursue personally meaningful goals
- Maintains relationships through conflict and repair
- Has a sense of personal values that inform decision-making under pressure
- Can access support from both peers and trusted adults
- Beginning to develop a coherent narrative about personal identity and resilience

Support: coaching more than directing; interest-based conversations; visibility of your own coping and values.`,
        keyTakeaways: [
          'Ages 5-7: Basic emotional identification, brief waiting, and recovery with caregiver support are key milestones',
          'Ages 8-10: Independent regulatory strategies, expanding emotional vocabulary, and reciprocal friendships emerge',
          'Ages 11-14: Expect emotional intensity and regression — this is neurological, not character',
          'Ages 15-18: Identity consolidation and internally located coping; your role is coaching, not directing',
          'Individual variation is enormous — use milestones as a compass, not a checklist or benchmark for worry',
        ],
        tryThisWeek: [
          'Read through the milestones for your child\'s current age group. Write down two or three that you notice your child demonstrating. Then write one area where you\'d like to provide more support.',
          'Share one appropriate resilience milestone with your child using language they can understand: "I\'ve noticed that you\'re getting really good at [specific skill]. That\'s a really important strength."',
        ],
        relatedActivities: [
          { title: 'My Strengths Explorer', dimension: 'agentic-generative' },
          { title: 'Values Compass', dimension: 'spiritual-existential' },
        ],
        evidenceBase: 'Developmental milestones are drawn from Cicchetti\'s (2010) review of resilience research across development, the CDC developmental monitoring guidelines, and Masten & Cicchetti\'s (2010) framework of resilience as a developmental construct. IATLAS dimensions are aligned with the six-factor resilience model validated in cross-cultural research (Connor & Davidson, 2003).',
      },

      {
        id: 'when-to-seek-support',
        title: 'When to Seek Additional Support',
        duration: '9 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'One of the most important — and most anxiety-provoking — decisions a parent faces is knowing when a child\'s difficulties are within the normal range of development and when they call for professional support. Getting this calibration right matters enormously: both over-pathologising typical development and under-responding to genuine need carry real costs.',
          'The key principle across all ages is functional impairment: the question is not how intense the emotion or behaviour is, but whether it is significantly disrupting the child\'s ability to learn, form relationships, sleep, eat, and function in their daily life. Intensity alone is insufficient for concern; persistence, pervasiveness, and functional impact are the meaningful signals.',
          'This guide is not a diagnostic tool — it is an orientation guide to help you decide when a conversation with a professional is warranted. When in doubt, consult your paediatrician. Early consultation is almost always better than late.',
        ],
        content: `**The Functional Impairment Principle**

Ask three questions about any concerning pattern:

1. How long has this been happening? (Duration) — A few days or a week around a stressor is different from six weeks. Two weeks is a rough threshold for most clinical guidelines.

2. Where is it happening? (Pervasiveness) — Occurring only at home, only at school, or across all settings? Pervasive problems are more concerning than context-specific ones.

3. What can\'t they do because of it? (Impairment) — Is the child missing school? Unable to maintain friendships? Not sleeping? Not eating? If functioning is significantly impaired, professional consultation is warranted regardless of duration.

**Signs That Warrant Professional Consultation**

The following warrant a conversation with your paediatrician or a child mental health professional:

Mood and affect:
- Persistent sadness or low mood lasting more than 2 weeks
- Persistent irritability or anger that is a change from baseline
- Loss of interest in activities that previously brought pleasure
- Hopelessness or negative self-talk ("I\'m stupid," "Nobody likes me," "Things will never get better")

Anxiety:
- Avoidance of previously enjoyed activities due to fear or worry
- Frequent school avoidance or significant distress before school
- Physical symptoms (stomach aches, headaches) without medical explanation, particularly before anticipated events
- Panic attacks
- Rituals or repetitive behaviours that are distressing or time-consuming

Trauma responses:
- Nightmares, flashbacks, or intrusive thoughts following a stressful event
- Hypervigilance (always seeming "on guard")
- Emotional numbing or disconnection
- Significant regression following a stressful event

Serious concerns (act quickly, don\'t wait):
- Any expression of wishes to die or not be alive (take this seriously every time, at any age)
- Self-harm of any kind
- Harming others or animals
- Complete withdrawal from all social contact over multiple weeks

**Talking to Your Paediatrician**

Your paediatrician is the right first point of contact for most concerns. At the appointment:
- Write down your specific observations before going (with dates, frequencies, what triggered what)
- Describe functional impairment specifically: "She\'s missed 8 school days this month due to stomach aches"
- Ask directly: "Do you think this needs further assessment?"
- Request a referral if you feel one is warranted, even if the doctor is initially watchful

**What Professional Support Looks Like**

Assessment: A thorough psychological or psychiatric assessment typically takes 2-4 appointments and results in a formulation and recommendations. An assessment is not a commitment to treatment.

Therapy for children: Effective evidence-based therapies include Cognitive Behavioural Therapy (CBT), play therapy for younger children, Trauma-Focused CBT, and family therapy. Most childhood difficulties that respond to therapy show meaningful improvement within 12-16 sessions.

Medication: For some conditions (ADHD, anxiety disorders, depression), medication in combination with therapy can be highly effective. This is always a shared decision between family and clinician.`,
        keyTakeaways: [
          'Functional impairment — disruption to learning, relationships, sleep, and eating — is more important than emotional intensity alone',
          'Two weeks of persistence plus pervasive impact across settings is a meaningful clinical threshold',
          'Any expression of wishes to die or self-harm warrants immediate professional consultation',
          'Your paediatrician is the right first call; describe specific functional impairments, not just emotions',
          'Getting a professional assessment early is almost always better than waiting — it\'s information, not a life sentence',
        ],
        tryThisWeek: [
          'If you have a current concern about your child, write down: what you\'re observing, how long it\'s been happening, and what they can\'t do because of it. This is the information your paediatrician needs.',
          'Identify one trusted adult in your child\'s life (teacher, school counsellor, coach) and check in with them about what they\'re observing. Outside perspectives are valuable.',
        ],
        relatedActivities: [
          { title: 'The Safe Feelings Journal', dimension: 'emotional-adaptive' },
          { title: 'Building Your Support Network', dimension: 'relational-connective' },
        ],
        evidenceBase: 'The DSM-5 criteria for childhood mental health disorders all require functional impairment as a diagnostic criterion (APA, 2013). CDC data shows that 1 in 5 children experience a mental health disorder, of whom fewer than half receive treatment. Research consistently shows early intervention produces significantly better outcomes than delayed intervention across anxiety, depression, and trauma presentations (Kazdin, 2017).',
      },
    ],
  },

  'neurodivergent-families': {
    id: 'neurodivergent-families',
    title: 'Neurodivergent Families',
    description: 'Adapt IATLAS resilience activities for children with autism, ADHD, or sensory processing differences.',
    icon: '/icons/reframe.svg',
    color: '#d97706',
    modules: [
      {
        id: 'iatlas-autistic-children',
        title: 'IATLAS for Autistic Children',
        duration: '11 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        intro: [
          'Autistic children have the same fundamental resilience needs as all children — safety, connection, agency, and meaning — but may experience and express these needs through different channels. IATLAS activities can be powerful for autistic children when adapted thoughtfully, and this guide provides a framework for those adaptations.',
          'A strength-based framing is essential. Autistic children often have distinctive strengths — intense focus, pattern recognition, deep knowledge in areas of interest, commitment to fairness and honesty — that are genuine resilience assets when they are recognised and built upon. The goal is not to make autistic children "more neurotypical," but to help them build resilience authentically.',
          'Many of the strategies in this guide were developed in dialogue with autistic self-advocates and researchers who emphasise that social camouflaging and masking — hiding autistic traits to fit in — is itself a major source of stress and contributes to mental health difficulties. Supporting authentic selfhood is itself a resilience intervention.',
        ],
        content: `**Sensory Adaptations for IATLAS Activities**

Many IATLAS activities involve sensory elements that may be challenging for autistic children with sensory processing differences. General principles:

Visual over verbal: Replace verbal instructions with visual schedules, social stories, and written prompts wherever possible. Many autistic children process visual information more efficiently than rapid verbal delivery.

Choice of sensory input: Offer the child input into the sensory environment for activities (noise level, lighting, physical materials). Many autistic children have clear preferences and can articulate them.

Flexible physical format: Some IATLAS breathing and somatic activities work better without eye closure (replace with a visual focus point), without group settings, or in alternative positions (standing, moving, lying down instead of seated).

Sensory regulation breaks: Build explicit "sensory reset" breaks into longer activities. This is not avoidance — it is regulatory maintenance.

**Social Activities: Reducing the Social Cognitive Load**

IATLAS relational activities may require adaptation for autistic children who find social processing cognitively demanding:

Smaller groups or pairs: One-on-one or pair activities reduce the cognitive load of multi-person social navigation.

Explicit social scripts: Many autistic children appreciate explicit guidance on what to say and do in social situations. Providing this is not condescending — it is acknowledging the genuine extra effort social processing requires.

Special interest bridges: Embedding relational activities within special interest contexts (a conversation using Minecraft as the entry point, a gratitude exercise about a favourite character) dramatically increases engagement and emotional safety.

Written communication options: For children who find spoken communication challenging, written, drawn, or typed responses to reflection activities are equally valid.

**Emotional Activities: Expand Beyond Facial Expressions**

Many emotion recognition resources rely heavily on facial expression recognition — an area that is often genuinely challenging for autistic children, not because they lack empathy, but because they process facial information differently.

Alternatives to facial expression recognition:
- Situational emotion recognition ("what would you feel if...")
- Body-based emotion cues (how does your body feel when you\'re anxious?)
- Character-based exploration using beloved fictional characters
- Emotion cards with verbal descriptions rather than just images

Supporting interoception: Many autistic children have reduced interoceptive awareness (difficulty sensing internal body states). Explicit exercises to build interoception — "Where in your body do you feel that?" with a body outline — directly support emotional regulation.

**Strengths-Based Framing**

IATLAS\'s six resilience dimensions each have characteristic expressions in autistic children:

Agentic-Generative: Deep focus and persistence in areas of interest; strong capacity for self-directed learning.

Cognitive-Narrative: Often exceptional pattern recognition and analytical skills; capacity for detailed memory of meaningful events.

Relational-Connective: Intense loyalty and depth in chosen relationships; often highly principled about fairness.

For activities that highlight strengths, provide explicit opportunities for autistic children to demonstrate and be celebrated for their distinctive ways of thinking and engaging with the world.`,
        keyTakeaways: [
          'Autistic children have the same resilience needs as all children — but different channels for meeting them',
          'Visual schedules, smaller groups, and special interest bridges dramatically increase engagement',
          'Emotion recognition activities should go beyond facial expressions to body sensations and situational cues',
          'Building interoceptive awareness — sensing internal body states — is a key emotional regulation support',
          'Social masking and camouflaging carry significant wellbeing costs; supporting authentic selfhood is itself resilience work',
        ],
        tryThisWeek: [
          'Review the IATLAS activities your child currently uses and identify one that could be enhanced with a visual support (written prompt card, step-by-step visual guide). Create it together with your child.',
          'Ask your child directly: "Is there anything about [activity] that feels uncomfortable or hard?" Listen without problem-solving immediately — this conversation itself is valuable information.',
        ],
        relatedActivities: [
          { title: 'My Strengths Map', dimension: 'agentic-generative' },
          { title: 'Body Feelings Chart', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'The neurodiversity paradigm (Armstrong, 2010; Singer, 1999) supports a strengths-based approach to autism support. Research on social camouflaging in autism (Cage & Troxell-Whitman, 2019) documents its relationship to anxiety, depression, and autistic burnout. Interoception research (Mahler, 2016) shows strong relationships between interoceptive awareness and emotional regulation in autistic individuals.',
      },

      {
        id: 'iatlas-adhd-children',
        title: 'IATLAS for Children with ADHD',
        duration: '10 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        intro: [
          'Children with ADHD experience the world with more intensity, more reactivity, and more challenge with the self-regulation tasks that IATLAS activities are designed to build. This can make the activities simultaneously more important and more challenging to access. This guide helps you bridge that gap.',
          'ADHD involves differences in the dopaminergic and noradrenergic systems that regulate attention, impulse control, and working memory. These are not motivational deficits — they are neurological differences that respond best to environmental support, not willpower demands. Understanding this changes how you approach IATLAS activities with your child.',
          'A crucial reframe: many children with ADHD have hyperfocus capacity — the ability to sustain extraordinary concentration on activities that are novel, interesting, and personally meaningful. IATLAS activities that are personalised and use variety, novelty, and immediate feedback will engage this capacity powerfully.',
        ],
        content: `**Adapting Activity Format for ADHD**

Short, frequent over long, sustained: Chunk IATLAS activities into shorter segments with movement breaks. A 20-minute activity works better as two 10-minute segments with 5 minutes of physical movement in between.

Movement integration: For children with ADHD, physical movement is not a distraction from regulation — it IS regulation. Somatic IATLAS activities (breathing, body awareness) often work better standing up, bouncing on a ball, or walking slowly than sitting still.

Immediate feedback loops: IATLAS activities that provide immediate, visible feedback (a progress bar, a sticker, a visible streak count) work significantly better for children with ADHD than activities where progress is abstract.

Novelty rotation: Introduce variety in how activities are done — same content, different format. Doing the same breathing exercise differently each week (animated, with music, as a competition) maintains engagement.

**Working with Executive Function Challenges**

ADHD involves genuine executive function differences. Many IATLAS activities require sustained attention, working memory, or planning. Supports:

External memory scaffolds: Written prompts, visual schedules, and physical reminders (a card on the desk, an object as a cue) replace working memory demands.

Start simple, add complexity: Begin with the simplest version of a IATLAS skill and add layers over weeks, not in the first session. Feeling successful early is critical for maintained engagement.

Time externalisation: Children with ADHD often have difficulty sensing time. Visual timers (Time Timers) that show time as a shrinking coloured area work significantly better than numerical clocks.

Parent co-regulation as scaffold: Many children with ADHD need an external co-regulation partner for much longer than neurotypical peers. This is not babying — it is appropriate developmental support.

**Emotional Regulation: Specific Challenges in ADHD**

Many children with ADHD experience Emotional Dysregulation as a core feature — intense, fast-rising emotions that are difficult to modulate. Research by Barkley (2010) identifies emotional dysregulation as one of the most impactful features of ADHD across the lifespan.

Strategies for emotional regulation in ADHD:

Speed acknowledgement: "Your emotions move really fast — that\'s part of how your brain works." Normalising this reduces shame.

Cool-off rituals: Physical movement (jumping jacks, running outside, a squeezable fidget) as a transition between activation and reflection. Don\'t expect verbal processing immediately after a big emotion.

The "emotions at 6" strategy: For children who escalate quickly, teach a "pause at 6" rule — when you notice you\'re at about 6 out of 10 on the intensity scale, that\'s when to use your regulation strategy. At 9 or 10, it\'s too late for cognitive strategies.

Celebrate regulation success: Children with ADHD often receive disproportionate negative feedback. Explicitly noticing and celebrating regulatory successes — "I noticed you used your breathing when you got frustrated, and it worked!" — builds neural pathways for self-regulation.

**ADHD Strengths in IATLAS**

Children with ADHD often bring notable strengths to IATLAS activities:
- High energy and enthusiasm for novelty
- Creative and divergent thinking
- Empathy and emotional sensitivity (often high in ADHD)
- Courage and risk-tolerance
- Persistence in high-interest domains

Design IATLAS activities that play to these strengths rather than continuously requiring compensation for challenges.`,
        keyTakeaways: [
          'ADHD involves neurological differences in dopamine regulation — environmental support outperforms willpower demands',
          'Short sessions with movement breaks, immediate feedback, and novelty maintain ADHD engagement',
          'Emotional dysregulation in ADHD requires a physical-first approach: movement before verbal processing',
          'The "pause at 6" strategy teaches self-monitoring before emotions become unmanageable',
          'ADHD strengths — creativity, empathy, risk-tolerance, hyperfocus — are genuine IATLAS assets',
        ],
        tryThisWeek: [
          'Identify one IATLAS activity that your child currently finds difficult to sustain. Break it into two shorter segments with a movement break in between. Try this adaptation for one week.',
          'Catch your child using a regulation strategy successfully — however small — and name it specifically: "I noticed that you used [strategy] when [situation] — that was really effective."',
        ],
        relatedActivities: [
          { title: 'The Energy Regulator', dimension: 'somatic-regulative' },
          { title: 'My ADHD Superpower Map', dimension: 'agentic-generative' },
        ],
        evidenceBase: 'Barkley (2010) documents emotional dysregulation as a core ADHD feature in 70-80% of cases. Research by Solanto et al. on ADHD executive function deficits supports external scaffolding over willpower-based interventions. Hallowell & Ratey (2021) provide an updated synthesis on ADHD strengths-based approaches. Movement\'s role in ADHD regulation is supported by studies showing exercise improves attention and working memory in ADHD (Pontifex et al., 2013).',
      },

      {
        id: 'sensory-adaptations',
        title: 'Adapting Activities for Sensory Sensitivities',
        duration: '9 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        intro: [
          'Sensory processing differences — whether as part of autism, ADHD, SPD (Sensory Processing Disorder), or as a standalone variation — affect how children receive, process, and respond to sensory information from their environment. For these children, many everyday environments and activities are significantly more demanding than they appear.',
          'Sensory sensitivities are not preferences or bad behaviour. They are genuine neurological differences in how the nervous system processes input. Understanding this changes the question from "Why won\'t they just participate?" to "What is the sensory environment of this activity communicating to their nervous system, and how can we modify it?"',
          'This guide covers adaptations across three domains: sensory-seeking behaviour (insufficient sensory input), sensory-avoiding behaviour (excessive sensory input), and sensory discrimination differences (difficulty accurately interpreting sensory information).',
        ],
        content: `**Understanding the Sensory Landscape**

The classic five senses are only part of the picture. The body\'s sensory systems include:

Proprioception (body awareness): Receptors in muscles and joints tell the brain where the body is in space. Many children with sensory differences seek deep pressure and heavy work to regulate through this system.

Vestibular (balance and movement): The inner ear provides information about head position and movement. Some children seek spinning, swinging, and rocking; others are highly sensitive to movement.

Interoception (internal body sensing): The sense of internal body states — hunger, thirst, heartbeat, bladder. Poor interoceptive awareness makes emotional regulation harder and may mean a child doesn\'t notice early signs of dysregulation.

Tactile, auditory, visual, olfactory, gustatory: Each has both hypersensitive and hyposensitive variants.

**Adapting IATLAS Activities by Sensory Profile**

For sensory-seeking children (seeking more input):

- Build movement into activities (fidget tools, standing desks, movement between segments)
- Provide deep pressure inputs before and during reflective activities (firm back rub, proprioceptive "heavy work" like carrying books)
- Use textured materials (writing on textured paper, drawing in sand)
- Allow background music during reflection

For sensory-avoiding children (overwhelmed by input):

- Dim or adjust lighting (some children work much better in softer light)
- Offer noise-reduction tools (headphones, earplugs) during group activities
- Choose smooth, soft textures for any tactile materials
- Preview activities in advance: "Here\'s exactly what we\'re going to do" reduces the uncertainty that amplifies sensory sensitivity
- Allow physical distance from other participants

For children with discrimination differences (difficulty interpreting input):

- Pair verbal instructions with visual and kinaesthetic demonstrations
- Allow extra processing time before expecting a response
- Minimise competing sensory inputs during instruction time

**The Sensory Diet**

An occupational therapist concept: a "sensory diet" is a personalised schedule of sensory activities distributed throughout the day to maintain optimal arousal. Key activities include:

Heavy work (proprioceptive input): Carrying groceries, wearing a weighted vest, wall push-ups, resistance exercises

Calming inputs: Slow rocking, deep pressure, slow rhythmic breathing, quiet environments

Alerting inputs (for hypo-sensitive children who need more input): Crunchy or sour foods, bright colours, fast movement, upbeat music

Working with an occupational therapist to design a personalised sensory diet is highly recommended for children with significant sensory differences — it is one of the most effective interventions available.

**Practical IATLAS Adaptations**

Breathing activities: Allow open eyes with a visual focus point; try lying down; add a weighted blanket or firm pillow on the chest.

Body scan activities: Use a physical body outline drawing to point to rather than requiring internal sensation only; allow movement.

Group activities: Offer an individual parallel option for children who cannot sustain group sensory environments; allow distance seating.

Journaling/reflective activities: Allow drawing, voice recording, or movement as alternative expression modes.`,
        keyTakeaways: [
          'Sensory sensitivities are neurological differences, not preferences — the environment needs modification, not the child',
          'Beyond the five senses: proprioception, vestibular, and interoception are key regulatory systems',
          'Adaptations for sensory-seeking and sensory-avoiding children are different and sometimes opposite',
          'A personalised sensory diet (with OT support) is one of the most effective tools for children with significant sensory differences',
          'Simple IATLAS adaptations: open eyes during breathing, individual options alongside group activities, movement integration',
        ],
        tryThisWeek: [
          'Observe your child closely during one IATLAS activity and note: do they seem to seek more sensory input (moving, touching, needing stimulation) or avoid sensory input (withdrawing, covering ears, becoming rigid)? Use this to guide one specific adaptation next session.',
          'Add a "proprioceptive warm-up" before a reflective IATLAS activity: five wall push-ups, carrying a bag of books, or a brief body-awareness exercise. Note whether engagement and regulation improve.',
        ],
        relatedActivities: [
          { title: 'Sensory Grounding Exercise', dimension: 'somatic-regulative' },
          { title: 'My Calm Toolkit', dimension: 'emotional-adaptive' },
        ],
        evidenceBase: 'Sensory processing research by Ayres (1972, foundational occupational therapy) and updated by Miller et al. (2007) provides the framework for sensory integration intervention. Research on the sensory diet by Wilbarger & Wilbarger (1991) is widely used in occupational therapy practice. Interoception research by Craig (2002) and Mahler (2016) demonstrates relationships between interoceptive awareness and emotional regulation across neurodivergent populations.',
      },
    ],
  },

  'trauma-informed-parenting': {
    id: 'trauma-informed-parenting',
    title: 'Trauma-Informed Parenting',
    description: 'Use IATLAS in a trauma-informed way, understanding how past experiences shape present behaviour and building safety through resilience activities.',
    icon: '/icons/shield.svg',
    color: '#db2777',
    modules: [
      {
        id: 'trauma-informed-caregiving',
        title: 'Using IATLAS in Trauma-Informed Caregiving',
        duration: '11 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'Trauma-informed caregiving begins with a fundamental reframe: from "What is wrong with this child?" to "What happened to this child, and what do they need?" This shift changes everything about how you interpret behaviour, design activities, and respond to difficulties.',
          'Trauma — which can include abuse, neglect, loss, community violence, medical procedures, parental mental illness, and many other experiences — affects the developing brain in specific, documented ways. Children who have experienced trauma are not broken; they are showing adaptive responses to genuinely threatening experiences. The goal of trauma-informed IATLAS use is to build safety and expand their window of tolerance, not to push past it.',
          'You do not need to know the details of a child\'s traumatic experience to provide trauma-informed support. The principles below apply across all forms of childhood adversity.',
        ],
        content: `**How Trauma Affects the Developing Brain**

Bessel van der Kolk\'s foundational research (2014) identifies three brain areas particularly affected by childhood trauma:

The amygdala (threat detector): Becomes hypersensitive, firing threat responses to stimuli that would not trigger non-traumatised peers. This explains why trauma-affected children may appear "overreacting" to small events.

The prefrontal cortex (regulation): Growth is impaired by chronic stress, reducing the capacity for impulse control, emotional regulation, and executive function.

The hippocampus (memory integration): Disrupted by trauma hormones, leading to fragmented, non-integrated traumatic memories that are easily triggered.

Practical implication: A trauma-affected child in a threat response is operating primarily from their amygdala. This is not a moment for teaching, consequence-giving, or problem-solving. It is a moment for safety signalling.

**The Five IATLAS Safety Signals**

Before any IATLAS activity with a trauma-affected child, establish safety across five domains:

1. Physical safety: The child can see the exits, is comfortable, is not touched without consent, knows what will happen next.

2. Relational safety: The caregiver is predictable — same tone, same face, same rules. Surprise (even pleasant surprise) activates threat systems in traumatised children.

3. Emotional safety: No expectations of emotional disclosure. Activities should offer — never require — emotional expression. "You can share if you want to" not "Tell me how you feel."

4. Choice and control: Every moment, give the child a genuine choice. "Would you like to do this sitting down or standing up?" Micro-choices restore the sense of agency that trauma erodes.

5. Pacing: Follow the child\'s pace, not the activity\'s pace. If they slow down, pull back, or disengage — follow that signal. Re-engagement can happen next time.

**Trauma-Informed IATLAS Activity Adaptations**

Body-based activities (somatic dimension):
- Trauma is often stored in the body; body-based activities can inadvertently trigger trauma responses
- Always offer grounding alternatives (feeling feet on the floor, holding a cool object) before and instead of deep body-scan work
- Never close eyes without offering the option to keep them open with a neutral gaze forward

Reflection activities (cognitive dimension):
- Trauma memories are non-linear and may intrude involuntarily during reflective activities
- Use the past tense with care; "what happens when you feel scared" may be safer than "when did you feel scared?"
- Offer fictional/character-based reflection before personal reflection

Social activities (relational dimension):
- Trust develops slowly with trauma-affected children; don\'t rush relational disclosure activities
- Side-by-side activities (doing something together without facing each other) are often less activating than face-to-face formats

**The Window of Tolerance**

Dan Siegel\'s concept of the "window of tolerance" describes the zone of arousal in which a person can engage effectively with experience — not too activated (hyperarousal), not too shut down (hypoarousal). Trauma narrows this window.

IATLAS activities are most effective when a child is within their window of tolerance. Your job as a caregiver is to help expand the window gradually over time — not to push past its current boundaries. Signs of approaching the edge of the window: glazed eyes, reduced responsiveness, hyperactivity, fidgeting, increased withdrawal. When you see these, slow down or stop the activity.`,
        keyTakeaways: [
          'The trauma-informed reframe: "What happened to this child?" — not "What is wrong with this child?"',
          'Trauma affects the amygdala, prefrontal cortex, and hippocampus in specific ways that explain many difficult behaviours',
          'Five safety signals before IATLAS activities: physical, relational, emotional, choice/control, and pacing',
          'The window of tolerance defines the zone where learning and regulation happen; never push past its current boundary',
          'Every activity should offer — never require — emotional disclosure or body-based exploration',
        ],
        tryThisWeek: [
          'Before your next IATLAS session with your child, take two minutes to offer the five safety signals: check the physical environment, use a predictable opening ritual, explicitly offer choice about how to participate.',
          'Practise noticing window-of-tolerance signals: glazed eyes, increased fidgeting, withdrawal, hyperactivity. When you see them, say "Let\'s take a break" without explanation — model that stopping is okay.',
        ],
        relatedActivities: [
          { title: 'The Safety Circle', dimension: 'relational-connective' },
          { title: 'Grounding Toolkit', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'van der Kolk (2014) provides the neurobiological framework for trauma\'s impact on the developing brain. Siegel\'s (1999) window of tolerance concept is widely used in trauma-informed therapeutic practice. Perry & Winfrey (2021) integrate polyvagal theory, developmental neuroscience, and attachment research in a practical trauma-informed framework. The ACE (Adverse Childhood Experiences) study (Felitti et al., 1998) established the long-term health impact of childhood adversity.',
      },

      {
        id: 'safety-trust-activities',
        title: 'Building Safety and Trust Through Resilience Activities',
        duration: '8 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        intro: [
          'Safety is not a feeling — it is a neurobiological state. A child cannot learn, connect, or grow when their nervous system is in threat mode. Before resilience can be built, safety must be established. This guide provides specific activities and approaches for building safety and trust as the foundation for all IATLAS work with children who have experienced adversity.',
          'Trust develops through repetition of small reliable moments, not through intensity or disclosure. The caregiver who shows up consistently, at the same level of warmth, whether the child is easy or difficult, builds more trust than the caregiver who has one profound emotional conversation.',
          'These activities are designed to be low-pressure, non-disclosing, and incrementally connecting. They can be used as standalone sessions or as warm-up activities before any IATLAS curriculum module.',
        ],
        content: `**The Safety-First Sequence**

Before any IATLAS activity, build safety through a brief, consistent ritual. The ritual communicates: "This is a predictable, safe space. The same things happen here every time."

A simple opening ritual:
1. A brief physical settling (two slow breaths together, or "notice your feet on the floor")
2. A brief check-in (1-10 scale: "How are you feeling right now? No explaining needed, just a number")
3. A verbal offer: "Today\'s activity is [X]. You can choose to participate, watch, or do it your own way"

The consistency of this opening builds a felt sense of safety over weeks. Many children who initially resist participation gradually engage as the ritual becomes familiar.

**Trust-Building Activities**

The following low-pressure activities build trust without requiring emotional disclosure:

Parallel play activities: Work on separate creative projects in the same space. Drawing, building, or making at the same table without discussion creates felt co-presence without social pressure.

Preference mapping: "Tell me ten things you love about life right now — they can be anything, silly or serious." This gathers personal information that helps you personalise future activities, while the content stays in the positive and non-vulnerable domain.

Competence showcases: Invite the child to teach you something they know how to do — a game, a skill, a piece of knowledge. Being the expert in a safe relationship is a powerful trust-builder.

Consistent small rituals: A special handshake, a shared opening phrase, a specific snack. Consistent micro-rituals build the neural prediction pathways that underlie felt safety.

**Safe-Base Exploration Activities**

Safe-base exploration — the ability to venture into unfamiliar territory knowing you can return to safety — is the prototype of resilience. These activities build that pattern:

The "Home Base" activity: Draw or designate a physical spot that is always "safe" in the activity. When anything feels hard, the child can return to Home Base without question or comment. Over time, children venture further and return less frequently.

The "Safe People Map": Draw your child in the centre and, together, add the people they feel safe with. Discuss what makes someone feel safe. This externalises the internal experience of safety into something discussable.

Gradual disclosure ladders: Start with the easiest, most surface-level version of an activity and offer incremental depth. "You can share as much or as little as you want to. We\'ll start with the easiest part." Each voluntary step forward is a small act of courage worth acknowledging.

**After Each Session: The Closing Ritual**

A closing ritual is as important as the opening. It communicates: this ends predictably; you are safe; we will be here next time.

A simple closing:
- Brief reflection: "What was one part of today that was okay?"
- Explicit permission: "You don\'t have to remember any of this; it\'s just for now"
- Reconnection: A specific phrase or physical ritual that marks "we\'re done, and we\'re still connected"
- What\'s next: "Next time we\'ll [X]" — predictability ahead

**When Safety Ruptures**

Despite best efforts, safety will sometimes rupture — an activity goes unexpectedly deeper than anticipated, a careless word triggers a trauma response, the child shuts down. The repair is straightforward:

Acknowledge: "I think that went somewhere harder than either of us expected."

Take responsibility for the rupture where appropriate: "I should have checked in more before that exercise."

Restore the ritual: Return to the opening ritual or the Home Base activity to restore the predictable safety.

Plan together: "Would you want to try that a different way next time, or should we skip that one?"`,
        keyTakeaways: [
          'Safety is a neurobiological state, not a feeling — it must be established before resilience work can happen',
          'Trust builds through thousands of small, consistent, reliable moments — not through intensity or disclosure',
          'A brief consistent opening ritual (settle, check-in, choice) builds felt safety over weeks',
          'Safe-base activities — parallel play, preference mapping, competence showcases — build trust without requiring vulnerability',
          'Safety ruptures are repairable; the repair itself is trust-building when done with care',
        ],
        tryThisWeek: [
          'Introduce a consistent three-step opening ritual for IATLAS sessions this week: two breaths together, a 1-10 check-in, and explicit choice about how to participate.',
          'Try the "preference mapping" activity: ask your child to share ten things they currently love — silly or serious — and write them all down without comment or judgment.',
        ],
        relatedActivities: [
          { title: 'My Safe People Circle', dimension: 'relational-connective' },
          { title: 'The Calm Anchor', dimension: 'somatic-regulative' },
        ],
        evidenceBase: 'Bowlby\'s (1969) attachment theory provides the theoretical foundation for safe-base exploration. Research by Teicher & Samson (2016) documents how traumatic stress damages the corticolimbic circuits involved in threat detection and regulation. Clinical research on the Structured Psychotherapy for Adolescents Responding to Chronic Stress (SPARCS) model shows that safety-first sequencing dramatically improves engagement and outcomes in trauma-affected youth.',
      },
    ],
  },

  'supporting-progress': {
    id: 'supporting-progress',
    title: "Supporting Your Child's Progress",
    description: 'Make the most of IATLAS tools — use the family dashboard effectively and celebrate growth in ways that build lasting motivation.',
    icon: '/icons/star.svg',
    color: '#7c3aed',
    modules: [
      {
        id: 'family-dashboard-guide',
        title: 'How to Use the Family Dashboard Effectively',
        duration: '7 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'The IATLAS Family Dashboard gives you a window into your child\'s resilience journey — not their scores or rankings, but their activity, their emerging strengths, their badges, and their progress across the six dimensions of resilience. This guide helps you use that window in a way that supports growth without creating pressure.',
          'One important framing note: the Family Dashboard is an insight tool, not a performance tool. It shows what your child is doing and discovering, not how "good" they are at resilience. The numbers are invitations to conversation, not verdicts to pronounce.',
          'Used well, the dashboard creates a shared vocabulary for family conversations about growth. Used poorly, it can become another source of comparison and pressure. This guide focuses on the former.',
        ],
        content: `**What the Dashboard Shows (and What It Doesn\'t)**

The Family Dashboard shows:
- Activity completion patterns (which dimensions your child is engaging with most)
- Badges earned (recognition of specific skills and milestones)
- Streak data (consistency of engagement)
- Suggested next activities (personalised to the child\'s current engagement profile)

The dashboard intentionally does not show:
- Scores or performance ratings (resilience is not a test)
- Comparisons with other children
- Deficiency rankings (no "weakest dimension" framing)

**Weekly Dashboard Check-In: A 5-Minute Ritual**

The most effective use of the dashboard is a brief weekly check-in that you do with your child, not about your child. Sit together and:

1. Celebrate what happened: "I see you completed [activity] this week! What was that like?"

2. Notice the pattern: "It looks like you\'ve been spending a lot of time on [dimension] — what is it about those activities that you like?"

3. Open the conversation: "Is there any dimension where you\'d like to try something new?"

4. Let them lead: Ask if they want to pick their own next activity, or whether they\'d like a suggestion.

**Using Dimension Data for Conversations**

The six dimensions offer a shared language for talking about resilience without it feeling clinical or pressured:

When one dimension has fewer activities: This is not a problem to fix. It may be a natural preference, a stage of development, or simply where the child is right now. Ask with curiosity: "I notice you haven\'t tried many [dimension] activities yet — is there something about them that seems less interesting?"

When a child returns repeatedly to one dimension: This is information about what matters to them right now. Honour it, and occasionally gently introduce adjacent dimensions: "This [somatic] activity is similar to the ones you\'ve been doing — want to try it?"

**Involving Multiple Children**

For families with multiple children using IATLAS:

Keep dashboards private: Each child\'s dashboard is their own. Do not compare children\'s progress in front of them.

Family dimension conversations: You can have broader conversations about the six dimensions as a family concept without referencing individual children\'s specific data.

Shared family challenges: The Family Challenges section is designed for the whole family to do together — use this as the shared experience rather than comparing individual journeys.

**When the Dashboard Goes Quiet**

Periods of lower activity are normal and do not signal failure. A child who was highly engaged for weeks and then stops is likely in a natural cycle, or may be processing what they\'ve been learning. Resist the urge to push re-engagement with pressure.

Instead: "I noticed you haven\'t been using IATLAS much lately — how are you feeling about it?" Sometimes a break is needed; sometimes the activities need to be refreshed; sometimes a different format will re-engage.`,
        keyTakeaways: [
          'The dashboard is an insight tool, not a performance tool — it shows patterns, not verdicts',
          'The most effective use is a five-minute weekly check-in WITH your child, not about your child',
          'Each child\'s dashboard is private — resist comparison between siblings',
          'Uneven dimension engagement is normal and interesting, not a problem to fix',
          'Quiet periods are normal; respond with curiosity, not pressure',
        ],
        tryThisWeek: [
          'Schedule a five-minute "dashboard date" with your child this week. Let them show you what they\'ve been doing and celebrate one specific thing you notice together.',
          'Pick one dimension badge that your child has recently earned and ask them to tell you the story of how they earned it. Listen without adding or evaluating.',
        ],
        relatedActivities: [
          { title: 'My Progress Map', dimension: 'agentic-generative' },
          { title: 'The Strengths Showcase', dimension: 'relational-connective' },
        ],
        evidenceBase: 'Research on process vs. outcome feedback (Henderlong & Lepper, 2002) shows that process-focused feedback maintains intrinsic motivation where outcome-focused feedback undermines it. Self-determination theory (Deci & Ryan, 2000) identifies autonomy support as a key predictor of sustained engagement. Research on shared family rituals (Fiese et al., 2002) shows that brief, consistent rituals significantly predict child wellbeing.',
      },

      {
        id: 'celebrating-growth',
        title: 'Celebrating Growth Without Pressure',
        duration: '7 min read',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        intro: [
          'How we celebrate growth matters as much as whether we celebrate it. Praise and recognition that is specific, process-focused, and genuine builds intrinsic motivation and resilience. Praise that is vague, outcome-focused, or conditional can inadvertently create performance anxiety and undermine the very engagement it\'s trying to encourage.',
          'Carol Dweck\'s decades of research on praise and mindset has transformed how we understand this. The difference between "You\'re so smart" (person praise) and "You worked really hard on that" (process praise) is not merely semantic — it produces measurable differences in how children approach challenges, handle setbacks, and persist in the face of difficulty.',
          'This guide provides a practical framework for celebrating growth in ways that build lasting motivation — and for recognising the moments when well-intentioned celebration is working against you.',
        ],
        content: `**The Four Characteristics of Growth-Building Praise**

Effective praise for building resilience has four characteristics:

1. Specific: "I noticed you tried four different strategies before you figured that out" is far more powerful than "Great job!" Specificity communicates that you were genuinely paying attention and that you know what the skill actually was.

2. Process-focused: Praise the effort, strategy, and persistence — not the innate ability or the outcome. "You kept going even when it was hard" rather than "You\'re so good at this."

3. Proportionate: Excessive or effusive praise for minor achievements creates what Henderlong & Lepper call "praise inflation" — children learn to discount it and may actually become more performance-anxious.

4. Genuine: Children are exquisitely sensitive to inauthenticity. Praise for something they know was mediocre or effortless does not register as support — it registers as either not noticing or placating.

**The "I Noticed" Framework**

A simple framework for growth-building acknowledgement: start with "I noticed..."

"I noticed you went back and tried again after the first time didn\'t work."
"I noticed you stayed calm when that was really frustrating."
"I noticed you helped your brother even when you were tired."

This framing has several advantages: it\'s observable (not evaluative), it\'s specific (what exactly you saw), and it puts the child at the centre — it\'s about what THEY did, not about your assessment of them.

**Celebrating the Process of Resilience**

IATLAS activities build resilience capacities that are often invisible in the moment but cumulative over time. Help children see the arc:

The "three weeks ago" reflection: "Three weeks ago, you tried this kind of activity and found it really hard. I want to show you what you just did with the same thing." Progress is often invisible from inside it — the external mirror you provide is a gift.

The "hard thing I did" story: Regularly invite your child to tell you about something that was hard that they did anyway. Narrating courage to someone who listens is itself a resilience act.

The "what I\'m getting better at" inventory: At end of term or year, revisit the IATLAS activities and ask: "What feels easier now than it did before?" Making implicit growth explicit is powerful.

**When Celebration Becomes Pressure**

Watch for these signs that your encouragement is creating pressure rather than support:

- Your child avoids activities they used to enjoy after you praised them
- They ask "Was that good?" before they have their own reaction
- They become distressed when they don\'t meet their own (or perceived parental) standard
- They stop taking risks or trying new things

If you notice these patterns, step back on evaluative praise entirely for a while. Replace it with curiosity: "What did you think about that?" — let them supply the evaluation.

**Celebrating Effort That Doesn\'t Pay Off**

Some of the most important moments to celebrate are when a child tries hard and doesn\'t succeed. "I\'m really proud of how hard you tried on that, even though it didn\'t turn out the way we hoped" is worth more than a hundred celebrations of success. It communicates: effort is intrinsically valuable; failure is survivable; my approval is not contingent on your success.`,
        keyTakeaways: [
          'Process praise ("you worked really hard") builds more resilience than person praise ("you\'re so smart")',
          'The "I noticed..." framework provides specific, genuine, observable acknowledgement',
          'Making implicit growth explicit — the "three weeks ago" reflection — helps children see their own progress',
          'Praise inflation and excessive celebration can create performance anxiety — proportionality matters',
          'Celebrating effort that doesn\'t succeed is among the most powerful resilience-building responses available',
        ],
        tryThisWeek: [
          'For the next three days, replace all "Great job!" and "You\'re so smart!" with specific "I noticed..." observations. Write down five examples at the end of the three days — notice what you\'re seeing more clearly.',
          'Find a moment to celebrate an effort that didn\'t fully succeed: "I saw how hard you tried on that, even though it didn\'t work out. That kind of effort is what builds real strength."',
        ],
        relatedActivities: [
          { title: 'The Growth Journal', dimension: 'cognitive-narrative' },
          { title: 'Effort Stories', dimension: 'agentic-generative' },
        ],
        evidenceBase: 'Dweck & Mueller (1998) seminal studies demonstrate that person praise undermines resilience while process praise enhances it. Henderlong & Lepper (2002) meta-analysis identifies four characteristics of effective praise: sincerity, process focus, attributional messages, and competence fostering. Self-determination theory (Deci & Ryan, 2000) provides the theoretical framework for understanding why controlling praise undermines intrinsic motivation.',
      },
    ],
  },
};

/**
 * Flat list of all modules across all categories.
 */
export const CAREGIVER_CURRICULUM_MODULES = Object.values(CAREGIVER_CURRICULUM)
  .flatMap((category) => category.modules.map((m) => ({ ...m, categoryId: category.id, categoryTitle: category.title })));

/**
 * Fetch a single module by ID.
 */
export function getCurriculumModuleById(id) {
  return CAREGIVER_CURRICULUM_MODULES.find((m) => m.id === id);
}

/**
 * Get all modules for a given category.
 */
export function getModulesByCategory(categoryId) {
  return CAREGIVER_CURRICULUM[categoryId]?.modules ?? [];
}

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_COMPLETED_KEY = 'iatlas_curriculum_completed';
const LS_BOOKMARKS_KEY = 'iatlas_curriculum_bookmarks';

export function getCompletedModuleIds() {
  try { return JSON.parse(localStorage.getItem(LS_COMPLETED_KEY) || '[]'); }
  catch { return []; }
}

export function markModuleCompleted(id) {
  const completed = getCompletedModuleIds();
  if (!completed.includes(id)) {
    localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify([...completed, id]));
  }
}

export function isModuleCompleted(id) {
  return getCompletedModuleIds().includes(id);
}

export function getBookmarkedModuleIds() {
  try { return JSON.parse(localStorage.getItem(LS_BOOKMARKS_KEY) || '[]'); }
  catch { return []; }
}

export function toggleModuleBookmark(id) {
  const bookmarks = getBookmarkedModuleIds();
  const updated = bookmarks.includes(id)
    ? bookmarks.filter((b) => b !== id)
    : [...bookmarks, id];
  localStorage.setItem(LS_BOOKMARKS_KEY, JSON.stringify(updated));
  return updated.includes(id);
}

export function isModuleBookmarked(id) {
  return getBookmarkedModuleIds().includes(id);
}
