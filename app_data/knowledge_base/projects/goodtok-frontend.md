# GoodTok Frontend

## One-line Summary
A modern frontend experience for browsing AI newsletter issues, exploring curated updates, and quickly understanding what is new in the AI ecosystem.

## Product Goal
- Make AI news consumption simple, fast, and useful for technical users.
- Present curated content in a way that feels focused, not overwhelming.
- Bridge curation quality from backend data into a clean, high-clarity interface.
- Repository: https://github.com/harelfogel/goodtok-frontend

## Core Responsibilities
- Built issue and feed views optimized for scanning and deep reading.
- Implemented UI patterns for topic filtering, recency sorting, and source exploration.
- Integrated frontend data flows with backend APIs for issue retrieval and content rendering.
- Focused on responsive behavior so the experience works well across desktop and mobile.

## UX and Interaction Model
- Newsletter issue pages emphasize readable hierarchy and signal over noise.
- Feed cards provide fast context: headline, summary, source, and publish time.
- Topic and category controls let users narrow to specific AI areas quickly.
- The interface is tuned for short daily sessions and repeat visits.

## Technical Decisions
- Structured frontend state around issue snapshots to keep rendering deterministic.
- Used reusable presentation components so new feed sections can be added without redesigning the app.
- Kept data contracts aligned with backend schemas to reduce fragile mapping logic.

## Stack
- Frontend: React, TypeScript
- Styling/UI: component-driven layout with responsive design principles
- API integration: typed requests for predictable rendering and safer iteration

## Why It Matters
- Shows ability to build product interfaces that translate complex data into clear decisions.
- Demonstrates full-stack alignment: frontend architecture shaped by backend contract design.
- Reflects practical engineering judgment around usability, maintainability, and iteration speed.
