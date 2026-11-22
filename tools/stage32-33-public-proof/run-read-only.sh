#!/usr/bin/env bash
set -euo pipefail
umask 077
# Disabled local transport; attach to a read-only Actions carrier only after exact public HEAD binding.
D="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
root="$(realpath "$1")"
tmp="$(realpath "$2")"
PY="${PYTHON:-python3}"
readarray -t X < <("$PY" - "$D/PINS.json" <<'PY'
import json,re,sys
from pathlib import Path
x=json.loads(Path(sys.argv[1]).read_bytes())
assert x['enabled'] is True and re.fullmatch('[0-9a-f]{40}',x['certifiedOutput']['head'] or ''),'disabled official public readback'
print(x['certifiedOutput']['head']);print(x['certifiedOutput']['tree'])
PY
)
test "${#X[@]}" = 2
test "$GITHUB_REPOSITORY" = sys8994/honro
test "$GITHUB_EVENT_NAME" = push
test "$GITHUB_REF" = refs/heads/qa/stage32-33-exact-public-eaf774
test "$(git -C "$root" show -s --format=%P HEAD)" = "${X[0]}"
test "$(git -C "$root" rev-parse HEAD)" = "$GITHUB_SHA"
test -z "$(git -C "$root" status --porcelain)"
"$PY" - "$root" "${X[0]}" <<'AUTH'
import subprocess,sys
r,h=sys.argv[1:]
paths=['.github/workflows/stage32-33-exact-public.yml',*('tools/stage32-33-public-proof/'+x for x in ('PINS.json','readback.py','run-read-only.sh'))]
changed=subprocess.check_output(['git','-C',r,'diff','--no-renames','--name-status',h,'HEAD'],text=True).splitlines()
assert set(changed)=={'A\t'+p for p in paths}
AUTH
P="$tmp/exact-joint-public-root"; T="$tmp/exact-joint-r5-observers"; S="$tmp/exact-joint-72dd-fixture"; O="$tmp/exact-joint-2c4-historical"
test "$root" != "$tmp"; test ! -e "$P"; test ! -e "$T"; test ! -e "$S"; test ! -e "$O"
test "$(git -C "$root" rev-parse "${X[0]}^{tree}")" = "${X[1]}"
r5=bc89186b3b16850bfcb264c8eec1a356dbf0f0d0
test "$(git -C "$root" rev-parse "$r5^{tree}")" = 97b3ba41d41973555ed41041f63b7c7c84a6bb79
git -C "$root" worktree add --detach "$P" "${X[0]}"
git -C "$root" worktree add --detach "$T" "$r5"
readarray -t S32 < <("$PY" - "$T/tools/stage32-batch/PINS.json" <<'PY'
import json,sys
from pathlib import Path
a=json.loads(Path(sys.argv[1]).read_bytes())['nativeArchiveFixtureStock'];print(a['head']);print(a['tree'])
PY
)
test "${#S32[@]}" = 2
test "$(git -C "$root" rev-parse "${S32[0]}^{tree}")" = "${S32[1]}"
git -C "$root" worktree add --detach "$S" "${S32[0]}"
mkdir "$O"
cp "$T/tools/stage33-batch/old-2c4-HONRO.html" "$O/OLD-2C4.html"
git -C "$root" show e70279eb6e00061825eaa6c0de793bb8c0821a99:HONRO.html > "$O/OLD-E702.html"
ln -s "$P/web" "$O/web"; ln -s "$P/assets" "$O/assets"
pids=()
trap 'if (("${#pids[@]}")); then kill "${pids[@]}" 2>/dev/null || true; fi' EXIT
"$PY" -m http.server 18883 --bind 127.0.0.1 --directory "$O" >"$tmp/s3233-old2c4-http.log" 2>&1 &
pids+=("$!")
"$PY" -m http.server 18884 --bind 127.0.0.1 --directory "$S" >"$tmp/s3233-72dd-http.log" 2>&1 &
pids+=("$!")
curl -sS --fail --retry 3 --retry-connrefused http://127.0.0.1:18883/OLD-2C4.html -o /dev/null
curl -sS --fail --retry 3 --retry-connrefused http://127.0.0.1:18884/HONRO.html -o /dev/null
PYTHONDONTWRITEBYTECODE=1 "$PY" -B "$D/readback.py" "$P" "$T/tools" "$tmp/s3233-public-proof" http://127.0.0.1:18883/ http://127.0.0.1:18884/
