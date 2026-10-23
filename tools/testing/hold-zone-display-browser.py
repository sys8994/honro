"""Prepared actual silence interaction at R3, live guide pixels and Continue."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/hold-zone-display-20261023';profile=json.loads((OUT/'r3-active-profile.json').read_text());rows=[];errors=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(18);HonroApp.frame=()=>{};HonroApp.continue();HonroApp.turnNotice=null;const n=document.getElementById("turn-banner");if(n)n.hidden=true;}');p.wait_for_function('HonroApp.engine?.b.round===3')
 snapshot=p.evaluate('JSON.stringify(HonroApp.engine.b)');p.wait_for_function('HonroAuthoredFarArt.ready(18)',timeout=90000)
 def paint(name,scale=None,away=False):
  r=p.evaluate('''q=>{const a=HonroApp,e=a.engine,s=a.scene,u=e.heroesAlive().find(u=>u.cls==='mage'),step=HonroAct2.current(e.b),h=HonroAct2Art.holdGuide(e.b,step);if(q.scale){s.scale=q.scale;s.x=q.away?h.x+3200:u.x;s.y=q.away?h.y+1200:u.y-180;s.manual=true;s.goalFocus=null;s.storyTween=null;s.focusUntil=s.speakerUntil=0;}a.updateHUD(true);const text=[],ctx=s.ctx,fill=ctx.fillText;ctx.fillText=function(t,...x){text.push(t);return fill.call(this,t,...x)};s.render(e,0,a.selected,a.power,false,0);ctx.fillText=fill;return{hold:h,step:{id:step.id,radius:step.radius,contestRadius:step.contestRadius},camera:{x:s.x,y:s.y,scale:s.scale},texts:text};}''',{'scale':scale,'away':away})
  assert r['hold']and r['hold']['radius']==r['step']['radius']and r['hold']['contestRadius']==0
  assert not any('점선' in t for t in r['texts']),r['texts'];p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=90);rows.append({'case':name,**r});return r
 paint('390-current',.68);paint('390-wide',.24);away=paint('390-offscreen',.5,True);assert any('화면 밖' in t and '수비 범위' in t for t in away['texts'])
 p.locator('#objective-text').click();p.locator('[data-action=view-hold-zone]').click();focus=paint('390-goal-view');assert p.evaluate('HonroApp.scene.goalFocus.id')=='hold-silence'
 p.set_viewport_size({'width':844,'height':390});paint('844-current',.5);p.locator('#objective-text').click();p.locator('[data-action=view-hold-zone]').click();paint('844-goal-view')
 # Current saved state generates the guide without a display-only migration.
 p.evaluate('HonroApp.profile.honroBattle=structuredClone(HonroApp.engine.b);HonroApp.continue();HonroApp.turnNotice=null');assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==snapshot;paint('844-continue',.3)
 assert not errors,errors;(OUT/'browser.json').write_text(json.dumps({'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'ContinueExact':True,'errors':errors,'scope':'R3 created by actual newRound/newRound plus silence interaction; all actors retained. Prepared marker approach and camera, not normal battle completion or physical device.'},ensure_ascii=False,indent=2));b.close();print('PASS R3 circle current/zoom/offscreen/goal-view,390/844, Continue exact')
