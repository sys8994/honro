#!/usr/bin/env bash
# Run ONLY on three disposable worktrees already prepared by prepare.py; no Git changes.
set -euo pipefail
usage(){ echo "Usage: $0 {build|stage42|act1-primary|act1-retained|act1-all} <A> <B> <C> <new evidence dir> [baseline-pins.json]" >&2; exit 2; }
[[ $# == 5 || $# == 6 ]] || usage
H=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
phase=$1; shift
A=$(cd -- "$1" && pwd); B=$(cd -- "$2" && pwd); C=$(cd -- "$3" && pwd)
[[ "$A" != "$B" && "$A" != "$C" && "$B" != "$C" ]] || usage
mkdir -p -- "$4"; O=$(cd -- "$4" && pwd)
DAG="$O/BUILD-DAG.json"
ALT=()
[[ $# == 4 ]] || ALT=(--baseline-pins "$(realpath -- "$5")")
export CI=true
if [[ "$phase" == build ]]; then
  [[ ! -e "$DAG" ]] || { echo 'Evidence dir already has a graph; choose a fresh dir.' >&2; exit 3; }
  for mode in A B C; do
    (
    cd -- "${!mode}"
    tracked=(shared game/src game/tests game/vendor tests tools workshop package.json package-lock.json game/package.json game/package-lock.json)
    check_source_pins() {
    H="$H" SIDE="$mode" PASS_TIME="$1" PINS_ALT="${ALT[1]:-}" python - "${tracked[@]}" <<'PY'
import os,json,sys
from pathlib import Path
H=Path(os.environ['H']);q=json.loads((H/'PINS.json').read_bytes());m=os.environ['SIDE']
if os.environ['PINS_ALT']:
 alt=json.loads(Path(os.environ['PINS_ALT']).read_bytes());assert set(alt)=={'base','tree','parent','renderer'}
 q.update(alt)
sys.path.insert(0,str(H));from prepare import blob,require,git,require_exact_status
p=Path.cwd();require(git(p,'rev-parse','HEAD')==q['base'],'wrong exact HEAD')
require(git(p,'rev-parse','HEAD^{tree}')==q['tree'],'wrong tree')
require(git(p,'show','-s','--format=%P','HEAD')==q['parent'],'wrong ancestry')
expect=q['stage42ChangedPaths']
when=os.environ['PASS_TIME'];require(when in ('before','after'),'wrong source check phase')
scope=() if when=='before' else tuple(sys.argv[1:])
require_exact_status(p,set() if m=='A' else expect,*scope)
src=dict(q['baselineDependencies'])|{'shared/runtime/renderer.js':q['renderer']}
if m in 'BC':src|=expect
if m=='B':src['shared/assets/environment/act5/stage42-registered-body.json']=q['approved42']
for k,v in src.items():require(blob((p/k).read_bytes())==v,m,k,'source pin mismatch')
PY
    }
    check_source_pins before
    git diff --binary HEAD -- "${tracked[@]}" > "$O/source-before-$mode.diff"
    npm ci > "$O/npm-root-$mode.log" 2>&1
    npm ci --prefix game > "$O/npm-game-$mode.log" 2>&1
    node --test tests/stage02-deep-body-tile.mjs tests/stage08-deep-body-tile.mjs tests/stage09-deep-floor-tile.mjs tests/act1-deep-four-material-tiles.mjs > "$O/act1-source-$mode.log" 2>&1
    node tests/act5-terrain-contact.mjs > "$O/act5-contact-$mode.log" 2>&1
    node - <<'JS' > "$O/vector-$mode.log"
const fs=require('fs'); require('./shared/map/vector-art.js');
const a=JSON.parse(fs.readFileSync('shared/assets/environment/act5/stage42-registered-body.json'));
const errors=HonroVectorArt.validate(a.vector);
console.log(errors); if(errors.length)throw Error(errors.join(';'));
JS
    if [[ "$mode" == C ]]; then
      node --test tests/stage42-edge-geology.mjs > "$O/stage42-source-$mode.log" 2>&1
    fi
    npm run test:release-guard > "$O/release-$mode.log" 2>&1
    npm run build > "$O/build-$mode.log" 2>&1
    if npm run test:production-contract > "$O/contract-$mode.log" 2>&1; then
      printf 'PASS %s\n' "$mode" > "$O/contract-status-$mode.txt"
    else
      [[ $? == 1 && "$mode" == A ]] || exit 10
      python - "$O/contract-A.log" <<'PY' > "$O/contract-status-A.txt"
import re,sys
from pathlib import Path
a=Path(sys.argv[1]).read_text().splitlines()
assert a.count('Production contract: actual Stage31 fails; fake approvals cannot pass; edits expire reviews; no source mutation.')==1
assert [l for l in a if re.match(r'^[A-Za-z]*Error:',l)]==['Error: 기존 미술에서 가져온 에셋이 아니면 사용 사유를 먼저 기록하십시오.']
frames=[l.strip()for l in a if re.match(r'^\s+at ',l)]
assert len(frames)==2 and frames[0]=='at Object.placeScenery (evalmachine.<anonymous>:85:520)'
assert re.fullmatch(r'at file://[^\n]+/tests/production-contract\.mjs:77:22',frames[1])
assert a[-1].startswith('Node.js v22.')
print('FAIL existing positive fixture at :77:22 on unchanged A; only saved as baseline diagnosis, not a pass.')
PY
    fi
    check_source_pins after
    git diff --binary HEAD -- "${tracked[@]}" > "$O/source-after-$mode.diff"
    cmp "$O/source-before-$mode.diff" "$O/source-after-$mode.diff"
    )
  done
  node "$H/recompose.mjs" "$A" "$B" "$C" "$O/COMPILED-OWNERS.json"
  python "$H/built_graph.py" "$A" "$B" "$C" "$DAG" --compiled-proof "$O/COMPILED-OWNERS.json" "${ALT[@]}"
  exit
fi
[[ -s "$DAG" ]] || { echo 'No clean A/B/C build-DAG evidence; build phase required.' >&2; exit 3; }
pids=()
cleanup(){ for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT
for tuple in A:18841 B:18842 C:18843; do
  mode=${tuple%:*}; port=${tuple#*:}
  python -m http.server "$port" --bind 127.0.0.1 --directory "${!mode}" > "$O/http-$phase-$mode.log" 2>&1 &
  pids+=("$!")
done
for port in 18841 18842 18843; do curl -fSs --retry 5 --retry-connrefused "http://127.0.0.1:$port/HONRO.html" -o /dev/null; done
case "$phase" in
  stage42) script=capture_stage42.py; more=();;
  act1-primary|act1-retained|act1-all) script=capture_act1.py; more=(--slice "${phase#act1-}");;
  *) usage;;
esac
python "$H/$script" --builds "$A" "$B" "$C" --dag "$DAG" --captures "$O/captures" --receipts "$O" "${more[@]}"
