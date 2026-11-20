#!/usr/bin/env bash
# Same-repository read-only QA runner. No ref mutation or deployment.
set -euo pipefail
[[ $# == 3 ]]
SOURCE=affc9a7849f25a6fd08a65b5c90228b84e029fc1
LIVE=1e043b09d4ce107e1d2dcf70fe2274dff7098476
RUN=44792780986
REPO=sys8994/honro
root=$(cd "$1" && pwd -P)
W=$(realpath -m "$2")
H=$(cd "$3" && pwd -P)
[[ -d "$RUNNER_TEMP" && "$W" == "$(realpath "$RUNNER_TEMP")/"* && ! -e "$W" ]]
mkdir -- "$W"
git -C "$root" cat-file -e "$SOURCE^{commit}"
git -C "$root" cat-file -e "$LIVE^{commit}"
gh api "repos/$REPO/actions/runs/$RUN" > "$W/run.json"
gh api "repos/$REPO/actions/runs/$RUN/artifacts" > "$W/artifacts.json"
python - "$W" <<'PY'
import json,sys
from pathlib import Path
w=Path(sys.argv[1])
r=json.loads((w/'run.json').read_bytes())
a=json.loads((w/'artifacts.json').read_bytes())
head='18a920935c7bbcf1949c927762ab4389fb0bd044'
assert r['status']=='completed' and r['conclusion']=='success' and r['id']==44792780986
assert r['repository']['full_name']==r['head_repository']['full_name']=='sys8994/honro'
assert r['head_sha']==head and r['head_branch']=='qa/final-c-act1-camera-parallel-20261121'
assert r['path']=='.github/workflows/final-c-act1-camera.yml' and r['event']=='push'
for name,ident,size,sha in (
 ('final-c-act1-camera-exact-84',14659621254,1265877,'cc3488158a14edd035b3b3e460924cfadb18572bbf062fb9cd9ff7ca278d5aea'),
 ('final-c-generated-normal-qa-only',14656873336,207254384,'1cb3be7de035bdce17cfedb5b47a276896dc6f2589206a5d49e2ae92f7a7eb24')):
 found=[x for x in a['artifacts'] if x['name']==name and not x['expired']]
 assert len(found)==1 and found[0]['workflow_run']['id']==r['id'] and found[0]['workflow_run']['head_sha']==head
 assert (found[0]['id'],found[0]['size_in_bytes'],found[0]['digest'])==(ident,size,'sha256:'+sha)
PY
qa_head=18a920935c7bbcf1949c927762ab4389fb0bd044
test "$(git -C "$root" show -s --format=%P "$qa_head")" = "$SOURCE"
test "$(git -C "$root" rev-parse "$qa_head:.github/workflows/final-c-act1-camera.yml")" = 4a92f4e30bac00a0806d369429fbc0a610328117
gh api "repos/$REPO/actions/artifacts/14659621254/zip" > "$W/app.zip"
gh api "repos/$REPO/actions/artifacts/14656873336/zip" > "$W/generated.zip"
unset GH_TOKEN GITHUB_TOKEN
python "$H/read_qa_inputs.py" --run-json "$W/run.json" --artifacts-json "$W/artifacts.json" --app-zip "$W/app.zip" --generated-zip "$W/generated.zip" --out "$W/input" > "$W/qa-download-pins.json"
I="$W/input"
candidate_tar="$I/final-c-normal-generated.tar.gz"
sha=$(cut -d ' ' -f1 "$I/SHA256SUMS")
test "$sha" = 3d61e55c87d20a9a2e4463fcc5ec0c0c65a9118c0d3dff48f8cbdcb6574bc51a
check=(python "$H/validate_generated.py" --repo "$root" --app-receipt-dir "$I" --tar "$candidate_tar" --tar-sha256 "$sha" --retention-receipt "$I/retention-receipt.json")
"${check[@]}" > "$W/preassembly.json"
git -C "$root" worktree add --detach "$W/C" "$SOURCE"
test "$(git -C "$W/C" status --porcelain=v1 -z --untracked-files=all | wc -c)" -eq 0
git -C "$W/C" ls-tree -r HEAD web workshop/HONRO_MAP_WORKSHOP.html HONRO.html HONRO_WORKSHOP.html index.html > "$W/existing-generated-tree.txt"
if grep -E '^120000 ' "$W/existing-generated-tree.txt"; then echo "symlink under generated scope" >&2; exit 3; fi
printf '%s  %s\n' "$sha" "$candidate_tar" | sha256sum -c -
tar -xzf "$candidate_tar" -C "$W/C" --no-same-owner --no-same-permissions
(
  cd "$W/C"
  node tools/release/retain-published-web.mjs "$LIVE" --published-at 2026-11-18T13:30:58.7215011Z \
   --evidence https://github.com/sys8994/honro/actions/runs/44314130328
) > "$W/retained-registrations.json"
"${check[@]}" --assembly "$W/C" > "$W/final-local-assembly.json"
python - "$W/final-local-assembly.json" <<'PY' > "$W/generated-delta.paths0"
import json,sys
a=json.load(open(sys.argv[1]));assert a['activeGraphUnchanged'] and not a['published']
for path in a['changed']: sys.stdout.buffer.write(path.encode()+b'\0')
PY
tar --sort=name --mtime=@0 --numeric-owner --owner=0 --group=0 -C "$W/C" --null -T "$W/generated-delta.paths0" -cf - | gzip -1 > "$W/read-only-generated-delta.tar.gz"
(
 cd "$W"
 sha256sum read-only-generated-delta.tar.gz > read-only-generated-delta.sha256
 python - <<'PY'
import json
from pathlib import Path
p=Path('read-only-generated-delta.tar.gz')
a=json.loads(Path('final-local-assembly.json').read_bytes())
a.update(artifactRole='verified generated/retained byte delta to affc source, not publication',
         deltaArchive=p.name,deltaArchiveBytes=p.stat().st_size,
         deltaArchiveSHA256=Path('read-only-generated-delta.sha256').read_text().split()[0])
Path('RETAINED-DELTA-RECEIPT.json').write_text(json.dumps(a,indent=2)+'\n')
PY
)
