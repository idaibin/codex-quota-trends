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
New installs retain 30 days by default. Users can set any retention period from
1 to 3650 days; saving the setting immediately deletes expired snapshots,
events, and alerts in one transaction.

The Settings page reports the on-disk size of `quota-trends.db` plus its `-wal`
and `-shm` companions. **Clean Up Database** applies the configured retention,
truncates the WAL, runs `VACUUM`, then truncates the WAL again so unused pages
are returned to disk. **Reset Local Data** uses the same compaction sequence
after deleting all history, events, and alerts. Settings are preserved.
