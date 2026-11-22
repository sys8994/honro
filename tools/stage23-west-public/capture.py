"""No build. Public Stage23 west proof on exact release, two anonymous PC/M visits."""
import base64,hashlib,io,json,os,re,subprocess,sys,time,traceback,urllib.request
from pathlib import Path
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
O=json.loads((H/'observer.json').read_bytes())
PARK=(H/'park.js').read_text()
LIVE='https://sys8994.github.io/honro/'
M='web/manifest.json'
WORKFLOW='.github/workflows/stage23-west-public-readback.yml'
MEDIA={f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4')}
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')
NEAR=lambda s: isinstance(s,str) and re.fullmatch('[0-9a-f]{40}',s) is not None
RAW="""()=>document.querySelector('#battlecanvas').toDataURL('image/png').split(',')[1]"""
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def save(path,q):
 p=path.with_suffix('.tmp');p.write_text(json.dumps(q,indent=2,ensure_ascii=False)+'\n');p.replace(path)
def need(test,msg):
 if not test:raise RuntimeError(msg)
def check(body,stamp,msg):
 need(fact(body)==stamp,('exact bytes',msg,fact(body),stamp))
 return body
def bound():
 need(P['enabled'] is True,'disabled: bind verified master, retained manifest and actual successful Pages deployment first')
 need(P['origin']==LIVE,'only anonymous canonical Pages origin is allowed')
 a=P['release'];commit,tree=a['head'],a['tree']
 need(NEAR(commit) and NEAR(tree),'missing verified release object identities')
 aM=a['manifest']
 need(isinstance(aM,dict) and set(aM)=={'bytes','sha256'} and type(aM['bytes'])is int and aM['bytes']>0 and re.fullmatch('[a-f0-9]{64}',aM['sha256']),'missing retained manifest identity')
 dep=a['pages']
 need(isinstance(dep,dict) and set(dep)=={'head','branch','conclusion','run','job','publishedAt'} and
      dep['head']==commit and dep['branch']=='master' and dep['conclusion']=='success' and
      all(type(dep[k]) is int and dep[k]>0 for k in ('run','job')) and
      re.fullmatch(r'2026-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z',dep['publishedAt']),
      'only actual successful Pages deployment of this exact master may be bound')
 need(not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'anonymous only')
 need((os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==
      ('sys8994/honro','push',P['qaRef']),'only designated detached QA push may run')
 repo=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA']
 def g(*args):return subprocess.check_output(['git','-C',repo,*args],timeout=30).decode().strip()
 names={WORKFLOW,*(str(H.relative_to(repo)/x) for x in ('PINS.json','capture.py','observer.json','park.js'))}
 need(NEAR(h) and g('rev-list','--parents','-1','HEAD').split()==[h,commit] and g('rev-parse',commit+'^{tree}')==tree,
      'checkout must be direct child of exact public master')
 need(set(g('diff','--no-renames','--name-status',commit,h).splitlines())=={'A\t'+n for n in names} and
      all(g('ls-tree',h,'--',n).startswith('100644 blob ')for n in names) and not g('status','--porcelain=v1'),
      'unknown or edited product file in detached readback')
 check((repo/M).read_bytes(),aM,'parent retained manifest')
 source=P['approvedSource']
 need(g('rev-parse',commit+':'+source['path'])==source['new'] and sha((repo/source['path']).read_bytes())==source['sha256'],
      'release source is not signed approved renderer')
 for k,pin in P['verifiedRoute'].items():
  check((repo/k).read_bytes(),pin,'approved B route '+k)
 return a
def manifest(a):
 req=urllib.request.Request(LIVE+M,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity',
       'User-Agent':'Mozilla/5.0 HONRO anonymous Stage23 readback'})
 with urllib.request.urlopen(req,timeout=45) as r:
  need(r.status==200 and r.geturl()==LIVE+M and r.headers.get('Content-Encoding') in (None,'identity'),
       ('wrong public manifest fetch',r.status,r.geturl()))
  m=json.loads(check(r.read(a['manifest']['bytes']+1),a['manifest'],M))
 graph={i['path']:{k:i[k] for k in ('bytes','sha256')}for i in m['files']}
 need(len(graph)==len(m['files']),'duplicate active URL')
 for k,v in P['verifiedRoute'].items():
  if k!='HONRO.html':need(graph.get(k)==v,('normal B role missing from active published manifest',k))
 return {**graph,'HONRO.html':P['verifiedRoute']['HONRO.html']}
def row_png(b):
 from PIL import Image
 with Image.open(io.BytesIO(b)) as im:
  im.load();return {'fact':fact(b),'size':list(im.size),'rgba':sha(im.convert('RGBA').tobytes())}
def visit(browser,out,status,key,known):
 W,H=map(int,key.split('x'));expected=P['references'][key];required=set(P['verifiedRoute'])
 q={'status':'HOLD','device':key};status['visits'][key]=q
 def flush():save(out/'BROWSER.json',status)
 flush()
 ctx=browser.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
 pending=set();responses=[];blobs=set();seen={};errors=[]
 def path(u):return u[len(LIVE):]if u.startswith(LIVE)and '?' not in u and '#'not in u else None
 def request(r):
  k=path(r.url)
  if r.method!='GET' or not(k in known or k in MEDIA and r.resource_type=='media' or BLOB.fullmatch(r.url) or r.url.startswith('data:')):
   errors.append(['unexpected request',r.method,r.url])
  if k in known:pending.add(r)
 def done(r):pending.discard(r)
 def fail(r):
  done(r)
  if not(path(r.url)in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):
   errors.append(['failed request',r.url,r.failure])
 def response(r):
  k=path(r.url)
  if k in known and r.status==200 and not r.from_service_worker:responses.append((k,r))
  elif BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif k in MEDIA and r.request.resource_type=='media' and r.status in (200,206):pass
  elif not r.url.startswith('data:'):errors.append(['unexpected status',r.status,r.url])
 def drain(page):
  n=stable=0;end=time.monotonic()+25
  while time.monotonic()<end:
   need(not errors,errors)
   while n<len(responses)and responses[n][1].request not in pending:
    k,r=responses[n];check(r.body(),known[k],k);seen[k]=known[k];n+=1
   mark=len(responses),len(blobs);page.wait_for_timeout(120)
   stable=stable+1 if mark==(len(responses),len(blobs))and n==len(responses)and not pending and required<=seen.keys() else 0
   if stable==3:
    need(blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)')),'unexpected browser object URL')
    return
  raise RuntimeError(('incomplete actual public graph',sorted(required-seen.keys()),len(pending),errors))
 try:
  need(ctx.storage_state()=={'cookies':[],'origins':[]},'fresh anonymous context required')
  page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script('('+O['INIT']+')()')
  for e,f in [('request',request),('requestfinished',done),('requestfailed',fail),('response',response),('pageerror',lambda e:errors.append(['pageerror',str(e)]))]:page.on(e,f)
  doc=page.goto(LIVE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  need(doc and doc.url==LIVE+'HONRO.html' and doc.status==200 and not doc.from_service_worker and not doc.request.redirected_from,
       'anonymous public shell was not exact')
  check(doc.body(),known['HONRO.html'],'anonymous shell')
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  q['provider']=page.evaluate(O['LAUNCH'],{'stage':23,'catalogID':'stage-23','activeDeclaredDimensions':[9800,6200]})
  need(q['provider']=={'stage':'stage-23','compact':None,'width':9800,'height':6200},'not canonical actual Stage23')
  c=page.locator('#battlecanvas');c.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
   return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  args={'stage':23,'id':'stage-23','name':'west','dx':-1,'dy':0,'readback':False}
  got=page.evaluate(PARK,args);q['pose']=got
  decode=page.evaluate(O['DECODE']);q['decode']=decode
  need(decode['registered']>0 and decode['font']=='loaded' and not decode['failed'],'native visual decode absent')
  need(page.evaluate(PARK,{**args,'readback':True})==got and got==expected['pose'],'same official B west camera / native state differs')
  owner=page.evaluate(O['OWNER']);q['liveOwner']={k:v for k,v in owner.items() if k not in ('collision','floor')}
  need(q['liveOwner']==expected['owner'],'wrong actual Stage23 render authority')
  raw=base64.b64decode(page.evaluate(RAW),validate=True)
  dom=c.screenshot(animations='disabled',caret='hide',scale='css')
  need(raw==base64.b64decode(page.evaluate(RAW),validate=True),'DOM observation changed raw frame')
  q['frames']={}
  for k,b in [('raw',raw),('dom',dom)]:
   n=f'LIVE-s23-{key}-west-{k}.png';(out/n).write_bytes(b)
   p=row_png(b);need(p['size']==expected[k]['size'],('capture dimensions differ from official B',k))
   q['frames'][k]={**p,'path':n,'approvedQABRGBA':expected[k]['rgba'],'exactDecodedPixelMatch':p['rgba']==expected[k]['rgba']}
  flush()
  drain(page)
  q.update(status='PUBLIC_ACTUAL_CAPTURED',seen=len(seen),verifiedRoute={k:seen[k] for k in sorted(required)})
 finally:
  q['errors']=errors;flush();ctx.close()
def main(out):
 a=bound();out.mkdir(parents=True,exist_ok=True)
 from playwright.sync_api import sync_playwright
 q={'status':'HOLD','release':a,'qa':P['qa'],'scope':'anonymous exact public normal Stage23 West only, no build or old screenshot recapture','visits':{},'failures':[]}
 try:
  graph=manifest(a)
  with sync_playwright()as p:
   b=p.chromium.launch(headless=True)
   try:
    q['browser']=b.version;need(b.version=='151.0.7922.34','unexpected Chromium')
    for k in ('1440x900','390x844'):
     try:visit(b,out,q,k,graph)
     except Exception as err:q['failures'].append({'device':k,'error':repr(err),'trace':traceback.format_exc()});save(out/'BROWSER.json',q)
   finally:b.close()
  need(not q['failures'] and len(q['visits'])==2 and all(p['status']=='PUBLIC_ACTUAL_CAPTURED' for p in q['visits'].values()),'incomplete public two-device observation')
  q['approvedBFrameEquality']=all(v['exactDecodedPixelMatch']for p in q['visits'].values()for v in p['frames'].values())
  q['status']='PASS_PUBLIC_WEST_TWO_ACTUAL_EXACT_POSES'
 finally:save(out/'BROWSER.json',q)
if __name__=='__main__':
 if sys.argv[1:]==['--verify-binding']:bound()
 else:
  need(len(sys.argv)==2,'usage: capture.py OUT or --verify-binding')
  main(Path(sys.argv[1]).resolve())
