#!/bin/bash
# Run Agent for Test Server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export TMUX_REMOTE_CONFIG="$SCRIPT_DIR/config-test.yml"

echo "Starting Test Server Agent..."
echo "Config: $TMUX_REMOTE_CONFIG"

cd "$SCRIPT_DIR"
./mvnw spring-boot:run
