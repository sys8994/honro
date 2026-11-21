"""Normal compiled App pairs; save all integrity-valid images before the strict ROI gate."""
import base64,hashlib,io,json,math,sys,time
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes());E=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[1])/'out'; G=json.loads((OUT/'GRAPH.json').read_bytes())
proof={'status':'HOLD_IN_PROGRESS','scope':'Actual paired normal compiled apps, synthetic in-memory campaign only. No request body substitution or playthrough.','frames':{},'http':{}}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def dump(): (OUT/'BROWSER.json').write_text(json.dumps(proof,indent=2)+'\n')
def decode(b):return Image.open(io.BytesIO(b)).convert('RGBA')
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
CHECK="""()=>{const a=HonroApp,b=a.engine.b,s=a.scene;
 if(!b.honroCanonical||b.honroCustom||b.honroMapOrigin!=='campaign'||!HonroTerrainDomain.active(b))throw Error('not actual canonical scenario');
 const p=HonroTerrainReadability.prepare(b);
 const groups=p.groups.map(g=>({id:g.id,segments:g.segments}));
 const stage=HONRO_PROJECT.stages.find(x=>x.id===b.honroAuthoredId);
 const assetIDs=stage.elements.map(c=>c.assetId);
 const art=HONRO_PROJECT.library.filter(e=>assetIDs.includes(e.id));
 return{authored:b.honroAuthoredId,stage:b.honroStage,allSegments:groups,map:JSON.stringify(stage),
    registeredArt:JSON.stringify(art),domain:JSON.stringify(HonroTerrainDomain.render(b)),
    raster:s._worldRasterScale(b,s.canvas.clientWidth),closure:groups.find(g=>g.id==='root-floor')?.segments.filter(s=>s.a.x===5732.24&&s.z.x===-1200&&s.a.y===5069.18&&s.z.y===5069.18&&s.walkable===false).length??0};
}"""
def capture(browser,mode,css,stage,shots):
 base=f'http://127.0.0.1:{18841 if mode=="A" else 18842}/'
 evidence=G[mode]; w,h=css
 ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
 assert ctx.storage_state()=={'cookies':[],'origins':[]}
 page=ctx.new_page();page.set_default_timeout(25000)
 pending=set(); hits=[]; blobs=[];errors=[];seen={};media=set()
 def rel(u):return u[len(base):] if u.startswith(base) and '?' not in u and '#' not in u else None
 def route(r):
  q=r.request;k=rel(q.url)
  if q.url.startswith(('blob:'+base,'data:')) or q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media'):
   return r.continue_()
  errors.append(['request',q.url]);return r.abort()
 def response(r):
  q=r.request;k=rel(q.url)
  if r.url.startswith('blob:'+base) and r.status==200:blobs.append(r.url)
  elif k in P['media'] and q.resource_type=='media' and r.status in (200,206):media.add(k)
  elif k in evidence and r.status==200 and q.method=='GET':hits.append((k,r))
  else:errors.append(['response',r.status,r.url])
 def fail(q):
  if not (rel(q.url) in P['media'] and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
   errors.append(['failure',q.url,q.failure])
 ctx.route('**/*',route)
 page.on('request',lambda q:pending.add(q) if rel(q.url) in evidence else None)
 page.on('requestfinished',lambda q:pending.discard(q))
 page.on('requestfailed',lambda q:pending.discard(q))
 page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 page.on('requestfailed',fail);page.on('response',response)
 page.add_init_script('('+E['INIT']+')()')
 try:
  shell=page.goto(base+'HONRO.html',wait_until='domcontentloaded')
  assert shell and shell.url==base+'HONRO.html' and shell.status==200 and facts(shell.body())==evidence['HONRO.html']
  page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'")
  page.evaluate(E['LAUNCH'],stage); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
  page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
  page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
  for f in shots:
   k=f['key'];view=f['view']
   q={'id':stage,'mapId':f'stage-{stage}','name':view,'dx':-1 if 'west' in view else 1 if 'east' in view else 0,
     'dy':1 if 'south' in view else 0,'ordinary':f['ordinary'],'readback':False}
   proof['active']={'key':k,'arm':mode,'phase':'before camera/readiness'};dump()
   meta=page.evaluate(E['PARK'],q)
   dd=page.evaluate(E['DECODE']);assert dd['registered']>0 and not dd['failed']
   assert meta==page.evaluate(E['PARK'],{**q,'readback':True})
   assert all(meta[n]==f[n]for n in ('actual','viewport','focus','css','backing','sceneTime','phase','round','tide','actorCount')),('reference camera or state changed',k,mode,meta)
   info=page.evaluate(CHECK);assert info['stage']==stage and info['authored']==f'stage-{stage}' and info['raster']>0
   if stage==7:assert info['closure']==(1 if mode=='A' else 0),('actual closing path guard failed',k,mode)
   rb=base64.b64decode(page.evaluate(CANVAS),validate=True); db=canvas.screenshot(animations='disabled')
   for kind,v in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}-{kind}.png').write_bytes(v)
   (OUT/f'{k}-{mode}-geometry.json').write_text(json.dumps(info['allSegments'],separators=(',',':'))+'\n')
   proof['frames'].setdefault(k,{})[mode]={'raw':facts(rb),'dom':facts(db),'mapSHA256':sha(info['map'].encode()),
     'registeredArtSHA256':sha(info['registeredArt'].encode()),'domainSHA256':sha(info['domain'].encode()),
     'physicsSHA256':sha(meta['signature'].encode()),
     'archiveCameraReferenceOriginalPNG':f['pngSHA256'],'raster':info['raster'],'observedClosure':info['closure'],
     'camera':{n:meta[n]for n in ('actual','viewport','css','backing')}};dump()
  i=quiet=0; deadline=time.monotonic()+12
  while time.monotonic()<deadline:
   assert not errors,errors
   while i<len(hits) and hits[i][1].request not in pending:
    k,r=hits[i]; seen[k]=facts(r.body()); assert seen[k]==evidence[k],('actual loaded response differs',k)
    i+=1
   created=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
   before=(i,len(blobs));page.wait_for_timeout(100)
   idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=created
   quiet=quiet+1 if idle else 0
   if quiet==3:break
  proof['http'][f'{stage}-{w}x{h}-{mode}']={'verified':seen,'media':sorted(media),'errors':errors};dump()
  assert quiet==3 and not errors,('HTTP/image drain',errors)
  if stage==7:assert set(G['stage7MustObserve'+mode])<=seen.keys()
  return set(seen)
 finally:ctx.close()
def compare(f):
 key=f['key'];a,b=(proof['frames'][key][m]for m in ('A','B'))
 parity=('mapSHA256','registeredArtSHA256','domainSHA256','physicsSHA256','raster','camera')
 assert all(a[n]==b[n]for n in parity),('actual geometry/map/art/physics/camera changed',key)
 g0,g1=[json.loads((OUT/f'{key}-{m}-geometry.json').read_bytes())for m in ('A','B')]
 if f['id']==7:
  group=next(x for x in g0 if x['id']=='root-floor')
  sole={'a':{'x':5732.24,'y':5069.18},'z':{'x':-1200,'y':5069.18},'walkable':False}
  assert group['segments'].count(sole)==1
  group['segments'].remove(sole)
 assert g0==g1,('special nonwalk edge was not the only stroke path change',key)
 v=f['viewport']; z=f['actual']['scale'];r=a['raster']; pad=math.ceil(2.5*z/r+1)
 startx=(-1200-v['left'])*z;endx=(5732.24-v['left'])*z; y=(5069.18-v['top'])*z
 vis=f['id']==7 and 0<=y<f['backing'][1] and endx>=0 and startx<f['backing'][0]
 result={'lineTargetInActualViewport':vis,'signedRasterPad':pad,'modes':{}}
 for kind in ('raw','dom'):
  a,b=[decode((OUT/f'{key}-{m}-{kind}.png').read_bytes())for m in ('A','B')]
  assert a.size==b.size
  diff=ImageChops.difference(a,b);assert not diff.getchannel('A').getbbox(),('opacity changed',key,kind)
  box=diff.convert('RGB').getbbox()
  x0,y0,x1,y1=(max(0,math.floor(startx-pad)),max(0,math.floor(y-pad)),min(a.width,math.ceil(endx+pad)),min(a.height,math.ceil(y+pad)))
  result['modes'][kind]={'changedLTRB':box,'signedLTRB':[x0,y0,x1,y1],'exactProtected':box is None or vis and x0<=box[0]<=box[2]<=x1 and y0<=box[1]<=box[3]<=y1}
  assert (box is not None)==vis,('expected visible stroke removal or exact offscreen control',key,kind,box)
  assert result['modes'][kind]['exactProtected'],('changed outside signed stroke pad',key,kind,result)
  if vis and kind=='raw':
   x=round((max(x0,0)+min(x1,a.width))/2);mask=(max(0,x-80),y0,min(a.width,x+80),y1)
   a.crop(mask).save(OUT/f'{key}-A-line-witness.png');b.crop(mask).save(OUT/f'{key}-B-line-witness.png')
 proof['frames'][key]['verification']=result;dump()
def main():
 assert P['enable'] is True and G['activeAssetsAnd50MapsExact'] and G['orderedModulesExactOutsideReadability']
 normalize={b:a for a,b in G['allRenamedPaths']}
 try:
  with sync_playwright() as w:
   b=w.chromium.launch(); assert b.version==P['oldBrowser']
   for stage in (7,3,6):
    for css in ((1440,900),(390,844)):
     shots=[f for f in P['frames']if f['id']==stage and tuple(f['viewportCSS'])==css]
     assert len(shots)==(5 if stage==7 else 1)
     a,c=(capture(b,mode,css,stage,shots)for mode in ('A','B'))
     assert a=={normalize.get(k,k)for k in c},('network path differences outside generated authorized renames',stage,css)
   b.close()
  result=[]
  for f in P['frames']:
   try:compare(f)
   except AssertionError as e:result.append({'key':f['key'],'error':repr(e)})
  proof['latePixelGateMismatches']=result
  assert not result,result
  assert len(proof['frames'])==14
  proof['status']='PASS_EXACT_SCOPED_STAGE7_FALSE_BOTTOM_LINE';proof.pop('active',None)
 except Exception as e:proof.update(status='HOLD',error=repr(e));raise
 finally:dump()
if __name__=='__main__':main()
