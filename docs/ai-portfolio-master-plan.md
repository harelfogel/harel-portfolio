# Harel Portfolio AI Master Plan

## 1. Product Direction
Build a premium personal portfolio that feels like a modern "AI-first career product," not a regular resume site. The experience should guide two user types:

1. **Recruiters** who want quick clarity and confidence.
2. **Engineering leaders** who want technical depth and execution proof.

---

## 2. End-to-End User Journey (What HR / Manager Sees)

### Landing (0-10s)
- Sees Harel's photo, positioning statement, and strong CTA row:
  - **Download CV**
  - **LinkedIn**
  - **GitHub**
  - **Email Harel**

### Discovery (10-60s)
- Scrolls through:
  - About summary.
  - Key strengths.
  - Highlighted projects with impact metrics.

### Validation (1-3 min)
- Opens "Ask Harel AI" panel.
- Asks role-fit questions (e.g., strengths, architecture decisions, leadership examples).
- Gets concise, sourced answers from knowledge base.

### Conversion (3+ min)
- Clicks **Email Harel** or LinkedIn.
- Downloads CV for internal sharing.

---

## 3. Site Architecture (Pages + Sections)

## Page 1 — Home (Primary)
- Hero with photo + brand statement.
- CTA buttons (CV, LinkedIn, GitHub, Email).
- "Top Projects" cards.
- "Strengths" mini-grid.
- Embedded AI Assistant preview.

## Page 2 — Experience
- Timeline format.
- Each role includes:
  - Scope.
  - Systems impact.
  - Metrics.
  - Stack.

## Page 3 — Projects
- Project cards + deep-dive drawers/pages.
- For each project:
  - Problem.
  - Architecture.
  - Key tradeoffs.
  - Outcomes.
  - Screenshots/diagram (if available).

## Page 4 — Ask Harel AI
- Full-page conversation UI.
- Preset recruiter prompt chips.
- "Fast facts" sidebar (location, stack, years, domains).

## Page 5 — Contact
- Email button (`mailto`).
- LinkedIn + GitHub.
- Optional short form (name/email/message).

---

## 4. UX/UI Design System (Wow but Professional)

### Visual style
- Modern dark theme with premium accent colors.
- Minimal gradients, clean spacing, high readability.

### Components
- Glass-style hero card.
- Project cards with subtle hover depth.
- Chat bubbles with source badges.
- Sticky mini-nav for quick section jumps.

### Tone
- Direct, technical, and confident.
- No buzzword overload.

---

## 5. AI Agent Design (Robust + Recruiter Friendly)

## Agent Name
**Harel Career Copilot**

## Agent goals
- Explain Harel's skills and experience clearly.
- Tailor response depth by audience:
  - Recruiter = concise summary.
  - Engineering manager = architecture + tradeoffs.

## Agent response format
- 1-line direct answer.
- 3 bullets with concrete evidence.
- Optional "Want deeper technical breakdown?" follow-up.

## Safety rules
- Use only known content.
- Never invent companies, metrics, or roles.
- If not found: suggest contacting Harel by email.

---

## 6. Model Strategy (Most Robust + Wow)

Recommended production setup:

1. **Primary model**: `gpt-4.1` (balanced quality, latency, cost for recruiter chat UX).
2. **Premium mode option**: `gpt-5` for deeper technical Q&A when user clicks "Deep Dive Answer."
3. **Fallback model**: `gpt-4.1-mini` if latency or quota issues happen.

Why this setup:
- Fast enough for real-time portfolio interaction.
- Strong reasoning for project explanation and architecture discussion.
- Cost-safe with fallback for high traffic.

---

## 7. Tech Stack Plan

- **Framework**: Next.js (App Router) + TypeScript.
- **UI**: Tailwind CSS + component primitives.
- **AI**:
  - LLM provider abstraction.
  - Retrieval over local markdown knowledge base.
- **Data/content**:
  - Markdown knowledge files for About/Projects/Experience/Skills.
- **Telemetry**:
  - Basic analytics events for CTA + agent usage.
- **Deployment**:
  - Vercel.

---

## 8. Content Checklist

- [ ] Final professional photo in public assets.
- [ ] CV PDF in public assets (`/public/Harel_Fogel_CV.pdf`).
- [ ] Verified links:
  - LinkedIn: `https://www.linkedin.com/in/harel-fogel/`
  - GitHub: `https://github.com/harelfogel`
  - Email: `fogell06@gmail.com`
- [ ] 3 strongest projects with metrics.
- [ ] Short "why hire me" summary.

---

## 9. Build Phases

## Phase 1 — Foundation
- Finalize requirements.
- Finalize copy and CV asset.
- Lock design direction.

## Phase 2 — UX + Core Pages
- Implement Home / Projects / Experience / Contact.
- Add polished responsive design.

## Phase 3 — AI Assistant
- Improve prompt and retrieval quality.
- Add recruiter preset prompts.
- Add fallback and error states.

## Phase 4 — Proof + Polish
- Add analytics events.
- Improve performance and accessibility.
- Final QA pass.

---

## 10. Recruiter Prompt Set (ready to ship)

- "Give me a 30-second summary of Harel."
- "What are Harel's strongest backend skills?"
- "Show one example of distributed systems ownership."
- "Why is Harel a good fit for a full-stack role?"
- "What cloud and DevOps tools has Harel used in production?"

---

## 11. Definition of Done (MVP)

- Recruiter can understand profile in less than 1 minute.
- CV, LinkedIn, GitHub, and email actions are obvious and working.
- AI assistant answers common hiring questions accurately.
- Site looks premium on desktop and mobile.
- Content is consistent and non-inflated.
