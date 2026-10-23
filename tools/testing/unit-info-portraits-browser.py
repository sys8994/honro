"""Prepared stage entries, actual canvas clicks and retained portrait viewer."""
from pathlib import Path
import sys,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/unit-info-portraits-20261023';OUT.mkdir(parents=True,exist_ok=True)
profile=json.loads((ROOT/'_local/reports/player-turn-order-20261023/four-profile.json').read_text());rows=[];errors=[];http=[]
with serve_game()as base,sync_playwright()as pw:
 browser=launch(pw);c=browser.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000);p.evaluate('HonroApp.frame=()=>{}')
 def launch(stage):
  p.evaluate('async id=>{const a=HonroApp;a.close();await HonroCampaignLoader.ensureStage(id);a.launch(id);for(let i=0;a.dialogue&&i<100;i++)HonroStory.next(a);a.close();a.turnNotice=null;const banner=document.getElementById("turn-banner");if(banner)banner.hidden=true;a.scene.manual=true;a.engine.checkEnd=()=>false;}',stage)
  p.wait_for_function('HonroApp.engine&& !HonroApp.dialogue')
 def paint(id):
  return p.evaluate('''id=>{const a=HonroApp,u=a.engine.unit(id),s=a.scene;s.manual=true;s.x=u.x;s.y=u.y-(HonroPartyPresentationHeight?.(u)??u.h)*.5;s.scale=.8;s.cinematic=s.storyTween=s.goalFocus=null;s.speakerId=null;s.focusUntil=s.speakerUntil=0;a.turnNotice=null;a.updateHUD(true);s.render(a.engine,0,a.selected,a.power,false,0);const r=s.canvas.getBoundingClientRect();return{x:r.left+r.width/2+(u.x-s.x)*s.scale,y:r.top+r.height/2+(u.y-(HonroPartyPresentationHeight?.(u)??u.h)*.5-s.y)*s.scale};}''',id)
 def inspect(id,portrait=True):
  print('inspect',id,flush=True);at=paint(id);p.mouse.click(at['x'],at['y']);p.evaluate('HonroUnitInfo.tick(HonroApp)');assert p.locator('#unit-info').is_visible(),{'unit':id,'at':at,'inspect':p.evaluate('HonroApp.scene.inspectUnitId')}
  assert p.locator('#unit-info').get_attribute('data-unit-id')==id
  button=p.locator('.unit-info-portrait');assert button.is_visible()==portrait
  if portrait:p.wait_for_function('document.querySelector(".unit-info-portrait canvas").dataset.portraitState==="ready"',timeout=30000)
  return p.locator('#unit-info .unit-info-health span').inner_text()
 def battle():return p.evaluate('JSON.stringify({units:HonroApp.engine.b.units,active:HonroApp.engine.b.active,projectiles:HonroApp.engine.b.projectiles,round:HonroApp.engine.b.round,selected:HonroApp.selected})')
 def opened():
  p.locator('.unit-info-portrait').click();p.wait_for_function('document.querySelector(".unit-portrait-image canvas")?.dataset.portraitState==="ready"');assert p.locator('#unit-info').is_visible();assert p.evaluate('!HonroApp.canInput()');assert p.locator('.unit-portrait-dialog button').evaluate('(n)=>n===document.activeElement')
 def restored(id,hp,snapshot):
  assert p.locator('.unit-portrait-dialog').count()==0 and p.locator('#unit-info').is_visible();assert p.evaluate('HonroApp.scene.inspectUnitId')==id;assert p.locator('.unit-info-health span').inner_text()==hp;assert battle()==snapshot;assert p.locator('.unit-info-portrait').evaluate('(n)=>n===document.activeElement')
 launch(18)
 for id in['p-archer','p-mage','p-knight','p-occultist','act2-keeper']:
  hp=inspect(id);snapshot=battle();small=p.locator('.unit-info-portrait').bounding_box();close=p.locator('.unit-info-close').bounding_box();assert 56<=small['height']<=72 and small['x']+small['width']<close['x'];p.evaluate('window.__originalInfo=document.getElementById("unit-info")');opened();p.evaluate('window.__originalViewer=document.querySelector(".unit-portrait-dialog");window.__originalLarge=document.querySelector(".unit-portrait-image canvas")');large=p.locator('.unit-portrait-image canvas').bounding_box();backing=p.locator('.unit-portrait-image canvas').evaluate('(n)=>({w:n.width,h:n.height})');assert abs(large['width']/large['height']-backing['w']/backing['h'])<.01
  if id=='act2-keeper':
   p.screenshot(path=str(OUT/'390-keeper-large.jpg'),type='jpeg',quality=90)
   p.keyboard.press('Tab');assert p.locator('.unit-portrait-dialog button').evaluate('(n)=>n===document.activeElement')
   p.keyboard.press('d');p.keyboard.press('ArrowRight');assert battle()==snapshot
   p.keyboard.press('Escape');restored(id,hp,snapshot);p.screenshot(path=str(OUT/'390-keeper-small.jpg'),type='jpeg',quality=90)
   before=p.evaluate('HonroPortraits.stats()')
   for i in range(12):
    opened();assert p.evaluate('window.__originalViewer===document.querySelector(".unit-portrait-dialog")&&window.__originalLarge===document.querySelector(".unit-portrait-image canvas")&&window.__originalInfo===document.getElementById("unit-info")');p.locator('.unit-portrait-dialog button').click();restored(id,hp,snapshot)
   after=p.evaluate('HonroPortraits.stats()');assert all(after[k]==before[k]for k in['requests','decodes','paints','vectorBuilds','fallbackPaints']),{'before':before,'after':after}
   opened();p.mouse.click(2,2);restored(id,hp,snapshot)
   # Landscape keeps close control and the full image in the viewport.
   p.set_viewport_size({'width':844,'height':390});paint(id);p.evaluate('HonroUnitInfo.tick(HonroApp)');opened();r=p.locator('.unit-portrait-dialog button').bounding_box();img=p.locator('.unit-portrait-image canvas').bounding_box();assert r['y']>=0 and r['y']+r['height']<=390 and img['y']+img['height']<=390 and img['x']>=0 and img['x']+img['width']<=844;p.screenshot(path=str(OUT/'844-keeper-large.jpg'),type='jpeg',quality=90);p.keyboard.press('Escape');p.screenshot(path=str(OUT/'844-keeper-small.jpg'),type='jpeg',quality=90);p.set_viewport_size({'width':390,'height':844});paint(id);p.evaluate('HonroUnitInfo.tick(HonroApp)')
   rows.append({'check':'keeper retained12-cycle','cacheBefore':before,'cacheAfter':after,'hp':hp,'keyboardAndBackdropOnlyCloseViewer':True})
  else:p.locator('.unit-portrait-dialog button').click();restored(id,hp,snapshot)
  rows.append({'check':'actual unit click/expand/restore','id':id,'hp':hp,'aspectPreserved':True})
  p.locator('.unit-info-close').click();assert p.locator('#unit-info').is_hidden()
 # Real existing stage NPC, not a class/name-invented fixture.
 launch(1);npc=p.evaluate("HonroApp.engine.b.units.find(u=>u.id==='npc-woodcutter')?.id");assert npc;hp=inspect(npc);snapshot=battle();opened();p.screenshot(path=str(OUT/'390-npc-large.jpg'),type='jpeg',quality=88);p.keyboard.press('Escape');restored(npc,hp,snapshot);rows.append({'check':'existing NPC exact identity','id':npc})
 monster=p.evaluate("HonroApp.engine.b.units.find(u=>u.side===1&&!u.dead&& !HonroUnitInfo.portraitAsset(HonroApp,u))?.id");assert monster;inspect(monster,False);assert p.locator('.unit-info-portrait canvas').count()==1;rows.append({'check':'unmade monster no fake enlargement','id':monster})
 # Switch inspected units and exit a viewer through production modal lifecycle.
 inspect('p-archer');opened();p.evaluate("HonroUnitInfo.show(HonroApp,HonroApp.engine.unit('npc-woodcutter'))");assert p.locator('.unit-portrait-dialog').count()==0 and p.locator('#unit-info').get_attribute('data-unit-id')=='npc-woodcutter';opened();p.evaluate('HonroApp.close()');assert p.locator('.unit-portrait-dialog').count()==0
 # Current expression selector is shared with the portrait loader, without text inference.
 expression=p.evaluate("(()=>{const a=HonroApp,u=a.engine.unit('p-archer');u.portraitExpression='emotion.concern';const x=HonroUnitInfo.portraitAsset(a,u);delete u.portraitExpression;return{requested:x.requestedExpression,actual:x.expression};})()");assert expression['requested']=='emotion.concern'
 p.evaluate('HonroUnitInfo.close(HonroApp)');assert p.locator('#unit-info').is_hidden();assert not errors and not http,{'errors':errors,'http':http}
 result={'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'expressionContract':expression,'switchAndCloseCleanup':True,'errors':errors,'http':http,'scope':'Built Chromium390x844/844x390; prepared prior-clear stage entries and camera framing, actual world/thumbnail/viewer clicks. Frozen App frame for precise battle-state preservation. No physical-device or full-stage claim.'};(OUT/'browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PASS hero4/keeper/NPC/monster actual clicks, retained viewer/cache, aspect/focus/backdrop/Escape/input/state/cleanup');browser.close()
