#!/usr/bin/env bash
# Hosted exact-release ref only. Builtin job token only in the final git push process.
set +x
set -euo pipefail
umask 077
[[ "${GITHUB_REPOSITORY:?}" = sys8994/honro && "${GITHUB_EVENT_NAME:?}" = push && "${GITHUB_REF:?}" = refs/heads/qa/stage40-c2-release-writer-df621-r2 && "${GITHUB_RUN_ATTEMPT:?}" = 1 ]]
test "$#" = 2
root="$(realpath "$1")"; receipt="$(realpath "$2")"
here="$(cd "$(dirname "$0")"; pwd)"
[[ "$here" = "$RUNNER_TEMP/stage40-sealed-handover" && "$receipt" = "$here/ASSEMBLY.json" && "$root" = "$RUNNER_TEMP/stage40-release-git" ]]
read -r base target candidate tree < <(python3 - "$here/PINS.json" "$receipt" <<'PY'
import json,re,sys
p,a=map(lambda x:json.load(open(x)),sys.argv[1:])
assert p['enabled'] is p['scopeApproval'] is p['refWriteEnabled'] is True
assert a['status']=='EXACT_STAGE40_C2_RELEASE_TREE_NO_PUSH'
assert a['base']==p['base'] and a['tree']==p['expectedTree'] and a['candidateCommit']==p['exactCandidateCommit']
assert p['qaRef']=='refs/heads/qa/stage40-c2-release-writer-df621-r2'
assert a['base']=='df62145bea2d4ebdd642f5e39f1eda7b19eb7ae2'
assert p['releaseRef']=='refs/heads/release/act4-stage40-east-c2-20261123'
for x in (a['base'],a['candidateCommit'],a['tree']):assert re.fullmatch('[a-f0-9]{40}',x)
print(a['base'],p['releaseRef'],a['candidateCommit'],a['tree'])
PY
)
origin=https://github.com/sys8994/honro
test "$(git -C "$root" remote get-url --push origin)" = "$origin"
if git -C "$root" config --get remote.origin.pushurl >/dev/null; then exit 1; fi
test -z "${GIT_CONFIG_COUNT:-}${GH_TOKEN:-}${GITHUB_TOKEN:-}"
test "$(git -C "$root" show -s --format='%P %T' "$candidate")" = "$base $tree"
wantmaster="$(printf '%s\trefs/heads/master' "$base")"
wanttarget="$(printf '%s\t%s' "$base" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$wanttarget"
hook="$(mktemp -d)"; trap 'rm -rf -- "$hook"' EXIT
cat > "$hook/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" = origin && "$2" = https://github.com/sys8994/honro ]]
read -r from fromsha to tosha extra
[[ "$from" = "$WRITER_NEW" && "$fromsha" = "$WRITER_NEW" ]]
[[ "$to" = "$WRITER_TARGET" && "$tosha" = "$WRITER_BASE" && -z "${extra:-}" ]]
if read -r more; then exit 1; fi
printf '%s\n' verified > "$WRITER_HOOK"
HOOK
chmod 700 "$hook/pre-push"
export WRITER_NEW="$candidate" WRITER_TARGET="$target" WRITER_BASE="$base" WRITER_HOOK="$hook/verified"
test -n "${RELEASE_TOKEN:?}"
auth="$(printf 'x-access-token:%s' "$RELEASE_TOKEN" | base64 -w0)"
printf '::add-mask::%s\n' "$auth"
unset RELEASE_TOKEN
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=http.https://github.com/.extraheader GIT_CONFIG_VALUE_0="AUTHORIZATION: basic $auth" \
  GIT_TERMINAL_PROMPT=0 git -C "$root" -c core.hooksPath="$hook" -c push.followTags=false -c http.followRedirects=false  push --porcelain origin "$candidate:$target"
unset auth
test "$(cat "$hook/verified")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$(printf '%s\t%s' "$candidate" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Verified dedicated release ref only: %s %s\n' "$target" "$candidate"
