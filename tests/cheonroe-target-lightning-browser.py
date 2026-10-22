"""Real Chromium + built HONRO game + production scene; declared controlled arena.
Screenshots are actual rendered frames. These checks do not grant art approval.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'game/docs/cheonroe-target-lightning/evidence'
OUT.mkdir(parents=True,exist_ok=True)
SETUP=r'''opts=>{
 const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.close();a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
 const f=window.fixture=cheonroeArena(C,opts);a.profile=f.profile;a.training=true;a.trainingClass='mage';a.trainingSkill='M05';a.trainingRanks={M05:opts.rank||8};a.trainingPassives={};a.stage=HONRO_CONTENT.stages[0];
 a.mount(f.b);a.engine=f.e;f.e.onEvent=ev=>{f.events.push(ev);a.scene.event(ev);};a.selected='M05';a.scene.manual=true;a.scene.x=opts.cameraX||1000;a.scene.y=opts.cameraY||760;a.scene.scale=opts.zoom||.85;a.updateHUD(true);
 window.renderFrame=dt=>{a.scene.render(f.e,dt,'M05',.5,false,dt);a.updateHUD(true);};
 renderFrame(0);return {targets:f.b.units.filter(u=>u.side===1).length};
}'''
SNAP=r'''()=>{const f=fixture,s=HonroApp.scene,r=s.canvas.getBoundingClientRect(),bolts=f.events.filter(e=>e.name==='lightningBolt');return {
 aim:f.aim,targets:f.b.units.filter(u=>u.side===1).map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,hp:u.hp,dead:u.dead})),
 bolts,hits:f.hits,scale:s.scale,camera:{x:s.x,y:s.y,w:r.width,h:r.height},
 liveRays:s.arcFx.fxs.filter(f=>f.kind==='lightningBolt').length,
 headAgreement:bolts.every(ray=>f.b.units.some(u=>{const h=HonroMonsterVisual.headPoint(u)||{x:u.x,y:u.y-u.h};return u.side===1&&Math.abs(ray.x2-h.x)<4&&Math.abs(ray.y2-h.y)<4;})),
 offscreen:bolts.filter(ray=>{const p=HonroCamera.screen(s,r.width,r.height,{x:ray.x2,y:ray.y2});return p.x<0||p.x>r.width||p.y<0||p.y>r.height;}).length
 };}'''
rows=[];errors=[]
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);page=b.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp && window.HONRO_CORE')
 page.evaluate("HonroOptionalRuntime.load('training')")
 socket_checks=page.evaluate(r"""()=>{const V=HonroMonsterVisual,C=HONRO_CORE;let checks=0;
 for(const id of Object.keys(V.assets))for(const facing of [-1,1])for(const h of [72,128])for(const reaction of [false,true]){
  const u=C.makeUnit('knight',1,321,987,{honroVariant:id,h,facing,anim:reaction?.7:0,hurt:reaction?.6:0}),kind=V.kind(u),a=V.assets[kind],head=a?.parts.find(p=>p.id==='head');if(!head)continue;
  const pose=V.pose(a,0,V.state(u)),byId=new Map(a.parts.map(p=>[p.id,p])),chain=[];let j=head;while(j){chain.unshift(j);j=byId.get(j.parent);}
  let matrix=new DOMMatrix().translate(u.x,u.y).scale(h/a.baseHeight*facing,h/a.baseHeight);
  for(const joint of chain){const v=pose[joint.id],[x,y]=joint.pivot;matrix=matrix.translate(x+v.x,y+v.y).rotate(v.rotate).scale(v.scaleX,v.scaleY).translate(-x,-y);}
  const expected=matrix.transformPoint(new DOMPoint(...head.pivot)),actual=V.headPoint(u);
  if(Math.hypot(actual.x-expected.x,actual.y-expected.y)>1e-4)throw Error('Head joint does not match renderer transform '+JSON.stringify({id,facing,h,reaction,actual,expected:{x:expected.x,y:expected.y},chain:chain.map(j=>({id:j.id,pivot:j.pivot,pose:pose[j.id]}))}));checks++;
 }return checks;}""")
 assert socket_checks>80,socket_checks
 page.add_script_tag(content=(ROOT/'tests/cheonroe-fixture.mjs').read_text().replace('export function','function'))
 # Landscape and narrow portrait: ten real enemies, before / impact / after.
 for width,height,zoom,name in [(1440,960,1.15,'desktop'),(360,800,.66,'mobile')]:
  page.set_viewport_size({'width':width,'height':height});page.evaluate(SETUP,{'count':10,'zoom':zoom,'natural':True})
  page.screenshot(path=str(OUT/f'{name}-10-before.jpg'),type='jpeg',quality=82)
  page.evaluate("()=>{for(let i=0;i<2400;i++){fixture.e.tick(1/120);renderFrame(1/120);if(fixture.p.mode==='skyWait'&&fixture.p.age>=.12)return;}throw Error('No natural M05 landing');}")
  page.screenshot(path=str(OUT/f'{name}-10-wait.jpg'),type='jpeg',quality=82)
  page.evaluate("()=>{for(let i=0;i<2400;i++){fixture.e.tick(1/120);renderFrame(1/120);if(fixture.events.some(e=>e.name==='lightningBolt')){renderFrame(.075);return;}}throw Error('No natural M05 strike');}")
  result=page.evaluate(SNAP);result.update({'scenario':name+'-10','width':width,'height':height})
  assert len(result['bolts'])==10 and result['liveRays']==10 and result['headAgreement'],result
  assert len(result['hits'])==10 and len({h['id'] for h in result['hits']})==10
  page.screenshot(path=str(OUT/f'{name}-10-lightning.jpg'),type='jpeg',quality=85)
  page.evaluate('renderFrame(1.05)');assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length')==0
  page.screenshot(path=str(OUT/f'{name}-10-after.jpg'),type='jpeg',quality=82);rows.append(result)
 # Coordinate checks use the real world/screen transform at several camera zooms.
 for width,height,zoom,count in [(1440,960,.45,0),(1440,960,1.4,1),(360,800,.45,4),(360,800,.66,10),(360,800,1.4,10)]:
  page.set_viewport_size({'width':width,'height':height});page.evaluate(SETUP,{'count':count,'zoom':zoom})
  page.evaluate('fixture.impact();fixture.strike();renderFrame(.08)');r=page.evaluate(SNAP)
  assert len(r['bolts'])==count and r['headAgreement'] and r['liveRays']==count,r
  if width==360 and zoom==1.4:assert r['offscreen']>0,r
  r.update({'scenario':'zoom-count','width':width,'height':height,'requestedZoom':zoom});rows.append(r)
 # Roof inside the existing blast radius: preserve splash while clipping rays below it.
 page.set_viewport_size({'width':1440,'height':960});page.evaluate(SETUP,{'count':10,'ceiling':True,'zoom':1.15})
 page.evaluate('fixture.b.terrain[1].y=790;fixture.b.sceneVersion++;fixture.impact();fixture.strike();renderFrame(.08)')
 r=page.evaluate(SNAP);assert len(r['bolts'])==10 and all(ray['y']>=913 for ray in r['bolts']);r['scenario']='ceiling';rows.append(r)
 page.screenshot(path=str(OUT/'desktop-ceiling-lightning.jpg'),type='jpeg',quality=85)
 # A large cluster exceeds the old particle budget: all rays must still exist and expire.
 page.evaluate(SETUP,{'count':420,'zoom':.66});page.evaluate('fixture.b.units.slice(1).forEach((u,i)=>u.x=900+i*.4);fixture.impact();fixture.strike();renderFrame(.08)')
 r=page.evaluate(SNAP);assert len(r['bolts'])==420 and r['liveRays']==420;r['scenario']='420-render-budget';rows.append(r)
 page.evaluate('renderFrame(1.05)');assert page.evaluate('HonroApp.scene.arcFx.fxs.filter(f=>f.kind==="lightningBolt").length')==0
 b.close()
assert not errors,errors
for file in OUT.glob('*.jpg'):assert file.stat().st_size<1_000_000,file
report={'status':'passed','scope':'Actual local Chromium running built HONRO.html; injected, declared diagnostic arena and deterministic stepping; not normal campaign play or art approval','headJointTransformChecks':socket_checks,'rows':rows,'pageErrors':errors}
(OUT/'browser-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS browser: 0/1/4/10, 1440 and 360 portrait, zoom .45/.66/1.4, offscreen targets, roof, 420 rays + expiry, no page errors')
