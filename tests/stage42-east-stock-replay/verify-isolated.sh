#!/usr/bin/env bash
# Detached QA worktrees only; no edit to the invoking tracked checkout, commit, push or deployment.
set -euo pipefail
[[ "$#" = 4 ]] || { echo "usage: verify-isolated.sh SOURCE_GIT EXACT_CANDIDATE_ASSET OBSERVED_RECEIPT EVIDENCE_DIR";exit 64; }
test "${HONRO_EAST_STOCK_QA:-0}" = 1
D="$(cd "$(dirname "$0")" && pwd -P)"
REPO="$(cd "$1" && pwd -P)"
BLOB="$(realpath "$2")"; RECEIPT="$(realpath "$3")"
mkdir -p "$4";OUT="$(cd "$4" && pwd -P)"
PIN=1e043b09d4ce107e1d2dcf70fe2274dff7098476
ASSET=shared/assets/environment/act5/stage42-registered-body.json
SURFACE=shared/assets/environment/act5/stage42-surface.json
test "$(git -C "$REPO" rev-parse "$PIN:$ASSET")" = 0644364507adadc132c3f1e4da7953c61641e8af
test "$(git -C "$REPO" rev-parse "$PIN:$SURFACE")" = cabd9306550c0ccd742dfd3633f3c266ec9b7819
test "$(git hash-object "$BLOB")" = 8a28d581d0621bdbf5d3c525201c9a98ffd38c68
test "$(sha256sum "$RECEIPT"|cut -d' ' -f1)" = 789365e94591057ab9b3a0131da0f23c6c903b59e62bf2608c642dbe39333252
T="$(mktemp -d)";declare -a PIDS=()
origin_head="$(git -C "$REPO" rev-parse HEAD)"
origin_status="$(git -C "$REPO" status --porcelain=v1 --untracked-files=all)"
cleanup(){
 local rc=$? remove_failed=0
 trap - EXIT
 set +e
 for p in "${PIDS[@]}"; do kill "$p" 2>/dev/null; wait "$p" 2>/dev/null; done
 for f in B A; do
  if test -f "$T/$f/.git"; then
   git -C "$REPO" -c core.hooksPath=/dev/null worktree remove --force -- "$T/$f" || remove_failed=1
  fi
 done
 if test "$remove_failed" = 0; then
  rm -rf -- "$T"
 else
  echo "Isolated worktree removal failed; preserved temp for investigation: $T" >&2
 fi
 if ! test "$(git -C "$REPO" rev-parse HEAD)" = "$origin_head" ||
    ! test "$(git -C "$REPO" status --porcelain=v1 --untracked-files=all)" = "$origin_status"; then
  echo "Invoking checkout source status changed during isolation" >&2
  remove_failed=1
 fi
 if test "$rc" = 0 && test "$remove_failed" = 1; then rc=1; fi
 exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
for f in A B; do
 git -C "$REPO" -c core.hooksPath=/dev/null worktree add --detach -- "$T/$f" "$PIN"
 test "$(git -C "$T/$f" rev-parse HEAD)" = "$PIN"
 if git -C "$T/$f" symbolic-ref --quiet HEAD >/dev/null; then echo "Expected detached worktree" >&2; exit 1; fi
 test -z "$(git -C "$T/$f" status --porcelain=v1 --untracked-files=all)"
done
cp "$BLOB" "$T/B/$ASSET"
test "$(git -C "$T/B" status --porcelain=v1 --untracked-files=all)" = " M $ASSET"
git -C "$T/B" diff --cached --quiet
test "$(git -C "$T/B" diff --name-only)" = "$ASSET"
test -z "$(git -C "$T/A" status --porcelain=v1 --untracked-files=all)"
diff -qr --exclude=.git "$T/A" "$T/B" > "$OUT/source-diff.txt" || test "$?" = 1
test "$(cat "$OUT/source-diff.txt")" = "Files $T/A/$ASSET and $T/B/$ASSET differ"
node --input-type=module - "$T/A/$ASSET" "$T/B/$ASSET" > "$OUT/asset-metrics.json" <<'JS'
import fs from 'fs';import assert from 'assert';import {createHash} from 'crypto';
const raw=process.argv.slice(2).map(p=>fs.readFileSync(p,'utf8'));
const [a,b]=raw.map(JSON.parse);
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(b.vector.root.children.length,2);
const [cap,old]=b.vector.root.children;
assert.equal(cap.id,'authored-stage42-east-cap-v1');assert.equal(cap.clipPath,'native-source-alpha');
assert.equal(cap.children.length,3);assert.ok(cap.children.every(x=>x.tag==='path'));
b.vector.root=old;assert.deepEqual(a,b);
const byteLength=x=>Buffer.byteLength(x,'utf8');
console.log(JSON.stringify({onlySourceAsset:'shared/assets/environment/act5/stage42-registered-body.json',
 oldBytes:byteLength(raw[0]),newBytes:byteLength(raw[1]),changedBytes:byteLength(raw[1])-byteLength(raw[0]),
 adoptedGroupSha256:sha(cap),oldRootSha256:sha(old),oldRootAndNativeClipSha256:sha([old,a.vector.clips['native-source-alpha']]),
 fullClipHash:sha(a.vector.clips),derivedAddedNodes:1+cap.children.length,addedPaths:cap.children.length,
 originalAfterUnwrappingIdentical:true,rendererSourceUntouched:true},null,2));
JS
export HONRO_ACT4_RELEASE=1 HONRO_ACT5_RELEASE=1 PYTHONDONTWRITEBYTECODE=1
for f in A B; do
 (
  cd "$T/$f"
  npm ci
  npm ci --prefix game
  npm run build
  sha256sum "$ASSET" "$SURFACE" shared/runtime/act5-edge-art.js HONRO.html HONRO_WORKSHOP.html web/manifest.json > "$OUT/$f-build-sha256.txt"
 )
done
port=8875
cmp "$T/A/$SURFACE" "$T/B/$SURFACE"
cmp "$T/A/shared/runtime/act5-edge-art.js" "$T/B/shared/runtime/act5-edge-art.js"
cmp "$T/A/shared/act5-world.mjs" "$T/B/shared/act5-world.mjs"
for f in A B; do
 mkdir "$T/public-$f"
 cp -a "$T/$f"/{web,HONRO.html,HONRO_WORKSHOP.html} "$T/public-$f/"
 python -m http.server "$port" --bind 127.0.0.1 --directory "$T/public-$f" >"$OUT/$f-server.txt" 2>&1 & PIDS+=("$!")
 for i in {1..20};do if curl -fsS -o /dev/null "http://127.0.0.1:$port/HONRO.html";then break;fi; sleep 1;done
 curl -fsS -o /dev/null "http://127.0.0.1:$port/HONRO.html"; port=$((port+1))
done
python "$D/check-stock.py" --a http://127.0.0.1:8875 --b http://127.0.0.1:8876 --receipt "$RECEIPT" --candidate-asset "$BLOB" --out "$OUT"
