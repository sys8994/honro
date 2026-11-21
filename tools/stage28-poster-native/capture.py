"""Exact normal compiled A/B via native camera, no served payload interception."""
import base64,io,math,os,re,sys,time,json
from pathlib import Path
from PIL import Image
from statistics import median
from guard import Q,P,MF,sha,facts,save
from playwright.sync_api import sync_playwright
DIRECTIONS={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
OBS=json.loads((Q/'stock-observer.json').read_bytes())
PARK=(Q/'park.js').read_text(); VERIFY=(Q/'observe.js').read_text()
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
def rgba(raw): return Image.open(io.BytesIO(raw)).convert('RGBA')
def document(f):return json.loads(f.read_bytes())
def stamp(out,r):save(out/'BROWSER.json',r)
def case(browser,w,out,report,v,arm,g):
 a=arm=='A';origin='http://127.0.0.1:'+('18891'if a else '18892')+'/'; blob=re.compile('blob:'+re.escape(origin)+r'[\da-f-]{36}')
 known=g['active'+arm]; alias=dict(g['aliases']); required={k if a else alias.get(k,k)for k in v['requests']}|{g['runtime'+arm]}
 for k,val in v['requests'].items():
  if a or k not in alias and k!='HONRO.html':assert known[k]==val
 report['visits'].append(entry:={'arm':arm,'stage':v['stage'],'device':v['device'],'views':[],'state':'pending'})
 stamp(out,report)
 ctx=browser.new_context(viewport=dict(zip(('width','height'),v['device'])),device_scale_factor=1,service_workers='block')
 try:
  assert ctx.storage_state()=={'cookies':[],'origins':[]}
  page=ctx.new_page();page.set_default_timeout(30000);page.add_init_script('('+OBS['INIT']+')()')
  errors=[];todo=set();hits=[];checked={};seen=set();i=0
  def path(url):return url[len(origin):]if url.startswith(origin) and '?' not in url and '#' not in url else None
  def request(r):
   k=path(r.url)
   if r.method!='GET' or not(k in known or k in MEDIA and r.resource_type=='media' or blob.fullmatch(r.url)or r.url.startswith('data:')):
    errors.append(('unknown request',r.method,r.url))
   if k in known:todo.add(r)
  def failed(r):
   todo.discard(r)
   if not(path(r.url) in MEDIA and r.resource_type=='media' and r.failure=='net::ERR_ABORTED'):errors.append(('failed',r.url,r.failure))
  def response(r):
   k=path(r.url)
   if k in known and r.status==200:hits.append((k,r))
   elif blob.fullmatch(r.url)and r.status==200:seen.add(r.url)
   elif k in MEDIA and r.request.resource_type=='media' and r.status in (200,206):return
   elif not r.url.startswith('data:'):errors.append(('unknown response',r.url,r.status))
  for k,f in [('request',request),('requestfinished',todo.discard),('requestfailed',failed),('response',response),('pageerror',lambda e:errors.append(('page error',str(e))))]:page.on(k,f)
  def drain():
   nonlocal i
   q=0;expiry=time.monotonic()+20
   while time.monotonic()<expiry:
    assert not errors,errors
    while i<len(hits)and hits[i][1].request not in todo:
     k,r=hits[i];assert facts(r.body())==known[k],(arm,k);checked[k]=known[k];i+=1
    before=(i,len(seen));page.wait_for_timeout(105)
    q=q+1 if before==(len(hits),len(seen))and not todo and required<=checked.keys()else 0
    if q==3:
     assert seen<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'));return
   raise RuntimeError(('missing normal response bodies',sorted(required-checked.keys()),errors))
  r=page.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert r and r.status==200 and r.url==origin+'HONRO.html'and facts(r.body())==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  stage=v['stage']; id=v['provider']['stage'];dim=[v['provider'][k]for k in ('width','height')]
  assert page.evaluate(OBS['LAUNCH'],{'stage':stage,'catalogID':id,'activeDeclaredDimensions':dim})==v['provider']
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  def png():return base64.b64decode(page.evaluate(OBS['RAW']),validate=True)
  rawDIR=out/('mobile'if v['device'][0]==390 else 'pc-target'if stage==28 else 'pc-control')
  rawDIR.mkdir(exist_ok=True)
  for name in v['directions']:
   k=f's{stage:02d}-{v["device"][0]}x{v["device"][1]}-{name}'; x,y=DIRECTIONS[name];p={'stage':stage,'id':id,'name':name,'dx':x,'dy':y,'readback':False}
   start=page.evaluate(PARK,p); dec=page.evaluate(OBS['DECODE']);assert dec>0
   assert page.evaluate(PARK,{**p,'readback':True})==start
   ref=P['frames'][k]; sig={o:start[o]for o in ref.keys()-{'referencePNG','positive'}}
   assert sig=={o:ref[o]for o in sig},(arm,k,'camera/state/owner/physics differs',[(o,sig[o],ref[o])for o in sig if sig[o]!=ref[o]])
   law={'stage':stage,'depth':9000 if a else 27400}; actual=page.evaluate(VERIFY,law)
   snap=png()
   if a: assert facts(snap)==ref['referencePNG'],(arm,k,'already observed public baseline PNG SHA drift',facts(snap),ref['referencePNG'])
   # The native renderer, not an injected paint pass, must reproduce a warm frame byte-for-byte.
   assert page.evaluate(PARK,{**p,'readback':True})==start
   warm=page.evaluate(VERIFY,law); assert png()==snap
   assert {x:y for x,y in warm.items()if x!='cache'}=={x:y for x,y in actual.items()if x!='cache'}
   assert warm['cache']==actual['cache'],(arm,k,'warm cache churn')
   assert list(rgba(snap).size)==ref['backing']
   path=rawDIR/f'{arm}-{k}-raw.png';path.write_bytes(snap)
   data={'arm':arm,'path':str(path.relative_to(out)),'png':facts(snap),'physics':sig,'native':actual,'images':dec}
   report['frames'][f'{arm}-{k}']=data;entry['views'].append(k);stamp(out,report)
  drain();entry.update(state='NETWORK_AND_CAPTURE_EXACT',requiredObserved=sorted(required),observedCount=len(checked));stamp(out,report)
 finally:ctx.close()
def compare(A,B,ref):
 assert A.size==B.size and list(A.size)==ref['backing']; w,h=A.size
 u=ref['viewport'];z=ref['actual']['scale'];skin=ref['positive']
 diff,alpha,bad,peak=0,0,0,0;yr=[]
 pa,pb=A.load(),B.load()
 for y in range(h):
  yt=u['top']+y/z
  for x in range(w):
   a,b=pa[x,y],pb[x,y]
   if a==b:continue
   diff+=1;peak=max(peak,max(abs(i-j)for i,j in zip(a,b)));yr.append(y)
   alpha+=(a[3]!=b[3])
   bad+=not (skin and yt>=8900 and -9000<=u['left']+x/z and u['left']+(x+1)/z<=16200)
 good=False;diagnostics={}
 if skin:
  y0=math.ceil((9000-u['top'])*z)+2
  bot=(y0,h)
  levels=lambda pp,y:median(sum(pp[x,y][:3])/3 for x in range(w))
  # Archived original exposes continuous lighter FAR after y9000. Predeclared
  # below-cut stock vs B uses in-plane occupancy, not tuning a visual difference.
  old=min(levels(pa,y)for y in range(*bot));new=max(levels(pb,y)for y in range(*bot))
  above=levels(pb,max(0,y0-7)); uniform=max(abs(levels(pb,y)-levels(pb,y+1))for y in range(max(0,y0-7),h-1))
  diagnostics={'lowerBandRows':list(bot),'stockBrightMinMedian':old,'candidateDarkMaxMedian':new,'candidateAboveLuma':above,'largestNewAdjacentMedianStep':uniform}
  good=old-new>=20 and uniform<=8
 else:good=diff==0
 return {'pass':not(alpha or bad)and good and (diff>0 if skin else True),'signedPositive':skin,'changed':diff,'unsigned':bad,
         'alpha':alpha,'maxRGBADN':peak,'changedRows':([min(yr),max(yr)]if yr else None),'noReplacementLineInNativeMinimumCamera':diagnostics}
def paired(out,q):
 for k,f in P['frames'].items():
  a,b=[q['frames'][side+'-'+k]for side in ('A','B')]
  assert a['physics']==b['physics']
  n,m=a['native'],b['native']
  assert {i:x for i,x in n.items()if i!='deep'}=={i:x for i,x in m.items()if i!='deep'},(k,'native draw/physics/cold cache changed',n,m)
  if n['deep']:assert {**n['deep'],'renderY':27400}==m['deep']
  o=compare(rgba((out/a['path']).read_bytes()),rgba((out/b['path']).read_bytes()),f)
  q['paired'][k]=o;stamp(out,q)
 assert len(q['paired'])==24 and all(r['pass']for r in q['paired'].values()),'a camera or unsigned pixel/visual cutoff gate failed'
def main(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';g=document(out/'GRAPH.json')
 q={'status':'HOLD','release':P['base'],'scope':'Official isolated A public compiled and B normally rebuilt; new native render observations, not playthrough or publication.',
    'witness':P['witness'],'visits':[],'frames':{},'paired':{}}
 try:
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['chrome']=br.version
   try:
    assert br.version=='151.0.7922.34'
    for side in ('A','B'):
     for v in P['visits'].values():case(br,w,out,q,v,side,g)
   finally:br.close()
  paired(out,q);q['status']='PASS_ACTUAL_STAGE28_SIGNED_POSTER_ONLY'
 except Exception as e:q['firstFailedGate']=repr(e);raise
 finally:stamp(out,q)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
