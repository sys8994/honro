#!/usr/bin/env bash
# Only from the independently bound writer's standard Actions checkout.
set +x
set -euo pipefail
umask 077
trap 'printf "Exact release checkpoint stopped at line %s\n" "$LINENO" >&2' ERR
[[ "$GITHUB_REPOSITORY" == sys8994/honro &&
   "$GITHUB_EVENT_NAME" == push &&
   "$GITHUB_REF" == refs/heads/qa/stage33-save-hotfix-writer-733 ]]
root="$(realpath "$GITHUB_WORKSPACE")"
bundle="$(realpath "$1")"
test "$bundle" = "$RUNNER_TEMP/stage33-save-hotfix-release"
base=733d5d212d5ab235c2b492e1f065306bdfaae317
target=refs/heads/release/act4-stage33-preserve-saves-20261122
origin=https://github.com/sys8994/honro
T="$root/tools/stage33-save-hotfix-writer"
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
new="$(printf '%s\n' 'Preserve previous battle saves in Act 4 Stage 3' | git -C "$built" -c user.name='honro automation' -c user.email='github-actions[bot]@users.noreply.github.com' commit-tree "$tree" -p "$base")"
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
test "$localref" = "$STAGE33SAVEEAST_EXPECTED_NEW"
test "$localoid" = "$STAGE33SAVEEAST_EXPECTED_NEW"
test "$remoteref" = "$STAGE33SAVEEAST_EXPECTED_REF"
test "$remoteoid" = "$STAGE33SAVEEAST_EXPECTED_BASE"
if read -r another; then exit 1; fi
printf '%s\n' verified > "$STAGE33SAVEEAST_HOOK_RECEIPT"
HOOK
chmod 0700 "$hooks/pre-push"
export STAGE33SAVEEAST_EXPECTED_NEW="$new" STAGE33SAVEEAST_EXPECTED_REF="$target" STAGE33SAVEEAST_EXPECTED_BASE="$base" STAGE33SAVEEAST_HOOK_RECEIPT="$bundle/hook"
# One ordinary forward push. No force, auth manipulation, extra tag, or master refspec.
git -C "$root" -c core.hooksPath="$hooks" -c push.followTags=false push --porcelain origin "$new:$target"
test "$(cat "$bundle/hook")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$(printf '%s\t%s' "$new" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Verified only %s at %s (not master or Pages).\n' "$target" "$new"
