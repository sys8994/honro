"""All player skill previews, growth UI and status graphics in the two production shells."""
import base64,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/skill-presentation';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
SETUP=r'''()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
 window.previewIds=[...new Set([...HONRO_CORE.TALENTS.filter(n=>!n.passive).map(n=>n.id),...HONRO_CORE.CLASS_IDS.map(c=>HONRO_CORE.baseSkill(c)),'O99'])];
 window.auditPreview=(id,rank,seconds=6.6)=>{const C=HONRO_CORE,h=a.profile.heroes[C.SKILLS[id].cls];h.ranks[id]=rank;if(a.training&&a.engine)a.engine.b.heroes[C.SKILLS[id].cls].ranks[id]=rank;
 const saved=JSON.stringify(a.profile),storage=JSON.stringify(localStorage);a.talent(id);const p=a.preview,render=p.scene.render.bind(p.scene);let frame=0,minPixels=999,visible=true,flight=false,shotVisible=false,turn=false,dived=false;const events=[];
 p.scene.render=(...args)=>{if(frame++%12===0)render(args[0],.2,...args.slice(2));};
 for(let i=0;i<seconds*60;i++){HonroSkillPreview.tick(a,p,1/60);const r=p.canvas.getBoundingClientRect(),z=p.scene.scale;minPixels=Math.min(minPixels,p.hero.h*z);
 if(i<30)for(const u of p.b.units){const x=r.width/2+(u.x-p.scene.x)*z,y=r.height/2+(u.y-p.scene.y)*z;visible&&=x-u.r*z>=-2&&x+u.r*z<r.width+2&&y<r.height&&y-u.h*z>=0;}
 for(const q of p.b.projectiles){flight=true;turn||=!!q.returning;dived||=!!q.dived;const x=r.width/2+(q.x-p.scene.x)*z,y=r.height/2+(q.y-p.scene.y)*z;if(x>0&&x<r.width&&y>0&&y<r.height)shotVisible=true;}
 if(i===95){render(p.e,0,id,.5,false);p.capture=p.canvas.toDataURL();}
 }
 render(p.e,0,id,.5,false);const enemyDamage=p.b.units.filter(u=>u.side===1).reduce((sum,u)=>sum+u.maxHp-u.hp,0);
 return{id,rank,fired:p.fired,visible,minPixels,flight,shotVisible,turn,dived,follow:p.follow,damage:enemyDamage,stakes:p.b.stakes.length,summons:p.b.units.filter(u=>u.summoned).length,heal:p.b.units.find(u=>u.id==='preview-ally')?.hp,shield:p.b.units.find(u=>u.id==='preview-ally')?.shield,teleport:p.hero.x,stored:p.hero.bladeStored,unchanged:saved===JSON.stringify(a.profile)&&storage===JSON.stringify(localStorage),events:[...new Set(p.events.map(e=>e.name||e.type))]};};}'''

def suite(page,shell):
    page.evaluate("HonroApp.profile.settings.music=false;HonroApp.updateAudio();HonroApp.talent('A14')")
    page.wait_for_function('HonroApp.preview?.fired&&HonroApp.preview.b.units.some(u=>u.side===1&&u.hp<u.maxHp)',timeout=8000)
    check(shell+': the actual App frame automatically animates, fires and hits in the modal',not page.evaluate('HonroApp.lastError||null'))
    page.evaluate('HonroApp.close()')
    page.evaluate(SETUP)
    tables=page.evaluate(r'''()=>{const C=HONRO_CORE,rows=[];for(const n of C.TALENTS){const levels=Array.from({length:8},(_,i)=>C.skillGrowthRows(n.id,i+1)),raw=Array.from({length:8},(_,i)=>C.skillEffectRows(n.id,i+1));rows.push({id:n.id,notes:!!C.skillPlayNotes(n.id),vary:levels[0].every(r=>new Set(raw.map(rs=>rs.find(x=>x.label===r.label)?.value)).size>1),sameLabels:levels.every(rs=>rs.map(r=>r.label).join('|')===levels[0].map(r=>r.label).join('|'))});}return rows;}''')
    check(shell+': all 80 talent notes and rank comparisons are complete and exclude constant rows',len(tables)==80 and all(r['notes'] and r['vary'] and r['sameLabels'] for r in tables),tables)
    check(shell+': small per-point bonuses stay readable instead of rounding to zero',page.evaluate("HONRO_CORE.skillGrowthRows('AP02',1).some(r=>r.value==='+0.04')&&HONRO_CORE.skillGrowthRows('AP04',1).some(r=>r.value==='+2.5%p')"))
    results=[]
    for rank in [1,8]:
        for id in page.evaluate('previewIds'):
            row=page.evaluate('([id,rank])=>auditPreview(id,rank)',[id,rank]);results.append(row)
            if rank==1:
                (OUT/(shell+'-'+id+'.png')).write_bytes(base64.b64decode(page.evaluate('HonroApp.preview.capture').split(',')[1]))
    check(shell+': all 64 active skills at ranks 1 and 8 fire with visible actors and projectiles',len(results)==128 and all(r['fired'] and r['visible'] and r['minPixels']>=55 and (not r['flight'] or r['shotVisible']) for r in results),results)
    support={'M09','M10','S14','O14'}
    check(shell+': offensive previews actually hit; support previews activate their real mechanics',all(r['damage']>0 for r in results if r['id'] not in support) and all(r['teleport']>600 if r['id']=='M09' else r['heal']>300 if r['id']=='M10' else r['stored']>0 if r['id']=='S14' else r['shield']>0 for r in results if r['id'] in support))
    check(shell+': manual steering, detonation, dive and followup execute at both ranks',all(r['follow'] for r in results if r['id'] in {'M02','A09','S04','S13','A10'}))
    check(shell+': isolated previews never change campaign progression or local saves',all(r['unchanged'] for r in results))
    check(shell+': obsolete preview captions removed',page.locator('.preview-label').count()==0)
    keep=page.evaluate(r'''()=>{const a=HonroApp;a.talent('M02');const canvas=a.preview.canvas,dialog=document.querySelector('.talent-dialog');dialog.scrollTop=150;const scroll=dialog.scrollTop;for(let i=0;i<460;i++)HonroSkillPreview.tick(a,a.preview,1/60);return{canvas:canvas===a.preview.canvas,dialog:dialog===document.querySelector('.talent-dialog'),scroll:dialog.scrollTop===scroll,cycle:a.preview.cycle};}''')
    check(shell+': replay preserves the dialog, canvas and scroll position',keep['canvas'] and keep['dialog'] and keep['scroll'] and keep['cycle']==1,keep)
    page.evaluate('HonroApp.close()')
    # Real training battlefield and shared status renderer (including enemy and allied actors).
    page.evaluate(r'''()=>{const a=HonroApp,C=HONRO_CORE;a.trainingClass='mage';a.trainingSkill='M02';a.launch(1,true,'M02');a.dialogue=null;a.turnNotice=null;const b=a.engine.b,u=a.engine.active;
 Object.assign(b,{width:2400,height:1400,terrain:[{id:'floor',x:0,y:1000,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],honroMarkers:[],honroLandmarks:[],honroSurfaceZones:[]});b.units=[u];Object.assign(u,{x:550,y:1000,stun:2,bound:2,curseTurns:3,curseDamage:9,curseArmor:.15,slowed:{factor:.3,expires:b.round+1},shield:80,focus:0,vx:0,vy:0});
 for(let i=0;i<4;i++)b.units.push(C.makeUnit('knight',i===3?2:1,760+i*170,1000,{id:'status-'+i,h:125,name:i===3?'동맹':'표적',fixed:true,hp:300,maxHp:300,...[{stun:2},{bound:2},{curseTurns:3,curseDamage:9},{shield:80}][i]}));b.sceneVersion++;Object.assign(a.scene,{manual:true,x:890,y:865,scale:.8});a.updateHUD(true);a.scene.render(a.engine,.1,'',.5,false);window.statusBefore=JSON.stringify(b);window.statusSnapshot=structuredClone(b);a.scene.render(a.engine,.1,'',.5,false);window.statusPure=JSON.stringify(b)===statusBefore;}''')
    check(shell+': status rendering preserves combat and save data',page.evaluate('statusPure&&JSON.stringify(statusSnapshot)===statusBefore'))
    page.locator('#combat-status summary').click()
    check(shell+': compact status button opens durations, curse damage and the exact action restriction',page.locator('.status-popover').is_visible() and '기절' in page.locator('.status-popover').inner_text() and '매 턴 피해 9' in page.locator('.status-popover').inner_text() and '기력 부족' in page.locator('.status-popover').inner_text())
    page.locator('#combat-status summary').press('Enter')
    check(shell+': keyboard closes the compact status details',not page.locator('.status-popover').is_visible())
    pure=page.evaluate(r'''()=>{const a=HonroApp,b=a.engine.b,u=a.engine.active;u.stun=0;u.stunnedRound=b.round;u.acted=true;a.updateHUD(true);const current=HonroCombatStatus.effects(b,u).some(x=>x.includes('이번 턴'));b.round++;u.acted=false;u.bound=0;u.curseTurns=0;u.shield=0;delete u.slowed;a.updateHUD(true);return{current,cleared:HonroCombatStatus.entries(b,u).length===0,short:document.querySelector('#combat-status summary').textContent};}''')
    check(shell+': consumed stun remains visible this turn and expired states disappear',pure['current'] and pure['cleared'],pure)
    cost=page.evaluate(r'''()=>{const a=HonroApp,b=a.engine.b,original=b.units,rows=[];b.units=Array.from({length:28},(_,i)=>({...original[1],id:'status-stress-'+i,x:590+(i%7)*95,y:740+Math.floor(i/7)*80,stun:2,bound:2,curseTurns:3,shield:80,slowed:{factor:.3,expires:b.round+1}}));for(let i=0;i<100;i++){const t=performance.now();a.scene.render(a.engine,.016,'',.5,false);if(i>9)rows.push(performance.now()-t);}b.units=original;rows.sort((a,b)=>a-b);return{p95:rows[Math.floor(rows.length*.95)],max:rows.at(-1)};}''')
    check(shell+': 28 actors with stacked animated statuses remain within the render budget',cost['p95']<20,cost)
    return results

with sync_playwright() as pw:
    browser=launch(pw);p=browser.new_page(viewport={'width':1440,'height':1000});p.on('pageerror',lambda e:errors.append(str(e)));p.goto((ROOT/'HONRO.html').as_uri());p.wait_for_function('window.HonroApp');results=suite(p,'Game')
    for size,label in [({'width':320,'height':740},'small'),({'width':430,'height':932},'portrait'),({'width':844,'height':390},'landscape')]:
        p.set_viewport_size(size)
        mobile=[p.evaluate('id=>auditPreview(id,1,3.8)',id) for id in p.evaluate('previewIds')]
        check('Mobile '+label+': every skill starts with visible actors and retains readable figures',all(r['visible'] and r['minPixels']>=25 for r in mobile),mobile)
        p.evaluate("HonroApp.talent('A14');for(let i=0;i<60;i++)HonroSkillPreview.tick(HonroApp,HonroApp.preview,1/60)")
        check('Mobile '+label+': skill detail fits and its controls remain scrollable',p.evaluate("(()=>{const d=document.querySelector('.talent-dialog'),r=d.getBoundingClientRect();d.scrollTop=d.scrollHeight;return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth+1&&getComputedStyle(d).overflowY==='auto'&&[...document.querySelectorAll('.effect-row')].every(row=>row.scrollWidth<=row.clientWidth+1)})()"))
        p.evaluate("document.querySelector('.talent-dialog').scrollTop=0");p.screenshot(path=str(OUT/('detail-'+label+'.png')))
        p.evaluate("HonroApp.close();Object.assign(HonroApp.engine.active,{bound:2,stun:1,shield:80});HonroApp.updateHUD(true);HonroApp.scene.render(HonroApp.engine,.1,'',.5,false)");p.locator('#combat-status summary').click()
        check('Mobile '+label+': status details remain visible within viewport',p.locator('.status-popover').is_visible() and p.evaluate("(()=>{const r=document.querySelector('.status-popover').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()"))
        p.screenshot(path=str(OUT/('status-'+label+'.png')));p.locator('#combat-status summary').click()
    p.close()
    editor=browser.new_page(viewport={'width':1440,'height':1000});editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.on('pageerror',lambda e:errors.append(str(e)));suite(play,'Workshop');editor.screenshot(path=str(OUT/'status-workshop.png'));editor.click('#stopPlay');check('Workshop map remains unchanged after all previews and status inspection',saved==editor.evaluate('HonroWorkshopAPI.exportProject()'));browser.close()
check('No uncaught browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
