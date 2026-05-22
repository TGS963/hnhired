# Workflows

## Required secrets

- `DATABASE_URL` — Postgres connection string for migrations and ingest.
- `GOOGLE_API_KEY` — API key for Google services used by the extractor.

## Optional secrets

- `SLACK_WEBHOOK_URL` — Incoming webhook URL for failure notifications. If unset, the Slack notify step is skipped.
