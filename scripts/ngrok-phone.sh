#!/usr/bin/env bash
# Tunnels the local Java API through ngrok and points the Expo client at the
# public URL so the app can run on a physical phone. Restores client/.env
# (the simulator origin) when the tunnel is stopped with Ctrl+C.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/client/.env"
API_PORT=8080
NGROK_API="http://127.0.0.1:4040/api/tunnels"

if ! command -v ngrok >/dev/null; then
  echo "ngrok is not installed. Run: brew install ngrok" >&2
  exit 1
fi

if ! ngrok config check >/dev/null 2>&1; then
  echo "ngrok needs an authtoken (free account)." >&2
  echo "1. Sign up / log in at https://dashboard.ngrok.com" >&2
  echo "2. Copy the token from https://dashboard.ngrok.com/get-started/your-authtoken" >&2
  echo "3. Run: ngrok config add-authtoken <YOUR_TOKEN>" >&2
  exit 1
fi

if ! curl -sf "http://127.0.0.1:$API_PORT" -o /dev/null --max-time 2; then
  echo "Warning: nothing is responding on port $API_PORT yet." >&2
  echo "Start the API first: cd server && ./mvnw spring-boot:run" >&2
fi

ORIGINAL_ENV="$(cat "$ENV_FILE")"

restore_env() {
  printf '%s\n' "$ORIGINAL_ENV" > "$ENV_FILE"
  echo
  echo "Tunnel closed. Restored client/.env to the simulator origin."
}

ngrok http "$API_PORT" --log=stdout > /tmp/ngrok-rocketfood.log 2>&1 &
NGROK_PID=$!
trap 'restore_env; kill "$NGROK_PID" 2>/dev/null || true' EXIT

# Wait for the ngrok agent's local API to come up, then read the public URL.
PUBLIC_URL=""
for _ in $(seq 1 20); do
  sleep 0.5
  PUBLIC_URL="$(curl -sf "$NGROK_API" 2>/dev/null \
    | python3 -c 'import json,sys; ts=json.load(sys.stdin).get("tunnels",[]); print(next((t["public_url"] for t in ts if t["proto"]=="https"), ""))' \
    2>/dev/null || true)"
  [ -n "$PUBLIC_URL" ] && break
done

if [ -z "$PUBLIC_URL" ]; then
  echo "Could not get a tunnel URL from ngrok. See /tmp/ngrok-rocketfood.log" >&2
  exit 1
fi

cat > "$ENV_FILE" <<EOF
# Temporary ngrok origin written by scripts/ngrok-phone.sh (Ctrl+C restores the original).
EXPO_PUBLIC_API_URL=$PUBLIC_URL
EOF

echo "API tunnel is live: $PUBLIC_URL -> http://127.0.0.1:$API_PORT"
echo "client/.env updated with the tunnel URL."
echo
echo "Now start Expo with a clean cache so the new URL is picked up:"
echo "  cd client && npx expo start -c"
echo "Then scan the QR code with Expo Go on your phone."
echo "(Phone on a different network than this Mac? Use: npx expo start -c --tunnel)"
echo
echo "Press Ctrl+C here to stop the tunnel and restore client/.env."
wait "$NGROK_PID"
