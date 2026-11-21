"""Exact normal compiled A/B via native camera, no served payload interception."""
import base64,io,math,os,re,sys,time,json,traceback
from pathlib import Path
from PIL import Image
from statistics import median
from guard import Q,P,MF,sha,facts,save
from playwright.sync_api import sync_playwright
DIRECTIONS={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
OBS=json.loads((Q/'stock-observer.json').read_bytes())
PARK=(Q/'park.js').read_text(); VERIFY=(Q/'observe.js').read_text()
WARM_NORTH={'witnessArtifact': 14716303705, 'phase1': {'bytes': 148895, 'sha256': '341178607e56844ac7c95de31c3e897e868a173776a8c71533c1c3b89e9b7bf8'}, 'phase2': {'bytes': 148896, 'sha256': '25663b11decb190899b1d45122ad2fb7a683af00c679433c38a2a1faac104595'}, 'phase1BackgroundBytes': 0, 'phase2BackgroundBytes': 1010880, 'phase2BackgroundSize': [390, 648], 'diagnosticRelease': 'acb51f4ee1c5afa90751dc256d6ad8d900732779'}  # Independent actual stock stage28 mobile north witness.
SCREEN=r"""() => {
 const s=HonroApp.scene,c=s.canvas,r=s.renderCacheStats();
 const caches=['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'].map(k=>{
  const q=s[k]; return {registered:typeof q?.key==='string',size:q?.canvas?[q.canvas.width,q.canvas.height]:null,bytes:q?.bytes??null};
 });
 const fields=['worldBuilds','bgBuilds','screenBuilds','screenWorldBytes','screenBackgroundBytes','screenForegroundBytes',
   'worldBytes','worldScale','backgroundBytes','domainCanvasAllocations','domainTileBuilds'];
 if(fields.some(k=>r[k]!=null&&!Number.isFinite(r[k])))throw Error('invalid native cache counters');
 return {caches,structural:Object.fromEntries(fields.map(k=>[k,r[k]??0])),
   hits:Object.fromEntries(['worldHits','bgHits','screenHits'].map(k=>[k,r[k]??0])),
   backing:[c.width,c.height]};
}"""
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
  for k,f in [('request',request),('requestfinished',lambda r:todo.discard(r)),('requestfailed',failed),('response',response),('pageerror',lambda e:errors.append(('page error',str(e))))]:page.on(k,f)
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
   start=page.evaluate(PARK,p);dec=page.evaluate(OBS['DECODE']);assert dec>0
   ref=P['frames'][k];sig={o:start[o]for o in ref.keys()-{'referencePNG','positive'}}
   law={'stage':stage,'depth':9000 if a else 27400}
   rec={'arm':arm,'physics':sig,'images':dec,'phases':{'repeats':[]}}
   report['frames'][f'{arm}-{k}']=rec
   def take(label):
    camera=page.evaluate(PARK,{**p,'readback':True})
    native=page.evaluate(VERIFY,law)
    snap=png()
    suffix='' if label=='phase1' else '-'+label
    frame_path=rawDIR/f'{arm}-{k}{suffix}-raw.png'
    frame_path.write_bytes(snap)
    row={'path':str(frame_path.relative_to(out)),'png':facts(snap),'native':native,'sameCameraAndPhysics':camera==start}
    if label.startswith('repeat'):rec['phases']['repeats'].append(row)
    else:rec['phases'][label]=row
    stamp(out,report)
    # Gather screen-cache evidence only after saving the exact original raw.
    row['screen']=page.evaluate(SCREEN)
    assert list(rgba(snap).size)==ref['backing'] and row['screen']['backing']==ref['backing']
    stamp(out,report)
    return snap,row,frame_path
   snap,first,_=take('phase1')
   # Preserve the R2 exact archive guard for every accepted baseline first snapshot.
   if a:assert first['png']==ref['referencePNG'],(arm,k,'already observed public baseline PNG SHA drift',first['png'],ref['referencePNG'])
   assert sig=={o:ref[o]for o in sig},(arm,k,'camera/state/owner/physics differs',[(o,sig[o],ref[o])for o in sig if sig[o]!=ref[o]])
   assert first['sameCameraAndPhysics'],(arm,k,'phase1 same readback')
   warm,second,_=take('phase2')
   assert second['sameCameraAndPhysics'],(arm,k,'phase2 same readback')
   # The exact stock same-pose transition is certified independently; do not
   # accept changes in this prior known evidence or waive phase-matching A/B.
   if a and k=='s28-390x844-north':
    assert first['png']==WARM_NORTH['phase1'] and second['png']==WARM_NORTH['phase2'],(arm,k,'known native north phases differ from independent actual stock')
    assert first['screen']['structural']['screenBackgroundBytes']==WARM_NORTH['phase1BackgroundBytes']
    assert second['screen']['structural']['screenBackgroundBytes']==WARM_NORTH['phase2BackgroundBytes']
    assert second['screen']['caches'][1]['size']==WARM_NORTH['phase2BackgroundSize']
    report['phaseWitness'].update({'A-mobile-north-cold-qualified':True,'A-mobile-north-settled-qualified':True});stamp(out,report)
   assert first['native']==second['native'],(arm,k,'cache allocation/material/state drift between phases')
   screen_semantic=lambda f:{i:x for i,x in f['screen'].items()if i!='hits'}
   for i in (1,2):
    restored,r,img=take(f'repeat{i}')
    assert r['sameCameraAndPhysics'] and r['native']==second['native'],(arm,k,'settled repeat camera/physics/native bounded tile drift',i)
    assert screen_semantic(r)==screen_semantic(second),(arm,k,'settled repeat changes native structural screen cache',i)
    assert restored==warm,(arm,k,'settled native render does not reproduce byte for byte',i)
    # Evidence retains both qualified images and per-repeat receipts; preserve
    # unexpected failure raw frames above, drop only byte-identical duplicates.
    img.unlink();r['path']=second['path'];r['identicalDuplicateNotArchived']=True
   rec.update(path=first['path'],png=first['png'],native=first['native'])
   entry['views'].append(k);stamp(out,report)
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
  phases={}
  for label in ('phase1','phase2'):
   aa=a['phases'][label];bb=b['phases'][label];n,m=aa['native'],bb['native']
   assert aa['sameCameraAndPhysics'] and bb['sameCameraAndPhysics']
   assert {i:x for i,x in n.items()if i!='deep'}=={i:x for i,x in m.items()if i!='deep'},(k,label,'native draw/physics/bounded tile cache changed',n,m)
   assert bool(n['deep'])==bool(m['deep'])
   if n['deep']:assert {**n['deep'],'renderY':27400}==m['deep']
   assert aa['screen']==bb['screen'],(k,label,'phase-matched native screen state differs',aa['screen'],bb['screen'])
   phases[label]=compare(rgba((out/aa['path']).read_bytes()),rgba((out/bb['path']).read_bytes()),f)
   # Preserve R2 phase1 status fields for downstream read-only retainer, while
   # release seal now requires both exact independent same-phase comparisons.
   q['paired'][k]={**phases['phase1'],'pass':False,'phases':phases};stamp(out,q)
  q['paired'][k]['pass']=all(x['pass']for x in phases.values());stamp(out,q)
 assert len(q['paired'])==24 and all(r['pass']for r in q['paired'].values()),'a cache phase/camera or unsigned pixel/visual cutoff gate failed'
def main(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';g=document(out/'GRAPH.json')
 q={'status':'HOLD','release':P['base'],'scope':'Official isolated A public compiled and B normally rebuilt; new native render observations, not playthrough or publication.',
    'witness':P['witness'],'stockPhaseEvidence':WARM_NORTH,'phaseWitness':{},'visits':[],'frames':{},'paired':{}}
 try:
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['chrome']=br.version
   try:
    assert br.version=='151.0.7922.34'
    for side in ('A','B'):
     for v in P['visits'].values():case(br,w,out,q,v,side,g)
   finally:br.close()
  paired(out,q);q['status']='PASS_ACTUAL_STAGE28_SIGNED_POSTER_ONLY'
 except Exception as e:
  q['firstFailedGate']=repr(e);(out/'BROWSER.traceback.txt').write_text(traceback.format_exc());raise
 finally:stamp(out,q)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
