"""Measure NPC decisions on campaign terrain through native App frames, serially."""
import json, sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/npc-action-latency'
OUT.mkdir(parents=True, exist_ok=True)
tag = sys.argv[1] if len(sys.argv)>1 else 'after'
results=[]; errors=[]
with sync_playwright() as p:
    browser=launch(p)
    for shell in ['Game','Workshop']:
        owner=browser.new_page(viewport={'width':1440,'height':900})
        owner.on('pageerror',lambda e:errors.append(str(e)))
        owner.goto((ROOT/('HONRO.html' if shell=='Game' else 'HONRO_WORKSHOP.html')).as_uri())
        if shell=='Workshop':
            owner.click('[data-tab=play]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
        else:page=owner
        page.evaluate('''()=>{const a=HonroApp;window.nativeFrame=a.frame.bind(a);a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();for(let i=1;i<=10;i++)a.profile.cleared[i]=true;}''')
        cases=[{'stage':s,'index':i,'side':'enemy'} for s in [1,3,5,7,8,10] for i in [0,1,2]]
        cases += [{'stage':2,'index':i,'side':'ally'} for i in [0,1,2]]
        for case in cases:
            data=page.evaluate('''async config=>{
              const a=HonroApp,C=HONRO_CORE;a.launchMap(HONRO_PROJECT,'stage-'+config.stage);
              let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;
              const e=a.engine,b=e.b;b.honroEvents=[];b.honroState.deferredStory=[];b.honroState.storyQueue=[];e.checkEnd=()=>false;
              for(let k=0;k<120;k++)e.stepUnits(C.STEP);
              const roster=config.side==='enemy'?e.alive(1).filter(u=>!u.boss):b.units.filter(u=>u.honroAlly);
              const u=roster[config.index];if(!u)return {skipped:true};
              b.active=u.id;b.phase=config.side;b.side=config.side==='enemy'?1:0;b.turnAge=0;b.queue=[u.id];u.acted=false;
              if(config.side==='ally')b.honroState.allyQueue={ids:[u.id],index:0,returnActive:e.heroesAlive()[0].id,phase:'begin',elapsed:0,started:false};
              let probes=0,plans=0,cpu=0,probeMs=0,maxFrame=0,firstMove=null,decision=null,lastMoved=0,stillFrames=0,longestStill=0;
              const predict=e.predict.bind(e);e.predict=(...args)=>{const t=performance.now(),r=predict(...args);probeMs+=performance.now()-t;probes++;return r;};
              const plan=e.enemyActionSteps?.bind(e);if(plan)e.enemyActionSteps=function(){plans++;return plan();};
              const realRAF=window.requestAnimationFrame,start=performance.now();a.prev=start;a.acc=0;const x=u.x,y=u.y;let frames=0;
              while(frames<300){await new Promise(realRAF);const now=performance.now(),oldX=u.x,oldY=u.y;
                window.requestAnimationFrame=()=>0;try{nativeFrame(now);}finally{window.requestAnimationFrame=realRAF;}
                const frameCpu=performance.now()-now;cpu+=frameCpu;maxFrame=Math.max(maxFrame,frameCpu);frames++;
                if(Math.hypot(oldX-u.x,oldY-u.y)>.1){if(firstMove===null)firstMove={frames,ms:performance.now()-start,probes};lastMoved=frames;stillFrames=0;}else{stillFrames++;longestStill=Math.max(longestStill,stillFrames);}
                const q=b.honroState.allyQueue;
                if(b.phase!=='enemy'&&config.side==='enemy'||config.side==='ally'&&(!q||['after','flight'].includes(q.phase))){decision={frames,ms:performance.now()-start,sinceMoveFrames:frames-lastMoved,phase:b.phase,allyPhase:q?.phase,intent:u.intent};break;}
              }
              return {...config,id:u.id,kind:u.honroType||u.allyRole,x,y,firstMove,decision,frames,probes,plans,cpu,probeMs,maxFrame,longestStill,busy:e.settleBusy(),phase:b.phase,error:a.lastError||null};
            }''',case)
            data['shell']=shell;results.append(data)
            print(json.dumps(data,ensure_ascii=False),flush=True)
        # Real defend input reaches the allied queue; measure the automatic handoff
        # after a damage-free support action, including the native story/HUD loop.
        page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-2');let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;
          const b=a.engine.b;b.honroEvents=[];b.honroState.storyQueue=[];b.honroState.deferredStory=[];a.updateHUD(true);a.prev=performance.now();a.acc=0;}''')
        page.locator('[data-action=defend]').click()
        data=page.evaluate('''async()=>{const a=HonroApp,e=a.engine,b=e.b,raf=window.requestAnimationFrame;let after=null,handoff=null,frames=0,allySeen=false;
          while(frames++<480){await new Promise(raf);const now=performance.now();window.requestAnimationFrame=()=>0;try{nativeFrame(now);}finally{window.requestAnimationFrame=raf;}
            const q=b.honroState.allyQueue;if(q){allySeen=true;if(q.phase==='after'&&!after&&!Object.keys(b.reviewDamage||{}).length)after={index:q.index,at:now};if(after&&q.index>after.index){handoff=now-after.at;break;}}
          }return {kind:'defend-input-allied-handoff',allySeen,frames,handoff,error:a.lastError||null};}''')
        data['shell']=shell;results.append(data);print(json.dumps(data,ensure_ascii=False),flush=True)
        assert data['allySeen'] and data['handoff'] is not None and data['handoff']<400,data
        owner.screenshot(path=str(OUT/(shell+'-allied-handoff.png')))
        owner.close()
    browser.close()
(OUT/(tag+'-browser.json')).write_text(json.dumps({'results':results,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert not errors,errors
if tag!='before':
    for r in results:
        if r.get('skipped') or r['kind']=='defend-input-allied-handoff':continue
        assert r['decision'] and not r['error'],r
        assert (r['firstMove'] or r['decision'])['frames']<=16,r
        assert r['decision']['sinceMoveFrames']<=20,r
        assert r['longestStill']<=20,r
