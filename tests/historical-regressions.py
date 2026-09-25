"""Run every archived Node audit against both the imported RC21 snapshot and integration.

Several RC5-RC19 tests assert maps superseded before this integration. Classify those
against the pristine imported commit instead of silently changing their expected maps.
"""
from pathlib import Path
import json,subprocess
from browser_support import ROOT

baseline=ROOT/'.test-output/rc21-baseline'
assert (baseline/'game/tests/helpers.mjs').exists(),'git worktree add --detach .test-output/rc21-baseline 8c22dde, then npm --prefix that/game ci'
logs=ROOT/'.test-output/historical';logs.mkdir(exist_ok=True)
rows=[]
for script in sorted((ROOT/'game/tests').glob('*.mjs')):
    if script.name=='helpers.mjs':continue
    row={'script':script.name}
    for label,root in [('baseline',baseline),('integrated',ROOT)]:
        try:
            result=subprocess.run(['node','game/tests/'+script.name],cwd=root,capture_output=True,encoding='utf-8',errors='replace',timeout=240)
            row[label]={'exitCode':result.returncode}
            output=result.stdout+result.stderr
        except subprocess.TimeoutExpired:
            row[label]={'exitCode':'timeout'};output='Timed out after 240 seconds'
        (logs/(label+'-'+script.stem+'.log')).write_text(output,encoding='utf-8')
        row[label]['failures']=[line[:500] for line in output.splitlines() if line.startswith(('FAIL','AssertionError','Error:','Error [','    throw')) or 'ENOENT' in line][:24]
    row['newFailure']=row['baseline']['exitCode']==0 and row['integrated']['exitCode']!=0
    rows.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)
    (ROOT/'reports/historical-regressions.json').write_text(json.dumps({'baselineCommit':'8c22dde','rows':rows},ensure_ascii=False,indent=2),encoding='utf-8')
assert not any(r['newFailure'] for r in rows),'New failure versus RC21; inspect reports/historical-regressions.json'
