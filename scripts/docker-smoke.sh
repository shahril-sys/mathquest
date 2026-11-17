#!/usr/bin/env bash
# Ujian asap imej Docker. Dengan Docker: bina, jalankan, seed, log masuk, semak. Tanpa Docker: simulasi susun atur imej
# (hanya fail yang disalin oleh Dockerfile) supaya fail yang tertinggal dapat dikesan.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${SMOKE_PORT:-3199}"
PASS="${DEMO_PASSWORD:-MathQuest#2026}"
H=(-H 'X-Requested-With: mathquest' -H 'Content-Type: application/json')
fail() { echo "GAGAL: $*" >&2; exit 1; }

probe() {
  local base="http://127.0.0.1:$PORT" jar; jar="$(mktemp)"
  for _ in $(seq 1 40); do curl -fs "$base/healthz" >/dev/null 2>&1 && break; sleep 0.5; done
  curl -fs "$base/healthz" | grep -q '"ok":true' || fail "healthz"
  curl -fs "$base/" | grep -q 'MathQuest' || fail "halaman utama"
  curl -fs "$base/js/main.js" >/dev/null || fail "aset statik"
  curl -fs -c "$jar" "${H[@]}" -d "{\"username\":\"admin\",\"password\":\"$PASS\"}" "$base/api/auth/login" | grep -q pentadbir || fail "log masuk pentadbir"
  curl -fs -b "$jar" "$base/api/admin/dashboard" | grep -q '"students":30' || fail "papan pemuka (data seed)"
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$base/api/admin/dashboard")" = 401 ] || fail "API tanpa log masuk mesti 401"
  curl -sI "$base/" | grep -qi 'x-frame-options: DENY' || fail "pengepala keselamatan"
  rm -f "$jar"; echo "Semua semakan lulus."
}

if [ -z "${FORCE_SIM:-}" ] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "== Mod Docker =="
  IMG=mathquest-smoke; NAME=mathquest-smoke-$$
  docker build -t "$IMG" .
  docker run -d --rm --name "$NAME" -p "$PORT:3000" "$IMG" >/dev/null
  trap 'docker stop "$NAME" >/dev/null 2>&1 || true' EXIT
  for _ in $(seq 1 40); do curl -fs "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1 && break; sleep 0.5; done
  docker exec -e DEMO_PASSWORD="$PASS" "$NAME" node --disable-warning=ExperimentalWarning scripts/seed.js
  probe
  docker inspect --format '{{.State.Health.Status}}' "$NAME" || true
  [ "$(docker exec "$NAME" id -u)" != 0 ] || fail "bekas berjalan sebagai root"
else
  echo "== Docker tiada: simulasi susun atur imej =="
  T="$(mktemp -d)"; trap 'kill ${PID:-0} 2>/dev/null || true; rm -rf "$T"' EXIT
  # sama seperti arahan COPY dalam Dockerfile
  grep -E '^COPY ' Dockerfile | awk '{print $2}' | while read -r f; do [ -e "$f" ] || fail "Dockerfile menyalin $f yang tidak wujud"; cp -r "$f" "$T/"; done
  [ -f "$T/package.json" ] && [ -d "$T/migrations" ] || fail "susun atur tidak lengkap"
  mkdir -p "$T/data"
  ( cd "$T" && DATA_DIR="$T/data" NODE_ENV=production node --disable-warning=ExperimentalWarning scripts/migrate.js >/dev/null \
    && DATA_DIR="$T/data" DEMO_PASSWORD="$PASS" node --disable-warning=ExperimentalWarning scripts/seed.js >/dev/null )
  ( cd "$T" && DATA_DIR="$T/data" PORT="$PORT" NODE_ENV=production exec node --disable-warning=ExperimentalWarning src/server.js >/dev/null 2>&1 ) &
  PID=$!
  probe
  # fail yang dikecualikan oleh .dockerignore tidak boleh diperlukan semasa runtime
  ! grep -rq "docs/\|test/" "$T/src" || fail "kod runtime merujuk docs/ atau test/"
fi
