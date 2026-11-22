import base64,hashlib,io,json,sys
from pathlib import Path
from guard import *
O=json.loads((H/'observer.json').read_bytes())
ASSET=json.loads((H/'asset.json').read_bytes())
URL={'A':'http://127.0.0.1:18764/','B':'http://127.0.0.1:18765/'}
# Poses are clamped by the real app, no expanded levels or modified save.
DIMS={'PC':(1440,900),'M':(390,844)}
V=[]
for dev in DIMS:
 for view,dx,dy,n in [('min-W',-1,0,None),('min-SW',-1,1,None),('near-W',-1,0,[-320,2200,.5]),('near-SW',-1,1,[-320,2867,.5]),
  ('min-S',0,1,None),('min-N',0,-1,None),('min-E',1,0,None)]:
  V.append({'key':f'{dev}-{view}','id':44,'dev':dev,'dx':dx,'dy':dy,'ordinary':n,'positive':('-W' in view or '-SW'in view)})
V.append({'key':'M-s42-control','id':42,'dev':'M','dx':0,'dy':1,'ordinary':None,'positive':False})

SINGLE_MASK=r"""q=>{const c=new OffscreenCanvas(q.w,q.h),v=c.getContext('2d'),s=q.z*3.130755064456722;
 v.setTransform(s,0,0,s,-q.left*q.z,-q.top*q.z);
 v.fillStyle='#fff';v.fill(new Path2D(q.native));return c.convertToBlob().then(async b=>{
 const u=new Uint8Array(await b.arrayBuffer());let x='';for(let j=0;j<u.length;j+=32768)x+=String.fromCharCode(...u.subarray(j,j+32768));return btoa(x);});
}"""
def main(w):
 from playwright.sync_api import sync_playwright
 from PIL import Image,ImageFilter,ImageChops
 o=w/'out'; g=read(o,'GRAPH.json'); res={'status':'HOLD','scope':'exact tracked A and normal source-compiled B, fixed disposable QA fixture (not a playthrough)','views':{}}
 def save():write(o,'BROWSER.json',res)
 def png(k):return Image.open(o/k).convert('RGBA')
 def receipt_file(k,data):
  (o/k).write_bytes(data);return dict(path=k,**fact(data))
 with sync_playwright() as pw:
  br=pw.chromium.launch(headless=True);res['browser']=br.version;need(br.version=='151.0.7922.34','unsupported official runner renderer')
  for dev in DIMS:
   for stage in (44,42):
    todo=[v for v in V if v['dev']==dev and v['id']==stage]
    if not todo:continue
    for side in 'AB':
     host=URL[side]; W,Hh=DIMS[dev]; route=g['routes'][side][str(stage)];rr={};errors=[]
     try:
      c=br.new_context(viewport={'width':W,'height':Hh},device_scale_factor=1,service_workers='block')
      p=c.new_page();p.on('response',lambda r:rr.setdefault(r.url,r) if r.url in {host+k for k in route} else None)
      p.on('pageerror',lambda e:errors.append(str(e)))
      p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
      nav=p.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
      need(nav and nav.status==200 and nav.url==host+'HONRO.html' and not nav.from_service_worker and fact(nav.body())==g['shell'][side],'exact normal own navigation')
      p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
      p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
      need(p.evaluate(O['INIT_MEMORY']),'memory observer availability')
      p.evaluate(O['LAUNCH'],stage);p.locator('#battlecanvas').wait_for(state='visible')
      p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.querySelector('#turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}""",polling=125,timeout=12000)
      for v in todo:
       key=v['key'];r=res['views'].setdefault(key,{}).setdefault(side,{'status':'HOLD','errors':[],'fps':None,'signedOnly':v['positive']}); save()
       try:
        d={'id':stage,'mapId':f'stage-{stage}','name':'ordinary' if v['ordinary'] else 'minimum','dx':v['dx'],'dy':v['dy'],'ordinary':v['ordinary'],'readback':False,'fixedNow':O['PHASE']}
        before=p.evaluate('()=>window.__honro44Mem.draws')
        meta=p.evaluate(O['FROZEN'],d)['meta']
        # Stabilize decode before recording the real scene. Observer runs inline;
        # no request fulfillment or MIME substitutions.
        decode=p.evaluate(O['DECODE']);need(not decode['failed'],decode)
        p.evaluate(O['FROZEN'],{**d,'readback':True})
        for phase in ('first','warm'):
         if phase=='warm':p.evaluate(O['FROZEN'],{**d,'readback':True})
         raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True)
         dom=p.locator('#battlecanvas').screenshot(animations='disabled')
         r[phase]={k:receipt_file(f'{key}-{side}-{phase}-{k}.png',data)for k,data in (('raw',raw),('dom',dom))}
         save()
        r['pose']={k:meta[k]for k in ('actual','viewport','css','backing','phase','sceneTime','round','focus','zoomLimits','tileRasterScale')}
        r['signature']=sha(meta['signature'].encode()); r['memory']=p.evaluate('()=>window.__honro44Mem')
        r['right']=p.evaluate("""()=>HonroEdgeClosureQA.removed.some(v=>v.id==='a5-root-floor'&&!v.walkable&&v.a.x===6700.39&&v.z.x===6700.39&&v.a.y===1733.2&&v.z.y===2269)""") if stage==44 else None
        for path, pin in route.items():
         a=rr.get(host+path);need(a and a.status==200 and not a.from_service_worker and fact(a.body())==pin,('request not the independently pinned file',path))
        need(not errors,errors);need(stage!=44 or r['right'],'approved east/right stroke behavior changed')
        need(r['memory']['peak']<=9,'hard peak resident tile budget exceeded')
        if side=='A' or stage==42:need(not r['memory']['draws'],'art route leak outside candidate real Stage44')
        if side=='B' and stage==44 and not v['positive']:need(r['memory']['draws']==before,'offscreen cache generated candidate art')
        if v['positive'] and side=='B':
         need(r['memory']['draws']>0,'no real native B art draw')
         if key in ('M-min-W','M-min-SW'):
          keys=sorted({(round((2-t[4])/512),round((2-t[5])/512)) for t in r['memory']['transforms'] if abs(t[0]-.0625*3.130755064456722)<1e-10 and abs(t[3]-.0625*3.130755064456722)<1e-10})
          r['realMinMobileTileKeys']=keys
          need(keys==([(-1,0)]if key=='M-min-W'else[(-1,0),(-1,1)]),'mobile cache did not cover exact planned one/two actual tiles')
          need(r['memory']['peak']<=(1 if key=='M-min-W' else 2),'mobile min accumulated more buffers than planned')
        if side=='A' and v['positive']:
         # Mask is planned only from approved ART source + A's actual transform.
         # No data from B. Add native transfer filter support capped to exact model.
         pose=meta;vw=pose['viewport'];z=pose['actual']['scale'];rs=pose['tileRasterScale']
         for kind in ('raw','dom'):
          w0,h0=png(r['first'][kind]['path']).size
          ma=base64.b64decode(p.evaluate(SINGLE_MASK,{**vw,'z':z,'w':w0,'h':h0,'native':ASSET['vector']['clips']['r9-shared-envelope'][0]}))
          alpha=Image.open(io.BytesIO(ma)).convert('RGBA').getchannel('A')
          radius=1+int(__import__('math').ceil(2*z/rs))
          a=alpha.point(lambda u:255 if u else 0).filter(ImageFilter.MaxFilter(2*radius+1))
          complete=io.BytesIO();a.save(complete,format='PNG')
          r.setdefault('signed',{})[kind]=receipt_file(f'{key}-preregistered-{kind}-native-mask.png',complete.getvalue())
        r['status']='ACTUAL_CAPTURED';save()
       except Exception as e:r['errors'].append(repr(e));save();print(key,side,repr(e),flush=True)
     except Exception as e:
      res.setdefault('earlyFailures',[]).append([dev,stage,side,repr(e)]);save()
     finally:
      if 'c' in locals():c.close();del c
  br.close()
 for v in V:
  key=v['key'];visit=res['views'][key];a,b=[visit[s]for s in 'AB']
  need(a['status']==b['status']=='ACTUAL_CAPTURED','both canonical actual renders required: '+key)
  need(a['pose']==b['pose'] and a['signature']==b['signature'],('physical, scene or camera disagreement',key))
  visit['delta']={}
  for phase in ('first','warm'):
   for kind in ('raw','dom'):
    ia,ib=map(lambda r:png(r[phase][kind]['path']),(a,b))
    need(ia.size==ib.size,('layout changed',key));r=ImageChops.difference(ia,ib)
    need(not r.getchannel('A').getbbox(),('full composite alpha changed',key,phase,kind))
    bands=r.split();d=ImageChops.lighter(ImageChops.lighter(bands[0],bands[1]),bands[2]).point(lambda n:255 if n else 0)
    n=d.histogram()[255]
    if v['positive']:
     assert n>0,(key,phase,kind)
     mask=Image.open(o/a['signed'][kind]['path']).convert('L')
     outside=ImageChops.multiply(d,ImageChops.invert(mask))
     assert outside.histogram()[255]==0,(key,phase,kind,'native signed geometry exceeded')
     if key=='M-min-SW':
      need(d.crop((0,d.height-1,d.width,d.height)).histogram()[255]>0,'support does not reach the actual bottom row')
    else:need(n==0,('negative view not pixel exact',key,phase,kind))
    visit['delta'][phase+'-'+kind]=n;save()
 res['status']='PASS_TECHNICAL_SCOPED; W/SW visual inspection still required';save()
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
