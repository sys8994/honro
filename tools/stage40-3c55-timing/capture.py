"""Matched release timing only; does not repeat the verified public screenshots or saved profiles."""
from pathlib import Path
from contextlib import ExitStack
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import json,os,statistics,sys,threading
from playwright.sync_api import sync_playwright
from guard import P,need,fact,save
SEED="(()=>{\n const reset=()=>{let n=3910;Math.random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);};\n Object.defineProperty(window,'__honroResetDiagnosticSeed',{value:reset,enumerable:false});\n reset();Date.now=()=>1794931200000;\n})()"
TIMING=r"""()=>{
 const a=HonroApp,L=HonroCampaignLoader,proto=HonroScene.prototype,P=HonroAct4TerrainPreview;
 if(a.screen!=='title'||a.engine||a.profile.honroBattle||L.has(40))throw Error('not cold native title');
 for(let n=1;n<40;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(40).entryLevel);
 a.audio?.configure?.(a.profile.settings);
 const rec={snapshots:[],profileWrites:[],ensures:[],entry:[],first:null,followingRAF:null};
 const nativePersist=a.persist, cleanup=[],owner=new WeakMap();let inOpening=false;
 const phase=()=>inOpening?'opening-story':rec.entry.length?'after-opening':'launch-before-entry';
 function tap(o,k,f){
   const original=o[k],d=Object.getOwnPropertyDescriptor(o,k);
   if(typeof original!=='function')throw Error('missing native boundary '+k);
   const w=function(...args){return f(original,this,args);};
   o[k]=w;if(o[k]!==w)throw Error('cannot observe '+k);
   cleanup.push(()=>{if(o[k]!==w)throw Error('observer replaced '+k);if(d)Object.defineProperty(o,k,d);else delete o[k];});
 }
 function sync(rows,args,fn,t,fields={}) {
   const row={...fields,start:performance.now()};
   try{const result=Reflect.apply(fn,t,args);if(typeof result==='boolean')row.returned=result;return result;}
   finally{row.end=performance.now();rows.push(row);}
 }
 tap(P,'snapshot',(fn,t,args)=>{
   const row={phase:phase(),compactArt:args[1]?.compactArt===true,snapshotID:rec.snapshots.length,
      ownApp:args[0]===a,mountedBattleStage:a.engine?.b?.honroStage??null,start:performance.now()};
   rec.snapshots.push(row);
   try {
     const value=Reflect.apply(fn,t,args);
     row.end=performance.now();
     row.returnedCanonical=value?.honroStage===40&&value.honroCanonical===true&&value.honroCustom===false&&value.honroAct4Official===1&&value.mode==='campaign';
     if(value&&typeof value==='object') {
       row.reusedObject=owner.has(value);
       if(!row.reusedObject)owner.set(value,row.snapshotID);
     }
     return value;
   }catch(e){row.end=performance.now();row.threw=true;throw e;}
 });
 tap(a.profileStore,'save',(fn,t,args)=>{
   const profile=args[0],value=profile?.honroBattle;
   return sync(rec.profileWrites,args,fn,t,{
     phase:phase(),snapshotOwnerID:value&&typeof value==='object'?owner.get(value)??null:null,
     passedOwnProfile:profile===a.profile,storedBattlePresent:value!=null,
     storedBattleStage:value?.honroStage??null,mountedBattleStage:a.engine?.b?.honroStage??null
   });
 });
 tap(HonroRestJourney,'startEntry',(fn,t,args)=>{
   const mark={start:performance.now()};rec.entry.push(mark);inOpening=true;
   try{return Reflect.apply(fn,t,args);}finally{inOpening=false;mark.end=performance.now();}
 });
 tap(L,'ensureStage',(fn,t,args)=>{
   if(args[0]!==40)return Reflect.apply(fn,t,args);
   const row={start:performance.now(),before:t.has(40)};rec.ensures.push(row);
   const v=Reflect.apply(fn,t,args);Promise.resolve(v).then(()=>{row.end=performance.now();},()=>{row.failed=true;});return v;
 });
 tap(proto,'render',(fn,t,args)=>{
   const b=args[0]?.b;
   if(rec.first||b?.honroStage!==40||t.canvas?.id!=='battlecanvas')return Reflect.apply(fn,t,args);
   const start=performance.now(),v=Reflect.apply(fn,t,args),end=performance.now();
   rec.first={start,end,round:b.round,phase:b.phase,mode:b.mode,
      canonical:b.honroCanonical===true&&b.honroCustom===false&&b.honroAct4Official===1,
      canvas:[t.canvas.width,t.canvas.height],camera:[t.x,t.y,t.scale]};
   requestAnimationFrame(()=>{rec.followingRAF=performance.now();for(const f of cleanup.reverse())f();rec.restored=a.persist===nativePersist;});
   return v;
 });
 if(a.persist!==nativePersist)throw Error('native persist identity changed');
 Object.defineProperty(window,'__stage40ExactCold',{value:rec});
 rec.launch=performance.now();a.launch(40);rec.launchCallReturn=performance.now();
}"""
def phase_windows(t,error_count):
 # Only shared observations already present in sealed R4. No identity claim or timings accepted here.
 f=t['first'];en=t['ensures'];sn=t['snapshots'];opens=t['entry']
 need(t['restored']and f['canonical']and f['mode']=='campaign'and f['round']==1 and error_count==0 and all(x>0 for x in f['canvas']),'wrong native frame or unstable instrumentation')
 need(len(en)==1 and en[0]['before']is False and not en[0].get('failed')and len(opens)==1,'expected one cold ensure and one native opening-story invocation')
 begin=opens[0];ens=end=en[0]['end']
 need(t['launch']<=en[0]['start']<=ens<=begin['start']<=begin['end']<=f['start']<=f['end']<=t['followingRAF'],'native ensure/opening/renderer order')
 # No requirement on whether a separate store call uses the same profile JS object.
 lead=[];battle=[]
 for q in t['profileWrites']:
  need(q['returned'] is True and end<=q['start']<=q['end']<=f['start'],'native store error or unordered record')
  end=q['end']
  if not q['storedBattlePresent']:
   need(not battle and bool(sn) and q['mountedBattleStage']is None and q['phase']=='launch-before-entry' and q['end']<=sn[0]['start'],'payload-free write outside pre-engine region')
   lead.append(q)
  else:
   need(q['mountedBattleStage']==40 and q['passedOwnProfile'] is True,'battle write outside own Stage40 profile')
   battle.append(q)
 return f,ens,begin,lead,battle

def prove(sample,arm,error_count):
 t=sample['raw'];sn=t['snapshots']
 f,ens,begin,lead,battle=phase_windows(t,error_count)
 need([x['snapshotID']for x in sn]==list(range(len(sn))),'snapshot identities invalid')
 need(all(x['ownApp']is True and x['mountedBattleStage']==40 and x['returnedCanonical']is True and x['reusedObject']is False and not x.get('threw')for x in sn),'snapshot not owned by a real freshly cloned Stage40 battle')
 need(all(x['snapshotOwnerID'] is None for x in lead),'pre-engine write references a battle snapshot')
 groups={k:[]for k in range(len(sn))}
 for q in battle:
  i=q['snapshotOwnerID'];need(type(i)is int and i in groups and q['storedBattleStage']==40,'battle store did not receive exact returned native snapshot object')
  a=sn[i]
  need(a['phase']==q['phase']and a['end']<=q['start'],'snapshot object crossed phase or invalid event order')
  groups[i].append(q)
 # Measured intervals cannot absorb an intervening snapshot or another phased call.
 for i,a in enumerate(sn):
  end=sn[i+1]['start'] if i+1<len(sn) else f['start']
  need(ens<=a['start']<=a['end']<=end and all(q['end']<=end for q in groups[i]),'overlapping snapshot measurement windows')
 pre=[x for x in sn if x['phase']=='launch-before-entry']
 opening=[x for x in sn if x['phase']=='opening-story']
 late=[x for x in sn if x['phase']=='after-opening']
 need(len(pre)==2 and all(x['compactArt']==(arm=='B')for x in pre),'two changed launch snapshots not observed with exact compact flags')
 need(bool(opening) and all(x['compactArt']for x in opening),'opening-story compact snapshots not independently observed')
 for rows,low,high in [(pre,ens,begin['start']),(opening,begin['start'],begin['end']),(late,begin['end'],f['start'])]:
  for a in rows:
   g=groups[a['snapshotID']]
   need(low<=a['start']<=a['end']<=high and all(q['end']<=high for q in g),'snapshot window crossed source phase')
   if rows is pre or rows is opening:need(bool(g),'changed or opening snapshot lacks a successful bound store call')
 need(len(pre)+len(opening)+len(late)==len(sn),'unclassified native snapshot phase')
 sample['counts']={'profileOnlyBeforeEngine':len(lead),'preEntryStoresPerSnapshot':[len(groups[x['snapshotID']])for x in pre],
  'openingStoresPerSnapshot':[len(groups[x['snapshotID']])for x in opening],'afterOpeningStoresPerSnapshot':[len(groups[x['snapshotID']])for x in late]}
 sample['profileOnlyBeforeEngineWrites']=[{'usesOwnProfileObject':q['passedOwnProfile'],'ms':q['end']-q['start']}for q in lead]
 data={'ensureWall':ens-t['ensures'][0]['start'],'openingStoryWall':begin['end']-begin['start'],
       'preEngineProfileOnlySaveWall':sum(q['end']-q['start']for q in lead),
       'launchToFirstRenderEnd':f['end']-t['launch'],'firstRenderSync':f['end']-f['start'],
       'launchToNextRAF':t['followingRAF']-t['launch']}
 def wall(a):
  g=groups[a['snapshotID']];return g[-1]['end']-a['start']
 for i,a in enumerate(pre,1):
  g=groups[a['snapshotID']]
  data['snapshot'+str(i)]=a['end']-a['start']
  data['profileSave'+str(i)]=sum(q['end']-q['start']for q in g)
  data['snapshotThroughSave'+str(i)]=wall(a)
 data['twoEarlySaveWindows']=sum(map(wall,pre));data['openingStorySaveWindows']=sum(map(wall,opening))
 return data

def main(w):
 need(not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'credential in timing observer')
 out=w/'out';signed=json.loads((w/'SIGNED.json').read_bytes())
 result={'status':'HOLD','separatePublicReadback':P['sealedPublicReadback'],'originalTimingR2':P['sealedTimingR2'],'originalTimingR4':P['sealedTimingR4'],'samples':[],'pairs':[],
         'scope':'Same runner, exact detached A/B over loopback, 3 rotated pairs/device; each sample starts with a new profile/browser context and original intro. Source-boundary observer overhead included. No GPU, network transfer or full process CPU measurement.'}
 def flush():save(out/'TIMING-PHASES.json',result)
 flush()
 with ExitStack()as es,sync_playwright()as pw:
  ports={'A':18964,'B':18965}
  for k,port in ports.items():
   h=partial(SimpleHTTPRequestHandler,directory=str(w/k))
   srv=es.enter_context(ThreadingHTTPServer(('127.0.0.1',port),h));srv.daemon_threads=True
   threading.Thread(target=srv.serve_forever,daemon=True).start();es.callback(srv.shutdown)
  url={k:f'http://127.0.0.1:{port}/'for k,port in ports.items()}
  browser=pw.chromium.launch(headless=True);es.callback(browser.close)
  result['browser']=browser.version;need(browser.version=='151.0.7922.34','browser version drift')
  devices={'PC':(1440,900),'M':(390,844)}
  for d,wh in devices.items():
   for i in range(3):
    rows=[]
    for arm in 'AB' if i%2==(0 if d=='PC'else 1) else 'BA':
     row={'device':d,'pair':i+1,'arm':arm,'viewport':[wh[0],wh[1],1]};rows.append(row);result['samples'].append(row);flush()
     c=browser.new_context(viewport={'width':wh[0],'height':wh[1]},device_scale_factor=1,service_workers='block')
     try:
      need(c.storage_state()=={'cookies':[],'origins':[]},'nonempty profile')
      c.add_init_script(SEED);p=c.new_page();res={};errors=[]
      p.on('response',lambda x:res.setdefault(x.url,x));p.on('pageerror',lambda e:errors.append(type(e).__name__))
      address=url[arm]+'HONRO.html'; nav=p.goto(address,wait_until='domcontentloaded',timeout=50000)
      need(nav and nav.status==200 and nav.url==address and not nav.from_service_worker,'wrong normal detached shell')
      p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
      p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;}")
      wait_error=None
      try:
       p.evaluate(TIMING)
       p.wait_for_function("()=>window.__stage40ExactCold?.restored===true&&Boolean(window.__stage40ExactCold?.ensures[0]?.end)",timeout=60000)
      except Exception as e:wait_error=e
      row['raw']=p.evaluate("()=>window.__stage40ExactCold??null");row['pageErrorCount']=len(errors);flush()
      if wait_error:raise wait_error
      # Do not pull any response bytes, durations or storage outside native window until the raw sample is sealed.
      signed_arm=signed[arm];need(fact(nav.body())==signed_arm['shell'],'detached shell mismatch')
      for path,f in signed_arm['routes'].items():
       response=res.get(url[arm]+path)
       need(response and response.status==200 and not response.from_service_worker and fact(response.body())==f,'wrong detached route '+path)
      row['actualSignedRoutes']=sorted(signed_arm['routes'])
      row['ms']=prove(row,arm,len(errors));flush()
     except Exception as e:
      row['failure']={'type':type(e).__name__,'stage':str(e).splitlines()[0][:220]};flush()
     finally:c.close()
    pair={'device':d,'pair':i+1,'qualified':False};result['pairs'].append(pair)
    if any('ms'not in row or 'failure'in row for row in rows):
     pair['reason']='both arms attempted; at least one unqualified';flush();continue
    A,B=sorted(rows,key=lambda q:q['arm']);fa=A['raw']['first'];fb=B['raw']['first']
    if A['counts']!=B['counts'] or not all(fa[k]==fb[k]for k in ('canonical','mode','round','phase','canvas')):
     pair['reason']='launch phase/activity counts or state differ';flush();continue
    pair['firstCameraA']=fa['camera'];pair['firstCameraB']=fb['camera']
    pair['fixedFirstCameraComparable']=all(abs(x-y)<=(.05 if j<2 else 1e-5)for j,(x,y)in enumerate(zip(fa['camera'],fb['camera'])))
    pair['firstSceneComparableFieldsExact']=True
    pair['qualified']=True
    pair['pairedTwoEarlySaveWallDeltaBminusA']=B['ms']['twoEarlySaveWindows']-A['ms']['twoEarlySaveWindows'];flush()
 need(len(result['pairs'])==6 and len(result['samples'])==12,'missing balanced repetitions')
 need(all(x['qualified']for x in result['pairs']),'unqualified pair(s); all six attempted, no aggregate benchmark emitted')
 stats={}
 for d in devices:
  comparable=all(v['fixedFirstCameraComparable']for v in result['pairs']if v['device']==d)
  label={'firstFramePoseMatches':comparable,'timingMsMedianMinMax':{}};stats[d]=label
  exclude=() if comparable else ('launchToFirstRenderEnd','firstRenderSync','launchToNextRAF')
  for arm in ('A','B'):
   rows=[r['ms']for r in result['samples']if r['device']==d and r['arm']==arm]
   label['timingMsMedianMinMax'][arm]={key:[statistics.median(x[key]for x in rows),min(x[key]for x in rows),max(x[key]for x in rows)]for key in rows[0]if key not in exclude}
  if not comparable:label['firstFramePolicy']='First frames were valid native draws but camera not tight enough; do not summarize or compare frame-related metrics.'
 result['metrics']=stats;result['status']='PASS_SOURCE_BOUND_PHASE_PAIRED_PC_M_NO_SPEED_THRESHOLD';flush()
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
