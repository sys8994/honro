"""Disabled benchmark passenger. Uses ordinary app/draw, no user storage or network writes."""
import hashlib,json,math,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from guard import P,need,fact,save
W=Path(sys.argv[1]); out=W/'out'; K=P['benchmark']
obs=json.loads(Path(__file__).with_name('observer.json').read_bytes())
graph=json.loads((out/'GRAPH.json').read_bytes())
visual=json.loads((out/'BROWSER.json').read_bytes())
hosts={'B':'http://127.0.0.1:18962/','E':'http://127.0.0.1:18963/'}
H=lambda text:hashlib.sha256(text.encode()).hexdigest()
report={'status':'HOLD','visualGate':'PENDING','rawPairs':[],'summary':{},'errors':[],'viewportObservations':[],
        'phaseMeaning':'Launch return is synchronous and inclusive (world/engine/UI/save) when admitted; this does not attribute within that call. ensureStage inclusive is not pure CPU/network. Story/menu work occurs after the separate launch clock. No additional awaits in stock launch.',
        'scope':'headless native app on one runner; B/E exact routes with fresh contexts and HTTP cache disabled. Not user-device, production transfer, real gameplay or native GPU timings.'}
def record():save(out/'PERFORMANCE.json',report)
def archived_gate():
 need(set(graph)==set('ABE') and visual['status']=='NATIVE_DIAGNOSTIC_EVIDENCE_READY_FOR_ART_REVIEW','exact A/B/E capture required')
 checked={}
 for shot,pins in K['r2Frames'].items():
  rows=visual['pictures'][shot]; authority=visual['actualOwner'][shot]
  need(set(pins)==set('ABE'),'wrong archived arms')
  for arm,q in pins.items():
   need(all(rows[arm][k]==q[k] for k in ('raw','mask','pose')),'archived native PNG/pose drift '+shot+'/'+arm)
   need(authority[arm]['provider']==q['owner'] and authority[arm]['world']==q['world'],'archived provider/physics drift '+shot+'/'+arm)
  comp=rows['comparisons']
  joins=[comp['seamWorldX'],*map(int,comp['secondaryJoins'])]
  need(joins==K['fourJoins'][shot],'wrong four registered joints')
  checked[shot]=joins
 report['visualGate']={'result':'EXACT_R2_ALL_9_NATIVE_FRAMES_AND_FOUR_JOINTS','receipt':K['officialR2Receipts'],'checked':checked}
MARK_ORDER=('helperEnter','ensureEnter','ensureResolved','progressionReady','appLaunchEnter','appLaunchReturn','dialogueFinished','helperCleanupDone','helperExit')
def instrument_launch(src):
 need(H(src)==K['launchHelperSHA256'],'stock launch helper changed')
 # Replace only exact stock expressions with observation stamps. Production
 # loader, launch, story and scene functions are called as before (no wrapping).
 changes=(
  ('async id=>{','async (id,tap)=>{\n tap.mark("helperEnter");'),
  (' await HonroCampaignLoader.ensureStage(id);',' tap.mark("ensureEnter");\n await HonroCampaignLoader.ensureStage(id);\n tap.mark("ensureResolved");'),
  (' a.launch(id);',' tap.mark("progressionReady");\n tap.mark("appLaunchEnter");\n const launchResult=a.launch(id);\n tap.mark("appLaunchReturn");\n tap.returnObserved(launchResult,a.engine?.b?.honroStage===id);'),
  (' if(a.dialogue)throw Error(\'Entry dialogue remains\');',' if(a.dialogue)throw Error(\'Entry dialogue remains\');\n tap.mark("dialogueFinished");'),
  (' a.close();HonroStoryFraming.clear(a.scene);',' a.close();HonroStoryFraming.clear(a.scene);\n tap.mark("helperCleanupDone");'))
 for a,b in changes:
  need(src.count(a)==1,'stock helper marker ambiguous: '+a)
  src=src.replace(a,b,1)
 return src
def phases(v):
 m=v['launchMarks'];check=v['appLaunchResult']
 need(tuple(m)==MARK_ORDER and all(math.isfinite(x) for x in m.values()),'missing original launch phase marks')
 need(all(x<=y for x,y in zip(m.values(),list(m.values())[1:])) and v['begin']<=m['helperEnter'] and m['helperExit']==v['launched']<=v['decoded']<=v['draw0']<=v['draw1']<=v['ready'],'invalid monotonic startup marks')
 need(check['mountedStageAtSynchronousReturn'] is True and check['returnedThenable'] is False,'launch was not stock synchronous mounted return; do not classify inclusive app time')
 return {
  'firstRequestToEnsureResolvedMs':m['ensureResolved']-v['firstActualStage46RequestStart'],
  'ensureStageInclusiveMs':m['ensureResolved']-m['ensureEnter'],
  'lastTimedStageResponseToEnsureResolvedMs':m['ensureResolved']-v['routeLastResponseEnd'],
  'progressionPreparationMs':m['progressionReady']-m['ensureResolved'],
  'appLaunchSynchronousInclusiveMs':m['appLaunchReturn']-m['appLaunchEnter'],
  'postLaunchDialogueMs':m['dialogueFinished']-m['appLaunchReturn'],
  'postLaunchMenuAndFramingMs':m['helperCleanupDone']-m['dialogueFinished'],
  'postLaunchEverythingToHelperExitMs':m['helperExit']-m['appLaunchReturn'],
  'wholeLaunchHelperMs':m['helperExit']-m['helperEnter'],
  'imageDecodeAfterHelperMs':v['decoded']-m['helperExit'],
  'registeredDrawCpuSubmitMs':v['draw1']-v['draw0'],
  'firstRequestToReadyMs':v['firstToReadyMs'],
 }
COLD=r"""async q=>{
 const now=()=>window.performance.now();
 const begin=now(); const launch=eval('('+q.launch+')'), decode=eval('('+q.decode+')');
 const launchMarks={};let appLaunchResult=null;
 const tap={
  mark(k){if(Object.hasOwn(launchMarks,k))throw Error('duplicate timing mark');launchMarks[k]=now();},
  returnObserved(x,mounted){appLaunchResult={type:typeof x,returnedThenable:x!==null&&x!==undefined&&typeof x.then==='function',mountedStageAtSynchronousReturn:mounted};}
 };
 // The stock helper invokes a.launch synchronously and expects the battle
 // immediately. Never await its return: an unexpected thenable is a HOLD.
 try{await launch(46,tap);}catch(e){return {admitted:false,viewportAudit:null,error:'stock helper failed: '+String(e),launchMarks,appLaunchResult};}
 const launched=now(); launchMarks.helperExit=launched;
 const images=await decode(); if(images.failed.length)throw Error('image decode failed');
 const decoded=now();
 const a=window.HonroApp,s=a.scene,e=a.engine,b=e.b;
 if(b.honroStage!==46||b.honroMapOrigin!=='campaign'||b.honroCustom!==false||!b.honroCanonical||a.dialogue||b.phase!=='aim'||b.round!==1)throw Error('not normal ready Stage46');
 const kind=q.pose.actual;
 const geometry=()=>{
  const r=s.canvas.getBoundingClientRect();
  const css={w:r.width,h:r.height}, backing=[s.canvas.width,s.canvas.height], pose={x:s.x,y:s.y,scale:s.scale};
  return {css,backing,pose,viewport:HonroBounds.viewport(s,r.width,r.height),devicePixelRatio:window.devicePixelRatio,
          numericTypes:{css:[typeof css.w,typeof css.h],backing:backing.map(v=>typeof v)},castBackingIntegers:backing.every(Number.isInteger)};
 };
 const expected={css:q.pose.css,backing:q.pose.backing,pose:kind,viewport:q.pose.viewport,devicePixelRatio:q.dpr};
 const audit={expected,beforeNativeDraw:geometry(),afterNativeDraw:null,afterPresentOpportunity:null,
              rule:'exact viewport admission after first real scene.render and next animation frame; initial geometry informational'};
 const isExact=g=>g.backing.every((v,i)=>v===expected.backing[i])&&g.castBackingIntegers&&
   Object.keys(expected.css).every(k=>g.css[k]===expected.css[k])&&
   Object.keys(expected.pose).every(k=>g.pose[k]===expected.pose[k])&&
   Object.keys(expected.viewport).every(k=>g.viewport[k]===expected.viewport[k])&&g.devicePixelRatio===expected.devicePixelRatio;
 function view(x){Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x,y:kind.y,scale:kind.scale});HonroBounds.constrain(s,b);
 if(Math.abs(x-s.x)>1e-6||Math.abs(kind.y-s.y)>1e-6||Math.abs(kind.scale-s.scale)>1e-6)throw Error('camera waypoint clamped');}
 const frame=()=>new Promise(requestAnimationFrame);
 let draw0,draw1,readyRaf,ready;
 try{
  view(kind.x);
  await frame(); draw0=now();s.render(e,0,'',.6,false,0); draw1=now();
  audit.afterNativeDraw=geometry();
  readyRaf=await frame();ready=now(); audit.afterPresentOpportunity=geometry();
 }catch(e){return{admitted:false,viewportAudit:audit,error:'native readiness failed: '+String(e)};}
 if(!isExact(audit.afterNativeDraw)||!isExact(audit.afterPresentOpportunity))
  return{admitted:false,viewportAudit:audit,error:'post-render viewport exact mismatch'};
 if(readyRaf<draw0)return{admitted:false,viewportAudit:audit,error:'invalid ready callback'};
 const world={};for(const k of ['width','height','terrain','units','phase','round','active','honroObjectives','honroGoalState','honroEncounterState','honroMapOrigin'])world[k]=b[k];
 const provider=HONRO_PROJECT.library.filter(x=>x.id==='act5:near:46');
 if(provider.length!==1)throw Error('missing authoritative Stage46 provider');
 const raw=JSON.stringify(provider[0]);let fn=2166136261;
 for(let i=0;i<raw.length;i++)fn=Math.imul(fn^raw.charCodeAt(i),16777619);
 const names=new Set(q.routes);
 const hits=performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin===location.origin&&names.has(new URL(r.name).pathname.slice(1)))
  .map(p=>({path:new URL(p.name).pathname.slice(1),start:p.startTime,requestStart:p.requestStart,responseStart:p.responseStart,responseEnd:p.responseEnd,threadDuration:p.duration,encodedBodyBytes:p.encodedBodySize,decodedBodyBytes:p.decodedBodySize,transferBytes:p.transferSize}));
 const first=hits.filter(v=>q.stageStarts.includes(v.path)).reduce((min,v)=>Math.min(min,v.requestStart),Infinity);
 if(!Number.isFinite(first)||first<=0||ready<=first||hits.some(v=>v.requestStart<=0||v.responseEnd>ready))return{admitted:false,viewportAudit:audit,error:'missing actual route timings'};
 return{admitted:true,viewportAudit:audit,begin,launched,launchMarks,appLaunchResult,decoded,draw0,draw1,readyRaf,ready,firstActualStage46RequestStart:first,firstToReadyMs:ready-first,
        routeLastResponseEnd:Math.max(...hits.map(v=>v.responseEnd)),imageCount:images.registered,world:JSON.stringify(world),provider:raw.length+':'+(fn>>>0).toString(16),resources:hits};
}"""
WARM=r"""async q=>{
 const a=window.HonroApp,s=a.scene,e=a.engine,b=e.b;
 const sig=()=>{let v={};for(const k of ['width','height','terrain','units','phase','round','active','honroObjectives','honroGoalState','honroEncounterState','honroMapOrigin'])v[k]=b[k];return JSON.stringify(v);};
 const before=sig();const y=q.pose.actual.y,z=q.pose.actual.scale;
 const stats=()=>typeof s.renderCacheStats==='function'?s.renderCacheStats():null;
 const tick=()=>new Promise(requestAnimationFrame);
 const probe=async x=>{
  const raf=await tick();const t0=performance.now();s.x=x;s.y=y;s.scale=z;HonroBounds.constrain(s,b);
  if(Math.abs(s.x-x)>1e-6||Math.abs(s.y-y)>1e-6||Math.abs(s.scale-z)>1e-6)throw Error('illegal benchmark camera x'+x);
  s.render(e,0,'',.6,false,0); const t1=performance.now();
  return {x:s.x,y:s.y,scale:s.scale,raf,handOffStart:t0,handOffEnd:t1,cpuSubmitMs:t1-t0};
 };
 let last;
 for(let k=0;k<q.warmups;k++)last=await probe(q.x[0]);
 const initialCache=stats(),out=[];
 for(let i=0;i<5;i++){
  const part=[];
  for(let n=1;n<=q.frames;n++){
   const u=await probe(q.x[i]+(q.x[i+1]-q.x[i])*n/q.frames);
   u.intervalMs=u.raf-last.raf;last=u;part.push(u);
  }
  out.push(part);
 }
 if(sig()!==before)throw Error('native pan mutated actor/physics');
 return {pans:out,cacheBefore:initialCache,cacheAfter:stats(),world:before};
}"""
def pct(arr,p):
 s=sorted(arr);return s[max(0,math.ceil(p*len(s))-1)]
def sample(browser,dev,arm,order,pair):
 expected=graph[arm]['files']; pack=P['packs'][arm];host=hosts[arm]
 cfg=K['r2Frames']['PC-deep' if dev=='PC' else 'Mobile-SE'][arm]
 c=browser.new_context(**P['devices'][dev],service_workers='block')
 try:
  page=c.new_page();hits={};err=[]
  c.add_init_script('('+obs['INIT']+')();'+obs['INIT_SEED'])
  c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(host) and r.request.method in ('GET','HEAD') else r.abort())
  sess=c.new_cdp_session(page);sess.send('Network.enable');sess.send('Network.setCacheDisabled',{'cacheDisabled':True})
  page.add_init_script("performance.setResourceTimingBufferSize(4096)")
  who={host+k:k for k in expected if k not in ('web/manifest.json','HONRO.html')}
  page.on('response',lambda r:hits.setdefault(who[r.url],r) if r.url in who else None)
  page.on('pageerror',lambda x:err.append(str(x)))
  home=page.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&window.HonroApp?.screen==='title'&&typeof window.HonroCampaignLoader?.ensureStage==='function'",timeout=65000)
  routes=[P['map'],pack['descriptor'],*graph[arm]['parts']]
  v=page.evaluate(COLD,{'routes':routes,'stageStarts':routes[:2],'pose':cfg['pose'],'dpr':P['devices'][dev]['device_scale_factor'],'launch':instrument_launch(obs['LAUNCH']),'decode':obs['DECODE']})
  report['viewportObservations'].append({'device':dev,'arm':arm,'pair':pair,'sequence':order,'accepted':v['admitted'],'geometry':v['viewportAudit'],'error':v.get('error'),'launchMarks':v.get('launchMarks'),'launchReturn':v.get('appLaunchResult')})
  record()
  need(v['admitted'],v.get('error','cold performance viewport/readiness HOLD'))
  v.pop('viewportAudit');v.pop('admitted');v['phaseAttribution']=phases(v)
  warm=page.evaluate(WARM,{'pose':cfg['pose'],'x':K['pansX'][dev],'frames':K['framesPerPan'],'warmups':K['warmupFrames']})
  need(v['provider']==cfg['owner'] and H(v.pop('world'))==H(warm.pop('world'))==cfg['world'],'provider/physical baseline differs')
  need(home.url==host+'HONRO.html' and home.status==200 and not home.from_service_worker and fact(home.body())==expected['HONRO.html'],'actual shell differs')
  need(set(hits)==set(who.values()) and not err,'actual request or error record differs '+repr(err))
  for k,r in hits.items():need(r.status==200 and not r.from_service_worker and fact(r.body())==expected[k],'received transport hash differs '+k)
  res_digest={u['path']:u for u in v['resources']}
  need(set(res_digest)==set(routes) and len(v['resources'])==len(routes),'missing or duplicate timed Stage46 requests')
  need(all(res_digest[k]['encodedBodyBytes']==res_digest[k]['decodedBodyBytes']==expected[k]['bytes'] and res_digest[k]['transferBytes']>=expected[k]['bytes'] for k in routes),'no-cache network body/transfer accounting disagrees')
  frames=[v for p in warm['pans'] for v in p]
  need(len(warm['pans'])==5 and len(frames)==5*K['framesPerPan'] and all(len(p)==K['framesPerPan'] for p in warm['pans']),'incorrect pan length')
  need(all(math.isfinite(f['intervalMs']) and f['intervalMs']>0 and math.isfinite(f['cpuSubmitMs']) and f['cpuSubmitMs']>=0 for f in frames),'invalid native pan sample')
  return {'device':dev,'arm':arm,'sequence':order,'pair':pair,'cold':v,'warm':warm,'rawStagePacketBytes':graph[arm]['aggregate']['bytes'],
           'loopbackEncodedChunkBodyBytes':sum(res_digest[k]['encodedBodyBytes'] for k in graph[arm]['parts']),
           'loopbackTransferAllTimedRoutesBytes':sum(u['transferBytes'] for u in v['resources']),
           'frameP95Ms':pct([a['intervalMs']for a in frames],.95),'nativeCpuSubmitP95Ms':pct([a['cpuSubmitMs']for a in frames],.95)}
 finally:c.close()
def run(browser):
 for dev in ('PC','Mobile'):
  for pair in range(K['pairsPerDevice']):
   order=('BE','EB','BE')[pair] if dev=='PC' else ('EB','BE','EB')[pair]
   for arm in order:
    try:report['rawPairs'].append(sample(browser,dev,arm,order,pair+1));record()
    except Exception as e:report['errors'].append({'device':dev,'pair':pair+1,'arm':arm,'error':repr(e)});record()
 for dev in ('PC','Mobile'):
  rows=[x for x in report['rawPairs'] if x['device']==dev]
  if len(rows)!=6:continue
  reductions=[]
  for i in (1,2,3):
   p={x['arm']:x for x in rows if x['pair']==i};need(set(p)==set('BE'),'incomplete paired device samples')
   reductions.append({'pair':i,'order':p['B']['sequence'],'EminusBColdMs':p['E']['cold']['firstToReadyMs']-p['B']['cold']['firstToReadyMs'],'EminusBRafP95Ms':p['E']['frameP95Ms']-p['B']['frameP95Ms'],'EminusBCpuSubmitP95Ms':p['E']['nativeCpuSubmitP95Ms']-p['B']['nativeCpuSubmitP95Ms']})
  for x in reductions:
   pair={z['arm']:z['cold']['phaseAttribution'] for z in rows if z['pair']==x['pair']}
   x['EminusBColdPhaseMs']={k:pair['E'][k]-pair['B'][k] for k in pair['B']}
  fields=reductions[0]['EminusBColdPhaseMs']
  report['summary'][dev]={'withinPairDifferences':reductions,'arms':{},
    'pairedMediansEminusBByPhaseMs':{k:sorted(x['EminusBColdPhaseMs'][k] for x in reductions)[1] for k in fields}}
  for arm in 'BE':
   r=[x for x in rows if x['arm']==arm]; cold=[x['cold']['firstToReadyMs'] for x in r]; warm=[f for x in r for p in x['warm']['pans'] for f in p]
   report['summary'][dev]['arms'][arm]={'coldRawMs':cold,'coldMedianMs':sorted(cold)[1],'coldMaxOf3Ms':max(cold),'pooledWarmIntervalP95Ms':pct([v['intervalMs'] for v in warm],.95),'pooledWarmNativeCpuSubmitP95Ms':pct([v['cpuSubmitMs'] for v in warm],.95),'freshSampleCount':len(r),'frameCount':len(warm),'registeredScale':r[0]['warm']['pans'][0][0]['scale'],'rawStagePacketBytes':r[0]['rawStagePacketBytes']}
record()
try:
 archived_gate();record()
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True)
  try:need(b.version==P['chromium'],'wrong real browser');run(b)
  finally:b.close()
 if not report['errors'] and len(report['rawPairs'])==12 and len(report['summary'])==2:report['status']='EXACT_SCOPE_COLD_PHASE_ATTRIBUTION_AVAILABLE_NO_RELEASE'
 need(report['status']!='HOLD','some paired performance observations failed; see raw')
finally:record()
