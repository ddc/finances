#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=/opt/containers/finances
pushd "$PROJECT_DIR" > /dev/null

docker compose down
docker volume rm -f finances_static_files > /dev/null
docker images 'finances*' -a -q | xargs -r docker rmi -f

docker compose up -d --build --force-recreate

popd > /dev/null
