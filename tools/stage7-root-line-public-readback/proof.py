"""Actual anonymous Stage7 with Stage3/6/21 controls Pages observation. No response interception or product writes."""
import base64,datetime as dt,hashlib,io,json,os,re,subprocess,sys,time
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler,Request,build_opener
H=Path(__file__).resolve().parent
def distinct(b):
 def pairs(x):
  d=dict(x);assert len(x)==len(d),'duplicate JSON members';return d
 return json.loads(b,object_pairs_hook=pairs)
P=distinct((H/'PINS.json').read_bytes());E=distinct((H/'entry.json').read_bytes())
R=P['release']; PRE=P['previousPages']; OLD=P['priorCommit']; N=P['normalAuthority']
BASE='https://sys8994.github.io/honro/';BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9-]{36}')
TOP='sys8994/honro';REF='refs/heads/qa/stage7-root-line-public-readback'
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'};MF='web/manifest.json';HTML='HONRO.html'
FILES={'.github/workflows/stage7-root-line-public-readback.yml',*(f'tools/stage7-root-line-public-readback/{k}'for k in ('PINS.json','entry.json','proof.py'))}
MEDIA=set(P['media'])|{'assets/bgm/battle-2.mp3','assets/bgm/battle-3.mp3'}
OUT=None
proof={'status':'INIT','frames':[],'visits':[],'scope':'Anonymous real Pages normal Stage7 with Stage3/6/21 controls with synthetic clean entry prerequisite only, diagnostic cameras; no gameplay result or user save.'}
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def want(d):return {k:d[k]for k in ('bytes','sha256')}
def hx(x,n):return type(x)is str and len(x)==n and bool(re.fullmatch(r'[0-9a-f]+',x)) and set(x)!={'0'}
def pos(x):return type(x)is int and x>0
def save(k,v):(OUT/k).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def log():save('BROWSER.json',proof)
def git(*a):return subprocess.check_output(['git',*a],timeout=35)
def show(c,p):return git('show',c+':'+p)
def inv(d):
 a={v['path']:want(v)for v in d['files']};assert len(a)==len(d['files'])==810;return a
def graph_id(x):return sha(json.dumps(x,sort_keys=True,separators=(',',':')).encode())
def require_release():
 assert R['enabled'] is True,'DISABLED: successful exact master Pages release authority needed'
 m,t=R['retainedManifest'],R['retention']
 assert all(hx(x,40)for x in (R['commit'],R['tree'],m['git'],t['head'])) and all(hx(x,64)for x in (
     m['sha256'],t['outerSHA256'],t['receiptSHA256'],t['retainedPreviousGraphSHA256']))
 assert all(pos(x)for x in (m['bytes'],R['pagesRun'],R['pagesJob'],t['run'],t['job'],t['artifact'],t['outerBytes']))
 assert m['bytes']<=12<<20 and m['sha256'] not in (PRE['manifestSHA256'],P['generated'][MF]['sha256'])
 assert dt.datetime.fromisoformat(R['publishedAt']).tzinfo is not None
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push',REF)
def established():
 require_release()
 head=os.environ['GITHUB_SHA'];live=R['commit'];m=R['retainedManifest']
 assert git('rev-list','--parents','-n1','HEAD').decode().split()==[head,live]
 assert git('rev-list','--parents','-n1',live).decode().split()==[live,OLD]
 assert all(git('rev-parse',c+'^{tree}').decode().strip()==t for c,t in ((OLD,P['priorTree']),(live,R['tree'])))
 assert not git('status','--porcelain=v1','-z')
 assert set(git('diff','--name-status','--no-renames',live,head).decode().splitlines())=={'A\t'+k for k in FILES}
 assert all(git('ls-tree',head,k).split(None,1)[0]==b'100644'for k in FILES)
 mod=SHELL|{MF,'shared/runtime/terrain-readability.js'}
 add=set(P['sourceFiles'])|set(P['generated']);add-=mod
 assert len(mod)==len(add)==5
 assert set(git('diff','--name-status','--no-renames',OLD,live).decode().splitlines())=={'M\t'+k for k in mod}|{'A\t'+k for k in add}
 assert all(git('ls-tree',live,k).split(None,1)[0]==b'100644'for k in mod|add)
 assert all(blob(show(live,k))==v for k,v in P['sourceFiles'].items())
 assert all(fact(show(live,k))==v for k,v in P['generated'].items() if k!=MF)
 raw=show(live,MF);old=show(OLD,MF)
 assert fact(raw)==want(m) and blob(raw)==m['git'] and sha(old)==PRE['manifestSHA256'] and blob(old)==PRE['manifestGitBlob']
 lg,og=distinct(raw),distinct(old);a,b=inv(og),inv(lg)
 assert b==P['active'] and graph_id(a)==P['beforeActiveMapSHA256']
 assert a.keys()-b.keys()==P['oldAliasGETs'].keys() and b.keys()-a.keys()==P['newAliasGETs'].keys()
 assert all(a[k]==b[k]for k in a.keys()&b.keys())
 hist=[g for g in lg['publishedGenerations'] if g['sourceSha']==OLD]
 assert len(hist)==1 and hist[0]['files']==og['files'] and hist[0]['publishedAt']==PRE['publishedAt']
 assert hist[0]['publishedAtPrecision']=='instant' and hist[0]['evidence']==f"https://github.com/{TOP}/actions/runs/{PRE['run']}"
 assert hist[0]['graphSha256']==R['retention']['retainedPreviousGraphSHA256']
 assert all(fact(show(live,k))==fact(show(OLD,k))==v==a[k]for k,v in {**P['oldAliasGETs'],**P['resources']}.items())
 return {**b,**P['stableShells'],MF:want(m)}
def api(p):return distinct(subprocess.check_output(['gh','api',f'repos/{TOP}/'+p],timeout=30))
def authority():
 established()
 live=R['commit'];t=R['retention']
 assert api('git/ref/heads/master')['object']['sha']==live,'master advanced: retake signed authority'
 run=api(f"actions/runs/{R['pagesRun']}");job=api(f"actions/jobs/{R['pagesJob']}")
 assert (run['id'],run['head_sha'],run['head_branch'],run['name'],run['status'],run['conclusion'])==(
  R['pagesRun'],live,'master','pages build and deployment','completed','success')
 assert run['repository']['full_name']==run['head_repository']['full_name']==TOP
 assert (job['id'],job['run_id'],job['name'],job['status'],job['conclusion'])==(R['pagesJob'],R['pagesRun'],'deploy','completed','success')
 step=[s for s in job['steps']if s['name']=='Deploy to GitHub Pages']
 assert len(step)==1 and (step[0]['status'],step[0]['conclusion'])==('completed','success')
 stamp=dt.datetime.fromisoformat(R['publishedAt'])
 assert dt.datetime.fromisoformat(step[0]['started_at'])<=stamp<=dt.datetime.fromisoformat(job['completed_at'])+dt.timedelta(seconds=1)
 ret=api(f"actions/runs/{t['run']}");j=api(f"actions/jobs/{t['job']}")
 assert (ret['id'],ret['head_sha'],ret['head_branch'],ret['path'],ret['status'],ret['conclusion'],ret['event'])==(
  t['run'],t['head'],'qa/stage7-root-line-retention-42879','.github/workflows/stage7-stage21-retention.yml','completed','success','push')
 assert ret['repository']['full_name']==ret['head_repository']['full_name']==TOP
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(t['job'],t['run'],'seal','completed','success')
 objs=[i for i in api(f"actions/runs/{t['run']}/artifacts")['artifacts'] if i['id']==t['artifact']]
 assert len(objs)==1
 x=objs[0];assert not x['expired'] and x['name']=='honro-stage7-root-line-retained-source-and-generated-no-deploy'
 assert x['size_in_bytes']==t['outerBytes'] and x['digest']=='sha256:'+t['outerSHA256']
 assert x['workflow_run']['id']==t['run'] and x['workflow_run']['head_sha']==t['head']
 save('PAGES-AUTHORITY.json',{'status':'EXACT_MASTER_AND_SUCCESSFUL_PAGES','release':R,'normal':N,'tokenlessNext':True})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**kw):raise RuntimeError('public canonical response redirected')
def http(k,limit):
 p=BASE+k
 r=Request(p,headers={'Accept-Encoding':'identity'})
 with build_opener(NoRedirect).open(r,timeout=25)as y:
  assert y.status==200 and y.geturl()==p
  b=y.read(limit+1);assert len(b)<=limit,(k,'served excess bytes')
  return b
def gate(pins):
 seen=fact(http(MF,12<<20))
 if seen!=pins[MF]:
  proof['status']='HOLD_PRIOR_MANIFEST_STILL_SERVED' if seen['sha256']==PRE['manifestSHA256'] else 'HOLD_UNRECOGNIZED_PUBLIC_MANIFEST'
  save('HTTP-PUBLIC.json',{'status':proof['status'],'actual':seen,'wanted':pins[MF]})
  raise RuntimeError(proof['status'])
 return seen
def anonymous():
 assert not(os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN'))
 pins=established();cert=distinct((OUT/'PAGES-AUTHORITY.json').read_bytes())
 assert cert['status']=='EXACT_MASTER_AND_SUCCESSFUL_PAGES' and cert['release']==R
 rr={**P['oldAliasGETs'],**P['resources'],**{k:pins[k]for k in SHELL|P['newAliasGETs'].keys()}}
 observed={MF:gate(pins)};raw={}
 for k,v in sorted(rr.items()):
  raw[k]=http(k,v['bytes']);observed[k]=fact(raw[k]);assert observed[k]==v,('wrong canonical anonymous public bytes',k)
 home=fact(http('',pins['index.html']['bytes']));assert home==pins['index.html'];observed['root/']=home
 c=distinct(raw[P['campaign']])
 assert len(c['stages'])==len(c['stageLibraries'])==50
 stages=[6,20,34]; entries={k+1:[c['stages'][k],c['stageLibraries'][k]] for k in stages}
 for k,y in entries.items():
  assert set(y)<=P['stableProtectedGETs'].keys()
  assert distinct(raw[y[0]])['metadata']['stageId']==k
 s35=distinct(raw[entries[35][1]]);parts=s35['parts']; assert len(parts)==2
 assert all(fact(raw[e['path']])==want(e) for e in parts)
 assert fact(b''.join(raw[e['path']] for e in parts))==want(s35)
 save('HTTP-PUBLIC.json',{'status':'EXACT_PUBLIC_RETAINED','verified':observed,'canonical50Count':50,'protectedStagePackets':entries})
 return pins
def path(u):
 return u[len(BASE):] if u.startswith(BASE) and not any(a in u for a in '?#') else None
def rgba(data):
 from PIL import Image
 with Image.open(io.BytesIO(data))as im:
  im.load(); a=im.convert('RGBA')
  return {'size':list(a.size),'rgba':sha(a.tobytes()),'pngSHA256':sha(data)}
def add_fail(msg):
 proof.setdefault('mismatches',[]).append(msg);log()
def want_img(got,wanted):
 return got['rgba']==wanted['rgbaSHA256'] and got['size']==wanted['size']
def capture(browser,pins,xy,stage,shots,replica=False):
 w,h=xy; css=f'{w}x{h}';early=stage!=21
 snapshot=E['earlyAct'] if early else E['stage21']
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 ctx.set_default_timeout(30000)
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 pending=set();hits=[];blobs=[];seen={};errors=[]
 mode='B2' if replica else 'B'; key=f'{stage}-{css}-{mode}'
 visit={'key':key,'phase':'START','errors':errors,'anonymousNewContext':True};proof['visits'].append(visit);log()
 page=ctx.new_page()
 def on_req(q):
  k=path(q.url)
  if q.method=='GET' and (k in pins or (k in MEDIA and q.resource_type=='media') or q.url.startswith(('blob:','data:'))):
   if k in pins:pending.add(q)
  else:errors.append(['unexpected request',q.method,q.url])
 def fail(q):
  pending.discard(q)
  if not (path(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errors.append(['failed request',q.url,q.failure])
 def resp(r):
  k=path(r.url);q=r.request
  if r.status==200 and q.method=='GET' and BLOB.fullmatch(r.url):blobs.append(r.url)
  elif k in MEDIA and q.resource_type=='media' and q.method=='GET' and r.status in (200,206):return
  elif r.status==200 and k in pins and q.method=='GET':hits.append((k,r))
  elif not r.url.startswith('data:'):errors.append(['unexpected response',r.status,r.url,q.method])
 page.on('request',on_req);page.on('response',resp)
 page.on('requestfinished',lambda q:pending.discard(q));page.on('requestfailed',fail)
 page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 page.add_init_script('('+snapshot['INIT']+')();'+(snapshot['INIT_SEED'] if early else ''))
 try:
  shell=page.goto(BASE+HTML,wait_until='domcontentloaded',timeout=50000)
  assert shell and shell.url==BASE+HTML and shell.status==200 and fact(shell.body())==pins[HTML]
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  prefetch=E['earlyAct']['PREFETCH']; got={}
  assert all(pins[k]==v for k,v in prefetch.items())
  page.evaluate("""()=>{if(HonroApp.screen!=='title'||HonroCampaignLoader.has(2))throw Error('not loaded title or already live Stage2');
    HonroCampaignLoader.prewarmNext(1);}""")
  until=time.monotonic()+18
  while time.monotonic()<until:
   assert not errors,errors
   for k,r in hits:
    if k in prefetch and r.request not in pending and k not in got:
     got[k]=fact(r.body());assert got[k]==prefetch[k]
   if got.keys()==prefetch.keys():break
   page.wait_for_timeout(40)
  visit['titlePreload']=got;log()
  assert got==prefetch and page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)"),('stock title prewarm incomplete',key,got)
  if early:
   page.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
  page.evaluate(snapshot['LAUNCH'],stage);canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for f in shots:
   name=f['view'];tag=f's{stage:02d}-{css}-{name}'+('-fresh' if replica else '')
   frame={'key':tag,'stage':stage,'cssDevice':css,'replica':replica};proof['frames'].append(frame);log()
   q={'id':stage,'mapId':f'stage-{stage}','name':name,'dx':-1 if 'west' in name else 1 if 'east' in name else 0,
      'dy':1 if 'south' in name else 0,'ordinary':f['ordinary'] if early else P['stage21']['ordinary'],'readback':False}
   if early:
    q['fixedNow']=snapshot['PHASE'];obs=page.evaluate(snapshot['FROZEN'],q);meta=obs['meta']
   else:meta=page.evaluate(snapshot['PARK'],q);obs=meta
   dd=page.evaluate(snapshot['DECODE'])
   assert dd['registered']>0 and not dd['failed']
   replay=page.evaluate(snapshot['FROZEN'] if early else snapshot['PARK'],{**q,'readback':True});assert replay==obs
   sig=sha(meta['signature'].encode())
   if early:
    assert page.evaluate("()=>document.fonts.status==='loaded'&&HonroApp.profile.settings.music===false&&HonroApp.profile.settings.sound===false")
    info=page.evaluate(snapshot['CHECK']); assert info['stage']==stage and info['authored']==f'stage-{stage}' and info['raster']>0
    frame['state']={'mapSHA256':sha(info['map'].encode()),'registeredArtSHA256':sha(info['registeredArt'].encode()),
      'domainSHA256':sha(info['domain'].encode()),'raster':info['raster'],'fixedCloud':obs['cloud'],'fixedGrade':obs['time'],
      'observedClosure':info['closure'],'camera':{n:meta[n]for n in ('actual','viewport','css','backing')}}
    for n in ('actual','viewport','focus','css','backing','sceneTime','phase','round','tide','actorCount'):
     if meta[n]!=f[n]:add_fail([tag,'runtime '+n])
    expect=P['normalPublicCameraReferences'][f['key']]
    if frame['state']!=expect['captureState'] or sig!=expect['physicsSHA256']:add_fail([tag,'actual geometry/physics state'])
    if stage==7 and info['closure']!=0:add_fail([tag,'old nonwalk closure still present'])
    rb=base64.b64decode(page.evaluate(snapshot['CANVAS']),validate=True)
    db=canvas.screenshot(animations='disabled')
   else:
    expect=P['alreadyPublishedStage21Controls'][f'B-{css}-{name}']
    frame['state']={**{k:v for k,v in meta.items() if k!='signature'},'physicsSHA256':sig}
    if frame['state']!=expect['physicsAndProjection']:add_fail([tag,'prior Stage21 actual camera/physics'])
    db=canvas.screenshot(animations='disabled',timeout=30000)
    rb=base64.b64decode(page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"),validate=True)
   for n,b in (('raw',rb),('dom',db)):
    (OUT/f'{tag}-{n}.png').write_bytes(b);frame[n]=rgba(b)
    if not want_img(frame[n],expect[n]):add_fail([tag,'RGBA '+n])
   if early:
    assert page.evaluate(snapshot['FROZEN'],{**q,'readback':True})==obs
    rb2=base64.b64decode(page.evaluate(snapshot['CANVAS']),validate=True);dom2=canvas.screenshot(animations='disabled')
    if not all(want_img(rgba(b),expect[n]) for n,b in (('raw',rb2),('dom',dom2))):add_fail([tag,'repeat RGBA'])
   else:
    owner=page.evaluate(snapshot['OWN'],{'stage':21,'front':P['stage21']['owner'],'back':P['stage21']['baseOwner'],'variant':'B'})
    assert page.evaluate(snapshot['PARK'],{**q,'readback':True})==meta
    if owner!=expect['owner']:add_fail([tag,'prior Stage21 F/B owners'])
    frame['owner']=owner
    support=P['stage21']['support'];m=page.evaluate(E['native21'],{'frame':{**frame['state'],'DPR':1},'support':support['supportPath'],'box':support['bounds']})
    pngs=m.pop('pngs');m['masks']={k:sha(base64.b64decode(v.split(',',1)[1],validate=True))for k,v in pngs.items()}
    frame['native']=m
    if m!=expect['native']:add_fail([tag,'prior Stage21 native tile/rim'])
   log()
  i=quiet=0;stop=time.monotonic()+18
  wanted=set(P['s7Observed'][key]) if early else set(P['s21Observed'][f'B-{css}'])|prefetch.keys()
  required=set(P['s21MustObserve'][f'B-{css}']) if not early else set(P['mustObserveStage7']) if stage==7 else set()
  while time.monotonic()<stop:
   assert not errors,errors
   while i<len(hits) and hits[i][1].request not in pending:
    k,r=hits[i];i+=1;seen[k]=fact(r.body());assert seen[k]==pins[k],('actual public response differs',key,k)
   b=set(page.evaluate("()=>[...window.__honroObserver.blobs]"));curr=len(hits),len(blobs)
   page.wait_for_timeout(100)
   idle=curr==(len(hits),len(blobs)) and not pending and i==len(hits) and set(blobs)<=b and wanted<=seen.keys()
   quiet=quiet+1 if idle else 0
   if quiet==4:break
  visit.update(observed=seen,missing=sorted(wanted-seen.keys()),unexpected=sorted(seen.keys()-{MF}-wanted),pending=[r.url for r in pending]);log()
  assert not errors and quiet==4 and required<=seen.keys() and i==len(hits) and not visit['unexpected'],('closure incomplete',key,visit['missing'],visit['unexpected'],errors)
  if not early:
   assert page.evaluate("()=>{if(window.__honroQAUndo){window.__honroQAUndo();delete window.__honroQAUndo;return true;}return false;}")
  visit['phase']='PASS';log()
 finally:ctx.close()
def app():
 log()
 try:
  pins=anonymous()
  from playwright.sync_api import sync_playwright
  with sync_playwright()as w:
   b=w.chromium.launch(headless=True);assert b.version==P['browser'],('public chromium version differs',b.version)
   for stage in (7,3,6,21):
    for xy in ((1440,900),(390,844)):
     if stage!=21:shots=[f for f in P['s7Refs'] if f['id']==stage and f['viewportCSS']==list(xy)]
     else:shots=[{'view':'ordinary'},{'view':'west'}]
     assert len(shots)==(5 if stage==7 else 2 if stage==21 else 1)
     capture(b,pins,xy,stage,shots)
     if stage==7:capture(b,pins,xy,stage,[f for f in shots if f['view']=='south'],replica=True)
   b.close()
  assert len(proof['frames'])==20 and len(proof['visits'])==10 and all(x['phase']=='PASS'for x in proof['visits'])
  assert not proof.get('mismatches'),proof.get('mismatches')
  assert fact(http(MF,12<<20))==pins[MF],'public manifest changed during observation'
  proof.update(status='PASS_EXACT_PUBLIC_STAGE7_AND_PEERS',release=R['commit'],normal=N)
 except Exception as e:
  if not proof['status'].startswith('HOLD'):proof['status']='HOLD'
  proof['failure']=repr(e);raise
 finally:log()
if __name__=='__main__':
 mode=sys.argv[1];OUT=Path(sys.argv[2]);assert OUT.is_dir()
 if mode=='authority':
  try:authority()
  except Exception as e:save('AUTHORITY-HOLD.json',{'status':'HOLD_BEFORE_PUBLIC_LOAD','reason':repr(e)});raise
 elif mode=='app':app()
 else:raise RuntimeError('expected authority or app')
