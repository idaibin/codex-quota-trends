mod commands;
mod state;

use std::{
    fs,
    sync::{Arc, Mutex},
};

use codex_quota_core::{CollectorConfig, CollectorRuntime, Database};
use state::AppState;
use tauri::{
    Manager, PhysicalPosition, RunEvent, WindowEvent,
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_notification::NotificationExt;

fn show_main(app: &tauri::AppHandle, route: Option<&str>) {
    if let Some(window) = app.get_webview_window("main") {
        if route == Some("settings") {
            let _ = window.eval(
                "window.dispatchEvent(new CustomEvent('cqt-route-requested', { detail: 'settings' }))",
            );
        }
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn toggle_tray(app: &tauri::AppHandle, anchor_x: f64, anchor_y: f64) {
    let Some(window) = app.get_webview_window("tray") else { return };
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
        return;
    }
    let scale = window.scale_factor().unwrap_or(1.0);
    let width = window.outer_size().map(|size| size.width as f64).unwrap_or(520.0 * scale);
    let _ = window
        .set_position(PhysicalPosition::new((anchor_x - width / 2.0).max(8.0), anchor_y + 10.0));
    let _ = window.show();
    let _ = window.set_focus();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let data_dir = app.path().app_data_dir()?;
            fs::create_dir_all(&data_dir)?;
            let database = Arc::new(Mutex::new(Database::open(data_dir.join("quota-trends.db"))?));
            let notification_database = Arc::clone(&database);
            let runtime = CollectorRuntime::new(Arc::clone(&database), CollectorConfig::default());
            let state = AppState {
                database,
                collector_state: runtime.state(),
                collector_paused: runtime.paused_flag(),
                collector_refresh: runtime.refresh_notifier(),
                data_dir,
            };
            app.manage(state);
            tauri::async_runtime::spawn(runtime.run());

            let notification_app = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut last_seen_id = notification_database
                    .lock()
                    .ok()
                    .and_then(|database| database.recent_alerts(1).ok())
                    .and_then(|alerts| alerts.first().map(|alert| alert.id))
                    .unwrap_or_default();
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    let Some((enabled, mut alerts)) =
                        notification_database.lock().ok().and_then(|database| {
                            Some((
                                database.load_settings().ok()?.desktop_notifications,
                                database.recent_alerts(25).ok()?,
                            ))
                        })
                    else {
                        continue;
                    };
                    alerts.sort_by_key(|alert| alert.id);
                    for alert in alerts {
                        if alert.id <= last_seen_id {
                            continue;
                        }
                        last_seen_id = alert.id;
                        if enabled {
                            let _ = notification_app
                                .notification()
                                .builder()
                                .title(&alert.title)
                                .body(&alert.message)
                                .show();
                        }
                    }
                }
            });

            let dashboard =
                MenuItem::with_id(app, "dashboard", "Open Dashboard", true, None::<&str>)?;
            let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
            let quit =
                MenuItem::with_id(app, "quit", "Quit Codex Quota Trends", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&dashboard, &settings, &quit])?;
            TrayIconBuilder::with_id("codex-quota-trends-tray")
                .icon(Image::new(include_bytes!("../icons/icon.rgba"), 128, 128))
                .tooltip("Codex Quota Trends")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        rect,
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let scale = tray
                            .app_handle()
                            .primary_monitor()
                            .ok()
                            .flatten()
                            .map(|monitor| monitor.scale_factor())
                            .unwrap_or(1.0);
                        let position = rect.position.to_physical::<f64>(scale);
                        let size = rect.size.to_physical::<f64>(scale);
                        toggle_tray(
                            tray.app_handle(),
                            position.x + size.width / 2.0,
                            position.y + size.height,
                        );
                    }
                })
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "dashboard" => show_main(app, None),
                    "settings" => show_main(app, Some("settings")),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_dashboard,
            commands::refresh_quota,
            commands::get_activity,
            commands::get_alerts,
            commands::get_settings,
            commands::save_settings,
            commands::set_collector_paused,
            commands::export_data,
            commands::open_data_folder,
            commands::get_database_stats,
            commands::cleanup_database,
            commands::reset_local_data,
            commands::quit_app,
        ])
        .build(tauri::generate_context!())
        .expect("failed to build Codex Quota Trends");

    app.run(|handle, event| match event {
        RunEvent::WindowEvent { label, event: WindowEvent::CloseRequested { api, .. }, .. }
            if label == "main" =>
        {
            api.prevent_close();
            if let Some(window) = handle.get_webview_window("main") {
                let _ = window.hide();
            }
        }
        RunEvent::WindowEvent { label, event: WindowEvent::Focused(false), .. }
            if label == "tray" =>
        {
            if let Some(window) = handle.get_webview_window("tray") {
                let _ = window.hide();
            }
        }
        _ => {}
    });
}
