"""Disabled standalone anonymous HTTPS proof. No deploy, no user profile and no fixture writes.

Requires official custody pins and the certified checkout of the exact R5 tools;
reuses signed observers/JS, with one browser and distinct fresh contexts.
"""
from pathlib import Path
from urllib.parse import urlsplit
import base64, hashlib, importlib.util, io, json, re, subprocess, sys, zipfile
from urllib.request import build_opener, HTTPRedirectHandler, Request
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
F=P['certifiedOutput'];N=P['native'];LIVE=P['origin'];KEY='honro-first-act-profile-1'
def need(v,msg):
 if not v:raise RuntimeError(msg)
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def git(p,*a):return subprocess.check_output(['git','-C',str(p),*a],text=True,timeout=90).strip()
def checked(root,path):
 p=root/path
 need(p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(root.resolve()),('unsafe local path',path))
 return p.read_bytes()
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise RuntimeError('unexpected redirect')
def get(url,want):
 need(url.startswith(LIVE),'unexpected public URL')
 with build_opener(NoRedirect).open(Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=50)as r:
  need(r.status==200 and r.url==url,'unexpected public response status or URL')
  b=r.read(want['bytes']+1)
 need(fact(b)=={k:want[k]for k in ('bytes','sha256')},('public response body mismatch',url))
 return b
def index(m):
 x={}
 for r in m:
  k=r['path'];p={j:r[j]for j in ('bytes','sha256')}
  need(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k) and x.get(k,p)==p,('invalid registry path/bytes',k));x[k]=p
 return x
def authority(prod):
 need(P['enabled'] is True and all(v is not None for v in F.values()) and all(v is not None for v in N.values()),'DISABLED until exact public and R5 custody bound')
 need(re.fullmatch('[a-f0-9]{40}',F['head']) and re.fullmatch('[a-f0-9]{40}',F['tree']) and F['head']!=P['parent'],'invalid final Git authority')
 need(git(prod,'rev-parse','HEAD')==F['head'] and git(prod,'rev-parse','HEAD^{tree}')==F['tree'] and git(prod,'show','-s','--format=%P','HEAD')==P['parent'] and not git(prod,'status','--porcelain'),'exact clean published checkout required')
 def api(k):return json.loads(subprocess.check_output(['gh','api','repos/'+P['repo']+'/'+k],timeout=90))
 run=api(f"actions/runs/{F['pagesRun']}");job=api(f"actions/jobs/{F['pagesJob']}");head=api('branches/master')
 need(head['commit']['sha']==run['head_sha']==job['head_sha']==F['head'] and run['head_branch']=='master' and run['conclusion']==job['conclusion']=='success' and job['name']=='deploy' and job['run_id']==F['pagesRun'] and any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success' for x in job['steps']),'not exact successful current Pages')
 proof=F['assembly']
 need(proof['status']=='EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY' and proof['parent']==P['parent'] and proof['candidateTree']==F['tree'] and proof['manifest']==F['manifest'] and proof['oldUrls']==1511 and proof['preservedUrls']==1521 and proof['reviewedRun']==45041041832 and len(proof['add'])==11 and len(proof['modify'])==6,'wrong sealed writer assembly proof')
 changes=set(git(prod,'diff-tree','-r','--no-commit-id','--no-renames','--name-status',P['parent'],F['head']).splitlines())
 need(changes=={'A\t'+x for x in proof['add']}|{'M\t'+x for x in proof['modify']},'wrong actual published changed scope')
 logs=subprocess.check_output(['gh','api',f"repos/{P['repo']}/actions/jobs/{F['pagesJob']}/logs"],timeout=90)
 stamp=(F['publishedAt']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs))as z:
   need(sum(x.file_size for x in z.infolist())<16<<20 and z.testzip() is None,'unexpected Pages log body')
   found=any(stamp in z.read(x) for x in z.infolist() if not x.is_dir())
 else:found=stamp in logs
 need(found,'wrong exact published timestamp')
 raw=get(LIVE+'web/manifest.json',F['manifest']);need(raw==checked(prod,'web/manifest.json'),'public not exact repository manifest')
 m=json.loads(raw);acts=index(m['files']);r=index([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for z in m['publishedGenerations']for x in z['files'])])
 need(len(acts)==P['active'] and len(r)==P['registry'] and len(F['newAliases'])==len(F['oldAliases'])==10 and set(F['shells'])=={'HONRO.html','HONRO_WORKSHOP.html','index.html'},'invalid exact scope proof')
 prev=[g for g in m['publishedGenerations']if g['sourceSha']==P['parent']]
 need(len(prev)==1 and len(index(prev[0]['files']))==811,'exact e702 archive absent')
 alln={}
 for k,pin in {**F['newAliases'],**F['oldAliases'],**F['shells']}.items():
  need(len(k.split('/'))<=3 and (k in F['shells'] or pin==r[k]) and (k not in F['newAliases'] or pin==acts[k]),('wrong alias relationship',k))
  alln[k]=fact(get(LIVE+k,pin))
 return alln
def module(path,label,guard=None,capture=None):
 # Both exact observers use bare sibling module names; bind only for each isolated import.
 prior={k:sys.modules.get(k)for k in ('guard','capture')}
 try:
  if guard:sys.modules['guard']=guard
  if capture:sys.modules['capture']=capture
  sp=importlib.util.spec_from_file_location(label,path);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
 finally:
  for k,v in prior.items():
   if v is None:sys.modules.pop(k,None)
   else:sys.modules[k]=v
def old_root(url):
 q=urlsplit(url);need(q.scheme=='http' and q.hostname=='127.0.0.1' and q.port is not None and q.username is None and not q.query and not q.fragment and q.path.endswith('/'),'historical root must be isolated local HTTP')
 return url
def capture(prod,tools,out,url2c4,url32S):
 q={'status':'HOLD_PUBLIC_NATIVE_READBACK'};url2c4=old_root(url2c4);url32S=old_root(url32S)
 need(url2c4!=url32S,'historical contexts must use distinct exact fixture roots')
 q['publicBodies']=authority(prod)
 for k,v in P['nativeToolSHA'].items():need(fact(checked(tools,k))['sha256']==v,('R5 source observer altered',k))
 g32=module(tools/'stage32-batch/guard.py','publishedG32')
 c32=module(tools/'stage32-batch/capture.py','publishedC32',g32)
 r32=module(tools/'stage32-batch/resume.py','publishedR32',g32,c32)
 g33=module(tools/'stage33-batch/guard.py','publishedG33')
 c33=module(tools/'stage33-batch/capture.py','publishedC33',g33)
 need(not out.exists() and out.parent.is_dir() and not out.is_relative_to(prod),'fresh output dir outside product required')
 out.mkdir()
 def save():(out/'PUBLIC.json').write_text(json.dumps(q,indent=2)+'\n')
 save()
 from playwright.sync_api import sync_playwright
 def shot(p,label,o,arg,expect):
  meta=p.evaluate(o['FROZEN'],arg)['meta'];p.evaluate(o['DECODE']);p.evaluate(o['FROZEN'],{**arg,'readback':True})
  b=base64.b64decode(p.evaluate(o['CANVAS']),validate=True)
  d={k:meta[k]for k in ('actual','viewport','backing')}
  (out/(label+'.png')).write_bytes(b)
  need(c32.same_nums(d,expect['pose']) and fact(b)==expect['raw'],('actual public raw pose/pixels differ',label,d,fact(b)))
  return {'pose':d,'raw':fact(b),'path':label+'.png'}
 with sync_playwright()as w:
  br=w.chromium.launch(headless=True);q['browser']=br.version
  need(br.version==P['chromium'],'incorrect Chromium')
  def open(root,dims,o,pins,text=None,shell='HONRO.html',archive=None):
   ctx=br.new_context(viewport=dict(zip(('width','height'),dims)),device_scale_factor=1,service_workers='block')
   try:
    need(ctx.storage_state()=={'cookies':[],'origins':[]},'unclean isolated context')
    u=root+shell
    if root==LIVE:need(urlsplit(u).path=='/honro/'+shell,'bad public /honro boot')
    ctx.add_init_script('('+o['INIT']+')();'+o['INIT_SEED'])
    if text is not None:
     need(root==LIVE,'profile seeding not allowed in historical fixture')
     ctx.add_init_script(c33.seed_script(root,shell,text))
    p=ctx.new_page();rs={};errors=[];counts=[]
    p.on('response',lambda x:rs.setdefault(x.url.split('?',1)[0],x));p.on('pageerror',lambda e:errors.append(str(e)))
    if archive:p.on('request',lambda x:counts.append(x.url)if x.url==root+archive else None)
    nav=p.goto(u,wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.url==u and nav.status==200 and not nav.from_service_worker and not nav.request.redirected_from and fact(nav.body())==pins['shell'],'exact independent shell response required')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    def routes():
     found={}
     for k,body in pins['routes'].items():
      if k==shell:
       need(body==pins['shell'],'same real checked navigation body');found[k]=body;continue
      z=rs.get(root+k);need(z and z.status==200 and not z.from_service_worker and not z.request.redirected_from and fact(z.body())==body,('actual browser route mismatch',root,k))
      found[k]=body
     need(not errors,('native app page errors',errors))
     return found
    return ctx,p,routes,rs,counts
   except BaseException:ctx.close();raise
  def oldsave(text,p):
   need(p.evaluate('key=>localStorage.getItem(key)',KEY)==text and p.evaluate('()=>!HonroApp.engine&&!HonroApp.profileStore.locked'),'true cold exact isolated save required')
  def play(p,n):
   p.evaluate('()=>{HonroApp.frame=()=>{};HonroApp.continue();}')
   p.wait_for_function(f'()=>HonroApp.engine?.b?.honroStage==={n}&&!HonroApp.profileStore.locked',timeout=22000)
  q['stage33']={};q['stage32']={}
  ids=list(c33.P['rows'])
  refs={i:v['current']for i,v in c33.P['rows'].items()}
  def stage33_state(p):
   p.evaluate('()=>{const a=HonroApp;a.frame=()=>{};a.close();HonroStoryFraming.clear(a.scene);}')
   return p.evaluate(c33.BATTLE,{'ids':ids}),p.evaluate(c33.ART33,{'type':'mounted'})
  for dev,dims in [('PC',(1440,900)),('M',(390,844))]:
   a={'id':33,'mapId':'stage-33','name':'east','dx':1,'dy':0,'readback':False,'fixedNow':c33.O['PHASE']}
   app=q['stage33'][dev]={}
   ctx,p,wire,_,_=open(url2c4,dims,c33.O,N['stage33Historical2c4'],shell='OLD-2C4.html')
   try:
    p.evaluate(c33.O['LAUNCH'],33);old=p.evaluate(c33.READ_SAVE,{'key':KEY,'ids':ids})
    need(old['refs']==c33.P['legacy2c4Refs'] and old['revision']==5,'not genuine exact 2c4 compact save')
    app['old']={'original':fact(old['text'].encode()),'routes':wire(),'refs':old['refs']}
   finally:ctx.close()
   for phase in ('original','second-cold'):
    text=old['text'] if phase=='original' else saved['text']
    ctx,p,wire,_,_=open(LIVE,dims,c33.O,N['stage33Public'],text)
    try:
     oldsave(text,p);before=p.evaluate(c33.ART33,{'input':text,'type':'old'})if phase=='original'else None
     if before:need(before['copies']==[0,0],'not true older layout')
     play(p,33);b,z=stage33_state(p)
     need(z['copies']==[1,1] and z['exact'] and z['idempotent'] and b['rows']==c33.P['rows'] and b['official']==1 and b['mapId']=='stage-33','exact native migrated art, source gate or mirrors missing')
     need(all(b[k]==old[k]for k in ('terrain','units','phase','round','revision')) and all(b['refs'][i]['current']==j and all(x==j for x in b['refs'][i]['runtime'])for i,j in refs.items()),'old physics/progression or current signatures mismatch')
     if before:need(z['protectedPhysicalDigest']==before['protectedPhysicalDigest'],'original Stage33 physical digest changed')
     else:need(z['stateDigest']==app['original']['stateDigest'],'second cold Stage33 differs')
     frame=shot(p,'stage33-'+dev+'-'+phase,c33.O,a,N['stage33Raw'][dev])
     app[phase]={'frame':frame,'routes':wire(),'stateDigest':z['stateDigest']}
     if phase=='original':
      need(p.evaluate('key=>localStorage.getItem(key)',KEY)==text,'normal Continue mutated stored original before Save')
      saved=p.evaluate(c33.READ_SAVE,{'key':KEY,'ids':ids})
      z2=p.evaluate(c33.ART33,{'input':saved['text'],'type':'saved'})
      need(z2['copies']==[1,1] and z2['exact'] and saved['refs']==refs and all(saved[k]==old[k]for k in ('terrain','units','phase','round','revision')),'native Stage33 resave wrong')
      app['resaved']=fact(saved['text'].encode())
     save()
    finally:ctx.close()
   dkey='PC' if dev=='PC'else 'Mobile';log=q['stage32'][dkey]={};o=r32.O
   archive=r32.P['lazy']['directPath'];args={'id':32,'mapId':'stage-32','name':'south','dx':0,'dy':1,'readback':False,'fixedNow':o['PHASE']}
   ex={k:v['current']for k,v in r32.P['rows'].items()}
   scoped={'refs':r32.P['nativeArchiveFixtureStock']['compatRefs'],'key':KEY}
   def launch(p):
    p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
    p.evaluate(o['LAUNCH'],32)
    p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===32&&!HonroApp.profileStore.locked",timeout=22000)
   for label,origin,pins,op,shell in [('current',LIVE,N['stage32Public'],r32.PERSIST,'HONRO.html'),('old-native',url2c4,N['stage32HistoricalE702'],r32.PERSIST,'OLD-E702.html'),('archive',url32S,N['stage32HistoricalS'],r32.LEGACY_MINT,'HONRO.html')]:
    ctx,p,wire,_,count=open(origin,dims,o,pins,shell=shell,archive=archive)
    try:
     launch(p);ss=p.evaluate(op,scoped if label=='archive'else KEY);issuer=wire();need(not count,'unexpected archive in issuer')
     selected=ex if label=='current'else {k:v.get('previousOptimized',v['previous'])for k,v in r32.P['rows'].items()}
     need(ss['refs']==scoped['refs'] if label=='archive'else all(ss['refs'][i] and all(x==j for x in ss['refs'][i])for i,j in selected.items()),'unexpected real issuer provider tokens')
     log[label+'-issuer']={'routes':issuer,'refs':ss['refs'],'save':fact(ss['text'].encode())};save()
    finally:ctx.close()
    ctx,p,wire,rs,count=open(LIVE,dims,o,N['stage32Public'],ss['text'],archive=archive)
    try:
     oldsave(ss['text'],p);need(not count and p.evaluate(r32.NEEDS)['archiveNeeded']==(label=='archive'),'pre-Continue archive scope')
     p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
     play(p,32);z=p.evaluate(r32.RESTORED)
     need(z['state']==ss['state'] and all(z['active'][k]==[v] and z['mounted'][k] and all(x==v for x in z['mounted'][k])for k,v in ex.items()),'real Stage32 rebuilt level/physics or provider changed')
     need(count==([LIVE+archive]if label=='archive'else []),'wrong number of public native archive fetches')
     if label=='archive':
      a0=rs.get(LIVE+archive)
      need(a0 and a0.status==200 and not a0.from_service_worker and not a0.request.redirected_from and fact(a0.body())==r32.P['lazy']['legacyDirectRetained'],'wrong public archive response')
      done=p.evaluate(r32.LEGACY_READ,scoped)
      need(done['state']==ss['state'] and done['refs']==scoped['refs'],'archive native resave dropped qualified refs')
     expect=N['stage32South' if label=='current'else 'stage32PriorSouth'][dkey] if label!='archive'else None
     frame=shot(p,'stage32-'+dkey+'-'+label,o,args,expect) if expect else None
     log[label]={'frame':frame,'archiveGets':len(count),'routes':wire(),'restoredFrom':fact(ss['text'].encode())};save()
    finally:ctx.close()
  q['workshop']=c33.fullWorkshop(br,LIVE,N['workshop'])
  need(q['workshop']['fullLibraryLength']==1194 and q['workshop']['fullMapLength']==50 and q['workshop']['archiveGETs']==1,'exact published Workshop shape')
  save()
  # Stage7 exact current native fog/terrain immutability uses the already signed helper, not an extra test carrier.
  ctx,p,wire,_,_=open(LIVE,(1440,900),c33.O['STAGE7'],N['stage7Public'])
  try:
   p.evaluate(c33.O['STAGE7']['LAUNCH'],7)
   p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return a.engine?.b?.honroStage===7&&document.getElementById('turn-banner')?.hidden!==false;}",polling=125,timeout=14000)
   def check7(x):
    need({k:fact(x[k].encode())for k in ('provider','physicalUnregistered')}==c33.P['stage7']['model'] and x['activeFacies']==1 and x['exactOldBaseUnwrapped'] and not x['usesOldFiller'] and x['materialDifferent'],'Stage7 canonical native model changed')
   check7(p.evaluate(c33.LOCK7));wire()
   text=p.evaluate("key=>{HonroApp.showTitle();return localStorage.getItem(key)}",KEY)
   need(text and json.loads(text)['honroBattle']['honroStage']==7 and c33.P['stage7']['knownAsset'] not in text,'public Stage7 native save missing or visual leaked')
  finally:ctx.close()
  ctx,p,wire,_,_=open(LIVE,(1440,900),c33.O['STAGE7'],N['stage7Public'],text)
  try:
   oldsave(text,p);p.evaluate("()=>{HonroApp.frame=()=>{};}")
   p.locator('[data-action="continue"]').first.click(timeout=15000)
   p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===7&&!!HonroApp.scene",timeout=22000)
   p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return a.engine?.b?.honroStage===7&&document.getElementById('turn-banner')?.hidden!==false;}",polling=125,timeout=14000)
   check7(p.evaluate(c33.LOCK7));q['stage7']={'routes':wire(),'nativeCurrentCold':True,'input':fact(text.encode())};save()
  finally:ctx.close()
 q['status']='PASS_EXACT_PUBLIC_STAGE32_AND_STAGE33_PC_M_WITH_STAGE7_WORKSHOP';save()
if __name__=='__main__':
 need(P['enabled'] is True,'DISABLED until exact new Pages success, signed R5 archive and scoped approval')
 need(len(sys.argv)==6,'readback.py EXACT_PUBLIC_CHECKOUT EXACT_R5_TOOLS FRESH_OUTPUT LOOPBACK_2C4 LOOPBACK_72DD')
 capture(*(Path(p).resolve()for p in sys.argv[1:4]),*sys.argv[4:])
