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
def visit(br,root,report,label,key,v,method,outer):
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
  targets=PINS['perimeter']['spec'][key]
  assert len(targets)==(2 if v['device'][0]==1440 else 1)
  for j,name in enumerate(('north','east','south'),1):
   cp=page.evaluate('(j)=>__s7Phase(j)',j);dx,dy=DIR[name]
   assert page.evaluate('()=>!Object.hasOwn(HonroApp.scene,"_drawTerrainDomainTiles") && !Object.hasOwn(window,"__s7SouthProbe")')
   if name=='south':
    state['coldReset']=page.evaluate("""()=>{const s=HonroApp.scene,ids=[...s._domainTiles.tiles.keys()];s._releaseDomainTiles();if(s._domainTiles!==null)throw Error('cold-only reset failed');return ids;}""")
    if label=='N':
     page.evaluate(install_script(method,outer),{'stockOuter':outer,'targets':targets})
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
    assert not state['missingSouthTiles'],(key,state['missingSouthTiles'],'observed native South targets missing')
    state['tiles']={}
    for tid in targets:
     nameTile=tid.replace(':','_')
     raw=page.evaluate("""id=>HonroApp.scene._domainTiles.tiles.get(id).canvas.toDataURL('image/png').split(',')[1]""",tid)
     state['tiles'][tid]=store_img(root,f'{label}-{key}-tile-{nameTile}-warm',base64.b64decode(raw,validate=True))
    if label=='N':
     state['nativeHook']=page.evaluate('()=>__s7SouthProbe.health()')
     flush(root,report)
     traces=page.evaluate('()=>__s7SouthProbe.snapshots()')
     state['nativeWitnesses']={}
     for tid,ss in traces.items():
      nameTile=tid.replace(':','_')
      state['nativeWitnesses'][tid]={k:store_img(root,f'{label}-{key}-tile-{nameTile}-{k}',base64.b64decode(v,validate=True))for k,v in ss.items()}
     assert page.evaluate('()=>{const r=__s7SouthProbe.restore();return delete window.__s7SouthProbe&&r;}')
     state['hookRestored']=True
  assert page.evaluate('()=>__s7Restore() && !Object.hasOwn(HonroApp.scene,"_drawTerrainDomainTiles")')
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
 clone=method.replace(one,one+'const _s7Witness=_probe.open(this,b,cc,landmarks,view,rs,id);')
 clone=clone.replace(two,two+'_probe.close(_s7Witness);')
 return """spec=>{"use strict";const G=globalThis;"""+PROBE+"""
  const _probe=makeNeutralProbe(spec),domainPaint=({"""+clone+"""})._drawTerrainDomainTiles,clone=("""+outer+""");
  if(Object.hasOwn(window,'__s7SouthProbe'))throw Error('double neutral install');
  _probe.install(clone);window.__s7SouthProbe=_probe;return true;}"""
def store_img(root,name,raw):
 path=name+'.png';(root/path).write_bytes(raw);im=png(raw)
 return {'path':path,'png':fact(raw),'rgba':sha(im.tobytes()),'size':list(im.size)}
def pixels(root,f):
 im=rgba(root/f['path'])
 assert sha(im.tobytes())==f['rgba'];return im
def difference(a,b):
 assert a.size==b.size
 aa=a.tobytes();bb=b.tobytes()
 where=[(i//4)%a.width for i in range(0,len(aa),4)if aa[i:i+4]!=bb[i:i+4]]
 return {'rgbaPixelsChanged':len(where),'alphaPixelsChanged':sum(x!=y for x,y in zip(aa[3::4],bb[3::4]))}
def closure(root,report):
 rows={}
 for key in P:
  a,n=[next(v for v in report['visits']if v['case']==key and v['label']==label)for label in ('A','N')]
  assert a['status']==n['status']=='EXACT_ACTUAL_VISIT' and n['hookRestored'] is True
  assert set(a['frames'])==set(n['frames'])=={'south','north'}
  assert a['coldReset']==n['coldReset'] and a['nativeMethodProvenance']==n['nativeMethodProvenance']
  assert a['wireMethodTokenSites']==n['wireMethodTokenSites']
  targets=PINS['perimeter']['spec'][key];ids=set(targets)
  assert ids<=set(a['actualSouthTiles'])==set(n['actualSouthTiles'])
  health=n['nativeHook'];assert set(health['opened'])==ids and len(health['rows'])==len(ids)
  assert set(n['nativeWitnesses'])==set(n['tiles'])==set(a['tiles'])==ids
  result={'tiles':{},'frames':{},'gutter':None,'stockMobileR2StructuralExact':None};rendered={}
  for hrow in health['rows']:
   tid=hrow['id'];t=targets[tid];assert all(hrow[k]==t[k]for k in ('rect','matrix','rs'))
   x,y,w,h=t['rect'];e=n['nativeWitnesses'][tid];warmA=a['tiles'][tid];warmN=n['tiles'][tid]
   assert all(q['size']==[516,516]for q in (warmA,warmN,*e.values())) and set(e)=={'stockBefore','scratch','stockAfter'}
   pre,scratch,after=(pixels(root,e[k])for k in ('stockBefore','scratch','stockAfter'))
   alpha=pre.getchannel('A');mask=alpha.crop((x,y,x+w,y+h));hist=mask.histogram();whole=alpha.histogram()
   aw,nw=pixels(root,warmA),pixels(root,warmN)
   rendered[tid]={'stockBefore':pre,'scratch':scratch,'stockAfter':after,'warmA':aw,'warmN':nw}
   result['tiles'][tid]={'scratchVsStock':difference(pre,scratch),'writtenVsStock':difference(pre,after),
           'nativeWarmTileAtoN':difference(aw,nw),'writeRectAlphaRows':[list(mask.crop((0,i,w,i+1)).getdata())for i in range(h)],
           'writeRectAlpha':{'zero':hist[0],'partial':sum(hist[1:255]),'opaque':hist[255]},
           'wholeStructuralTileAlpha':{'zero':whole[0],'partial':sum(whole[1:255]),'opaque':whole[255]}}
   if tid=='0:0':
    prior=PINS['perimeter']['mobilePrior']
    result['stockMobileR2StructuralExact']=all(e['stockBefore'][k]==j for k,j in prior.items())
  if ids=={'0:2','1:2'}:
   box=PINS['perimeter']['pcOverlap']
   result['gutter']={n:difference(rendered['0:2'][n].crop(tuple(box['0:2'])),rendered['1:2'][n].crop(tuple(box['1:2'])))for n in rendered['0:2']}
  # PNG export decodes browser's backing; do not claim direct raw GPU premultiplied byte inspection.
  for direction in ('north','south'):
   av,nv=[q['frames'][direction]for q in (a,n)]
   assert av['before']==nv['before'] and av['declaredRenderPhase']==nv['declaredRenderPhase']
   for phase in ('phase1','phase2'):
    aa,nn=av['phases'][phase],nv['phases'][phase]
    assert aa['dom']['bbox']==nn['dom']['bbox'],'different unmodified CSS capture rectangle'
    result['frames'][direction+'-'+phase]={k:difference(pixels(root,aa[k]),pixels(root,nn[k]))for k in ('raw','dom')}
    result['frames'][direction+'-'+phase]['samePhaseCacheAndState']=aa['cache']==nn['cache'] and aa['native']==nn['native']
    result['frames'][direction+'-'+phase]['historicalRawExact']=aa['historicalExact'] and nn['historicalExact']
  rows[key]=result
 report['comparison']=rows;flush(root,report)
 for r in rows.values():
  for tile in r['tiles'].values():
   assert all(tile[k]['rgbaPixelsChanged']==0 for k in ('scratchVsStock','writtenVsStock','nativeWarmTileAtoN')),r
   assert all(tile['writeRectAlpha'][k]>0 for k in ('zero','partial','opaque')),'expected actual mixed-coverage boundary not proved'
  if r['gutter'] is not None:
   assert set(r['gutter'])=={'stockBefore','scratch','stockAfter','warmA','warmN'}
   assert all(x['rgbaPixelsChanged']==0 for x in r['gutter'].values()),'adjacent native 2px complementary gutter disagreement'
  else:assert r['stockMobileR2StructuralExact'] is True,'old native mobile tile was not repeated exactly'
  for f in r['frames'].values():
   assert f['raw']['rgbaPixelsChanged']==f['dom']['rgbaPixelsChanged']==0 and f['samePhaseCacheAndState'] and f['historicalRawExact'],f
def main(out):
 exact();out.mkdir(parents=True,exist_ok=True);anonymous(out)
 k=PINS['method']['path'];method=checked_method(pinned_fetch(k,PINS['active'][k]))
 k=PINS['method']['outer']['path'];outer=checked_outer(pinned_fetch(k,PINS['active'][k]))
 r={'scope':'Actual public Stage7 bottom AA and adjacent gutter neutral only (no removal, no art)','visits':[],'failures':[],'status':'HOLD','prior':PINS['priorOfficialRun'],'opaqueR2':PINS['perimeter']['r2Run']}
 try:
  with sync_playwright()as c:
   b=c.chromium.launch(headless=True);r['browser']=b.version;assert b.version=='151.0.7922.34'
   try:
    for key,v in P.items():
     for label in ('A','N'):
      try:visit(b,out,r,label,key,v,method,outer)
      except Exception as e:r['failures'].append({'label':label,'case':key,'error':repr(e),'trace':traceback.format_exc()});flush(out,r)
   finally:b.close()
  assert len(r['visits'])==4 and not r['failures']
  closure(out,r)
  r['status']='PASS_STAGE7_SOUTH_NEUTRAL_BOTTOM_GUTTERS_ONLY_NO_REMOVAL'
 finally:flush(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
