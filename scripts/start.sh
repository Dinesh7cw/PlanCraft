#!/bin/bash
DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG="$HOME/plancraft.log"
PID_FILE="$HOME/plancraft.pid"

echo "[start.sh] Deploy dir: $DEPLOY_DIR"
echo "[start.sh] Node: $(node --version)"
echo "[start.sh] .env.local exists: $(test -f $DEPLOY_DIR/.env.local && echo YES || echo NO)"

# Kill existing process
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  kill "$OLD_PID" 2>/dev/null && echo "[start.sh] Killed old PID $OLD_PID" || true
  rm -f "$PID_FILE"
fi
pkill -f "node server.js" 2>/dev/null || true
sleep 2

# Start
cd "$DEPLOY_DIR"
echo "[start.sh] Starting: PORT=3000 node server.js"
PORT=3000 nohup node server.js >> "$LOG" 2>&1 &
NEW_PID=$!
echo $NEW_PID > "$PID_FILE"
echo "[start.sh] Started PID: $NEW_PID"

# Wait longer and verify
sleep 5
if kill -0 $NEW_PID 2>/dev/null; then
  echo "[start.sh] SUCCESS — process alive after 5s"
  # Test if port 3000 is actually listening
  sleep 2
  curl -s -o /dev/null -w "[start.sh] Health check HTTP: %{http_code}\n" http://localhost:3000 || echo "[start.sh] curl to localhost:3000 failed"
else
  echo "[start.sh] FAILED — process died. Log:"
  tail -50 "$LOG"
  exit 1
fi
