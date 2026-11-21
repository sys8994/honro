"""Single-stage public stock exact read-only canary. No routing, replacements or product source writes."""
import base64,io,json,math,os,re,statistics,subprocess,sys,time
from pathlib import Path
from hashlib import sha256
from io import BytesIO
from urllib.request import Request,build_opener,HTTPRedirectHandler
REL='21809dc917101f9ee28672b34d923636ca58e7be'
TREE='d3fb9a0ec8fdb21846067b49db4b71e5359f952a'
MANIFEST='web/manifest.json'; MF={'bytes':6627791,'sha256':'61061e7a60b48944c5230a07d529a3582103f6e0a5c056aaad02bd195556ac59'}
CAMPAIGN='web/data/campaign.7140da5d3649e4ab.json'
SHELL='HONRO.html'; ENTRY='web/entries/game.756ef43eebb6f5c4.js'
SHELL_FACT={'bytes':17379,'sha256':'970fac6baf1d504bbdbcdbf75f273fe33a8a8b6bc90f31157e3132116e14ecde'}
def hashb(b):return sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':hashb(b)}
def obj(b):
 def unique(r):
  q=dict(r)
  assert len(q)==len(r),'duplicate decoded JSON keys'
  return q
 return json.loads(b.decode('utf-8','strict'),object_pairs_hook=unique)
def known(name,data,want):
 assert facts(data)==want,(name,facts(data),want)
 return data
API='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/stage23-native-blank-a0-21809'
RUN,JOB=44938122195,136949539110
PATHS={'.github/workflows/stage23-native-blank-a0.yml',*(f'tools/stage23-native-neutral/{x}'for x in ('audit.py','entry.js','park.js','PINS.json'))}
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f\d-]{36}')
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
def save(p,x):
 tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');tmp.replace(p)
def git(*k):return subprocess.check_output(['git',*k],timeout=90).decode().strip()
def gh(path):return obj(subprocess.check_output(['gh','api','repos/'+API+'/'+path],timeout=25))
def authority(w):
 head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(API,REF,'push')
 assert git('rev-list','--parents','-n1','HEAD').split()==[head,REL]
 assert git('rev-parse',REL+'^{tree}')==TREE and git('status','--porcelain=v1')==''
 assert set(git('diff','--name-status','--no-renames',REL,head).splitlines())=={'A\t'+x for x in PATHS}
 assert all(git('ls-tree',head,'--',x).split()[0]=='100644'for x in PATHS)
 assert gh('git/ref/heads/master')['object']['sha']==REL
 p=gh(f'actions/runs/{RUN}');j=gh(f'actions/jobs/{JOB}')
 assert p['repository']['full_name']==p['head_repository']['full_name']==API
 assert (p['id'],p['head_sha'],p['head_branch'],p['name'],p['status'],p['conclusion'])==(RUN,REL,'master','pages build and deployment','completed','success')
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(JOB,RUN,'deploy','completed','success')
 assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in j['steps'])
 assert facts(subprocess.check_output(['git','show',REL+':'+MANIFEST],timeout=30))==MF
 save(w/'out'/'AUTHORITY.json',{'release':REL,'tree':TREE,'pages':[RUN,JOB],'manifest':MF,'head':head,'verified':True})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*v,**k):raise RuntimeError('unexpected redirect')
def exact_public(path,info):
 with build_opener(NoRedirect).open(Request(BASE+path,headers={'Accept-Encoding':'identity'}),timeout=30)as r:
  assert r.status==200 and r.url==BASE+path
  return known(path,r.read(info['bytes']+1),info)

H=Path(__file__).resolve().parent
P=obj((H/'PINS.json').read_bytes())
PARK=(H/'park.js').read_text()
LAUNCH=(H/'entry.js').read_text()
INIT=r"""()=>{
 const images=new Set(),blobs=new Set(),o=HTMLImageElement.prototype,d=Object.getOwnPropertyDescriptor(o,'src');
 Object.defineProperty(o,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const mk=URL.createObjectURL;URL.createObjectURL=function(...args){const u=Reflect.apply(mk,this,args);blobs.add(u);return u;};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
DECODE=r"""async()=>{
 const imgs=[...new Set([...document.images,...__honroObserver.images])].filter(x=>x.currentSrc||x.src);
 await Promise.race([Promise.all([document.fonts.ready,...imgs.map(x=>x.decode())]),
    new Promise((_,bad)=>setTimeout(()=>bad(Error('active image decode deadline')),30000))]);
 if(document.fonts.status!=='loaded'||!imgs.length||imgs.some(x=>!x.complete||!x.naturalWidth))throw Error('incomplete actual renderer assets');
 return imgs.length;
}"""
RAW="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
POSES=(('west',-1,0),('southwest',-1,1),('north',0,-1),('east',1,0))
PHASES=('A1','A2','A0')
def rgba(raw):
 from PIL import Image
 with Image.open(BytesIO(raw))as im:
  assert im.format=='PNG'
  im.load();x=im.convert('RGBA')
  return {'size':list(x.size),'rgba':hashb(x.tobytes()),'png':facts(raw)}
def capture(browser,w,device,phase,data,active):
 out=w/'out';stage=23;key=phase+f'-s23-{device[0]}x{device[1]}'
 ctx=browser.new_context(viewport={'width':device[0],'height':device[1]},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+INIT+')()')
 errors=[]; visit={'stage':stage,'device':list(device),'phase':phase,'status':'INIT','errors':errors,'views':{}}
 data['visits'][phase]=visit
 def emit():save(out/'NEUTRAL.json',data)
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
 keys=set(P['requiredWire'])|{SHELL}
 def drain():
  nonlocal pos
  until=time.monotonic()+180
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
  known(SHELL,r.body(),SHELL_FACT);visit['status']='SHELL_EXACT';emit()
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  visit['registered']=p.evaluate(LAUNCH,phase);visit['status']='CANONICAL_LAUNCH_CHECKED';emit()
  cnv=p.locator('#battlecanvas');cnv.wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  for name,dx,dy in POSES:
   q={'stage':stage,'id':'stage-23','readback':False,'name':name,'dx':dx,'dy':dy}
   f=p.evaluate(PARK,q)
   def write_im(label,buf):
    name2=key+'-'+name+'-'+label+'.png';(out/name2).write_bytes(buf)
    return {**rgba(buf),'name':name2}
   def raw_now(label):
    b=base64.b64decode(p.evaluate(RAW),validate=True)
    r=write_im(label,b);assert r['size']==f['backing'];return r
   view={'pose':f,'coldRecipe':'First native parked draw for this pose, before explicit decode; not cold application launch.',
      'coldRaw':raw_now('first-draw-raw')}
   visit['views'][name]=view; emit()
   view['decodeCount']=p.evaluate(DECODE)
   assert p.evaluate(PARK,{**q,'readback':True})==f
   view['settledRaw']=raw_now('settled-raw')
   view['settledDOM']=write_im('settled-dom',cnv.screenshot(animations='disabled'))
   assert view['settledDOM']['size'][0]==f['backing'][0]
   assert not errors,errors
   emit()
  trace=p.evaluate("()=>__stage23NativeNeutral.stats()");visit['trace']=trace;emit()
  seen=trace['timeline']
  assert any(x['event']=='registeredFrontDispatch'for x in seen)
  if phase=='A0':
   assert trace['callCount']==trace['blankPainterAccepted']>0 and set(trace['invocationByCurrentTerrain'])=={'sy-ground'}
   hosts={x['tile'] for x in seen if x['event']=='hostTerrainExitedPaint'}
   witnessed=[]
   for i,ev in enumerate(seen):
    if ev['event']=='registeredFrontDispatch' and ev['tile'] in hosts and any(x['event']=='hostTerrainExitedPaint' and x['tile']==ev['tile'] for x in seen[:i]): witnessed.append(ev['tile'])
   visit['sameTileHostBeforeFront']=sorted(set(witnessed));emit()
   assert witnessed
  else:assert trace['callCount']==trace['blankPainterAccepted']==0 and not trace['invocationByCurrentTerrain']
  drain()
  assert not errors and tuple(visit['views'])==tuple(x[0]for x in POSES)
  visit.update(status='CAPTURED_SCOPED',requiredObserved={z:observed[z]for z in sorted(keys)},observedCount=len(observed))
 except Exception as e:visit.update(status='HOLD',error=repr(e),observedPartial=observed)
 finally:emit();ctx.close()
def attest(data,out):
 visits=data['visits'];return_checks=[]
 if set(visits)!=set(PHASES)or any(v['status']!='CAPTURED_SCOPED' for v in visits.values()):return False,return_checks
 reference=visits['A1']
 for ph in ('A2','A0'):
  test=visits[ph]
  check={'pair':['A1',ph],'registryExact':all(reference['registered'][k]==test['registered'][k] for k in ('stockCopyHash','otherHash','libHash')),
   'wireExact':reference['requiredObserved']==test['requiredObserved'],'perPose':{}}
  for v,_,_ in POSES:
   a,b=reference['views'][v],test['views'][v]
   f={'poseAndAllPhysicsExact':a['pose']==b['pose']}
   for k in ('coldRaw','settledRaw','settledDOM'):
    f[k+'Exact']=all(a[k][n]==b[k][n]for n in ('size','rgba'))
   check['perPose'][v]=f
  check['pass']=check['registryExact'] and check['wireExact'] and all(all(v.values())for v in check['perPose'].values())
  return_checks.append(check)
 return all(e['pass'] for e in return_checks),return_checks
def app(w,device):
 from playwright.sync_api import sync_playwright
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';meta=obj((out/'AUTHORITY.json').read_bytes())
 assert meta=={'release':REL,'tree':TREE,'pages':[RUN,JOB],'manifest':MF,'head':os.environ['GITHUB_SHA'],'verified':True}
 m=obj(exact_public(MANIFEST,MF));active={a['path']:{k:a[k]for k in ('bytes','sha256')}for a in m['files']}
 assert len(active)==len(m['files']) and all(active[k]==v for k,v in P['requiredWire'].items())
 for p in (CAMPAIGN,ENTRY,SHELL):exact_public(p,SHELL_FACT if p==SHELL else active[p])
 camp=obj(exact_public(CAMPAIGN,active[CAMPAIGN]))
 assert len(camp['stages'])==len(camp['stageLibraries'])==50
 assert camp['stages'][22]=='web/data/chapter-23.5bf8a1a8779eb0fd.json'
 assert camp['stageLibraries'][22]=='web/data/chapter-23-assets.ce93149a24fce0d9.json'
 data={'status':'INIT','release':REL,'device':list(device),'scope':'Actual same-build no-intercept trial of blank registration in volatile memory, not built/loaded asset or art acceptance. A1/A2 independently clean; A0 blank.', 'visits':{}}
 try:
  with sync_playwright()as pw:
   b=pw.chromium.launch(headless=True);data['chrome']=b.version
   try:
    assert b.version==P['browser']
    for phase in PHASES:
     capture(b,w,device,phase,data,active)
     assert not b.contexts
   finally:b.close()
  exact_public(MANIFEST,MF)
  result,compare=attest(data,out);data['compares']=compare
  assert result,'At least one legitimate same-run cold/settled RGBA/physics/route check held; no cross-run absolute image gating'
  assert len(list(out.glob('*.png')))==len(PHASES)*len(POSES)*3
  data['status']='PASS_VOLATILE_STAGE23_BLANK_REGISTRATION_NEUTRALITY_ONLY'
 except Exception as e:data.update(status='HOLD',error=repr(e));raise
 finally:save(out/'NEUTRAL.json',data)
if __name__=='__main__':
 assert len(sys.argv)in(3,4) and sys.argv[1]in('authority','app')
 w=Path(sys.argv[2]).resolve();temp=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w!=temp and w.is_relative_to(temp)
 if sys.argv[1]=='authority':authority(w)
 else:
  dev=tuple(map(int,sys.argv[3].split('x')));assert dev in ((1440,900),(390,844))
  app(w,dev)
