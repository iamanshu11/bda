#!/usr/bin/env bash
# QA: verify security headers + CORS + basic RBAC on the running servers.
# Usage:  bash qa/check-headers.sh
# Env:    API=http://localhost:5000  WEB=http://localhost:3000
set -u
API="${API:-http://localhost:5000}"
WEB="${WEB:-http://localhost:3000}"
pass=0; fail=0
ok()   { printf "  \033[32m✔\033[0m %s\n" "$1"; pass=$((pass+1)); }
bad()  { printf "  \033[31m✘\033[0m %s\n" "$1"; fail=$((fail+1)); }

hdr() { # hdr <url> <header-name>  -> prints header value (lowercased name match)
  curl -s -I -m 5 "$1" | tr -d '\r' | awk -v h="$(echo "$2" | tr '[:upper:]' '[:lower:]')" \
    'BEGIN{IGNORECASE=1} tolower($0) ~ "^"h":" {sub(/^[^:]*: /,""); print; exit}'
}
has() { # has <url> <header> <label>
  local v; v="$(hdr "$1" "$2")"
  if [ -n "$v" ]; then ok "$3: $v"; else bad "$3 MISSING"; fi
}

echo "== Backend API ($API) security headers =="
has "$API/health" "X-Content-Type-Options" "nosniff"
has "$API/health" "Referrer-Policy"        "Referrer-Policy"
has "$API/health" "Permissions-Policy"      "Permissions-Policy"
has "$API/health" "X-Request-Id"            "correlation id (D4)"
# helmet sets these; CSP + HSTS only in production
CSP="$(hdr "$API/health" "Content-Security-Policy")"; [ -n "$CSP" ] && ok "CSP present" || echo "  · CSP not set (expected only when NODE_ENV=production)"
HSTS="$(hdr "$API/health" "Strict-Transport-Security")"; [ -n "$HSTS" ] && ok "HSTS present" || echo "  · HSTS not set (expected only in production/HTTPS)"

echo
echo "== Frontend ($WEB) security headers =="
has "$WEB" "X-Content-Type-Options" "nosniff"
has "$WEB" "X-Frame-Options"        "X-Frame-Options"
has "$WEB" "Referrer-Policy"        "Referrer-Policy"
has "$WEB" "Permissions-Policy"     "Permissions-Policy"

echo
echo "== CORS (A5) =="
allow="$(curl -s -I -m 5 -H 'Origin: http://evil.example' "$API/health" | tr -d '\r' | awk 'BEGIN{IGNORECASE=1} /^access-control-allow-origin:/{print}')"
if [ -z "$allow" ]; then ok "disallowed origin gets no ACAO header"; else bad "unexpected ACAO for evil origin: $allow"; fi

echo
echo "== RBAC deny paths (B2) =="
code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$API/api/v1/admin/courses"); [ "$code" = "401" ] && ok "admin route no-token -> 401" || bad "admin route no-token -> $code (want 401)"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 -H 'Authorization: Bearer not.a.jwt' "$API/api/v1/admin/courses"); [ "$code" = "401" ] && ok "admin route bad-token -> 401" || bad "admin route bad-token -> $code (want 401)"
code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$API/api/v1/students/tests"); [ "$code" = "401" ] && ok "student route no-token -> 401" || bad "student route no-token -> $code (want 401)"

echo
echo "== Health =="
code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$API/health"); [ "$code" = "200" ] && ok "GET /health -> 200" || bad "GET /health -> $code"

echo
printf "Result: \033[32m%d passed\033[0m, \033[31m%d failed\033[0m\n" "$pass" "$fail"
[ "$fail" -eq 0 ]
