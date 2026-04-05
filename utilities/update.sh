#!/usr/bin/env bash
set -euo pipefail

PROJECT_USERNAME=ddc
PROJECT_DIR=/opt/containers/finances

pushd "$PROJECT_DIR" > /dev/null

# stop containers
./utilities/stop.sh

# update project
git fetch --all
git reset --hard origin/main

# change perms
sudo chown -R "$PROJECT_USERNAME":"$PROJECT_USERNAME" "$PROJECT_DIR"
sudo find "$PROJECT_DIR" -type d -exec chmod 755 {} +
sudo find "$PROJECT_DIR" -type f -exec chmod 644 {} +
sudo chmod 600 "$PROJECT_DIR/.env"
sudo chmod 755 "$PROJECT_DIR/utilities"/*.sh

# fix nginx logs dir ownership (nginx container runs as UID 101)
sudo chown 101:101 "$PROJECT_DIR/frontend/logs"

# start containers
#./utilities/start.sh

popd > /dev/null
