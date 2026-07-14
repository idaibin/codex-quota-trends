use std::path::Path;

use anyhow::{Context, Result};
use rusqlite::{Connection, OptionalExtension, params};
use serde::{Deserialize, Serialize};

use crate::quota::{AlertRecord, AppSettings, QuotaSnapshot, QuotaWindow, TrendPoint};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEvent {
    pub id: i64,
    pub created_at: i64,
    pub event_type: String,
    pub title: String,
    pub message: String,
    pub delta: Option<f64>,
}

pub struct Database {
    connection: Connection,
}

impl Database {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let connection = Connection::open(path.as_ref()).with_context(|| {
            format!("failed to open SQLite database at {}", path.as_ref().display())
        })?;
        connection.pragma_update(None, "journal_mode", "WAL")?;
        connection.pragma_update(None, "foreign_keys", "ON")?;
        let mut database = Self { connection };
        database.migrate()?;
        Ok(database)
    }

    pub fn open_in_memory() -> Result<Self> {
        let connection = Connection::open_in_memory()?;
        let mut database = Self { connection };
        database.migrate()?;
        Ok(database)
    }

    fn migrate(&mut self) -> Result<()> {
        self.connection.execute_batch(
            "BEGIN;
            CREATE TABLE IF NOT EXISTS quota_snapshots(
              id INTEGER PRIMARY KEY,
              created_at INTEGER NOT NULL,
              limit_id TEXT NOT NULL,
              limit_name TEXT,
              window_minutes INTEGER,
              used_percent REAL NOT NULL,
              reset_at INTEGER,
              raw_json TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_quota_history ON quota_snapshots(limit_id, window_minutes, created_at DESC);
            CREATE TABLE IF NOT EXISTS collector_events(
              id INTEGER PRIMARY KEY,
              created_at INTEGER NOT NULL,
              event_type TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              delta REAL
            );
            CREATE INDEX IF NOT EXISTS idx_collector_events_created ON collector_events(created_at DESC);
            CREATE TABLE IF NOT EXISTS alerts(
              id INTEGER PRIMARY KEY,
              created_at INTEGER NOT NULL,
              alert_type TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              severity TEXT NOT NULL,
              status TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
            CREATE TABLE IF NOT EXISTS settings(
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            PRAGMA user_version = 1;
            COMMIT;",
        )?;
        Ok(())
    }

    pub fn save_snapshot_if_changed(
        &mut self,
        snapshot: &QuotaSnapshot,
        raw_json: &str,
    ) -> Result<bool> {
        if self
            .latest_snapshot(&snapshot.limit_id)?
            .is_some_and(|previous| same_quota_usage(&previous.windows, &snapshot.windows))
        {
            return Ok(false);
        }
        let transaction = self.connection.transaction()?;
        for window in &snapshot.windows {
            transaction.execute(
                "INSERT INTO quota_snapshots(created_at, limit_id, limit_name, window_minutes, used_percent, reset_at, raw_json) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![snapshot.created_at, snapshot.limit_id, snapshot.limit_name, window.window_minutes.map(|value| value as i64), window.used_percent, window.reset_at, raw_json],
            )?;
        }
        transaction.commit()?;
        Ok(true)
    }

    pub fn latest_snapshot(&self, limit_id: &str) -> Result<Option<QuotaSnapshot>> {
        let created_at: Option<i64> = self.connection.query_row(
            "SELECT MAX(created_at) FROM quota_snapshots WHERE limit_id = ?1",
            [limit_id],
            |row| row.get(0),
        )?;
        let Some(created_at) = created_at else { return Ok(None) };
        let limit_name: Option<String> = self.connection.query_row(
            "SELECT limit_name FROM quota_snapshots WHERE limit_id = ?1 AND created_at = ?2 LIMIT 1",
            params![limit_id, created_at], |row| row.get(0),
        )?;
        let mut statement = self.connection.prepare(
            "SELECT window_minutes, used_percent, reset_at FROM quota_snapshots WHERE limit_id = ?1 AND created_at = ?2 ORDER BY COALESCE(window_minutes, 0) DESC",
        )?;
        let windows = statement
            .query_map(params![limit_id, created_at], |row| {
                Ok(QuotaWindow {
                    window_minutes: row.get::<_, Option<i64>>(0)?.map(|value| value as u64),
                    used_percent: row.get(1)?,
                    reset_at: row.get(2)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        Ok(Some(QuotaSnapshot { limit_id: limit_id.to_owned(), limit_name, created_at, windows }))
    }

    pub fn latest_any_snapshot(&self) -> Result<Option<QuotaSnapshot>> {
        let limit_id = self
            .connection
            .query_row(
                "SELECT snapshot.limit_id
                 FROM quota_snapshots AS snapshot
                 INNER JOIN (
                   SELECT limit_id, MAX(created_at) AS created_at
                   FROM quota_snapshots
                   GROUP BY limit_id
                 ) AS latest
                 ON latest.limit_id = snapshot.limit_id
                    AND latest.created_at = snapshot.created_at
                 ORDER BY snapshot.used_percent DESC, snapshot.created_at DESC, snapshot.id ASC
                 LIMIT 1",
                [],
                |row| row.get::<_, String>(0),
            )
            .optional()?;
        limit_id.map(|value| self.latest_snapshot(&value)).transpose().map(Option::flatten)
    }

    pub fn history(
        &self,
        limit_id: &str,
        window_minutes: Option<u64>,
        since: i64,
    ) -> Result<Vec<TrendPoint>> {
        let mut statement = self.connection.prepare(
            "SELECT created_at, used_percent FROM quota_snapshots WHERE limit_id = ?1 AND window_minutes IS ?2 AND created_at >= ?3 ORDER BY created_at ASC",
        )?;
        Ok(statement
            .query_map(params![limit_id, window_minutes.map(|value| value as i64), since], |row| {
                Ok(TrendPoint { timestamp: row.get(0)?, used_percent: row.get(1)? })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?)
    }

    pub fn add_event(
        &self,
        created_at: i64,
        event_type: &str,
        title: &str,
        message: &str,
        delta: Option<f64>,
    ) -> Result<()> {
        self.connection.execute(
            "INSERT INTO collector_events(created_at, event_type, title, message, delta) VALUES(?1, ?2, ?3, ?4, ?5)",
            params![created_at, event_type, title, message, delta],
        )?;
        Ok(())
    }

    pub fn recent_events(&self, limit: usize) -> Result<Vec<ActivityEvent>> {
        let mut statement = self.connection.prepare(
            "SELECT id, created_at, event_type, title, message, delta FROM collector_events ORDER BY created_at DESC LIMIT ?1",
        )?;
        Ok(statement
            .query_map([limit as i64], |row| {
                Ok(ActivityEvent {
                    id: row.get(0)?,
                    created_at: row.get(1)?,
                    event_type: row.get(2)?,
                    title: row.get(3)?,
                    message: row.get(4)?,
                    delta: row.get(5)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?)
    }

    pub fn add_alert(&self, alert: &AlertRecord) -> Result<()> {
        self.connection.execute(
            "INSERT INTO alerts(created_at, alert_type, title, message, severity, status) VALUES(?1, ?2, ?3, ?4, ?5, ?6)",
            params![alert.created_at, enum_json(&alert.alert_type)?, alert.title, alert.message, enum_json(&alert.severity)?, enum_json(&alert.status)?],
        )?;
        Ok(())
    }

    pub fn recent_alerts(&self, limit: usize) -> Result<Vec<AlertRecord>> {
        let mut statement = self.connection.prepare(
            "SELECT id, created_at, alert_type, title, message, severity, status FROM alerts ORDER BY created_at DESC LIMIT ?1",
        )?;
        Ok(statement
            .query_map([limit as i64], |row| {
                let alert_type: String = row.get(2)?;
                let severity: String = row.get(5)?;
                let status: String = row.get(6)?;
                Ok(AlertRecord {
                    id: row.get(0)?,
                    created_at: row.get(1)?,
                    alert_type: parse_enum(&alert_type)?,
                    title: row.get(3)?,
                    message: row.get(4)?,
                    severity: parse_enum(&severity)?,
                    status: parse_enum(&status)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?)
    }

    pub fn load_settings(&self) -> Result<AppSettings> {
        let value = self
            .connection
            .query_row("SELECT value FROM settings WHERE key = 'app'", [], |row| {
                row.get::<_, String>(0)
            })
            .optional()?;
        value
            .map(|json| serde_json::from_str(&json).context("invalid stored app settings"))
            .transpose()
            .map(|settings| settings.unwrap_or_default())
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<()> {
        settings.validate().map_err(anyhow::Error::msg)?;
        let value = serde_json::to_string(settings)?;
        self.connection.execute("INSERT INTO settings(key, value) VALUES('app', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [value])?;
        Ok(())
    }

    pub fn apply_retention(&self, now: i64, retention_days: u64) -> Result<usize> {
        let cutoff = now - retention_days as i64 * 86_400;
        let transaction = self.connection.unchecked_transaction()?;
        let mut deleted =
            transaction.execute("DELETE FROM quota_snapshots WHERE created_at < ?1", [cutoff])?;
        deleted +=
            transaction.execute("DELETE FROM collector_events WHERE created_at < ?1", [cutoff])?;
        deleted += transaction.execute("DELETE FROM alerts WHERE created_at < ?1", [cutoff])?;
        transaction.commit()?;
        Ok(deleted)
    }

    pub fn reset_local_data(&self) -> Result<()> {
        self.connection.execute_batch("BEGIN; DELETE FROM quota_snapshots; DELETE FROM collector_events; DELETE FROM alerts; COMMIT;")?;
        Ok(())
    }

    pub fn export_csv(&self) -> Result<String> {
        let mut output = String::from("created_at,limit_id,window_minutes,used_percent,reset_at\n");
        let mut statement = self.connection.prepare("SELECT created_at, limit_id, window_minutes, used_percent, reset_at FROM quota_snapshots ORDER BY created_at ASC")?;
        let rows = statement.query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<i64>>(2)?,
                row.get::<_, f64>(3)?,
                row.get::<_, Option<i64>>(4)?,
            ))
        })?;
        for row in rows {
            let (created_at, limit_id, window_minutes, used_percent, reset_at) = row?;
            output.push_str(&format!(
                "{created_at},{},{},{used_percent},{}\n",
                csv_escape(&limit_id),
                window_minutes.map_or_else(String::new, |value| value.to_string()),
                reset_at.map_or_else(String::new, |value| value.to_string())
            ));
        }
        Ok(output)
    }
}

fn enum_json<T: Serialize>(value: &T) -> Result<String> {
    Ok(serde_json::to_string(value)?.trim_matches('"').to_owned())
}

fn parse_enum<T: for<'de> Deserialize<'de>>(value: &str) -> rusqlite::Result<T> {
    serde_json::from_str(&format!("\"{value}\"")).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(error))
    })
}

fn csv_escape(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

fn same_quota_usage(previous: &[QuotaWindow], current: &[QuotaWindow]) -> bool {
    if previous.len() != current.len() {
        return false;
    }
    let mut previous_usage = previous
        .iter()
        .map(|window| (window.window_minutes, window.used_percent.to_bits()))
        .collect::<Vec<_>>();
    let mut current_usage = current
        .iter()
        .map(|window| (window.window_minutes, window.used_percent.to_bits()))
        .collect::<Vec<_>>();
    previous_usage.sort_unstable();
    current_usage.sort_unstable();
    previous_usage == current_usage
}

#[cfg(test)]
mod tests {
    use super::*;

    fn snapshot(at: i64, used: f64) -> QuotaSnapshot {
        QuotaSnapshot {
            limit_id: "codex".into(),
            limit_name: Some("Codex".into()),
            created_at: at,
            windows: vec![QuotaWindow {
                window_minutes: Some(300),
                used_percent: used,
                reset_at: Some(9_999),
            }],
        }
    }

    #[test]
    fn persists_only_changed_snapshots() {
        let mut unchanged = snapshot(200, 10.0);
        unchanged.windows[0].reset_at = Some(10_999);
        unchanged.windows.push(QuotaWindow {
            window_minutes: Some(10_080),
            used_percent: 20.0,
            reset_at: Some(20_000),
        });
        let mut initial = snapshot(100, 10.0);
        initial.windows.push(QuotaWindow {
            window_minutes: Some(10_080),
            used_percent: 20.0,
            reset_at: Some(19_000),
        });
        let mut database = Database::open_in_memory().unwrap();
        assert!(database.save_snapshot_if_changed(&initial, "{}").unwrap());
        unchanged.windows.reverse();
        assert!(!database.save_snapshot_if_changed(&unchanged, "{}").unwrap());
        assert!(database.save_snapshot_if_changed(&snapshot(300, 11.0), "{}").unwrap());
        assert_eq!(database.history("codex", Some(300), 0).unwrap().len(), 2);
    }

    #[test]
    fn settings_round_trip() {
        let database = Database::open_in_memory().unwrap();
        let settings = AppSettings { retention_days: 180, ..AppSettings::default() };
        database.save_settings(&settings).unwrap();
        assert_eq!(database.load_settings().unwrap(), settings);
    }

    #[test]
    fn dashboard_prefers_the_most_used_latest_limit() {
        let mut database = Database::open_in_memory().unwrap();
        let mut primary = snapshot(100, 32.0);
        primary.limit_id = "primary".into();
        let mut supplemental = snapshot(200, 0.0);
        supplemental.limit_id = "supplemental".into();
        database.save_snapshot_if_changed(&primary, "{}").unwrap();
        database.save_snapshot_if_changed(&supplemental, "{}").unwrap();

        assert_eq!(database.latest_any_snapshot().unwrap().unwrap().limit_id, "primary");
    }

    #[test]
    fn retention_removes_old_rows() {
        let mut database = Database::open_in_memory().unwrap();
        database.save_snapshot_if_changed(&snapshot(100, 10.0), "{}").unwrap();
        assert_eq!(database.apply_retention(100 + 91 * 86_400, 90).unwrap(), 1);
    }
}
