"""Native fresh-stage A/B evidence, no deployment or saved-session test."""
import json,sys,base64,hashlib,io,traceback
import contextlib,functools,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes()); O=json.loads((D/'observer.json').read_bytes())
def ensure(x,msg):
 if not x: raise RuntimeError(msg)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def matches(raw,pin):return sha(raw)==pin['sha256']
def save():(proofdir/'READBACK.json').write_text(json.dumps(q,indent=2)+'\n')
class HTTP(SimpleHTTPRequestHandler):
 def send_head(self):
  u=urlsplit(self.path)
  if u.query or not u.path.startswith('/honro/') or any(t in u.path for t in ('..','%')):
   self.send_error(404);return None
  self.path='/'+u.path.removeprefix('/honro/')
  f=Path(self.translate_path(self.path))
  if not f.is_file() or not f.resolve().is_relative_to(Path(self.directory).resolve()):
   self.send_error(404);return None
  return super().send_head()
 def log_message(self,*_):pass
@contextlib.contextmanager
def server(root):
 h=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(HTTP,directory=str(root)))
 t=threading.Thread(target=h.serve_forever,daemon=True);t.start()
 try:yield f'http://127.0.0.1:{h.server_port}/honro/'
 finally:h.shutdown();h.server_close();t.join()
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],text=True,timeout=40).strip()
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
KEY='honro-first-act-profile-1'
READY="()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'"
AIM="""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}"""
TAP="""()=>{const a=HonroApp,l=a.launch,m=a.mount,c={launches:0,mounts:0};window.__honroContinueTap=c;
 a.launch=function(){++c.launches;return Reflect.apply(l,this,arguments)};a.mount=function(){++c.mounts;return Reflect.apply(m,this,arguments)};}"""
def uploadfact(s):return fact(s.encode())
def signaturefiles(root,arm):
 if arm=='PREA':
  h=P['history342'];actual={'head':h['head'],'tree':h['tree']}; sh={h['packet']:h['packetSHA']};m=json.loads((root/'web/manifest.json').read_bytes());c=m['project']
  ensure(c==h['campaign'] and json.loads((root/c).read_bytes())['stageLibraries'][41]==h['packet'],'wrong older authority graph')
  sh['HONRO.html']=sha((root/'HONRO.html').read_bytes());sh[c]=sha((root/c).read_bytes())
 else:
  k=P['arms']['A' if arm=='A6' else 'B'];actual=k;sh=k['files']
 ensure(git(root,'rev-parse','HEAD')==actual['head'] and git(root,'rev-parse','HEAD^{tree}')==actual['tree'] and not git(root,'status','--porcelain'),'wrong clean historical tree '+arm)
 for k,v in sh.items():ensure(sha((root/k).read_bytes())==v,'invalid historical authority '+k)
 if arm=='PREA':return sh
 return {k:v for k,v in sh.items() if k!='web/manifest.json'}
def visit_init(br,host,device,files,saved=None):
 ctx=br.new_context(viewport=dict(zip(('width','height'),P['devices'][device]['size'])),device_scale_factor=1,service_workers='block')
 ctx.route('**/*',lambda route:route.continue_() if route.request.url.startswith(host) or route.request.url.startswith(('data:','blob:','about:')) else route.abort())
 page=ctx.new_page(); seen={}; errors=[]
 page.on('response',lambda r:seen.setdefault(r.url,r) if r.url.startswith(host) else None)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 if saved is not None:
  loc=urlsplit(host);ensure(loc.hostname=='127.0.0.1' and loc.scheme=='http' and loc.path=='/honro/','cold profile authority')
  args=json.dumps({'origin':loc.scheme+'://'+loc.netloc,'text':saved,'key':KEY},ensure_ascii=True)
  page.add_init_script('(()=>{const p='+args+';if(location.origin===p.origin&&location.pathname==="/honro/HONRO.html"&&localStorage.getItem(p.key)===null)localStorage.setItem(p.key,p.text)})();')
 try:
  r=page.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  ensure(r and r.status==200 and r.url==host+'HONRO.html' and sha(r.body())==files['HONRO.html'],'wrong watched HTML')
  page.wait_for_function(READY,timeout=90000)
  page.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  return (ctx,page,seen,errors)
 except Exception:
  ctx.close();raise
def wait_aim(p):
 p.locator('#battlecanvas').wait_for(state='visible',timeout=50000)
 p.wait_for_function(AIM,timeout=16000)
def wire(host,files,seen,errors):
 ensure(not errors,'actual page error '+repr(errors));return {k:wire_one(host,k,v,seen) for k,v in files.items()}
def wire_one(host,k,v,seen):
 a=seen.get(host+k);ensure(a and a.status==200 and not a.from_service_worker and sha(a.body())==v,'missing/mismatched actual immutable route '+k)
 return v
def exact_state(r,stamp):
 ensure(r['active']==stamp and r['mounted']==[stamp,stamp],'wrong actual active/mounted provider')
def obs(p,device,name):
 dev=P['devices'][device];want=dev['views'][name];m=P['cameraModes'][name]
 args={'id':42,'mapId':'stage-42','name':m['mode'],'ordinary':want if m['mode']=='ordinary' else [],'dx':m['dx'],'dy':m['dy'],'readback':False,'fixedNow':O['PHASE']}
 def short(v):
  v['meta']['physics']=sha(v['meta'].pop('signature').encode());return v
 v=short(p.evaluate(O['FROZEN'],args));neg=p.evaluate(O['DECODE'])
 ensure(not neg['failed'] and v==short(p.evaluate(O['FROZEN'],{**args,'readback':True})),'draw/decode drift')
 s=v['meta'];ensure(s['actual']==dict(zip(('x','y','scale'),want)) and s['physics']==P['physics'] and s['actorCount']==34 and s['backing']==dev['backing'] and s['phase']=='aim' and s['round']==1,'camera, map, or actor mismatch')
 ensure(p.evaluate("()=>JSON.stringify(HonroApp.scene.environmentStats?.authoredFar)")==json.dumps([P['stageFar']['key']],separators=(',',':')),'missing rendered source valleyFar')
 return v
def pictures(p,device,view,label):
 meta=obs(p,device,view)
 pics={}
 for k,raw in {'raw':base64.b64decode(p.evaluate(O['CANVAS']),validate=True),'dom':p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css',timeout=25000)}.items():
  file='-'.join((device,label,view,k))+'.png';(proofdir/file).write_bytes(raw)
  with Image.open(io.BytesIO(raw)) as im:
   pics[k]={'file':file,'rgba':sha(im.convert('RGBA').tobytes()),'png':sha(raw),'size':list(im.size)}
 return {'images':pics,'pose':meta}
if __name__=='__main__':
 ensure(P['enabled'] is True,'disabled: no browser requests')
 ensure(sha((D/'observer.json').read_bytes())==P['observerSHA256'],'unreviewed deterministic observer')
 from playwright.sync_api import sync_playwright
 from PIL import Image
 pre,a6,bf,n,proofdir=map(lambda s:Path(s).resolve(),sys.argv[1:])
 graphs={'PREA':signaturefiles(pre,'PREA'),'A6':signaturefiles(a6,'A6'),'BF6':signaturefiles(bf,'BF6'),'NEW':json.loads((proofdir/'NORMAL-GRAPH.json').read_bytes())['routeSHA256']}
 stamps={'PREA':P['history342']['signature'],'A6':P['arms']['A']['owner'],'BF6':P['arms']['B']['owner'],'NEW':P['full']['signature']}
 q={'status':'HOLD','scope':'Ordinary native build and genuine cold title Continue of disposable same-stage profiles. Saves only in memory/browser contexts, no deployment, no rollback guarantee.','visits':{},'visualComparison':{},'coldContinue':{}}
 save()
 try:
  with contextlib.ExitStack() as stack:
   hosts={k:stack.enter_context(server(root))for k,root in {'PREA':pre,'A6':a6,'BF6':bf,'NEW':n}.items()}
   playwright=stack.enter_context(sync_playwright()); br=playwright.chromium.launch(headless=True,chromium_sandbox=True)
   try:
    ensure(br.version==P['chrome'],'wrong actual browser')
    for dev in ('PC','M'):
     saves={}
     for arm in ('PREA','A6','BF6','NEW'):
      host=hosts[arm];c,p,seen,errors=visit_init(br,host,dev,graphs[arm])
      try:
       p.evaluate(O['LAUNCH'],42);wait_aim(p); r=p.evaluate(RESTORED);exact_state(r,stamps[arm])
       s=p.evaluate(PERSIST,KEY); ensure(s['refs']==[stamps[arm],stamps[arm]],'normal write did not write both refs')
       saves[arm]=s
       if arm=='NEW':
        for name in P['devices'][dev]['views']:
         frame=pictures(p,dev,name,'normal-full');diff={k:frame['images'][k]['rgba']==v['rgba'] for k,v in P['visualFixture']['pairs'][dev][name].items()}
         q['visualComparison'][dev+'-'+name]={'normal':frame,'priorFixtureDecodedRGBAExact':diff};save()
       q['visits'][dev+'-'+arm]={'generated':uploadfact(s['text']),'refs':s['refs'],'mounted':r['mounted'],'wires':wire(host,graphs[arm],seen,errors)};save()
      finally:c.close()
     for arm in ('PREA','A6','BF6','NEW'):
      s=saves[arm]; label=dev+'-'+arm+'-to-NEW'
      c,p,seen,errors=visit_init(br,hosts['NEW'],dev,graphs['NEW'],s['text'])
      try:
       ensure(p.evaluate('(k)=>localStorage.getItem(k)',KEY)==s['text'] and p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'snapshot missing or auto-mounted')
       p.evaluate(TAP); btn=p.locator('.title-actions button[data-action="continue"]').first
       btn.wait_for(state='visible',timeout=12000);btn.click();wait_aim(p)
       r=p.evaluate(RESTORED);exact_state(r,stamps['NEW'])
       ensure(r['state']==s['state'],'Continue changed gameplay state '+label)
       ensure(p.evaluate("()=>window.__honroContinueTap")=={'launches':0,'mounts':1},'not actual one cold Continue mount '+label)
       record={'inputSave':uploadfact(s['text']),'mounted':r['mounted'],'sameState':True,'actualTitleContinue':True,'frame':pictures(p,dev,'low-east',arm+'-to-NEW'),'wires':wire(hosts['NEW'],graphs['NEW'],seen,errors)}
       if arm=='BF6':
        bad=p.evaluate(NEG,s['text']);ensure(all(bad.values()),'bad legacy accepted');record['invalidCases']=bad
        resave=p.evaluate(PERSIST,KEY);ensure(resave['refs']==[stamps['NEW'],stamps['NEW']],'migrated resave did not pin new refs')
        saves['MIGRATED']=resave;record['migratedResave']=uploadfact(resave['text'])
       q['coldContinue'][label]=record;save()
      finally:c.close()
     # Independent new context cold-check of an actual re-save after BF6 migration, never storage from a user.
     s=saves['MIGRATED'];c,p,seen,errors=visit_init(br,hosts['NEW'],dev,graphs['NEW'],s['text'])
     try:
      ensure(p.evaluate('(k)=>localStorage.getItem(k)',KEY)==s['text'] and p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'migrated snapshot missing or auto-mounted')
      p.evaluate(TAP);p.locator('.title-actions button[data-action="continue"]').first.click(timeout=12000);wait_aim(p)
      r=p.evaluate(RESTORED);exact_state(r,stamps['NEW'])
      ensure(r['state']==s['state'] and p.evaluate("()=>window.__honroContinueTap")=={'launches':0,'mounts':1},'migrated re-save cold resume changed')
      q['coldContinue'][dev+'-MIGRATED-RESAVE']={'actualTitleContinue':True,'sameState':True,'mounted':r['mounted'],'wires':wire(hosts['NEW'],graphs['NEW'],seen,errors)};save()
     finally:c.close()
   finally:br.close()
  ensure(len(q['coldContinue'])==10,'saved lineage missing')
  ensure(len(q['visualComparison'])==8 and all(all(i['priorFixtureDecodedRGBAExact'].values()) for i in q['visualComparison'].values()),'normal build differs from reviewed fixture native frames (all stored)')
  q['status']='PASS_NORMAL_FULL_CURRENT_AND_PRIOR_ACTUAL_CONTINUE_NO_DEPLOY_ROLLBACK_PENDING'
 except Exception:
  q['firstFailure']=traceback.format_exc(limit=8);raise
 finally:save()
