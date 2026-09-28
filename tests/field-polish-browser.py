"""Actual game and Workshop input, shared training combat and rendered skill effects."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/field-polish';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)

SETUP=r'''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
 window.fieldArena=(id='A09')=>{a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=8;a.launch(1,true,id);a.dialogue=null;a.turnNotice=null;a.done=false;
  const e=a.engine,b=e.b,u=e.active;Object.assign(b,{practiceCombat:false,width:4200,height:2200,terrain:[{id:'floor',x:0,y:1700,w:4200,h:500,hp:99999,maxHp:99999,mat:'rock'}],waters:[],drafts:[],fields:[],zones:[],honroLandmarks:[],honroSurfaceZones:[],honroMarkers:[],wind:0});b.units=[u];Object.assign(u,{x:800,y:1700,spawnX:800,spawnY:1700,vx:0,vy:0,airborne:false,jumping:false,acted:false,ranks:{[C.baseSkill(u.cls)]:1,[id]:8},loadout:[id],angle:55,focus:1000,maxFocus:1000,cooldowns:{}});b.active=u.id;b.phase='aim';b.sceneVersion++;a.selected=id;Object.assign(a.scene,{manual:true,x:1700,y:1260,scale:.6,turnTarget:undefined});a.scene.arcFx.fxs=[];a.updateHUD(true);return{a,e,b,u};};}'''

def training(page,shell):
    page.evaluate(SETUP)
    before=page.evaluate("JSON.stringify(HonroApp.profile.heroes)")
    page.evaluate("{const a=HonroApp;a.trainingClass='archer';a.trainingSkill='A01';a.launch(1,true,'A01');a.dialogue=null;a.turnNotice=null;}")
    data=page.evaluate("(()=>{const b=HonroApp.engine.b;return{width:b.width,height:b.height,terrain:b.terrain.length,waters:b.waters.length,enemies:b.units.filter(u=>u.side===1).map(u=>({hp:u.hp,role:u.role,skills:u.loadout})),combat:b.practiceCombat};})()")
    check(shell+': larger varied training map and twelve finite-health combatants',data['width']==5600 and data['height']==2300 and data['terrain']>=5 and data['waters']==2 and len(data['enemies'])==12 and all(0<u['hp']<500 and u['role']!='dummy' and u['skills'] for u in data['enemies']) and data['combat'],data)
    if shell=='Game':
        traversal=page.evaluate(r'''()=>{const C=HONRO_CORE,rows=[];for(const direction of [1,-1]){const b=structuredClone(HonroApp.engine.b),e=new C.Engine(b),u=e.active;b.units=[u];u.x=direction===1?340:5400;u.y=C.terrainSurface(b.terrain,u.x,0,b.height).y;u.spawnX=u.x;u.spawnY=u.y;u.moveLeft=1e7;let last=u.x,still=0,jumps=0,goal=direction===1?5380:340;for(let i=0;i<12000;i++){u.moveLeft=1e7;e.walk(u,Math.sign(goal-u.x),1/120);if(still>22&&e.grounded(u)){e.jump(u);jumps++;still=0;}e.integrateBody(u,1/120);if(Math.abs(goal-u.x)<25&&e.grounded(u))break;still=Math.abs(u.x-last)<.03?still+1:0;last=u.x;}rows.push({direction,x:u.x,y:u.y,goal,jumps,alive:!u.dead,grounded:e.grounded(u)});}return rows;}''')
        check('Training hills, ponds and ledges permit travel in both directions',all(abs(r['x']-r['goal'])<25 and r['alive'] and r['grounded'] for r in traversal),traversal)
    page.evaluate("{const a=HonroApp;a.scene.manual=true;a.scene.scale=.22;a.scene.x=2800;a.scene.y=1250;a.scene.render(a.engine,0,a.selected,.7,false,0);}")
    (page if hasattr(page,'screenshot') else page.page).screenshot(path=str(OUT/(shell.lower()+'-training-overview.png')))
    page.evaluate("{const a=HonroApp,e=a.engine,b=e.b;window.trainingDead=b.units.filter(u=>u.side===1).at(-1);e.hurt(trainingDead,1e6,e.active.id);window.trainingRound=b.round;window.enemyCasts=0;window.baseFire=e.fire.bind(e);e.fire=(...args)=>{if(e.active.side===1)enemyCasts++;return baseFire(...args);};}")
    page.locator('#fire').dispatch_event('pointerdown',{'pointerId':1,'button':0,'isPrimary':True});page.wait_for_timeout(160);page.locator('#fire').dispatch_event('pointerup',{'pointerId':1,'button':0,'isPrimary':True})
    state=page.evaluate("(()=>{const a=HonroApp,e=a.engine,b=e.b;for(let i=0;i<7200&&(b.round<=trainingRound||b.phase!=='aim'||b.side!==0);i++)e.tick(1/120);a.turnNotice=null;a.updateHUD(true);return{round:b.round,phase:b.phase,side:b.side,enemyCasts,dead:trainingDead.dead,hp:trainingDead.hp,playerAlive:!e.active.dead,ready:a.canInput()};})()")
    check(shell+': real fire input resolves enemy AI attacks and returns control without reviving kills',state['enemyCasts']>0 and state['round']>1 and state['phase']=='aim' and state['side']==0 and state['dead'] and state['hp']==0 and state['playerAlive'] and state['ready'],state)
    immortal=page.evaluate("(()=>{const e=HonroApp.engine,u=e.active;for(let i=0;i<3;i++){e.hurt(u,1e6,e.b.units.find(t=>t.side===1&&!t.dead).id);e.recover(u);}return !u.dead&&u.hp===1;})()")
    check(shell+': friendly cannot die from damage or falling',immortal)
    page.locator('[data-action=training-reset]').click()
    check(shell+': refresh restores defeated enemies and profile progress is untouched',page.evaluate("HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead&&u.hp===u.maxHp).length") ==12 and page.evaluate("JSON.stringify(HonroApp.profile.heroes)")==before)
    # First actual cast yields departure + arrival; use the production E interaction.
    gate=page.evaluate("(()=>{const a=HonroApp;a.trainingClass='mage';a.trainingSkill='M09';a.launch(1,true,'M09');const e=a.engine,b=e.b,u=e.active;window.gateStart={x:u.x,y:u.y};e.fire('M09',35,.28);for(let i=0;i<2000&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,1/120);return b.stakes?.map(z=>({x:z.x,y:z.y}));})()")
    check(shell+': first real gate projectile plants both endpoints',bool(gate) and len(gate)==2,gate)
    page.evaluate("{const a=HonroApp,e=a.engine,b=e.b,u=e.active;b.phase='aim';u.acted=false;a.turnNotice=null;Object.assign(u,gateStart,{vx:0,vy:0});HonroInteractions.refresh(a);a.updateHUD(true);}")
    page.locator('#battlecanvas').focus();page.keyboard.press('e') if hasattr(page,'keyboard') else page.locator('#battlecanvas').press('e')
    gate_state=page.evaluate("(()=>{const a=HonroApp,e=a.engine,u=e.active;return{x:u.x,y:u.y,used:!!u.gateTurn,grounded:e.grounded(u)};})()")
    check(shell+': E teleports to the first placed destination',gate_state['used'] and abs(gate_state['x']-gate[1]['x'])<=96 and gate_state['grounded'],gate_state)
    check(shell+': no application exception',not page.evaluate('HonroApp.lastError||null'))

with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');training(page,'Game')
    # Measure the actual stroked trajectory in CSS pixels, independent of zoom.
    zooms=page.evaluate(r'''()=>{const C=HONRO_CORE,{e,u}=fieldArena('A01'),rows=[];for(const zoom of [1,.4,.2]){const cv=document.createElement('canvas');cv.width=1400;cv.height=900;const c=cv.getContext('2d');let widths=[],dashes=[];const stroke=c.stroke.bind(c);c.stroke=()=>{widths.push(c.lineWidth*zoom);dashes.push(c.getLineDash().map(n=>n*zoom));stroke();};c.translate(200,600);c.scale(zoom,zoom);c.translate(-u.x,-u.y);C.drawRedesignGuide(c,e,u,C.SKILLS.A01,.7,zoom);rows.push({zoom,widths,dashes});}return rows;}''')
    check('Guide width and dash spacing stay visible in screen pixels at three zooms',all(any(abs(w-1.35)<1e-6 for w in r['widths']) and any(d==[4,7] for d in r['dashes']) for r in zooms),zooms)
    for zoom in [.6,.2]:
        page.evaluate("z=>{const a=HonroApp;a.scene.scale=z;a.scene.x=1500;a.scene.y=1300;a.scene.render(a.engine,0,'A01',.7,false,0);}",zoom);page.screenshot(path=str(OUT/f'guide-zoom-{zoom}.png'))
    # One displayed parabola for each multi-arrow skill.
    counts=page.evaluate(r'''()=>{const C=HONRO_CORE,rows=[];for(const id of ['A04','A15']){const {e,u}=fieldArena(id);const cv=document.createElement('canvas'),c=cv.getContext('2d');let paths=0,strokes=0;c.beginPath=()=>{paths++;};c.stroke=()=>{strokes++;};C.drawRedesignGuide(c,e,u,C.SKILLS[id],.7,.4);rows.push({id,paths,strokes});}return rows;}''')
    check('Scatter and seven-star draw only one trajectory',all(r['paths']==1 and r['strokes']==2 for r in counts),counts)
    page.evaluate("{const {a,e,b}=fieldArena('A09');e.fire('A09',65,.8);for(let i=0;i<65;i++)e.stepProjectile(b.projectiles[0],1/120);a.scene.render(e,0,'',.7,false,0);a.updateHUD(true);}")
    has_guide=page.evaluate("HONRO_CORE.drawTurnGuide(document.createElement('canvas').getContext('2d'),HonroApp.engine,.6)")
    page.screenshot(path=str(OUT/'turn-arrow-live-guide.png'))
    page.locator('#fire').dispatch_event('pointerdown',{'pointerId':2,'button':0,'isPrimary':True});page.locator('#fire').dispatch_event('pointerup',{'pointerId':2,'button':0,'isPrimary':True})
    check('Live steering guide is shown before the real fire button turns the arrow once',has_guide and page.evaluate("HonroApp.engine.b.projectiles[0].turned&&!HONRO_CORE.drawTurnGuide(document.createElement('canvas').getContext('2d'),HonroApp.engine,.6)"))
    steering_cost=page.evaluate(r'''()=>{const C=HONRO_CORE,{e,b}=fieldArena('A09');e.fire('A09',65,.8);const cv=document.createElement('canvas'),c=cv.getContext('2d'),times=[];for(let i=0;i<40;i++){for(let k=0;k<4;k++)e.stepProjectile(b.projectiles[0],1/120);const t=performance.now();C.drawTurnGuide(c,e,.6);times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{median:times[20],p95:times[38]};}''')
    check('Live steering preview fits a frame budget',steering_cost['p95']<16.7,steering_cost)
    # Sheet uses production projectile drawing, not a separate visual mockup.
    visuals=page.evaluate(r'''()=>{const C=HONRO_CORE,cv=document.createElement('canvas');cv.width=1200;cv.height=630;const c=cv.getContext('2d');c.fillStyle='#142a2e';c.fillRect(0,0,1200,630);const ids=['A14','A11','A05','M01','M03','M06','M02','M04','M13'];const fingerprints=[];
     for(const [i,id] of ids.entries()){const {e,b}=fieldArena(id);e.fire(id,0,.5);const q=b.projectiles[0];Object.assign(q,{x:0,y:0,vx:500,vy:0,trail:[]});const row=Math.floor(i/3),col=i%3;c.fillStyle='#dae1d0';c.font='18px sans-serif';c.fillText(C.SKILLS[id].name,col*400+30,row*210+32);let frames=[];for(const [j,age] of [.1,.3,.6].entries()){q.age=age;const tile=document.createElement('canvas');tile.width=170;tile.height=120;const tc=tile.getContext('2d');tc.translate(100,60);tc.scale(2.4,2.4);C.drawRedesignProjectile(tc,q);frames.push(tile.toDataURL());c.save();c.translate(col*400+70+j*112,row*210+110);c.scale(2,2);C.drawRedesignProjectile(c,q);c.restore();}fingerprints.push({id,animated:frames[0]!==frames[1],image:frames[0]});}
     window.projectileSheet=cv.toDataURL();return{animations:fingerprints.map(({id,animated})=>({id,animated})),distinctArrows:new Set(fingerprints.slice(0,3).map(f=>f.image)).size};}''')
    check('All wave and elemental gourd projectiles animate; three arrow trees have distinct silhouettes',visuals['distinctArrows']==3 and all(v['animated'] for v in visuals['animations'][3:]),visuals)
    sheet=page.evaluate('projectileSheet');import base64
    (OUT/'projectile-styles.png').write_bytes(base64.b64decode(sheet.split(',')[1]))
    for id in ['M01','M13']:
        result=page.evaluate(r'''id=>{const C=HONRO_CORE,{a,e,b}=fieldArena(id);e.fire(id,35,.6);const q=b.projectiles[0];a.scene.render(e,0,'',.6,false,0);if(id==='M01'&&a.scene.partyVisual.projectile(a.scene.ctx,q,e))throw Error('Qi still uses vector prop');e.impact(q,{x:1700,y:1250,n:{x:0,y:-1},terrain:b.terrain[0],t:0});if(id==='M13')for(let i=0;i<65;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,1/120);for(const fx of a.scene.arcFx.fxs)fx.age=.18;a.scene.render(e,0,'',.6,false,0);return a.scene.arcFx.fxs.map(f=>f.kind);}''',id)
        check(id+': actual shared renderer receives the new single-source effect',('qiBurst' if id=='M01' else 'fireBloom') in result and (id!='M01' or not any(k in result for k in ['inkImpact','burst','ring'])),result)
        page.screenshot(path=str(OUT/f'effect-{id}.png'))
    page.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.on('pageerror',lambda e:errors.append(str(e)));training(play,'Workshop');editor.click('#stopPlay');check('Workshop map survives training playtest unchanged',saved==editor.evaluate('HonroWorkshopAPI.exportProject()'));browser.close()
check('No browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors,'zooms':zooms,'visuals':visuals},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
