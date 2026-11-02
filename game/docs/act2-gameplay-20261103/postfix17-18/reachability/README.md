# Portable evidence and reproduction

`*.json`, five probe scripts and `REPORT.md` are byte-preserved copies of the original `_local/reports/stage17-reachability/` evidence. `manifest.json` verifies those original bytes. Its scope is file integrity, **not a gameplay pass**. The scripts intentionally retain their original relative imports and output locations; **do not execute them in this documentation folder**. Run from repository root after copying to the original execution folder as below.

The original terminal is already archived once at `tests/fixtures/act2-gameplay/postfix-observations/17-natural-hoist-404/terminal.json.gz`, indexed by the adjacent fixture manifest. Raw SHA256: `b66c3e9e157077303991f0995e5438cba73b6e270f2dca3c89dde5b4614e3e60`. No duplicate large battle fixture is added here.

```sh
mkdir -p _local/reports/stage17-reachability _local/reports/postfix-gameplay/17-natural-hoist-404
cp game/docs/act2-gameplay-20261103/postfix17-18/reachability/*.mjs _local/reports/stage17-reachability/
python - <<'PYTHON'
import gzip, hashlib, pathlib
raw = gzip.decompress(pathlib.Path('tests/fixtures/act2-gameplay/postfix-observations/17-natural-hoist-404/terminal.json.gz').read_bytes())
assert hashlib.sha256(raw).hexdigest() == 'b66c3e9e157077303991f0995e5438cba73b6e270f2dca3c89dde5b4614e3e60'
out = pathlib.Path('_local/reports/postfix-gameplay/17-natural-hoist-404/terminal.json')
if out.exists(): assert out.read_bytes() == raw
else: out.write_bytes(raw)
PYTHON
for probe in probe withdraw-shot knight-isolated jump-probe o02-shot; do
  node --expose-gc --max-old-space-size=512 "_local/reports/stage17-reachability/$probe.mjs"
done
```

Reproduction writes new results only to `_local`, not this frozen evidence. Use the bound source commits in `REPORT.md`; later runtime revisions are distinct experiments. Source1767153a through22365d6c had no changes under `shared/` or `game/src/`. Native Engine parameterized fire is not a normal-browser charge/release demonstration.

Correction to the initial hypothesis is retained prominently: M03 after knight withdrawal did **zero HP and shield damage**. The `withdraw-shot.json` includes immediate-prefire active hero, actor positions/facing/angle, requested angle/power, and freshly recomputed collision/prediction. O02 settlement also records25.2knight HP loss; do not infer zero friendly cost from generic risk0. No full clear or universal route impossibility is asserted.
