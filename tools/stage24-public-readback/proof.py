"""Actual anonymous Stage24 Pages observation. No response interception or product writes."""
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
TOP='sys8994/honro';REF='refs/heads/qa/stage24-public-readback'
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'};MF='web/manifest.json';HTML='HONRO.html'
FILES={'.github/workflows/stage24-public-readback.yml',*(f'tools/stage24-public-readback/{k}'for k in ('PINS.json','entry.json','proof.py'))}
MEDIA=set(f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3','battle-4'))
OUT=None
proof={'status':'INIT','frames':[],'visits':[],'scope':'Anonymous real Pages normal Stage24 with synthetic clean entry prerequisite only, diagnostic cameras; no gameplay result or user save.'}
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
 assert R['enabled'] is True,'DISABLED: exact successful Stage24 master Pages authority needed'
 m=R['retainedManifest']
 assert all(hx(x,40)for x in (R['commit'],R['tree'],m['git'])) and all(hx(x,64)for x in (
   m['sha256'],R['retainedPreviousGraphSHA256']))
 assert all(pos(x)for x in (m['bytes'],R['pagesRun'],R['pagesJob']))
 assert m['bytes']<=12<<20 and m['sha256'] not in (PRE['manifestSHA256'],P['generated'][MF]['sha256'])
 assert dt.datetime.fromisoformat(R['publishedAt']).tzinfo is not None
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(TOP,'push',REF)
def registry(m):
 rows=[*m['files'],*m.get('previousFiles',[])]
 for group in m.get('previousGenerations',[]):rows.extend(group)
 for group in m.get('publishedGenerations',[]):rows.extend(group['files'])
 r={}
 for x in rows:
  k=x['path'];value=want(x)
  assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[a-zA-Z0-9_.-]+',k) and hx(value['sha256'],64)
  assert k not in r or r[k]==value,('conflicting immutable registry',k)
  r[k]=value
 return r
def established():
 require_release()
 head=os.environ['GITHUB_SHA'];live=R['commit'];m=R['retainedManifest']
 assert git('rev-list','--parents','-n1','HEAD').decode().split()==[head,live]
 assert git('rev-list','--parents','-n1',live).decode().split()==[live,OLD]
 assert all(git('rev-parse',c+'^{tree}').decode().strip()==t for c,t in ((OLD,P['priorTree']),(live,R['tree'])))
 assert not git('status','--porcelain=v1','-z')
 assert set(git('diff','--name-status','--no-renames',live,head).decode().splitlines())=={'A\t'+k for k in FILES}
 assert all(git('ls-tree',head,k).split(None,1)[0]==b'100644'for k in FILES)
 mod=SHELL|{MF}|set(P['sourceFiles']);add=set(P['newURLs'])
 assert len(mod)==len(add)==6 and set(P['generated'])==SHELL|{MF}|add
 assert set(git('diff','--name-status','--no-renames',OLD,live).decode().splitlines())=={'M\t'+k for k in mod}|{'A\t'+k for k in add}
 assert all(git('ls-tree',live,k).split(None,1)[0]==b'100644'for k in mod|add)
 assert all(blob(show(live,k))==v and blob(show(OLD,k))==P['oldSourceFiles'][k]for k,v in P['sourceFiles'].items())
 assert all(fact(show(live,k))==v for k,v in P['generated'].items() if k!=MF)
 raw=show(live,MF);old=show(OLD,MF)
 assert fact(raw)==want(m) and blob(raw)==m['git'] and sha(old)==PRE['manifestSHA256'] and blob(old)==PRE['manifestGitBlob']
 lg,og=distinct(raw),distinct(old);a,b=inv(og),inv(lg)
 omit={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 assert graph_id({k:v for k,v in lg.items()if k not in omit})==P['normalManifestWithoutHistory']
 assert graph_id(b)==P['newGraph'] and graph_id(a)==P['preGraph']
 assert a.keys()-b.keys()==P['priorURLUnchanged'].keys() and b.keys()-a.keys()==P['newURLs'].keys()
 assert all(a[k]==b[k]for k in a.keys()&b.keys())
 hist=[g for g in lg['publishedGenerations'] if g['sourceSha']==OLD]
 assert len(hist)==1 and hist[0]['files']==og['files'] and hist[0]['publishedAt']==PRE['publishedAt']
 assert hist[0]['publishedAtPrecision']=='instant' and hist[0]['evidence']==f"https://github.com/{TOP}/actions/runs/{PRE['run']}"
 assert hist[0]['graphSha256']==R['retainedPreviousGraphSHA256']
 ra,rb=registry(og),registry(lg);assert len(ra)==1311 and len(rb)==1317 and not set(ra)&set(P['newURLs']) and rb=={**ra,**P['newURLs']}
 assert all(fact(show(live,k))==fact(show(OLD,k))==v==a[k]for k,v in P['priorURLUnchanged'].items())
 return {**b,**P['stableShells'],MF:want(m)}
def api(p):return distinct(subprocess.check_output(['gh','api',f'repos/{TOP}/'+p],timeout=30))
def authority():
 established()
 live=R['commit']
 assert api('git/ref/heads/master')['object']['sha']==live,'master advanced: do not reuse pins'
 run=api(f"actions/runs/{R['pagesRun']}");job=api(f"actions/jobs/{R['pagesJob']}")
 assert (run['id'],run['head_sha'],run['head_branch'],run['name'],run['status'],run['conclusion'])==(
  R['pagesRun'],live,'master','pages build and deployment','completed','success')
 assert run['repository']['full_name']==run['head_repository']['full_name']==TOP
 assert (job['id'],job['run_id'],job['name'],job['status'],job['conclusion'])==(R['pagesJob'],R['pagesRun'],'deploy','completed','success')
 step=[s for s in job['steps']if s['name']=='Deploy to GitHub Pages']
 assert len(step)==1 and (step[0]['status'],step[0]['conclusion'])==('completed','success')
 stamp=dt.datetime.fromisoformat(R['publishedAt'])
 assert dt.datetime.fromisoformat(step[0]['started_at'])<=stamp<=dt.datetime.fromisoformat(job['completed_at'])+dt.timedelta(seconds=1)
 n=api(f"actions/runs/{N['run']}")
 assert (n['head_sha'],n['status'],n['conclusion'],n['repository']['full_name'],n['head_repository']['full_name'])==(N['head'],'completed','success',TOP,TOP)
 aa=[i for i in api(f"actions/runs/{N['run']}/artifacts")['artifacts'] if i['id']==N['artifact']]
 assert len(aa)==1 and not aa[0]['expired'] and aa[0]['size_in_bytes']==N['outer']['bytes'] and aa[0]['digest']=='sha256:'+N['outer']['sha256']
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
 assert cert=={'status':'EXACT_MASTER_AND_SUCCESSFUL_PAGES','release':R,'normal':N,'tokenlessNext':True}
 rr={**P['priorURLUnchanged'],**P['resources'],**{k:pins[k]for k in SHELL|P['newURLs'].keys()}}
 observed={MF:gate(pins)};raw={}
 assert len(P['priorURLUnchanged'])==len(P['newURLs'])==6
 for k,v in sorted(rr.items()):
  raw[k]=http(k,v['bytes']);observed[k]=fact(raw[k]);assert observed[k]==v,('wrong canonical anonymous public bytes',k)
 home=fact(http('',pins['index.html']['bytes']));assert home==pins['index.html'];observed['root/']=home
 b=P['binding']; c=distinct(raw[b['campaign']])
 assert len(c['stages'])==len(c['stageLibraries'])==50
 assert (c['stages'][23],c['stageLibraries'][23],c['base'],c['shared'])==(b['map'],b['packet'],b['base'],b['shared'])
 assert distinct(raw[b['map']])['metadata']['stageId']==24
 assert b['entry'].rsplit('/',1)[-1].encode() in raw[HTML] and b['workshop'].rsplit('/',1)[-1].encode() in raw['HONRO_WORKSHOP.html']
 assert b['packet'] in pins and b['map'] in pins
 save('HTTP-PUBLIC.json',{'status':'EXACT_PUBLIC_SIX_OLD_SIX_NEW','verified':observed,'totalOldImmutableRegistry':1311,'totalNewImmutableRegistry':1317,'canonical24':b})
 return pins
def path(u):
 return u[len(BASE):] if u.startswith(BASE) and not any(a in u for a in '?#') else None
def rgba(data):
 from PIL import Image
 with Image.open(io.BytesIO(data))as im:
  im.load(); a=im.convert('RGBA')
  return {'size':list(a.size),'rgba':sha(a.tobytes()),'pngSHA256':sha(data)}
def capture(browser,pins,xy):
 w,h=xy;dev=f'{w}x{h}'
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(30000)
 page.add_init_script('('+E['INIT']+')()')
 errors=[];pending=set();hits=[];verified={};blobs=set();pos=0
 state={'device':[w,h],'errors':errors,'status':'INIT','observed':verified};proof['visits'].append(state);log()
 needs=set(P['mustObserve'][dev])
 assert needs<=pins.keys()
 def req(q):
  k=path(q.url)
  if not(q.method=='GET' and (k in pins or k in MEDIA and q.resource_type=='media' or BLOB.fullmatch(q.url) or q.url.startswith('data:'))):
   errors.append(['noncanonical request',q.method,q.url])
  if k in pins:pending.add(q)
 def fail(q):
  pending.discard(q)
  if not(path(q.url) in MEDIA and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errors.append(['failed request',q.url,q.failure])
 def resp(r):
  k=path(r.url)
  if k in pins and r.status==200:hits.append((k,r))
  elif BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif k in MEDIA and r.request.resource_type=='media' and r.status in (200,206):pass
  elif not r.url.startswith('data:'):errors.append(['unexpected response',r.status,r.url])
 page.on('request',req);page.on('requestfinished',lambda q:pending.discard(q))
 page.on('requestfailed',fail);page.on('response',resp);page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 def drain():
  nonlocal pos
  quiet=0;end=time.monotonic()+18
  while time.monotonic()<end:
   assert not errors,errors
   while pos<len(hits) and hits[pos][1].request not in pending:
    k,r=hits[pos];receipt=fact(r.body());assert receipt==pins[k],('actual browser loaded wrong canonical response bytes',k)
    verified[k]=receipt;pos+=1
   before=(pos,len(blobs));page.wait_for_timeout(110)
   quiet=quiet+1 if before==(len(hits),len(blobs)) and not pending and needs<=verified.keys() else 0
   if quiet==3:
    assert not errors and blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    return
  raise RuntimeError(('missing required HTTP app body',sorted(needs-verified.keys()),sorted(x.url for x in pending),errors))
 try:
  shell=page.goto(BASE+HTML,wait_until='domcontentloaded',timeout=50000)
  assert shell and shell.url==BASE+HTML and shell.status==200 and fact(shell.body())==pins[HTML]
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  page.evaluate(E['LAUNCH'],24)
  canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for n in ('east-ordinary','west'):
   k=f's24-{dev}-{n}';state['attempt']=k;log()
   near=n=='east-ordinary';q={'id':24,'mapId':'stage-24','name':'ordinary' if near else n,
      'ordinary':E['NEAR'] if near else None,'dx':1 if near else -1,'dy':0,'readback':False}
   f=page.evaluate(E['PARK'],q);decoded=page.evaluate(E['DECODE'])
   assert decoded['registered']>0 and decoded['font']=='loaded' and not decoded['failed']
   assert page.evaluate(E['PARK'],{**q,'readback':True})==f
   owner=page.evaluate(E['OBSERVE'],P['law']);assert owner['realState']['canvasDPR']==1
   f['physicsSHA256']=sha(f.pop('signature').encode())
   ref=P['poses'][k]
   assert f==ref['requiredFrame'],('normal replay geometry/camera/actors/physics mismatch',k)
   assert owner==ref['owner'],('canonical registered/rendered binding mismatch',k)
   drain()
   rp=base64.b64decode(page.evaluate(E['PNG']),validate=True)
   dp=canvas.screenshot(animations='disabled',timeout=30000)
   assert base64.b64decode(page.evaluate(E['PNG']),validate=True)==rp,('DOM moved frozen scene',k)
   frame={'key':k,'requiredFrame':f,'registeredAndNative':owner,'checks':{}}
   for mode,body in (('raw',rp),('dom',dp)):
    (OUT/f'public-{k}-{mode}.png').write_bytes(body)
    frame[mode]=rgba(body)
    frame['checks'][mode]=all(frame[mode][v]==ref[mode][v]for v in ('size','rgba'))
   proof['frames'].append(frame);log()
   assert all(frame['checks'].values()),('normal B vs actual public full-frame RGBA mismatch',k,frame['checks'])
  del state['attempt'];state['status']='PASS';log()
 finally:ctx.close()
def app():
 log()
 try:
  pins=anonymous()
  from playwright.sync_api import sync_playwright
  with sync_playwright()as w:
   b=w.chromium.launch(headless=True);assert b.version==P['browser']
   for xy in ((1440,900),(390,844)):capture(b,pins,xy)
   b.close()
  assert len(proof['frames'])==4 and len(proof['visits'])==2 and all(x['status']=='PASS'for x in proof['visits'])
  assert fact(http(MF,12<<20))==pins[MF],'public manifest changed during capture'
  proof.update(status='PASS_EXACT_PUBLIC_STAGE24_EAST_AND_WEST',release=R['commit'],normal=N)
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
