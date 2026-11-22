"""Real H/733 and normal B saves, actual cold continuation on A/pinned-current and B, two devices."""
from pathlib import Path
import base64, hashlib, json,sys
from urllib.parse import urlsplit
from guard import P,fact,save
from playwright.sync_api import sync_playwright
D=Path(__file__).resolve().parent
O=json.loads((D/'observer.json').read_bytes())
URL={'A':'https://sys8994.github.io/honro/','B':'http://127.0.0.1:18982/','H':'http://127.0.0.1:18844/'}
KEY='honro-first-act-profile-1'
def check(ok,msg):
 if not ok:raise RuntimeError(msg)
def sha(s):return hashlib.sha256(s.encode()).hexdigest()
COMMON=r"""
 const k='act5:near:42';
 const lists=b=>[b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements];
 const placements=b=>lists(b).flatMap(xs=>(xs||[]).filter(x=>x.assetId===k));
 const valid=b=>Boolean(b&&b.mode==='campaign'&&b.honroStage===42&&b.stage===42&&
  b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==='campaign'&&b.honroAct5===1&&
  b.honroAuthoredId==='stage-42'&&b.honroCampaignMapRevision===1&&b.honroRevision===20&&b.honroMapRevision===20);
 const sig=a=>{const s=JSON.stringify(a);let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return s.length+':'+(h>>>0).toString(16)};
 const state=b=>({terrain:JSON.stringify([b.terrain,b.honroWorldTerrain,b.honroPlayBounds,b.honroTerrainBounds]),
  units:JSON.stringify(b.units),objectives:JSON.stringify([b.honroObjectives,b.objectives,b.honroQuestTargets,b.honroGoalState,b.honroEncounterState]),
  phase:b.phase,round:b.round,revision:b.honroCampaignMapRevision,
  placements:placements(b).map(({asset,...x})=>x)});
"""
PERSIST='key=>{'+COMMON+r"""
 const a=HonroApp;if(!valid(a.engine?.b)||a.profileStore.locked||a.persist()!==true)throw Error('legitimate game save refused');
 const text=localStorage.getItem(key),p=JSON.parse(text),b=p.honroBattle;
 if(!valid(b)||HonroCampaignMapRevision.obsolete(b))throw Error('genuine persisted battle has unexpected identity');
 const rows=placements(b);
 if(rows.length!==2||rows.some(x=>x.asset.honroStaticAssetRef!==1||x.asset.id!==k))throw Error('expected two exact target static refs');
 return {text,refs:rows.map(x=>x.asset.signature),state:state(b)};
}"""
RESTORED='()=>{'+COMMON+r"""
 const a=HonroApp,b=a.engine?.b;if(!valid(b)||a.profileStore.locked)throw Error('did not mount a real canonical resumed checkpoint');
 const rows=placements(b),active=HONRO_PROJECT.library.filter(x=>x.id===k);
 if(active.length!==1||rows.length!==2)throw Error('expected exactly one current provider and two compiled slots');
 return {state:state(b),active:sig(active[0]),mounted:rows.map(x=>sig(x.asset))};
}"""
NEG='text=>{'+COMMON+r"""
 const saved=JSON.parse(text).honroBattle;
 const test=f=>{const b=structuredClone(saved);f(b);const t=JSON.stringify(b);
  return !HonroProfileStore.restoreBattleArt(b)&&JSON.stringify(b)===t};
 return {wrongStage:test(b=>b.honroStage=43),wrongMode:test(b=>b.mode='practice'),
  workshop:test(b=>b.honroMapOrigin='workshop'),custom:test(b=>b.honroCustom=true),
  nonCanonical:test(b=>b.honroCanonical=false),wrongMapRevision:test(b=>b.honroCampaignMapRevision=2),
  wrongOfficial:test(b=>b.honroAct5=0),wrongPlacement:test(b=>placements(b)[0].x=1),
  wrongCollision:test(b=>placements(b)[0].collisionIds=['test-not-real']),
  unknownSignature:test(b=>placements(b)[0].asset.signature='4:deadc0de'),
  malformedLastAtomic:test(b=>placements(b).at(-1).asset.honroStaticAssetRef=2)};
}"""
def main(w):
 g=json.loads((w/'out'/'GRAPH.json').read_bytes())
 q={'status':'HOLD','scope':' actual anonymous H/733 old and B/current generated saves cold-resumed through ordinary app Continue on A/pinned-current or B; no save text archived','devices':{}}
 def report():save(w,'RESUME.json',q)
 report()
 with sync_playwright()as pw:
  b=pw.chromium.launch(headless=True)
  q['browser']=b.version
  check(b.version=='151.0.7922.34','actual browser version')
  def open(arm,dims,old=None):
   u=URL[arm];c=b.new_context(viewport=dict(zip(('width','height'),dims)),device_scale_factor=1,service_workers='block')
   check(c.storage_state()=={'cookies':[],'origins':[]},'not virgin context')
   c.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
   if old is not None:
    origin=urlsplit(u)
    scheme=origin.scheme; domain=origin.netloc; route=origin.path+'HONRO.html'
    check((scheme,domain,route)==({'A':('https','sys8994.github.io','/honro/HONRO.html'),
      'B':('http','127.0.0.1:18982','/HONRO.html'),'H':('http','127.0.0.1:18844','/HONRO.html')}[arm])
      and not origin.query and not origin.fragment,'unexpected sandbox fixture origin/path')
    c.add_init_script('if(location.origin==='+json.dumps(f'{scheme}://{domain}')+'&&location.pathname==='+json.dumps(route)+'){localStorage.setItem('+json.dumps(KEY)+','+json.dumps(old)+');}')
   p=c.new_page();net={};errors=[]
   p.on('response',lambda r:net.setdefault(r.url,r))
   p.on('pageerror',lambda e:errors.append(str(e)))
   n=p.goto(u+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
   check(n and n.status==200 and n.url==u+'HONRO.html' and not n.from_service_worker,'unexpected app navigation')
   p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
   p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
   return c,p,net,errors
  def wait(p):
   p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===42&&!HonroApp.profileStore.locked",timeout=20000)
  def routes(net,arm):
   x={}
   for k,v in g['routes'][arm].items():
    r=net.get(URL[arm]+k)
    check(r and r.status==200 and not r.from_service_worker and fact(r.body())==v,'actual loaded response differs: '+k)
    x[k]=v
   return x
  def capture(p,d,case):
   n=d['key'];args={'id':42,'mapId':'stage-42','name':'east','dx':1,'dy':0,'readback':False,'fixedNow':O['PHASE']}
   meta=p.evaluate(O['FROZEN'],args)['meta'];p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
   raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
   name=f'{n}-{case}-continued-east.png';(w/'out'/name).write_bytes(raw)
   expect=next(v for v in d['views']if v['name']=='east')
   check(all(meta[k]==expect[k] for k in ('actual','viewport','backing')),'real resumed native East camera drift')
   return {'path':name,'png':fact(raw)}
  prev=P['profile']['previous'];curr=P['profile']['current']
  try:
   for d in P['views']:
    log=q['devices'][d['key']]={};snap={}
    for tag,arm,expect in [('older733','H',prev),('candidate','B',curr)]:
     c,p,n,er=open(arm,d['dims'])
     try:
      p.evaluate(O['LAUNCH'],42);wait(p)
      s=p.evaluate(PERSIST,KEY)
      check(s['refs']==[expect,expect] and not er,'actual store did not persist the pinned refs')
      log[tag]={'generatedSave':fact(s['text'].encode()),'refs':s['refs'],'stateSHA':sha(json.dumps(s['state'],ensure_ascii=False)),'HTTP':routes(n,arm)}
      snap[tag]=s;report()
     finally:c.close()
    for case,tag,arm,expect in [('stock-old-control','older733','A',prev),('candidate-old','older733','B',curr),('candidate-current','candidate','B',curr)]:
     s=snap[tag];c,p,n,er=open(arm,d['dims'],s['text'])
     try:
      intro=p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)")
      check(intro,'cold profile absent or auto-mounted')
      p.evaluate("()=>{HonroApp.frame=()=>{};HonroApp.continue();}");wait(p)
      r=p.evaluate(RESTORED)
      check(r['state']==s['state'] and r['active']==expect and r['mounted']==[expect,expect],
         'restored valid provider, terrain, actors, objectives, pose, phase or placement differs')
      v={'actualRestored':True,'sameState':True,'provider':expect,'HTTP':routes(n,arm),'errors':er,'raw':capture(p,d,case)}
      if case=='candidate-old':
       v['wrongCases']=p.evaluate(NEG,s['text'])
       check(all(v['wrongCases'].values()),'accepted invalid campaign/placement/signature/ref')
      check(not er,'unexpected actual page errors')
      log[case]=v;report()
     finally:c.close()
  finally:b.close()
 q['status']='PASS_ACTUAL_STAGE42_OLD_CURRENT_COLD_RESUME_PC_M_NO_DEPLOY';report()
if __name__=='__main__':main(Path(sys.argv[1]))
