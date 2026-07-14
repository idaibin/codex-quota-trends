use std::{process::Stdio, time::Duration};

use serde_json::{Value, json};
use thiserror::Error;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader, Lines},
    process::{Child, ChildStdin, ChildStdout, Command},
    time::timeout,
};

use super::AppServerMessage;

#[derive(Debug, Error)]
pub enum AppServerError {
    #[error("failed to start Codex app-server: {0}")]
    Start(#[source] std::io::Error),
    #[error("Codex app-server did not expose {0}")]
    MissingPipe(&'static str),
    #[error("Codex app-server I/O failed: {0}")]
    Io(#[from] std::io::Error),
    #[error("Codex app-server returned invalid JSON: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Codex app-server request timed out")]
    Timeout,
    #[error("Codex app-server closed the connection")]
    Closed,
    #[error("Codex app-server error {code}: {message}")]
    Rpc { code: i64, message: String },
}

pub struct AppServerClient {
    child: Child,
    stdin: ChildStdin,
    lines: Lines<BufReader<ChildStdout>>,
    next_id: i64,
}

impl AppServerClient {
    pub async fn start() -> Result<Self, AppServerError> {
        let mut child = Command::new("codex")
            .args(["app-server", "--listen", "stdio://"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .kill_on_drop(true)
            .spawn()
            .map_err(AppServerError::Start)?;
        let stdin = child.stdin.take().ok_or(AppServerError::MissingPipe("stdin"))?;
        let stdout = child.stdout.take().ok_or(AppServerError::MissingPipe("stdout"))?;
        let mut client = Self { child, stdin, lines: BufReader::new(stdout).lines(), next_id: 1 };
        client.initialize().await?;
        Ok(client)
    }

    async fn initialize(&mut self) -> Result<(), AppServerError> {
        self.request("initialize", json!({
            "clientInfo": { "name": "codex_quota_trends", "title": "Codex Quota Trends", "version": env!("CARGO_PKG_VERSION") },
            "capabilities": { "experimentalApi": true }
        })).await?;
        self.send(json!({ "method": "initialized", "params": {} })).await
    }

    pub async fn read_account(&mut self) -> Result<Value, AppServerError> {
        self.request("account/read", json!({ "refreshToken": false })).await
    }

    pub async fn read_rate_limits(&mut self) -> Result<Value, AppServerError> {
        self.request("account/rateLimits/read", Value::Null).await
    }

    pub async fn next_message(&mut self) -> Result<AppServerMessage, AppServerError> {
        self.read_message().await
    }

    async fn request(&mut self, method: &str, params: Value) -> Result<Value, AppServerError> {
        let id = self.next_id;
        self.next_id += 1;
        self.send(json!({ "id": id, "method": method, "params": params })).await?;
        timeout(Duration::from_secs(15), async {
            loop {
                let message = self.read_message().await?;
                if message.id != Some(id) {
                    continue;
                }
                if let Some(error) = message.error {
                    return Err(AppServerError::Rpc { code: error.code, message: error.message });
                }
                return message.result.ok_or(AppServerError::Closed);
            }
        })
        .await
        .map_err(|_| AppServerError::Timeout)?
    }

    async fn send(&mut self, value: Value) -> Result<(), AppServerError> {
        let mut bytes = serde_json::to_vec(&value)?;
        bytes.push(b'\n');
        self.stdin.write_all(&bytes).await?;
        self.stdin.flush().await?;
        Ok(())
    }

    async fn read_message(&mut self) -> Result<AppServerMessage, AppServerError> {
        let line = self.lines.next_line().await?.ok_or(AppServerError::Closed)?;
        serde_json::from_str(&line).map_err(AppServerError::Json)
    }
}

impl Drop for AppServerClient {
    fn drop(&mut self) {
        let _ = self.child.start_kill();
    }
}
