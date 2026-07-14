use std::{
    path::PathBuf,
    sync::{Arc, Mutex, atomic::AtomicBool},
};

use codex_quota_core::{Database, SharedCollectorState};
use tokio::sync::Notify;

pub struct AppState {
    pub database: Arc<Mutex<Database>>,
    pub collector_state: SharedCollectorState,
    pub collector_paused: Arc<AtomicBool>,
    pub collector_refresh: Arc<Notify>,
    pub data_dir: PathBuf,
}
