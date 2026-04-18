import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
const styles = ``;

export default function ResearchPage() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Header ────────────────────────────────────────────── */}
      <SiteHeader activePage="research" />
      <DarkModeHint />

      <div className="storytelling-page research-story">
        {/* ── Hero / Overview ───────────────────────────────────── */}
        <section className="research-hero" aria-labelledby="hero-heading">
          <div className="research-container">
            <span className="section-label">Research &amp; Foundations</span>
            <h1 id="hero-heading">The Research Foundations of the&nbsp;Resilience&nbsp;Atlas</h1>
            <p className="hero-description">
              The Resilience Atlas originated from doctoral research exploring how individuals
              adapt to stress and adversity across multiple interacting dimensions. This framework
              integrates findings from multiple scientific traditions to offer a comprehensive,
              strengths-based model of human resilience.
            </p>
            <div className="hero-frameworks" role="list" aria-label="Theoretical frameworks">
              <span className="framework-chip" role="listitem">Positive Psychology</span>
              <span className="framework-chip" role="listitem">Resilience Science</span>
              <span className="framework-chip" role="listitem">Cross-Cultural Research</span>
              <span className="framework-chip" role="listitem">Applied Behavior Analysis</span>
              <span className="framework-chip" role="listitem">Acceptance &amp; Commitment Therapy</span>
            </div>
          </div>
        </section>

        <main id="main-content" className="research-main">

        {/* ── Section 1b: Dissertation & Exemplars ──────────────── */}
        <section className="research-section alt-bg" aria-labelledby="dissertation-heading">
          <div className="research-container">
            <span className="section-label">Primary Source</span>
            <h2 className="section-headline" id="dissertation-heading">The 2013 Doctoral Dissertation</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  The Resilience Atlas framework originates from a published 2013 doctoral dissertation
                  by Janeen Molchany, Ph.D., BCBA — a comprehensive mixed-methods investigation into how
                  individuals navigate adversity across multiple interacting dimensions of resilience.
                </p>
                <p>
                  The research combined in-depth qualitative interviews with <strong>18 resilience
                  exemplars</strong> — individuals identified by their communities as demonstrating
                  extraordinary resilience — with the administration of <strong>6 validated psychometric
                  assessments</strong> spanning emotional regulation, social support, coping, cognitive
                  flexibility, purpose, and somatic awareness.
                </p>
                <p>
                  The findings challenged prevailing single-dimension models of resilience, establishing
                  instead a six-dimension framework that has since been refined through 13 years of
                  clinical practice, behavioral science application, and real-world testing.
                </p>
              </div>
              <aside className="key-concepts" aria-label="Key research statistics">
                <h4>Research at a Glance</h4>
                <ul>
                  <li>Published: <strong>2013</strong></li>
                  <li><strong>18</strong> resilience exemplars studied</li>
                  <li><strong>6</strong> psychometric instruments used</li>
                  <li><strong>6</strong> resilience dimensions identified</li>
                  <li><strong>13+</strong> years of subsequent refinement</li>
                  <li>Framework validated across diverse populations</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 1c: Psychometric Assessments ──────────────── */}
        <section className="research-section" aria-labelledby="assessments-heading">
          <div className="research-container">
            <span className="section-label">Methodology</span>
            <h2 className="section-headline" id="assessments-heading">The Six Core Dimensions</h2>
            <p className="section-intro">
              Each dimension of the Resilience Atlas was established from the outcomes of 6 psychometric assessments and deep thematic analysis of exemplar interviews. These six dimensions collectively measure the full spectrum of resilience capacities identified in the original research:
            </p>
            <div className="dimensions-grid">
              <article className="dimension-card" aria-label="Cognitive-Narrative assessment">
                <div className="dimension-icon dimension-icon--cognitive" aria-hidden="true">
                  <img src="/icons/cognitive-narrative.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Cognitive-Narrative</h3>
                <p className="dimension-desc">
                  Validated instrument measuring cognitive flexibility, meaning-making ability, and
                  narrative coherence under stress and adversity.
                </p>
              </article>
              <article className="dimension-card" aria-label="Relational-Connective assessment">
                <div className="dimension-icon dimension-icon--relational" aria-hidden="true">
                  <img src="/icons/relational-connective.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Relational-Connective</h3>
                <p className="dimension-desc">
                  Assesses quality, depth, and accessibility of social support networks and the capacity
                  for trust and help-seeking in relationships.
                </p>
              </article>
              <article className="dimension-card" aria-label="Agentic-Generative assessment">
                <div className="dimension-icon dimension-icon--agentic" aria-hidden="true">
                  <img src="/icons/agentic-generative.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Agentic-Generative</h3>
                <p className="dimension-desc">
                  Evaluates personal agency, self-efficacy, future orientation, and forward-momentum
                  behaviors in the face of challenge.
                </p>
              </article>
              <article className="dimension-card" aria-label="Emotional-Adaptive assessment">
                <div className="dimension-icon dimension-icon--emotional" aria-hidden="true">
                  <img src="/icons/emotional-adaptive.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Emotional-Adaptive</h3>
                <p className="dimension-desc">
                  Measures emotional regulation strategies, adaptive responses to difficult feelings, and
                  capacity to process and move through emotional experiences.
                </p>
              </article>
              <article className="dimension-card" aria-label="Spiritual-Reflective assessment">
                <div className="dimension-icon dimension-icon--spiritual" aria-hidden="true">
                  <img src="/icons/spiritual-reflective.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Spiritual-Reflective</h3>
                <p className="dimension-desc">
                  Assesses connection to meaning, purpose, values, and existential grounding — the
                  anchors that sustain motivation through adversity.
                </p>
              </article>
              <article className="dimension-card" aria-label="Somatic-Regulative assessment">
                <div className="dimension-icon dimension-icon--somatic" aria-hidden="true">
                  <img src="/icons/somatic-regulative.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Somatic-Regulative</h3>
                <p className="dimension-desc">
                  Evaluates body awareness, somatic regulation capacity, and physical resilience practices
                  that support stability and recovery.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Section 1d: The 18 Exemplars ─────────────────────── */}
        <section className="research-section alt-bg" aria-labelledby="exemplars-heading">
          <div className="research-container">
            <span className="section-label">Qualitative Research</span>
            <h2 className="section-headline" id="exemplars-heading">The 18 Resilience Exemplars</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  A defining feature of the original 2013 research was the selection and in-depth study
                  of <strong>18 resilience exemplars</strong> — individuals nominated by their communities
                  as having demonstrated extraordinary resilience in the face of significant adversity.
                </p>
                <p>
                  These exemplars came from diverse backgrounds and had navigated a wide range of
                  adversities, including poverty, illness, loss, displacement, and systemic marginalization.
                  Through structured qualitative interviews, the research explored how each person had
                  experienced, responded to, and grown through their adversity — mapping the internal and
                  external resources they drew upon across all six dimensions.
                </p>
                <p>
                  The exemplars' stories revealed a consistent finding: resilience is never one-dimensional.
                  Every participant showed high capacity in some dimensions and relative vulnerability in
                  others. This empirical finding became the conceptual foundation for the six-dimension
                  framework — and for the core principle that <em>every person's resilience profile is unique</em>.
                </p>
              </div>
              <aside className="key-concepts" aria-label="Key findings from exemplar research">
                <h4>Key Findings</h4>
                <ul>
                  <li>No single "resilience type" — all profiles are unique</li>
                  <li>Strengths and vulnerabilities coexist in everyone</li>
                  <li>Resilience is accessed through multiple pathways</li>
                  <li>Cultural context shapes which dimensions are prominent</li>
                  <li>Resilience is dynamic, not fixed or permanent</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 2: Six Dimensions ─────────────────────── */}
        <section className="research-section" id="dimensions" aria-labelledby="dimensions-heading">
          <div className="research-container">
            <span className="section-label">Framework</span>
            <h2 className="section-headline" id="dimensions-heading">Resilience is Multidimensional</h2>
            <p className="dimensions-intro">
              Research shows resilience is not a single fixed trait, but a set of interacting
              capacities that shape how people respond to challenge, uncertainty, and stress.
              Every person has resilience — and every person has the potential to grow.
            </p>

            {/* Six Dimensions Overview */}
            <div className="dimensions-overview" style={{ margin: '2rem 0 1.5rem' }}>
              <p style={{ fontSize: '1rem', color: 'var(--research-slate-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Resilience is built on <strong>six interacting capacities</strong>. Each dimension represents
                a different way you navigate challenges — and together they form a complete picture of your
                resilience profile. Strengthening any one dimension can positively influence the others.
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                {[
                  { name: 'Relational-Connective', color: '#7C3AED', bg: '#EDE9FE', desc: 'Sustaining supportive relationships' },
                  { name: 'Cognitive-Narrative',   color: '#2563EB', bg: '#DBEAFE', desc: 'Interpreting challenges constructively' },
                  { name: 'Somatic-Regulative',    color: '#059669', bg: '#D1FAE5', desc: 'Regulating the body\'s stress response' },
                  { name: 'Emotional-Adaptive',    color: '#DC2626', bg: '#FEE2E2', desc: 'Processing difficult emotions effectively' },
                  { name: 'Agentic-Generative',    color: '#D97706', bg: '#FEF3C7', desc: 'Taking purposeful action under pressure' },
                  { name: 'Spiritual-Reflective',  color: '#0891B2', bg: '#CFFAFE', desc: 'Drawing on meaning, values, and purpose' },
                ].map(dim => (
                  <div key={dim.name} style={{
                    background: dim.bg,
                    border: `1.5px solid ${dim.color}30`,
                    borderLeft: `4px solid ${dim.color}`,
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: dim.color }}>{dim.name}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--research-slate-600)', lineHeight: 1.5 }}>{dim.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Circular Compass Layout */}
            <div className="compass-layout" role="img" aria-label="Animated brand compass showing all six resilience dimensions with a rotating needle indicating the dominant dimension">
              <div className="compass-center" aria-hidden="true">
                <canvas id="researchCompass" className="research-compass-canvas"></canvas>
              </div>
            </div>

            {/* Bridge: Six Dimensions Overview */}
            <div className="dimensions-bridge" aria-label="Six dimensions overview">
              <p className="dimensions-bridge-intro">
                Resilience isn't a single trait — it's six interconnected capacities that each
                contribute to how you navigate adversity, uncertainty, and change. Together, they
                form a complete picture of your resilience profile.
              </p>
              <div className="dimensions-bridge-stats" role="list" aria-label="Key resilience statistics">
                <div className="dim-stat" role="listitem">
                  <span className="dim-stat-number">6</span>
                  <span className="dim-stat-label">Interconnected dimensions</span>
                </div>
                <div className="dim-stat" role="listitem">
                  <span className="dim-stat-number">72</span>
                  <span className="dim-stat-label">Assessment questions</span>
                </div>
                <div className="dim-stat" role="listitem">
                  <span className="dim-stat-number">13+</span>
                  <span className="dim-stat-label">Years of refinement</span>
                </div>
                <div className="dim-stat" role="listitem">
                  <span className="dim-stat-number">18</span>
                  <span className="dim-stat-label">Resilience exemplars studied</span>
                </div>
              </div>
              <a href="/quiz" className="dimensions-bridge-cta" aria-label="Take the assessment to discover your resilience dimensions">
                Take the Assessment to Discover Yours <span aria-hidden="true">→</span>
              </a>
            </div>

            {/* Dimension Cards */}
            <div className="dimensions-grid">

              <article className="dimension-card" aria-label="Relational-Connective dimension">
                <div className="dimension-icon dimension-icon--relational" aria-hidden="true">
                  <img src="/icons/relational-connective.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Relational-Connective</h3>
                <p className="dimension-desc">
                  The ability to access and sustain supportive relationships during times of
                  challenge. Social connection is one of the most powerful buffers against stress.
                </p>
              </article>

              <article className="dimension-card" aria-label="Cognitive-Narrative dimension">
                <div className="dimension-icon dimension-icon--cognitive" aria-hidden="true">
                  <img src="/icons/cognitive-narrative.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Cognitive-Narrative</h3>
                <p className="dimension-desc">
                  The ability to interpret challenges constructively and maintain flexible,
                  adaptive thinking when faced with uncertainty or adversity.
                </p>
              </article>

              <article className="dimension-card" aria-label="Somatic-Regulative dimension">
                <div className="dimension-icon dimension-icon--somatic" aria-hidden="true">
                  <img src="/icons/somatic-regulative.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Somatic-Regulative</h3>
                <p className="dimension-desc">
                  The capacity for the body to regulate stress responses and restore physiological
                  balance. Mind-body connection plays a central role in sustained resilience.
                </p>
              </article>

              <article className="dimension-card" aria-label="Emotional-Adaptive dimension">
                <div className="dimension-icon dimension-icon--emotional" aria-hidden="true">
                  <img src="/icons/emotional-adaptive.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Emotional-Adaptive</h3>
                <p className="dimension-desc">
                  The ability to process and respond effectively to difficult emotions without
                  becoming overwhelmed. Emotional awareness supports adaptive functioning.
                </p>
              </article>

              <article className="dimension-card" aria-label="Spiritual-Reflective dimension">
                <div className="dimension-icon dimension-icon--spiritual" aria-hidden="true">
                  <img src="/icons/spiritual-reflective.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Spiritual-Reflective</h3>
                <p className="dimension-desc">
                  Connection to purpose, values, and sources of meaning that provide direction
                  and sustain motivation through difficulty and uncertainty.
                </p>
              </article>

              <article className="dimension-card" aria-label="Agentic-Generative dimension">
                <div className="dimension-icon dimension-icon--agentic" aria-hidden="true">
                  <img src="/icons/agentic-generative.svg" alt="" className="icon icon-lg" />
                </div>
                <h3 className="dimension-name">Agentic-Generative</h3>
                <p className="dimension-desc">
                  The capacity to take purposeful action and influence outcomes in difficult
                  situations. Agency reinforces a sense of efficacy and self-determination.
                </p>
              </article>

            </div>{/* /.dimensions-grid */}
          </div>
        </section>

        {/* ── Section 3: Positive Psychology ────────────────── */}
        <section className="research-section alt-bg" aria-labelledby="pospsych-heading">
          <div className="research-container">
            <span className="section-label">Foundation</span>
            <h2 className="section-headline" id="pospsych-heading">Positive Psychology</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  Positive psychology examines the strengths, values, and capacities that allow
                  individuals and communities to thrive. Rather than focusing solely on pathology
                  or deficits, this tradition asks what enables people to lead meaningful, fulfilling lives.
                </p>
                <p>
                  The Resilience Atlas aligns directly with this approach. The framework is built on
                  identifying and developing the capacities people already have — not cataloguing what
                  is missing. Each dimension represents a genuine strength that can be recognized,
                  cultivated, and grown over time.
                </p>
                <p>
                  Key themes from positive psychology — including strengths-based development,
                  flourishing, well-being, and growth potential — are woven throughout the model
                  and shape how results are interpreted and presented.
                </p>
              </div>
              <aside className="key-concepts" aria-label="Key concepts from positive psychology">
                <h4>Key Concepts</h4>
                <ul>
                  <li>Strengths-based development</li>
                  <li>Flourishing and well-being</li>
                  <li>Growth potential</li>
                  <li>Capacity-focused framing</li>
                  <li>Meaning and engagement</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 4: Resilience Science ─────────────────── */}
        <section className="research-section" aria-labelledby="rscience-heading">
          <div className="research-container accent-teal">
            <span className="section-label" style={{ background: '#D1FAE5', color: '#065F46' }}>Foundation</span>
            <h2 className="section-headline" id="rscience-heading">Resilience Science</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  Decades of empirical research demonstrate that human adaptation to stress involves
                  multiple protective factors operating across biological, psychological, and social
                  domains. Resilience is not a fixed personality trait that someone either has or lacks.
                </p>
                <p>
                  Rather, resilience reflects adaptive processes — dynamic, context-sensitive responses
                  to challenge that develop through experience, supportive relationships, and learning.
                  People who have faced significant adversity often show remarkable adaptive capacity,
                  and this capacity can be intentionally developed.
                </p>
                <p>
                  The Resilience Atlas framework operationalizes these research findings by mapping
                  the key protective factors into its six dimensions, enabling individuals to identify
                  both their current strengths and their areas of greatest growth opportunity.
                </p>
              </div>
              <aside className="key-concepts accent-teal" aria-label="Key concepts from resilience science">
                <h4>Key Concepts</h4>
                <ul>
                  <li>Adaptive capacity</li>
                  <li>Protective factors</li>
                  <li>Recovery from stress</li>
                  <li>Developmental resilience</li>
                  <li>Multi-level analysis</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 5: Cross-Cultural Research ────────────── */}
        <section className="research-section alt-bg" aria-labelledby="crosscultural-heading">
          <div className="research-container">
            <span className="section-label">Foundation</span>
            <h2 className="section-headline" id="crosscultural-heading">Cross-Cultural Research</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  Resilience is not a universal, culture-neutral phenomenon. Cross-cultural research
                  demonstrates that resilience is shaped by social context, cultural values, and the
                  environmental resources available to individuals and communities.
                </p>
                <p>
                  Different cultures emphasize different pathways to resilience — some prioritizing
                  community and collective support, others emphasizing meaning-making and spiritual
                  frameworks, and still others focusing on behavioral adaptation and skill development.
                </p>
                <p>
                  The Resilience Atlas framework is designed to honor this diversity. Rather than
                  prescribing a single pathway, it maps the range of dimensions through which resilience
                  can be accessed and expressed, recognizing that individuals will draw on different
                  strengths in different contexts.
                </p>
              </div>
              <aside className="key-concepts" aria-label="Key concepts from cross-cultural research">
                <h4>Key Concepts</h4>
                <ul>
                  <li>Cultural context</li>
                  <li>Collective resilience</li>
                  <li>Community support pathways</li>
                  <li>Meaning-making frameworks</li>
                  <li>Environmental resources</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 6: ABA ─────────────────────────────────── */}
        <section className="research-section" aria-labelledby="aba-heading">
          <div className="research-container accent-teal">
            <span className="section-label" style={{ background: '#D1FAE5', color: '#065F46' }}>Foundation</span>
            <h2 className="section-headline" id="aba-heading">Applied Behavior Analysis (ABA)</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  Applied Behavior Analysis provides a rigorous framework for understanding how
                  adaptive behaviors develop through environmental interaction. Within this tradition,
                  behavior is understood as functional — shaped by learning histories and responsive
                  to changing conditions.
                </p>
                <p>
                  The Resilience Atlas incorporates this perspective by understanding resilience as
                  a set of behavioral repertoires that are acquired, maintained, and strengthened
                  through experience and learning. Rather than fixed traits, the dimensions represent
                  skills and behavioral patterns that can be observed, practiced, and developed.
                </p>
                <p>
                  This grounding in behavioral science ensures that the framework is not merely
                  descriptive, but points toward concrete, actionable pathways for growth.
                </p>
              </div>
              <aside className="key-concepts accent-teal" aria-label="Key concepts from applied behavior analysis">
                <h4>Key Concepts</h4>
                <ul>
                  <li>Behavioral repertoires</li>
                  <li>Learning processes</li>
                  <li>Environmental contingencies</li>
                  <li>Skill development</li>
                  <li>Functional behavior</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 7: ACT ─────────────────────────────────── */}
        <section className="research-section alt-bg" aria-labelledby="act-heading">
          <div className="research-container accent-orange">
            <span className="section-label" style={{ background: '#FEF3C7', color: '#92400E' }}>Foundation</span>
            <h2 className="section-headline" id="act-heading">Acceptance and Commitment Therapy (ACT)</h2>
            <div className="foundation-content">
              <div className="foundation-body">
                <p>
                  Acceptance and Commitment Therapy emphasizes psychological flexibility — the ability
                  to remain present with difficult internal experiences while continuing to act in
                  alignment with one's values. This capacity is central to how people sustain
                  functioning in the face of ongoing challenge.
                </p>
                <p>
                  Several dimensions of the Resilience Atlas reflect processes closely related to
                  psychological flexibility. The Emotional-Adaptive dimension captures the capacity to
                  experience and process difficult feelings without avoidance. The Spiritual-Reflective
                  dimension aligns with values-based living. The Agentic-Generative dimension reflects the
                  committed action that follows from clear values.
                </p>
                <p>
                  ACT's emphasis on acceptance rather than control, and on values-guided behavior
                  rather than symptom elimination, reinforces the strengths-based orientation of
                  the entire framework.
                </p>
              </div>
              <aside className="key-concepts accent-orange" aria-label="Key concepts from acceptance and commitment therapy">
                <h4>Key Concepts</h4>
                <ul>
                  <li>Psychological flexibility</li>
                  <li>Acceptance</li>
                  <li>Values-based action</li>
                  <li>Committed behavior</li>
                  <li>Present-moment awareness</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        {/* ── Section 8: Implications ───────────────────────── */}
        <section className="research-section" aria-labelledby="implications-heading">
          <div className="research-container">
            <span className="section-label">Implications</span>
            <h2 className="section-headline" id="implications-heading">What This Model Makes Possible</h2>
            <p className="section-intro">
              Understanding resilience as multidimensional fundamentally changes what we can see
              and what we can do. Rather than labeling people as "resilient" or "not resilient,"
              this framework reveals the unique configuration of strengths and growth opportunities
              each person brings.
            </p>
            <div className="implications-cards">

              <div className="implication-card">
                <div className="implication-icon" aria-hidden="true">
                  <img src="/icons/compass.svg" alt="" className="icon icon-md" />
                </div>
                <h3 className="implication-title">Map Your Unique Profile</h3>
                <p className="implication-text">
                  See exactly where your resilience is strongest and which dimensions offer the
                  greatest opportunity for intentional growth.
                </p>
              </div>

              <div className="implication-card">
                <div className="implication-icon" aria-hidden="true">
                  <img src="/icons/agentic-generative.svg" alt="" className="icon icon-md" />
                </div>
                <h3 className="implication-title">Track Growth Over Time</h3>
                <p className="implication-text">
                  Because resilience is dynamic, not fixed, the Atlas tracks how your capacities
                  evolve across repeated assessments.
                </p>
              </div>

              <div className="implication-card">
                <div className="implication-icon" aria-hidden="true">
                  <img src="/icons/checkmark.svg" alt="" className="icon icon-md" />
                </div>
                <h3 className="implication-title">Personalized Development</h3>
                <p className="implication-text">
                  A multidimensional profile enables targeted, personalized strategies rather than
                  one-size-fits-all interventions.
                </p>
              </div>

              <div className="implication-card">
                <div className="implication-icon" aria-hidden="true">
                  <img src="/icons/relational-connective.svg" alt="" className="icon icon-md" />
                </div>
                <h3 className="implication-title">Recognize Diversity</h3>
                <p className="implication-text">
                  Different people access resilience through different dimensions. The model honors
                  that diversity rather than imposing a single pathway.
                </p>
              </div>

              <div className="implication-card">
                <div className="implication-icon" aria-hidden="true">
                  <img src="/icons/somatic-regulative.svg" alt="" className="icon icon-md" />
                </div>
                <h3 className="implication-title">Strengths, Not Deficits</h3>
                <p className="implication-text">
                  Every person has resilience. The framework begins from a position of strength,
                  identifying what is present and what can grow.
                </p>
              </div>

              <div className="implication-card">
                <div className="implication-icon" aria-hidden="true">
                  <img src="/icons/cognitive-narrative.svg" alt="" className="icon icon-md" />
                </div>
                <h3 className="implication-title">Grounded in Science</h3>
                <p className="implication-text">
                  All dimensions and the overall model reflect an integration of multiple empirical
                  research traditions, not intuition alone.
                </p>
              </div>

            </div>
          </div>
        </section>

        </main>

        {/* ── Section 9: Author Credentials ──────────────────── */}
        <section className="credentials-section" aria-labelledby="author-heading">
          <span className="section-label">About the Developer</span>
          <div className="author-card">
            <div className="author-avatar" aria-hidden="true">
              <img src="/icons/spiritual-reflective.svg" alt="" className="icon icon-xl" />
            </div>
            <h2 className="author-name" id="author-heading">Janeen Molchany, Ph.D., BCBA</h2>
            <p className="author-title">Founder &amp; Chief Resilience Scientist — The Resilience Atlas&#8482;</p>
            <p className="author-bio">
              The Resilience Atlas&#8482; framework was developed as part of Janeen's 2013 doctoral dissertation —
              a comprehensive mixed-methods study of resilience drawing on 18 resilience exemplars and 6
              validated psychometric assessments. Janeen is a Board Certified Behavior Analyst (BCBA) and
              foster care alumna with over a decade of clinical practice with vulnerable populations,
              including foster youth and autistic children and families. The platform reflects 13 years of
              continuous research refinement, grounded in science and designed for real-world impact.
            </p>
          </div>
          <div className="credentials-cta">
            <a href="/quiz" className="btn btn-primary">Take the Assessment</a>
            <a href="/founder" className="btn btn-light">Meet the Founder</a>
          </div>
        </section>
      </div>
    </>
  );
}
