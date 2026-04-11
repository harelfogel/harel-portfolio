# GoodTok Backend

## One-line Summary
A backend platform for an AI-focused newsletter product that collects, ranks, and serves high-signal updates about AI tools, releases, and engineering trends.

## Project Context
- GoodTok is designed for builders who want a short, useful brief of what changed in AI without reading dozens of sources.
- I built the backend so content ingestion, curation, and delivery can run reliably and be expanded over time.
- Goal: turn noisy AI news streams into a structured, product-ready feed.
- Repository: https://github.com/harelfogel/goodtok-backend

## Core Responsibilities
- Designed domain models for articles, sources, tags, and newsletter issues.
- Built APIs for content management, feed retrieval, and issue generation.
- Implemented ingestion and normalization flows so content from different sources can be ranked consistently.
- Added scheduling and background processing for recurring curation tasks.

## Architecture

### API Layer
- Exposes endpoints for feed data, issue history, and admin operations.
- Uses clear schema boundaries between ingestion records and user-facing newsletter content.
- Supports filtering by topic and recency for personalized consumption patterns.

### Curation Pipeline
- Pulls updates from configured sources.
- Normalizes metadata (title, source, timestamp, summary) into a common shape.
- Applies scoring and ranking rules to prioritize high-value updates.
- Persists curated candidates for final issue assembly.

### Delivery Layer
- Produces issue payloads that can be rendered in frontend views.
- Keeps an auditable history of published issues and candidate items.
- Enables future extensions for email distribution and audience segmentation.

## Technical Decisions
- Kept ingestion, scoring, and publishing concerns separated to avoid tight coupling.
- Modeled content with explicit tags and categories so retrieval can be both human-friendly and machine-friendly.
- Designed backend contracts around frontend rendering needs to reduce view-layer complexity.

## Stack
- Backend: Node.js, TypeScript (service-oriented API design)
- Data: relational persistence for issue history and source content metadata
- Infrastructure: containerized deployment-ready service structure

## Why It Matters
- Demonstrates product-minded backend engineering, not only API implementation.
- Shows ability to translate ambiguous product intent into stable data contracts.
- Highlights ownership of both system design and practical execution for a real full-stack product.
