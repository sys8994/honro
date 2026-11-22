#!/usr/bin/env bash
# Only from the independently bound writer's standard Actions checkout.
set +x
set -euo pipefail
umask 077
trap 'printf "Exact release checkpoint stopped at line %s\n" "$LINENO" >&2' ERR
[[ "$GITHUB_REPOSITORY" == sys8994/honro &&
   "$GITHUB_EVENT_NAME" == push &&
   "$GITHUB_REF" == refs/heads/qa/stage7-west-dummy-onebuild-writer-3dfe75f ]]
root="$(realpath "$GITHUB_WORKSPACE")"
bundle="$(realpath "$1")"
test "$bundle" = "$RUNNER_TEMP/stage7-west-dummy-release"
base=3dfe75f0162ff023189ea5bf60be2874d223fd45
target=refs/heads/release/act1-stage7-west-dummy-guide-20261122
origin=https://github.com/sys8994/honro
T="$root/tools/stage7-west-dummy-onebuild-writer"
test "$(git -C "$root" show -s --format=%P HEAD)" = "$base"
test "$(git -C "$root" rev-parse HEAD)" = "$GITHUB_SHA"
test -z "${GH_TOKEN:-}${GITHUB_TOKEN:-}"
test "$(git -C "$root" remote)" = origin
test "$(git -C "$root" remote get-url --push origin)" = "$origin"
! git -C "$root" config --get remote.origin.pushurl
wantmaster="$(printf '%s\trefs/heads/master' "$base")"
wantold="$(printf '%s\t%s' "$base" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$wantold"
python -B "$T/writer.py" assemble "$bundle"
built="$bundle/B"
tree="$(git -C "$built" write-tree)"
printf '%s\n' "$tree" > "$bundle/candidate.tree"
new="$(printf '%s\n' 'Remove the off-play guide ink across the west dummy in Act 1 Stage 7' | git -C "$built" -c user.name='honro automation' -c user.email='github-actions[bot]@users.noreply.github.com' commit-tree "$tree" -p "$base")"
printf '%s\n' "$new" > "$bundle/candidate.sha"
printf 'Candidate %s tree %s\n' "$new" "$tree"
new="$(cat "$bundle/candidate.sha")"
[[ "$new" =~ ^[0-9a-f]{40}$ ]]
test "$(git -C "$root" show -s --format=%P "$new")" = "$base"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$wantold"
hooks="$bundle/exact-hooks"
mkdir "$hooks"
cat > "$hooks/pre-push" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail
test "$1" = origin
test "$2" = https://github.com/sys8994/honro
read -r localref localoid remoteref remoteoid extra
test -z "${extra:-}"
test "$localref" = "$STAGE7WEST_EXPECTED_NEW"
test "$localoid" = "$STAGE7WEST_EXPECTED_NEW"
test "$remoteref" = "$STAGE7WEST_EXPECTED_REF"
test "$remoteoid" = "$STAGE7WEST_EXPECTED_BASE"
if read -r another; then exit 1; fi
printf '%s\n' verified > "$STAGE7WEST_HOOK_RECEIPT"
HOOK
chmod 0700 "$hooks/pre-push"
export STAGE7WEST_EXPECTED_NEW="$new" STAGE7WEST_EXPECTED_REF="$target" STAGE7WEST_EXPECTED_BASE="$base" STAGE7WEST_HOOK_RECEIPT="$bundle/hook"
# One ordinary forward push. No force, auth manipulation, extra tag, or master refspec.
git -C "$root" -c core.hooksPath="$hooks" -c push.followTags=false push --porcelain origin "$new:$target"
test "$(cat "$bundle/hook")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$(printf '%s\t%s' "$new" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Verified only %s at %s (not master or Pages).\n' "$target" "$new"
