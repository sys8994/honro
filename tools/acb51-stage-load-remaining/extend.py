"""Consume exact prior wire + actual canaries; no repeated six stage launches; no product mutations."""
import json, os,re,stat,subprocess,sys,zipfile,io
from pathlib import Path,PurePosixPath
D=Path(__file__).resolve().parent
sys.dont_write_bytecode=True
sys.path.insert(0,str(D.parent/'acb51-stage-load-canaries'))
import load as original
from source import REL,TREE,MF,MANIFEST,SHELL,SHELL_FACT,ENTRY,CAMPAIGN,facts,known,obj,hashb
P=obj((D/'CARRYOVER.json').read_bytes())
PREV='7ef7ceff7c0810f125ff4c55afa196526df53344'
PREVTREE='77bda1c92904e863d921e96bd7d40ad186576fec'
OLD_BRANCH='qa/acb51-first-loadability-canaries'
OLD_FLOW='.github/workflows/acb51-stage-load-canaries.yml'
OLD_RUN=44920547861
REF='refs/heads/qa/acb51-loadability-remaining'
HTTPS=original.BASE
EXTRA_MOBILE={7,21,23,29,33,34,44}
SHARDS={f'Act{i}':list(range((i-1)*10+1,i*10+1))for i in range(1,6)}
PATHS={'.github/workflows/acb51-stage-load-remaining.yml','tools/acb51-stage-load-remaining/extend.py','tools/acb51-stage-load-remaining/CARRYOVER.json'}
RUN,JOB=original.RUN,original.JOB
def git(*p):return subprocess.check_output(['git',*p],timeout=40)
def gtxt(*p):return git(*p).decode().strip()
def base(p):return git('show',REL+':'+p)
def safe(z,limit):
 entries=z.infolist();seen=set()
 for x in entries:
  p=PurePosixPath(x.filename)
  assert p.parts and not p.is_absolute() and '..'not in p.parts and p.as_posix()==x.filename and '\\'not in x.filename
  assert p.as_posix()not in seen and not stat.S_ISLNK(x.external_attr>>16)
  seen.add(p.as_posix())
 assert sum(x.file_size for x in entries)<=limit and z.testzip()is None
 return seen
def fromapi(a,oldrun):
 api=original.gh
 available=api(f'actions/runs/{oldrun}/artifacts?name={a["name"]}')['artifacts']
 assert len(available)==1
 v=available[0]
 assert not v['expired'] and (v['id'],v['name'],v['size_in_bytes'],v['digest'])==(a['id'],a['name'],a['bytes'],'sha256:'+a['sha256'])
 assert (v['workflow_run']['id'],v['workflow_run']['head_sha'],v['workflow_run']['head_branch'])==(oldrun,PREV,OLD_BRANCH)
 b=subprocess.check_output(['gh','api',f'repos/{original.API}/actions/artifacts/{a["id"]}/zip'],timeout=65)
 assert facts(b)=={k:a[k]for k in ('bytes','sha256')}
 return zipfile.ZipFile(io.BytesIO(b))
def header(z):
 p=obj(z.read('AUTHORITY.json'))
 assert p['verified'] and p['head']==PREV and p['release']==REL and p['tree']==TREE and p['manifest']==MF and p['pages']==[RUN,JOB]
def wire(z):
 assert safe(z,512<<10)=={'AUTHORITY.json','WIRE.json'};header(z)
 raw=known('prior exact WIRE.json',z.read('WIRE.json'),P['wire']['receipt']);w=obj(raw)
 assert w['release']==REL and w['tree']==TREE and w['manifest']==MF and w['active']==810
 assert w['mapBytesVerified']==w['packetDecodedVerified']==w['stages']==50 and [r['stage']for r in w['rows']]==list(range(1,51))
 for r in w['rows']:
  assert r['mapBytesVerified'] and r['packetAggregateVerified'] and not r['partsMissing']
 return raw,w
def carry(z,ref,shard,w,active):
 names=safe(z,12<<20);header(z)
 assert names=={'AUTHORITY.json','WIRE.json','CHROME.json',*ref['pngs']}
 s=obj(known('prior exact Chrome receipt',z.read('CHROME.json'),ref['chrome']))
 assert s['release']==REL and s['manifest']==MF and s['stageShard']==shard and s['status']=='PASS_SCOPE_ONLY' and s['chrome']=='151.0.7922.34'
 assert set(s['visits'])==set(ref['visits'])
 p=obj(z.read('WIRE.json')); bodies={t['stage']:t for t in p['rows']}
 assert p['release']==REL and p['manifest']==MF and sorted(bodies)==original.SHARDS[shard]
 results={}
 for k,v in s['visits'].items():
  t=v['stage'];assert t in original.SHARDS[shard]
  ww=w['rows'][t-1];f=v['frame'];provider=v['provider'];want=ref['visits'][k]
  assert bodies[t]==ww and v['status']=='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY' and not(v['errors'] or f['declaredMissing'])
  assert (f['phase'],f['round'],f['time'])==('aim',1,2) and f['physics']==want['physics'] and v['raw']==want['raw']
  assert provider['stage']==ww['catalogID'] and [provider['width'],provider['height']]==ww['activeDeclaredDimensions']
  pc=provider['compact']; wc=ww.get('compactWitness')
  assert (pc is None and wc is None) or (wc is not None and pc=={'revision':wc['revision'],'matched':True,'assetCount':len(wc['packageAssetIDs'])})
  o=v['requiredObserved'];needs=set(ww['requiredExactHTTP'])|{SHELL}
  assert set(o)==needs and all(o[key]==({**active,SHELL:SHELL_FACT})[key]for key in needs)
  data=known('archived prior actual image',z.read(v['raw']),ref['pngs'][v['raw']])
  assert hashb(data)==v['rawSHA256'] and data[:8]==bytes.fromhex('89504e470d0a1a0a') and tuple(map(int,k.split('-')[1].split('x')))==tuple(v['device'])
  results[k]={'stage':t,'existingActualArtifact':ref['artifact']['id'],'rawSHA256':v['rawSHA256'],'physics':f['physics'],'provider':provider,'noRepeat':True}
 assert set(t['stage']for t in results.values())==set(original.SHARDS[shard])
 return results
def scope(w,shard):
 os.environ['PYTHONDONTWRITEBYTECODE']='1'
 assert P['ready']is True and set(P['canaries'])==set(SHARDS)
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(original.API,REF,'push')
 head=os.environ['GITHUB_SHA']
 assert gtxt('rev-list','--parents','-n1','HEAD').split()==[head,PREV]
 assert gtxt('rev-list','--parents','-n1',PREV).split()==[PREV,REL] and gtxt('rev-parse',PREV+'^{tree}')==PREVTREE
 assert gtxt('rev-parse',REL+'^{tree}')==TREE and not gtxt('status','--porcelain=v1')
 assert set(gtxt('diff','--name-status','--no-renames',PREV,head).splitlines())=={'A\t'+p for p in PATHS}
 assert all(gtxt('ls-tree',head,'--',p).split()[0]=='100644'for p in PATHS)
 assert set(gtxt('diff','--name-status','--no-renames',REL,PREV).splitlines())=={'A\t'+p for p in original.PATHS}
 for p,a in P['inherited'].items():
  assert facts(git('show',PREV+':'+p))==a
 api=original.gh
 assert api('git/ref/heads/master')['object']['sha']==REL
 pg=api(f'actions/runs/{RUN}');pj=api(f'actions/jobs/{JOB}')
 assert (pg['id'],pg['head_sha'],pg['head_branch'],pg['name'],pg['status'],pg['conclusion'])==(RUN,REL,'master','pages build and deployment','completed','success')
 assert (pj['id'],pj['run_id'],pj['name'],pj['status'],pj['conclusion'])==(JOB,RUN,'deploy','completed','success')
 assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in pj['steps'])
 old=api(f'actions/runs/{OLD_RUN}')
 assert old['repository']['full_name']==old['head_repository']['full_name']==original.API
 assert (old['id'],old['head_sha'],old['head_branch'],old['path'],old['status'],old['conclusion'])==(OLD_RUN,PREV,OLD_BRANCH,OLD_FLOW,'completed','success')
 j=api(f"actions/jobs/{P['wire']['job']}")
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(P['wire']['job'],OLD_RUN,'canary (all-wire, all)','completed','success')
 j=api(f"actions/jobs/{P['canaries'][shard]['job']}")
 text=f"canary ({shard}, {','.join(map(str,original.SHARDS[shard]))})"
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(P['canaries'][shard]['job'],OLD_RUN,text,'completed','success')
 assert any(x['name']=='Actual anonymous Chrome load of canonical scene' and x['conclusion']=='success'for x in j['steps'])
 refs=obj(known('inherited acb release',base(MANIFEST),MF))
 active={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in refs['files']}
 assert len(active)==810
 with fromapi(P['wire']['artifact'],OLD_RUN)as z:wr,wf=wire(z)
 with fromapi(P['canaries'][shard]['artifact'],OLD_RUN)as z:passes=carry(z,P['canaries'][shard],shard,wf,active)
 done={t['stage']for t in passes.values()}
 pending=sorted(set(SHARDS[shard])-done)
 candidates=[]
 for n in pending:
  row=wf['rows'][n-1]
  for k in row['requiredExactHTTP']:
   assert k in active
  candidates.append(row)
 proof={'authority':{'currentRelease':REL,'tree':TREE,'currentPages':[RUN,JOB],'manifest':MF,'previousCanaryRun':OLD_RUN,'wireArtifact':P['wire']['artifact']['id']},
        'shard':shard,'wholeTen':SHARDS[shard],'carryoverActual':passes,'pending':pending,
        'stageRowsForActualLaunch':candidates,'targetedMobile':sorted(EXTRA_MOBILE&set(pending)),'status':'READY_TO_RUN_OTHER_STAGES_ONLY'}
 original.save(w/'out'/'AUTHORITY.json',proof)
 (w/'out'/'PINNED-WIRE.json').write_bytes(wr)
def app(w,shard):
 from playwright.sync_api import sync_playwright
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';a=obj((out/'AUTHORITY.json').read_bytes());assert a['status']=='READY_TO_RUN_OTHER_STAGES_ONLY' and a['shard']==shard
 wr=obj(known('same official all-wire',(out/'PINNED-WIRE.json').read_bytes(),P['wire']['receipt']))
 m=obj(original.exact_public(MANIFEST,MF));active={x['path']:{k:x[k]for k in ('sha256','bytes')}for x in m['files']}
 assert len(active)==810
 for p in (CAMPAIGN,ENTRY,SHELL):original.exact_public(p,SHELL_FACT if p==SHELL else active[p])
 assert a['stageRowsForActualLaunch']==[wr['rows'][n-1]for n in a['pending']]
 p={'release':REL,'manifest':MF,'shard':shard,'status':'INIT','visits':{},'carryoverActual':a['carryoverActual'],
    'claimedScope':'Canonical first aim and exact public loads only. Not full play, density, all-camera art or terrain audit round.'}
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(headless=True);p['chrome']=browser.version;assert browser.version=='151.0.7922.34'
   try:
    for row in a['stageRowsForActualLaunch']:
     dims=[(1440,900)]+([(390,844)]if row['stage']in a['targetedMobile']else [])
     for device in dims:
      try:original.capture(browser,w,row,device,p,active)
      finally:
       leaked=list(browser.contexts)
       for c in leaked:c.close()
       assert not leaked,'fresh diagnostic context failed to close'
      key=f"s{row['stage']:02d}-{device[0]}x{device[1]}"
      v=p['visits'][key]
      if v['status']=='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY' and v['frame']['declaredMissing']:
       v.update(status='HOLD_PLACEMENT_CLOSURE',error='Actual canonical stage still lists unresolved asset owners')
      original.save(out/'CHROME.json',p)
   finally:browser.close()
  original.exact_public(MANIFEST,MF)
  assert all(v['status']=='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY'for v in p['visits'].values())
  covered={v['stage']for key,v in p['visits'].items()if v['device']==[1440,900]}|{v['stage']for v in p['carryoverActual'].values()}
  assert sorted(covered)==SHARDS[shard]
  p['status']='PASS_TEN_STAGE_LOAD_SCOPE_ONLY'
 except Exception as e:p.update(status='HOLD',error=repr(e));raise
 finally:original.save(out/'CHROME.json',p)
if __name__=='__main__':
 mode=sys.argv[1];w=Path(sys.argv[2]);shard=sys.argv[3]
 assert w.resolve().is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()) and shard in SHARDS
 (scope if mode=='authority'else app)(w,shard)
