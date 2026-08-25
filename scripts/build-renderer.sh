#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export COPYFILE_DISABLE=1

command -v wasm-pack >/dev/null 2>&1 || {
  echo "wasm-pack is required. Install it with: cargo install wasm-pack" >&2
  exit 1
}

cd "$repo_root/renderer"
rm -rf pkg
wasm-pack build --target web --release --out-dir pkg
find pkg -name '._*' -delete
