#!/bin/bash
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$HOME/plancraft.log"
PID_FILE="$HOME/plancraft.pid"

# Kill existing process
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  kill "$OLD_PID" 2>/dev/null && echo "Stopped old process $OLD_PID" || true
  rm -f "$PID_FILE"
fi

# Kill any orphaned node server.js
pkill -f "node server.js" 2>/dev/null || true
sleep 1

# Start fresh with nohup
cd "$DEPLOY_DIR"
PORT=3000 nohup node server.js > "$LOG" 2>&1 &
echo $! > "$PID_FILE"
sleep 2

if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
  echo "PlanCraft running on port 3000 (PID: $(cat $PID_FILE))"
else
  echo "Failed to start. Last 20 lines of log:"
  tail -20 "$LOG"
  exit 1
fi
