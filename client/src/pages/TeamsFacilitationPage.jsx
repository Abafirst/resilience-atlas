import React, { useState } from 'react';

/* TODO: add tier-gating logic */

const SECTIONS = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    intro: 'Before your first team resilience session, take time to understand your context. Effective facilitation begins with preparation, not the moment you walk in the door.',
    callout: { type: 'tip', icon: '💡', content: <><strong>Facilitator\'s Mindset:</strong> Your job is not to teach resilience — it\'s to create the conditions where a team can discover their own resilience together. Curiosity over expertise.</> },
    items: [
      {
        id: 'gs-roles',
        title: 'Facilitator Roles & Responsibilities',
        content: (
          <>
            <p>As a team resilience facilitator, you wear several hats:</p>
            <ul>
              <li><strong>Guide:</strong> Navigate the team through activities with clear direction.</li>
              <li><strong>Holder:</strong> Hold the space — protect psychological safety and manage energy.</li>
              <li><strong>Weaver:</strong> Connect insights across activities and conversations to build coherent meaning.</li>
              <li><strong>Time-keeper:</strong> Protect time so every part of the experience lands properly.</li>
              <li><strong>Witness:</strong> Notice what's happening and name it when useful.</li>
            </ul>
            <p>You do NOT need to have all the answers. In fact, pretending you do undermines trust and authenticity.</p>
          </>
        ),
      },
      {
        id: 'gs-prep',
        title: 'Pre-Session Preparation Checklist',
        content: (
          <>
            <h4>1–2 Weeks Before</h4>
            <ul>
              <li>Review the team's resilience profile data (if available)</li>
              <li>Select 2–3 activities appropriate to team size and readiness</li>
              <li>Confirm room or virtual setup, materials, and tech</li>
              <li>Send a brief pre-communication to the team (what to expect, why it matters)</li>
            </ul>
            <h4>Day Before</h4>
            <ul>
              <li>Print or prepare digital materials</li>
              <li>Test all technology (video, slides, timers)</li>
              <li>Prepare your opening — what will you say first?</li>
              <li>Review your psychological safety checklist</li>
            </ul>
            <h4>Day Of</h4>
            <ul>
              <li>Arrive/join early to set up the environment</li>
              <li>Greet participants as they arrive — connection begins before the session starts</li>
              <li>Have all materials laid out and ready</li>
              <li>Prepare a simple check-in question to open with</li>
            </ul>
          </>
        ),
      },
      {
        id: 'gs-setup',
        title: 'Room & Environment Setup',
        content: (
          <>
            <h4>In-Person Setup</h4>
            <ul>
              <li>Arrange seating in a circle or small clusters (not rows facing a screen)</li>
              <li>Remove barriers between participants where possible</li>
              <li>Have a flip chart or whiteboard visible and accessible</li>
              <li>Ensure good lighting and comfortable temperature</li>
              <li>Have water, snacks if possible — physical comfort supports openness</li>
            </ul>
            <h4>Virtual Setup</h4>
            <ul>
              <li>Prepare breakout rooms in advance</li>
              <li>Have a shared virtual whiteboard (Miro, FigJam, Jamboard)</li>
              <li>Test screen sharing and document editing access</li>
              <li>Have a backup plan for tech failures</li>
              <li>Ask participants to turn cameras on if they're comfortable</li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: 'psychological-safety',
    icon: '🛡️',
    title: 'Creating Psychological Safety',
    intro: 'Psychological safety — the belief that you can speak up, take risks, and be yourself without fear of punishment or humiliation — is the single most important condition for effective team resilience work.',
    callout: { type: 'warn', icon: '⚠️', content: <><strong>Warning Sign:</strong> If team members are giving "safe" answers, watching the leader's reactions before speaking, or going silent when hard topics arise — psychological safety needs attention before you can go deeper.</> },
    items: [
      {
        id: 'ps-build',
        title: 'Building Safety: Practical Practices',
        content: (
          <ul>
            <li><strong>Model vulnerability first:</strong> Share before you ask others to share. Go first every time.</li>
            <li><strong>Acknowledge what's hard:</strong> Name the elephant — if there's tension in the room, saying so reduces it.</li>
            <li><strong>No advice without permission:</strong> When someone shares, ask "Do you want support, ideas, or just to be heard?" before responding.</li>
            <li><strong>Celebrate contributions:</strong> Thank people for sharing — especially when it takes courage.</li>
            <li><strong>Disagree with ideas, not people:</strong> Model how to challenge thinking without making it personal.</li>
            <li><strong>Protect quiet voices:</strong> Actively invite those who haven't spoken. Never force sharing.</li>
            <li><strong>What's said here, stays here:</strong> Establish explicit confidentiality norms at the start.</li>
          </ul>
        ),
      },
      {
        id: 'ps-check',
        title: 'Safety Check-In Tools',
        content: (
          <>
            <p>Use these quick tools to gauge and respond to safety levels in your sessions:</p>
            <h4>The Fist-to-Five Check</h4>
            <p>Ask: "On a scale of 0 (fist) to 5 (five fingers), how safe does this space feel for honest conversation right now?" Discuss results openly — this itself builds safety.</p>
            <h4>Anonymous Pulse Poll</h4>
            <p>Use a polling tool (mentimeter, slido, or paper) with one question: "What would make this conversation feel safer?" Aggregate and respond.</p>
            <h4>Weather Report Check-In</h4>
            <p>Each person shares one word: "If your current state is a weather pattern, what is it?" This builds connection and surfaces the emotional temperature of the room quickly.</p>
          </>
        ),
      },
      {
        id: 'ps-ground',
        title: 'Establishing Ground Rules',
        content: (
          <>
            <p>Co-created ground rules are more powerful than imposed ones. Ask: "What agreements would help everyone be fully present and honest today?"</p>
            <ul>
              <li>One person speaks at a time</li>
              <li>Speak from personal experience ("I" statements)</li>
              <li>Assume positive intent</li>
              <li>What's personal stays in this room</li>
              <li>Step up if you're quiet; step back if you're dominant</li>
              <li>It's okay to pass</li>
              <li>Phones away unless needed for the exercise</li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    id: 'tough-conversations',
    icon: '💬',
    title: 'Facilitating Tough Conversations',
    intro: 'Resilience work often surfaces real pain — burnout, conflict, loss, and systemic inequities. Your role is not to fix these, but to hold space and help the team navigate them constructively.',
    items: [
      {
        id: 'tc-framework',
        title: 'The 3-Step Facilitation Framework',
        content: (
          <>
            <h4>Step 1: Acknowledge</h4>
            <p>Before moving forward, acknowledge what's been said. "I hear that this is a painful experience for many of you. Thank you for naming it."</p>
            <h4>Step 2: Expand</h4>
            <p>Widen the lens. "Are there other perspectives in the room? Who has had a different experience?" This invites complexity without dismissing anyone.</p>
            <h4>Step 3: Navigate</h4>
            <p>Bring it back to agency. "Given what we're hearing, what do we have the power to do — even if it's small?" Focus on choice, not just circumstance.</p>
          </>
        ),
      },
      {
        id: 'tc-phrases',
        title: 'Helpful Phrases for Difficult Moments',
        content: (
          <ul>
            <li><em>"Thank you for naming that — it takes courage."</em></li>
            <li><em>"I want to make sure I understand. Are you saying…?"</em></li>
            <li><em>"That seems to have landed with some weight in the room. Does anyone want to respond?"</em></li>
            <li><em>"It sounds like there are different experiences here — that's real and important."</em></li>
            <li><em>"This isn't the only space to address this, but I don't want to dismiss it. Let's acknowledge it and decide together how to handle it."</em></li>
            <li><em>"What do you need right now — to be heard, to problem-solve, or something else?"</em></li>
            <li><em>"I'm going to pause us here and check in. How is everyone doing?"</em></li>
          </ul>
        ),
      },
      {
        id: 'tc-close',
        title: 'Closing Difficult Conversations Well',
        content: (
          <ul>
            <li><strong>Name what happened:</strong> "We just did something hard together. That matters."</li>
            <li><strong>Identify one takeaway:</strong> Ask each person: "What's one thing from this conversation you want to carry forward?"</li>
            <li><strong>Restore safety:</strong> End on connection — appreciation, a shared moment, or a closing ritual.</li>
            <li><strong>Follow up privately:</strong> If someone shared something vulnerable, check in with them afterward. Brief and human is enough.</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: 'group-dynamics',
    icon: '👥',
    title: 'Managing Group Dynamics',
    intro: 'Every group has dynamics — power patterns, social hierarchies, communication styles, and unspoken rules. Effective facilitators work with these dynamics, not around them.',
    items: [
      {
        id: 'gd-dominant',
        title: 'Handling Dominant Voices',
        content: (
          <ul>
            <li>Use round-robin formats so everyone contributes in sequence.</li>
            <li>After a long contribution: "Thank you — let's hear from someone who hasn't spoken yet."</li>
            <li>Speak with the dominant person privately at a break: "Your ideas are strong — I want to make sure we hear from the whole group. Can I count on you to help me invite others in?"</li>
            <li>Use writing before sharing — it levels the field so quick thinkers don't dominate.</li>
          </ul>
        ),
      },
      {
        id: 'gd-silent',
        title: 'Drawing Out Quiet Participants',
        content: (
          <ul>
            <li>Never single someone out to perform — it increases anxiety.</li>
            <li>Use pairs or small groups before whole-group sharing.</li>
            <li>Check in one-on-one during breaks: "I'd love to hear your perspective — no pressure, but feel free to share."</li>
            <li>Create low-stakes entry points: anonymous writing, one-word check-ins, or "finish this sentence" prompts.</li>
          </ul>
        ),
      },
      {
        id: 'gd-resist',
        title: 'Handling Resistance or Cynicism',
        content: (
          <>
            <p>Resistance is almost always a signal — of fear, past disappointment, or unheard concerns. Don't fight it.</p>
            <ul>
              <li><em>"It sounds like you've tried something like this before and it didn't stick. What would make this time different?"</em></li>
              <li>Acknowledge skepticism as valid: "Your skepticism is welcome here. Good ideas can handle scrutiny."</li>
              <li>Give resistant participants a role — observers, evaluators, questioners. Channel the skepticism productively.</li>
              <li>Don't try to convince. Ask: "What would you need to see for this to feel worthwhile to you?"</li>
            </ul>
          </>
        ),
      },
      {
        id: 'gd-emotion',
        title: 'When Emotions Run High',
        content: (
          <ul>
            <li>Pause the process. "Let's take a breath together. That was a lot."</li>
            <li>Name what you observe without diagnosing: "I notice the energy in the room has shifted. What's happening?"</li>
            <li>Give people an out: "It's okay to step outside if you need a moment."</li>
            <li>Never shame emotional responses — they contain information about what matters.</li>
            <li>Have tissues and water available. Practical care signals that feelings are welcome.</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: 'measurement',
    icon: '📊',
    title: 'Measurement & Progress',
    intro: 'Sustainable resilience programs need evidence. Measurement helps teams see progress, adjust course, and make the case for continued investment.',
    items: [
      {
        id: 'meas-track',
        title: 'What to Track',
        content: (
          <ul>
            <li><strong>Assessment scores:</strong> Pre/post dimension scores across the team</li>
            <li><strong>Activity participation:</strong> Who attended, which activities, how often</li>
            <li><strong>Self-reported shifts:</strong> Brief session-end check (1 min)</li>
            <li><strong>Behavioral changes:</strong> Observable team behaviors (qualitative)</li>
            <li><strong>Business metrics:</strong> Retention, absenteeism, engagement survey scores</li>
          </ul>
        ),
      },
      {
        id: 'meas-reflect',
        title: 'Session Reflection (End of Each Session)',
        content: (
          <>
            <p>Close every session with a 1–2 minute reflection. Ask one or two of these:</p>
            <ol>
              <li>One word to describe how you feel right now compared to when we started?</li>
              <li>One thing you're taking away from today?</li>
              <li>One thing you'll do differently this week?</li>
              <li>What would make our next session even better?</li>
            </ol>
            <p>Capture responses in a shared document. Review trends over time.</p>
          </>
        ),
      },
      {
        id: 'meas-report',
        title: 'Reporting Progress to Stakeholders',
        content: (
          <>
            <p>Leaders and HR stakeholders want to know: Was this worth it? Here's what to report:</p>
            <ul>
              <li><strong>Participation data:</strong> Number of sessions, total attendees, dimensions covered</li>
              <li><strong>Score trends:</strong> Average dimension score change from pre to post</li>
              <li><strong>Qualitative wins:</strong> 2–3 specific stories of impact</li>
              <li><strong>Next steps:</strong> Recommended activities, dimensions to focus on next quarter</li>
            </ul>
            <p>One page is enough. Make it visual and specific.</p>
          </>
        ),
      },
    ],
  },
  {
    id: 'best-practices',
    icon: '✅',
    title: 'Best Practices',
    intro: null,
    callout: { type: 'tip', icon: '💡', content: <><strong>The 30-Second Rule:</strong> After asking a question to a group, wait at least 30 seconds before filling the silence. Silence is processing, not failure. The team that gets comfortable with silence becomes more thoughtful and honest.</> },
    doList: [
      'Start small and build over time',
      'Co-create norms with the team',
      'Follow up on commitments',
      'Celebrate small wins explicitly',
      'Connect activities to real work',
      'Ask for feedback after every session',
      'Keep activities relevant to the team\'s actual challenges',
      'Use the team\'s own stories, not generic examples',
    ],
    dontList: [
      'Force participation or sharing',
      'Use resilience to bypass systemic issues',
      'Run activities without a clear purpose',
      'Rush debrief to cover more content',
      'Skip check-in and check-out',
      'Treat all teams the same — context is everything',
      'Start with advanced activities before trust is built',
      'Overpromise what a single session can do',
    ],
    items: [],
  },
  {
    id: 'scripts',
    icon: '🎙️',
    title: 'Facilitation Scripts',
    intro: 'Use these scripts as starting points — they should feel natural, so adapt them to your own voice.',
    items: [
      {
        id: 'script-open',
        title: 'Opening a Session',
        isScript: true,
        content: (
          <div style={{ background: '#f8fafc', borderLeft: '3px solid #4F46E5', borderRadius: '0 8px 8px 0', padding: '1rem 1.25rem', fontStyle: 'italic', color: '#334155' }}>
            "Welcome, everyone. I'm really glad we're doing this together. Today we're going to spend some time on something that doesn't always get space in our regular meetings — ourselves, and how we're doing as a team.
            <br /><br />
            The Resilience Atlas is a framework for six dimensions of how we navigate challenge and change. We're not here to rank ourselves or prove anything — we're here to notice, reflect, and figure out how to support each other better.
            <br /><br />
            Before we start, I want to set one intention: whatever happens here, it stays here. This is a space to be honest, and honesty requires trust. I'll do my best to model that.
            <br /><br />
            Let's begin with a quick check-in. Go around the circle and share: What's one word for how you're feeling right now, and one thing you're hoping to get from today?"
          </div>
        ),
      },
      {
        id: 'script-trans',
        title: 'Transitions Between Activities',
        isScript: true,
        content: (
          <div style={{ background: '#f8fafc', borderLeft: '3px solid #4F46E5', borderRadius: '0 8px 8px 0', padding: '1rem 1.25rem', fontStyle: 'italic', color: '#334155' }}>
            "We've just done something that takes courage — [name what happened briefly]. I want to honor that before we move forward.
            <br /><br />
            [Brief pause.]
            <br /><br />
            What we're about to do next builds on exactly what you just explored. We're going to go a little deeper / shift gears slightly / bring in a new angle. Stay curious — there's no right way to do this."
          </div>
        ),
      },
      {
        id: 'script-close',
        title: 'Closing a Session',
        isScript: true,
        content: (
          <div style={{ background: '#f8fafc', borderLeft: '3px solid #4F46E5', borderRadius: '0 8px 8px 0', padding: '1rem 1.25rem', fontStyle: 'italic', color: '#334155' }}>
            "Before we wrap up, I want to take a moment to acknowledge what we've done today. This kind of work — looking honestly at ourselves and our team — isn't easy. And you showed up for it.
            <br /><br />
            I want to invite each of you to share one word for how you feel right now, and one thing you're taking away. Just one word, one thing. [Go around.]
            <br /><br />
            [After the round:] Thank you. What I notice is [reflect one genuine observation]. That's something to carry forward.
            <br /><br />
            We'll meet again [date/time]. Between now and then, I encourage you to [one small action]. See you then."
          </div>
        ),
      },
    ],
  },
];

const CALLOUT_STYLES = {
  tip:  { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' },
  warn: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
  info: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#14532d' },
};

function Expandable({ id, title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: '.85rem', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1.1rem 1.25rem', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', fontSize: '.97rem', fontWeight: 600, color: '#0f172a' }}
      >
        {title}
        <span aria-hidden="true" style={{ fontSize: '1rem', color: '#64748b', flexShrink: 0 }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div
          id={`${id}-body`}
          style={{ padding: '0 1.25rem 1.25rem', fontSize: '.93rem', color: '#334155', lineHeight: 1.7 }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function TeamsFacilitationPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const navLinkStyle = (id) => ({
    display: 'block',
    padding: '.5rem .85rem',
    borderRadius: 7,
    fontSize: '.87rem',
    fontWeight: activeSection === id ? 600 : 500,
    color: activeSection === id ? '#1d4ed8' : '#475569',
    background: activeSection === id ? '#eff6ff' : 'none',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left',
    fontFamily: 'inherit',
    width: '100%',
  });

  return (
    <>
      {/* Hero */}
      <section
        aria-label="Page hero"
        style={{
          background: 'linear-gradient(135deg, #0f2942 0%, #1a3a5c 50%, #1e3a8a 100%)',
          color: '#fff',
          padding: '4.5rem 1.5rem 3.5rem',
          textAlign: 'center',
        }}
      >
        <span style={{ color: '#818cf8', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', display: 'block', marginBottom: '.6rem' }}>
          Teams Resource Library
        </span>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem,4vw,2.6rem)', marginBottom: '.6rem' }}>
          Facilitation Guide
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 580, margin: '0 auto 1.5rem', lineHeight: 1.65 }}>
          A comprehensive framework for facilitating team resilience programs — from your first session to long-term culture change.
        </p>
        <nav
          role="navigation"
          aria-label="Team resources navigation"
          style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}
        >
          {[
            { href: '/teams/activities', label: '🎯 Activities' },
            { href: '/teams/resources', label: '📥 Handouts & Visuals' },
            { href: '/teams/facilitation', label: '📋 Facilitation Guide', active: true },
            { href: '/team', label: '← Team Home' },
          ].map(({ href, label, active }) => (
            <a
              key={href}
              href={href}
              style={{
                background: active ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: 8,
                padding: '.5rem 1.1rem',
                fontSize: '.9rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      {/* Two-column layout */}
      <main
        id="main-content"
        style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 4rem', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2.5rem', alignItems: 'start' }}
      >
        {/* Sidebar */}
        <aside aria-label="Section navigation" style={{ position: 'sticky', top: '1.5rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#94a3b8', padding: '.5rem .85rem', marginBottom: '.25rem' }}>
            Jump to Section
          </p>
          <ul role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {SECTIONS.map(sec => (
              <li key={sec.id} style={{ marginBottom: '.15rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection(sec.id);
                    document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={navLinkStyle(sec.id)}
                >
                  {sec.title}
                </button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1.5rem', padding: '.85rem', background: '#eff6ff', borderRadius: 8, fontSize: '.85rem', color: '#1e40af' }}>
            <strong>Need resources?</strong><br />
            Download printable guides at <a href="/teams/resources" style={{ color: '#1d4ed8', fontWeight: 600 }}>the resource library →</a>
          </div>
        </aside>

        {/* Content */}
        <div>
          {SECTIONS.map(sec => (
            <section
              key={sec.id}
              id={`section-${sec.id}`}
              style={{ marginBottom: '2.5rem', scrollMarginTop: '1.5rem' }}
              aria-labelledby={`${sec.id}-heading`}
            >
              <h2
                id={`${sec.id}-heading`}
                style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', paddingBottom: '.6rem', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '.6rem' }}
              >
                {sec.icon} {sec.title}
              </h2>

              {sec.intro && (
                <p style={{ fontSize: '.95rem', color: '#334155', lineHeight: 1.7, marginBottom: '.85rem' }}>{sec.intro}</p>
              )}

              {sec.callout && (
                <div
                  style={{ ...CALLOUT_STYLES[sec.callout.type], borderRadius: 10, padding: '1rem 1.25rem', margin: '1rem 0', fontSize: '.9rem', lineHeight: 1.65, display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}
                >
                  <span aria-hidden="true" style={{ flexShrink: 0, fontSize: '1.1rem' }}>{sec.callout.icon}</span>
                  <div>{sec.callout.content}</div>
                </div>
              )}

              {/* Best Practices do/don't grid */}
              {sec.doList && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1.25rem' }}>
                    <h3 style={{ color: '#14532d', fontSize: '.97rem', margin: '0 0 .75rem' }}>✅ Do</h3>
                    <ul style={{ margin: '0 0 0 1rem', padding: 0, fontSize: '.9rem', color: '#14532d', lineHeight: 1.65 }}>
                      {sec.doList.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1.25rem' }}>
                    <h3 style={{ color: '#991b1b', fontSize: '.97rem', margin: '0 0 .75rem' }}>❌ Don't</h3>
                    <ul style={{ margin: '0 0 0 1rem', padding: 0, fontSize: '.9rem', color: '#991b1b', lineHeight: 1.65 }}>
                      {sec.dontList.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {sec.items.map(item => (
                <Expandable key={item.id} id={item.id} title={item.title}>
                  {item.content}
                </Expandable>
              ))}
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
