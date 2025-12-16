#!/bin/bash
# Run both Test and Production Agents simultaneously

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JAR_FILE="$SCRIPT_DIR/target/agent-spring-1.0.0.jar"

# Build if JAR doesn't exist
if [ ! -f "$JAR_FILE" ]; then
    echo "Building JAR..."
    cd "$SCRIPT_DIR"
    ./mvnw package -DskipTests
fi

echo "==================================="
echo "Starting Test Server Agent..."
echo "==================================="
TMUX_REMOTE_CONFIG="$SCRIPT_DIR/config-test.yml" java -jar "$JAR_FILE" &
TEST_PID=$!
echo "Test Agent PID: $TEST_PID"

sleep 2

echo ""
echo "==================================="
echo "Starting Production Server Agent..."
echo "==================================="
TMUX_REMOTE_CONFIG="$SCRIPT_DIR/config-prod.yml" java -jar "$JAR_FILE" &
PROD_PID=$!
echo "Production Agent PID: $PROD_PID"

echo ""
echo "==================================="
echo "Both agents started!"
echo "Test Agent PID: $TEST_PID"
echo "Prod Agent PID: $PROD_PID"
echo "==================================="
echo ""
echo "To stop: kill $TEST_PID $PROD_PID"
echo "Or: pkill -f 'agent-spring'"

# Wait for both
wait
