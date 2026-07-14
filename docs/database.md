# Database

SQLite is the only persistent store. Migrations run transactionally when the
application opens the database.

## Tables

`quota_snapshots` stores one row per changed window. `limit_id` and
`window_minutes` form the semantic window identity; `raw_json` preserves the
source response for diagnosis without becoming the query contract.

`collector_events` stores connection, schema, quota-change, reset, and alert
events used by Activity and Alerts.

`settings` stores the small user-controlled configuration surface.

Indexes cover `(limit_id, window_minutes, created_at)` and recent event reads.
Retention deletes old snapshots and events in one transaction.
