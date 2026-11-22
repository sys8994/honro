"""Actual 733 committed A and separate normal-built B, no mutation of saved provider/maps."""
import base64,json,sys,io
from pathlib import Path
from guard import P,D,fact,need,save
O=json.loads((D/'observer.json').read_bytes())
Q=json.loads((D/'POSES.json').read_bytes())
URL={'A':'http://127.0.0.1:18841/','B':'http://127.0.0.1:18842/'}
LOCK="""()=>{const b=HonroApp.engine.b,s=(b.honroLandmarks||[]).find(x=>x.asset?.id==='act1-site:7:body'),m=HonroTerrainDomain.materialLandmarks(b).find(x=>x.asset?.id==='act1-site:7:body');if(!s||!m)throw Error('No authored Stage7 vertical owner');return {id:s.id,provider:JSON.stringify(s.asset),physicalUnregistered:JSON.stringify([b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds,b.honroLandmarks.map(z=>[z.id,z.scale,z.x,z.y,z.collisionIds])]),materialDifferent:s!==m,height:m.asset.bounds.h,usesOldFiller:m.asset.vector.root.children.some(z=>z.clipPath==='site-edge-2'),exactOldBaseUnwrapped:s.asset.vector.root.children[0]===m.asset.vector.root.children[0],activeFacies:m.asset.vector.root.children.filter(z=>z.clipPath==='stage7R7Facies').length};}"""
def stage33_canary(br,out,g,q,report):
 l=P['legacy33'];o=O['LEGACY33'];key='honro-first-act-profile-1'
 status=q['stage33Legacy']={'status':'HOLD','rawExported':False,'errors':[]};report()
 old='http://127.0.0.1:18844/';new=URL['B']
 def begin(url,seed=None):
  c=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
  c.add_init_script('('+o['INIT']+')();'+o['INIT_SEED'])
  if seed is not None:c.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(seed)+');')
  p=c.new_page();net={};errors=[]
  p.on('response',lambda r:net.setdefault(r.url,r));p.on('pageerror',lambda e:errors.append(str(e)))
  nav=p.goto(url+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  need(nav and nav.status==200 and nav.url==url+'HONRO.html' and not nav.from_service_worker,'normal Stage33 shell unavailable')
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  return c,p,net,errors,nav
 def proof(net,url,pin):
  out={}
  for p,v in pin.items():
   r=net.get(url+p);need(r and r.status==200 and not r.from_service_worker and fact(r.body())==v,('Stage33 actual immutable route drift',p))
   out[p]=v
  return out
 def shot(p,label):
  d={'id':33,'mapId':'stage-33','name':'east','dx':1,'dy':0,'readback':False,'fixedNow':o['PHASE']}
  pose=p.evaluate(o['FROZEN'],d)['meta'];p.evaluate(o['DECODE']);p.evaluate(o['FROZEN'],{**d,'readback':True})
  b=base64.b64decode(p.evaluate(o['CANVAS']),validate=True);name=label+'-RAW.png';(out/name).write_bytes(b)
  return {'raw':fact(b),'png':name,'pose':{k:pose[k]for k in ('actual','viewport','backing')}}
 ids=list(l['rows'])
 try:
  c,p,r,err,n=begin(old)
  try:
   need(fact(n.body())=={k:l['oldShell'][k]for k in ('bytes','sha256')},'historic c60 shell exact mismatch')
   p.evaluate(o['LAUNCH'],33)
   record=p.evaluate(o['READ_SAVE'],{'key':key,'ids':ids});actual=fact(record['text'].encode())
   status['oldC60']={'save':actual,'refs':record['refs'],'capture':shot(p,'Stage33-c60-genuine-old'),'routes':proof(r,old,l['oldRoutes'])};report()
   need(not err and actual==l['publicGenuineSave'] and record['refs']=={i:v['previous']for i,v in l['rows'].items()},'c60 actual authored legacy save differs')
  finally:c.close()
  c,p,r,err,n=begin(new,record['text'])
  try:
   raw=p.evaluate("()=>HonroApp.profileStore.original().text")
   need(raw==record['text'] and not p.evaluate("()=>HonroApp.profileStore.locked"),'0b9 candidate did not read unchanged legacy bytes')
   p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}")
   p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===33&&HonroApp.engine.b.honroAct4Official===1",timeout=16000)
   p.evaluate("()=>{const a=HonroApp;a.frame=()=>{};a.close();HonroStoryFraming.clear(a.scene);}")
   status['restoredPC']=shot(p,'Stage33-0b9candidate-c60-restored')
   info=p.evaluate(o['BATTLE'],{'ids':ids});
   status['resumed']={'stage':info['stage'],'map':info['mapId'],'providerSignatures':info['refs'],'terrain':fact(info['terrain'].encode()),'units':fact(info['units'].encode()),'revision':info['revision'],'save':fact(raw.encode())};report()
   need(info['rows']==l['rows'] and info['revision']==info['expectedRevision']==record['revision'] and info['stage']==33 and info['mapId']=='stage-33' and info['official']==1 and not info['locked'],'restored exact Stage33 compatibility registry/authority differed')
   need(info['terrain']==record['terrain'] and info['units']==record['units'] and info['phase']==record['phase'] and info['round']==record['round'],'c60 restored Stage33 battle state changed')
   need(all(info['refs'][i]['current']==row['current'] and all(v==row['current']for v in info['refs'][i]['runtime'])for i,row in l['rows'].items()),'c60 actual restored art provider signature differs')
   p13=g['legacy33CompatExact']['B'];pp=dict(l['currentMapFacts']);pp[p13['path']]={k:p13[k]for k in ('bytes','sha256')}
   status['routes']=proof(r,new,pp)
   negative=p.evaluate(o['NEG'],{'text':record['text'],'ids':ids,'rows':l['rows']})
   status['negative']=negative
   need(all(negative.values()) and not err,'c60 unexpected legacy negatives')
   expected=l['publicCurrent'];capture=status['restoredPC']
   need(capture['raw']==expected['raw'] and capture['pose']==expected['pose'],'real Stage33 restored picture differed from official public matched stock')
   status['status']='ACTUAL_C60_STAGE33_RESTORE_EXACT'
  finally:c.close()
 except Exception as e:status['errors'].append(repr(e));print('LEGACY STAGE33',repr(e),flush=True)
 finally:report()


ART='act1-site:7:r7-facies'; KEY='honro-first-act-profile-1'
def new_page(ctx,urls,errors):
 p=ctx.new_page()
 p.on('response',lambda r:urls.setdefault(r.url,r))
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 nav=p.goto(URL['B']+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
 need(nav and nav.status==200 and not nav.from_service_worker,'actual candidate navigation')
 p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
 return p
def frozen_stage7(p):
 p.locator('#battlecanvas').wait_for(state='visible')
 p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return a.engine?.b?.honroStage===7&&document.getElementById('turn-banner')?.hidden!==false;}",polling=125,timeout=14000)
 return p.evaluate(LOCK)
def save_now(p):
 return p.evaluate('''()=>{const a=HonroApp;if(a.debugMode||a.training||a.engine?.b?.mode!=='campaign'||a.engine?.b?.honroStage!==7)throw Error('Stage7 normal UI save unavailable');a.showTitle();const s=localStorage.getItem('honro-first-act-profile-1'),p=JSON.parse(s||'null');if(p?.honroBattle?.honroStage!==7||a.profileStore.locked)throw Error('Stage7 UI persistence missing');return s;}''')
def assert_unchanged_signed_model(p,expected):
 m=frozen_stage7(p)
 need(m['activeFacies']==1 and m['exactOldBaseUnwrapped'] and m['materialDifferent'] and not m['usesOldFiller'],'missing exact Stage7 package after cold save')
 need({j:fact(m[j].encode())for j in ('provider','physicalUnregistered')}==expected,'original Stage7 provider or geometry differs on resume')
def chapter7_save_cases(br,w,g,q,report,stock_text):
 scope=q['packageSave']={'legacyResave':'HOLD','freshCreate':'HOLD','freshColdContinue':'HOLD','freshResave':'HOLD','rawExported':False};report()
 wanted=q['views']['PC-ordinary']['A']['model'];c={}
 def begin(seed=None):
  context=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
  if seed is not None: context.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(seed,ensure_ascii=True)+');')
  n={};errors=[];p=new_page(context,n,errors)
  return context,p,n,errors
 def network(net):
  z=g['chapterB'];route=g['routes']['B']
  return all(URL['B']+u in net and net[URL['B']+u].status==200 and not net[URL['B']+u].from_service_worker and fact(net[URL['B']+u].body())==route[u]for u in z)
 def good(text):
  js=json.loads(text);need(ART not in text and 'r7FaciesAssetId' not in text,'render-only art or author meta leaked into save')
  return js['honroBattle']
 def compare(src,dst):
  a,b=map(good,(src,dst)); watched=['honroWorldTerrain','honroPlayBounds','honroTerrainBounds','honroMap','honroLandmarks','honroElements']
  need(all(a.get(k)==b.get(k)for k in watched),'strict old/new provider, battle design or physics drift on persistent storage')
  return {'source':fact(src.encode()),'saved':fact(dst.encode()),'providerAndPhysicsExact':True,'authorMetaAbsent':True,'sameFullRaw':src==dst}
 def resume(p):
  p.evaluate("()=>{HonroApp.frame=()=>{};}")
  p.locator('[data-action="continue"]').first.click(timeout=15000)
  p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===7&&!!HonroApp.scene",timeout=22000)
  assert_unchanged_signed_model(p,wanted)
 try:
  c,p,n,e=begin(stock_text)
  try:
   need(p.evaluate("()=>HonroApp.profileStore.original().text")==stock_text,'old bytes were not loaded exactly')
   resume(p); second=save_now(p);scope['legacyResave']=compare(stock_text,second)
   need(network(n) and not e,'old actual Stage7 chapter package failed')
  finally:c.close()
  report()
  c,p,n,e=begin()
  try:
   p.evaluate(O['LAUNCH'],7);assert_unchanged_signed_model(p,wanted);fresh=save_now(p)
   scope['freshCreate']=compare(stock_text,fresh)
   need(network(n) and not e,'fresh actual chapter package failed')
  finally:c.close()
  report()
  c,p,n,e=begin(fresh)
  try:
   need(p.evaluate("()=>HonroApp.profileStore.original().text")==fresh,'new save not loaded exactly')
   resume(p);scope['freshColdContinue']={'readExact':fact(fresh.encode()),'realButton':True}
   again=save_now(p);scope['freshResave']=compare(fresh,again)
   need(network(n) and not e,'new saved round-trip package failed')
  finally:c.close()
  scope['status']='PASS_REAL_OLD_AND_FRESH_UI_CONTINUE_RESAVE'
 except Exception as e:
  scope['errors']=[str(e)];print('PACKAGE SAVE',repr(e),flush=True)
 finally:report()
def package_cold_http(br,g,q,report):
 cold=q['packetsCold']={'status':'HOLD','peers':{},'prewarm6':None}
 packet=g['chapterB'][1]; mpath=g['chapterB'][0]; b=URL['B']
 for stage in (1,8,32,42,46,6):
  c=br.new_context(viewport={'width':390,'height':844},device_scale_factor=1,service_workers='block')
  response={}; errors=[]
  try:
   p=new_page(c,response,errors)
   info=p.evaluate('''async stage=>{await HonroCampaignLoader.ensureStage(stage);return{
     stageIsLoaded:HonroCampaignLoader.has(stage),stage7AlreadyLoaded:HonroCampaignLoader.has(7),
     donorInMemory:HONRO_PROJECT.library.some(x=>x.id==='act1-site:7:r7-facies'),screen:HonroApp.screen};}''',stage)
   need(info['stageIsLoaded'] and not info['stage7AlreadyLoaded'] and not info['donorInMemory'] and not errors and not any(b+k in response for k in (packet,mpath)),('unexpected cold scope',stage,info))
   cold['peers'][str(stage)]={'stageLoaded':True,'stage7NewBytesRequested':0,'donorInProjectLibrary':False,'observedHTTPResponses':len(response)}
   if stage==6:
    with p.expect_response(lambda r:r.url==b+packet,timeout=14000) as evt:
     # Start observation first. This queues via the unchanged native idle scheduler, not direct fetch.
     info=p.evaluate("()=>{HonroCampaignLoader.prewarmNext(6);return document.hidden||HonroApp.screen==='battle';}")
     need(not info,'stage6 eligibility not established before legitimate prewarm')
    r=evt.value
    route=g['routes']['B'][packet];need(r.status==200 and fact(r.body())==route,'legitimate prewarm wrong packet')
    unloaded=p.evaluate("()=>!HonroCampaignLoader.has(7)&&!HONRO_PROJECT.library.some(x=>x.id==='act1-site:7:r7-facies')")
    need(unloaded,'legitimate prewarm should not compile or install art')
    cold['prewarm6']={'eligibleStage6To7':True,'fetchedExactStage7Packet':route,'assetNotInstalledByWarm':True}
  except Exception as e:
   cold['errors']=[str(e)];print('PACKAGE COLD',stage,repr(e),flush=True);break
  finally:c.close();report()
 if not cold.get('errors'):cold['status']='PASS_COLD_PEERS_ZERO_STAGE7_NEW_DATA_WITH_STOCK_PREWARM'
 report()

def main(w):
 from playwright.sync_api import sync_playwright
 from PIL import Image
 out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes())
 q={'status':'HOLD','scope':'Actual same-camera stock A (exact 0b9 Git tree) and regular candidate build B, no deploy','views':{}}
 def report():save(w,'BROWSER.json',q)
 stock_save=None;report()
 with sync_playwright()as pw:
  br=pw.chromium.launch(headless=True);q['browser']=br.version;need(br.version=='151.0.7922.34','unexpected Chromium')
  try:
   for d in Q['views']:
    W,H=d['dims']; k=d['key']+'-'+d['name']; arms=q['views'].setdefault(k,{})
    for arm in 'AB':
     rr={};base=URL[arm];route=g['routes'][arm];expect={base+k for k in route}
     v=arms[arm]={'status':'HOLD','errors':[]}
     c=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
     try:
      p=c.new_page()
      p.on('response',lambda r:rr.setdefault(r.url,r) if r.url in expect else None)
      p.on('pageerror',lambda e:v['errors'].append(str(e)))
      p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
      u=base+'HONRO.html';nav=p.goto(u,wait_until='domcontentloaded',timeout=50000)
      need(nav and nav.status==200 and nav.url==u and not nav.from_service_worker,'actual normal navigation')
      p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
      p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
      p.evaluate(O['LAUNCH'],7);p.locator('#battlecanvas').wait_for(state='visible')
      p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
          return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
      ordinary=d['ordinary']
      args={'id':7,'mapId':'stage-7','name':d['name'],'dx':d['dx'],'dy':d['dy'],'ordinary':None if not ordinary else [ordinary[j] for j in ('x','y','scale')],'readback':False,'fixedNow':O['PHASE']}
      meta=p.evaluate(O['FROZEN'],args)['meta']
      try:p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
      except Exception as e:v['errors'].append(repr(e))
      # Always retain both native canvas and actual unmodified DOM first.
      raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
      path=f'{k}-{arm}-RAW.png';(out/path).write_bytes(raw)
      v['raw']={'path':path,'fact':fact(raw)};report()
      path=f'{k}-{arm}-DOM.png';dom=p.screenshot(path=str(out/path),timeout=15000);v['dom']={'path':path,'fact':fact(dom)};report()
      v['startupResource']=p.evaluate("()=>({readyWallMilliseconds:Math.round(performance.now()),orderedTransferred:performance.getEntriesByType('resource').filter(r=>r.name.includes('ordered-')).map(r=>({path:new URL(r.name).pathname,transfer:r.transferSize,body:r.encodedBodySize,ms:Math.round(r.duration)}))})")
      m=p.evaluate(LOCK);v['model']={j:fact(m.pop(j).encode())for j in ('provider','physicalUnregistered')};v['visualOwner']=m
      need(m['id']=='site-body-7' and m['height']==(1466 if arm=='A' else 1570) and m['usesOldFiller']==(arm=='A') and m['materialDifferent']==(arm=='B') and m['exactOldBaseUnwrapped'] and m['activeFacies']==int(arm=='B'),'wrong actual draw owner or enabled scope')
      v['pose']={j:meta[j]for j in ('actual','viewport','backing')};v['physical']=fact(meta['signature'].encode())
      if ordinary:
       need(all(abs(v['pose']['actual'][j]-ordinary[j])<1e-7 for j in ('x','y','scale')),'ordinary not stock reachable requested pose')
      for f,pin in route.items():
       r=rr.get(base+f);need(r and r.status==200 and not r.from_service_worker and fact(r.body())==pin,('wrong required actual loaded bytes',f))
      need(not v['errors'],'actual render/runtime errors')
      v['status']='ACTUAL_CAPTURED'
      if k=='PC-ordinary' and arm=='A':
       stock_save=p.evaluate('''()=>{const a=HonroApp;if(a.debugMode||a.training||a.engine?.b?.mode!=='campaign'||a.engine?.b?.honroStage!==7)throw Error('Stock save is not ordinary campaign');a.showTitle();const s=localStorage.getItem('honro-first-act-profile-1'),p=JSON.parse(s||'null');if(!p||p.honroBattle?.honroStage!==7||a.profileStore.locked)throw Error('Normal stock autosave missing');return s;}''')
       q['stockSave']={'state':'EXACT_STOCK_AUTOSAVE_PRODUCED','encoding':fact(stock_save.encode()),'source':'A 0b9 normal Stage7 campaign via showTitle/stopBattle→persist; isolated testing profile, never user record'}
       report()
     except Exception as e:v['errors'].append(repr(e));print(k,arm,repr(e),flush=True)
     finally:c.close();report()
   # Separate fresh origin/context; seed the real bytes obtained from A then use the normal title button.
   if stock_save is not None:
    cs=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
    q['resume']={'status':'HOLD','errors':[],'contentArchived':False};report()
    try:
     p=cs.new_page();p.on('pageerror',lambda e:q['resume']['errors'].append(str(e)))
     p.add_init_script("localStorage.setItem('honro-first-act-profile-1',"+json.dumps(stock_save,ensure_ascii=True)+");")
     nav=p.goto(URL['B']+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
     need(nav and nav.status==200 and not nav.from_service_worker,'candidate save resume navigation')
     p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroApp?.continue==='function'",timeout=90000)
     original=p.evaluate("()=>HonroApp.profileStore.original().text")
     need(isinstance(original,str) and original==stock_save and not p.evaluate("()=>HonroApp.profileStore.locked"),'stock bytes not correctly read by candidate')
     p.locator('[data-action="continue"]').first.click(timeout=15000)
     p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===7&&!!HonroApp.scene",timeout=22000)
     m=p.evaluate(LOCK)
     need(m['materialDifferent'] and m['height']==1570 and not m['usesOldFiller'],'legacy provider did not route through same visual owner')
     old=q['views']['PC-ordinary']['A']['model'];current={j:fact(m[j].encode())for j in ('provider','physicalUnregistered')}
     need(current==old and not q['resume']['errors'],'resumed model/provider differs')
     q['resume'].update(status='ACTUAL_STOCK_SAVE_RESUMED',provider=current,loaded= fact(original.encode()),notes='Exact synthetic A autosave byte match; stock continue UI, no user save raw archived')
    except Exception as e:q['resume']['errors'].append(repr(e));print('OLD SAVE',repr(e),flush=True)
    finally:cs.close();report()
   stage33_canary(br,out,g,q,report)
   if stock_save is not None:chapter7_save_cases(br,w,g,q,report,stock_save)
   package_cold_http(br,g,q,report)
  finally:br.close()
 try:
  need(q.get('stage33Legacy',{}).get('status')=='ACTUAL_C60_STAGE33_RESTORE_EXACT','actual c60 Stage33 restore not verified; shots remain available')
  need(q.get('packageSave',{}).get('status')=='PASS_REAL_OLD_AND_FRESH_UI_CONTINUE_RESAVE','fresh/resave chapter safety failed')
  need(q.get('packetsCold',{}).get('status')=='PASS_COLD_PEERS_ZERO_STAGE7_NEW_DATA_WITH_STOCK_PREWARM','stage-specific cold/demand/prewarm proof failed')
  need(q.get('resume',{}).get('status')=='ACTUAL_STOCK_SAVE_RESUMED','stock save proof failed; raw ordinary images remain available')
  bounds=Q['signedWindowWorld'];f=[]
  for k,ab in q['views'].items():
   A,B=ab['A'],ab['B'];need(A['status']==B['status']=='ACTUAL_CAPTURED',('pair incomplete',k))
   need(A['physical']==B['physical'] and A['pose']==B['pose'] and A['model']==B['model'],('canonical physics/map/pose/provider drift',k))
   raw=tuple(Image.open(out/s['raw']['path']).convert('RGBA')for s in (A,B));need(raw[0].size==raw[1].size,'backing differs')
   w0,_=raw[0].size;a,b=(z.tobytes()for z in raw);vp=A['pose']['viewport'];s=A['pose']['actual']['scale']
   from math import floor,log2
   rs=min(.68,max(.05,2**(floor(log2(s*1.25)*4)/4)))
   old=Q['oldFooterWorld']; rightmax=Q['sourceNativeRightMax']
   # Independent positive native/source cell coverage of old BODY[16];
   # no RGB tolerance. New R7 source has strictly no right-column tap.
   def taps(v):
    j=floor(v*rs-.5)
    return [(i/rs,(i+1)/rs) for i in (j,j+1) if abs(v*rs-(i+.5))<1]
   def overlap(t,lo,hi):return any(max(x,lo)<min(y,hi) for x,y in t)
   d={'inside':0,'oldFooterOnlyPositiveNativeTaps':0,'outside':0,'outsideMaxDN':0,'alpha':0,'newForestChangedUpperBound':0}
   for i in range(0,len(a),4):
    if a[i:i+4]==b[i:i+4]:continue
    x=vp['left']+(i//4%w0+.5)/s;y=vp['top']+(i//4//w0+.5)/s
    d['alpha']+=a[i+3]!=b[i+3]
    inside=bounds[0]<=x<bounds[2] and bounds[1]<=y<bounds[3]
    oldOnly=(x>=bounds[2] and overlap(taps(x),old[0],old[2]) and overlap(taps(y),old[1],old[3]) and
     all(lo>=rightmax for lo,hi in taps(x)))
    d['inside' if inside else 'oldFooterOnlyPositiveNativeTaps' if oldOnly else 'outside']+=1
    if not inside and not oldOnly:d['outsideMaxDN']=max(d['outsideMaxDN'],*(abs(a[i+j]-b[i+j])for j in range(3)))
    if inside and (x<16*3.13 or y>1448*3.13):d['newForestChangedUpperBound']+=1
   ab['delta']=d
   ab['priorNativeR7BExact']=B['pose']==P['priorObservedVision'][k]['pose'] and B['raw']['fact']==P['priorObservedVision'][k]['raw']
   report()
   # Actual edge and coverage review is distinct from these strict reproducible invariants.
   if not((d['inside']>0 or k.endswith('-east')) and d['outside']==d['alpha']==0):f.append((k,d))
   if not ab['priorNativeR7BExact']:f.append((k,'prior actually approved R7 native image changed'))
   if k=='PC-southwest' and d['newForestChangedUpperBound']>Q['maxPCSWNewForestPixels']:f.append((k,'new forest bound',d))
  need(not f,('scoped strict A/B failed, screenshot photos retained',f))
  q['status']='PASS_ACTUAL_STAGE07_R7_CHAPTER_CONTAINED_PENDING_ROOT'
 finally:report()
if __name__=='__main__':main(Path(sys.argv[1]))
