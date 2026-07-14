use std::{fs, process::Command, sync::atomic::Ordering};

use chrono::Utc;
use codex_quota_core::{
    ActivityEvent, AlertRecord, AppSettings, CollectorState, Pace, QuotaSnapshot, TrendPoint,
    UsageSpeeds, calculate_pace, calculate_speeds,
};
use serde::Serialize;
use tauri::{AppHandle, State};
use tauri_plugin_autostart::ManagerExt;

use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardData {
    snapshot: QuotaSnapshot,
    history: Vec<TrendPoint>,
    speeds: UsageSpeeds,
    pace: Pace,
    collector: CollectorState,
}

fn dashboard(state: &AppState) -> Result<DashboardData, String> {
    let now = Utc::now().timestamp();
    let database = state.database.lock().map_err(|_| "database lock poisoned".to_owned())?;
    let snapshot = database
        .latest_any_snapshot()
        .map_err(|error| error.to_string())?
        .unwrap_or_else(|| QuotaSnapshot {
            limit_id: "codex".into(),
            limit_name: Some("Codex".into()),
            created_at: now,
            windows: Vec::new(),
        });
    let history = snapshot
        .windows
        .first()
        .map(|window| {
            database.history(&snapshot.limit_id, window.window_minutes, now - 30 * 86_400)
        })
        .transpose()
        .map_err(|error| error.to_string())?
        .unwrap_or_default();
    let speeds = calculate_speeds(&history, now);
    let pace = snapshot.windows.first().map(|window| calculate_pace(window, now)).unwrap_or(Pace {
        time_progress: 0.0,
        usage_progress: 0.0,
        status: codex_quota_core::PaceStatus::Normal,
    });
    let collector = state
        .collector_state
        .read()
        .map_err(|_| "collector state lock poisoned".to_owned())?
        .clone();
    Ok(DashboardData { snapshot, history, speeds, pace, collector })
}

#[tauri::command]
pub fn get_dashboard(state: State<'_, AppState>) -> Result<DashboardData, String> {
    dashboard(&state)
}

#[tauri::command]
pub fn refresh_quota(state: State<'_, AppState>) -> Result<DashboardData, String> {
    state.collector_refresh.notify_one();
    dashboard(&state)
}

#[tauri::command]
pub fn get_activity(state: State<'_, AppState>) -> Result<Vec<ActivityEvent>, String> {
    state
        .database
        .lock()
        .map_err(|_| "database lock poisoned".to_owned())?
        .recent_events(200)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_alerts(state: State<'_, AppState>) -> Result<Vec<AlertRecord>, String> {
    state
        .database
        .lock()
        .map_err(|_| "database lock poisoned".to_owned())?
        .recent_alerts(100)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    state
        .database
        .lock()
        .map_err(|_| "database lock poisoned".to_owned())?
        .load_settings()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_settings(
    app: AppHandle,
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    settings.validate().map_err(str::to_owned)?;
    state
        .database
        .lock()
        .map_err(|_| "database lock poisoned".to_owned())?
        .save_settings(&settings)
        .map_err(|error| error.to_string())?;
    let autolaunch = app.autolaunch();
    if settings.launch_at_login { autolaunch.enable() } else { autolaunch.disable() }
        .map_err(|error| error.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn set_collector_paused(state: State<'_, AppState>, paused: bool) {
    state.collector_paused.store(paused, Ordering::Relaxed);
}

#[tauri::command]
pub fn export_data(state: State<'_, AppState>) -> Result<Option<String>, String> {
    let csv = state
        .database
        .lock()
        .map_err(|_| "database lock poisoned".to_owned())?
        .export_csv()
        .map_err(|error| error.to_string())?;
    let export_dir = state.data_dir.join("exports");
    fs::create_dir_all(&export_dir).map_err(|error| error.to_string())?;
    let path =
        export_dir.join(format!("codex-quota-trends-{}.csv", Utc::now().format("%Y%m%d-%H%M%S")));
    fs::write(&path, csv).map_err(|error| error.to_string())?;
    Ok(Some(path.to_string_lossy().into_owned()))
}

#[tauri::command]
pub fn open_data_folder(state: State<'_, AppState>) -> Result<(), String> {
    Command::new("open").arg(&state.data_dir).spawn().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reset_local_data(state: State<'_, AppState>) -> Result<(), String> {
    state
        .database
        .lock()
        .map_err(|_| "database lock poisoned".to_owned())?
        .reset_local_data()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}
