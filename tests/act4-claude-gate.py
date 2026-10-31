"""The design gate must reject a failed route and a missing design card."""
import json, pathlib, shutil, subprocess, tempfile
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as td:
 p=pathlib.Path(td)
 for d in ('tools/act4-claude','tools/act4-pilot/layouts','_local/reports/act4-pilot/stage32/claude'):(p/d).mkdir(parents=True)
 for f in ('gate.py','redo.sh','provenance.py'):
  shutil.copy(root/'tools/act4-claude'/f,p/'tools/act4-claude'/f)
 card={'Wr':[1,200],'Hr':[1,200],'aspect':[.1,10],'supports':[1,3],'bands':[1,2],'span':[0,100],'routes':1,'features':{}}
 (p/'tools/act4-claude/cards.json').write_text(json.dumps({'32':card,'31':{'schema':'criteria-v3'}}))
 layout={'width':100,'height':100,'surfaces':[{'id':'shore','top':[[0,10],[100,10]]}],'routes':[{'supports':['shore']}]} 
 (p/'tools/act4-pilot/layouts/stage32-claude.json').write_text(json.dumps(layout))
 d=p/'_local/reports/act4-pilot/stage32/claude'
 (d/'verification-summary.json').write_text(json.dumps({'edgeBodyChecks':{'passed':1,'total':1},'continuousBodyChecks':{'passed':1,'total':1},'routes':[{'hpLoss':0,'passed':False}]}))
 (d/'trap-sweep.json').write_text(json.dumps({'tested':5,'traps':[]}))
 r=subprocess.run(['sh','tools/act4-claude/redo.sh','30'],cwd=p,text=True,capture_output=True,env={'ACT4_REFERENCE_DIR':'/tmp','PATH':'/usr/bin:/bin'})
 assert r.returncode != 0 and ('No design card' in r.stderr or 'No such file' in r.stderr), (r.returncode,r.stdout,r.stderr)
 assert not (p/'tools/act4-pilot/layouts/stage30-claude.json').exists()
 r=subprocess.run(['python3','tools/act4-claude/gate.py','31'],cwd=p,text=True,capture_output=True)
 assert r.returncode != 0 and 'unverified' in r.stderr, (r.returncode,r.stdout,r.stderr)
print('PASS missing card and unverified criteria card block integration')
with tempfile.TemporaryDirectory() as td:
 output=pathlib.Path(td)/'v3.json'
 subprocess.run(['python3',str(root/'game/docs/quality/materialize-criteria.py'),str(root/'game/docs/quality/40-stage-criteria-v2.json'),str(root/'game/docs/quality/40-stage-criteria-v3.patch.json'),str(output)],check=True,capture_output=True)
 criteria=json.loads(output.read_text()); cards=json.loads((root/'tools/act4-claude/cards.json').read_text())
 for n in (31,34,38,40):
  c,s=cards[str(n)],criteria['stages'][n-1];d=s['design']
  assert c['status']=='proposed-unmeasured' and c['story']==s['storyIntent'] and c['gimmick']==s['gimmick'] and c['winCondition']==s['winCondition']
  assert c['requiredTargets']['rounds']==d['rounds'] and c['requiredTargets']['roundUpperBound']==20
  for key in ('width','height','aspect','platforms','elevationBands','routes','jumps','drops'): assert c['referenceOnly'][key]==d[key]
print('PASS four proposed cards match reconstructed v3 criteria')
