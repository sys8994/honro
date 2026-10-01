"""Focused live checks for practice swaps and the revised combat guides."""
import base64
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/combat-polish'
OUT.mkdir(parents=True, exist_ok=True)

CHECK = r'''() => {
 const a=HonroApp,C=HONRO_CORE;
 a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 a.trainingClass='mage';a.trainingSkill='M01';a.launch(1,true,'M01');a.dialogue=null;a.turnNotice=null;
 const e=a.engine,b=e.b,hero=e.heroesAlive().find(v=>v.cls==='mage');
 const duplicate=C.makeUnit('mage',0,hero.x+45,hero.y,{id:'p-duplicate',loadout:['M01']});
 const enemy=b.units.find(v=>v.side===1&&!v.dead);
 b.units.push(duplicate);b.active=enemy.id;b.side=1;b.phase='aim';
 const enemyCount=b.units.filter(v=>v.side===1&&!v.dead).length;
 HonroTraining.open(a);
 a.modal.querySelector('[data-training-action="hero"][data-value="occultist"]').click();
 a.modal.querySelector('[data-training-action="apply"]').click();
 const swapped={heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.enthrall).map(v=>v.cls),enemyCount:b.units.filter(v=>v.side===1&&!v.dead).length,active:b.active,enemyId:enemy.id};
 const u=b.units.find(v=>v.side===0&&!v.summoned);
 Object.assign(b,{width:2400,height:1700,wind:0,fields:[],waters:[],drafts:[],terrain:[{id:'floor',x:0,y:1300,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999},{id:'wall',x:800,y:600,w:35,h:700,mat:'rock',hp:99999,maxHp:99999}]});
 b.units=[u];Object.assign(u,{x:400,y:1300,angle:20,lastPower:.7,focus:9999,maxFocus:9999,loadout:['M11','M05'],ranks:{M01:1,M11:8,M05:8}});
 b.active=u.id;b.side=0;b.phase='aim';a.selected='M11';
 const bounce=e.predict(u,C.SKILLS.M11,20,.7),bounceSegments=bounce.points.length;
 const bounceAfterImpact=bounce.contacts.length>0&&bounce.points.some(v=>v.x>bounce.contacts[0].x+40||v.x<bounce.contacts[0].x-40);
 Object.assign(a.scene,{manual:true,x:660,y:1050,scale:.7});a.scene.render(e,0,'M11',.7,false,0);window.combatPolishBounce=document.getElementById('battlecanvas').toDataURL();
 u.angle=40;a.selected='M05';const sky=e.predict(u,C.SKILLS.M05,40,.72);
 // Place a roof only in the falling lightning's path, clear of the launched gourd.
 const roof={id:'sky-roof',x:sky.x-85,y:sky.y-165,w:170,h:18,mat:'rock',hp:99999,maxHp:99999};
 b.terrain.push(roof);b.sceneVersion++;
 const skyRoof=e.predict(u,C.SKILLS.M05,40,.72);
 const skyInfo={gourd:{x:skyRoof.x,y:skyRoof.y},bolt:skyRoof.secondaryPoint,radius:skyRoof.secondaryRadius,roofY:roof.y,initial:sky.secondaryPoint};
 const events=[],emit=e.onEvent;e.onEvent=event=>{events.push(event);emit(event);};
 if(!e.fire('M05',40,.72))throw Error('M05 did not cast');
 const skyProjectile=b.projectiles.find(p=>p.skill==='M05');
 skyInfo.actualRadius=skyProjectile.blast;
 e.impact(skyProjectile,{x:skyRoof.x,y:skyRoof.y,t:0,n:{x:-1,y:0},terrain:b.terrain[1]});
 for(let i=0;i<45;i++)e.stepProjectile(skyProjectile,1/120);
 const boltEvent=events.find(event=>event.name==='lightningBolt');skyInfo.actual=boltEvent?{x:boltEvent.x2,y:boltEvent.y2}:null;
 // The convergence sequence uses the same canvas, engine, and projection as play.
 a.trainingClass='occultist';a.trainingSkill='O16';a.launch(1,true,'O16');a.dialogue=null;a.turnNotice=null;
 const f=a.engine,d=f.b,s=f.heroesAlive().find(v=>v.cls==='occultist');f.checkEnd=()=>false;
 Object.assign(d,{width:2400,height:1700,wind:0,fields:[],waters:[],drafts:[],terrain:[{id:'floor',x:0,y:1300,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999}]});
 d.units=[s];Object.assign(s,{x:440,y:1300,angle:25,lastPower:.7,focus:9999,maxFocus:9999,attack:1,loadout:['O16'],ranks:{O01:1,O16:8},acted:false});
 d.active=s.id;d.side=0;d.phase='aim';a.selected='O16';Object.assign(a.scene,{manual:true,x:650,y:1080,scale:.65});
 a.scene.render(f,0,'O16',.7,false,0);
 const guideCanvas=document.getElementById('battlecanvas');window.combatPolishGuide=guideCanvas.toDataURL();
 if(!f.fire('O16',25,.7))throw Error('O16 did not cast');
 const root=d.projectiles.find(p=>p.skill==='O16'&&p.mode==='spiritConverge');if(!root)throw Error('O16 root missing: '+JSON.stringify(d.projectiles.map(p=>({skill:p.skill,mode:p.mode})))+' volley '+JSON.stringify(d.volley));
 f.impact(root,{x:860,y:1050,t:0,n:{x:0,y:-1},terrain:d.terrain[0]});
 const children=d.projectiles.filter(p=>p.mode==='convergeSpirit');if(!children.length)throw Error('O16 children missing: '+JSON.stringify(d.projectiles.map(p=>({skill:p.skill,mode:p.mode}))));
 const wait=children.map(p=>p.curve.delay);const start=children[0].curve.start;
 for(let i=0;i<68;i++)for(const p of [...d.projectiles])if(p.mode==='convergeSpirit')f.stepProjectile(p,1/120);
 a.scene.render(f,0,'O16',.7,false,0);a.updateHUD(true);
 return {swapped,bounce:{contacts:bounce.contacts,segments:bounceSegments,after:bounceAfterImpact},sky:skyInfo,converge:{count:children.length,delays:wait,maxDistance:Math.max(...children.map(p=>Math.hypot(p.curve.spread.x-start.x,p.curve.spread.y-start.y))),active:d.projectiles.filter(p=>p.mode==='convergeSpirit').length}};
}'''

with sync_playwright() as playwright:
    browser = launch(playwright)
    errors = []
    for name, html in [('game', 'HONRO.html'), ('workshop', 'HONRO_WORKSHOP.html')]:
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.goto((ROOT / html).as_uri())
        if name == 'workshop':
            page.wait_for_function('window.HonroWorkshopAPI')
            page.click('[data-tab=play]')
            page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
            host = page.frames[1]
        else:
            page.wait_for_function('window.HonroApp')
            host = page
        result = host.evaluate(CHECK)
        assert result['swapped']['heroes'] == ['occultist'], result
        assert result['swapped']['active'] == result['swapped']['enemyId'], result
        assert result['swapped']['enemyCount'] > 0, result
        assert result['bounce']['contacts'] and result['bounce']['after'], result
        assert result['sky']['bolt'] and result['sky']['radius'] > 0, result
        assert abs(result['sky']['radius']-result['sky']['actualRadius']) < .01, result
        assert result['sky']['actual'] and abs(result['sky']['bolt']['y'] - result['sky']['actual']['y']) < 3, result
        assert result['converge']['count'] == 14 and result['converge']['maxDistance'] > 225, result
        assert all(.049 < b-a < .101 for a,b in zip(result['converge']['delays'], result['converge']['delays'][1:])), result
        host.locator('#battlecanvas').screenshot(path=str(OUT / (name + '-convergence.png')))
        bounce_url=host.evaluate('window.combatPolishBounce')
        (OUT / (name + '-bounce.png')).write_bytes(base64.b64decode(bounce_url.split(',',1)[1]))
        guide_url=host.evaluate('window.combatPolishGuide')
        (OUT / (name + '-convergence-guide.png')).write_bytes(base64.b64decode(guide_url.split(',',1)[1]))
        print('PASS', name, json.dumps(result, ensure_ascii=False), flush=True)
        page.close()
    browser.close()
    assert not errors, errors
