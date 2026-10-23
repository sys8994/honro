import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/keeper-boss-identity-20261023';profile=json.loads((ROOT/'_local/reports/player-turn-order-20261023/four-profile.json').read_text())
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('async()=>{const a=HonroApp;a.frame=()=>{};await HonroCampaignLoader.ensureStage(18);a.launch(18);for(let i=0;a.dialogue&&i<100;i++)HonroStory.next(a);a.close();a.turnNotice=null;document.getElementById("turn-banner").hidden=true;}')
 def click(id):
  pt=p.evaluate('''id=>{const a=HonroApp,u=a.engine.unit(id),s=a.scene;s.manual=true;s.x=u.x;s.y=u.y-u.h/2;s.scale=.7;s.goalFocus=s.storyTween=s.cinematic=null;s.focusUntil=s.speakerUntil=0;s.render(a.engine,0,a.selected,a.power,false,0);const r=s.canvas.getBoundingClientRect();return{x:r.left+r.width/2+(u.x-s.x)*s.scale,y:r.top+r.height/2+(u.y-u.h/2-s.y)*s.scale};}''',id);p.mouse.click(pt['x'],pt['y']);p.evaluate('HonroUnitInfo.tick(HonroApp)')
 click('act2-keeper');p.wait_for_function('document.querySelector(".unit-info-portrait canvas").dataset.portraitState==="ready"');assert p.locator('#unit-info').get_attribute('data-rank')=='boss';assert '2막 우두머리' in p.locator('.unit-info-side').inner_text();assert p.locator('.unit-info-health span').inner_text()=='880 / 880';p.screenshot(path=str(OUT/'390-boss-info.jpg'),type='jpeg',quality=90)
 p.locator('.unit-info-portrait').click();assert p.locator('.unit-portrait-dialog').is_visible();p.keyboard.press('Escape');assert p.locator('#unit-info').get_attribute('data-rank')=='boss'
 p.set_viewport_size({'width':844,'height':390});click('act2-keeper');p.screenshot(path=str(OUT/'844-boss-info.jpg'),type='jpeg',quality=90)
 other=p.evaluate("HonroApp.engine.b.units.find(u=>u.side===1&&!u.honroAct2Boss&&!u.honroSpirit&&!u.honroObjectiveTarget&&HonroAct2.visible(HonroApp.engine.b,u))?.id");assert other;click(other);assert p.locator('#unit-info').get_attribute('data-rank')!='boss';assert '우두머리' not in p.locator('.unit-info-side').inner_text();assert not errors
 (OUT/'browser.json').write_text(json.dumps({'label':'적군 · 2막 우두머리','hp':'880 / 880','normalId':other,'portraitAndClosePreserved':True,'errors':errors,'scope':'Prepared actual stage18 entry and camera, actual click; no full battle or physical-device claim.'},ensure_ascii=False,indent=2));b.close();print('PASS keeper2막boss label, portrait/HP, normal comparison390/844')
