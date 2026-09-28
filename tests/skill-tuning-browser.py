"""Real selection controls/music streams and shared production VFX in both HTMLs."""
import base64
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/skill-tuning';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)

SETUP=r'''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile.settings.sound=false;
 window.tuningArena=(id,rank=8)=>{a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.trainingRanks[id]=rank;a.launch(1,true,id);a.dialogue=null;a.turnNotice=null;a.done=false;
 const e=a.engine,b=e.b,u=e.active;Object.assign(b,{width:5400,height:2300,practiceCombat:false,terrain:[{id:'floor',x:0,y:1900,w:5400,h:400,mat:'rock',hp:99999,maxHp:99999}],wind:0,waters:[],drafts:[],fields:[],zones:[],honroLandmarks:[],honroSurfaceZones:[],honroMarkers:[]});b.units=[u];Object.assign(u,{x:1000,y:1900,vx:0,vy:0,airborne:false,jumping:false,acted:false,angle:50,focus:1000,maxFocus:1000,ranks:{[C.baseSkill(u.cls)]:1,[id]:rank},loadout:[id],cooldowns:{}});b.phase='aim';b.sceneVersion++;a.selected=id;Object.assign(a.scene,{manual:true,x:1650,y:1570,scale:.7,turnTarget:undefined});a.scene.arcFx.fxs=[];
 window.paint=()=>{a.scene.render(e,0,a.selected,.75,false,0);a.updateHUD(true);};window.steps=n=>{for(let i=0;i<n;i++)for(const q of [...b.projectiles])if(b.projectiles.includes(q))e.stepProjectile(q,C.STEP);};paint();return{a,e,b,u};};}'''

def suite(page,shell):
    owner=page if hasattr(page,'mouse') else page.page
    page.evaluate("{const a=HonroApp;a.profile.settings.music=true;a.profile.settings.musicVolume=.1;a.audio.configure(a.profile.settings);a.trainingClass='archer';a.trainingSkill='A01';a.launch(1,true,'A01');}")
    page.locator('.training-current').click()
    page.wait_for_function("HonroApp.audio.music.current?.currentTime>.1 && !HonroApp.audio.music.current.paused && !HonroApp.audio.music.outgoing")
    page.evaluate("window.kept={stream:HonroApp.audio.music.current,index:HonroApp.audio.music.battleIndex,time:HonroApp.audio.music.current.currentTime};window.lastBattle=HonroApp.engine.b.session")
    # Portrait -> tree -> skill -> rank -> apply are actual DOM clicks.
    selections=[('knight','0','S03'),('archer','1','A15'),('knight','1','S15')]
    for index,(hero,branch,sid) in enumerate(selections):
        if index:page.locator('.training-current').click()
        page.locator(f'[data-training-action=hero][data-value={hero}]').click()
        page.locator(f'[data-training-action=branch][data-value="{branch}"]').click()
        page.locator(f'[data-training-action=skill][data-value={sid}]').click()
        page.locator('[data-training-action=rank][data-value="8"]').click()
        page.locator('[data-training-action=apply]').click()
        owner.wait_for_timeout(180)
        state=page.evaluate("(()=>{const a=HonroApp,m=a.audio.music;return{same:m.current===kept.stream,index:m.battleIndex,playing:m.status().playing,time:m.current.currentTime,newBattle:a.engine.b.session!==lastBattle,skill:a.selected,rank:a.engine.active.ranks[a.selected]};})()")
        check(shell+f': portrait/skill/rank selection {sid} retains playing BGM',state['same'] and state['index']==page.evaluate('kept.index') and state['playing']==1 and state['time']>page.evaluate('kept.time') and state['newBattle'] and state['skill']==sid and state['rank']==8,state)
        page.evaluate('lastBattle=HonroApp.engine.b.session;kept.time=kept.stream.currentTime')
    page.locator('[data-action=training-reset]').click();owner.wait_for_timeout(120)
    check(shell+': training refresh also keeps BGM uninterrupted',page.evaluate('HonroApp.audio.music.current===kept.stream&&kept.stream.currentTime>kept.time&&HonroApp.audio.music.battleIndex===kept.index'))
    page.locator('.training-current').click();owner.screenshot(path=str(OUT/(shell+'-rush-icons.png')))
    page.locator('[data-training-action=close]').click()
    # The prior selected music must not leak into a genuinely new campaign session.
    page.evaluate('HonroApp.launch(1,false)');owner.wait_for_timeout(900)
    check(shell+': entering campaign still advances the encounter playlist',page.evaluate('HonroApp.audio.music.battleIndex!==kept.index'))
    page.evaluate(SETUP)
    guide=page.evaluate(r'''()=>{const {a,e,u}=tuningArena('A15'),C=HONRO_CORE,before=JSON.stringify(e.b),pr=C.redesignPrediction(e,u,C.SKILLS.A15,50,.75,true);u.angle=50;paint();return{count:pr.paths.length,apex:pr.apex,end:{x:pr.x,y:pr.y},after:pr.points.filter(p=>p.y>pr.apex.y+100&&p.x>pr.apex.x).length,pure:JSON.stringify(e.b)===before};}''')
    check(shell+': seven-star displays one path continuing after the actual split',guide['count']==1 and guide['after']>10 and guide['pure'],guide)
    owner.screenshot(path=str(OUT/(shell+'-seven-star-preview.png')))
    # Compare actual rendered frames at several ages and check the battle state is immutable.
    rendered=page.evaluate(r'''()=>{const C=HONRO_CORE,rows=[],sheet=document.createElement('canvas');sheet.width=1200;sheet.height=840;const sc=sheet.getContext('2d');sc.fillStyle='#152a30';sc.fillRect(0,0,1200,840);
     for(const [i,id] of ['A08','S09','S11','S12','S01','S04'].entries()){
      const {e,b}=tuningArena(id);e.fire(id,45,.75);steps(34);const p=b.projectiles[0];if(id==='A08'){e.impact(p,{x:2000,y:1300,n:{x:0,y:-1},terrain:b.terrain[0],t:0});steps(15);}
      const before=JSON.stringify(b),frames=[];for(const [j,age] of [.18,.45,.9].entries()){
       const cv=document.createElement('canvas');cv.width=390;cv.height=235;const c=cv.getContext('2d');c.translate(225-p.x,110-p.y);C.drawRedesignProjectile(c,{...p,age});frames.push(cv.toDataURL());
       const x=(i%2)*600,y=Math.floor(i/2)*280;sc.save();sc.translate(x+j*185-30,y+40);sc.scale(.65,.85);sc.drawImage(cv,0,0);sc.restore();
      }
      sc.fillStyle='#ecebdc';sc.font='18px sans-serif';sc.fillText(C.SKILLS[id].name,(i%2)*600+22,Math.floor(i/2)*280+28);
      rows.push({id,animated:new Set(frames).size===3,pure:JSON.stringify(b)===before,trail:p.trail.length});
     }window.tuningSheet=sheet.toDataURL();return rows;}''')
    check(shell+': iron petals, blade tails and rush cloth animate without mutating physics',all(r['animated'] and r['pure'] for r in rendered),rendered)
    (OUT/(shell+'-vfx-sheet.png')).write_bytes(base64.b64decode(page.evaluate('tuningSheet').split(',')[1]))
    for sid in ['A08','S09','S12','S01','S04']:
        page.evaluate(r'''id=>{const {a,e,b,u}=tuningArena(id);e.fire(id,50,.75);steps(48);const p=b.projectiles[0];if(id==='A08'){e.impact(p,{x:1750,y:1550,n:{x:0,y:-1},terrain:b.terrain[0],t:0});steps(58);}else {a.scene.x=p.x-70;a.scene.y=p.y+80;a.scene.scale=1.15;}paint();}''',sid)
        owner.screenshot(path=str(OUT/(shell+'-'+sid+'.png')))
    # Active effect cost, tested sequentially without competing browser workloads.
    cost=page.evaluate(r'''()=>{const {e,b}=tuningArena('S12');e.fire('S12',45,.8);steps(35);const p=b.projectiles[0],c=document.createElement('canvas').getContext('2d'),times=[];c.translate(-p.x,-p.y);for(let i=0;i<120;i++){const start=performance.now();HONRO_CORE.drawRedesignProjectile(c,p);times.push(performance.now()-start);}times.sort((a,b)=>a-b);return{p95:times[114],max:times.at(-1)};}''')
    check(shell+': nine orbiting blade tails stay within frame budget',cost['p95']<6,cost)
    check(shell+': no runtime error',not page.evaluate('HonroApp.lastError||null'))

with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');suite(page,'Game')
    # A compact overview uses production SVG icons at the same 32px source resolution.
    page.evaluate("document.body.innerHTML='<main id=icons style=\"padding:24px;display:grid;grid-template-columns:repeat(7,1fr);gap:20px;color:#ddd;background:#16282d\">'+Object.values(HONRO_CORE.SKILLS).filter(s=>s.martial).map(s=>'<article style=\"text-align:center;padding:24px\">'+HONRO_CORE.icon('skill:'+s.id,'',48)+'<p>'+s.name+'</p></article>').join('')+'</main>'")
    page.locator('#icons').screenshot(path=str(OUT/'hwigyeom-icons.png'));page.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];suite(play,'Workshop');editor.click('#stopPlay');check('Workshop authored map survives training changes',saved==editor.evaluate('HonroWorkshopAPI.exportProject()'));browser.close()
check('No uncaught browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
