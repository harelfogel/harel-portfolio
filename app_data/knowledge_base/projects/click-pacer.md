# Click Pacer Infrastructure

## One-line Summary
A distributed system that slices massive click datasets into batches, queues them, and enforces pacing/capping rules at scale — processing millions of daily clicks.

## Problem
- The Varys advertising platform needed to pace click delivery across large-scale campaigns without overwhelming downstream partner systems.
- Required reliable, high-throughput batching and dispatch with strict pacing rules (rate limits, daily caps, budget constraints).
- Existing approach couldn't handle the volume — needed a purpose-built system with clear operational control.

## Architecture

### Click Pacer Service
- Core orchestration service that slices incoming click datasets into manageable batches.
- Enforces per-campaign pacing rules: rate limits, daily caps, and budget-based throttling.
- Runs on AWS ECS Fargate with auto-scaling based on queue depth and processing lag.

### Traffic Bridge
- Intermediary service that routes batched clicks to downstream partner endpoints.
- Handles partner-specific formatting, retry logic, and delivery confirmation.
- Decouples the pacing logic from delivery concerns for independent scaling.

### Backend (NestJS + FastAPI)
- NestJS handles campaign configuration, pacing rule management, and real-time dashboard APIs.
- FastAPI powers high-throughput data processing pipelines and analytics aggregation.
- PostgreSQL stores click queues, batch state, and campaign configuration.
- DynamoDB handles high-velocity event logging and campaign lookup via GSI patterns.

### Frontend (React)
- Real-time campaign dashboard showing pacing progress, delivery rates, and budget consumption.
- Campaign management interface for configuring pacing rules and monitoring system health.

## Key Technical Decisions

### Redis to PostgreSQL Migration
- Initially used Redis for click queue management (fast reads, simple pub/sub).
- Migrated to PostgreSQL when durability became critical — couldn't afford to lose click data on Redis restarts or memory pressure.
- PostgreSQL provided ACID guarantees for batch state transitions and atomic consumption patterns.
- Trade-off: slightly higher latency, but gained full durability, queryability, and simpler operational model.

### FOR UPDATE SKIP LOCKED Pattern
- Multiple worker instances consume batches concurrently from the same PostgreSQL queue.
- `SELECT ... FOR UPDATE SKIP LOCKED` ensures each worker grabs a unique batch without blocking others.
- Eliminates contention: workers never fight over the same rows, and failed workers don't block the queue.
- This pattern was key to achieving horizontal scalability without distributed locking infrastructure.

### DynamoDB GSI Design
- Campaign event data stored in DynamoDB for high-velocity writes and low-latency reads.
- Designed Global Secondary Indexes (GSIs) for efficient queries: by campaign ID, by time range, by partner.
- Partition key strategy avoids hot partitions under high-throughput write scenarios.

## Stack
- Backend: TypeScript, Node.js, NestJS, FastAPI (Python)
- Data: PostgreSQL, DynamoDB, Redis (caching layer)
- Infrastructure: AWS (ECS Fargate, EC2, ALB, SQS, RDS, S3, CodePipeline)
- Frontend: React, TypeScript

## Impact
- Processes millions of daily clicks with consistent sub-second pacing decisions.
- Horizontal scaling: adding workers linearly increases throughput without coordination overhead.
- Zero click data loss since PostgreSQL migration — full audit trail for every batch.
- Reduced partner throttling incidents by 90%+ through intelligent pacing.
- Production-ready CI/CD pipeline with automated deployments via AWS CodePipeline.
