"""Original App/Scene/Engine controlled chapter fixtures; not a normal campaign playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/coast-first';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);await HonroCampaignLoader.ensureStage(13);HonroApp.frame=()=>{};const ss=await Promise.all(['31-35-36','32-33-34-37','38-39-40'].map(async s=>(await fetch('game/docs/act4/dialogue-seeds-'+s+'-reviewed-final.json')).json()));HONRO_ACT4_PREVIEW_SEEDS={scenes:ss.flatMap(s=>s.scenes),ui:ss.flatMap(s=>s.ui)};window.ownerBefore=JSON.stringify(HonroApp.profile);}''')
 for name in ['review-art','terrain-preview','coast-maps','coast-art','preview-events','coast-events','preview-lifecycle']:page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/'+name+'.js')
 def ev(code):return page.evaluate(code)
 def render():ev("HonroApp.scene.render(HonroApp.engine,0,'',.5,false,0)")
 def finish():
  for i in range(16):
   page.wait_for_timeout(100)
   if not ev('!!HonroApp.dialogue'):break
   ev('HonroAct4TerrainPreview.observe(HonroApp,.01);HonroStory.next(HonroApp)')
  page.wait_for_timeout(150)
 def setup(n,x,y,cx,cy,cls='archer'):
  ev(f"HonroAct4TerrainPreview.launch({n})")
  page.evaluate("""v=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units.filter(u=>u.side===1))e.hurt(u,100000);for(let i=0;i<300;i++)e.tick(HONRO_CORE.STEP);b.phase='aim';b.side=0;b.active=v.cls;const u=e.active;const p=HonroTerrain.place(b,u,{x:v.x,y:v.y,maxDistance:80});if(!p)throw Error('fixture placement');Object.assign(u,p,{vx:0,vy:0});Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,x:v.cx,y:v.cy,scale:.5,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});} """,dict(x=x,y=y,cx=cx,cy=cy,cls=cls))
  render()
 def step(count=1,dt=.1):
  for _ in range(count):ev(f'HonroAct4TerrainPreview.observe(HonroApp,{dt})');render()
 ev('HonroAct4TerrainPreview.freezeReviewClock=true;HonroAct4TerrainPreview.launch(33)')
 ev("""()=>{window.pressure={actions:[],states:[],shots:0,enemyShots:0,enemyDamage:0,control:{},drops:0,jumps:0};const e=HonroApp.engine,fire=e.fire.bind(e),hurt=e.hurt.bind(e);e.fire=function(...a){const side=e.active?.side,out=fire(...a);if(out){if(side===1)pressure.enemyShots++;else pressure.shots++;}return out;};e.hurt=function(u,...a){const hp=u.hp,out=hurt(u,...a);if(u.side===0&&e.unit(a[1])?.side===1)pressure.enemyDamage+=hp-u.hp;return out;};}""")
 for chunk in range(80):
  state=ev("""()=>{const a=HonroApp,e=a.engine,b=e.b,P=HonroAct4TerrainPreview,R=pressure;for(let frame=0;frame<180;frame++){if(b.round>=5||b.phase==='lost')break;e.planningBudget(2);if(b.side===0&&b.phase==='aim'&&!a.dialogue){if(b.round>=2){const next=b.units.filter(u=>u.side===0&&!u.dead&&!u.acted).sort((u,v)=>u.x-v.x)[0];if(next&&next!==e.active)e.select(next.id);}const u=e.active;if(u?.side===0&&!u.dead&&!u.acted){const key=b.round+':'+u.id,s=R.control[key]??={phase:b.round===1?'advance':'flee',jam:0};if(s.phase==='advance'){const x=u.x;if(u.x<1510&&u.moveLeft>100){e.move(1,HONRO_CORE.STEP);s.jam=u.x-x<.02?s.jam+1:0;if(s.jam>40&&e.grounded(u)){if(e.jump(u))R.jumps++;s.jam=0;}}else s.phase='drop';}if(s.phase==='drop'){if(e.canDrop()){if(e.drop())R.drops++;s.phase='settle';}else if(e.grounded(u))s.phase='shoot';}if(s.phase==='settle'&&e.grounded(u)&&!u.platformDrop)s.phase='shoot';if(s.phase==='flee'){const x=u.x;if(u.x>780&&u.y>2110&&u.moveLeft>5){e.move(-1,HONRO_CORE.STEP);s.jam=u.x-x<.02?s.jam+1:0;if(s.jam>20&&e.grounded(u)){if(e.jump(u))R.jumps++;s.jam=0;}}else if(e.grounded(u))s.phase='shoot';}if(s.phase==='shoot'&&e.canAct()&&e.grounded(u)){const target=b.units.filter(v=>v.side===1&&!v.dead).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y))[0],id={archer:'A01',mage:'M01',knight:'S01',occultist:'O01'}[u.cls];let best=null;if(target&&u.loadout.includes(id)&&u.focus>=e.manaCost(HONRO_CORE.SKILLS[id],u,.7)){for(const angle of [-20,0,20,40,60])for(const power of [.35,.65,1]){const ang=target.x>=u.x?angle:180-angle,p=e.predict(u,HONRO_CORE.SKILLS[id],ang,power,target,false);if(!best||p.closest<best.closest)best={angle:ang,power,closest:p.closest};}}R.actions.push({round:b.round,id:u.id,x:u.x,y:u.y,hp:u.hp,mp:u.focus,moveLeft:u.moveLeft,skill:best?id:null,closest:best?.closest});s.phase='spent';if(!best||best.closest>230||!e.fire(id,best.angle,best.power))e.wait();}}}e.tick(HONRO_CORE.STEP);P.observe(a,HONRO_CORE.STEP);if(frame%15===0)a.scene.render(e,HONRO_CORE.STEP,'',.5,false,HONRO_CORE.STEP);}R.states.push({round:b.round,phase:b.phase,side:b.side,active:b.active,tide:b.honroAct4PreviewState.tide?.phase,units:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,acted:u.acted,grounded:e.grounded(u)}))});return R.states.at(-1);}""")
  page.wait_for_timeout(30)
  if state['round']>=5 or state['phase']=='lost':break
 r=ev('pressure');q=ev('HonroApp.engine.b.honroAct4PreviewState');(OUT/'33-live-pressure.json').write_text(json.dumps({'scope':'Unposed review map start, native movement/drop/jump/fire/wait and enemy AI; no hurt/position/round/budget injection. Not official campaign completion.','result':r,'state':q},ensure_ascii=False,indent=2))
 ev('Object.assign(HonroApp.scene,{manual:true,x:1050,y:2070,scale:.65})');render();page.locator('#battlecanvas').screenshot(path=str(OUT/'33-live-pressure-high-water.png'))
 assert state['round']>=5,state
 assert r['enemyShots']>0 and r['enemyDamage']>0,r
 assert len(r['actions'])>=12,r
 assert all(u['hp']>0 and (u['x']<850 or u['y']<2110) for u in state['units']),state
 assert not q['water']['recoveries'],q['water']
 assert r['drops']>0,r
 assert not errors,errors
 print('PASS 33 unposed start -> actual mud entry/drop -> native enemy fire/HP damage -> four-person evacuation before high water; no pose/damage/resource/round injection; no chapter completion claim',flush=True)
 browser.close()
