"""A-only official native observer feasibility pilot. No network outside browser fixture or Git writes."""
import argparse,base64,hashlib,io,json,mimetypes,os,re,subprocess,time,traceback
from pathlib import Path
from urllib.parse import urlsplit
H=Path(__file__).resolve().parent
PIN=json.loads((H/'PINS.json').read_bytes())
NATIVE=(H/'native.js').read_text()
SCENE=(H/'scene.js').read_text()
BASE=PIN['base']
ORIGIN='http://127.0.0.1:49242/'
SHELL='HONRO.html'; MAN='web/manifest.json'
MEDIA=re.compile(r'assets/bgm/(?:main|battle-[1-4])\.mp3')
PATH=re.compile(r'[a-zA-Z0-9_.-]+(?:/[a-zA-Z0-9_.-]+)*')
BLOB=re.compile(r'blob:'+re.escape(ORIGIN)+r'[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}')
PHASES=('first','allocate','hit')
TAGS=['landmark:before','original-root:after','body:after','surface:after','props:after','props:after','landmark:after']
if not __debug__:raise RuntimeError('strict pilot requires assertions')
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def canon(x):return json.dumps(x,ensure_ascii=True,sort_keys=True,separators=(',',':')).encode()
def save(p,x):
 t=p.with_name(p.name+'.tmp');t.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');t.replace(p)
def parts(r):
 u=urlsplit(r.url)
 if (u.scheme,u.netloc,u.query,u.fragment)!=('http','127.0.0.1:49242','',''):return None
 p=u.path[1:]
 return p if PATH.fullmatch(p) and not {'.','..'}.intersection(p.split('/')) else None
def git(repo,*a):return subprocess.check_output(['git','--no-replace-objects','-C',str(repo),*a])
def secure(repo,official):
 g=lambda *a:git(repo,*a).decode().strip()
 assert PIN['status']=='DISABLED_NOT_RELEASE'
 assert g('rev-parse',BASE+'^{commit}')==BASE and g('rev-parse',BASE+'^{tree}')==PIN['tree']
 assert g('rev-parse',BASE+':shared/runtime/renderer.js')==PIN['rendererGit']
 assert g('rev-parse',BASE+':shared/runtime/act5-edge-art.js')==PIN['edgeGit']
 if official:
  head=os.environ['GITHUB_SHA'];here='tools/stage42-native-observer-pilot/'
  assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',PIN['ref'])
  assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
  assert head==g('rev-parse','HEAD') and g('rev-list','--parents','-n1',head).split()==[head,BASE]
  files={'A\t'+here+n for n in ('PINS.json','native.js','pilot.py','scene.js')}
  files.add('A\t.github/workflows/stage42-stock-native-observer-pilot.yml')
  assert set(g('diff','--no-renames','--name-status',BASE,head).splitlines())==files
  assert not g('status','--porcelain=v1','--untracked-files=all')
  return head
 return None
def closure(get):
 for p,f in PIN['file'].items():assert fact(get(p))==f,p
 m=json.loads(get(MAN));c=json.loads(get(PIN['campaignFile']));s=json.loads(get(PIN['stageMap']));a=json.loads(get(PIN['stageAssetFile']))
 active={r['path']:{'bytes':r['bytes'],'sha256':r['sha256']}for r in m['files']}
 assert len(active)==len(m['files'])==810 and sha(canon(active))==PIN['activeSignature']
 for p,f in PIN['file'].items():
  if p not in (MAN,SHELL):assert active[p]==f
 assert m['project']==PIN['campaignFile'] and m['gameEntry']=='web/entries/game.df8a4c7f1873e38c.js'
 assert [i for i,r in enumerate(c['catalog'])if r['metadata']['stageId']==42]==[41]
 assert c['stages'][41]==PIN['stageMap'] and c['stageLibraries'][41]==PIN['stageAssetFile']
 assert c['stageLibraries'].count(PIN['stageAssetFile'])==1 and c['assetPaths']['stageLibraries'][41]==[] and c['assetEncodings']['stageLibraries'][41]=='json'
 assert s['id']=='stage-42' and [p for p in s['elements']if p['id']=='a5-near']==[{'id':'a5-near','assetId':'act5:near:42',
  'x':0,'y':0,'scale':6500/2022,'rotation':0,'layer':'structural-back','depthLayer':'L1','visualRole':'scenery'}]
 assert [row['id']for row in a]==['act5:near:42']
 return {**active,SHELL:PIN['file'][SHELL],MAN:PIN['file'][MAN]}
READY="()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'&&typeof window.HonroApp?.launch==='function'&&typeof window.HonroTimeOfDay?.sky==='function'"
ENTRY="""async()=>{
 const a=HonroApp;
 if(a.engine?.b?.honroStage===42||HonroCampaignLoader.has(42))throw Error('not fresh canonical profile');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(42);
 for(let n=1;n<42;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(42).entryLevel);
 a.launch(42);if(a.engine?.b?.honroStage!==42)throw Error('wrong launch');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('entry dialogue remains');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
INIT=r"""(()=>{
 const images=new Set(),blobs=new Set(),orig=URL.createObjectURL,proto=HTMLImageElement.prototype,d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 URL.createObjectURL=function(...a){const x=Reflect.apply(orig,this,a);blobs.add(x);return x};
 Object.defineProperty(window,'__s42PilotImages',{value:{images,blobs}});
})()"""
DECODE=r"""async()=>{
 const xs=[...new Set([...document.images,...__s42PilotImages.images])].filter(i=>i.currentSrc||i.src);
 let timer;try{await Promise.race([Promise.all([document.fonts.ready,...xs.map(i=>i.decode())]),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('image decode timeout')),21000)})]);}
 finally{clearTimeout(timer);}
 return {number:xs.length,font:document.fonts.status,bad:xs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src)};
}"""
RAW="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
def pilot(browser,get,known,pose,arm,out,row,flush):
 from PIL import Image
 size=PIN['viewport']
 ctx=browser.new_context(viewport={'width':size[0],'height':size[1]},device_scale_factor=1,service_workers='block',reduced_motion='reduce')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script(INIT)
 errors=[];hits=[];waiting=set();blobs=set();scheduled=[];verified=[];media={};cursor=0;lookup={}
 row.update(status='INIT',network={'errors':errors,'requested':scheduled,'verified':verified},frames={})
 def body(path):
  if path not in lookup:
   v=get(path)
   if path in known:assert fact(v)==known[path],path
   else:assert MEDIA.fullmatch(path);media[path]=fact(v)
   lookup[path]=v
  return lookup[path]
 def reply(route):
  r=route.request;k=parts(r)
  try:
   if r.url.startswith('data:')or BLOB.fullmatch(r.url):
    assert r.method=='GET';route.continue_();return
   assert k and r.method=='GET' and (k in known or (MEDIA.fullmatch(k)and r.resource_type=='media')),(r.method,r.url,r.resource_type)
   v=body(k);mime='text/javascript' if k.endswith('.js') else mimetypes.guess_type(k)[0]
   assert mime,k
   headers={'Content-Type':mime,'Cache-Control':'no-store'}
   code=200
   if 'range' in r.headers:
    assert MEDIA.fullmatch(k) and r.resource_type=='media'
    m=re.fullmatch(r'bytes=(\d+)-(\d*)',r.headers['range']);assert m
    start=int(m[1]);end=min(int(m[2]),len(v)-1) if m[2] else len(v)-1;assert 0<=start<=end<len(v)
    headers.update({'Content-Range':f'bytes {start}-{end}/{len(v)}','Accept-Ranges':'bytes'})
    code=206;v=v[start:end+1]
   headers['Content-Length']=str(len(v));scheduled.append([k,code,fact(v)])
   route.fulfill(status=code,headers=headers,body=v)
  except Exception as e:errors.append(['fixture denied',r.method,r.url,repr(e)]);route.abort()
 ctx.route('**/*',reply)
 def request(r):
  k=parts(r)
  if k in known or k and MEDIA.fullmatch(k):waiting.add(r)
  elif r.url.startswith('data:')or BLOB.fullmatch(r.url):pass
  else:errors.append(['unexpected request',r.method,r.url])
 def fail(r):
  waiting.discard(r);k=parts(r)
  if not(k and MEDIA.fullmatch(k) and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(['request failed',r.url,r.failure])
 def response(r):
  k=parts(r);req=r.request
  if k in known and r.status==200 and req.method=='GET' and not r.from_service_worker and not req.redirected_from and not req.redirected_to:hits.append((k,r))
  elif k and MEDIA.fullmatch(k)and r.status in (200,206) and req.method=='GET' and not r.from_service_worker:hits.append((k,r))
  elif BLOB.fullmatch(r.url)and r.status==200:blobs.add(r.url)
  elif not r.url.startswith('data:'):errors.append(['unexpected response',r.status,r.url])
 for ev,fn in [('request',request),('requestfinished',lambda r:waiting.discard(r)),('requestfailed',fail),('response',response),
                ('pageerror',lambda x:errors.append(['page error',str(x)]))]:page.on(ev,fn)
 def drain():
  nonlocal cursor
  for _ in range(100):
   assert not errors,errors
   while cursor<len(hits) and hits[cursor][1].request not in waiting:
    k,r=hits[cursor];v=body(k)
    if r.status==206:
     m=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',r.headers.get('content-range',''));assert m and int(m[3])==len(v)
     v=v[int(m[1]):int(m[2])+1]
    try:got=r.body()
    except Exception:
     if MEDIA.fullmatch(k) and r.request.failure=='net::ERR_ABORTED':
      row['network'].setdefault('canceledMedia',[]).append(k);cursor+=1;continue
     raise
    assert got==v,(k,'browser received body mismatch')
    verified.append([k,r.status,fact(got)]);cursor+=1
   old=len(hits),len(blobs)
   page.wait_for_timeout(110)
   keys={k for k,_,_ in verified}
   if len(hits)==cursor and not waiting and old==(len(hits),len(blobs)) and set(PIN['required'])<=keys:
    assert blobs<=set(page.evaluate('()=>Array.from(__s42PilotImages.blobs)'))
    assert sum(k==PIN['stageAssetFile']for k,_,_ in scheduled)==1
    row['network']['pinnedMedia']=media;return
  raise RuntimeError(('request closure unsettled or required body missing',sorted(set(PIN['required'])-{k for k,_,_ in verified}),len(waiting)))
 def grab(phase):
  canvas=page.locator('#battlecanvas');rec={}
  raw=base64.b64decode(page.evaluate(RAW),validate=True);dom=canvas.screenshot(animations='disabled',timeout=30000)
  for mode,v in [('raw',raw),('dom',dom)]:
   file=f'{arm}-{pose["name"]}-{phase}-{mode}.png';(out/file).write_bytes(v)
   with Image.open(io.BytesIO(v))as im:
    im.load();wh=im.size
    assert wh==tuple(PIN['backing']) if mode=='raw' else wh[0]==PIN['backing'][0] and wh[1] in (PIN['backing'][1],PIN['backing'][1]+1)
    rec[mode]={**fact(v),'path':file,'size':wh,'rgba':sha(im.convert('RGBA').tobytes())}
  assert base64.b64decode(page.evaluate(RAW),validate=True)==raw,'frozen frame during DOM capture'
  return rec
 native_installed=False
 try:
  n=page.goto(ORIGIN+SHELL,wait_until='domcontentloaded',timeout=50000)
  assert n and n.url==ORIGIN+SHELL and n.status==200 and not n.from_service_worker and n.body()==body(SHELL)
  req=n.request
  assert req.frame==page.main_frame and req.is_navigation_request() and req.method=='GET' and not req.redirected_from and not req.redirected_to
  row['navigation']=fact(n.body());flush()
  try:page.wait_for_function(READY,timeout=45000)
  except Exception:
   row['readiness']=page.evaluate("()=>({href:location.href,ready:document.documentElement.dataset.honroReady,loader:typeof HonroCampaignLoader?.ensureStage,app:typeof HonroApp?.launch,sky:typeof HonroTimeOfDay?.sky,body:document.body?.innerText.slice(0,700)})");raise
  page.evaluate(ENTRY);page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  row['provider']=page.evaluate(SCENE,{'op':'prepare','law':PIN})
  def camera(q):return page.evaluate(SCENE,{'op':'park','css':PIN['css'],'pose':q})
  def draw(q,c):return page.evaluate(SCENE,{'op':'paint','css':PIN['css'],'backing':c['backing'],'center':c['center'],'pose':q})
  # Prime images and a different cache scale using a legitimate parked draw;
  # none of the production cache APIs are reset or overwritten.
  prime={'requested':[3250,1430.5,.55]}
  p=draw(prime,camera(prime));row['prime']=p
  row['decode']=page.evaluate(DECODE);assert row['decode']['number']>0 and row['decode']['font']=='loaded' and not row['decode']['bad']
  q=camera(pose);row['camera']=q;assert q['backing']==PIN['backing'];flush()
  drain()
  if arm=='N':
   try:native_installed=page.evaluate(NATIVE,{'op':'install','pose':pose,'backing':q['backing'],'center':q['center']})
   except Exception as e:row.setdefault('observerErrors',[]).append(['install',repr(e)])
  for phase in PHASES:
   if native_installed:
    try:page.evaluate(NATIVE,{'op':'phase','phase':phase})
    except Exception as e:row.setdefault('observerErrors',[]).append(['phase',phase,repr(e)])
   render=draw(pose,q)
   images=grab(phase);row['frames'][phase]={'images':images,'render':render};flush()
   if native_installed:
    try:row['frames'][phase]['observer']=page.evaluate(NATIVE,{'op':'commit'})
    except Exception as e:row.setdefault('observerErrors',[]).append(['commit',phase,repr(e)])
  row['status']='CAPTURED';drain()
 except Exception as e:row['status']='HOLD';row['error']=[repr(e),traceback.format_exc()]
 finally:
  if native_installed:
   try:row['observer']=page.evaluate(NATIVE,{'op':'finish'});save(out/f'{arm}-{pose["name"]}-native-events.json',row['observer'])
   except Exception as e:row.setdefault('observerErrors',[]).append(['finish',repr(e)])
  try:ctx.close()
  finally:flush()
def net_signature(row):
 # Request timing, especially harmless authenticated media 206/canceled ordering,
 # is kept separately; every non-media HTTP path, count and byte receipt must match.
 pairs=[(k,c,h['bytes'],h['sha256'])for k,c,h in row['network']['verified']if not MEDIA.fullmatch(k)]
 return sorted(pairs)
def matrix_exact(a,b):return len(a)==len(b)==6 and all(abs(x-y)<1e-7 for x,y in zip(a,b))
def assess(report):
 issues=[];variants=report['visits']
 for p in PIN['poses']:
  n=p['name'];rows=[variants.get(f'{v}/{n}',{})for v in ('A1','A2','N')]
  if any(r.get('status')!='CAPTURED' or tuple(r.get('frames',{}))!=PHASES for r in rows):
   issues.append([n,'incomplete normal or diagnostic visit']);continue
  if any(r['provider']!=rows[0]['provider'] or r['camera']!=rows[0]['camera'] or r['navigation']!=rows[0]['navigation'] or net_signature(r)!=net_signature(rows[0])for r in rows[1:]):
   issues.append([n,'not same provider/camera/request bytes']);continue
  for phase in PHASES:
   for mode in ('raw','dom'):
    f=[{k:v for k,v in r['frames'][phase]['images'][mode].items()if k!='path'}for r in rows]
    if f[0]!=f[1]:issues.append([n,phase,mode,'A1/A2 normal PNG mismatch'])
    if f[0]!=f[2]:issues.append([n,phase,mode,'observer PNG mismatch'])
   if any(r['frames'][phase]['render']!=rows[0]['frames'][phase]['render']for r in rows[1:]):
    issues.append([n,phase,'cache/state count drift'])
  first,allocate,hit=(rows[2]['frames'][k]['render']for k in PHASES)
  target=first if p['targetPhase']=='first' else allocate
  if p['viewKind']=='tile':
   try:
    x,y=map(int,p['target'].split(':'));rs=p['rs'];tile=first['after']['tile']
    assert first['before']['tile'] is None and first['after']['tileBuilds']>first['before']['tileBuilds'] and first['after']['domainRS']==rs
    assert tile['size']==[516,516] and abs(tile['left']-x*512/rs)<1e-7 and abs(tile['top']-y*512/rs)<1e-7
    assert hit['after']['tileBuilds']==first['after']['tileBuilds']
   except (AssertionError,TypeError):issues.append([n,'actual cold tile / warm cache not witnessed'])
  else:
   if first['after']['viewport'] is not None or allocate['before']['viewport'] is not None or allocate['after']['viewport']!={'main':False,'size':PIN['backing'],'detached':True,'nativeZoom':True} or allocate['after']['screenBuilds']<=allocate['before']['screenBuilds'] or hit['after']['screenBuilds']!=allocate['after']['screenBuilds']:
    issues.append([n,'actual settled native viewport allocation missing'])
  if hit['after']['screenHits']<=hit['before']['screenHits']:issues.append([n,'steady screen raster hit missing'])
  ob=rows[2].get('observer',{})
  if rows[2].get('observerErrors') or not ob.get('bound') or ob.get('errors') or ob.get('untouchedMain') is not True or [ev['tag']for ev in ob.get('events',[])]!=TAGS or any(ev['phase']!=p['targetPhase']or not matrix_exact(ev.get('basis',[]),p['matrix']) for ev in ob.get('events',[])):
   issues.append([n,'native owner readback incomplete or unbound'])
 return issues
def main():
 args=argparse.ArgumentParser();args.add_argument('--repo',type=Path,required=True);args.add_argument('--out',type=Path,required=True);args.add_argument('--official',action='store_true');args.add_argument('--preflight',action='store_true');ns=args.parse_args()
 ns.out.mkdir(exist_ok=True,parents=True)
 report={'release':BASE,'status':'HOLD','scope':'Stage42 exact A1/A2/N observer feasibility only', 'visits':{}}
 def flush():save(ns.out/'PILOT.json',report)
 flush()
 try:
  report['head']=secure(ns.repo,ns.official);get=lambda p:git(ns.repo,'show',BASE+':'+p)
  known=closure(get)
  report['activeGraphCount']=len(known)-2;report['preflight']='EXACT_TRACKED_STOCK_A_ONLY';flush()
  if ns.preflight:return
  assert ns.official,'no local browser launch in this disabled carrier'
  from playwright.sync_api import sync_playwright
  with sync_playwright()as pw:
   b=pw.chromium.launch(headless=True,args=['--host-resolver-rules=MAP * ~NOTFOUND','--disable-background-networking'])
   try:
    report['browser']=b.version;assert b.version==PIN['browser']
    # All six normal visits are attempted and archived before any observer visit/verdict.
    for arm in ('A1','A2','N'):
     for pose in PIN['poses']:
      k=f'{arm}/{pose["name"]}';row=report['visits'][k]={};flush()
      try:pilot(b,get,known,pose,arm,ns.out,row,flush)
      except Exception as e:row.update(status='HOLD',error=[repr(e),traceback.format_exc()]);flush()
   finally:b.close()
  report['issues']=assess(report)
  if report['issues']:raise RuntimeError('HOLD: exact A-only observer gates not all met')
  report['status']='PASS_A_ONLY_NATIVE_OBSERVER_NONPERTURBATION'
 except Exception as e:report['error']=[repr(e),traceback.format_exc()];raise
 finally:flush()
if __name__=='__main__':main()
