"""Exact acb51 public Stage33 native directional captures. No product changes."""
import base64,io,json,math,os,re,subprocess,sys,time,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.dont_write_bytecode=True
sys.path[:0]=[str(ROOT.parent/x) for x in ('acb51-stage-load-canaries','acb51-stage-load-remaining')]
import extend as old
from source import REL,TREE,MF,MANIFEST,SHELL,SHELL_FACT,ENTRY,CAMPAIGN,facts,known,obj,hashb
import load as normal
P=obj((ROOT/'PINS.json').read_bytes())
PARK=(ROOT/'park.js').read_text()
DEV=((1440,900),(390,844))
POSES=(('north',0,-1),('east',1,0),('south',0,1),('west',-1,0),
 ('northwest',-1,-1),('northeast',1,-1),('southwest',-1,1),('southeast',1,1))
REF='refs/heads/qa/acb51-directional-s33'
PREV=P['previousHead']
STAGE=P['stage']
PATHS={'.github/workflows/acb51-directional-canary.yml',*(f'tools/acb51-directional-canary/{p}'for p in ('scan.py','PINS.json','park.js'))}
save=normal.save
def key(stage,dev):return f's{stage:02d}-{dev[0]}x{dev[1]}'
def oldarchive(z):
  a=P['previousArchive']
  names=old.safe(z,64<<20)
  assert set(a['receipt'])<=names
  aa,raw,cc=(known(n,z.read(n),a['receipt'][n])for n in ('AUTHORITY.json','PINNED-WIRE.json','CHROME.json'))
  auth,w,r=map(obj,(aa,raw,cc))
  assert auth['authority']=={'currentRelease':REL,'tree':TREE,'currentPages':[normal.RUN,normal.JOB],
    'manifest':MF,'previousCanaryRun':old.OLD_RUN,'wireArtifact':old.P['wire']['artifact']['id']}
  assert (w['release'],w['tree'],w['manifest'],w['active'],w['mapBytesVerified'],w['packetDecodedVerified'])==(REL,TREE,MF,810,50,50)
  assert facts(raw)==old.P['wire']['receipt']
  assert (r['release'],r['manifest'],r['chrome'],r['shard'],r['status'],r['error'])==(REL,MF,'151.0.7922.34','Act4','HOLD','AssertionError()')
  idx=w['rows'][STAGE-1];assert idx['stage']==STAGE and idx in auth['stageRowsForActualLaunch']
  modes={key(STAGE,dev)for dev in DEV};assert modes==set(P['expectedViews'])
  for k,n in P['expectedViews'].items():
    v=r['visits'][k];s=v['frame']
    assert (v['stage'],v['device'],v['provider'],v['raw'],v['rawSHA256'])==(n['stage'],n['device'],n['activeProvider'],n['raw'],n['rawSHA256'])
    assert v['status']=='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY' and not(v['errors'] or s['declaredMissing'])
    assert (s['physics'],s['phase'],s['round'],s['time'])==(n['physics'],'aim',1,2) and hashb(z.read(v['raw']))==n['rawSHA256']
  return idx,raw

def authority(work):
  head=os.environ['GITHUB_SHA'];g=old.gtxt;api=normal.gh
  assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(normal.API,REF,'push')
  assert g('rev-list','--parents','-n1','HEAD').split()==[head,PREV]
  assert g('rev-list','--parents','-n1',PREV).split()==[PREV,old.PREV]
  assert g('rev-list','--parents','-n1',old.PREV).split()==[old.PREV,REL]
  assert g('rev-parse',REL+'^{tree}')==TREE and g('rev-parse',old.PREV+'^{tree}')==old.PREVTREE
  assert not g('status','--porcelain=v1')
  assert set(g('diff','--name-status','--no-renames',PREV,head).splitlines())=={'A\t'+p for p in PATHS}
  assert all(g('ls-tree',head,'--',p).startswith('100644 ')for p in PATHS)
  assert set(g('diff','--name-status','--no-renames',old.PREV,PREV).splitlines())=={'A\t'+p for p in old.PATHS}
  assert set(g('diff','--name-status','--no-renames',REL,old.PREV).splitlines())=={'A\t'+p for p in normal.PATHS}
  for path,info in P['inherited'].items():assert facts(old.git('show',PREV+':'+path))==info
  assert api('git/ref/heads/master')['object']['sha']==REL
  pg=api(f'actions/runs/{normal.RUN}');pj=api(f'actions/jobs/{normal.JOB}')
  assert (pg['id'],pg['head_sha'],pg['head_branch'],pg['name'],pg['status'],pg['conclusion'])==(normal.RUN,REL,'master','pages build and deployment','completed','success')
  assert (pj['id'],pj['run_id'],pj['name'],pj['status'],pj['conclusion'])==(normal.JOB,normal.RUN,'deploy','completed','success')
  assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in pj['steps'])
  pr=P['previousRun'];run=api(f'actions/runs/{pr}');a=P['previousArchive'];j=api(f"actions/jobs/{a['job']}")
  assert (run['id'],run['head_sha'],run['head_branch'],run['conclusion'])==(pr,PREV,'qa/acb51-loadability-remaining','failure')
  assert run['repository']['full_name']==run['head_repository']['full_name']==normal.API
  assert (j['id'],j['run_id'],j['name'],j['conclusion'])==(a['job'],pr,'scene-load (Act4)','failure')
  assert { (s['name'],s['conclusion']) for s in j['steps'] }>={('Read-only same release and proven prior artifact scope','success'),
    ('Exact anonymous Chrome only for uncaptured current stages','failure')}
  artifacts=api(f"actions/runs/{pr}/artifacts?name={a['name']}")['artifacts'];(item,)=artifacts
  assert not item['expired'] and (item['id'],item['name'],item['size_in_bytes'],item['digest'])==(a['id'],a['name'],a['bytes'],'sha256:'+a['sha256'])
  assert (item['workflow_run']['id'],item['workflow_run']['head_sha'])==(pr,PREV)
  body=subprocess.check_output(['gh','api',f"repos/{normal.API}/actions/artifacts/{a['id']}/zip"],timeout=65)
  with zipfile.ZipFile(io.BytesIO(known('prior independent stage archive',body,{k:a[k]for k in ('bytes','sha256')}))) as z: row,w=oldarchive(z)
  assert facts(old.git('show',REL+':'+MANIFEST))==MF
  (work/'PINNED-WIRE.json').write_bytes(w)
  save(work/'out'/'AUTHORITY.json',{'release':REL,'tree':TREE,'manifest':MF,'pages':[normal.RUN,normal.JOB],
      'previousActual':[pr,a['id']],'previousWorkflowNotRelabeled':True,'verified':True,'head':head,'pending':row})

# Same public anonymous load/closure protocol as pinned upstream; only adds eight readbacks.
def capture(browser,w,row,device,proof,active):
 from PIL import Image
 out=w/'out';stage=row['stage']; key=f"s{stage:02d}-{device[0]}x{device[1]}"
 ctx=browser.new_context(viewport={'width':device[0],'height':device[1]},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+normal.INIT+')()')
 errors=[]; state={'stage':stage,'device':list(device),'status':'INIT','errors':errors,'views':{}}
 proof['visits'][key]=state
 def emit():save(out/'DIRECTIONAL.json',proof)
 hits=[];todo=set();observed={};blobs=set();pos=0
 valid={**active,SHELL:SHELL_FACT,MANIFEST:MF}
 def path(url):return url[len(BASE):] if url.startswith(BASE)and '?'not in url and '#'not in url else None
 def asked(q):
  z=path(q.url)
  if not(q.method=='GET' and (z in valid or z in MEDIA and q.resource_type=='media' or BLOB.fullmatch(q.url) or q.url.startswith('data:'))):
   errors.append(['noncanonical request',q.method,q.url])
  if z in valid:todo.add(q)
 def fail(q):
  todo.discard(q)
  if not(path(q.url)in MEDIA and q.resource_type=='media'and q.failure=='net::ERR_ABORTED'):errors.append(['failed',q.url,q.failure])
 def received(r):
  z=path(r.url)
  if z in valid and r.status==200:hits.append((z,r))
  elif BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif z in MEDIA and r.status in (200,206) and r.request.resource_type=='media':return
  elif not r.url.startswith('data:'):errors.append(['bad response',r.status,r.url])
 p.on('request',asked);p.on('requestfinished',lambda q:todo.discard(q));p.on('requestfailed',fail);p.on('response',received)
 p.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 keys=set(row['requiredExactHTTP'])|{SHELL}
 def drain():
  nonlocal pos
  until=time.monotonic()+20
  quiet=0
  while time.monotonic()<until:
   assert not errors, errors
   while pos<len(hits)and hits[pos][1].request not in todo:
    z,r=hits[pos];body=r.body();known(z,body,valid[z]);observed[z]=valid[z];pos+=1
   before=(pos,len(blobs));p.wait_for_timeout(105)
   ok=before==(len(hits),len(blobs))and not todo and keys<=observed.keys()
   quiet=quiet+1 if ok else 0
   if quiet==3:
    assert blobs<=set(p.evaluate('()=>Array.from(__honroObserver.blobs)'))
    return
  raise RuntimeError(('actual exact response closure',sorted(keys-observed.keys()),sorted(x.url for x in todo),errors))
 try:
  r=p.goto(BASE+SHELL,wait_until='domcontentloaded',timeout=50000)
  assert r and r.status==200 and r.url==BASE+SHELL
  known(SHELL,r.body(),SHELL_FACT);state['status']='SHELL_EXACT';emit()
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  state['provider']=p.evaluate(normal.LAUNCH,row);state['status']='CANONICAL_LAUNCH_CHECKED';emit()
  p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  assert state['provider']==P['expectedViews'][key]['activeProvider']
  for name,dx,dy in POSES:
   q={'stage':stage,'id':row['catalogID'],'readback':False,'name':name,'dx':dx,'dy':dy}
   f=p.evaluate(PARK,q)
   decoded=p.evaluate(normal.DECODE)
   assert p.evaluate(PARK,{**q,'readback':True})==f
   assert f['physics']==P['expectedViews'][key]['physics']
   raw=base64.b64decode(p.evaluate(normal.RAW),validate=True)
   with Image.open(BytesIO(raw))as im:
    im.load(); assert im.format=='PNG' and list(im.size)==f['backing'] and im.convert('RGB').getextrema()!=((0,0),(0,0),(0,0))
   rawName=key+'-'+name+'-raw.png'
   (out/rawName).write_bytes(raw)
   location=tuple(round(f['actual'][k],8)for k in ('x','y','scale'))
   earlier=next((prev for prev,g in state['views'].items() if tuple(round(g['actual'][k],8)for k in ('x','y','scale'))==location),None)
   assert earlier is None or state['views'][earlier]['rawSHA256']==hashb(raw), ('same clamp camera, different frozen PNG',name,earlier)
   state['views'][name]={**f,'raw':rawName,'rawSHA256':hashb(raw),'decodeCount':decoded,'duplicateOfNativeCamera':earlier}
   assert not errors,errors
   emit()
  drain();assert not errors
  assert tuple(state['views'])==tuple(p[0]for p in POSES)
  state.update(status='PASS_DIRECTION_CAPTURE_ONLY',requiredObserved={z:observed[z]for z in sorted(keys)},
    distinctNativeCameras=sum(v['duplicateOfNativeCamera']is None for v in state['views'].values()), observedCount=len(observed))
 except Exception as e:state.update(status='HOLD',error=repr(e),observedPartial=observed)
 finally:emit();ctx.close()

BASE,BLOB,MEDIA=normal.BASE,normal.BLOB,normal.MEDIA
exact_public=normal.exact_public
BytesIO=io.BytesIO
def app(work):
  from playwright.sync_api import sync_playwright
  assert not (os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
  out=work/'out';meta=obj((out/'AUTHORITY.json').read_bytes());assert meta['verified']
  row=meta['pending']; w=obj(known('all-50 public wire',(work/'PINNED-WIRE.json').read_bytes(),old.P['wire']['receipt']))
  assert row==w['rows'][STAGE-1] and row['stage']==STAGE
  m=obj(exact_public(MANIFEST,MF));active={i['path']:{k:i[k]for k in ('bytes','sha256')}for i in m['files']};assert len(active)==810
  for p in (CAMPAIGN,ENTRY,SHELL):exact_public(p,SHELL_FACT if p==SHELL else active[p])
  q={'release':REL,'manifest':MF,'stage':STAGE,'status':'INIT','visits':{},'ordinal':list(range(1,51)),
      'scope':'Actual anonymous directional first-aim camera observations only, no input playthrough, ordinary recapture, other tide state, geometry change, density, or visual pass.'}
  try:
   with sync_playwright()as pw:
    b=pw.chromium.launch(headless=True);q['chrome']=b.version
    try:
     assert b.version=='151.0.7922.34'
     for dev in DEV:
      capture(b,work,row,dev,q,active)
      assert not b.contexts
    finally:b.close()
   exact_public(MANIFEST,MF)
   assert set(q['visits'])=={key(STAGE,d)for d in DEV}
   assert all(v['status']=='PASS_DIRECTION_CAPTURE_ONLY' for v in q['visits'].values()),'at least one authentic device visit held'
   assert sum(len(v['views'])for v in q['visits'].values())==len(DEV)*len(POSES)==16
   assert set(r['raw']for v in q['visits'].values()for r in v['views'].values())=={p.name for p in out.glob('*-raw.png')}
   q['status']='PASS_16_DIRECTION_CAPTURE_SCOPE_ONLY'
  except Exception as e:q.update(status='HOLD',error=repr(e));raise
  finally:save(out/'DIRECTIONAL.json',q)
if __name__=='__main__':
  assert len(sys.argv)==3 and sys.argv[1] in ('authority','app')
  w=Path(sys.argv[2]).resolve()
  assert w!=Path(os.environ['RUNNER_TEMP']).resolve() and w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
  (authority if sys.argv[1]=='authority'else app)(w)
