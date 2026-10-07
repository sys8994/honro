"""Real Act3 geometry and maximum finite roster. Rendering fixture, not a clear."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

rows, errors = [], []
with sync_playwright() as p:
    browser = launch(p)
    for shell, file in [('Game', 'HONRO.html'), ('Playtest', 'HONRO_WORKSHOP.html')]:
        owner = browser.new_page(viewport={'width':1365,'height':768})
        owner.on('pageerror', lambda e: errors.append(str(e)))
        owner.goto((ROOT/file).as_uri())
        if shell == 'Playtest':
            owner.click('[data-tab=play]')
            owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
            page = owner.frames[1]
        else:
            page = owner
        roster = page.evaluate('''()=>{
          const a=HonroApp;a.frame=()=>{};
          a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(HONRO_PROJECT.stages[27])};
          for(let i=1;i<28;i++)a.profile.cleared[i]={};
          a.profile.settings.music=false;a.profile.settings.sound=false;
          if(globalThis.HONRO_EMBEDDED)a.launchMap(HONRO_PROJECT,'stage-28',{story:false});else a.launch(28);
          while(a.dialogue)HonroStory.finish(a);a.close();a.done=true;a.turnNotice=null;
          a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;
          const e=a.engine,b=e.b;e.checkEnd=()=>false;
          for(const ev of b.honroEvents.filter(ev=>ev.action?.act3Authored))
            if(!HonroAllies.execute(a,ev.action))throw Error('Blocked authored entry '+ev.id);
          const step=HonroAct3.steps(b).find(s=>s.kind==='hold'),m=HonroAct3.marker(b,'wave-'+step.id);
          if(!HonroAllies.execute(a,{type:'spawn',kind:step.wave.kind,n:step.wave.count,x:m.x,y:m.y}))throw Error('Blocked defence entry');
          Object.assign(a.scene,{manual:true,x:b.width/2,y:2350,scale:.2});
          a.updateHUD(true);return{count:e.alive(1).length,cap:HonroEncounters.populationCap(b),active:b.enemyLimit};
        }''')
        assert roster == {'count':33,'cap':33,'active':3}, roster
        page.wait_for_function('HonroAct1Background.ready(28)')
        for zoom in [.2,.82]:
            page.evaluate('''z=>{const s=HonroApp.scene;s.scale=z;s.x=z>.5?5300:HonroApp.engine.b.width/2;}''', zoom)
            owner.wait_for_timeout(500)
            data = page.evaluate('''async()=>{
              const a=HonroApp,e=a.engine,b=e.b,draw=[],intervals=[];let last=performance.now();
              for(let i=0;i<150;i++){
                await new Promise(requestAnimationFrame);const now=performance.now();if(i>=20)intervals.push(now-last);last=now;
                if(i%30===0){b.shot++;for(const u of e.alive(1).slice(-10))e.hurt(u,1,e.heroesAlive()[0].id);a.updateHUD(true);}
                const t=performance.now();a.scene.render(e,1/60,'',.6,false,1/60);if(i>=20)draw.push(performance.now()-t);
              }
              draw.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);
              return{count:e.alive(1).length,mean:draw.reduce((n,x)=>n+x,0)/draw.length,p95:draw[Math.floor(draw.length*.95)],frameP95:intervals[Math.floor(intervals.length*.95)],numbers:a.scene.damageNumbers.size,error:a.lastError||null};
            }''')
            row={'shell':shell,'zoom':zoom,**roster,**data};rows.append(row)
            print(json.dumps(row),flush=True)
            assert data['count']==33 and data['numbers']>0 and not data['error'],row
            assert data['mean']<10 and data['p95']<20 and data['frameP95']<45,row
        owner.close()
    browser.close()
assert not errors, errors
out=ROOT/'_local/reports/act3-response-performance.json'
out.write_text(json.dumps({'rows':rows,'errors':errors,'scope':'Actual map and supported initial/response/defence actors; explicit peak-rendering fixture, not normal play or a campaign clear.'},indent=2),encoding='utf-8')
