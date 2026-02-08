# Click Pacer Infrastructure

## One-line summary
A distributed system that slices massive click datasets into batches, queues them, and enforces pacing/capping rules at scale.

## Problem
- Needed to pace click delivery across large-scale campaigns without overwhelming downstream systems.
- Required reliable, high-throughput batching and dispatch with clear operational control.

## What I built
- High-throughput click pacing and dispatch system.
- Queueing and batch processing with Postgres and atomic consumption patterns.
- CI/CD pipelines and production deployments.

## Stack
- Backend: TypeScript, Node.js, NestJS, FastAPI
- Data: PostgreSQL, DynamoDB
- Infra: AWS (ECS, EC2, SQS, RDS)

## Highlights (impact)
- Consistent pacing and throughput under heavy traffic.
- Reliable batch processing with resilient queueing.
- Production-ready deployment pipeline.
