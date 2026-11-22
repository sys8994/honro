#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077
trap 'printf "Exact release checkpoint stopped at line %s\n" "$LINENO" >&2' ERR
base=e70279eb6e00061825eaa6c0de793bb8c0821a99
tgt=refs/heads/release/stage32-33-post07-20261122
origin=https://github.com/sys8994/honro
qa=refs/heads/qa/stage32-33-retained-writer-e702
root="$(realpath "$GITHUB_WORKSPACE")"
tmp="$(realpath "$RUNNER_TEMP")"
receipt="$tmp/honro-stage32-33-assembly"
T="$root/tools/stage32-33-release-writer"
[[ "$GITHUB_REPOSITORY" == sys8994/honro && "$GITHUB_EVENT_NAME" == push && "$GITHUB_REF" == "$qa" ]]
test "$(git -C "$root" show -s --format=%P HEAD)" = "$base"
test "$(git -C "$root" rev-parse HEAD)" = "$GITHUB_SHA"
test -z "$(git -C "$root" status --porcelain)"
test "$(git -C "$root" remote)" = origin
test "$(git -C "$root" remote get-url origin)" = "$origin"
test "$(git -C "$root" remote get-url --push origin)" = "$origin"
! git -C "$root" config --get remote.origin.pushurl
python3 - "$root" "$T/PINS.json" "$base" "$qa" "$tgt" <<'PY'
from pathlib import Path
import json,sys,subprocess
r,p,base,qa,tgt=sys.argv[1:];q=json.loads(Path(p).read_bytes())
assert q['enabled'] is q['scopeApproval'] is True and q['qaRef']==qa and q['releaseRef']==tgt
f=['.github/workflows/stage32-33-retained-writer.yml',*('tools/stage32-33-release-writer/'+k for k in ('assemble.py','PINS.json','safe-push.sh'))]
assert set(subprocess.check_output(['git','-C',r,'diff','--no-renames','--name-status',base,'HEAD'],text=True).splitlines())=={'A\t'+p for p in f}
assert all(subprocess.check_output(['git','-C',r,'ls-tree','HEAD','--',k],text=True).startswith('100644 ') for k in f)
PY
wantmaster="$(printf '%s\trefs/heads/master' "$base")"
wantold="$(printf '%s\t%s' "$base" "$tgt")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$tgt")" = "$wantold"
git -C "$root" worktree add --detach "$tmp/honro-stage32-33-e702" "$base"
python3 -B "$T/assemble.py" assemble "$tmp/honro-stage32-33-e702" "$receipt"
unset GH_TOKEN GITHUB_TOKEN
built="$receipt/B"
tree="$(git -C "$built" write-tree)"
test "$tree" = "$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["status"]=="EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY" and d["oldUrls"]==1511 and d["preservedUrls"]==1521 and len(d["add"])==11 and len(d["modify"])==6; print(d["candidateTree"])' "$receipt/ASSEMBLY.json")"
printf '%s\n' "$tree" > "$receipt/candidate.tree"
new="$(printf '%s\n' 'Join Stage32 southern terrain and restore exact Stage33 legacy coastal saves' | git -C "$built" -c user.name='honro automation' -c user.email='github-actions[bot]@users.noreply.github.com' commit-tree "$tree" -p "$base")"
[[ "$new" =~ ^[0-9a-f]{40}$ ]]
test "$(git -C "$root" show -s --format=%P "$new")" = "$base"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$tgt")" = "$wantold"
printf '%s\n' "$new" > "$receipt/candidate.sha"
hooks="$receipt/exact-hooks"; mkdir "$hooks"
cat >"$hooks/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
test "$1" = origin && test "$2" = https://github.com/sys8994/honro
read -r localref localoid remoteref remoteoid extra
test -z "${extra:-}" && test "$localref" = "$AUTHORIZED_NEW" && test "$localoid" = "$AUTHORIZED_NEW"
test "$remoteref" = "$AUTHORIZED_TARGET" && test "$remoteoid" = "$AUTHORIZED_BASE"
if read -r another; then exit 1; fi
printf '%s\n' verified > "$AUTHORIZED_RECEIPT"
HOOK
chmod 0700 "$hooks/pre-push"
export AUTHORIZED_NEW="$new" AUTHORIZED_TARGET="$tgt" AUTHORIZED_BASE="$base" AUTHORIZED_RECEIPT="$receipt/hook"
git -C "$root" -c core.hooksPath="$hooks" -c push.followTags=false push --porcelain origin "$new:$tgt"
test "$(cat "$receipt/hook")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$tgt")" = "$(printf '%s\t%s' "$new" "$tgt")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Exact only release ref: %s commit=%s tree=%s; no deploy\n' "$tgt" "$new" "$tree"
