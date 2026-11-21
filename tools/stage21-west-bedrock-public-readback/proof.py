"""Actual anonymous Stage21/26 Pages observation. No response interception or product writes."""
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
TOP='sys8994/honro';REF='refs/heads/qa/stage21-west-bedrock-public-readback-r2'
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'};MF='web/manifest.json';HTML='HONRO.html'
FILES={'.github/workflows/stage21-west-bedrock-public-readback-r2.yml',*(f'tools/stage21-west-bedrock-public-readback/{k}'for k in ('PINS.json','entry.json','proof.py'))}
MEDIA=set(f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3'))
PREFETCH={'web/data/chapter-02-assets.ddddf53df4d749c6.json': {'bytes': 256633, 'sha256': 'ddddf53df4d749c60375cba085a79d790319b1e9c1790cb29e840529409ab434'}, 'web/data/chapter-02.5faa275befa85b0d.json': {'bytes': 55013, 'sha256': '5faa275befa85b0d49205b25a9d902c9d7ce448cf52fe25e124d4005b10f2ad2'}}
OUT=None
proof={'status':'INIT','frames':[],'visits':[],'scope':'Anonymous real Pages normal Stage21/26 with synthetic clean entry prerequisite only, diagnostic cameras; no gameplay result or user save.'}
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
 mod=SHELL|{MF,'shared/runtime/act3-handoff-art.js'}
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
 assert a.keys()-b.keys()==P['priorURLUnchanged'].keys() and b.keys()-a.keys()==P['newURLs'].keys()
 assert all(a[k]==b[k]for k in a.keys()&b.keys())
 hist=[g for g in lg['publishedGenerations'] if g['sourceSha']==OLD]
 assert len(hist)==1 and hist[0]['files']==og['files'] and hist[0]['publishedAt']==PRE['publishedAt']
 assert hist[0]['publishedAtPrecision']=='instant' and hist[0]['evidence']==f"https://github.com/{TOP}/actions/runs/{PRE['run']}"
 assert hist[0]['graphSha256']==R['retention']['retainedPreviousGraphSHA256']
 assert all(fact(show(live,k))==fact(show(OLD,k))==v==a[k]for k,v in {**P['priorURLUnchanged'],**P['resources']}.items())
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
  t['run'],t['head'],'qa/stage21-west-bedrock-retention-9ac','.github/workflows/stage21-west-bedrock-retention.yml','completed','success','push')
 assert ret['repository']['full_name']==ret['head_repository']['full_name']==TOP
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(t['job'],t['run'],'seal','completed','success')
 objs=[i for i in api(f"actions/runs/{t['run']}/artifacts")['artifacts'] if i['id']==t['artifact']]
 assert len(objs)==1
 x=objs[0];assert not x['expired'] and x['name']=='honro-stage21-west-bedrock-retained-source-and-generated-no-deploy'
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
 rr={**P['priorURLUnchanged'],**P['resources'],**{k:pins[k]for k in SHELL|P['newURLs'].keys()}}
 observed={MF:gate(pins)};raw={}
 for k,v in sorted(rr.items()):
  raw[k]=http(k,v['bytes']);observed[k]=fact(raw[k]);assert observed[k]==v,('wrong canonical anonymous public bytes',k)
 home=fact(http('',pins['index.html']['bytes']));assert home==pins['index.html'];observed['root/']=home
 c=distinct(raw[P['campaign']]);ch=P['chapter21'];co=P['actualStage26WestControls'][0]['binding']
 assert len(c['stages'])==len(c['stageLibraries'])==50 and c['stages'][20]==ch['map'] and c['stageLibraries'][20]==ch['packet']
 assert {c['stages'][25],c['stageLibraries'][25]}==co.keys()
 assert distinct(raw[ch['map']])['metadata']['stageId']==21 and distinct(raw[c['stages'][25]])['metadata']['stageId']==26
 save('HTTP-PUBLIC.json',{'status':'EXACT_PUBLIC_RETAINED','verified':observed,'canonical50Count':50,'s21':ch,'s26':co})
 return pins
def path(u):
 return u[len(BASE):] if u.startswith(BASE) and not any(a in u for a in '?#') else None
def rgba(data):
 from PIL import Image
 with Image.open(io.BytesIO(data))as im:
  im.load(); a=im.convert('RGBA')
  return {'size':list(a.size),'rgba':sha(a.tobytes()),'pngSHA256':sha(data)}
def normal_title_prewarm(page,pins,hits,pending,errors,visit):
 assert all(pins[k]==v for k,v in PREFETCH.items()),'exact signed normal Stage2 prefetch graph changed'
 # Normal callback intentionally fetches packet then map before entering battle.
 # This wakes the existing optional title prefetch once; it never activates Stage2.
 page.evaluate("""()=>{if(HonroApp.screen!=='title'||HonroCampaignLoader.has(2)||
   typeof HonroCampaignLoader.prewarmNext!=='function')throw Error('Stage2 already active or not the stock title path');
   HonroCampaignLoader.prewarmNext(1);}""")
 stage2={};visit['normalTitlePrewarm']={'api':'HonroCampaignLoader.prewarmNext(1)','observed':stage2}
 log()
 deadline=time.monotonic()+17
 while time.monotonic()<deadline:
  assert not errors,errors
  for k,r in hits:
   if k in PREFETCH and k not in stage2 and r.request not in pending:
    stage2[k]=fact(r.body());assert stage2[k]==PREFETCH[k],('normal Stage2 preload hash mismatch',k)
  if stage2.keys()==PREFETCH.keys():break
  page.wait_for_timeout(50)
 visit['normalTitlePrewarm']['awakeButUnloaded']=page.evaluate("()=>HonroApp.screen==='title'&&!HonroCampaignLoader.has(2)")
 log()
 assert stage2==PREFETCH and visit['normalTitlePrewarm']['awakeButUnloaded'],(
   'normal title prewarm incomplete; did not enter Stage21',sorted(PREFETCH.keys()-stage2.keys()))
def capture(browser,pins,wh,stage,refs):
 w,h=wh;dev=f'{w}x{h}'
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000)
 errors=[];pending=set();hits=[];blobs=[];result={}
 visit={'device':dev,'stage':stage,'errors':errors,'status':'START','verifiedRequests':result}
 proof['visits'].append(visit);log()
 def req(q):
  if q.method!='GET':errors.append(['unexpected non-GET',q.method,q.url])
  if path(q.url) in pins:pending.add(q)
 def failed(q):
  if not(path(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errors.append(['failed',q.url,q.failure])
  pending.discard(q)
 def resp(r):
  k=path(r.url);q=r.request
  if r.status==200 and q.method=='GET' and BLOB.fullmatch(r.url):blobs.append(r.url)
  elif k in MEDIA and q.resource_type=='media' and q.method=='GET' and r.status in (200,206):return
  elif r.status==200 and k in pins and q.method=='GET':hits.append((k,r))
  else:errors.append(['unexpected response',r.status,r.url,q.method])
 page.on('request',req);page.on('response',resp)
 page.on('requestfinished',lambda q:pending.discard(q));page.on('requestfailed',failed)
 page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 page.add_init_script('('+E['INIT']+')()')
 try:
  r=page.goto(BASE+HTML,wait_until='domcontentloaded',timeout=50000)
  assert r and r.url==BASE+HTML and r.status==200 and fact(r.body())==pins[HTML]
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  if stage==21:normal_title_prewarm(page,pins,hits,pending,errors,visit)
  page.evaluate(E['LAUNCH'],stage);canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",polling=125,timeout=12000)
  if stage==21:page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for ref in refs:
   name=ref.get('view','west');key=f's{stage}-{dev}-{name}'
   frame={'key':key,'device':dev,'stage':stage,'view':name};proof['frames'].append(frame);log()
   q={'id':stage,'mapId':f'stage-{stage}','name':name,'ordinary':P['chapter21']['ordinary'] if stage==21 else None,
      'dx':{'west':-1,'east':1}.get(name,0),'dy':0,'readback':False}
   f=page.evaluate(E['PARK'],q);d=page.evaluate(E['DECODE'])
   assert d['registered']>0 and not d['failed']
   again=page.evaluate(E['PARK'],{**q,'readback':True});assert f==again
   sig=sha(f.pop('signature').encode())
   frame['state']={**f,'physicsSHA256':sig}
   if stage==21:
    dom=canvas.screenshot(animations='disabled');(OUT/f'{key}-dom.png').write_bytes(dom);frame['dom']=rgba(dom)
    if name=='ordinary':
     o=page.evaluate(E['OWN'],{'stage':stage,'front':P['ownerId'],'back':P['baseOwnerId'],'variant':'B'})
     frame['owner']=o;assert o==P['owner'][dev]
     u=page.evaluate(E['PARK'],{**q,'readback':True});assert sha(u.pop('signature').encode())==sig and u==f
   rb=base64.b64decode(page.evaluate("()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"),validate=True)
   (OUT/f'{key}-raw.png').write_bytes(rb);frame['raw']=rgba(rb);log()
   tests={'physics':sig==ref['physicsSHA256'],'pose':f['actual']==ref['actual'],'viewport':f['viewport']==ref['viewport'],
     'raw':all(frame['raw'][k]==ref['raw'][k]for k in ('size','rgba'))}
   if stage==21:
    tests.update({'dom':all(frame['dom'][k]==ref['png'][k]for k in ('size','rgba')),
     'canvasAndState':all(f[k]==ref[k]for k in ('backing','css','focus','zoomLimits','phase','round','actorCount','tide','sceneTime'))})
   frame['checks']=tests;log();assert all(tests.values()),('public normal replay exact RGBA/state mismatch',key,tests)
  i=quiet=0;deadline=time.monotonic()+17
  wanted=set(P['mustObserve'][dev]) if stage==21 else set(refs[0]['binding'])
  while time.monotonic()<deadline:
   assert not errors,errors
   while i<len(hits) and hits[i][1].request not in pending:
    k,r=hits[i];i+=1; value=fact(r.body())
    assert value==pins[k],('actual browser public asset mismatch',k)
    result[k]=value
   lifecycle=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
   prev=len(hits),len(blobs)
   page.wait_for_timeout(100)
   calm=prev==(len(hits),len(blobs)) and i==len(hits) and not pending and set(blobs)<=lifecycle and wanted<=result.keys()
   quiet=quiet+1 if calm else 0
   if quiet==4:break
  visit['missing']=sorted(wanted-result.keys());visit['pending']=[r.url for r in pending];log()
  assert quiet==4 and not errors and not visit['missing'] and i==len(hits),('exact closure incomplete',stage,dev,visit['missing'],visit['pending'],errors,quiet,len(result))
  if stage==21:
   assert result.keys()-{MF}==wanted,('incompatible actual Stage21 registered network shape',sorted(result.keys()-{MF}-wanted))
  else:assert all(result[k]==v for k,v in refs[0]['binding'].items())
  assert page.evaluate("()=>{if(window.__honroQAUndo){window.__honroQAUndo();delete window.__honroQAUndo;return true;}return false;}")
  visit['status']='PASS';log()
 finally:ctx.close()
def app():
 log()
 try:
  pins=anonymous()
  from playwright.sync_api import sync_playwright
  with sync_playwright()as w:
   b=w.chromium.launch(headless=True);assert b.version==P['browser'],('browser drift',b.version,P['browser'])
   for xy in ((1440,900),(390,844)):
    frames=[r for r in P['actualCandidateFrames']if tuple(r['viewportCSS'])==xy]
    ctrl=[r for r in P['actualStage26WestControls']if f'{xy[0]}x{xy[1]}'in r['file']]
    assert [x['view']for x in frames]==['ordinary','west','overview','east'] and len(ctrl)==1
    capture(b,pins,xy,21,frames);capture(b,pins,xy,26,ctrl)
   b.close()
  assert len(proof['frames'])==10 and len(proof['visits'])==4 and all(x['status']=='PASS'for x in proof['visits'])
  assert fact(http(MF,12<<20))==pins[MF],'public manifest drift during actual captures'
  proof.update(status='PASS_EXACT_PUBLIC_STAGE21_EIGHT_AND_STAGE26_TWO',release=R['commit'],normal=N)
 except Exception as e:
  if not proof['status'].startswith('HOLD'):proof['status']='HOLD'
  proof['failure']=repr(e);raise
 finally:log()
if __name__=='__main__':
 mode=sys.argv[1];OUT=Path(sys.argv[2])
 assert OUT.is_dir()
 if mode=='authority':
  try:authority()
  except Exception as e:save('AUTHORITY-HOLD.json',{'status':'HOLD_BEFORE_PUBLIC_LOAD','reason':repr(e)});raise
 elif mode=='app':app()
 else:raise RuntimeError('expected authority or app')
