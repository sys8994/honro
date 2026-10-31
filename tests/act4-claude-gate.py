"""The design gate must reject a failed route and a missing design card."""
import json, pathlib, shutil, subprocess, tempfile
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as td:
 p=pathlib.Path(td)
 for d in ('tools/act4-claude','tools/act4-pilot/layouts','_local/reports/act4-pilot/stage32/claude'):(p/d).mkdir(parents=True)
 for f in ('gate.py','redo.sh'):
  shutil.copy(root/'tools/act4-claude'/f,p/'tools/act4-claude'/f)
 card={'Wr':[1,200],'Hr':[1,200],'aspect':[.1,10],'supports':[1,3],'bands':[1,2],'span':[0,100],'routes':1,'features':{}}
 (p/'tools/act4-claude/cards.json').write_text(json.dumps({'32':card}))
 layout={'width':100,'height':100,'surfaces':[{'id':'shore','top':[[0,10],[100,10]]}],'routes':[{'supports':['shore']}]} 
 (p/'tools/act4-pilot/layouts/stage32-claude.json').write_text(json.dumps(layout))
 d=p/'_local/reports/act4-pilot/stage32/claude'
 (d/'verification-summary.json').write_text(json.dumps({'edgeBodyChecks':{'passed':1,'total':1},'continuousBodyChecks':{'passed':1,'total':1},'routes':[{'hpLoss':0,'passed':False}]}))
 (d/'trap-sweep.json').write_text(json.dumps({'tested':5,'traps':[]}))
 r=subprocess.run(['python3','tools/act4-claude/gate.py','32'],cwd=p,text=True,capture_output=True)
 assert r.returncode != 0 and 'FAIL routes completed' in r.stdout, (r.returncode,r.stdout,r.stderr)
 r=subprocess.run(['sh','tools/act4-claude/redo.sh','31'],cwd=p,text=True,capture_output=True,env={'ACT4_REFERENCE_DIR':'/tmp','PATH':'/usr/bin:/bin'})
 assert r.returncode != 0 and 'No design card' in r.stderr, (r.returncode,r.stdout,r.stderr)
 assert not (p/'tools/act4-pilot/layouts/stage31-claude.json').exists()
print('PASS failed route blocks gate; missing card blocks before generation/integration')
