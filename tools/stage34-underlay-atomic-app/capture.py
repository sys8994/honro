from pathlib import Path
import hashlib,json,os
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
from playwright.sync_api import sync_playwright
Q=Path(__file__).parent; O=Path(os.environ['OUT'])
info=json.loads((O/'asset-contract.json').read_text()); guards=json.loads((Q/'independent-support-mask.json').read_text()); K=info['keys']
known=json.loads((Q/'old-stitch-anchors.json').read_text())
prior=json.loads((Q/'prior-stock-receipts.json').read_text())
assert len(known['PC-SE'])==315 and len(known['Mobile-SE'])==104
mask=np.zeros((1024,1536),bool)
for y,*p in guards['rows']:
 assert len(p)%2==0
 for a,b in zip(p[::2],p[1::2]):mask[y,a:b]=True
assert mask.sum()==guards['numPixels']==61035
jobs=[('PC-SE',1440,900,1e6,1e6),('Mobile-SE',390,844,1e6,1e6),('PC-NW-control',1440,900,-1e6,-1e6),('PC-SE-phase',1440,900,6417,4305)]
frames={}; md5=lambda s:hashlib.sha256(s.encode()).hexdigest()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True)
 for tag,port in [('stock',8884),('trial',8885)]:
  for label,w,h,cx,cy in jobs:
   ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
   page=ctx.new_page();errors=[];issues=[]
   page.on('pageerror',lambda e:errors.append(str(e)));page.on('requestfailed',lambda r:issues.append([r.url,r.failure]))
   page.add_init_script("Date.now=()=>1794931200000;let qaSeed=3910;Math.random=()=>((qaSeed=(qaSeed*1664525+1013904223)>>>0)/2**32);window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
   try:
    page.goto(f'http://127.0.0.1:{port}/HONRO.html',wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
    page.evaluate("""(cfg)=>{
      const V=HonroVectorArt,d=V.draw;if(typeof d!=='function')throw Error('Missing live vector');
      const o=window.__s34Observe={owners:{},poses:{},count:{}};
      V.draw=function(c,a,i){if(a?.id?.startsWith('approved34:')){
        o.count[a.id]=(o.count[a.id]||0)+1;
        o.poses[a.id]={x:i.x,y:i.y,scale:i.scale??1,rotation:i.rotation??0};
        if(!Object.hasOwn(o.owners,a.id))o.owners[a.id]=JSON.stringify(a);
        if(a.id===cfg.id&&Object.keys(a.vector.clips).join()!==cfg.clipKeys.join())throw Error('Unexpected actual vector');
      }return d.apply(this,arguments);};
    }""",{'id':info['id'],'clipKeys':['source-alpha-silhouette']})
    page.evaluate("""async ()=>{
      const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
      await HonroCampaignLoader.ensureStage(34);
      for(let n=1;n<34;n++)a.profile.cleared[n]=true;
      for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(34).entryLevel);
      a.launch(34);if(a.engine?.b?.honroStage!==34)throw Error('Wrong launch stage');
      for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
      if(a.dialogue)throw Error('Unclosed initial dialogue');
      a.close();HonroStoryFraming.clear(a.scene);
    }""")
    cv=page.locator('#battlecanvas');cv.wait_for(state='visible');page.wait_for_timeout(1500)
    page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner visible');Object.defineProperty(performance,'now',{configurable:true,value:()=>100000});}")
    details=page.evaluate("""([x,y])=>{
       const a=HonroApp,s=a.scene,b=a.engine.b,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===34);
       if(!st||b.honroStage!==34)throw Error('Not normal actual Stage34');
       const c=s.canvas.getBoundingClientRect(),z=HonroBounds.zoomLimits(c.width).min;
       HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x,y,scale:z});
       HonroBounds.constrain(s,b);
       const cam=()=>({x:s.x,y:s.y,scale:s.scale}),before=cam();
       // Normalize observation and cold cache AFTER initial narrative and matched camera.
       // Both App arms reset exactly the same visual-only cache; no world mutation.
       if(typeof s._releaseDomainTiles!=='function')throw Error('Missing actual tile cache');
       s._releaseDomainTiles();globalThis.HonroStage34ArmReadbackDiagnostic?.();
       const state=()=>JSON.stringify({terrain:b.terrain,physical:b.honroTerrainDomain||null,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives,routes:st.routes,playBounds:st.playBounds,terrainBounds:st.terrainBounds,elements:st.elements,environment:st.environment,world:b.honroEnvironment,readability:HonroTerrainReadability.prepare(b)});
       s.render(a.engine,0,'',.6,false,0);const s1=state();
       s.render(a.engine,0,'',.6,false,0);if(s1!==state()) throw Error('Render mutated world state');
       if(JSON.stringify(before)!==JSON.stringify(cam()))throw Error('Actual camera changed');
       return {state:s1,camera:cam(),viewport:HonroBounds.viewport(s,c.width,c.height),css:{width:c.width,height:c.height},backing:[s.canvas.width,s.canvas.height],terrainCount:b.terrain.length,actorCount:b.units.length};
    }""",[cx,cy])
    page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
    page.evaluate("()=>{const a=HonroApp;if(window.__qaImages.some(i=>i.src&&i.complete&&!i.naturalWidth))throw Error('Decoded image failure');a.scene.render(a.engine,0,'',.6,false,0);}")
    shot=cv.screenshot(path=str(O/f'{tag}-{label}.png'),animations='disabled');details['rasterSha']=hashlib.sha256(shot).hexdigest()
    result=page.evaluate("()=>window.__s34Observe")
    aid=info['id']
    assert result['count'].get(aid,0)>0,(tag,label,result['count'])
    assert result['poses'][aid]=={'x':-1536,'y':-256,'scale':1,'rotation':0},result['poses']
    held={k:md5(v)for k,v in result['owners'].items()}
    assert held[aid]==info['oldAssetSha'],(tag,label,held[aid])
    rec=page.evaluate("()=>typeof HonroStage34AtomicReceipt==='function'?HonroStage34AtomicReceipt():null")
    if tag=='stock':
     assert rec is None
    else:
     assert rec and rec['fallbacks']==0 and rec['stockCalls']==rec['cutCalls']==rec['hit'] and rec['allocations']==rec['releases'],(label,rec)
     if label.endswith('control'):assert rec['hit']==0 and rec['allocations']==0,rec
     else:
      assert rec['hit']>0 and rec['readbackBytes']>0 and all(a['W']==a['H']==516 and a['minAlpha']==255 and a['checked']>0 and a['readbackBytes']>0 for a in rec['tiles']),rec
      assert rec['checkedOpacityCells']==sum(a['checked'] for a in rec['tiles']) and rec['readbackBytes']==sum(a['readbackBytes'] for a in rec['tiles']),rec
     # Repeat actual same camera on warm static domain tile path: bounded scratch is not repeated.
     warmed=page.evaluate("()=>{const a=HonroApp;for(let i=0;i<3;i++)a.scene.render(a.engine,0,'',.6,false,0);return HonroStage34AtomicReceipt();}")
     assert warmed['allocations']==rec['allocations'] and warmed['hit']==rec['hit'],(label,rec,warmed)
    details['stats']=rec;details['nativeFoundationDrawCalls']=result['count'][aid]
    details['owners']=held;details['poses']=result['poses'];details['stateSha']=md5(details.pop('state'))
    frames.setdefault(label,{})[tag]=details
    assert not errors and not issues,{'script':errors,'network':issues}
   except Exception as e:
    (O/(f'capturing-{tag}-{label}.failure.json')).write_text(json.dumps({'error':str(e),'pageErrors':errors,'requests':issues,'receipt':page.evaluate("()=>globalThis.HonroStage34AtomicReceipt?.()??null")},indent=2));raise
   finally:
    (O/'frames.json').write_text(json.dumps(frames,indent=2));ctx.close()
 b.close()
assert set(frames)=={x[0] for x in jobs} and all(set(v)=={'stock','trial'} for v in frames.values())
checks={}
for label,(stock,trial) in [(l,(v['stock'],v['trial'])) for l,v in frames.items()]:
 for k in ['stateSha','camera','viewport','css','backing','terrainCount','actorCount','poses','nativeFoundationDrawCalls']:assert stock[k]==trial[k],(label,k)
 assert all(stock[k]==prior[label][k] for k in prior[label]),{'prior':prior[label],'actual':{k:stock[k] for k in prior[label]}}
 aid=info['id']
 assert {k:v for k,v in stock['owners'].items() if k!=aid}=={k:v for k,v in trial['owners'].items() if k!=aid},label
 x=np.array(Image.open(O/f'stock-{label}.png').convert('RGB'),dtype=np.int16)
 y=np.array(Image.open(O/f'trial-{label}.png').convert('RGB'),dtype=np.int16)
 d=np.abs(x-y).max(2);rows,cols=d.shape;v=stock['viewport']
 # Predrawn safe change mask, from independent Inkscape source pixels only (no actual-frame fit).
 wx=v['left']+(np.arange(cols)+.5)*(v['right']-v['left'])/cols; wy=v['top']+(np.arange(rows)+.5)*(v['bottom']-v['top'])/rows
 px=np.floor((wx+1536)/6).astype(int);py=np.floor((wy+256)/6).astype(int)
 ar=mask[np.clip(py,0,1023)[:,None],np.clip(px,0,1535)[None,:]] & ((py>=0)&(py<1024))[:,None] & ((px>=0)&(px<1536))[None,:]
 support=np.asarray(Image.fromarray(ar.astype('uint8')*255).filter(ImageFilter.MaxFilter(11)))>0
 checks[label]={'changed':int((d>0).sum()),'changedGt1':int((d>1).sum()),'outsideSupport':int(((d>0)&~support).sum()),'outsideGt1':int(((d>1)&~support).sum()),'physicalAndOtherOwnersEqual':True,'safeMaskN':int(support.sum())}
 if label.endswith('control'):assert not (d>0).any(),checks[label]
 else: assert (d>1).any(),checks[label]
 if not label.endswith('control'):
  ex=[];raw=trial['stats'];tileStep=512/raw['tiles'][0]['rs']
  for world in [wx,wy]:
   axis=np.zeros(len(world),bool)
   for t in np.arange(np.floor(world.min()/tileStep)*tileStep,world.max()+tileStep,tileStep):
    axis|=np.abs(world-t)<=abs(world[1]-world[0])*1.2
   ex.append(axis)
  cross=ex[1][:,None]|ex[0][None,:]
  checks[label]['tileEdgePositiveChangesOutsideGuardGt1']=int(((d>1)&cross&~support).sum())
  # Fixed old authored flat boundary samples, chosen from the frozen prior stock
  # and earlier independently viewed repair. Compare native RGB neighbor contrast
  # across a five-pixel line envelope; do not tune windows against this trial.
  lines={}
  for ax,oldLine,lo,hi,name in [(0,7680,3340,5520,'authored-flat-east'),(1,5888,6700,7550,'authored-flat-bottom')]:
   ind=int(np.argmin(abs((wx if ax==0 else wy)-oldLine)))
   sel=((wy if ax==0 else wx)>=lo)&((wy if ax==0 else wx)<hi)
   assert sel.sum()>30 and 3<=ind<(cols if ax==0 else rows)-3,(label,ax,ind)
   v0=[]
   for img in [x,y]:
    if ax==1:img=img.transpose(1,0,2)
    q=np.abs(img[:,ind-2:ind+3]-img[:,ind-3:ind+2]).max(2).max(1)[sel]
    v0.append({'median':float(np.median(q)),'mean':float(q.mean()),'gt1Samples':int((q>1).sum())})
   lines[name]={'world':[oldLine,lo,hi],'sampleCount':int(sel.sum()),'stock':v0[0],'trial':v0[1],
       'reduced':v0[0]['median']>0 and v0[1]['median']<v0[0]['median']}
  checks[label]['oldFlatLineRepair']=lines
  checks[label]['diagnosticReadback']={'rawRgbaBytes':raw['readbackBytes'],'allTouchedPixelsOpaque':all(t['minAlpha']==255 for t in raw['tiles']),
      'cellsActuallyWeighted':raw['checkedOpacityCells'],'transfers':raw['cutCalls'],'stockCallsInTransferredTiles':raw['stockCalls'],
      'readbackMS':sum(t['readMS'] for t in raw['tiles']),'cpuAndRasterDiagnosticMS':sum(t['ms'] for t in raw['tiles']),
      'estimatedSingleCropPeakBytes':raw['peakBytes'],'readbackAndTimingNotShippingBenchmarks':True}

 if label in known:
  # Same anchors from previous failed actual App. This test uses raw 1:1 canvas pixels.
  xy=np.array(known[label],dtype=int);jx,jy=xy.T
  now=np.maximum(y[jy,jx-2],y[jy,jx+2]);then=x[jy,jx]
  spikes=(y[jy,jx]-now).max(1);diffs=(y[jy,jx]-then).max(1)
  assert (label=='PC-SE' and (rows,cols)==(770,1440) and stock['backing']==[1440,769]) or (label=='Mobile-SE' and (rows,cols)==(648,390)),(label,rows,cols,stock['backing'])
  assert abs(stock['camera']['x']-6464)<1e-8 and abs(stock['camera']['y']-4336)<1e-8,stock['camera']
  checks[label]['oldKnownStitchAnchors']=len(jx)
  checks[label]['stitchesGt4StillThere']=int(((spikes>=5)&(diffs>=5)).sum())
  checks[label]['maximumExcessOverLocalNeighbors']=int(spikes.max())
(O/'comparison.json').write_text(json.dumps(checks,indent=2))
assert all(not c['outsideGt1'] and not c.get('stitchesGt4StillThere',0) and not c.get('tileEdgePositiveChangesOutsideGuardGt1',0) and all(q['reduced'] for q in c.get('oldFlatLineRepair',{}).values()) for c in checks.values()),checks
print(json.dumps(checks))
