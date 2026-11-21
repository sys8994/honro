"""Native normal Stage14 proof on fresh A1/A2/B; preserve all observed outcomes. Never ship."""
import base64,io,json,math,re,sys,time,traceback
from pathlib import Path
from statistics import median
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
import hashlib,os,subprocess,urllib.request,urllib.parse
H=Path(__file__).resolve().parent
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def rd(r,k):return (r/k).read_bytes()
def save(p,o):
 t=p.with_suffix('.tmp');t.write_text(json.dumps(o,ensure_ascii=False,sort_keys=True,indent=2)+'\n');t.replace(p)
PINS=json.loads(rd(H,'PINS.json'))
LIVE='https://sys8994.github.io/honro/'

O=json.loads(rd(H,'stock-observer.json'));P=json.loads(rd(H,'POSES.json'));PARK=rd(H,'park.js').decode()
DIR={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
PHASES=('phase1','phase2','repeat1','repeat2')
MEDIA={f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3','battle-4')}
CACHE='''()=>{const s=HonroApp.scene,r=s.renderCacheStats();return {
 backing:[s.canvas.width,s.canvas.height],caches:['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'].map(k=>{
  const q=s[k];return [typeof q?.key==='string',q?.canvas?.width??null,q?.canvas?.height??null,q?.bytes??null]
 }), fields:Object.fromEntries(['screenWorldBytes','screenBackgroundBytes','screenForegroundBytes','worldBytes','worldScale','backgroundBytes','domainCanvasAllocations','domainTileBuilds'].map(k=>[k,r[k]??0]))
}}'''
NATIVE='''()=>{const b=HonroApp.engine.b,world=HonroTerrainDomain.render(b),near=b.terrain.find(t=>t.id==='v14-refuge-ground');
 const q={stage:b.honroStage,revs:b.honroCampaignMapRevision,phase:b.phase,round:b.round,world:world.map(t=>[t.id,t.vertices.length]),water:b.water??null,active:HonroTerrainDomain.active(b)};
 if(b.honroStage===14){const t=world.find(t=>t.id==='v14-refuge-ground');const a=near.vertices[13],z=near.vertices[14];
 if(!q.active||t.y+t.h!==30900||near.y+near.h!==5640||a.x!==4800||a.y!==5640||z.x!==0||z.y!==5640)throw Error('incorrect exact projection and visual world owner');
 q.canonicalWitness={declaredBottom:t.y+t.h,closure:[a.x,a.y,z.x,z.y],legalTopOwner:t.id};}
 return q;
}'''
def rgba(p):
 with Image.open(p)as v:
  v.load();return v.convert('RGBA')
def png(raw):
 with Image.open(io.BytesIO(raw))as v:
  v.load();return v.convert('RGBA')
def visit(br,root,report,g,label,key,v):
 arm='B'if label=='B'else 'A';known=g['active'+arm];aliases=g['aliases'];expected_requests=v['requests']
 expected={p if arm=='A'else aliases.get(p,p)for p in expected_requests};assert expected<=known.keys()
 for p,q in expected_requests.items():
  if arm=='A' or p not in aliases and p!='HONRO.html':assert known[p]==q
 origin=LIVE;site=urllib.parse.urlsplit(origin)
 object_origin=f'{site.scheme}://{site.netloc}/'
 brx=re.compile('blob:'+re.escape(object_origin)+r'[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}')
 state={'label':label,'case':key,'phase':'INIT','frames':{},'status':'HOLD'}
 report['visits'].append(state);flush(root,report)
 ca=br.new_context(viewport=dict(zip(('width','height'),v['device'])),device_scale_factor=1,service_workers='block')
 checked={};done=set();todo=set();hits=[];err=[];blobs=set()
 page=ca.new_page();page.add_init_script('('+O['INIT']+')()');page.set_default_timeout(30_000)
 def keypath(u):return u[len(origin):]if u.startswith(origin)and ('?'not in u and '#'not in u)else None
 def request(r):
  p=keypath(r.url)
  if r.method!='GET' or not(p in known or p in MEDIA and r.resource_type=='media' or brx.fullmatch(r.url) or r.url.startswith('data:')):err.append(('unknown request',r.method,r.url))
  if p in known:todo.add(r)
 def fail(r):
  todo.discard(r)
  if not(keypath(r.url)in MEDIA and r.resource_type=='media'and r.failure=='net::ERR_ABORTED'):err.append(('request fail',r.url,r.failure))
 def res(r):
  p=keypath(r.url)
  if p in known and r.status==200 and not r.from_service_worker:hits.append((p,r))
  elif brx.fullmatch(r.url)and r.status==200:blobs.add(r.url)
  elif p in MEDIA and r.status in(200,206)and r.request.resource_type=='media':pass
  elif not r.url.startswith('data:'):err.append(('unknown response',r.url,r.status))
 for e,f in [('request',request),('requestfinished',lambda r:todo.discard(r)),('requestfailed',fail),('response',res),('pageerror',lambda e:err.append(('page error',str(e))))]:page.on(e,f)
 try:
  assert ca.storage_state()=={'cookies':[],'origins':[]}
  nav=page.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert nav and nav.status==200 and nav.url==origin+'HONRO.html' and not nav.from_service_worker
  n=nav.request;assert n.method=='GET' and n.is_navigation_request() and n.frame==page.main_frame and n.resource_type=='document' and not n.redirected_from and not n.redirected_to
  state['navigation']=checked['HONRO.html']=fact(nav.body());assert checked['HONRO.html']==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90_000)
  target=v['stage'];p=v['provider'];ck=page.evaluate("""async i=>{await HonroCampaignLoader.ensureStage(i);const t=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===i),q=HONRO_ACT2_COMPACT_PACKAGES[i];
  if(!t||!q||JSON.stringify(t)!==JSON.stringify(q.stage))throw Error('wrong actual compact registered stage');
  return {revision:q.mapRevision,status:t.metadata.compactStatus??null,packageAssetIDs:q.assets.map(a=>a.id),width:t.width,height:t.height};}""",target)
  assert (ck['revision'],len(ck['packageAssetIDs']),ck['width'],ck['height'])==(p['compact']['revision'],v['expectedCompactCount'],p['width'],p['height'])
  assert target==14
  assert page.evaluate(O['LAUNCH'],{'stage':target,'catalogID':p['stage'],'activeDeclaredDimensions':[p['width'],p['height']],'compactWitness':ck})==p
  state['actualProvider']=p;state['loadedCompact']=ck
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  index=0
  for name,(dx,dy) in DIR.items():
   if name not in v['views']:continue
   state['activeFrame']=name;flush(root,report)
   q={'stage':target,'id':p['stage'],'name':name,'dx':dx,'dy':dy,'readback':False}
   now=page.evaluate(PARK,q);count=page.evaluate(O['DECODE'])
   rec=state['frames'][name]={'before':now,'decodedDiagnostic':count,'phases':{}}
   assert count>0 and all(now[k]==w for k,w in v['views'][name].items()),'archived exact camera/physics changed'
   for phase in PHASES:
    a=page.evaluate(PARK,{**q,'readback':True});assert a==now
    geo=page.evaluate(NATIVE)
    raw=base64.b64decode(page.evaluate(O['RAW']),validate=True);im=png(raw)
    path=f'{label}-{key}-{name}-{phase}.png';(root/path).write_bytes(raw)
    rec['phases'][phase]={'native':geo,'path':path,'png':fact(raw),'rgba':sha(im.tobytes()),'cache':page.evaluate(CACHE), 'clock':None}
    flush(root,report)
   q2=rec['phases']['phase2']
   assert all(rec['phases'][phase][k]==q2[k]for phase in ('repeat1','repeat2')for k in ('native','png','rgba','cache','clock')),'real matching steady repeats failed'
  i=0;settled=0;until=time.monotonic()+20
  while time.monotonic()<until:
   assert not err,err
   while i<len(hits)and hits[i][1].request not in todo:
    k,r=hits[i];assert fact(r.body())==known[k],('wrong served bytes',k);checked[k]=known[k];done.add(k);i+=1
   plen=(len(hits),len(blobs));page.wait_for_timeout(105)
   settled=settled+1 if i==len(hits)and not todo and plen==(len(hits),len(blobs))and expected-{'HONRO.html'}<=done else 0
   if settled==3:
    assert blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    state.update(status='EXACT_ACTUAL_VISIT',required=sorted(expected),verified=sorted(done|{'HONRO.html'}));break
  assert state['status']=='EXACT_ACTUAL_VISIT',(err,sorted(expected-done),len(todo))
 finally:
  state['networkErrors']=err;flush(root,report);ca.close()
def flush(root,x):save(root/'BROWSER.json',x)

def exact():
 c=PINS['publishedSource']; t=PINS['publishedTree']; repo='sys8994/honro'
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(repo,'push',PINS['qaRef'])
 def g(*args):return subprocess.check_output(['git',*args]).decode().strip()
 h=os.environ['GITHUB_SHA']; assert g('rev-parse','HEAD')==h
 assert g('rev-list','--parents','-n1',h).split()==[h,c] and g('rev-parse',c+'^{tree}')==t
 src=H.relative_to(Path(os.environ['GITHUB_WORKSPACE'])).as_posix()
 names={'A\t.github/workflows/stage14-public-readback.yml',*(f'A\t{src}/{name}'for name in ('PINS.json','POSES.json','capture.py','stock-observer.json','park.js'))}
 assert set(g('diff','--no-renames','--name-status',c,h).splitlines())==names
 assert not g('status','--porcelain=v1')
def anonymous(out):
 def fetch(path,pin):
  q=urllib.request.Request(LIVE+path,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity','User-Agent':'Mozilla/5.0 HONRO public proof'})
  with urllib.request.urlopen(q,timeout=50) as r:
   assert r.status==200 and r.geturl()==LIVE+path and r.headers.get('Content-Encoding') in (None,'identity')
   b=r.read(pin['bytes']+1)
  assert fact(b)==pin
  return b
 g=PINS['active'];routes=PINS['aliases']
 selected=['HONRO.html','index.html','HONRO_WORKSHOP.html','web/manifest.json',*routes,*routes.values()]
 assert len(set(selected))==12
 checks={k:fact(fetch(k,g.get(k)or PINS['oldAliasFacts'][k]))for k in selected}
 m=json.loads(fetch('web/manifest.json',g['web/manifest.json']))
 assert len(m['files'])==810
 idx={p['path']: {k:p[k]for k in ('bytes','sha256')} for p in m['files']}
 assert len(idx)==810 and {k:g[k]for k in idx}==idx
 old=set()
 for ent in [m['previousFiles'],*m['previousGenerations'],*(a['files']for a in m['publishedGenerations'])]:
  old.update(x['path']for x in ent)
 assert len(old|idx.keys())==1325 and set(routes)<=old
 assert len(m['publishedGenerations'])==39
 save(out/'HTTP-PUBLIC.json',{'publishedSource':PINS['publishedSource'],'exact':checks,'active':810,'allReachable':1325,'publishedHistory':39})
def main(out):
 exact(); out.mkdir(parents=True,exist_ok=True); anonymous(out)
 g={'activeB':PINS['active'],'aliases':PINS['aliases']}
 r={'scope':'actual anonymous Pages Stage14 readback','visits':[],'failures':[],'status':'HOLD'}
 try:
  with sync_playwright()as c:
   b=c.chromium.launch(headless=True);r['browser']=b.version;assert b.version=='151.0.7922.34'
   try:
    for key,v in P.items():
     if v['stage']!=14:continue
     try:visit(b,out,r,g,'B',key,v)
     except Exception as e:r['failures'].append({'case':key,'error':repr(e),'trace':traceback.format_exc()});flush(out,r)
   finally:b.close()
  assert len(r['visits'])==2 and not r['failures']
  actual={}
  for v in r['visits']:
   assert v['status']=='EXACT_ACTUAL_VISIT' and len(v['frames'])==8
   for name,w in v['frames'].items():
    assert set(w['phases'])==set(PHASES)
    for phase,f in w['phases'].items():
     key=v['case']+'-'+name+'-'+phase
     t=PINS['screens'][key]
     assert f['png']==t['png'] and f['rgba']==t['rgba'] and f['native']==t['native'] and f['cache']==t['cache']
     actual[key]=f['png']
  assert len(actual)==64
  r.update(status='PASS_EXACT_ANONYMOUS_STAGE14_PC_MOBILE',publicExactPNG=actual)
 finally:flush(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
