#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077
bundle="$(realpath "$1")"
base=b79ea7fd87fda5586d78eae0a7052996b8e71fb5
ref=refs/heads/release/act3-stage24-front6-20261121
origin=https://github.com/sys8994/honro.git
[[ ${GITHUB_REPOSITORY:-} == sys8994/honro && ${GITHUB_EVENT_NAME:-} == push && ${GITHUB_REF:-} == refs/heads/qa/stage24-front6-release-writer-b79 ]]
token=${STAGE24_FRONT6_WRITE_TOKEN:?missing explicit single writer credential}
test "$bundle" = "$RUNNER_TEMP/writer-handoff"
unset STAGE24_FRONT6_WRITE_TOKEN GH_TOKEN GITHUB_TOKEN GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT GIT_ASKPASS SSH_ASKPASS
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_COMMON_DIR GIT_CONFIG GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES
test -z "${STAGE24_FRONT6_NETWORK_TOKEN-}"
python "$bundle/writer.py" pins
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0
tmp="$(mktemp -d "$RUNNER_TEMP/stage24-front6-final.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
askfile="$tmp/askpass"
cat > "$askfile" <<'ASK'
#!/bin/sh
case "$1" in
    *Username*github.com*) printf '%s\n' x-access-token ;;
    *Password*github.com*) printf '%s\n' "$STAGE24_FRONT6_NETWORK_TOKEN" ;;
    *) exit 1 ;;
esac
ASK
chmod 700 "$askfile"
net() {
  STAGE24_FRONT6_NETWORK_TOKEN="$token" GIT_ASKPASS="$askfile" git -c http.followRedirects=false -c credential.helper= "$@"
}
repo="$tmp/exact.git"
git init --bare "$repo"
git -C "$repo" remote add origin "$origin"
test "$(git -C "$repo" remote get-url --push origin)" = "$origin"
test "$(git -C "$repo" remote)" = origin
git -C "$repo" config --get remote.origin.pushurl && exit 1
# Scope master to an exact read-only comparison; never an update refspec.
test "$(net -C "$repo" ls-remote --exit-code origin refs/heads/master)" = "$(printf '%s\trefs/heads/master' "$base")"
test "$(net -C "$repo" ls-remote --exit-code origin "$ref")" = "$(printf '%s\t%s' "$base" "$ref")"
# This is a read of the designated existing remote, not arbitrary ref creation.
net -C "$repo" fetch --no-tags origin "$ref"
test "$(git -C "$repo" rev-parse FETCH_HEAD)" = "$base"
git -C "$repo" update-ref --no-deref HEAD "$base"
# No checkout, renderer, source build or service credential for exact tree preparation.
python "$bundle/writer.py" prepare "$repo" "$tmp/new"
new="$(cat "$tmp/new")"
[[ "$new" =~ ^[a-f0-9]{40}$ ]]
test "$(git -C "$repo" rev-parse HEAD)" = "$new"
test "$new" = "$(python "$bundle/writer.py" expected-candidate)"
test "$(git -C "$repo" show -s --format=%P HEAD)" = "$base"
test "$(net -C "$repo" ls-remote --exit-code origin refs/heads/master)" = "$(printf '%s\trefs/heads/master' "$base")"
hookdir="$tmp/exact-hooks"
mkdir "$hookdir"
cat > "$hookdir/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
test "$1" = origin
test "$2" = https://github.com/sys8994/honro.git
read -r localref localoid remoteref remoteoid extra
test -z "${extra:-}"
test "$localref" = "$STAGE24_FRONT6_EXPECTED_NEW"
test "$localoid" = "$STAGE24_FRONT6_EXPECTED_NEW"
test "$remoteref" = "$STAGE24_FRONT6_EXPECTED_REF"
# Own push advertisement, not a prior separate read. Zero (deleted), an
# ancestor (rewind), or any changed old OID must stop before server write.
test "$remoteoid" = "$STAGE24_FRONT6_EXPECTED_BASE"
if read -r line; then exit 1; fi
printf '%s\n' verified > "$STAGE24_FRONT6_HOOK_RECEIPT"
HOOK
chmod 700 "$hookdir/pre-push"
export STAGE24_FRONT6_EXPECTED_NEW="$new" STAGE24_FRONT6_EXPECTED_REF="$ref" STAGE24_FRONT6_EXPECTED_BASE="$base" STAGE24_FRONT6_HOOK_RECEIPT="$tmp/hook-checked"
# Only permitted repository write. Ordinary forward update; never a force flag.
net -C "$repo" -c core.hooksPath="$hookdir" -c push.followTags=false \
  push --porcelain origin "$new:$ref"
test "$(cat "$tmp/hook-checked")" = verified
test "$(net -C "$repo" ls-remote --exit-code origin "$ref")" = "$(printf '%s\t%s' "$new" "$ref")"
printf 'Verified only %s at %s (not master/Pages).\n' "$ref" "$new"
