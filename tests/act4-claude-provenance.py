"""Old, mixed, changed or tampered geometry reports cannot pass the gate."""
import hashlib,json,os,pathlib,shutil,subprocess,tempfile
root=pathlib.Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
with tempfile.TemporaryDirectory() as td:
 p=pathlib.Path(td)
 for d in ('shared/data/act4/world.parts','shared/runtime','shared/assets','game/engine','game/vendor','game/config','game/src','game/docs/equipment','game/tests','game/node_modules/typescript/lib','tools/act4-claude','tools/act4-pilot/layouts','_local/reports/act4-pilot/stage32/claude'):(p/d).mkdir(parents=True)
 for name in ('gate.py','provenance.py','provenance.mjs'):shutil.copy(root/'tools/act4-claude'/name,p/'tools/act4-claude'/name)
 for name in ('game/tests/helpers.mjs','game/node_modules/typescript/lib/typescript.js','package.json','package-lock.json','game/package.json','game/package-lock.json','shared/runtime/game.js','shared/assets/asset.svg'):(p/name).write_text('original')
 raw=b'{}';(p/'shared/data/act4/world.json').write_bytes(raw);(p/'shared/data/act4/world.parts/part-000.jsonpart').write_bytes(raw)
 (p/'shared/data/act4/world.parts/manifest.json').write_text(json.dumps({'version':1,'encoding':'utf-8','bytes':len(raw),'sha256':sha(raw),'parts':[{'file':'part-000.jsonpart','bytes':len(raw),'sha256':sha(raw)}]}))
 card={'Wr':[1,200],'Hr':[1,200],'aspect':[.1,10],'supports':[1,3],'bands':[1,2],'span':[0,100],'routes':1,'features':{}}
 (p/'tools/act4-claude/cards.json').write_text(json.dumps({'32':card}))
 layout={'width':100,'height':100,'surfaces':[{'id':'shore','top':[[0,10],[100,10]]}],'routes':[{'supports':['shore']}]}
 (p/'tools/act4-pilot/layouts/stage32-claude.json').write_text(json.dumps(layout));d=p/'_local/reports/act4-pilot/stage32/claude';(d/'stage.json').write_text('{}');(d/'blueprint.json').write_text(json.dumps(layout))
 v={'edgeBodyChecks':{'passed':1,'total':1},'continuousBodyChecks':{'passed':1,'total':1},'routes':[{'hpLoss':0,'passed':True}]};t={'tested':5,'traps':[]}
 (d/'verification-summary.json').write_text(json.dumps(v));(d/'trap-sweep.json').write_text(json.dumps(t))
 env={**os.environ,'ACT4_PROBE_RUN_ID':'fresh-run'}
 def gate():return subprocess.run(['python3','tools/act4-claude/gate.py','32'],cwd=p,env=env,text=True,capture_output=True)
 def bind():
  snap=json.loads(subprocess.check_output(['python3','tools/act4-claude/provenance.py','32',str(d)],cwd=p,text=True))
  for name in ('verification-summary.json','trap-sweep.json'):
   (d/(name+'.binding.json')).write_text(json.dumps({'version':1,'runId':'fresh-run','inputs':snap,'reportSha256':sha((d/name).read_bytes())}))
 assert gate().returncode!=0, 'unbound old reports must fail'
 # Exercise the same JS report writer used by both real probes, not just the gate.
 js="""import {readFile} from 'node:fs/promises';import {snapshot,writeReport} from './tools/act4-claude/provenance.mjs';const d='_local/reports/act4-pilot/stage32/claude';const before=snapshot(32,d);for(const name of ['verification-summary.json','trap-sweep.json']){const f=d+'/'+name;await writeReport(f,await readFile(f,'utf8'),before,32,d)}"""
 subprocess.run(['node','--input-type=module','-e',js],cwd=p,env=env,check=True,capture_output=True)
 assert gate().returncode==0,gate().stderr
 drift="""import {writeFile} from 'node:fs/promises';import {snapshot,writeReport} from './tools/act4-claude/provenance.mjs';const d='_local/reports/act4-pilot/stage32/claude',before=snapshot(32,d);await writeFile('shared/runtime/game.js','changed during run');try{await writeReport(d+'/verification-summary.json','{}',before,32,d);process.exitCode=1}catch(e){if(!String(e).includes('inputs changed'))throw e}"""
 subprocess.run(['node','--input-type=module','-e',drift],cwd=p,env=env,check=True,capture_output=True)
 assert gate().returncode!=0;(p/'shared/runtime/game.js').write_text('original')
 bind();assert gate().returncode==0,gate().stderr
 v['routes'][0]['passed']=False;(d/'verification-summary.json').write_text(json.dumps(v));bind();r=gate();assert r.returncode!=0 and 'FAIL routes completed' in r.stdout
 v['routes'][0]['passed']=True;(d/'verification-summary.json').write_text(json.dumps(v));bind();assert gate().returncode==0
 for path in ('shared/data/act4/world.json','shared/data/act4/world.parts/part-000.jsonpart','shared/runtime/game.js','shared/assets/asset.svg','game/engine/code.js','game/node_modules/typescript/lib/typescript.js','tools/act4-pilot/layouts/stage32-claude.json','_local/reports/act4-pilot/stage32/claude/stage.json'):
  f=p/path;old=f.read_bytes() if f.exists() else None;f.write_text('changed');r=gate();assert r.returncode!=0 and 'provenance failed' in r.stderr,(path,r.stdout,r.stderr)
  if old is None:f.unlink()
  else:f.write_bytes(old)
 r=d/'trap-sweep.json';old=r.read_bytes();r.write_text('{"tested":999,"traps":[]}');assert gate().returncode!=0;r.write_bytes(old)
 env['ACT4_PROBE_RUN_ID']='other-run';assert gate().returncode!=0
 env['ACT4_PROBE_RUN_ID']='fresh-run';assert gate().returncode==0
 print('PASS unbound/mixed/stale world, runtime, asset, layout, stage and modified reports are rejected')
