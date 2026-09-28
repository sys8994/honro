"""Exercise the actual picker, audio nodes, rendered VFX and trajectory overlays in both shells."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/skill-polish';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];metrics={}
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def click(page,action,value=None):
    page.locator(f'[data-training-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')).click()
SETUP=r'''()=>{
 const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=true;a.profile.settings.volume=.65;a.updateAudio();
 window.polishArena=(id='A11',rank=8)=>{
  a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=rank;a.launch(1,true,id);a.dialogue=null;a.turnNotice=null;a.done=false;
  const e=a.engine,b=e.b,u=e.active;Object.assign(b,{wind:0,width:2600,height:1500,fields:[],waters:[],drafts:[],zones:[],stakes:[],honroMarkers:[],honroSurfaceZones:[],honroLandmarks:[]});
  b.terrain=[{id:'floor',x:0,y:1100,w:2600,h:400,hp:99999,maxHp:99999,mat:'rock'}];b.units=[u];Object.assign(u,{x:400,y:1100,vx:0,vy:0,airborne:false,jumping:false,acted:false,attack:1,ranks:{[C.baseSkill(u.cls)]:1,[id]:rank},loadout:[id],focus:1000,maxFocus:1000,cooldowns:{}});
  b.phase='aim';b.active=u.id;b.rng=194512;b.sceneVersion++;a.selected=id;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:1000,y:850,scale:.7});a.scene.arcFx.fxs=[];
  window.polishEvents=[];const emit=e.onEvent;e.onEvent=ev=>{polishEvents.push(ev);emit(ev);};a.updateHUD(true);
  const foe=(x=850,extra={})=>{const v=C.makeUnit('archer',1,x,1100,{id:'target'+b.units.length,name:'허상',role:'dummy',fixed:true,h:92,hp:20000,maxHp:20000,armor:0,loadout:['LA01'],...extra});b.units.push(v);return v;};return {e,b,u,foe};
 };polishArena();
}'''
def picker(page,shell):
    page.evaluate(SETUP)
    before=page.evaluate('JSON.stringify(HonroApp.profile.heroes)')
    check(shell+': toolbar label fits its button',page.evaluate("(()=>{const b=document.querySelector('.training-current');return b.clientWidth>=200&&b.scrollWidth<=b.clientWidth+2})()"))
    click(page,'open');check(shell+': four selectable portraits, no dropdown',page.locator('.training-heroes img').count()==4 and page.locator('.training-dialog select').count()==0)
    for cls in ['archer','mage','knight','occultist']:
        click(page,'hero',cls)
        for branch in range(4):
            click(page,'branch',branch)
            cards=page.locator('.training-card')
            check(shell+f': {cls} branch {branch} has five icon cards',cards.count()==5 and page.locator('.training-card svg').count()==5)
    click(page,'hero','archer');click(page,'branch',1);click(page,'skill','A11');click(page,'rank',5)
    if shell=='Game':page.screenshot(path=str(OUT/'training-desktop.png'))
    page.locator('[data-training-action=rank][data-value="6"]').focus();page.locator('[data-training-action=rank][data-value="6"]').press('Enter');click(page,'apply')
    check(shell+': keyboard level selection reaches the real combat unit',page.evaluate('HonroApp.engine.active.ranks.A11')==6)
    page.locator('[data-action=training-reset]').click();check(shell+': reset retains the selected level',page.evaluate('HonroApp.engine.active.ranks.A11')==6)
    click(page,'open');click(page,'branch',3);click(page,'skill','AP01');click(page,'rank',3);click(page,'passive','AP01');click(page,'apply')
    check(shell+': passive independently enabled at chosen rank',page.evaluate('HonroApp.engine.active.ranks.AP01===3&&HonroApp.engine.active.ranks.A11===6'))
    click(page,'open');click(page,'rank',1);page.locator('[data-training-action=close]').press('Escape')
    check(shell+': cancel preserves the applied configuration',page.evaluate('HonroApp.engine.active.ranks.A11')==6)
    click(page,'open');click(page,'hero','mage');click(page,'branch',0);click(page,'skill','M02');click(page,'rank',2);click(page,'apply')
    check(shell+': another portrait changes caster and level',page.evaluate("HonroApp.engine.active.cls==='mage'&&HonroApp.engine.active.ranks.M02===2"))
    check(shell+': training leaves campaign hero progression intact',before==page.evaluate('JSON.stringify(HonroApp.profile.heroes)'))

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');picker(page,'Game')
    # The normal talent detail shares the same prose and expanded effect table.
    page.evaluate("HonroApp.talent('M02')")
    check('Camp detail separates narrative from the 2.4-second specification', '2.4' not in page.locator('.skill-desc').inner_text() and '2.4' in page.locator('.effect-compare').inner_text())
    page.evaluate("{const p=HonroApp.preview;p.scene.render(p.e,.1,p.id,.6,true,.1);}");page.screenshot(path=str(OUT/'skill-detail.png')); page.evaluate('HonroApp.close()')
    # Passive off and on, actual sources must start for separate pierced enemies.
    page.evaluate("HonroApp.trainingPassives={};polishArena('A02');HonroApp.audio.wake()")
    page.locator('[data-training-action=open]').click();page.locator('[data-training-action=close]').click()
    page.wait_for_function("HonroApp.audio.context?.state==='running'")
    sound=page.evaluate('''async()=>{const {e,b,foe}=polishArena('A02');for(let i=0;i<6;i++)foe(540+i*50,{h:500});let starts=0;const ctx=HonroApp.audio.context,create=ctx.createBufferSource.bind(ctx);ctx.createBufferSource=()=>{const s=create(),start=s.start.bind(s);s.start=(...args)=>{starts++;start(...args);};return s;};e.fire('A02',0,.85);starts=0;for(let i=0;i<600&&b.projectiles.length;i++)for(const q of [...b.projectiles])e.stepProjectile(q,1/120);ctx.createBufferSource=create;return{starts,events:polishEvents.filter(v=>v.type==='sound'&&v.name==='arrowhit').length};}''')
    check('Game: every pierced enemy starts an audio source, including same-frame hits',sound['starts']==6 and sound['events']==6,sound)
    # Wait for actual damage/qiHit: terrain rebounds also emit inkImpact now.
    # Use a broad dummy to intersect every geometry.
    wave_rows=[]
    for id in ['M03','M11','M12','M14','M15']:
        row=page.evaluate('''async id=>{const a=HonroApp,{e,b,foe}=polishArena(id);const t=foe(850,{r:1400,h:1800});if(id==='M12')b.terrain.push({id:'roof',x:0,y:600,w:2200,h:20,hp:99999,maxHp:99999,mat:'rock'});await a.audio.wake();delete a.audio.lastPlayed.qiHit;delete a.audio.startedAt.qiHit;e.fire(id,35,.6);for(let i=0;i<1500&&b.projectiles.length;i++){for(const q of [...b.projectiles])if(b.projectiles.includes(q))e.stepProjectile(q,1/120);if(polishEvents.some(v=>v.type==='sound'&&v.name==='qiHit'))break;}t.r=16;t.h=92;a.scene.render(e,.08,'',.6,false,.08);return{id,damage:t.maxHp-t.hp,hits:polishEvents.filter(v=>v.name==='inkImpact').length,played:!!a.audio.startedAt.qiHit,fx:a.scene.arcFx.fxs.filter(v=>v.kind==='inkImpact').length};}''',id)
        wave_rows.append(row)
        if id in ['M12','M14','M15']:page.screenshot(path=str(OUT/f'wave-{id}.png'))
    check('Game: all five waves resolve hit VFX and play WebAudio',all(r['damage']>0 and r['hits'] and r['played'] and r['fx'] for r in wave_rows),wave_rows)
    page.evaluate('''()=>{const a=HonroApp,{b,u,e}=polishArena('M07');b.stakes=['M07','M10','M08','M09','M99'].map((skill,i)=>({id:900+i,skill,owner:u.id,side:0,x:650+i*170,y:1100,rank:8,damage:30,shot:1}));a.scene.x=1020;a.scene.y=930;a.scene.scale=1.1;a.scene.render(e,0,'',.6,false,0);}''')
    page.screenshot(path=str(OUT/'stakes-game.png'))
    animated=page.evaluate('''()=>{const cv=document.createElement('canvas');cv.width=1100;cv.height=180;const c=cv.getContext('2d');const draw=t=>{c.clearRect(0,0,1100,180);c.save();c.translate(-500,-990);HONRO_CORE.drawStakes(c,HonroApp.engine,t);c.restore();return cv.toDataURL();};return draw(0)!==draw(.4);}''')
    check('All five placed stakes animate over time',animated)
    # Guide and real trace overlays. The real flight is drawn in warm ink over the pale guide.
    for id in ['A11','A12']:
        page.evaluate('''id=>{const a=HonroApp,C=HONRO_CORE,{e,b,u}=polishArena(id);u.angle=58;a.scene.x=950;a.scene.y=750;a.scene.scale=.62;const guide=e.predict(u,C.SKILLS[id],58,.72),path=[];e.fire(id,58,.72);const q=b.projectiles[0];for(let i=0;i<1440&&b.projectiles.includes(q);i++){e.stepProjectile(q,1/120);path.push({x:q.x,y:q.y});}a.scene.arcFx.fxs=[];a.scene.render(e,0,'',.72,false,0);const c=a.scene.ctx,{w,h,d}=a.scene.size();c.save();c.setTransform(d,0,0,d,0,0);c.translate(w/2-a.scene.x*a.scene.scale,h/2-a.scene.y*a.scene.scale);c.scale(a.scene.scale,a.scene.scale);for(const [ps,color,width] of [[guide.points,'#e7f3e2',5],[path,'#bd985c',2]]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();ps.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();}c.restore();}''',id)
        page.screenshot(path=str(OUT/f'trajectory-{id}.png'))
    # Charge-time prediction on the authored training scene, independent of idle performance suite.
    metrics['chargePrediction']=page.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE,rows=[];for(const id of ['A11','A12','A15']){polishArena(id);const e=a.engine,u=e.active;u.angle=65;const times=[];for(let i=0;i<36;i++){const t=performance.now();e.predict(u,C.SKILLS[id],65,.3+i*.018);times.push(performance.now()-t);}times.sort((a,b)=>a-b);rows.push({id,p50:times[18],p95:times[34]});}return rows;}''')
    for size,label in [({'width':390,'height':844},'portrait'),({'width':844,'height':390},'landscape')]:
        page.set_viewport_size(size);page.evaluate("HonroApp.trainingClass='mage';HonroApp.trainingSkill='M02';HonroApp.launch(1,true,'M02')");click(page,'open')
        check(f'Mobile {label}: picker fits viewport and has one dialog',page.locator('[role=dialog]').count()==1 and page.evaluate("(()=>{const d=document.querySelector('.training-dialog'),r=d.getBoundingClientRect();return d.scrollWidth<=d.clientWidth+1&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()"))
        page.screenshot(path=str(OUT/f'training-mobile-{label}.png'))
        click(page,'rank',7);page.screenshot(path=str(OUT/f'training-level-{label}.png'));click(page,'apply')
        check(f'Mobile {label}: rank control and pinned apply button work',page.evaluate('HonroApp.engine.active.ranks.M02')==7)
    page.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');snapshot=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.on('pageerror',lambda e:errors.append(str(e)));picker(play,'Workshop')
    play.evaluate("polishArena('M15');HonroApp.engine.fire('M15',35,.6)");play.evaluate('''()=>{const a=HonroApp,e=a.engine;for(let i=0;i<1500&&e.b.projectiles.length;i++)for(const q of [...e.b.projectiles])e.stepProjectile(q,1/120);a.scene.render(e,.12,'',.6,false,.12);}''')
    check('Workshop: shared brush geometry reaches renderer',play.evaluate("HonroApp.scene.arcFx.fxs.some(f=>f.kind==='skillGeometry')"));editor.screenshot(path=str(OUT/'workshop-wave.png'))
    editor.click('#stopPlay');check('Workshop: testing leaves the authored map intact',snapshot==editor.evaluate('HonroWorkshopAPI.exportProject()'));browser.close()
check('No browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors,'metrics':metrics},ensure_ascii=False,indent=2),encoding='utf-8')
