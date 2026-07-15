use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    current_version: String,
    available: bool,
    target_version: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInstallResult {
    installed: bool,
    target_version: Option<String>,
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> Result<UpdateCheckResult, String> {
    let current_version = app.package_info().version.to_string();
    let update = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    Ok(match update {
        Some(update) => UpdateCheckResult {
            current_version,
            available: true,
            target_version: Some(update.version),
            notes: update.body,
        },
        None => UpdateCheckResult {
            current_version,
            available: false,
            target_version: None,
            notes: None,
        },
    })
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<UpdateInstallResult, String> {
    let Some(update) = app
        .updater()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?
    else {
        return Ok(UpdateInstallResult { installed: false, target_version: None });
    };
    let target_version = update.version.clone();
    update.download_and_install(|_, _| {}, || {}).await.map_err(|error| error.to_string())?;

    Ok(UpdateInstallResult { installed: true, target_version: Some(target_version) })
}

#[tauri::command]
pub fn restart_app(app: AppHandle) {
    app.request_restart();
}
