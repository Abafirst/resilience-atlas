# The Resilience Atlas

> **A longitudinal resilience navigation system** — track how your resilience profile evolves over time through comprehensive assessments, visual insights, and personalized guidance.

Resilience Atlas is a full-stack web application that helps users discover and track their resilience profile through a comprehensive 36-question assessment, delivering personalized insights across six resilience dimensions: **Cognitive-Narrative, Relational, Agentic-Generative, Emotional-Adaptive, Spiritual-Existential, and Somatic-Regulative**.

---

## ✨ Features

### Core Assessment
- 🧠 **36-question Resilience Assessment** — six-category scoring algorithm
- 📊 **Six Resilience Dimensions:** Cognitive-Narrative, Relational, Agentic-Generative, Emotional-Adaptive, Spiritual-Existential, Somatic-Regulative
- 🎯 **Instant Results** — Fast quiz submission with immediate score feedback

### Enhanced Results & Visualization
- 📈 **Interactive Radar Chart** — Visual representation of your 6-dimension profile
- 📊 **Score Breakdown** — Detailed percentage scores for each resilience type
- 📄 **Structured Narrative Report** — AI-powered, pattern-based interpretations tailored to your profile
- 🎨 **Strength Cards** — Primary, Solid, and Emerging strength identification and descriptions
- 📥 **PDF Download** — Generate downloadable PDF report of your resilience profile
- 📧 **Email Results** — Receive your full assessment report via email

### Longitudinal Tracking (Resilience Atlas)
- 📅 **Assessment History Timeline** — View all past assessments chronologically
- 🧭 **Evolution Compass** — Visual compass showing direction of resilience growth
  - North → Cognitive/Mental growth
  - East → Relational/Social expansion
  - South → Somatic/Physical grounding
  - West → Emotional/Spiritual integration
- 📊 **Comparative Analysis** — See how each dimension changed between assessments
- 🗺️ **Resilience Atlas Page** (`/atlas`) — Complete journey visualization with:
  - Assessment history timeline
  - Individual radar charts for each assessment
  - Evolution compass visualization
  - Narrative evolution summary
- 🚀 **Retake Encouragement** — "Return in 30 days to see how your resilience evolves"
- 📍 **Journey Tracker** — Progress indicator showing previous ↔ current → next evolution

### Social Sharing & Virality
- 📸 **Shareable Profile Card** — Beautiful 1200×630 PNG optimized for social media
  - Includes primary/solid/emerging strengths
  - Overall resilience score
  - Mini radar chart
  - Compass visualization
  - "Discover your resilience profile with The Resilience Atlas" call-to-action
- 🔗 **Social Share Buttons:**
  - Share on LinkedIn
  - Share on X (Twitter)
  - Download Image
  - Copy Share Link
- 📱 **Web Share API** — Native sharing on supported browsers with fallbacks

### Asynchronous Report Generation
- ⚡ **Fast Quiz Submission** — Response time < 200ms (non-blocking)
- 🔄 **Background Processing** — Reports generated asynchronously by dedicated worker
- 📋 **Job Queue System** — Redis-backed job management for scalability
- 🔁 **Job Retries** — Automatic retry logic (up to 3 attempts) for failed jobs
- 📝 **Report Caching** — Intelligent caching to reuse reports for identical assessments
- 🌍 **Horizontal Scalability** — Web server and worker server run independently

### User Experience
- 🔐 **JWT Authentication** — Secure login, signup, and profile management
- 💾 **MongoDB Persistence** — Results stored securely and indefinitely
- 🎯 **Immediate Feedback** — Scores displayed instantly after quiz completion
- 📊 **Pattern Detection** — Smart narrative generation based on assessment patterns
- ♿ **Accessible Visualizations** — SVG-based charts with ARIA labels

---

## 🎯 Assessment Dimensions

Each resilience type is scored on a scale of 1-5 (Never to Always/Excellent):

| Dimension | Description |
|-----------|-------------|
| **Cognitive-Narrative** | Your resilience is driven by meaning-making and reframing experiences. You find strength in narrative coherence. |
| **Relational** | Strengthened through connection, trust, and supportive relationships. You thrive when you have people to lean on. |
| **Agentic-Generative** | You demonstrate resilience through purposeful action and forward momentum. Energized by creating change. |
| **Emotional-Adaptive** | You show flexibility in managing emotions and adapting to stress. You work skillfully with emotional experiences. |
| **Spiritual-Existential** | Your resilience is grounded in purpose, values, and meaning. You draw strength from a coherent worldview. |
| **Somatic-Regulative** | You rely on body awareness and behavioral habits to stabilize and recover. Physical practices provide foundation. |

---

## 🏗️ Project Structure
