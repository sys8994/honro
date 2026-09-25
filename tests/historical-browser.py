"""Archived browser regressions, paired with the untouched RC21 application."""
import json,shutil,subprocess,sys
from browser_support import ROOT

baseline=ROOT/'.test-output/rc21-baseline'
assert (baseline/'HONRO.html').exists(),'Run the historical Node setup first'
(baseline/'tests').mkdir(exist_ok=True)
shutil.copy2(ROOT/'tests/browser_support.py',baseline/'tests/browser_support.py')
logs=ROOT/'.test-output/historical';logs.mkdir(exist_ok=True)
rows=[]
for script in sorted((ROOT/'game/tests').glob('*browser.py')):
    # Only platform/UTF-8 portability edits; use identical test code against each app.
    original_paths=script.read_text(encoding='utf-8').replace('shared/runtime/','game/src/').replace('shared/engine/src/','game/engine/src/')
    (baseline/'game/tests'/script.name).write_text(original_paths,encoding='utf-8')
    row={'script':script.name}
    for label,root in [('baseline',baseline),('integrated',ROOT)]:
        try:
            result=subprocess.run([sys.executable,'-X','utf8','game/tests/'+script.name],cwd=root,capture_output=True,encoding='utf-8',errors='replace',timeout=180)
            output=result.stdout+result.stderr;row[label]={'exitCode':result.returncode}
        except subprocess.TimeoutExpired:
            output='Timeout after 180 seconds';row[label]={'exitCode':'timeout'}
        (logs/(label+'-'+script.stem+'.log')).write_text(output,encoding='utf-8')
        row[label]['failures']=[line[:500] for line in output.splitlines() if line.startswith(('FAIL','AssertionError','Error:')) or 'TimeoutError' in line][:20]
    row['newFailure']=row['baseline']['exitCode']==0 and row['integrated']['exitCode']!=0
    rows.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)
    (ROOT/'reports/historical-browser.json').write_text(json.dumps({'baselineCommit':'8c22dde','rows':rows},ensure_ascii=False,indent=2),encoding='utf-8')
assert not any(r['newFailure'] for r in rows),'New browser failure versus RC21'
