#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=/opt/finances
pushd "$PROJECT_DIR" > /dev/null

docker compose down

popd > /dev/null
