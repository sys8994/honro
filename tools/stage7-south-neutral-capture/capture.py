"""Anonymous Stage7 stock vs neutral native tile-copy diagnostic; no art or release."""
import base64,io,json,math,re,sys,time,traceback
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
import hashlib,os,subprocess,urllib.request,urllib.parse
H=Path(__file__).resolve().parent
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def rd(r,k):return (r/k).read_bytes()
def save(p,o):
 t=p.with_suffix('.tmp');t.write_text(json.dumps(o,ensure_ascii=False,sort_keys=True,indent=2)+'\n');t.replace(p)
PINS=json.loads(rd(H,'PINS.json'))
LIVE='https://sys8994.github.io/honro/'

PROBE=rd(H,'probe-hook.js').decode()
O=json.loads(rd(H,'stock-observer.json'));P=json.loads(rd(H,'POSES.json'))['cases'];PARK=rd(H,'park.js').decode()
DIR={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
PHASES=('phase1','phase2','repeat1','repeat2')
MEDIA={f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3','battle-4')}
CACHE='''()=>{const s=HonroApp.scene,r=s.renderCacheStats();return {
 backing:[s.canvas.width,s.canvas.height],caches:['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'].map(k=>{
  const q=s[k];return [typeof q?.key==='string',q?.canvas?.width??null,q?.canvas?.height??null,q?.bytes??null]
 }), fields:Object.fromEntries(['screenWorldBytes','screenBackgroundBytes','screenForegroundBytes','worldBytes','worldScale','backgroundBytes','domainCanvasAllocations','domainTileBuilds'].map(k=>[k,r[k]??0]))
}}'''
NATIVE='''()=>{const b=HonroApp.engine.b,world=HonroTerrainDomain.render(b),root=world.find(t=>t.id==='root-floor');
 const q=HonroTerrainReadability.prepare(b).groups.find(t=>t.id==='root-floor');
 const same=(e,x,y,r,d)=>!e.walkable&&e.a.x===x&&e.a.y===y&&e.z.x===r&&e.z.y===d;
 const west=q.segments.filter(e=>same(e,-1200,5069.18,-1200,3101.83)),east=q.segments.filter(e=>same(e,5732.24,2766.92,5732.24,5069.18));
 const bottom=q.segments.filter(e=>same(e,5732.24,5069.18,-1200,5069.18));
 const others=q.segments.filter(e=>!west.includes(e));
 if(!HonroTerrainDomain.active(b)||!root||east.length!==1||bottom.length!==0||q.segments.filter(x=>x.walkable).length!==13)throw Error('lost native east / prior south / walk witness');
 return {countWest:west.length,stage:b.honroStage,phase:b.phase,round:b.round,world:world.map(t=>[t.id,t.vertices]),legalOthers:others,water:b.water??null};}'''
CLOCK='''()=>{const perf=performance,proto=Object.getPrototypeOf(perf),native=proto.now,td=HonroTimeOfDay,s=HonroScene.prototype;
 const a=Object.getOwnPropertyDescriptor(td,'sky'), t=Object.getOwnPropertyDescriptor(s,'environmentTone');
 if(Object.hasOwn(perf,'now')||!a?.configurable||!t?.configurable)throw Error('missing stock render clock owners');
 let i=0;const date=Date,timer=setTimeout,raf=requestAnimationFrame,epoch=performance.timeOrigin;
 function apply(old,owner,args,b){
  if(b?.honroStage!==7||b.honroCustom!==false)return Reflect.apply(old,owner,args);
  if(Object.hasOwn(perf,'now')||perf.now!==native)throw Error('non-native clock outside this synchronous hook');
  Object.defineProperty(perf,'now',{configurable:true,value:()=>60000+i*16});
  try{const result=Reflect.apply(old,owner,args);if(result?.then)throw Error('render clock escaped sync');return result;}finally{delete perf.now;if(perf.now!==native)throw Error('clock restoration failed');}
 }
 Object.defineProperty(td,'sky',{...a,value:function(...args){return apply(a.value,this,args,args[4]);}});
 Object.defineProperty(s,'environmentTone',{...t,value:function(...args){return apply(t.value,this,args,args[3]);}});
 window.__s7Phase=(k)=>{if(!Number.isInteger(k)||k<i||k>i+1||k>8||Date!==date||setTimeout!==timer||requestAnimationFrame!==raf||performance.timeOrigin!==epoch||perf.now!==native)throw Error('invalid independent phase/timer');
 i=k;return {index:i,clock:60000+i*16,nativeTimers:true};};
 window.__s7Restore=()=>{Object.defineProperty(td,'sky',a);Object.defineProperty(s,'environmentTone',t);delete window.__s7Phase;delete window.__s7Restore;return perf.now===native&&a.value===td.sky&&t.value===s.environmentTone;};
 return window.__s7Phase(0);}'''
def rgba(p):
 with Image.open(p)as v:
  v.load();return v.convert('RGBA')
def png(raw):
 with Image.open(io.BytesIO(raw))as v:
  v.load();return v.convert('RGBA')
def visit(br,root,report,label,key,v,method,outer,plan=None):
 known=PINS['active'];aliases=PINS['aliases'];original=v['requests']
 expected={aliases.get(p,p)for p in original}|{PINS['method']['path'],PINS['method']['outer']['path']}
 assert expected<=known.keys() and all(known[p]==q for p,q in original.items()if p not in aliases and p!='HONRO.html')
 origin=LIVE;site=urllib.parse.urlsplit(origin)
 object_origin=f'{site.scheme}://{site.netloc}/'
 brx=re.compile('blob:'+re.escape(object_origin)+r'[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}')

 state={'label':label,'case':key,'phase':'INIT','frames':{},'status':'HOLD','wireMethodTokenSites':{}}
 report['visits'].append(state);flush(root,report)
 ca=br.new_context(viewport=dict(zip(('width','height'),v['device'])),device_scale_factor=1,service_workers='block')
 checked={};done=set();todo=set();hits=[];err=[];blobs=set()
 page=ca.new_page();page.add_init_script('('+O['INIT']+')()');page.set_default_timeout(30_000)
 def keypath(u):return u[len(origin):]if u.startswith(origin)and ('?'not in u and '#'not in u)else None
 def request(r):
  p=keypath(r.url)
  if r.method!='GET' or not(p in known or p in MEDIA and r.resource_type=='media' or brx.fullmatch(r.url) or r.url.startswith('data:')):err.append(('unknown request',r.method,r.url))
  if p in known:todo.add(r)
 def fail(r):
  todo.discard(r)
  if not(keypath(r.url)in MEDIA and r.resource_type=='media'and r.failure=='net::ERR_ABORTED'):err.append(('request fail',r.url,r.failure))
 def res(r):
  p=keypath(r.url)
  if p in known and r.status==200 and not r.from_service_worker:hits.append((p,r))
  elif brx.fullmatch(r.url)and r.status==200:blobs.add(r.url)
  elif p in MEDIA and r.status in(200,206)and r.request.resource_type=='media':pass
  elif not r.url.startswith('data:'):err.append(('unknown response',r.url,r.status))
 for e,f in [('request',request),('requestfinished',lambda r:todo.discard(r)),('requestfailed',fail),('response',res),('pageerror',lambda e:err.append(('page error',str(e))))]:page.on(e,f)
 try:
  assert ca.storage_state()=={'cookies':[],'origins':[]}
  nav=page.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
  assert nav and nav.status==200 and nav.url==origin+'HONRO.html' and not nav.from_service_worker
  n=nav.request;assert n.method=='GET' and n.is_navigation_request() and n.frame==page.main_frame and n.resource_type=='document' and not n.redirected_from and not n.redirected_to
  state['navigation']=checked['HONRO.html']=fact(nav.body());assert checked['HONRO.html']==known['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90_000)
  target=v['stage'];p=v['provider'];assert target==7
  boot={'stage':7,'catalogID':p['stage'],'activeDeclaredDimensions':[p['width'],p['height']]}
  state['clockStart']=page.evaluate(CLOCK)
  assert page.evaluate(O['LAUNCH'],boot)==p
  state['actualProvider']=p
  state['nativeMethodProvenance']=page.evaluate(RUNTIME_WITNESS)
  chk=state['nativeMethodProvenance']
  check_method_witness(chk,method,outer);flush(root,report)
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  opts=PINS['fullBaseline']['spec'][key];targets=opts['tiles']
  assert len(targets) in (1,6)
  if label in ('O','N'):
   state['bodyBefore']=page.evaluate(BODY_SHA)
   flush(root,report);assert state['bodyBefore']==PINS['perimeter']['rawBodyIdentity']
  for j,name in enumerate(('north','east','south'),1):
   cp=page.evaluate('(j)=>__s7Phase(j)',j);dx,dy=DIR[name]
   assert page.evaluate('()=>!Object.hasOwn(HonroApp.scene,"_drawTerrainDomainTiles") && !Object.hasOwn(window,"__s7SouthProbe")')
   if name=='south':
    state['coldReset']=page.evaluate("""()=>{const s=HonroApp.scene,ids=[...s._domainTiles.tiles.keys()];s._releaseDomainTiles();if(s._domainTiles!==null)throw Error('cold-only reset failed');return ids;}""")
    if label in ('O','N'):
     archived=PINS['perimeter']['r4N']['byDevice'][key]
     assert cp==archived['southPhase']
     runs=None
     if label=='N':
      runs,witness=plan
      assert witness==sha(canon(runs)) and set(runs)==set(targets)
      state['appliedMaskSHA256']=witness
     page.evaluate(install_script(method,outer),{'stockOuter':outer,'targets':targets,'mode':label,'screenWitness':archived['screenWitness'],'runs':runs})
   q={'stage':7,'id':p['stage'],'name':name,'dx':dx,'dy':dy,'readback':False}
   now=page.evaluate(PARK,q);count=page.evaluate(O['DECODE'])
   assert count>0 and all(now[k]==w for k,w in v['views'][name].items()),'archived exact camera/physics changed'
   if name=='east':continue  # Normal prior orientation/clock only; no duplicate artifact.
   fixed=PINS['screens'][key+'-'+name];assert fixed['placement']=={'before':now,'declaredRenderPhase':cp}
   rec=state['frames'][name]={'before':now,'declaredRenderPhase':cp,'phases':{}}
   for phase in ('phase1','phase2'):
    a=page.evaluate(PARK,{**q,'readback':True});assert a==now
    geo=page.evaluate(NATIVE);assert geo.pop('countWest')==0
    raw=base64.b64decode(page.evaluate(O['RAW']),validate=True)
    el=page.locator('#battlecanvas');box=el.bounding_box()
    domBox=css_enclosure(box,now,v['device'])
    dom=el.screenshot(animations='disabled',caret='hide',scale='css')
    assert el.bounding_box()==box,'actual CSS canvas moved while rendering'
    entry={}
    for kind,val in [('raw',raw),('dom',dom)]:
     f=store_img(root,f'{label}-{key}-{name}-{phase}-{kind}',val)
     expectedSize=now['backing'] if kind=='raw' else domBox['enclosedSize']
     assert f['size']==expectedSize,(kind,f['size'],expectedSize,domBox)
     if kind=='dom':f['bbox']=domBox
     entry[kind]=f
    rec['phases'][phase]={**entry,'native':geo,'cache':page.evaluate(CACHE)}
    pred=fixed['phases'][phase]
    rec['phases'][phase]['historicalExact']=entry['raw']['png']==pred['png'] and entry['raw']['rgba']==pred['rgba'] and geo==pred['native']
    flush(root,report)
   if name=='south':
    # Final readback is after both unmodified whole game captures, not inside renderer.
    state['actualSouthTiles']=page.evaluate("""()=>Array.from(HonroApp.scene._domainTiles?.tiles.keys()??[])""")
    state['missingSouthTiles']=sorted(set(targets)-set(state['actualSouthTiles']))
    flush(root,report)
    assert not state['missingSouthTiles'] and set(opts['expectedCold'])==set(state['actualSouthTiles']) and len(state['actualSouthTiles'])<=opts['capacity'],(key,state['actualSouthTiles'],'wrong actual visible tile closure/cache cap')
    state['tiles']={}
    for tid in targets:
     nameTile=tid.replace(':','_')
     raw=page.evaluate("""id=>HonroApp.scene._domainTiles.tiles.get(id).canvas.toDataURL('image/png').split(',')[1]""",tid)
     state['tiles'][tid]=store_img(root,f'{label}-{key}-tile-{nameTile}-warm',base64.b64decode(raw,validate=True))
    if label in ('O','N'):
     state['nativeHook']=page.evaluate('()=>__s7SouthProbe.health()')
     flush(root,report)
     state['nativeWitnesses']={}
     for tid in targets:
      ss=page.evaluate('id=>__s7SouthProbe.snapshots(id)',tid)
      nameTile=tid.replace(':','_')
      state['nativeWitnesses'][tid]={k:store_img(root,f'{label}-{key}-tile-{nameTile}-{k}',base64.b64decode(v,validate=True))for k,v in ss.items()}
      flush(root,report)
     assert page.evaluate('()=>{const r=__s7SouthProbe.restore();return delete window.__s7SouthProbe&&r;}')
     state['hookRestored']=True
  assert page.evaluate('()=>__s7Restore() && !Object.hasOwn(HonroApp.scene,"_drawTerrainDomainTiles")')
  if label in ('O','N'):
   state['bodyAfter']=page.evaluate(BODY_SHA);assert state['bodyAfter']==state['bodyBefore']
  flush(root,report)
  i=0;settled=0;until=time.monotonic()+20
  while time.monotonic()<until:
   assert not err,err
   while i<len(hits)and hits[i][1].request not in todo:
    k,r=hits[i];body=r.body();assert fact(body)==known[k],('wrong served bytes',k)
    if k.endswith('.js') and b'_drawTerrainDomainTiles' in body:
     state['wireMethodTokenSites'][k]={'sha256':sha(body),'literalCount':body.count(b'_drawTerrainDomainTiles')}
    checked[k]=known[k];done.add(k);i+=1
   plen=(len(hits),len(blobs));page.wait_for_timeout(105)
   settled=settled+1 if i==len(hits)and not todo and plen==(len(hits),len(blobs))and expected-{'HONRO.html'}<=done else 0
   if settled==3:
    assert blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    assert {PINS['method']['path'],PINS['method']['outer']['path']}<=state['wireMethodTokenSites'].keys()
    state.update(status='EXACT_ACTUAL_VISIT',required=sorted(expected),verified=sorted(done|{'HONRO.html'}));break
  assert state['status']=='EXACT_ACTUAL_VISIT',(err,sorted(expected-done),len(todo))
 finally:
  state['networkErrors']=err;flush(root,report);ca.close()
def flush(root,x):save(root/'BROWSER.json',x)
def exact():
 assert PINS['enabled'] is True,'disabled until approved exact Git/Pages + retained manifest binding'
 c=PINS['publishedSource']; t=PINS['publishedTree']; repo='sys8994/honro'
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(repo,'push',PINS['qaRef'])
 def g(*args):return subprocess.check_output(['git',*args]).decode().strip()
 h=os.environ['GITHUB_SHA']; assert g('rev-parse','HEAD')==h
 assert g('rev-list','--parents','-n1',h).split()==[h,c] and g('rev-parse',c+'^{tree}')==t
 src=H.relative_to(Path(os.environ['GITHUB_WORKSPACE'])).as_posix()
 names={'A\t.github/workflows/stage7-south-neutral-capture.yml',*(f'A\t{src}/{name}'for name in ('PINS.json','POSES.json','capture.py','stock-observer.json','park.js','probe-hook.js'))}
 assert set(g('diff','--no-renames','--name-status',c,h).splitlines())==names
 assert not g('status','--porcelain=v1')
def pinned_fetch(path,pin):
 q=urllib.request.Request(LIVE+path,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity','User-Agent':'Mozilla/5.0 HONRO public proof'})
 with urllib.request.urlopen(q,timeout=50) as r:
  assert r.status==200 and r.geturl()==LIVE+path and r.headers.get('Content-Encoding') in (None,'identity')
  b=r.read(pin['bytes']+1)
 assert fact(b)==pin
 return b

def anonymous(out):
 fetch=pinned_fetch
 g=PINS['active'];routes=PINS['aliases']
 selected=['HONRO.html','index.html','HONRO_WORKSHOP.html','web/manifest.json',*routes,*routes.values()]
 assert len(set(selected))==12
 checks={k:fact(fetch(k,g.get(k)or PINS['oldAliasFacts'][k]))for k in selected}
 m=json.loads(fetch('web/manifest.json',g['web/manifest.json']))
 assert len(m['files'])==810
 idx={p['path']: {k:p[k]for k in ('bytes','sha256')} for p in m['files']}
 assert len(idx)==810 and {k:g[k]for k in idx}==idx
 old=set()
 for ent in [m['previousFiles'],*m['previousGenerations'],*(a['files']for a in m['publishedGenerations'])]:
  old.update(x['path']for x in ent)
 assert len(old|idx.keys())==1329 and set(routes)<=old
 assert sha(json.dumps(sorted(old|idx.keys()),ensure_ascii=True,separators=(',',':')).encode())==PINS['registryPathsCanonicalSha256']
 assert len(m['publishedGenerations'])==40
 save(out/'HTTP-PUBLIC.json',{'publishedSource':PINS['publishedSource'],'exact':checks,'active':810,'allReachable':1329,'publishedHistory':40,'pages':PINS['pages']})


def checked_method(wire):
 s=wire.decode('utf8');a=s.index('_drawTerrainDomainTiles(c,b,w,h){');z=s.index('renderCacheStats(){',a)
 f=s[a:z];assert sha(f.encode())==PINS['method']['sha256'] and s.count(f)==1
 return f
def checked_outer(wire):
 s=wire.decode('utf8');anchor='const domainPaint=S._drawTerrainDomainTiles;S._drawTerrainDomainTiles='
 assert s.count(anchor)==1
 i=s.index(anchor)+len(anchor);j=s.index(';const readability=S.terrainReadability;',i);outer=s[i:j]
 assert sha(outer.encode())==PINS['method']['outer']['sha256']
 assert outer.startswith('function(c,b,w,h){domainPaint.call(this,c,b,w,h);if(![41,42,43,44,45,46,47,48,49,50].includes(b.honroStage))return;')
 return outer

BODY_SHA='''async()=>{const q=HONRO_PROJECT.library.filter(x=>x.id==='act1-site:7:body');if(q.length!==1)throw Error('not single registered BODY');
 const b=new TextEncoder().encode(JSON.stringify(q[0]));const z=new Uint8Array(await crypto.subtle.digest('SHA-256',b));
 return {id:q[0].id,bytes:b.length,sha256:Array.from(z,x=>x.toString(16).padStart(2,'0')).join('')};}'''
RUNTIME_WITNESS='''async()=>{const s=HonroApp.scene,p=HonroScene.prototype,f=s._drawTerrainDomainTiles,q=p._drawTerrainDomainTiles;
 const describe=async x=>{if(typeof x!=='function')return null;const t=Function.prototype.toString.call(x),a=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)));return {source:t,sha256:Array.from(a,q=>q.toString(16).padStart(2,'0')).join('')};};
 return {sceneOwn:Object.hasOwn(s,'_drawTerrainDomainTiles'),sameAsPrototype:f===q,exactPrototype:Object.getPrototypeOf(s)===p,scene:await describe(f),prototype:await describe(q)};}'''
def check_method_witness(v,method,outer):
 for k in ('scene','prototype'):
  x=v[k]
  if x is None:continue
  src=x.pop('source');digest=sha(src.encode());assert digest==x['sha256']
  x['length']=len(src);x['matchesOuter']=src==outer;x['matchesInner']=src==method
  if src!=outer:
   first=next((i for i,(a,b) in enumerate(zip(src,outer))if a!=b),min(len(src),len(outer)))
   x['firstMismatch']={'offset':first,'actual':src[max(0,first-24):first+40],'expected':outer[max(0,first-24):first+40]}
 assert v['sceneOwn']is False and v['sameAsPrototype']is True and v['exactPrototype']is True and all(v[k] and v[k]['matchesOuter'] for k in ('scene','prototype')),v
def css_enclosure(box,now,device):
 assert box and set(box)=={'x','y','width','height'} and all(math.isfinite(x)for x in box.values()),box
 x,y,w,h=map(box.get,('x','y','width','height'))
 assert abs(w-now['css'][0])<1e-6 and abs(h-now['css'][1])<1e-6 and now['dpr']==1
 assert x>=-1e-6 and y>=-1e-6 and x+w<=device[0]+1e-6 and y+h<=device[1]+1e-6
 l,t=math.floor(x+1e-8),math.floor(y+1e-8);r,b=math.ceil(x+w-1e-8),math.ceil(y+h-1e-8)
 assert 0<=l<r<=device[0] and 0<=t<b<=device[1]
 return {'css':box,'enclosed':[l,t,r,b],'enclosedSize':[r-l,b-t],'dpr':now['dpr']}

def install_script(method,outer):
 one='this._landmarkLayer(cc,landmarks,"back");'
 two='this._landmarkLayer(cc,landmarks,"structural-back");'
 assert method.count(one)==method.count(two)==1 and method.index(one)<method.index(two)
 clone=method.replace(one,one+'const _s7Witness=_probe.open(this,b,cc,landmarks,view,rs,id,c);')
 clone=clone.replace(two,two+'_probe.close(_s7Witness);')
 return """spec=>{"use strict";const G=globalThis;"""+PROBE+"""
  const _probe=makeNeutralProbe(spec),domainPaint=({"""+clone+"""})._drawTerrainDomainTiles,clone=("""+outer+""");
  if(Object.hasOwn(window,'__s7SouthProbe'))throw Error('double neutral install');
  _probe.install(clone);window.__s7SouthProbe=_probe;return true;}"""
def store_img(root,name,raw):
 # Use content-addressed dedup across genuine A/O/N arms, without faking missing captures.
 sig=fact(raw);path=sig['sha256']+'.png';q=root/path
 if q.exists():assert q.read_bytes()==raw
 else:q.write_bytes(raw)
 im=png(raw)
 return {'name':name,'path':path,'png':sig,'rgba':sha(im.tobytes()),'size':list(im.size)}
def pixels(root,f):
 im=rgba(root/f['path'])
 assert sha(im.tobytes())==f['rgba'];return im
def difference(a,b):
 assert a.size==b.size
 aa=a.tobytes();bb=b.tobytes()
 where=[(i//4)%a.width for i in range(0,len(aa),4)if aa[i:i+4]!=bb[i:i+4]]
 return {'rgbaPixelsChanged':len(where),'alphaPixelsChanged':sum(x!=y for x,y in zip(aa[3::4],bb[3::4]))}
def canon(x):return json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def scene_match(root,key,a,b):
 assert a['status']==b['status']=='EXACT_ACTUAL_VISIT' and b['hookRestored'] is True
 assert a['actualProvider']==b['actualProvider'] and a['coldReset']==b['coldReset']
 assert a['nativeMethodProvenance']==b['nativeMethodProvenance'] and a['wireMethodTokenSites']==b['wireMethodTokenSites']
 assert b['bodyBefore']==b['bodyAfter']==PINS['perimeter']['rawBodyIdentity']
 opt=PINS['fullBaseline']['spec'][key]
 assert set(a['actualSouthTiles'])==set(b['actualSouthTiles'])==set(opt['expectedCold'])
 assert len(b['actualSouthTiles'])<=opt['capacity']
 assert set(a['tiles'])==set(b['tiles'])==set(b['nativeWitnesses'])==set(opt['tiles'])
 hist=PINS['perimeter']['r4N']['byDevice'][key]
 rows=b['nativeHook']['rows'];assert {x['id']for x in rows}==set(b['nativeHook']['opened'])==set(opt['tiles']) and len(rows)==len(opt['tiles'])
 assert b['nativeHook']['registeredBodyUnchanged'] is True
 for row in rows:
  tid=row['id'];assert all(row[k]==opt['tiles'][tid][k]for k in ('rect','rs','matrix'))
  assert row['screenWitness']==hist['screenWitness'] and sha(canon(row['screenWitness']))==hist['screenWitnessCanonicalSHA256']
  assert row['mode']==b['label'] and row['originalProviderUnchanged'] is True
 assert set(a['frames'])==set(b['frames'])=={'north','south'}
 for direction in a['frames']:
  x,y=a['frames'][direction],b['frames'][direction]
  assert x['before']==y['before'] and x['declaredRenderPhase']==y['declaredRenderPhase']
  if direction=='south':assert y['declaredRenderPhase']==hist['southPhase']
  assert set(x['phases'])==set(y['phases'])=={'phase1','phase2'}
  for p in x['phases']:
   x0,y0=x['phases'][p],y['phases'][p]
   assert x0['historicalExact'] and y0['historicalExact'] and x0['cache']==y0['cache'] and x0['native']==y0['native']
   assert x0['dom']['bbox']==y0['dom']['bbox']==PINS['perimeter']['signed'][key]['historicalDOM']
   for role in ('raw','dom'):
    assert pixels(root,x0[role]).tobytes()==pixels(root,y0[role]).tobytes()
    if direction=='south':
     f=hist['frames'][p][role];assert all(m==y0[role][k]for k,m in f.items())
 for tid,e in a['tiles'].items():
  assert e['size']==b['tiles'][tid]['size']==[516,516]
  assert pixels(root,e).tobytes()==pixels(root,b['tiles'][tid]).tobytes(),('old final native difference',key,tid)
 return {x['id']:x for x in rows}
def compare_natives(A,O,I,rect):
 # C only where exact A != O and immutable geometric S accepts native cell. I is independent
 # old child16 on transparent backing, not inferred from opaque A. Must prove contrary evidence first.
 assert A.size==O.size==I.size==(516,516)
 p,q,i=A.tobytes(),O.tobytes(),I.tobytes();l,t,w,h=rect;x1=l+w;y1=t+h
 m=bytearray(516*516);rs=[];bad=[]
 stat={'D':0,'C':0,'DOutsideS':0,'ISourceOutsideS':0,'DWithoutI':0,'ISourceMaskedByNonchange':0,
   'ISourceOpaque':0,'ISourcePartial':0,'alphaAtoOIncrease':0,'alphaAtoODecrease':0,'rgbOnlyDiff':0,'badExamples':bad}
 for y in range(516):
  start=None
  for x in range(516):
   ix=y*516+x;a,b,j=p[ix*4:ix*4+4],q[ix*4:ix*4+4],i[ix*4+3]
   inside=l<=x<x1 and t<=y<y1;diff=a!=b
   if j:
    stat['ISourceOutsideS']+=not inside
    stat['ISourceOpaque']+=j==255;stat['ISourcePartial']+=j!=255
    stat['ISourceMaskedByNonchange']+=not diff
   if diff:
    stat['D']+=1;stat['DOutsideS']+=not inside;stat['DWithoutI']+=j==0
    stat['alphaAtoOIncrease']+=b[3]>a[3];stat['alphaAtoODecrease']+=b[3]<a[3];stat['rgbOnlyDiff']+=a[3]==b[3]
    if (not inside or j==0 or b[3]>a[3])and len(bad)<12:bad.append([x,y,list(a),list(b),j])
   if diff and inside:
    m[ix]=255;stat['C']+=1
    if start is None:start=x
   else:
    if start is not None:rs.append([y,start,x]);start=None
  if start is not None:rs.append([y,start,516])
 assert sum(z[2]-z[1]for z in rs)==stat['C']
 return stat,rs,Image.frombytes('L',(516,516),bytes(m))
def global_tile_box(tile):
 # Exact integer texel coordinates from stock transform origin, common across all in-scope tiles.
 x,y=[-int(v)for v in tile['matrix'][4:6]];return [x,y,x+516,y+516]
def shared(key,opts,resolver,roles):
 out={}
 ids=sorted(opts)
 for ni,i in enumerate(ids):
  a=global_tile_box(opts[i]); ai=ABox(a,opts[i]['rect'])
  for j in ids[ni+1:]:
   b=global_tile_box(opts[j]);bj=ABox(b,opts[j]['rect'])
   G=[max(ai[0],bj[0]),max(ai[1],bj[1]),min(ai[2],bj[2]),min(ai[3],bj[3])]
   if G[0]>=G[2]or G[1]>=G[3]:continue
   ap,bp=[tuple(G[k]-p[k%2]for k in range(4))for p in (a,b)]
   d={}
   for role in sorted(roles):
    x,y=resolver(i,role).crop(ap),resolver(j,role).crop(bp);assert x.size==y.size
    p,q=x.tobytes(),y.tobytes();stride=len(x.getbands())
    d[role]=sum(p[k:k+stride]!=q[k:k+stride]for k in range(0,len(p),stride))
   out[i+'|'+j]={'globalTexelsHalfOpen':G,'differentSamples':d}
 if key.startswith('s07-1440'):
  assert len(out)==11 and sum(v['globalTexelsHalfOpen'][2]-v['globalTexelsHalfOpen'][0]==4 and v['globalTexelsHalfOpen'][3]-v['globalTexelsHalfOpen'][1]==4 for v in out.values())==4
 else:assert out=={}
 return out
def ABox(globalx,rect):
 a,b=globalx[:2];x,y,w,h=rect;return [a+x,b+y,a+x+w,b+y+h]
def sig_record(d):return {k:d[k]for k in ('png','rgba','size')}
def check_original_seams(key,slots,edges,resolver,expected,role_map):
 # No match tolerance. Each prior unequal sample must keep BOTH original RGBA
 # values, with no new coordinates, disappearance, or changed salt.
 assert set(edges)==set(expected)
 sums={}
 for pair,record in expected.items():
  G=edges[pair]['globalTexelsHalfOpen'];assert G==record['globalTexelsHalfOpen']
  tiles=pair.split('|');orig=[global_tile_box(slots[t])for t in tiles]
  boxes=[tuple(G[k]-p[k%2]for k in range(4))for p in orig]
  for now,old in role_map.items():
   want=record['unequal'][old]
   # Check counts before exporting values: an unexpected large difference fails closed.
   assert len(want)==edges[pair]['differentSamples'][now],(key,pair,now,len(want),edges[pair])
   if want:
    a,b=[resolver(t,now).crop(q)for t,q in zip(tiles,boxes)]
    x0,y0,x1,y1=G;seen=[]
    for y in range(y1-y0):
     for x in range(x1-x0):
      aa,bb=a.getpixel((x,y)),b.getpixel((x,y))
      if aa!=bb:seen.append([x0+x,y0+y,list(aa),list(bb)])
    assert seen==want,('per-tile original unequal values drifted',key,pair,now,want[:3],seen[:3])
   sums[now]=sums.get(now,0)+len(want)
 return sums
def original_r1_for(key):
 orig=PINS['fullBaseline']['publishedNativeProvenanceR1']
 return orig if orig['case']==key else None
def prior_r1_frame_guards(key,a,o):
 r=original_r1_for(key)
 if not r:return
 for v in (a,o):
  for direction,ff in r['framesA_O'].items():
   for phase,roles in ff.items():
    for kind,want in roles.items():assert sig_record(v['frames'][direction]['phases'][phase][kind])==want
  assert {k:sig_record(b)for k,b in v['tiles'].items()}==r['finalNoWrite']
 assert {k:{j:sig_record(b)for j,b in v.items()}for k,v in o['nativeWitnesses'].items()}==r['records']
def seal_o(root,report,key,a,o):
 rows=scene_match(root,key,a,o)
 prior_r1_frame_guards(key,a,o)
 masks={};compact={};metrics={}
 for tid,g in rows.items():
  assert g['nativeWrittenPixels']==0
  asset=o['nativeWitnesses'][tid];assert set(asset)=={'A','O','I'}
  v={k:pixels(root,p)for k,p in asset.items()}
  st,rr,b=compare_natives(*(v[k]for k in ('A','O','I')),g['rect'])
  masks[tid]=rr;compact[tid]=b;metrics[tid]=st
 def resolve(id,role):return compact[id] if role=='C' else pixels(root,o['nativeWitnesses'][id][role])
 edges=shared(key,PINS['fullBaseline']['spec'][key]['tiles'],resolve,('A','O','I','C'))
 record={'metrics':metrics,'gutter':edges,'case':key,'maskSHA256':sha(canon(masks)),'imageReceipts':o['nativeWitnesses'],'nativePlacements':rows}
 report['sourceAuthority'][key]=record;flush(root,report)
 # No iteration or support widening; fail before N if old source coverage not proven.
 assert all(q['C']>0 and q['ISourcePartial']+q['ISourceOpaque']>0 for q in metrics.values())
 assert all(q[k]==0 for q in metrics.values()for k in ('DOutsideS','ISourceOutsideS','DWithoutI','alphaAtoOIncrease')),metrics
 assert any(q['ISourcePartial']>0 for q in metrics.values())
 assert all(row['differentSamples']['C']==0 for row in edges.values()),edges
 prior=original_r1_for(key)
 if prior is None:
  assert edges=={} and key.startswith('s07-390')
 else:
  assert record['maskSHA256']==prior['frozenC']
  assert sha(canon(prior['pairs']))==prior['canonicalPairsSHA256']
  # These known asymmetries are not skipped. Every preregistered unequal
  # global cell belongs to the frozen C in its own native copies.
  copies={'A':0,'I':0,'O':0}
  for pair,data in prior['pairs'].items():
   l,r=pair.split('|')
   for role,old in data['unequal'].items():
    for x,y,_,_ in old:
     for tid in (l,r):
      ox,oy=global_tile_box(PINS['fullBaseline']['spec'][key]['tiles'][tid])[:2]
      assert compact[tid].getpixel((x-ox,y-oy))==255,('prior unequal slot not included in same-stock N',pair,role,x,y)
     copies[role]+=1
  assert copies=={'A':262,'I':262,'O':12}
  record['priorUnequalSlotsPresentInBothC']=copies
  record['priorUnequalNativeExact']=check_original_seams(key,PINS['fullBaseline']['spec'][key]['tiles'],edges,resolve,prior['pairs'],{'A':'A','I':'I','O':'O'})
 flush(root,report)
 save(root/f'C-{key}.json',{'case':key,'sha256OfCanonicalRuns':record['maskSHA256'],'runs':masks})
 return masks,record['maskSHA256']
def close_n(root,report,key,a,n,plan):
 rows=scene_match(root,key,a,n);masks,digest=plan
 assert sha(canon(masks))==digest==n['appliedMaskSHA256']
 auth=report['sourceAuthority'][key]
 tiles={}
 for tid,g in rows.items():
  assert g['nativeWrittenPixels']==sum(z[2]-z[1]for z in masks[tid])==auth['metrics'][tid]['C']
  x=n['nativeWitnesses'][tid];assert set(x)=={'A','samePaint','post'}
  q={t:pixels(root,p)for t,p in x.items()}
  ori=auth['imageReceipts'][tid]['A']
  old=pixels(root,ori)
  tiles[tid]={k:difference(old,u)for k,u in q.items()}
 def resolve(id,role):return pixels(root,n['nativeWitnesses'][id][role])
 edges=shared(key,PINS['fullBaseline']['spec'][key]['tiles'],resolve,('A','samePaint','post'))
 report['neutralCopy'][key]={'tiles':tiles,'gutter':edges,'appliedMaskSHA256':digest}
 flush(root,report)
 assert all(t['rgbaPixelsChanged']==0 for q in tiles.values()for t in q.values()),tiles
 prior=original_r1_for(key)
 if prior is None:assert edges=={} and key.startswith('s07-390')
 else:
  r=report['neutralCopy'][key]
  r['priorUnequalNativeExact']=check_original_seams(key,PINS['fullBaseline']['spec'][key]['tiles'],edges,resolve,prior['pairs'],{'A':'A','samePaint':'A','post':'A'})
  for e in n['tiles']:
   assert sig_record(n['tiles'][e])==prior['finalNoWrite'][e]
 flush(root,report)
def main(out):
 exact();out.mkdir(parents=True,exist_ok=True);anonymous(out)
 k=PINS['method']['path'];method=checked_method(pinned_fetch(k,PINS['active'][k]))
 k=PINS['method']['outer']['path'];outer=checked_outer(pinned_fetch(k,PINS['active'][k]))
 r={'scope':'Full currently visible exact max-out South Stage7 owner-support stock baseline only; no O copied, no removal','prior':PINS['priorOfficialRun'],'smallR5':PINS['fullBaseline']['r5Run'],'visits':[],'sourceAuthority':{},'neutralCopy':{},'failures':[],'status':'HOLD'}
 try:
  with sync_playwright()as c:
   b=c.chromium.launch(headless=True);r['browser']=b.version;assert b.version=='151.0.7922.34'
   try:
    # Finish one device at a time, to keep browser memory and exported uncompressed evidence bounded.
    for key,v in P.items():
     for label in ('A','O'):
      try:visit(b,out,r,label,key,v,method,outer)
      except Exception as e:r['failures'].append({'label':label,'case':key,'error':repr(e),'trace':traceback.format_exc()});flush(out,r);raise
     a,o=r['visits'][-2:]
     try:plan=seal_o(out,r,key,a,o)
     except Exception as e:r['failures'].append({'label':'A/O','case':key,'error':repr(e),'trace':traceback.format_exc()});flush(out,r);raise
     try:visit(b,out,r,'N',key,v,method,outer,plan);close_n(out,r,key,a,r['visits'][-1],plan)
     except Exception as e:r['failures'].append({'label':'N','case':key,'error':repr(e),'trace':traceback.format_exc()});flush(out,r);raise
   finally:b.close()
  assert len(r['visits'])==6 and not r['failures'] and len(r['neutralCopy'])==2
  r['status']='PASS_MIN_SOUTH_2C4_PER_TILE_STOCK_NEUTRAL_ONLY_NO_ART'
 finally:flush(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
