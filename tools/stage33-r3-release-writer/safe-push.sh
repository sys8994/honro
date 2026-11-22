#!/usr/bin/env bash
# Only from the independently bound writer's standard Actions checkout.
set +x
set -euo pipefail
umask 077
trap 'printf "Exact release checkpoint stopped at line %s\n" "$LINENO" >&2' ERR
[[ "$GITHUB_REPOSITORY" == sys8994/honro &&
   "$GITHUB_EVENT_NAME" == push &&
   "$GITHUB_REF" == refs/heads/qa/stage33-r3-2c4-release-writer-r3 ]]
root="$(realpath "$GITHUB_WORKSPACE")"
bundle="$(realpath "$1")"
test "$bundle" = "$RUNNER_TEMP/stage33-writer-handoff"
base=2c4e90ff24d1f5aa5d04f01317caa02f89b8194c
target=refs/heads/release/act4-stage33-coastal-end-20261122
origin=https://github.com/sys8994/honro
T="$root/tools/stage33-r3-release-writer"
python "$T/writer.py" pins
test -z "${GH_TOKEN:-}${GITHUB_TOKEN:-}"
test "$(git -C "$root" remote)" = origin
test "$(git -C "$root" remote get-url --push origin)" = "$origin"
! git -C "$root" config --get remote.origin.pushurl
wantmaster="$(printf '%s\trefs/heads/master' "$base")"
wantold="$(printf '%s\t%s' "$base" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$wantold"
python "$T/writer.py" prepare "$bundle" "$root"
new="$(cat "$bundle/candidate.sha")"
[[ "$new" =~ ^[0-9a-f]{40}$ ]]
test "$(git -C "$root" show -s --format=%P "$new")" = "$base"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
hooks="$bundle/exact-hooks"
mkdir "$hooks"
cat > "$hooks/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
test "$1" = origin
test "$2" = https://github.com/sys8994/honro
read -r localref localoid remoteref remoteoid extra
test -z "${extra:-}"
test "$localref" = "$STAGE33_EXPECTED_NEW"
test "$localoid" = "$STAGE33_EXPECTED_NEW"
test "$remoteref" = "$STAGE33_EXPECTED_REF"
test "$remoteoid" = "$STAGE33_EXPECTED_BASE"
if read -r another; then exit 1; fi
printf '%s\n' verified > "$STAGE33_HOOK_RECEIPT"
HOOK
chmod 0700 "$hooks/pre-push"
export STAGE33_EXPECTED_NEW="$new" STAGE33_EXPECTED_REF="$target" STAGE33_EXPECTED_BASE="$base" STAGE33_HOOK_RECEIPT="$bundle/hook"
# One ordinary forward push. No force, auth manipulation, extra tag, or master refspec.
git -C "$root" -c core.hooksPath="$hooks" -c push.followTags=false push --porcelain origin "$new:$target"
test "$(cat "$bundle/hook")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$(printf '%s\t%s' "$new" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Verified only %s at %s (not master or Pages).\n' "$target" "$new"
