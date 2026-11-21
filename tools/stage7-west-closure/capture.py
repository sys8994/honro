"""Native normal Stage7 west-only proof on fresh A1/A2/B; preserve all observed outcomes. Never ship."""
import base64,io,json,math,re,sys,time,traceback
from pathlib import Path
from statistics import median
from PIL import Image
from playwright.sync_api import sync_playwright
from guard import H,BASE,MF,SRC,sha,fact,rd,save
O=json.loads(rd(H,'stock-observer.json'));P=json.loads(rd(H,'POSES.json'));PARK=rd(H,'park.js').decode()
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
def compare(a,img,signed,info):
 assert a.size==img.size
 w,h=a.size;x=a.tobytes();y=img.tobytes()
 if x==y:return {'changed':0,'outside':0,'alpha':0,'max':0,'edgePeak':None,'ok':signed is None}
 alpha=sum(u!=v for u,v in zip(x[3::4],y[3::4]))
 box=signed or [0,0,0,0];xx,yy,xxx,yyy=box
 changed=outside=mx=0
 for k in range(0,len(x),4):
  if x[k:k+4]==y[k:k+4]:continue
  changed+=1;Y,X=divmod(k//4,w)
  outside+=not(xx<=X<xxx and yy<=Y<yyy)
  mx=max(mx,*[abs(x[k+i]-y[k+i])for i in range(4)])
 return {'changed':changed,'outside':outside,'alpha':alpha,'max':mx,
          'ok':outside==alpha==0 and signed is not None and changed>0}
def visit(br,root,report,g,label,key,v):
 arm='B'if label=='B'else 'A';known=g['active'+arm];aliases=g['aliases'];expected_requests=v['requests']
 expected={p if arm=='A'else aliases.get(p,p)for p in expected_requests};assert expected<=known.keys()
 for p,q in expected_requests.items():
  if arm=='A' or p not in aliases and p!='HONRO.html':assert known[p]==q
 origin='http://127.0.0.1:'+('18892'if arm=='B'else '18891')+'/';brx=re.compile('blob:'+re.escape(origin)+r'[0-9a-f-]{36}')
 state={'label':label,'case':key,'phase':'INIT','frames':{},'status':'HOLD'}
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
  state['clockStart']=page.evaluate(CLOCK)
  target=v['stage'];p=v['provider']
  assert page.evaluate(O['LAUNCH'],{'stage':target,'catalogID':p['stage'],'activeDeclaredDimensions':[p['width'],p['height']]})==p
  state['actualProvider']=p
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  for j,(name,(dx,dy)) in enumerate(DIR.items(),1):
   if name not in v['views']:continue
   state['activeFrame']=name;flush(root,report)
   cp=page.evaluate('(j)=>__s7Phase(j)',j)
   q={'stage':target,'id':p['stage'],'name':name,'dx':dx,'dy':dy,'readback':False}
   now=page.evaluate(PARK,q);count=page.evaluate(O['DECODE'])
   rec=state['frames'][name]={'before':now,'decodedDiagnostic':count,'declaredRenderPhase':cp,'phases':{}}
   assert count>0 and all(now[k]==w for k,w in v['views'][name].items()),'archived exact camera/physics changed'
   for phase in PHASES:
    a=page.evaluate(PARK,{**q,'readback':True});assert a==now
    geo=page.evaluate(NATIVE);assert geo.pop('countWest')==(0 if label=='B' else 1)
    raw=base64.b64decode(page.evaluate(O['RAW']),validate=True);im=png(raw)
    path=f'{label}-{key}-{name}-{phase}.png';(root/path).write_bytes(raw)
    rec['phases'][phase]={'native':geo,'path':path,'png':fact(raw),'rgba':sha(im.tobytes()),'cache':page.evaluate(CACHE)}
    if phase.startswith('repeat') and rec['phases'][phase]['png']==rec['phases']['phase2']['png']:
     (root/path).unlink();rec['phases'][phase]['path']=rec['phases']['phase2']['path']
    flush(root,report)
   q2=rec['phases']['phase2']
   assert all(rec['phases'][phase][k]==q2[k]for phase in ('repeat1','repeat2')for k in ('native','png','rgba','cache')),'real matching steady repeats failed'
  assert page.evaluate('()=>__s7Restore()')
  i=0;settled=0;until=time.monotonic()+20
  while time.monotonic()<until:
   assert not err,err
   while i<len(hits)and hits[i][1].request not in todo:
    k,r=hits[i];assert fact(r.body())==known[k],('wrong served bytes',k);checked[k]=known[k];done.add(k);i+=1
   plen=(len(hits),len(blobs));page.wait_for_timeout(105)
   settled=settled+1 if i==len(hits)and not todo and plen==(len(hits),len(blobs))and expected-{'HONRO.html'}<=done else 0
   if settled==3:
    assert blobs<=set(page.evaluate('()=>Array.from(__honroObserver.blobs)'))
    state.update(status='EXACT_ACTUAL_VISIT',required=sorted(expected),verified=sorted(done|{'HONRO.html'}));break
  assert state['status']=='EXACT_ACTUAL_VISIT',(err,sorted(expected-done),len(todo))
 finally:
  state['networkErrors']=err;flush(root,report);ca.close()
def flush(root,x):save(root/'BROWSER.json',x)
def pairs(root,r):
 for key,v in P.items():
  a,again,b=[next(x for x in r['visits']if (x['label'],x['case'])==(tag,key)) for tag in ('A1','A2','B')]
  assert a['status']==again['status']==b['status']=='EXACT_ACTUAL_VISIT'
  for n in v['views']:
   entries=[x['frames'][n]for x in (a,again,b)];k=key+'-'+n
   assert entries[0]['before']==entries[1]['before']==entries[2]['before']
   slot=r['comparisons'][k]={'phases':{},'pass':False}
   info=v.get('signed',{}).get(n,{});signed=info.get('box')
   for name in PHASES:
    a1,a2,bb=[q['phases'][name]for q in entries]
    p,control,out=[rgba(root/q['path'])for q in (a1,a2,bb)]
    stock=(a1['rgba']==a2['rgba'] and control.tobytes()==p.tobytes())
    geom=all(a1[x]==a2[x]==bb[x]for x in ('native','cache'))
    t=compare(p,out,signed,info)
    slot['phases'][name]={'stockRepeatRGBAExact':stock,'geometryAndCacheFootprintExact':geom,**t,
                          'pass':stock and geom and t['ok']}
    flush(root,r)
   slot['pass']=all(x['pass']for x in slot['phases'].values())
def main(w):
 out=w/'out';g=json.loads(rd(out,'GRAPH.json'));r={'scope':'actual detached normal product proof no ship','visits':[],'failures':[],'comparisons':{},'status':'HOLD'}
 try:
  with sync_playwright()as c:
   b=c.chromium.launch(headless=True);r['browser']=b.version;assert b.version=='151.0.7922.34'
   try:
    for tag in ('A1','A2','B'):
     for key,v in P.items():
      try:visit(b,out,r,g,tag,key,v)
      except Exception as e:r['failures'].append({'arm':tag,'case':key,'error':repr(e),'trace':traceback.format_exc()});flush(out,r)
   finally:b.close()
  assert not r['failures']
  pairs(out,r)
  assert len(r['comparisons'])==16 and all(x['pass']for x in r['comparisons'].values())
  assert len(r['visits'])==6
  r['status']='PASS_ACTUAL_STAGE7_WEST_ONLY_NO_RELEASE'
 finally:flush(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
