"""No build. Public Stage44 South and Southeast proof on exact release, two anonymous PC/M visits."""
import base64,hashlib,io,json,os,re,subprocess,sys,time,traceback,urllib.request
from pathlib import Path
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
O=json.loads((H/'observer.json').read_bytes())
LIVE='https://sys8994.github.io/honro/'
M='web/manifest.json'
WORKFLOW='.github/workflows/stage44-root-floor-public-readback.yml'
MEDIA=set(P['media'])
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}')
NEAR=lambda s: isinstance(s,str) and re.fullmatch('[0-9a-f]{40}',s) is not None
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
 names={WORKFLOW,*(str(H.relative_to(repo)/x) for x in ('PINS.json','capture.py','observer.json'))}
 need(NEAR(h) and g('rev-list','--parents','-1','HEAD').split()==[h,commit] and g('rev-parse',commit+'^{tree}')==tree,
      'checkout must be direct child of exact public master')
 need(set(g('diff','--no-renames','--name-status',commit,h).splitlines())=={'A\t'+n for n in names} and
      all(g('ls-tree',h,'--',n).startswith('100644 blob ')for n in names) and not g('status','--porcelain=v1'),
      'unknown or edited product file in detached readback')
 check((repo/M).read_bytes(),aM,'parent retained manifest')
 source=P['approvedSource']
 need(g('rev-parse',commit+':'+source['path'])==source['new'] and sha((repo/source['path']).read_bytes())==source['sha256'],
      'release source is not signed approved renderer')
 route=published_route(a); shell=check((repo/'HONRO.html').read_bytes(),route['HONRO.html'],'exact released shell')
 entry=a['shellAndEntry']['entryPath']; entrybytes=check((repo/entry).read_bytes(),route[entry],entry)
 need(re.findall(br'<script type="module" src="(web/entries/game\.[a-f0-9]{16}\.js)"',shell)==[entry.encode()],
      'released shell does not import the pinned game entry')
 for k,pin in P['verifiedRoute'].items():
  check((repo/k).read_bytes(),pin,'approved Stage44 B route '+k)
  if k.startswith('web/runtime/'):
   need(('../runtime/'+Path(k).name).encode()in entrybytes,'entry does not import approved '+k)
 return a
def published_route(a):
 se=a['shellAndEntry']
 need(isinstance(se,dict)and set(se)=={'shell','entryPath','entry'},'missing resulting release shell and entry pin')
 ep=se['entryPath'];need(isinstance(ep,str)and re.fullmatch(r'web/entries/game\.[a-f0-9]{16}\.js',ep),'invalid exact released game entry')
 for key in ('shell','entry'):
  v=se[key];need(isinstance(v,dict)and set(v)=={'bytes','sha256'}and type(v['bytes'])is int and v['bytes']>0 and re.fullmatch('[a-f0-9]{64}',v['sha256']),'invalid released '+key)
 need(re.fullmatch(r'web/entries/game\.'+se['entry']['sha256'][:16]+r'\.js',ep),'entry filename does not name content hash')
 return {**P['verifiedRoute'],'HONRO.html':se['shell'],ep:se['entry']}
def manifest(a):
 req=urllib.request.Request(LIVE+M,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity',
       'User-Agent':'Mozilla/5.0 HONRO anonymous Stage44 readback'})
 with urllib.request.urlopen(req,timeout=45) as r:
  need(r.status==200 and r.geturl()==LIVE+M and r.headers.get('Content-Encoding') in (None,'identity'),
       ('wrong public manifest fetch',r.status,r.geturl()))
  m=json.loads(check(r.read(a['manifest']['bytes']+1),a['manifest'],M))
 graph={i['path']:{k:i[k] for k in ('bytes','sha256')}for i in m['files']}
 need(len(graph)==len(m['files']),'duplicate active URL')
 route=published_route(a)
 for k,v in route.items():
  if k!='HONRO.html':need(graph.get(k)==v,('normal B role missing from active published manifest',k))
 need(m['project'] in P['verifiedRoute'] and m['project'].startswith('web/data/campaign.')
      and m['gameEntry'].split('?')[0]==a['shellAndEntry']['entryPath'],'manifest active game/campaign pointers differ')
 return {**graph,'HONRO.html':route['HONRO.html']},route
def row_png(b):
 from PIL import Image
 with Image.open(io.BytesIO(b)) as im:
  im.load();return {'fact':fact(b),'size':list(im.size),'rgba':sha(im.convert('RGBA').tobytes())}
def visit(browser,out,status,key,known,route):
 f=P['references'][key];W,H=f['viewportCSS'];required=set(route)|set(O['PREFETCH'])
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
  page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
  for e,f in [('request',request),('requestfinished',done),('requestfailed',fail),('response',response),('pageerror',lambda e:errors.append(['pageerror',str(e)]))]:page.on(e,f)
  doc=page.goto(LIVE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  need(doc and doc.url==LIVE+'HONRO.html' and doc.status==200 and not doc.from_service_worker and not doc.request.redirected_from,
       'anonymous public shell was not exact')
  check(doc.body(),known['HONRO.html'],'anonymous shell')
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  need(all(known[k]==v for k,v in O['PREFETCH'].items()),'title prewarm roles changed')
  page.evaluate("()=>{if(HonroApp.screen!=='title'||HonroCampaignLoader.has(2))throw Error('not title or unintended Stage2 activation');HonroCampaignLoader.prewarmNext(1);}")
  warmed={};deadline=time.monotonic()+12
  while time.monotonic()<deadline:
   need(not errors,errors)
   for k,r in responses:
    if k in O['PREFETCH'] and r.request not in pending and k not in warmed:
     warmed[k]=fact(check(r.body(),O['PREFETCH'][k],k))
   if warmed==O['PREFETCH']:break
   page.wait_for_timeout(60)
  need(warmed==O['PREFETCH'],'QA-equivalent normal title prewarm not observed')
  need(page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)"),'normal title was unexpectedly replaced')
  page.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
  page.evaluate(O['LAUNCH'],44)
  c=page.locator('#battlecanvas');c.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
   return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  args={'id':44,'mapId':'stage-44','name':f['view'],'dx':1 if f['view']=='southeast' else 0,'dy':1,
        'ordinary':f['ordinary'],'readback':False,'fixedNow':O['PHASE']}
  observed=page.evaluate(O['FROZEN'],args);meta=observed['meta']
  dd=None;replay=None;warning=None
  try:
   dd=page.evaluate(O['DECODE'])
   replay=page.evaluate(O['FROZEN'],{**args,'readback':True})
  except Exception as err:warning=repr(err)
  q['frames']={}
  def raster(kind,body):
   n=f'LIVE-{key}-{kind}.png'
   (out/n).write_bytes(body);q['frames'][kind]={'path':n,'fact':fact(body)};flush()
  raw=base64.b64decode(page.evaluate(O['CANVAS']),validate=True);raster('raw',raw)
  dom=c.screenshot(animations='disabled');raster('dom',dom)
  for k,body in [('raw',raw),('dom',dom)]:
   p=row_png(body); ref=f['images'][k]
   q['frames'][k].update(**p,approvedQABRGBA=ref['rgba'],exactDecodedPixelMatch=p['rgba']==ref['rgba'])
  flush()
  need(all(q['frames'][k]['size']==f['images'][k]['size'] for k in ('raw','dom')),'QA image dimensions changed')
  need(dd and dd['registered']>0 and not dd['failed'] and replay==observed,('native decode or render repeat changed',warning,dd))
  need(page.evaluate("()=>document.fonts.status==='loaded'&&HonroApp.profile.settings.music===false&&HonroApp.profile.settings.sound===false"),
       'public observation readiness changed')
  keys=('actual','viewport','focus','css','backing','sceneTime','phase','round','tide','actorCount')
  q['pose']={k:meta[k]for k in keys};need(all(meta[k]==f[k]for k in keys),'same official B pose/actors/turn differ')
  t=page.evaluate(O['CHECK']); ref=f['browserProof']
  need(t['stage']==44 and t['authored']=='stage-44' and len(t['root'])==1 and t['root'][0]['painted'] is True
       and t['root'][0]['broken'] is False and t['root'][0]['oneWay'] is False,'canonical physical root absent')
  signed={'mapSHA256':sha(t['map'].encode()),'registeredArtSHA256':sha(t['registeredArt'].encode()),
          'domainSHA256':sha(t['domain'].encode()),'rootSHA256':sha(json.dumps(t['root'],sort_keys=True).encode()),
          'physicsSHA256':sha(meta['signature'].encode()),'rootWalk':t['rootWalk'],'keptWalk':t['keptWalk'],
          'physicalClosureCount':t['closurePhysical'],'raster':t['raster'],'observedClosure':t['closure'],
          'allOtherOmitted':t['alreadyRemoved'],'fixedCloud':observed['cloud'],'fixedGrade':observed['time']}
  q['observedRoot']=signed
  need(signed==ref,'approved root floor draw-only omission, source, actual physics or phase mismatch')
  drain(page)
  q.update(status='PUBLIC_ACTUAL_CAPTURED',seen=len(seen),verifiedRoute={k:seen[k] for k in sorted(set(route))})
 finally:
  q['errors']=errors;flush();ctx.close()
def main(out):
 a=bound();out.mkdir(parents=True,exist_ok=True)
 from playwright.sync_api import sync_playwright
 q={'status':'HOLD','release':a,'qa':P['qa'],'scope':'Anonymous Stage44 PC South and M Southeast only, no build. Earlier strict 1DN result unchanged.','visits':{},'failures':[]}
 try:
  graph,route=manifest(a)
  with sync_playwright()as p:
   b=p.chromium.launch(headless=True)
   try:
    q['browser']=b.version;need(b.version=='151.0.7922.34','unexpected Chromium')
    for k in ('s44-1440x900-south','s44-390x844-southeast'):
     try:visit(b,out,q,k,graph,route)
     except Exception as err:q['failures'].append({'view':k,'error':repr(err),'trace':traceback.format_exc()});save(out/'BROWSER.json',q)
   finally:b.close()
  need(not q['failures'] and len(q['visits'])==2 and all(p['status']=='PUBLIC_ACTUAL_CAPTURED' for p in q['visits'].values()),'incomplete public two-device observation')
  q['approvedBFrameEquality']=all(v['exactDecodedPixelMatch']for p in q['visits'].values()for v in p['frames'].values())
  q['status']='PASS_PUBLIC_S44_TWO_ACTUAL_EXACT_POSES'
 finally:save(out/'BROWSER.json',q)
if __name__=='__main__':
 if sys.argv[1:]==['--verify-binding']:bound()
 else:
  need(len(sys.argv)==2,'usage: capture.py OUT or --verify-binding')
  main(Path(sys.argv[1]).resolve())
