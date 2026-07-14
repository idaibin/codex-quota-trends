set shell := ["zsh", "-cu"]

install:
  cd apps/gui && npm install

dev:
  cd apps/gui && npm run dev

dev-gui:
  cd apps/gui && npm run tauri dev

fmt:
  cargo fmt --all -- --check
  cd apps/gui && npm run format

check:
  cargo check --workspace --all-targets
  cargo clippy --workspace --all-targets -- -D warnings
  cd apps/gui && npm run check

test:
  cargo test --workspace --all-targets
  cd apps/gui && npm run test

build:
  cargo build --workspace
  cd apps/gui && npm run build

build-gui:
  cd apps/gui && npm run tauri build -- --debug --bundles app --config '{"bundle":{"createUpdaterArtifacts":false}}'
