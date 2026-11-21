"""Native normal Stage14 proof on fresh A1/A2/B; preserve all observed outcomes. Never ship."""
import base64,io,json,math,re,sys,time,traceback
from pathlib import Path
from statistics import median
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
from guard import H,BASE,MF,SRC,sha,fact,rd,save
O=json.loads(rd(H,'stock-observer.json'));P=json.loads(rd(H,'POSES.json'));PARK=rd(H,'park.js').decode(); CLOCK=rd(H,'stage13-clock.js').decode()
DIR={'north':(0,-1),'east':(1,0),'south':(0,1),'west':(-1,0),'northwest':(-1,-1),'northeast':(1,-1),'southwest':(-1,1),'southeast':(1,1)}
PHASES=('phase1','phase2','repeat1','repeat2')
MEDIA={f'assets/bgm/{k}.mp3'for k in ('main','battle-1','battle-2','battle-3','battle-4')}
CACHE='''()=>{const s=HonroApp.scene,r=s.renderCacheStats();return {
 backing:[s.canvas.width,s.canvas.height],caches:['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache'].map(k=>{
  const q=s[k];return [typeof q?.key==='string',q?.canvas?.width??null,q?.canvas?.height??null,q?.bytes??null]
 }), fields:Object.fromEntries(['screenWorldBytes','screenBackgroundBytes','screenForegroundBytes','worldBytes','worldScale','backgroundBytes','domainCanvasAllocations','domainTileBuilds'].map(k=>[k,r[k]??0]))
}}'''
NATIVE='''()=>{const b=HonroApp.engine.b,world=HonroTerrainDomain.render(b),near=b.terrain.find(t=>t.id==='v14-refuge-ground');
 const q={stage:b.honroStage,revs:b.honroCampaignMapRevision,phase:b.phase,round:b.round,world:world.map(t=>[t.id,t.vertices.length]),water:b.water??null,active:HonroTerrainDomain.active(b)};
 if(b.honroStage===14){const t=world.find(t=>t.id==='v14-refuge-ground');const a=near.vertices[13],z=near.vertices[14];
 if(!q.active||t.y+t.h!==30900||near.y+near.h!==5640||a.x!==4800||a.y!==5640||z.x!==0||z.y!==5640)throw Error('incorrect exact projection and visual world owner');
 q.canonicalWitness={declaredBottom:t.y+t.h,closure:[a.x,a.y,z.x,z.y],legalTopOwner:t.id};}
 return q;
}'''
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
 peaks=None
 if signed is not None:
  obs=info['stockContrast'];lx,rx=obs['frameWideCentralPXHalfOpen'];rows=[int(k)for k in obs['rows: [medianRGBDistance, CountAbove8]']]
  assert 0<=lx<rx<=w and all(1<=n<h for n in rows)
  def peak(z):
   return max(median(math.sqrt(sum((z[4*(r*w+j)+k]-z[4*((r-1)*w+j)+k])**2 for k in range(3)))for j in range(lx,rx))for r in rows)
  peaks=[peak(x),peak(y)]
 return {'changed':changed,'outside':outside,'alpha':alpha,'max':mx,'edgePeak':peaks,
          'ok':outside==alpha==0 and signed is not None and peaks[0]>12 and peaks[1]<peaks[0]*.5}
def visit(br,root,report,g,label,key,v):
 arm='B'if label=='B'else 'A';known=g['active'+arm];aliases=g['aliases'];expected_requests=v['requests']
 expected={p if arm=='A'else aliases.get(p,p)for p in expected_requests};assert expected<=known.keys()
 for p,q in expected_requests.items():
  if arm=='A' or p not in aliases and p!='HONRO.html':assert known[p]==q
 origin='http://127.0.0.1:'+('18892'if arm=='B'else '18891')+'/';brx=re.compile('blob:'+re.escape(origin)+r'[0-9a-f-]{36}')
 state={'label':label,'case':key,'phase':'INIT','frames':{},'status':'HOLD'}
 report['visits'].append(state);flush(root,report)
 ca=br.new_context(viewport=dict(zip(('width','height'),v['device'])),device_scale_factor=1,service_workers='block')
 checked={};done=set();todo=set();hits=[];err=[];blobs=set();clock=False
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
  target=v['stage'];p=v['provider'];ck=page.evaluate("""async i=>{await HonroCampaignLoader.ensureStage(i);const t=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===i),q=HONRO_ACT2_COMPACT_PACKAGES[i];
  if(!t||!q||JSON.stringify(t)!==JSON.stringify(q.stage))throw Error('wrong actual compact registered stage');
  return {revision:q.mapRevision,status:t.metadata.compactStatus??null,packageAssetIDs:q.assets.map(a=>a.id),width:t.width,height:t.height};}""",target)
  assert (ck['revision'],len(ck['packageAssetIDs']),ck['width'],ck['height'])==(p['compact']['revision'],v['expectedCompactCount'],p['width'],p['height'])
  if target==13:
   assert page.evaluate(CLOCK)=={'step':0,'ms':60000}
   clock=True;state['stage13Clock']={'installedBeforeLaunch':True,'route':[]}
  assert page.evaluate(O['LAUNCH'],{'stage':target,'catalogID':p['stage'],'activeDeclaredDimensions':[p['width'],p['height']],'compactWitness':ck})==p
  state['actualProvider']=p;state['loadedCompact']=ck
  page.locator('#battlecanvas').wait_for(state='visible')
  page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim');}""",polling=125,timeout=12000)
  index=0
  for name,(dx,dy) in DIR.items():
   if name not in v['views']:continue
   if clock:
    index+=1;ms=60000+index*16
    assert page.evaluate('x=>__honroS13Clock.set(x[0],x[1])',[index,ms])=={'step':index,'ms':ms}
    state['stage13Clock']['route'].append({'name':name,'step':index,'ms':ms})
   state['activeFrame']=name;flush(root,report)
   q={'stage':target,'id':p['stage'],'name':name,'dx':dx,'dy':dy,'readback':False}
   now=page.evaluate(PARK,q);count=page.evaluate(O['DECODE'])
   rec=state['frames'][name]={'before':now,'decodedDiagnostic':count,'phases':{}}
   assert count>0 and all(now[k]==w for k,w in v['views'][name].items()),'archived exact camera/physics changed'
   for phase in PHASES:
    a=page.evaluate(PARK,{**q,'readback':True});assert a==now
    geo=page.evaluate(NATIVE)
    raw=base64.b64decode(page.evaluate(O['RAW']),validate=True);im=png(raw)
    path=f'{label}-{key}-{name}-{phase}.png';(root/path).write_bytes(raw)
    rec['phases'][phase]={'native':geo,'path':path,'png':fact(raw),'rgba':sha(im.tobytes()),'cache':page.evaluate(CACHE),'clock':page.evaluate('()=>__honroS13Clock.observe()') if clock else None}
    flush(root,report)
   q2=rec['phases']['phase2']
   assert all(rec['phases'][phase][k]==q2[k]for phase in ('repeat1','repeat2')for k in ('native','png','rgba','cache','clock')),'real matching steady repeats failed'
  if clock and label=='A1':
   motion={'name':'north','dx':0,'dy':-1,'stage':13,'id':p['stage'],'readback':False}
   cam=page.evaluate(PARK,motion);cam2=page.evaluate(PARK,{**motion,'readback':True}); assert cam==cam2
   raw0=base64.b64decode(page.evaluate(O['RAW']),validate=True);initial=png(raw0)
   baseline_name=f'{label}-{key}-north-motion-control.png';(root/baseline_name).write_bytes(raw0)
   browser=page.evaluate('()=>__honroS13Clock.observe()'); ms=browser['ms']; native=page.evaluate(NATIVE)
   state['stage13Clock']['motionPositive']=[]
   for k in range(1,10):
    nxt=ms+100;index+=1
    assert page.evaluate('x=>__honroS13Clock.set(x[0],x[1])',[index,nxt])=={'step':index,'ms':nxt}
    assert page.evaluate(PARK,{**motion,'readback':True})==cam and page.evaluate(NATIVE)==native
    new=page.evaluate('()=>__honroS13Clock.observe()')
    vel=browser['v']+(browser['wind']*1.6-browser['v'])*.025
    assert new['ms']==nxt and new['wind']==browser['wind'] and abs(new['v']-vel)<1e-10
    assert abs(new['x']-(browser['x']+(vel+4)*.1))<1e-10 and new['x']!=browser['x']
    motion_raw=base64.b64decode(page.evaluate(O['RAW']),validate=True);after=png(motion_raw)
    motion_bounds=[0,max(0,math.floor(.06*after.height)-1),after.width,min(after.height,math.ceil(.16*after.height+220*.8*after.width/1280)+1)]
    red,green,blue,alpha=ImageChops.difference(initial,after).split()
    combined=ImageChops.lighter(ImageChops.lighter(red,green),ImageChops.lighter(blue,alpha))
    count=sum(combined.histogram()[1:]); outside=count-sum(combined.crop(tuple(motion_bounds)).histogram()[1:])
    z=sum(alpha.histogram()[1:]); diff=combined.getbbox()
    name=f'{label}-{key}-north-motion-{k}.png';(root/name).write_bytes(motion_raw)
    state['stage13Clock']['motionPositive'].append({'ms':nxt,'pixels':count,'outside':outside,'alpha':z,'x':new['x'],'v':new['v'],
         'bound':motion_bounds,'diff':diff,'A0':{'file':baseline_name,**fact(raw0)},'Alater':{'file':name,**fact(motion_raw)}})
    assert outside==z==0,'clock motion changed pixels unrelated to native clouds'
    if count>0: break
    browser=new;ms=nxt
   assert state['stage13Clock']['motionPositive'][-1]['pixels']>0,'clock changes did not show native cloud motion'
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
  if clock:
   assert page.evaluate('()=>__honroS13Clock.restore()')
   clock=False;state['stage13Clock']['restored']=True
 finally:
  if clock:
   try:state['stage13Clock']['restoredAfterFailure']=page.evaluate('()=>__honroS13Clock.restore()')
   except Exception as e:state['stage13Clock']['restoreFailure']=repr(e)
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
    geom=all(a1[x]==a2[x]==bb[x]for x in ('native','cache','clock'))
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
  assert len(r['comparisons'])==28 and all(x['pass']for x in r['comparisons'].values())
  assert len(r['visits'])==18 and sum(bool(x.get('stage13Clock',{}).get('restored')) for x in r['visits'])==6
  r['status']='PASS_ACTUAL_STAGE14_ONE_NONWALK_INK_CLOSURE_NO_RELEASE'
 finally:flush(out,r)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
