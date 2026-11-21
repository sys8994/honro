"""Exact R2 stock route; two fresh mobile north contexts, no candidate."""
import base64,json,os,re,sys,time
from pathlib import Path
from guard import Q,P,facts,save,sha
from sequence import exact_r2_sequence,probe
from playwright.sync_api import sync_playwright
OBS=json.loads((Q/'stock-observer.json').read_bytes())
PARK=(Q/'park.js').read_text();VERIFY=(Q/'observe.js').read_text()
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
def stamp(out,x):save(out/'DIAGNOSTIC.json',x)
def case(browser,out,report,g,label):
 origin='http://127.0.0.1:18891/'
 blob=re.compile('blob:'+re.escape(origin)+r'[\da-f-]{36}')
 known=g['active']
 v=P['reference'];ref=P['frame']
 required=set(v['requests'])|{P['baseCompiledRuntime']}
 assert all(known[k]==val for k,val in v['requests'].items())
 report['visits'].append(entry:={'context':label,'stage':v['stage'],'device':v['device'],'state':'pending'})
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
     k,r=hits[i];assert facts(r.body())==known[k],(label,k);checked[k]=known[k];i+=1
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
  if label=='exact-R2-order':
   observation=exact_r2_sequence(page,out/label,park=PARK,decode=OBS['DECODE'],verify=VERIFY,png=OBS['RAW'],reference=ref['referencePNG'])
  else:
   observation=probe(page,out/label,park=PARK,decode=OBS['DECODE'],verify=VERIFY,reference=ref['referencePNG'])
  drain()
  entry.update(state='STOCK_ONLY_WITNESSED',requiredObserved=sorted(required),observedCount=len(checked))
  entry['exactReferenceSnapshot']=observation.get('rawAExactlyReference',observation.get('r2InitialRawMatchesExactPublic'))
  sig={o:observation['nativeSignedPose'][o] for o in ref.keys()-{'referencePNG','positive'}}
  entry['exactReferenceState']=sig=={o:ref[o]for o in sig} and all(observation['parkReadbackMatches'])
  entry['exactR2FurtherState']=observation.get('firstVerifyWarmStateMatches')
  stamp(out,report)
 finally:ctx.close()
def main(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes())
 q={'status':'DIAGNOSTIC_INCOMPLETE_NO_RELEASE_AUTHORITY','release':P['base'],'r2Run':P['r2Run'],'witness':P['witness'],'visits':[],'candidateOpened':False}
 try:
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['chrome']=br.version
   try:
    assert br.version==P['browserVersion']
    for label in ('exact-R2-order','operation-timeline'):
     try:case(br,out,q,g,label)
     except Exception as e:
      q.setdefault('contextErrors',{})[label]=repr(e);stamp(out,q)
   finally:br.close()
  assert not q.get('contextErrors'),q.get('contextErrors')
  assert len(q['visits'])==2 and all(r['exactReferenceSnapshot'] and r['exactReferenceState']for r in q['visits']), 'fresh A/mobile north is not archive-exact: evidence preserved, no inference'
  q['status']='ACTUAL_STOCK_DIAGNOSTIC_RECORDED_NO_CANDIDATE_OR_RELEASE_GATE'
 except Exception as e:q['firstFailedGate']=repr(e);raise
 finally:stamp(out,q)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
