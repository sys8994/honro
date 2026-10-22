"""Actual Canvas equality for orphan-only settled-hit cleanup in the built game."""
import gzip,json,sys,subprocess,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/battle-runtime/settled-hits';OUT.mkdir(parents=True,exist_ok=True)
old=subprocess.check_output(['git','show','b013e345:shared/runtime/combat-feedback.js'],cwd=ROOT,text=True)
old=old[old.index('S.settleHitFeedback=function'):old.index('S.hitFlashVisible=')]
d=json.loads(gzip.decompress((ROOT/'game/docs/battle-runtime-performance-20261022/evidence/saves/round1.json.gz').read_bytes()));p=d['profile'];p.update(game='honro',schema=4,lastStage=11,honroBattle=d['b']);p['settings'].update(music=False,sound=False)
with serve_game() as url,sync_playwright() as pw:
    browser=launch(pw);page=browser.new_page(viewport={'width':1280,'height':800})
    page.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(p))+');')
    page.goto(url+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.evaluate('HonroApp.frame=()=>{};void 0;')
    page.locator('.title-actions button.primary').click();page.wait_for_function('HonroApp.engine?.b.honroStage===11');page.wait_for_function('HonroAuthoredFarArt.ready(11)')
    result=page.evaluate('''old=>{const a=HonroApp,e=a.engine,b=e.b,s=a.scene,owner=e.heroesAlive().find(u=>u.cls==='occultist'),foe=e.alive(1)[0],fixed=s.settleHitFeedback,before=new Function('S',old+';return S.settleHitFeedback;')({});
      if(!String(fixed).includes('includes(hit.unit)'))throw Error('Build must contain the production cleanup');
      const u=e.spawnSummon(owner,'echo',owner.x+80,owner.y-80,1,1,false,undefined,'O08');while(b.round<u.summonExpires)e.newRound();e.hurt(u,1,foe.id);
      s.settleHitFeedback=before;before.call(s,e,true);before.call(s,e,false);if(!(u.hurt>0&&s.settledHits.has(u.id)))throw Error('Paused positive hurt must be settled');
      e.newRound();if(!u.dead||b.units.includes(u)||!(u.hurt>0))throw Error('Real expiry/prune must remove the still-hurt object');
      Object.assign(s,{manual:true,x:owner.x,y:owner.y-140,scale:.68,time:2,storyTween:null,goalFocus:null,focusUntil:0,speakerUntil:0});
      const state=JSON.stringify({units:b.units,projectiles:b.projectiles,terrain:b.terrain,heroes:b.heroes}),paint=()=>{s.render(e,0,'',.6,false,0,true);return s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data;};paint();paint();const left=paint(),oldRetains=s.settledHits.get(u.id)?.unit===u;
      s.settleHitFeedback=fixed;const right=paint();let changed=0,max=0;for(let i=0;i<left.length;i++)if(left[i]!==right[i]){changed++;max=Math.max(max,Math.abs(left[i]-right[i]));}
      return {removedId:u.id,hurt:u.hurt,oldRetains,fixedRetains:s.settledHits.has(u.id),changedChannels:changed,maxChannelDifference:max,gameStatePreserved:state===JSON.stringify({units:b.units,projectiles:b.projectiles,terrain:b.terrain,heroes:b.heroes}),error:a.lastError||null};}''',old)
    assert result['oldRetains'] and not result['fixedRetains'] and result['changedChannels']==0 and result['gameStatePreserved'] and not result['error'],result
    page.screenshot(path=str(OUT/'fixed-display.jpg'),type='jpeg',quality=90)
    result['manifestSha256']=hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest();(OUT/'browser.json').write_text(json.dumps(result,indent=2));print('PASS',result)
    browser.close()
