#!/usr/bin/env bash
# Audited Stage33 lease pattern: pre-existing exact base, one ordinary FF, verify.
set +x
set -euo pipefail
umask 077
trap 'printf "Exact Stage44 release checkpoint stopped at line %s\n" "$LINENO" >&2' ERR
[[ "$GITHUB_REPOSITORY" = sys8994/honro && "$GITHUB_EVENT_NAME" = push && "$GITHUB_REF" = refs/heads/qa/stage44-render-recovery-release-writer-3c ]]
root="$(realpath "$GITHUB_WORKSPACE")"
bundle="$(realpath "$1")"
test "$bundle" = "$RUNNER_TEMP/honro-stage44-release"
base=3c55cf8313f1cd7355f486272f220beb38bcac7f
target=refs/heads/release/act5-stage44-render-recovery-20261123
origin=https://github.com/sys8994/honro
test "$(git -C "$root" remote)" = origin
test "$(git -C "$root" remote get-url --push origin)" = "$origin"
! git -C "$root" config --get remote.origin.pushurl
test -z "${GIT_CONFIG_COUNT:-}${GH_TOKEN:-}${GITHUB_TOKEN:-}"
test "$(git -C "$root" show -s --format=%P HEAD)" = "$base"
test "$(git -C "$root" rev-parse HEAD)" = "$GITHUB_SHA"
tree="$(cat "$bundle/candidate.tree")"
new="$(cat "$bundle/candidate.sha")"
[[ "$tree" =~ ^[a-f0-9]{40}$ && "$new" =~ ^[a-f0-9]{40}$ ]]
test "$(git -C "$root" show -s --format='%P %T' "$new")" = "$base $tree"
python3 - "$bundle/ASSEMBLY.json" "$root/tools/stage44-release-writer/PINS.json" "$new" "$tree" <<'PY'
import json,sys
a,p=map(lambda n:json.load(open(n)),sys.argv[1:3])
assert p['enabled'] is p['scopeApproval'] is True
assert a['status']=='EXACT_STAGE44_RELEASE_TREE_NO_PUSH' and a['candidateCommit']==sys.argv[3]
assert a['candidateTree']==sys.argv[4]==p['approvedTree'] and a['base']==p['base']['head']
PY
wantmaster="$(printf '%s\trefs/heads/master' "$base")"
wantold="$(printf '%s\t%s' "$base" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$wantold"
mkdir "$bundle/exact-hooks"
cat > "$bundle/exact-hooks/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
test "$1" = origin
test "$2" = https://github.com/sys8994/honro
read -r localref localoid remoteref remoteoid extra
test -z "${extra:-}" && test "$localref" = "$AUTHORIZED_NEW" && test "$localoid" = "$AUTHORIZED_NEW"
test "$remoteref" = "$AUTHORIZED_TARGET" && test "$remoteoid" = "$AUTHORIZED_BASE"
if read -r another; then exit 1; fi
printf '%s\n' verified > "$AUTHORIZED_RECEIPT"
HOOK
chmod 0700 "$bundle/exact-hooks/pre-push"
export AUTHORIZED_NEW="$new" AUTHORIZED_TARGET="$target" AUTHORIZED_BASE="$base" AUTHORIZED_RECEIPT="$bundle/hook"
# Same GitHub HTTPS Basic scheme as checkout; scoped only to this git process.
test -n "${RELEASE_TOKEN:?}"
auth="$(printf 'x-access-token:%s' "$RELEASE_TOKEN" | base64 -w0)"
printf '::add-mask::%s\n' "$auth"
unset RELEASE_TOKEN
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=http.https://github.com/.extraheader GIT_CONFIG_VALUE_0="AUTHORIZATION: basic $auth" GIT_TERMINAL_PROMPT=0 \
  git -C "$root" -c core.hooksPath="$bundle/exact-hooks" -c push.followTags=false -c http.followRedirects=false push --porcelain origin "$new:$target"
unset auth
test "$(cat "$bundle/hook")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$(printf '%s\t%s' "$new" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Verified release ref only: %s %s\n' "$target" "$new"
