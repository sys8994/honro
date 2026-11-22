#!/usr/bin/env bash
# Only from the independently bound writer's standard Actions checkout.
set +x
set -euo pipefail
umask 077
trap 'printf "Exact release checkpoint stopped at line %s\n" "$LINENO" >&2' ERR
[[ "$GITHUB_REPOSITORY" == sys8994/honro &&
   "$GITHUB_EVENT_NAME" == push &&
   "$GITHUB_REF" == refs/heads/qa/stage40-46-save-writer-342 ]]
root="$(realpath "$GITHUB_WORKSPACE")"
bundle="$(realpath "$1")"
test "$bundle" = "$RUNNER_TEMP/stage40-46-save-release-checkpoint"
base=342a7aa03f7244db9663315ceac596f307dac06e
target=refs/heads/release/act4-40-act5-46-lossless-save-compatible-20261122
origin=https://github.com/sys8994/honro
T="$root/tools/stage40-46-save-compatible-writer"
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
python -B "$T/assemble.py" assemble "$bundle"
built="$bundle/B"
tree="$(git -C "$built" write-tree)"
test "$(python -c 'import json,sys; r=json.load(open(sys.argv[1])); assert r["status"]=="EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY" and r["parent"]==sys.argv[2] and len(r["add"])==16 and len(r["modify"])==12; print(r["candidateTree"])' "$bundle/ASSEMBLY.json" "$base")" = "$tree"
printf '%s\n' "$tree" > "$bundle/candidate.tree"
new="$(printf '%s\n' 'Compact Stage40 and Stage46 SVG transport and preserve battle saves' | git -C "$built" -c user.name='honro automation' -c user.email='github-actions[bot]@users.noreply.github.com' commit-tree "$tree" -p "$base")"
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
test "$localref" = "$STAGE4046SAVE_EXPECTED_NEW"
test "$localoid" = "$STAGE4046SAVE_EXPECTED_NEW"
test "$remoteref" = "$STAGE4046SAVE_EXPECTED_REF"
test "$remoteoid" = "$STAGE4046SAVE_EXPECTED_BASE"
if read -r another; then exit 1; fi
printf '%s\n' verified > "$STAGE4046SAVE_HOOK_RECEIPT"
HOOK
chmod 0700 "$hooks/pre-push"
export STAGE4046SAVE_EXPECTED_NEW="$new" STAGE4046SAVE_EXPECTED_REF="$target" STAGE4046SAVE_EXPECTED_BASE="$base" STAGE4046SAVE_HOOK_RECEIPT="$bundle/hook"
# One ordinary forward push. No force, auth manipulation, extra tag, or master refspec.
git -C "$root" -c core.hooksPath="$hooks" -c push.followTags=false push --porcelain origin "$new:$target"
test "$(cat "$bundle/hook")" = verified
test "$(git -C "$root" ls-remote --exit-code origin "$target")" = "$(printf '%s\t%s' "$new" "$target")"
test "$(git -C "$root" ls-remote --exit-code origin refs/heads/master)" = "$wantmaster"
printf 'Verified only %s at %s (not master or Pages).\n' "$target" "$new"
