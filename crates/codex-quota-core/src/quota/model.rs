use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaSnapshot {
    pub limit_id: String,
    pub limit_name: Option<String>,
    pub created_at: i64,
    pub windows: Vec<QuotaWindow>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaWindow {
    pub window_minutes: Option<u64>,
    pub used_percent: f64,
    pub reset_at: Option<i64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendPoint {
    pub timestamp: i64,
    pub used_percent: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Light,
    Dark,
    #[default]
    System,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub poll_interval_seconds: u64,
    pub rapid_drain_percent: f64,
    pub rapid_drain_minutes: u64,
    pub offline_threshold_minutes: u64,
    pub launch_at_login: bool,
    pub launch_menu_bar_only: bool,
    pub desktop_notifications: bool,
    pub daily_summary: bool,
    pub retention_days: u64,
    pub theme: ThemeMode,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            poll_interval_seconds: 60,
            rapid_drain_percent: 5.0,
            rapid_drain_minutes: 10,
            offline_threshold_minutes: 5,
            launch_at_login: false,
            launch_menu_bar_only: false,
            desktop_notifications: true,
            daily_summary: false,
            retention_days: 30,
            theme: ThemeMode::System,
        }
    }
}

impl AppSettings {
    pub fn validate(&self) -> Result<(), &'static str> {
        if !(15..=3_600).contains(&self.poll_interval_seconds) {
            return Err("poll interval must be between 15 and 3600 seconds");
        }
        if !(0.1..=100.0).contains(&self.rapid_drain_percent) {
            return Err("rapid drain threshold must be between 0.1 and 100 percent");
        }
        if !(1..=1_440).contains(&self.rapid_drain_minutes) {
            return Err("rapid drain window must be between 1 and 1440 minutes");
        }
        if !(1..=1_440).contains(&self.offline_threshold_minutes) {
            return Err("offline threshold must be between 1 and 1440 minutes");
        }
        if !(1..=365).contains(&self.retention_days) {
            return Err("retention must be between 1 and 365 days");
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::AppSettings;

    #[test]
    fn default_settings_are_valid() {
        let settings = AppSettings::default();
        assert_eq!(settings.retention_days, 30);
        assert!(settings.validate().is_ok());
    }

    #[test]
    fn rejects_unsafe_poll_interval() {
        let settings = AppSettings { poll_interval_seconds: 1, ..AppSettings::default() };
        assert_eq!(settings.validate(), Err("poll interval must be between 15 and 3600 seconds"));
    }

    #[test]
    fn rejects_retention_over_one_year() {
        let settings = AppSettings { retention_days: 366, ..AppSettings::default() };
        assert_eq!(settings.validate(), Err("retention must be between 1 and 365 days"));
    }
}
