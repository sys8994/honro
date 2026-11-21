"""Anonymous acb51 eight-direction capture. Preserve exact game, renderer, and prior evidence."""
import base64,io,json,math,os,struct,subprocess,sys,time,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.dont_write_bytecode=True
sys.path[:0]=[str(ROOT.parent/p) for p in ('acb51-directional-canary','acb51-stage-load-canaries','acb51-stage-load-remaining')]
import scan as C
import load as normal
import extend as old
from source import REL,TREE,MF,MANIFEST,SHELL,SHELL_FACT,ENTRY,CAMPAIGN,facts,known,obj,hashb
P=obj((ROOT/'PINS.json').read_bytes())
SHARDS={f'A{i}{ab}':list(range((i-1)*10+1+j*5,(i-1)*10+6+j*5))for i in range(1,6)for j,ab in enumerate('ab')}
REF='refs/heads/qa/acb51-directional-full'
SHIPPED={'.github/workflows/acb51-directional-full.yml',*(f'tools/acb51-directional-full/{p}'for p in ('full.py','PINS.json'))}
BEFORE=P['sources']['directional']['head']
RUN_STAGE33=P['directional']['id']
POSE={x[0]:x[1:]for x in C.POSES}
DEV=C.DEV
save=normal.save
BASE,BLOB,MEDIA=normal.BASE,normal.BLOB,normal.MEDIA
exact_public=normal.exact_public
BytesIO=io.BytesIO
PACK_MAX=48<<20
SOFT_SECONDS=17*60
def expected(n):
  return [(C.key(s,d), name) for s in n for d in DEV for name in POSE]
def noauth(): assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
def archive(s,a):
  api=normal.gh;r=P['sources'][s];j=api(f"actions/jobs/{a['job']}")
  assert (j['run_id'],j['status'],j['conclusion'])==(r['run'],'completed','failure' if s=='remaining' else 'success')
  if s=='remaining': assert any(v['name']=='Read-only same release and proven prior artifact scope'and v['conclusion']=='success'for v in j['steps'])
  (at,)=api(f"actions/runs/{r['run']}/artifacts?name={a['name']}")['artifacts']
  assert not at['expired'] and (at['id'],at['name'],at['size_in_bytes'],at['digest'])==(a['id'],a['name'],a['bytes'],'sha256:'+a['sha256'])
  assert (at['workflow_run']['id'],at['workflow_run']['head_sha'],at['workflow_run']['head_branch'])==(r['run'],r['head'],r['branch'])
  blob=subprocess.check_output(['gh','api',f"repos/{normal.API}/actions/artifacts/{a['id']}/zip"],timeout=65)
  return zipfile.ZipFile(BytesIO(known('official parent archive',blob,{k:a[k]for k in ('bytes','sha256')})))

def readj(z,part):
  assert set(part)<=old.safe(z,64<<20)
  return {k:obj(known(k,z.read(k),v))for k,v in part.items()}
def read_start(label,z,a,idx,active):
  p=readj(z,a['receipts']);q=p['CHROME.json']; auth=p['AUTHORITY.json']
  assert q['release']==REL and q['manifest']==MF and q['chrome']=='151.0.7922.34'
  if label=='canary':
    assert auth['verified'] and auth['head']==P['sources'][label]['head'] and auth['release']==REL and auth['tree']==TREE and auth['manifest']==MF
    stagewire=p['WIRE.json']['rows']; assert q['status']=='PASS_SCOPE_ONLY'
  else:
    assert auth['authority']=={'currentRelease':REL,'tree':TREE,'currentPages':[normal.RUN,normal.JOB],'manifest':MF,
      'previousCanaryRun':old.OLD_RUN,'wireArtifact':old.P['wire']['artifact']['id']}
    assert idx==p['PINNED-WIRE.json']['rows'];stagewire=auth['stageRowsForActualLaunch']
    assert q['status']=='HOLD' and q['error']=='AssertionError()'
  assert all(idx[row['stage']-1]==row for row in stagewire)
  refs={}
  for k,v in q['visits'].items():
    stage=v['stage']; row=idx[stage-1]; f=v['frame']; p=v['provider']; dim=tuple(v['device'])
    assert k==C.key(stage,dim) and dim in DEV and stage in {r['stage']for r in stagewire}
    assert v['status']=='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY' and not v['errors'] and not f['declaredMissing']
    assert f['phase']=='aim' and f['round']==1 and f['time']==2
    w=row.get('compactWitness');compact=None if w is None else {'revision':w['revision'],'matched':True,'assetCount':len(w['packageAssetIDs'])}
    assert p=={'stage':row['catalogID'],'compact':compact,'width':row['activeDeclaredDimensions'][0],'height':row['activeDeclaredDimensions'][1]}
    rs=set(row['requiredExactHTTP'])|{SHELL}
    assert v['requiredObserved']=={k:(SHELL_FACT if k==SHELL else active[k])for k in rs}
    assert v['raw']==k+'-raw.png' and hashb(z.read(v['raw']))==v['rawSHA256']
    refs[k]={'stage':stage,'physics':f['physics'],'raw':v['rawSHA256'],'provider':p,'terrainIDs':f['actualTerrainIDs'],'ownerIDs':f['actualDrawOwnerIDs'],
      'artifact':a['id'],'role':'unchanged stock first-aim anchor, not counted as directional'}
  return refs
def rect(v):return tuple(v[k]for k in ('left','top','right','bottom'))
def box_cut(a,b):
  ax,ay,az,aw=rect(a);bx,by,bz,bw=rect(b)
  return [max(ax,bx),max(ay,by),min(az,bz),min(aw,bw)]
def overlap(c):return c[0]<c[2] and c[1]<c[3]
def geometry(f,name):
  needle=POSE[name]
  fo=f['focus']
  for r in [fo,f['viewport'],f['terrain'],f['play'],f['visual']]:
    x,y,z,w=rect(r);assert all(math.isfinite(k)for k in (x,y,z,w)) and x<z and y<w
  hit=box_cut(f['viewport'],f['terrain']);play=box_cut(f['viewport'],f['play'])
  assert overlap(hit),'signed terrain envelope not visible at this native clamp'
  assert (f['name'],f['phase'],f['round'],f['sceneTime'],f['dpr'])==(name,'aim',1,2,1)
  s=f['actual']['scale'];dx,dy=needle;l=f['limits'];cx=f['centered']
  pos=[l['west']if dx<0 else l['east']if dx>0 else cx['x'],l['north']if dy<0 else l['south']if dy>0 else cx['y']]
  assert abs(s-f['zoom']['min'])<1e-6 and all(abs(f['actual'][k]-v)<1e-6 for k,v in zip(('x','y'),pos)), 'wrong native orbit extremum'
  assert abs((f['viewport']['right']-f['viewport']['left'])*s-f['css'][0])<1e-6
  assert abs((f['viewport']['bottom']-f['viewport']['top'])*s-f['css'][1])<1e-6
  return hit, play if overlap(play) else None
def stage33(z,anchor,active,row):
  a=P['directional'];p=readj(z,a['receipts']);auth=p['AUTHORITY.json'];r=p['DIRECTIONAL.json']
  assert (auth['head'],auth['release'],auth['tree'],auth['manifest'],auth['pending'])==(BEFORE,REL,TREE,MF,row)
  assert (r['status'],r['stage'],r['release'],r['manifest'],r['chrome'])==('PASS_16_DIRECTION_CAPTURE_SCOPE_ONLY',33,REL,MF,'151.0.7922.34')
  assert set(r['visits'])=={C.key(33,d)for d in DEV}
  names={*a['receipts']}; output={}
  for k,v in r['visits'].items():
    assert (v['status'],v['stage'],v['provider'],v['distinctNativeCameras'])==('PASS_DIRECTION_CAPTURE_ONLY',33,anchor[k]['provider'],8)
    assert not v['errors'] and tuple(v['views'])==tuple(POSE)
    assert v['requiredObserved']=={p:(SHELL_FACT if p==SHELL else active[p]) for p in set(row['requiredExactHTTP'])|{SHELL}}
    output[k]={}
    for name,f in v['views'].items():
      hit,play=geometry(f,name)
      assert f['physics']==anchor[k]['physics'] and f['actualTerrainIDs']==anchor[k]['terrainIDs'] and f['actualDrawOwnerIDs']==anchor[k]['ownerIDs']
      assert f['duplicateOfNativeCamera']is None
      assert f['raw']==k+'-'+name+'-raw.png'
      names.add(f['raw']);b=z.read(f['raw']);assert hashb(b)==f['rawSHA256']
      assert b[:16]==bytes.fromhex('89504e470d0a1a0a0000000d49484452') and list(struct.unpack('>II',b[16:24]))==f['backing']
      output[k][name]={'artifact':a['id'],'raw':f['raw'],'rawSHA256':f['rawSHA256'],'physics':f['physics'],'actual':f['actual'],
          'viewport':f['viewport'],'nativeSignedTerrainIntersection':hit,'playIntersection':play,'noRepeat':True}
  assert set(z.namelist())==names
  return output
def authority(work,shard):
  g=old.gtxt;api=normal.gh;head=os.environ['GITHUB_SHA'];act='Act'+shard[1]; ss=SHARDS[shard]
  assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(normal.API,REF,'push')
  assert g('rev-list','--parents','-n1','HEAD').split()==[head,BEFORE]
  ancestry=[BEFORE,P['sources']['remaining']['head'],P['sources']['canary']['head'],REL]
  assert all(g('rev-list','--parents','-n1',a).split()==[a,b]for a,b in zip(ancestry,ancestry[1:]))
  assert g('rev-parse',REL+'^{tree}')==TREE and g('rev-parse',old.PREV+'^{tree}')==old.PREVTREE
  assert not g('status','--porcelain=v1')
  for a,b,paths in [(BEFORE,head,SHIPPED),(ancestry[1],BEFORE,C.PATHS),(ancestry[2],ancestry[1],old.PATHS),(REL,ancestry[2],normal.PATHS)]:
    assert set(g('diff','--name-status','--no-renames',a,b).splitlines())=={'A\t'+p for p in paths}
    assert all(g('ls-tree',b,'--',p).startswith('100644 ')for p in paths)
  for p,k in {**old.P['inherited'],**C.P['inherited'],**P['inherited']}.items():assert facts(old.git('show',BEFORE+':'+p))==k
  assert api('git/ref/heads/master')['object']['sha']==REL
  pg=api(f'actions/runs/{normal.RUN}');pj=api(f'actions/jobs/{normal.JOB}')
  assert (pg['head_sha'],pg['head_branch'],pg['name'],pg['conclusion'])==(REL,'master','pages build and deployment','success')
  assert (pj['run_id'],pj['name'],pj['conclusion'])==(normal.RUN,'deploy','success')
  assert any(v['name']=='Deploy to GitHub Pages' and v['conclusion']=='success'for v in pj['steps'])
  for label,r in P['sources'].items():
    run=api(f"actions/runs/{r['run']}")
    assert (run['id'],run['head_sha'],run['head_branch'],run['status'],run['conclusion'])==(r['run'],r['head'],r['branch'],'completed','failure'if label=='remaining'else 'success')
    assert run['repository']['full_name']==run['head_repository']['full_name']==normal.API
  raw=known('exact old currently deployed manifest',old.git('show',REL+':'+MANIFEST),MF); m=obj(raw)
  active={i['path']:{k:i[k]for k in ('bytes','sha256')}for i in m['files']};assert len(active)==810
  with old.fromapi(old.P['wire']['artifact'],old.OLD_RUN)as z: rb,w=old.wire(z)
  idx=w['rows']; before={}
  for label,a in P['actualSlots'][act].items():
    with archive(label,a)as z: arr=read_start(label,z,a,idx,active)
    assert not(set(before)&set(arr));before.update(arr)
  assert sorted(x['stage']for k,x in before.items()if k.endswith('1440x900'))==list(range(ss[0]-(ss[0]-1)%10,ss[0]-(ss[0]-1)%10+10))
  anchors={k:x for k,x in before.items()if x['stage']in ss}
  need=[s for s in ss if s!=33];carried={}
  if 33 in ss:
    with archive('directional',P['directional'])as z: carried=stage33(z,anchors,active,idx[32])
  actual={k for k,n in expected(ss)}; assert set(carried)<=actual
  (work/'PINNED-WIRE.json').write_bytes(rb)
  save(work/'out'/'AUTHORITY.json',{'verified':True,'release':REL,'tree':TREE,'manifest':MF,'ordinal':ss,'pendingStages':need,'head':head,
    'firstAimAnchors':anchors,'carriedStage33':carried,'rawCaptureTarget':len(expected(need)),'shard':shard,'referenceSources':P['sources']})

def capture(browser,w,row,device,proof,active,anchor,stageIndex,requested,attempt,deadline):
 from PIL import Image
 out=w/'out';stage=row['stage']; key=C.key(stage,device)
 viewset=proof['devices'].setdefault(key,{'stage':stage,'device':list(device),'attempts':[],'certified':{}})
 imageDir=out/('mobile' if device==DEV[1] else 'pc-1' if stageIndex<3 else 'pc-2')
 imageDir.mkdir(exist_ok=True)
 existing=viewset['certified']
 ctx=browser.new_context(viewport={'width':device[0],'height':device[1]},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+normal.INIT+')()')
 errors=[]; state={'stage':stage,'device':list(device),'status':'INIT','errors':errors,'views':{}}
 state.update(attempt=attempt,requested=list(requested),uncovered={},networkVerified=False)
 viewset['attempts'].append(state)
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
  assert state['provider']==anchor['provider']
  if stage==24:
   target=normal.P24
   result=p.evaluate(F6,target)
   assert result=={'raw':target['raw'],'native':target['native']},'approved Stage24 exact F6 owner differs'
   state['stage24ProtectedF6']=result
  for name in requested:
   if time.monotonic()>deadline:
    state['uncovered'][name]='shard safety time budget; never attempted'
    continue
   dx,dy=POSE[name]
   try:
    q={'stage':stage,'id':row['catalogID'],'readback':False,'name':name,'dx':dx,'dy':dy}
    f=p.evaluate(C.PARK,q)
    hit,play=geometry(f,name)
    decoded=p.evaluate(normal.DECODE)
    assert p.evaluate(C.PARK,{**q,'readback':True})==f
    assert f['physics']==anchor['physics'] and f['actualTerrainIDs']==anchor['terrainIDs'] and f['actualDrawOwnerIDs']==anchor['ownerIDs'], 'live first-aim ownership or physics unbound'
    assert not errors,errors
    raw=base64.b64decode(p.evaluate(normal.RAW),validate=True)
    with Image.open(BytesIO(raw))as im:
     im.load()
     assert im.format=='PNG' and list(im.size)==f['backing'] and im.convert('RGB').getextrema()!=((0,0),(0,0),(0,0))
    rawName=key+'-'+name+'-raw.png'
    location=tuple(round(f['actual'][k],8)for k in ('x','y','scale'))
    peers={**existing,**state['views']}
    previous=[(n,v)for n,v in peers.items() if tuple(round(v['actual'][k],8)for k in ('x','y','scale'))==location]
    assert not previous or all(v['rawSHA256']==hashb(raw)for n,v in previous), ('native clamp same, frozen PNG different',name)
    assert not (imageDir/rawName).exists(), 'refusing to overwrite any previous qualified PNG'
    used=sum(x.stat().st_size for x in imageDir.glob('*.png'))
    assert used+len(raw)<=PACK_MAX,'artifact partition cap; awaiting isolated residue capture'
    (imageDir/rawName).write_bytes(raw)
    state['views'][name]={**f,'raw':rawName,'rawSHA256':hashb(raw),'pngBytes':len(raw),'pack':imageDir.name,'decodeCount':decoded,
      'nativeSignedTerrainIntersection':hit,'playIntersection':play}
   except Exception as e:
    state['uncovered'][name]=repr(e)
   emit()
  drain();assert not errors
  state.update(status='CLOSED_NETWORK_SCOPE',networkVerified=True,
    requiredObserved={z:observed[z]for z in sorted(keys)},observedCount=len(observed))
  assert not(set(existing)&set(state['views']))
  existing.update(state['views'])
 except Exception as e:
  for v in state['views'].values():
   f=out/v['pack']/v['raw']
   if f.is_file(): f.unlink()
  state.update(status='HOLD',error=repr(e),observedPartial=observed)
 finally:emit();ctx.close()
 return state

F6=r"""async target=>{
 const b=HonroApp.engine.b,a=HONRO_PROJECT.library.find(x=>x.id===target.owner),n=HonroTerrainDomain.materialLandmarks(b).find(x=>x.asset?.id===target.owner);
 const h=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)))),n=>n.toString(16).padStart(2,'0')).join('');
 if(!a||!n)throw Error('expected Stage24 native protected owner absent');
 return {raw:await h(a.vector),native:await h(n.asset.vector)};
}"""
def summarize(q,ss,out):
  all_expected=expected(ss);kept=q['carriedStage33']; rank={n:i for i,n in enumerate(POSE)}
  got={}; uniques=0;missing=[]
  for key,name in all_expected:
    if key in kept:
      if name in kept[key]:got[key,name]=kept[key][name];uniques+=1
      else:missing.append([key,name])
      continue
    dev=q['devices'].get(key,{}); v=dev.get('certified',{}).get(name)
    if v is None:
      missing.append([key,name]);continue
    coord=tuple(round(v['actual'][k],8)for k in ('x','y','scale'))
    equivalent=[n for n,f in dev['certified'].items() if tuple(round(f['actual'][k],8)for k in ('x','y','scale'))==coord]
    first=min(equivalent,key=rank.__getitem__);v['duplicateOfNativeCamera']=first if name!=first else None
    uniques+=int(name==first)
    got[key,name]=v
  local=[v for v in got.values()if not v.get('noRepeat')]
  assert len({v['raw']for v in local})==len(local)
  assert {f"{v['pack']}/{v['raw']}"for v in local}=={p.relative_to(out).as_posix()for p in out.glob('*/*.png')}
  q.update(expectedCount=len(all_expected),coveredCount=len(got),qualifiedNew=len(local),carryCount=len(got)-len(local),
    distinctPerDeviceNativeCameras=uniques,missing=missing,
    ArtReview='NOT_RUN; signed terrain-envelope intersections establish geometric visibility bounds, not material presence or art pass')
  return not missing
def app(work,shard):
  from playwright.sync_api import sync_playwright
  noauth(); started=time.monotonic();deadline=started+SOFT_SECONDS
  out=work/'out'; a=obj((out/'AUTHORITY.json').read_bytes());ss=SHARDS[shard];pending=[s for s in ss if s!=33]
  assert a['verified'] and a['release']==REL and a['tree']==TREE and a['manifest']==MF and a['ordinal']==ss and a['pendingStages']==pending
  wr=obj(known('exact verified all-50 wire',(work/'PINNED-WIRE.json').read_bytes(),old.P['wire']['receipt']))
  m=obj(exact_public(MANIFEST,MF));active={i['path']:{k:i[k]for k in ('bytes','sha256')}for i in m['files']};assert len(active)==810
  for p in (CAMPAIGN,ENTRY,SHELL):exact_public(p,SHELL_FACT if p==SHELL else active[p])
  q={'status':'INIT','release':REL,'tree':TREE,'manifest':MF,'shard':shard,'ordinal':ss,'devices':{},'carriedStage33':a['carriedStage33'],
    'scope':'Actual native directional first aim only; no gameplay, ordinary pose, tide transition, or visual adjudication.',
    'referenceSources':a['referenceSources'],'endPublicManifestExact':False,'retry':{'maxPerDevice':1,'missingOnly':True,'timeBound':SOFT_SECONDS}}
  try:
   with sync_playwright()as pw:
    b=pw.chromium.launch(headless=True);q['chrome']=b.version
    try:
     assert b.version=='151.0.7922.34'
     retry=[]
     for stage in pending:
      if time.monotonic()+90>deadline:break
      row=wr['rows'][stage-1]; assert row['stage']==stage
      attempts=[]
      for dev in DEV:
       k=C.key(stage,dev); anchor=a['firstAimAnchors'].get(k,a['firstAimAnchors'][C.key(stage,DEV[0])])
       assert anchor['stage']==stage
       if time.monotonic()+70>deadline:break
       result=capture(b,work,row,dev,q,active,anchor,ss.index(stage),tuple(POSE),1,deadline)
       assert not b.contexts
       missed=tuple(n for n in POSE if n not in q['devices'][k]['certified'])
       if missed:
        why=repr((result.get('error'),result['uncovered']))
        exclusion=('signed terrain envelope not visible','wrong native orbit extremum','first-aim ownership or physics unbound','partition cap',
          'approved Stage24','shard safety time','HTTP digest','noncanonical request','failed context')
        if not any(code in why for code in exclusion):retry.append((row,dev,anchor,missed))
       attempts.append(result['networkVerified'])
       if result['errors']:
        raise RuntimeError(('global unexpected browser request or error',k,result['errors']))
      if len(attempts)==2 and not any(attempts):
       raise RuntimeError(('both device closures held at stage; remaining unattempted',stage))
     for row,dev,anchor,originalMissing in retry:
      if time.monotonic()+110>deadline:break
      exact_public(MANIFEST,MF)
      k=C.key(row['stage'],dev)
      assert tuple(n for n in POSE if n not in q['devices'][k]['certified'])==originalMissing
      capture(b,work,row,dev,q,active,anchor,ss.index(row['stage']),originalMissing,2,deadline)
      assert not b.contexts
    finally:b.close()
   exact_public(MANIFEST,MF);q['endPublicManifestExact']=True
   assert summarize(q,ss,out),'directional missing keys retained separately from proven cases'
   assert q['qualifiedNew']==len(expected(pending)) and q['carryCount']==len(expected(ss))-len(expected(pending))
   q['status']='PASS_DIRECTION_CAPTURE_SCOPE_ONLY'
  except Exception as e:
   q.update(status='HOLD',error=repr(e))
   if not q['endPublicManifestExact']:
    try: exact_public(MANIFEST,MF);q['endPublicManifestExact']=True
    except Exception as final:q['closingManifestError']=repr(final)
   raise
  finally:
   summarize(q,ss,out)
   q['validForPublicIndex']=q['endPublicManifestExact']
   if not q['validForPublicIndex']:
    q['nonAuthoritativeCapturedKeys']=q['qualifiedNew'];q['qualifiedNew']=0
    q['coveredCount']=q['carryCount'];q['missing']=[[key,name]for key,name in expected(ss)if key not in q['carriedStage33']]
   save(out/'DIRECTIONAL.json',q)
if __name__=='__main__':
  assert len(sys.argv)==4 and sys.argv[1]in ('authority','app') and sys.argv[3]in SHARDS
  w=Path(sys.argv[2]).resolve(); root=Path(os.environ['RUNNER_TEMP']).resolve()
  assert w!=root and w.is_relative_to(root)
  (authority if sys.argv[1]=='authority'else app)(w,sys.argv[3])
