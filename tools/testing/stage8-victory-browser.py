"""Real browser Continue from a native normal-resource R37 save and final shot.
Not a browser full-chapter playthrough. No live battle state injection after Continue.
"""
import json,sys,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]; source=Path(sys.argv[1]);trace=Path(sys.argv[2]);out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
data=json.loads(source.read_text());shot=[x for x in json.loads(trace.read_text())['actions'] if x['op']=='fire'][-1]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8852/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(8);HonroApp.frame=()=>{};}');p.evaluate('v=>{HonroApp.profile=v;HonroApp.continue();}',data['profile']);p.wait_for_function('HonroAuthoredFarArt.ready(8)')
 result=p.evaluate('''s=>{const a=HonroApp,e=a.engine,b=e.b;for(let i=0;i<40&&a.dialogue;i++)HonroStory.finish(a);a.close();HonroStory.tick(a,performance.now()+3000);const before=JSON.parse(JSON.stringify({phase:b.phase,round:b.round,items:b.items,units:b.units}));if(!a.canInput()||e.active.cls!==s.hero)throw Error('Incorrect real active actor');if(!e.fire(s.skill,s.angle,s.power))throw Error('Normal shot rejected');let ticks=0;for(;ticks<1500&&b.phase!=='won'&&b.phase!=='lost';ticks++){e.tick(HONRO_CORE.STEP);a.missionTick(HONRO_CORE.STEP);}if(b.phase!=='won')throw Error('Final real shot did not win');const battleEnd=b.units.filter(u=>u.side===0).map(u=>({cls:u.cls,hp:u.hp}));for(let i=0;i<40&&a.dialogue;i++)HonroStory.finish(a);a.outcome();for(let i=0;i<40&&a.dialogue;i++)HonroStory.finish(a);return{before,battleEnd,ticks,phase:b.phase,round:b.round,cleared:a.profile.cleared[8],items:b.items};}''',shot)
 p.screenshot(path=str(out/'victory.png'));(out/'capture.json').write_text(json.dumps({'scope':__doc__,'source':str(source),'shot':shot,'result':result,'errors':errors,'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()},indent=2));print(result['phase'],result['round'],result['battleEnd'],errors);b.close()
