import hashlib,json,os
from pathlib import Path
from collections import Counter
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
o=Path(os.environ['OUT']);o.mkdir(parents=True,exist_ok=True)
cams=[('overview',0,0),('south',0,1),('west',-1,0),('east',1,0),('southwest',-1,1),('southeast',1,1)]
H=lambda s:hashlib.sha256(s.encode()).hexdigest()
frames={}
def save(name,data):(o/name).write_text(json.dumps(data,indent=2)+'\n')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for arm,port in [('stock',8884),('off',8885)]:
  frames[arm]={}
  for sid,w,h in [(7,1440,900),(7,390,844),(6,1440,900)]:
   ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1)
   page=ctx.new_page();errors=[];fails=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('requestfailed',lambda req:fails.append([req.url,req.failure]))
   page.add_init_script("Date.now=()=>1794931200000;let qaSeed=3910;Math.random=()=>((qaSeed=(qaSeed*1664525+1013904223)>>>0)/2**32);window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
   try:
    page.goto(f'http://127.0.0.1:{port}/HONRO.html',wait_until='domcontentloaded',timeout=120000)
    page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
    page.evaluate('''sid=>{
      const V=HonroVectorArt,d=V.draw;if(typeof d!=='function')throw Error('no live vector renderer');
      const z=globalThis.__s7Obs={count:0,asset:null};
      V.draw=function(c,a,i){
        if(a?.id==='act1-site:7:body'){
          z.count++;if(HonroApp.engine?.b?.honroStage!==7)throw Error('incorrect live Stage7 draw');
          if(a.params?.sourceSha256!=='acbffaafb8a346e3c28d039a17f8d1dd1f2f525b1563860727e45d3bf4651193')throw Error('wrong approved source');
          if(!z.asset)z.asset={data:a,place:{x:i.x,y:i.y,scale:i.scale,rotation:i.rotation||0}};
          else if(z.asset.data!==a&&JSON.stringify(z.asset.data)!==JSON.stringify(a))throw Error('different effective BODY observed');
        }
        return d.apply(this,arguments);
      };
    }''',sid)
    page.evaluate('''async sid=>{
      const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
      await HonroCampaignLoader.ensureStage(sid);
      for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
      for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
      a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Wrong launch stage');
      for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
      if(a.dialogue)throw Error('Entry dialogue still active');
      a.close();HonroStoryFraming.clear(a.scene);
    }''',sid)
    canvas=page.locator('#battlecanvas'); canvas.wait_for(state='visible')
    page.wait_for_timeout(1500)
    page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner visible');Object.defineProperty(performance,'now',{configurable:true,value:()=>100000});}")
    for name,dx,dy in (cams if sid==7 else [('south',0,1)]):
     frame=page.evaluate('''q=>{
       const a=HonroApp,b=a.engine.b,s=a.scene,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);
       if(!st||b.honroStage!==q.sid)throw Error('Wrong actual stage');
       const rect=s.canvas.getBoundingClientRect(),z=HonroBounds.zoomLimits(rect.width).min;
       const requested={x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
       HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
       HonroBounds.constrain(s,b);
       const camera=()=>({x:s.x,y:s.y,scale:s.scale}),expected=camera();
       const state=()=>JSON.stringify({terrain:b.terrain,physical:b.honroTerrainDomain||null,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives,
         routes:st.routes,playBounds:st.playBounds,terrainBounds:st.terrainBounds,elements:st.elements});
       const orig=state();s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
       if(orig!==state())throw Error('Capture mutated gameplay state');
       const k=HonroBounds.focus(b),ca=camera(),viewport=HonroBounds.viewport(s,rect.width,rect.height);
       if(JSON.stringify(expected)!==JSON.stringify(ca)||ca.x<k.left-1e-6||ca.x>k.right+1e-6||ca.y<k.top-1e-6||ca.y>k.bottom+1e-6)throw Error('Incorrect actual camera');
       const root=b.terrain.find(t=>t.id==='root-floor');
       const ink=q.sid===7?HonroTerrainReadability.prepare(b).groups.find(g=>g.id==='root-floor')?.segments:null;
       return {state:orig,camera:ca,viewport,css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],
         terrainCount:b.terrain.length,actorCount:b.units.length,root:root||null,ink:ink||null};
     }''',{'sid':sid,'dx':dx,'dy':dy})
     page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
     page.evaluate("()=>{const a=HonroApp;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Loaded image did not decode: '+unknown.join(', '));a.scene.render(a.engine,0,'',.6,false,0);}")
     id=f's{sid:02d}-{w}x{h}-{name}'
     data=canvas.screenshot(path=str(o/f'{arm}-{id}.png'),animations='disabled')
     frame['physicsSha']=H(frame.pop('state'));frame['rasterSha']=hashlib.sha256(data).hexdigest()
     frame.update(id=id,stage=sid,view=name)
     ex={'x':0 if dx<0 else (4532.24 if dx>0 else 2266.12),'y':3569.18 if dy>0 else 1784.59,'scale':w/6800}
     if sid==7:assert all(abs(ex[k]-frame['camera'][k])<1e-8 for k in ex),(id,arm,frame['camera'])
     frames[arm][id]=frame
    result=page.evaluate('''()=>window.__s7Obs''')
    if sid==7:
     assert result['count']>0 and result['asset'],('Stage7 drawing owner not observed',arm,w,result)
     pose=result['asset']['place'];assert pose==dict(x=0,y=0,scale=3.13,rotation=0),pose
     a=result['asset']['data'];v=a['vector'];ids=[i.get('clipPath',i.get('symbol')) for i in v['root']['children']]
     expect=['source']+['site-crop-'+str(n) for n in range(13)]+(['site-edge-'+str(n) for n in range(3)] if arm=='stock' else [])
     assert ids==expect,(arm,ids)
     shade=a['params']['sourceSha256'];assert shade=='acbffaafb8a346e3c28d039a17f8d1dd1f2f525b1563860727e45d3bf4651193'
     save(f'owner-{arm}-{w}.json',result)
    else:assert result['count']==0,result
    assert not errors and not fails,{'scriptErrors':errors,'requestFailures':fails}
   finally:
    save('frames.json',frames); ctx.close()
 browser.close()
assert len(frames['stock'])==len(frames['off'])==13
def read(x):return json.loads((o/x).read_text())
for w in (1440,390):
 v1=read(f'owner-stock-{w}.json')['asset']['data'];v2=read(f'owner-off-{w}.json')['asset']['data']
 end=v1['vector']['root']['children'][-3:];v1['vector']['root']['children']=v1['vector']['root']['children'][:-3]
 assert [n['clipPath'] for n in end]==['site-edge-0','site-edge-1','site-edge-2']
 assert v1==v2,('Observed runtime draw asset changed beyond the three children',w)
comps={}
for id,a in frames['stock'].items():
 b=frames['off'][id]
 for k in ['physicsSha','camera','viewport','css','backing','terrainCount','actorCount','root','ink']:assert a[k]==b[k],(id,k)
 x=np.array(Image.open(o/f'stock-{id}.png').convert('RGB'),dtype=np.int16)
 y=np.array(Image.open(o/f'off-{id}.png').convert('RGB'),dtype=np.int16)
 diff=np.abs(x-y).max(axis=2)
 # Guard actual within unchanged data and renderer AA padding. Thin far ink remains identical.
 yy,xx=np.indices(x.shape[:2]);z=a['camera']['scale'];cx=a['camera']['x'];cy=a['camera']['y'];w=a['css']['w'];h=a['css']['h']
 project=lambda x0,y0:(w/2+(x0*3.13-cx)*z,h/2+(y0*3.13-cy)*z)
 area=np.zeros(diff.shape,bool)
 if a['stage']==7:
  for rect in [(-381,908,9,1065),(1434,882,1834,1063),(16,1068,1418,1448)]:
   x0,y0=project(*rect[:2]);x1,y1=project(*rect[2:]);m=3
   area|=(xx>=x0-m)&(xx<=x1+m)&(yy>=y0-m)&(yy<=y1+m)
 comps[id]={'changes':int((diff>0).sum()),'changesGt1':int((diff>1).sum()),'outsideChangesGt1':int(((diff>1)&~area).sum()),'maxOutside':int(diff[~area].max())}
 if a['stage']==6: assert not comps[id]['changes'],comps[id]
save('comparison.json',comps)
assert not any(v['outsideChangesGt1'] for v in comps.values()),comps
assert all(comps[id]['changesGt1']>0 for id in comps if id.startswith('s07') and '-south' in id),comps
print('12 Stage7 exact native camera pairs, Stage6 pixel-exact, actual runtime owner draws and identical geometry. This is not a repair.')
