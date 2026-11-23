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
def visit_init(br,host,device,files,saved=None,overrides=None):
 ctx=br.new_context(viewport=dict(zip(('width','height'),P['devices'][device]['size'])),device_scale_factor=1,service_workers='block')
 ctx.route('**/*',lambda route:route.continue_() if route.request.url.startswith(host) or route.request.url.startswith(('data:','blob:','about:')) else route.abort())
 page=ctx.new_page(); seen={}; errors=[]
 page.on('response',lambda r:seen.setdefault(r.url,r) if r.url.startswith(host) else None)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
 overrideHits={}
 for leaf,(body,mime) in (overrides or {}).items():
  def inject(r,leaf=leaf,body=body,mime=mime):
   ensure(r.request.method=='GET' and r.request.url==host+leaf and not overrideHits.get(leaf),'unexpected fixture response interception')
   overrideHits[leaf]=1
   r.fulfill(status=200,content_type=mime,headers={'Cache-Control':'no-store'},body=body)
  page.route(lambda u,target=host+leaf:u==target,inject,times=1)

 if saved is not None:
  loc=urlsplit(host);ensure(loc.hostname=='127.0.0.1' and loc.scheme=='http' and loc.path=='/honro/','cold profile authority')
  args=json.dumps({'origin':loc.scheme+'://'+loc.netloc,'text':saved,'key':KEY},ensure_ascii=True)
  page.add_init_script('(()=>{const p='+args+';if(location.origin===p.origin&&location.pathname==="/honro/HONRO.html"&&localStorage.getItem(p.key)===null)localStorage.setItem(p.key,p.text)})();')
 try:
  r=page.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  ensure(r and r.status==200 and r.url==host+'HONRO.html' and sha(r.body())==files['HONRO.html'],'wrong watched HTML')
  page.wait_for_function(READY,timeout=90000)
  page.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
  return (ctx,page,seen,errors,overrideHits)
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
def patch_module(b,p):
 old=b'["1864834:f80cec75","1858841:5ce4a412"]'
 current=b'current==="1382117:dec691ec"'
 a=b'function mayRestoreStage42CompactedArt(';z=b'function restoreBattleArt('
 ensure(b.count(a)==b.count(z)==1,'ambiguous native Stage42 guard')
 start,end=b.index(a),b.index(z)
 before=b[start:end]
 ensure(before.count(old)==before.count(current)==1,'nonunique native literal')
 exposed={}
 for name,more in [('selected',b'1382117:dec691ec'),('rollback',b'1583179:6d65aa38')]:
  changed=before.replace(old,old[:-1]+b',"'+more+b'"]')
  if name=='selected':changed=changed.replace(current,b'current==="1583179:6d65aa38"')
  out=b[:start]+changed+b[end:]
  ensure(sha(out)==p[name+'SHA256'],'predicted guard alias differs '+name)
  ensure(out[:start]==b[:start] and out[start+len(changed):]==b[end:],'unsigned module change')
  exposed[name]=out
 return exposed
if __name__=='__main__':
 ensure(P['enabled'] is True,'disabled; no browser requests')
 ensure(sha((D/'observer.json').read_bytes())==P['observerSHA256'],'wrong exact observer')
 from playwright.sync_api import sync_playwright
 from PIL import Image
 root,derived,proofdir=map(lambda s:Path(s).resolve(),sys.argv[1:])
 proofdir.mkdir(parents=True,exist_ok=True)
 q={'status':'HOLD','scope':P['fixtureMode']+'; exact standard title Continue and disposable same-stage profiles; no real user or saved bytes archived','visits':{},'receipt':{}}
 save()
 try:
  files=signaturefiles(root,'BF6');p=P['runtime'];mod=(root/p['stockPath']).read_bytes()
  raw=(root/'shared/runtime/profile-store.js').read_bytes()
  def gid(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
  ensure(gid(mod)==p['stockGit'] and sha(mod)==p['stockSHA256'] and gid(raw)==P['profilePatch']['beforeGit'],'wrong bf6 profile source/active module')
  g=raw.decode();a=g.index('function mayRestoreStage42CompactedArt(');z=g.index('\n function restoreBattleArt(',a)
  former="['1864834:f80cec75','1858841:5ce4a412']";nxt="['1864834:f80cec75','1858841:5ce4a412','1583179:6d65aa38']"
  ensure(g[a:z].count(former)==1,'ambiguous bf6 source allowlist')
  new=(g[:a]+g[a:z].replace(former,nxt)+g[z:]).encode()
  ensure(gid(new)==p['rollbackRawSourceGit'],'rollback source wrong')
  guards=patch_module(mod,p)
  ensure(sha(guards['selected']).startswith(p['normalEvidence']['candidateAlias'].split('.')[-2]),'selected guard does not exactly bind normal build asset alias')
  art=(derived/'full/packet.qa.json').read_bytes();expect=P['full']['files']['packet.qa.json'];ensure(fact(art)=={k:expect[k]for k in ('bytes','sha256')},'selected authority provider packet')
  route=P['arms']['B']['provider'];original='1382117:dec691ec';selected=P['full']['signature']
  js='text/javascript; charset=utf-8';single=p['stockPath']
  variants={'selected':{single:(guards['selected'],js),route:(art,'application/json; charset=utf-8')},'rollback':{single:(guards['rollback'],js)}}
  fs={arm:{**files,**{k:sha(x[0])for k,x in overrides.items()}}for arm,overrides in variants.items()}
  q['receipt']={'base':P['arms']['B']['head'],'runtimeExact':{k:sha(v)for k,v in guards.items()},'stockPacket':files[route],'normalEvidence':p['normalEvidence']};save()
  with server(root) as host,sync_playwright() as pw:
   br=pw.chromium.launch(headless=True,chromium_sandbox=True)
   try:
    ensure(br.version==P['chrome'],'wrong actual browser')
    for dev in ('PC','M'):
     snapshots={}
     for name,arm,prior,stamp in [('selected-fresh','selected',None,selected),('rollback-continue','rollback','selected-fresh',original),('selected-continue-after-resave','selected','rollback-continue',selected)]:
      old=snapshots.get(prior)
      c,t,seen,errors,hits=visit_init(br,host,dev,fs[arm],None if old is None else old['text'],variants[arm])
      try:
       if old is None:t.evaluate(O['LAUNCH'],42)
       else:
        ensure(t.evaluate('(k)=>localStorage.getItem(k)',KEY)==old['text'] and t.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'cold snapshot missing or auto-mounted')
        t.evaluate(TAP);t.locator('.title-actions button[data-action="continue"]').first.click(timeout=12000)
       wait_aim(t)
       state=t.evaluate(RESTORED);exact_state(state,stamp)
       if old:
        ensure(state['state']==old['state'],'Continue mutated gameplay state')
        ensure(t.evaluate("()=>window.__honroContinueTap")=={'launches':0,'mounts':1},'unexpected title Continue path')
       raw=t.evaluate(PERSIST,KEY);ensure(raw['refs']==[stamp,stamp] and raw['state']==state['state'],'ordinary in-app re-save mismatch')
       snapshots[name]=raw
       frame=pictures(t,dev,'low-east',name)
       ref=P['visualFixture']['pairs'][dev]['low-east']['raw']['rgba'] if arm=='selected' else P['expectedBF6RepresentativeRawRGBA'][dev]
       matches=frame['images']['raw']['rgba']==ref
       q['visits'][dev+'-'+name]={'continued':bool(old),'standardSave':uploadfact(raw['text']),'refs':raw['refs'],'nonArtStateUnchanged':not old or state['state']==old['state'],'mounted':state['mounted'],'frame':frame,'knownSelectedOrBF6RAWExact':matches,'fixtureOverrides':hits,'wires':wire(host,fs[arm],seen,errors)};save()
       ensure(hits=={k:1 for k in variants[arm]},'unexpected fixture response override count')
      finally:c.close()
   finally:br.close()
  ensure(len(q['visits'])==6 and all(s['knownSelectedOrBF6RAWExact'] for s in q['visits'].values()),'paired candidate/fallback comparison did not exactly reproduce reviewed RAW (native results retained)')
  q['status']='PASS_ACTUAL_ISOLATED_TITLE_ROLLBACK_AND_FORWARD_RESAVE_PC_M_NOT_NORMAL_ROLLBACK_BUILD'
 except Exception:
  q['firstFailure']=traceback.format_exc(limit=8);raise
 finally:save()
