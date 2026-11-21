"""Public same-release canonical app load canaries, no replay, products or credentials in browser."""
import base64, json, os, re, subprocess, sys, time
from urllib.request import Request, build_opener, HTTPRedirectHandler
from pathlib import Path
from io import BytesIO
from source import (facts,hashb,obj, known,REL,TREE,MF,MANIFEST,SHELL,SHELL_FACT,ENTRY,CAMPAIGN,CLOSURE)

API='sys8994/honro'
BASE='https://sys8994.github.io/honro/'
REF='refs/heads/qa/acb51-first-loadability-canaries'
RUN,JOB=44918541021,136889673324
PATHS={'.github/workflows/acb51-stage-load-canaries.yml',*(f'tools/acb51-stage-load-canaries/{x}'for x in ['source.py','load.py','BODY-REFERENCE.json'])}
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f\d-]{36}')
MEDIA={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
SHARDS={'Act1':[2],'Act2':[11,15],'Act3':[24],'Act4':[38],'Act5':[46]}
P24={'physics':'4f2176310fc331d0c8d37fcbba29f9df89b3e438b26fe800ac6b19cc935b61e0',
     'owner':'family24:retaining-earth-faces','raw':'a1c2cd901cb96494d00542fc4dca168cc80fa838c100b3d326e24a96274247b5','native':'6fd9ef04593300209147ef91937c7a20ae4ca1ff9ff4cbbbbaba56d6a948d7f8'}
def save(p,x):
 tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');tmp.replace(p)
def git(*k):return subprocess.check_output(['git',*k],timeout=90).decode().strip()
def gh(path):return obj(subprocess.check_output(['gh','api','repos/'+API+'/'+path],timeout=25))
def authority(w):
 head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(API,REF,'push')
 assert git('rev-list','--parents','-n1','HEAD').split()==[head,REL]
 assert git('rev-parse',REL+'^{tree}')==TREE and git('status','--porcelain=v1')==''
 assert set(git('diff','--name-status','--no-renames',REL,head).splitlines())=={'A\t'+x for x in PATHS}
 assert all(git('ls-tree',head,'--',x).split()[0]=='100644'for x in PATHS)
 assert gh('git/ref/heads/master')['object']['sha']==REL
 p=gh(f'actions/runs/{RUN}');j=gh(f'actions/jobs/{JOB}')
 assert p['repository']['full_name']==p['head_repository']['full_name']==API
 assert (p['id'],p['head_sha'],p['head_branch'],p['name'],p['status'],p['conclusion'])==(RUN,REL,'master','pages build and deployment','completed','success')
 assert (j['id'],j['run_id'],j['name'],j['status'],j['conclusion'])==(JOB,RUN,'deploy','completed','success')
 assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in j['steps'])
 b=w/'B';subprocess.run(['git','worktree','add','--detach',str(b),REL],check=True)
 assert git('-C',str(b),'rev-parse','HEAD^{tree}')==TREE
 save(w/'out'/'AUTHORITY.json',{'release':REL,'tree':TREE,'pages':[RUN,JOB],'manifest':MF,'head':head,'verified':True})
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*v,**k):raise RuntimeError('unexpected redirect')
def exact_public(path,info):
 with build_opener(NoRedirect).open(Request(BASE+path,headers={'Accept-Encoding':'identity'}),timeout=30)as r:
  assert r.status==200 and r.url==BASE+path
  return known(path,r.read(info['bytes']+1),info)

INIT=r"""()=>{
 const images=new Set(),blobs=new Set(),o=HTMLImageElement.prototype,d=Object.getOwnPropertyDescriptor(o,'src');
 Object.defineProperty(o,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const mk=URL.createObjectURL;URL.createObjectURL=function(...args){const u=Reflect.apply(mk,this,args);blobs.add(u);return u;};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async q=>{
 const a=window.HonroApp,id=q.stage;
 if(!a||typeof a.launch!=='function')throw Error('normal app not ready');
 a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
 await Promise.race([HonroCampaignLoader.ensureStage(id),new Promise((_,bad)=>setTimeout(()=>bad(Error('ensureStage deadline')),90000))]);
 const st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===id), expected=q.activeDeclaredDimensions;
 if(!st||st.id!==q.catalogID||st.pending||st.width!==expected[0]||st.height!==expected[1])
   throw Error('active declared stage differs from exact current provider: '+st?.id);
 const c=q.compactWitness||null;
 if(c){
   const pkg=id===11?window.HONRO_STAGE11_COMPACT_DATA:window.HONRO_ACT2_COMPACT_PACKAGES?.[id];
   const on=id===11?window.HonroStage11Compact?.enabled():window.HonroAct2Compact?.enabled(id);
   if(on!==true||!pkg||JSON.stringify(st)!==JSON.stringify(pkg.stage)||pkg.mapRevision!==c.revision||
      st.width!==c.width||st.height!==c.height||(st.metadata.compactStatus??null)!==c.status)
     throw Error('active compact art provider exact check failed');
   if(JSON.stringify(pkg.assets.map(x=>x.id))!==JSON.stringify(c.packageAssetIDs))throw Error('compact source scope mismatch');
   for (const asset of pkg.assets){
     const found=HONRO_PROJECT.library.filter(x=>x.id===asset.id);
     if(found.length!==1||JSON.stringify(found[0])!==JSON.stringify(asset))throw Error('compact live asset mismatch: '+asset.id);
   }
 }
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 const b=a.engine?.b;
 if(!b||b.honroStage!==id||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.width!==st.width||b.height!==st.height)
    throw Error('not normal canonical stage launch');
 if(c&&(b.honroCampaignMapRevision!==c.revision||(id===11&&window.HonroStage11Compact?.active(b)!==true)))
    throw Error('wrong live compact revision');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('dialogue remains after isolated entry');
 a.close();HonroStoryFraming.clear(a.scene);
 return {stage:st.id,compact:c?{revision:c.revision,matched:true,assetCount:c.packageAssetIDs.length}:null,width:st.width,height:st.height};
}"""
DECODE=r"""async()=>{
 const imgs=[...new Set([...document.images,...__honroObserver.images])].filter(x=>x.currentSrc||x.src);
 await Promise.race([Promise.all([document.fonts.ready,...imgs.map(x=>x.decode())]),
    new Promise((_,bad)=>setTimeout(()=>bad(Error('active image decode deadline')),30000))]);
 if(document.fonts.status!=='loaded'||!imgs.length||imgs.some(x=>!x.complete||!x.naturalWidth))throw Error('incomplete actual renderer assets');
 return imgs.length;
}"""
FRAME=r"""async q=>{
 const a=HonroApp,e=a.engine,b=e.b,s=a.scene,st=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===q.stage);
 const r=s.canvas.getBoundingClientRect(),z=HonroBounds.zoomLimits(r.width),f=HonroBounds.focus(b);
 if(b.phase!=='aim'||b.round!==1||a.dialogue||a.scene.time!==2&&q.readback)throw Error('wrong first normal scene state');
 const desired=q.stage===24?{x:6930,y:2520,scale:.5}:{x:st.width/2,y:st.height/2,scale:z.min};
 if(!q.readback){
   HonroStoryFraming.clear(s);
   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...desired});
   HonroBounds.constrain(s,b);
   s.render(e,0,'',.6,false,0);
 }
 const state=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null});
 const prev=state(), now={x:s.x,y:s.y,scale:s.scale};
 s.render(e,0,'',.6,false,0);
 if(state()!==prev||[s.x,s.y,s.scale].some((x,i)=>x!==Object.values(now)[i]))throw Error('normal geometry/camera modified by stationary draw');
 const h=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x))),n=>n.toString(16).padStart(2,'0')).join('');
 const physics=await h(prev);
 const registered=HONRO_PROJECT.library,missing=st.elements.filter(x=>x.assetId&&!registered.some(y=>y.id===x.assetId)).map(x=>x.assetId);
 const t=globalThis.HonroTerrainDomain,nn=t?.materialLandmarks?.(b)??[],ids=new Set(nn.map(x=>x.asset?.id).filter(Boolean));
 let exact=null;
 if(q.stage===24){
   const target=q.w24,r=registered.find(x=>x.id===target.owner),n=nn.find(x=>x.asset?.id===target.owner);
   if(!r||!n||physics!==target.physics||await h(JSON.stringify(r.vector))!==target.raw||await h(JSON.stringify(n.asset.vector))!==target.native||
      now.x!==6930||now.y!==2520||now.scale!==.5)
      throw Error('actual approved Stage24 front6/body/pose signature differs');
   exact={asset:target.owner,raw:target.raw,native:target.native};
 }
 if(!Number.isFinite(now.x)||!Number.isFinite(now.y)||!Number.isFinite(now.scale)||!Array.isArray(b.units)||!b.units.length)
    throw Error('invalid actual status');
 return {desired,actual:now,view:HonroBounds.viewport(s,r.width,r.height),focus:f,css:[r.width,r.height],backing:[s.canvas.width,s.canvas.height],
  phase:b.phase,round:b.round,time:s.time,physics,actualStaticAssetCount:registered.length,actualTerrainIDs:b.terrain.map(x=>x.id),
  actualDrawOwnerIDs:[...ids].sort(),declaredMissing:[...new Set(missing)].sort(),exactStage24Owner:exact};
}"""
RAW="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"

def capture(browser,w,row,device,proof,active):
 from PIL import Image
 out=w/'out';stage=row['stage']; key=f"s{stage:02d}-{device[0]}x{device[1]}"
 ctx=browser.new_context(viewport={'width':device[0],'height':device[1]},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 p=ctx.new_page();p.set_default_timeout(30000);p.add_init_script('('+INIT+')()')
 errors=[]; state={'stage':stage,'device':device,'status':'INIT','errors':errors}
 proof['visits'][key]=state
 def emit():save(out/'CHROME.json',proof)
 hits=[];todo=set();observed={};blobs=set();pos=0
 valid={**active,SHELL:SHELL_FACT,MANIFEST:MF}
 def path(url):return url[len(BASE):] if url.startswith(BASE)and '?'not in url and '#'not in url else None
 def asked(q):
  z=path(q.url)
  if not(q.method=='GET' and (z in valid or z in MEDIA and q.resource_type=='media' or BLOB.fullmatch(q.url) or q.url.startswith('data:'))):
   errors.append(['noncanonical request',q.method,q.url])
  if z in valid:todo.add(q)
 def fail(q):
  todo.discard(q)
  if not(path(q.url)in MEDIA and q.resource_type=='media'and q.failure=='net::ERR_ABORTED'):errors.append(['failed',q.url,q.failure])
 def received(r):
  z=path(r.url)
  if z in valid and r.status==200:hits.append((z,r))
  elif BLOB.fullmatch(r.url) and r.status==200:blobs.add(r.url)
  elif z in MEDIA and r.status in (200,206) and r.request.resource_type=='media':return
  elif not r.url.startswith('data:'):errors.append(['bad response',r.status,r.url])
 p.on('request',asked);p.on('requestfinished',lambda q:todo.discard(q));p.on('requestfailed',fail);p.on('response',received)
 p.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 keys=set(row['requiredExactHTTP'])|{SHELL}
 def drain():
  nonlocal pos
  until=time.monotonic()+20
  quiet=0
  while time.monotonic()<until:
   assert not errors, errors
   while pos<len(hits)and hits[pos][1].request not in todo:
    z,r=hits[pos];body=r.body();known(z,body,valid[z]);observed[z]=valid[z];pos+=1
   before=(pos,len(blobs));p.wait_for_timeout(105)
   ok=before==(len(hits),len(blobs))and not todo and keys<=observed.keys()
   quiet=quiet+1 if ok else 0
   if quiet==3:
    assert blobs<=set(p.evaluate('()=>Array.from(__honroObserver.blobs)'))
    return
  raise RuntimeError(('actual exact response closure',sorted(keys-observed.keys()),sorted(x.url for x in todo),errors))
 try:
  r=p.goto(BASE+SHELL,wait_until='domcontentloaded',timeout=50000)
  assert r and r.status==200 and r.url==BASE+SHELL
  known(SHELL,r.body(),SHELL_FACT);state['status']='SHELL_EXACT';emit()
  p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
  state['provider']=p.evaluate(LAUNCH,row);state['status']='CANONICAL_LAUNCH_CHECKED';emit()
  p.locator('#battlecanvas').wait_for(state='visible')
  p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  q={'stage':stage,'w24':P24,'readback':False}
  f=p.evaluate(FRAME,q);state['imageDecodeCount']=p.evaluate(DECODE)
  assert p.evaluate(FRAME,{**q,'readback':True})==f
  raw=base64.b64decode(p.evaluate(RAW),validate=True)
  with Image.open(BytesIO(raw))as im:
   im.load();assert list(im.size)==f['backing'];assert im.convert('RGB').getextrema()!=((0,0),(0,0),(0,0))
  fn=key+'-raw.png';(out/fn).write_bytes(raw)
  state.update(frame=f,raw=fn,rawSHA256=hashb(raw),status='EXACT_FRAME_CAPTURED');emit()
  drain();assert not errors
  state.update(status='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY',requiredObserved={z:observed[z]for z in sorted(keys)},
    observedCount=len(observed),runtimeSemantics='Not author role approval/normal playthrough; first aim after isolated built-in entry')
 except Exception as e:state.update(status='HOLD',error=repr(e),observedPartial=observed)
 finally:emit();ctx.close()
def app(w,shard):
 from playwright.sync_api import sync_playwright
 assert not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
 out=w/'out';a=obj((out/'AUTHORITY.json').read_bytes());assert a['verified']and a['release']==REL
 m=obj(exact_public(MANIFEST,MF));idx={x['path']:{k:x[k]for k in ('sha256','bytes')}for x in m['files']}
 assert len(idx)==810
 exact_public(CAMPAIGN,idx[CAMPAIGN]);exact_public(ENTRY,idx[ENTRY]);exact_public(SHELL,SHELL_FACT)
 local=obj((out/'WIRE.json').read_bytes())
 assert local['release']==REL and local['manifest']==MF and [x['stage']for x in local['rows']]==SHARDS[shard]
 proof={'stageShard':shard,'release':REL,'manifest':MF,'status':'INIT','visits':{},'scope':'actual anonymous public HTTPS loadability only; not live gameplay, terrain bulk approval, or full 1/5'}
 try:
  with sync_playwright()as pw:
   browser=pw.chromium.launch(headless=True);proof['chrome']=browser.version
   assert browser.version=='151.0.7922.34'
   for row in local['rows']:
    for device in [(1440,900),(390,844)] if row['stage']in (24,46) else [(1440,900)]:
     capture(browser,w,row,device,proof,idx)
   browser.close()
  exact_public(MANIFEST,MF)
  assert all(v['status']=='PASS_CANONICAL_WIRE_AND_APP_LOAD_ONLY' for v in proof['visits'].values())
  proof['status']='PASS_SCOPE_ONLY'
 except Exception as e:proof.update(status='HOLD',error=repr(e));raise
 finally:save(out/'CHROME.json',proof)
if __name__=='__main__':
 w=Path(sys.argv[2]);assert w.resolve().is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 if sys.argv[1]=='authority':authority(w)
 else:app(w,sys.argv[3])
