"""Observe the real NE bow frames, input and shared hit renderer in the chapter."""
import argparse, base64, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from native_entry import enter_chapter

ap = argparse.ArgumentParser()
ap.add_argument('--base', required=True)
ap.add_argument('--out', type=Path, required=True)
args = ap.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as driver:
    browser = driver.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1180,'height':760},device_scale_factor=2)
    log = {'errors':[]}
    page.on('pageerror', lambda e: log['errors'].append(str(e)))
    page.goto(args.base)
    enter_chapter(page)
    while page.locator('[data-action=dialogue-next]:visible').count():
        page.locator('[data-action=dialogue-next]:visible').first.click()
    page.wait_for_function('HonroApp.canInput() && !HonroStory.turnPaused(HonroApp)')
    assert page.locator('#jump,#drop,#wind-value').count() == 0
    lock = page.locator('#move-lock')
    assert lock.is_visible() and lock.get_attribute('aria-pressed') == 'false'
    def movement():
        return page.evaluate('()=>{const a=HonroApp,u=a.engine.active;return {x:u.x,y:u.y,move:u.moveLeft,bearing:a.displayAngle(u)};}')
    before = movement()
    page.keyboard.down('Shift')
    page.keyboard.down('ArrowUp')
    page.wait_for_function('()=>{const a=HonroApp,v=a.displayAngle(a.engine.active);return 5<v&&v<85;}')
    during = movement()
    page.wait_for_function('HonroApp.displayAngle(HonroApp.engine.active)<.1')
    page.keyboard.up('ArrowUp')
    north = movement()
    target = page.evaluate('''()=>{const a=HonroApp,u=a.engine.active,v=a.engine.damageAim(u),q=a.scene.screenPoint(v.x,v.y);return [q.x+90,q.y-26*a.scene.zoomLevel-90]}''')
    page.mouse.click(*target)
    ne = movement()
    page.keyboard.up('Shift')
    for state in [during,north,ne]:
        assert all(state[k]==before[k] for k in ('x','y','move')), (before,state)
    assert north['bearing'] < .1 and 43 < ne['bearing'] < 47 and lock.get_attribute('aria-pressed')=='false', (north,ne)
    log['shift'] = [before,during,north,ne]
    # Read back the game canvas immediately after the production renderer draws each pose.
    page.evaluate('''()=>{
        const a=HonroApp,s=a.scene,render=s.render,art=s.actorArt,frame=art.frame;
        window.bowCapture={};let pose='';
        art.frame=function(u,...args){const f=frame.call(this,u,...args);if(u.id==='p-archer')pose=f.key;return f};
        s.render=function(e,...args){
            const result=render.call(this,e,...args);
            if(!/^5[|](prepare|attack)[|]/.test(pose))return result;
            const name=pose.split('|')[1];if(bowCapture[name])return result;
            const u=e.unit('p-archer'),at=this.screenPoint(u.x,u.y-u.h/2),c=document.createElement('canvas');
            const ratio=this.canvas.width/this.canvas.getBoundingClientRect().width;c.width=114;c.height=116;
            c.getContext('2d').drawImage(this.canvas,(at.x-57)*ratio,(at.y-98)*ratio,114*ratio,116*ratio,0,0,114,116);
            bowCapture[name]={pose,image:c.toDataURL()};return result;
        };
    }''')
    r = page.locator('#fire').bounding_box()
    page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2)
    page.mouse.down()
    page.wait_for_function('!!bowCapture.prepare')
    page.mouse.up()
    page.wait_for_function('!!bowCapture.attack')
    for name,cell in page.evaluate('bowCapture').items():
        (args.out/f'field-ne-{name}.png').write_bytes(base64.b64decode(cell['image'].split(',')[1]))
        log[name]=cell['pose']
    # Native damage events and aggregation are generated on a disposable engine copy.
    log['feedback'] = page.evaluate('''()=>{
        const a=HonroApp,s=a.scene,e=new a.engine.constructor(structuredClone(a.engine.b));
        const hero=e.unit('p-archer'),foe=e.unit('watch-1-pass-1-1'),a0=hero.hp,f0=foe.hp;
        const texts=[],flashes=[],calls=[],actors=new Map(),art=s.actorArt,oldFrame=art.frame,oldActor=art.actor;
        const c=s.ctx,write=c.fillText,draw=s.drawDamageNumbers,widthBefore=s.canvas.width;
        e.onEvent=ev=>{if(ev.type==='fx'&&ev.damage){calls.push(ev);s.event(ev)}};
        e.hurt(foe,16,hero.id);e.hurt(foe,12,hero.id);e.hurt(hero,21,foe.id);
        art.frame=function(u,...rest){const item=oldFrame.call(this,u,...rest);actors.set(item,u.id);return item;};
        art.actor=function(ctx,item,at,hit){if(hit>0)flashes.push([actors.get(item),hit]);return oldActor.call(this,ctx,item,at,hit)};
        c.fillText=function(value,...rest){if(/^[0-9]+$/.test(value))texts.push(value);return write.call(this,value,...rest)};
        s.render(e,0,a.selected,0,false);
        art.frame=oldFrame;art.actor=oldActor;c.fillText=write;
        const rows=[...s.damageNumbers.values()].map(f=>[f.targetId,Math.round(f.total)]);
        return {widthBefore,widthAfter:s.canvas.width,shared:draw===HonroScene.prototype.drawDamageNumbers,rows,texts,flashes,events:calls.map(ev=>[ev.targetId,ev.damage]),lostHP:[a0-hero.hp,f0-foe.hp]};
    }''')
    f=log['feedback']
    assert f['widthBefore']==f['widthAfter'] and f['shared'] and len(f['events'])==3 and min(f['lostHP'])>0 and len(f['rows'])==2, f
    for actor,damage in f['rows']:
        assert str(damage) in f['texts'] and any(k==actor and v>0 for k,v in f['flashes']), f
    log['windAndRange'] = page.evaluate('''()=>{
        const a=HonroApp,e=a.engine,u=e.unit('p-archer'),s=HONRO_CORE.SKILLS.A01,d=document.querySelector('.tv-wind');
        const wind=p=>{const actor={...u,...p};HonroTopview.windDial(a,actor);const m=e.projectileOrigin(actor,s,actor.angle),f=e.forceSample({...m,skill:s.id,mode:s.mode,wind:s.wind,gravityScale:s.gravity??1});return {label:d.getAttribute('aria-label'),v:f,css:d.style.getPropertyValue('--bearing')};};
        const r=e.b.physics.regions[0],calm=wind({}),cross=wind({x:r.x+r.w/2,y:r.y+r.h/2});HonroTopview.windDial(a,u);
        const speeds=[0,.25,.5,.75,1].map(p=>Math.hypot(...Object.values(e.velocity(u,s,0,p))));
        const clocks=[1,7].map(round=>{const b={...e.b,round};return {time:HonroTimeOfDay.clockText(b),tint:HonroTimeOfDay.grade({},b).g.mul};});
        return {calm,cross,speeds,clocks};}''')
    w=log['windAndRange']
    assert w['calm']['label']=='바람 잔잔' and w['cross']['label']!='바람 잔잔' and w['clocks'][0]!=w['clocks'][1], w
    assert abs(w['speeds'][-1]/w['speeds'][0]-2)<.001
    assert not log['errors'],log['errors']
    (args.out/'presentation.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n')
    browser.close()
