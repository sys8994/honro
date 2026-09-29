"""Deterministic dense combat rendering, hit flashes and charge guides (sequential)."""
import json, sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

tag=sys.argv[1] if len(sys.argv)>1 else 'after'
rows=[]; errors=[]
with sync_playwright() as p:
    browser=launch(p)
    for shell in ['Game','Workshop']:
        owner=browser.new_page(viewport={'width':1365,'height':768})
        owner.on('pageerror',lambda e:errors.append(str(e)))
        owner.goto((ROOT/('HONRO.html' if shell=='Game' else 'HONRO_WORKSHOP.html')).as_uri())
        if shell=='Workshop':
            owner.click('[data-tab=play]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
        else: page=owner
        page.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE;window.nativeFrame=a.frame.bind(a);a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.trainingClass='archer';a.launch(1,true,'A01');while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;
          const e=a.engine,b=e.b,u=e.active;Object.assign(b,{width:4000,height:1800,terrain:[{id:'floor',x:0,y:1300,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],honroLandmarks:[],honroSurfaceZones:[],honroMarkers:[],wind:0,practiceCombat:true});b.units=[u];Object.assign(u,{x:600,y:1300,angle:8,loadout:['A01'],ranks:{A01:1,AP01:4},vx:0,vy:0,acted:false});
          for(let i=0;i<28;i++)b.units.push(C.makeUnit('knight',1,900+(i%7)*100,1020+Math.floor(i/7)*85,{id:'stress-'+i,honroType:i%3?'beast':'human',honroVariant:i%2?'hound':'boar',fixed:true,hp:2000,maxHp:2000,h:100,r:20}));
          b.sceneVersion++;Object.assign(a.scene,{manual:true,x:1050,y:1150,scale:.82,storyTween:null,goalFocus:null,storyFrozen:false});a.updateHUD(true);
        }''')
        owner.wait_for_timeout(100)
        for scenario in ['idle','hit','charge']:
            data=page.evaluate('''async scenario=>{const a=HonroApp,e=a.engine,b=e.b,scene=a.scene,rows=[],intervals=[];let last=performance.now();
              for(let i=0;i<100;i++){await new Promise(requestAnimationFrame);const now=performance.now();if(i>=10)intervals.push(now-last);last=now;
                for(const u of b.units)if(u.side===1)u.hurt=scenario==='hit'?.55:0;
                const t=performance.now();scene.render(e,1/60,scenario==='charge'?'A01':'',scenario==='charge'?.2+(i%60)/100:.5,scenario==='charge',1/60);if(i>=10)rows.push(performance.now()-t);
              }rows.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);return{mean:rows.reduce((s,n)=>s+n,0)/rows.length,p95:rows[Math.floor(rows.length*.95)],frameP95:intervals[Math.floor(intervals.length*.95)],max:rows.at(-1),error:a.lastError||null};}''',scenario)
            row={'shell':shell,'scenario':scenario,**data};rows.append(row);print(json.dumps(row),flush=True)
            assert not data['error'],row
        if tag=='after':
            # Also exercise the real frame loop: physics, a fired volley, damage,
            # HUD/effects and audio. The first three rows remain comparable to before.
            page.locator('#battlecanvas').click()
            page.evaluate('''async()=>{const a=HonroApp,e=a.engine,b=e.b;a.profile.settings.sound=true;a.audio.configure(a.profile.settings);await a.audio.wake();for(const u of b.units)u.hurt=0;const u=e.active;u.angle=0;a.selected='A01';u.lastPower=.5;e.fire('A01',0,.5);a.prev=performance.now();}''')
            data=page.evaluate('''async()=>{const a=HonroApp,e=a.engine,b=e.b,rows=[],intervals=[],delays=[],spikes=[];let last=performance.now(),costs={};const realRAF=window.requestAnimationFrame,wrapped=[];
              for(const [object,key] of [[e,'tick'],[a.scene,'render'],[a,'updateHUD'],[a,'updateAudio'],[a,'missionTick']]){const fn=object[key];object[key]=function(...args){const t=performance.now();try{return fn.apply(this,args);}finally{costs[key]=(costs[key]||0)+performance.now()-t;}};wrapped.push(()=>object[key]=fn);}
              for(let i=0;i<180;i++){await new Promise(realRAF);const now=performance.now();if(i>=10)intervals.push(now-last);last=now;const t=performance.now(),phase=b.phase;costs={};
                if(i%30===0){for(const u of e.alive(1))e.hurt(u,1,b.units[0].id);a.audio.play('arrowhit');delays.push(a.audio.startedAt.arrowhit-a.audio.requestedAt.arrowhit);}
                // The native method schedules its successor; this harness owns that schedule.
                window.requestAnimationFrame=()=>0;try{nativeFrame(now);}finally{window.requestAnimationFrame=realRAF;}const elapsed=performance.now()-t;if(i>=10)rows.push(elapsed);if(elapsed>30)spikes.push({frame:i,phase,elapsed,costs});
              }for(const restore of wrapped)restore();rows.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);return{mean:rows.reduce((s,n)=>s+n,0)/rows.length,p95:rows[Math.floor(rows.length*.95)],frameP95:intervals[Math.floor(intervals.length*.95)],max:rows.at(-1),spikes,shots:b.shots,damaged:b.units.filter(u=>u.side===1&&u.hp<u.maxHp).length,audioDelay:Math.max(...delays),error:a.lastError||null};}''')
            row={'shell':shell,'scenario':'live',**data};rows.append(row);print(json.dumps(row),flush=True)
            assert not data['error'] and data['shots']>0 and data['damaged']==28 and data['audioDelay']<20 and data['max']<40,row
        owner.close()
    browser.close()
out=ROOT/f'_local/reports/finale-performance/combat-{tag}.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'rows':rows,'errors':errors},indent=2),encoding='utf-8')
assert not errors,errors
if tag=='after':
    for r in rows: assert r['mean']<10 and r['p95']<20 and r['frameP95']<45,r
