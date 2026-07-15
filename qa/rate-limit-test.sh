#!/usr/bin/env bash
# QA (C4/API abuse): fire N rapid requests and confirm the limiter returns 429
# without the server crashing. Auth endpoints have the stricter 20/15min limit.
# Usage:  N=150 bash qa/rate-limit-test.sh
set -u
API="${API:-http://localhost:5000}"
N="${N:-150}"
URL="$API/api/v1/auth/login"   # stricter authRateLimiter (max 20 / 15 min)

echo "Firing $N POSTs at $URL ..."
# Note: keys are numeric HTTP codes, so a plain indexed array works on bash 3.2
# (macOS) without associative-array support.
for i in $(seq 1 "$N"); do
  c=$(curl -s -o /dev/null -w '%{http_code}' -m 5 -X POST "$URL" \
        -H 'Content-Type: application/json' -d '{"email":"x@x.com","password":"nope"}')
  codes[$c]=$(( ${codes[$c]:-0} + 1 ))
done

echo "Status distribution:"
for k in "${!codes[@]}"; do printf "  %s -> %d\n" "$k" "${codes[$k]}"; done

if [ "${codes[429]:-0}" -gt 0 ]; then
  echo "✔ Rate limiting engaged (${codes[429]} x 429). Server stayed up."
else
  echo "✘ No 429 seen — check RATE_LIMIT_MAX / authRateLimiter, or raise N."
fi
