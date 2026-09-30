"""M99 boundary crossing must not leave an enemy turn waiting in either HTML host."""
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

RUN = r'''()=>{
 const a=HonroApp,C=HONRO_CORE;
 a.frame=()=>{};
 a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 a.launch(1,true,'M99');a.frame=()=>{};
 const e=a.engine,b=e.b,caster=e.active;
 b.mode='campaign';b.width=2400;b.height=2200;b.wind=0;
 b.terrain=[{id:'floor',x:0,y:1800,w:2400,h:400,mat:'rock',hp:99999,maxHp:99999}];
 b.fields=[];b.drafts=[];b.waters=[];b.zones=[];
 Object.assign(caster,{x:400,y:1800,dead:false,hp:caster.maxHp,acted:true});
 const enemy=C.makeUnit('archer',1,1000,1800,{id:'sealed-enemy',role:'dummy',fixed:false,hp:10000,maxHp:10000,loadout:['LA01']});
 b.units=[caster,enemy];
 b.stakes=[{id:900,skill:'M99',owner:caster.id,side:0,x:1000,y:1800,rank:1,damage:10,shot:1,expires:b.round+4}];
 b.queue=[enemy.id];b.active=enemy.id;b.side=1;b.phase='enemy';e.checkEnd=()=>false;
 C.tickRedesign(e,0);
 const active=b.stakes[0].active,inside=b.stakes[0].inside.includes(enemy.id);
 enemy.y=1450;enemy.airborne=false;enemy.vx=enemy.vy=0;
 let ticks=0;for(;ticks<720&&!enemy.acted;ticks++)e.tick(C.STEP);
 a.scene.render(e,0,'',.6,false,0);
 return {active,inside,acted:enemy.acted,ticks,y:enemy.y,phase:b.phase};
}'''

errors=[]
with sync_playwright() as p:
    browser=launch(p)
    for host in ('HONRO.html','HONRO_WORKSHOP.html'):
        owner=browser.new_page(viewport={'width':1440,'height':900})
        owner.on('pageerror',lambda error: errors.append(str(error)))
        owner.goto((ROOT/host).as_uri())
        if host.endswith('WORKSHOP.html'):
            owner.click('[data-tab="play"]')
            owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
            page=owner.frames[1]
            page.on('pageerror',lambda error: errors.append(str(error)))
        else:
            page=owner
            page.wait_for_function('window.HonroApp')
        result=page.evaluate(RUN)
        assert result['active'] and result['inside'] and result['acted'],(host,result)
        print('PASS',host,result,flush=True)
        owner.close()
    browser.close()
assert not errors,errors
