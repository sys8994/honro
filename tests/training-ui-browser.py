"""Focused production-browser checks; controlled poses are explicit fixtures."""
import json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/training-ui';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 rows.append({'check':name,'data':data});print('PASS',name,flush=True)
POSE="""()=>{const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(u=>u.side===0&&!u.summoned);a.close();a.dialogue=null;a.turnNotice=null;a.done=false;a.cancelInput();b.active=u.id;b.phase='aim';b.side=0;Object.assign(u,{x:1600,y:1230,vx:0,vy:0,acted:false,airborne:false,jumping:false,moveLeft:u.maxMove,cooldowns:{}});delete u.platformDrop;a.updateHUD(true);document.activeElement?.blur();return a.canInput()&&e.canDrop()}"""
with sync_playwright() as pw,serve_game() as base:
 browser=launch(pw);p=browser.new_page(viewport={'width':1440,'height':900});errors=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');stored=p.evaluate('JSON.stringify({...localStorage})');p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate('HonroApp.close()');p.wait_for_timeout(700)
 check('fresh training runs normal frames without caught exception',p.evaluate('!HonroApp.lastError'),p.evaluate('HonroApp.lastError||null'))
 p.evaluate('HonroApp.frame=()=>{};HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroApp.updateAudio()')
 for key in ['AltLeft','AltRight']:
  check('supported platform pose '+key,p.evaluate(POSE));p.keyboard.press(key);check(key+' routes one solitary press to existing drop',p.evaluate('HonroApp.engine.active.platformDrop?.phase==="prepare"'))
 check('repeat pose',p.evaluate(POSE));p.keyboard.down('AltLeft');p.keyboard.down('AltLeft');p.keyboard.up('AltLeft');check('held Alt accepts only one drop',p.evaluate('HonroApp.engine.active.platformDrop?.phase==="prepare"'));p.evaluate('for(let i=0;i<400;i++)HonroApp.engine.integrateBody(HonroApp.engine.active,HONRO_CORE.STEP)');check('Alt reaches safe lower ground',p.evaluate('HonroApp.engine.active.y>1300&&!HonroApp.engine.active.platformDrop'))
 for chord in ['AltLeft+d','Control+AltRight','Meta+AltLeft','Shift+AltLeft']:
  p.evaluate(POSE);p.keyboard.press(chord);check('modifier/browser chord suppressed '+chord,p.evaluate('!HonroApp.engine.active.platformDrop'))
 p.evaluate(POSE);p.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{code:'AltRight',key:'AltGraph',altKey:true,ctrlKey:true,modifierAltGraph:true,bubbles:true}));document.dispatchEvent(new KeyboardEvent('keyup',{code:'AltRight',key:'AltGraph',bubbles:true}))");check('AltGr suppressed',p.evaluate('!HonroApp.engine.active.platformDrop'))
 for kind in ['input','editable','modal','dialogue','blur']:
  p.evaluate(POSE)
  if kind=='input':p.evaluate("{const e=document.createElement('input');e.id='fixture-input';document.body.append(e);e.focus()}")
  if kind=='editable':p.evaluate("{const e=document.createElement('div');e.id='fixture-input';e.contentEditable='true';document.body.append(e);e.focus()}")
  if kind=='modal':p.evaluate('HonroApp.pause()')
  if kind=='dialogue':p.evaluate('HonroApp.dialogue={index:0};window.storyKey=HonroStory.key;HonroStory.key=()=>{}')
  if kind=='blur':p.keyboard.down('AltLeft');p.evaluate("window.dispatchEvent(new Event('blur'))");p.keyboard.up('AltLeft')
  else:p.keyboard.press('AltLeft')
  check('Alt gated by '+kind,p.evaluate('!HonroApp.engine.active.platformDrop'))
  p.evaluate("document.getElementById('fixture-input')?.remove();if(window.storyKey){HonroStory.key=window.storyKey;delete window.storyKey}HonroApp.dialogue=null")
 p.evaluate(POSE);p.keyboard.press('ControlLeft');check('Ctrl still jumps',p.evaluate('HonroApp.engine.active.vy<0'))
 p.evaluate(POSE);before=p.evaluate('HonroApp.engine.active.angle');p.keyboard.down('ArrowUp');check('arrow aim key retained',p.evaluate('HonroApp.keys.has("ArrowUp")'));p.keyboard.up('ArrowUp');p.keyboard.press('f');check('F still defends',p.evaluate('HonroApp.engine.active.acted||HonroApp.engine.b.phase!=="aim"'))
 p.evaluate(POSE);p.evaluate('Object.assign(HonroApp.engine.active,{x:600,y:HONRO_CORE.topAt(HonroApp.engine.b.terrain[0],600,1510)})');p.keyboard.press('AltLeft');check('solid ground has no drop',p.evaluate('!HonroApp.engine.active.platformDrop'))
 # Delegation includes dynamic elements; text is data, never HTML.
 p.evaluate('HonroApp.pause()');p.mouse.move(20,300);p.locator('[data-action=settings]').hover();p.wait_for_selector('#honro-tooltip');check('delegated menu tooltip',p.locator('#honro-tooltip').inner_text().find('설정')>=0)
 for x,y in [(1,1),(1390,1),(1,855),(1390,855)]:
  p.evaluate('v=>{HonroApp.close();document.getElementById("corner")?.remove();const e=document.createElement("button");e.id="corner";e.dataset.tooltip="<img src=x onerror=alert(1)> "+"긴 설명 ".repeat(100);e.dataset.shortcut="Alt";Object.assign(e.style,{position:"fixed",left:v[0]+"px",top:v[1]+"px",width:"40px",height:"40px",zIndex:9999});e.textContent="검사";document.body.append(e)}',[x,y]);p.locator('#corner').hover();p.wait_for_selector('#honro-tooltip')
  geom=p.locator('#honro-tooltip').evaluate('e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,nodes:e.querySelectorAll("img").length,linked:document.getElementById("corner").getAttribute("aria-describedby")}}');check('long tooltip clamps all edges '+str((x,y)),geom['x']>=9 and geom['y']>=9 and geom['right']<=1431 and geom['bottom']<=891 and geom['nodes']==0 and 'honro-tooltip' in geom['linked'],geom)
 p.evaluate('document.getElementById("corner").remove()');p.wait_for_timeout(50);check('DOM removal cleans up tooltip',p.locator('#honro-tooltip').count()==0)
 p.evaluate('HonroApp.pause()');p.locator('[data-action=fullscreen]').focus();p.keyboard.press('Tab');p.keyboard.press('Tab');p.locator('[data-action=settings]').focus();p.wait_for_selector('#honro-tooltip',timeout=2000);check('keyboard focus tooltip and one instance',p.locator('#honro-tooltip').count()==1 and '설정' in p.locator('#honro-tooltip').inner_text());p.evaluate('HonroApp.close()');p.wait_for_timeout(50);check('modal close cleans up tooltip',p.locator('#honro-tooltip').count()==0)
 p.evaluate(POSE);p.locator('#drop').hover();p.wait_for_selector('#honro-tooltip');check('HUD shortcut uses real Alt binding','Alt' in p.locator('#honro-tooltip').inner_text())
 p.evaluate('HonroApp.pause()');p.locator('[data-action=fullscreen]').click();p.wait_for_function('document.fullscreenElement');p.locator('[data-action=settings]').hover();p.wait_for_selector('#honro-tooltip');check('tooltip is within fullscreen root',p.evaluate('document.fullscreenElement.contains(document.getElementById("honro-tooltip"))'));p.keyboard.press('Escape');p.wait_for_function('!document.fullscreenElement');check('fullscreen Escape preserves pause modal',p.locator('.pause-dialog').count()==1);p.keyboard.press('Escape');check('next Escape returns to battle',p.locator('#modal.open').count()==0)
 # Preserve battle state through each hero switch, then reset it explicitly.
 state=p.evaluate('()=>{const b=HonroApp.engine.b;b.units.find(u=>u.side===1).hp=77;return {terrain:JSON.stringify(b.terrain),foes:JSON.stringify(b.units.filter(u=>u.side===1))}}')
 for cls in ['mage','knight','occultist','archer']:
  if cls=='knight':p.evaluate('HonroApp.engine.b.side=1;HonroApp.engine.b.active=HonroApp.engine.b.units.find(u=>u.side===1).id;window.enemyActive=HonroApp.engine.b.active')
  p.evaluate('HonroTraining.open(HonroApp)');p.locator(f'[data-training-action=hero][data-value={cls}]').click();p.locator('[data-training-action=apply]').click();check('switch keeps terrain and enemy state '+cls,p.evaluate('s=>{const b=HonroApp.engine.b;return JSON.stringify(b.terrain)===s.terrain&&JSON.stringify(b.units.filter(u=>u.side===1))===s.foes}',state))
 check('enemy active turn survives hero switching',p.evaluate('HonroApp.engine.b.active===window.enemyActive&&HonroApp.engine.b.side===1'))
 p.locator('[data-action=training-reset]').click();check('reset restores targets and keeps chosen hero',p.evaluate('HonroApp.engine.b.units.find(u=>u.side===1).hp!==77&&HonroApp.engine.b.units.find(u=>u.side===0).cls===HonroApp.trainingClass'));check('training leaves saved campaign byte-identical',p.evaluate('JSON.stringify({...localStorage})')==stored)
 p.evaluate('()=>{const e=HonroApp.engine,u=e.b.units.find(u=>u.side===0);e.hurt(u,999999);window.practiceSurvived=u.hp>0&&!u.dead}');check('practice hero survives lethal damage',p.evaluate('window.practiceSurvived'))
 # Real loaded outline font in a visible body paragraph, including glyph provider.
 p.evaluate('HonroApp.battleHelp()');p.wait_for_function('document.fonts.status==="loaded"');cdp=p.context.new_cdp_session(p);cdp.send('DOM.enable');cdp.send('CSS.enable');root=cdp.send('DOM.getDocument')['root']['nodeId'];node=cdp.send('DOM.querySelector',{'nodeId':root,'selector':'.battle-help-current'})['nodeId'];fonts=cdp.send('CSS.getPlatformFontsForNode',{'nodeId':node})['fonts'];check('Korean body glyphs use self-hosted outline font',any(f['isCustomFont'] and 'Noto Serif' in f['familyName'] for f in fonts),fonts)
 p.evaluate('HonroTooltips.hide()');p.screenshot(path=str(OUT/'font-body-100.png'));p.evaluate('document.body.style.zoom="1.25"');p.wait_for_timeout(100);p.screenshot(path=str(OUT/'font-body-125.png'));check('body readout uses real medium weight',p.locator('.battle-help-current').evaluate('e=>Number(getComputedStyle(e).fontWeight)>=500'));p.evaluate('document.body.style.zoom="";HonroApp.close();HonroApp.pause()');p.mouse.move(10,200);p.evaluate('HonroTooltips.hide()');p.screenshot(path=str(OUT/'pause-desktop.png'))
 # Compact menu retains scroll and confirm/back behavior.
 p.locator('[data-action=retry-menu]').click();p.locator('[data-action=retry-confirm][data-id=battle]').click();check('retry requires confirmation',p.locator('.menu-confirm').count()==1);p.locator('.actions [data-action=menu-cancel]').click();check('retry cancel returns to choice',p.locator('.pause-retry').count()==1)
 p.evaluate('HonroApp.pause();HonroApp.settings()');p.locator('[data-action=settings-page][data-id=sound]').click();check('settings back preserves pause entry',p.evaluate('HonroApp.settingsEntry==="pause"'));p.keyboard.press('Escape');p.keyboard.press('Escape');check('settings Escape returns to pause',p.locator('.pause-dialog').count()==1)
 for width,height in [(390,844),(844,390)]:
  p.set_viewport_size({'width':width,'height':height});p.evaluate('HonroApp.pause();HonroTooltips.hide()');p.screenshot(path=str(OUT/f'review3-pause-{width}.png'));check('compact pause fits viewport '+str(width),p.locator('.dialog').evaluate('e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+.5&&r.top>=0&&r.bottom<=innerHeight+.5}'))
 check('no browser or caught runtime exception',not errors and p.evaluate('!HonroApp.lastError'),errors)
 # A touch context must never acquire hover/focus tooltips.
 touch=browser.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);touch.goto(base+'/HONRO.html');touch.wait_for_function('window.HonroApp');touch.locator('[data-action=settings]').tap();touch.wait_for_timeout(100);check('touch has no hover trap',touch.locator('#honro-tooltip').count()==0);touch.close();browser.close()
source={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['shared/runtime/world.js','shared/runtime/main.js','shared/runtime/tooltips.js','shared/runtime/menu-ui.js','game/src/fonts.css']}
(OUT/'checks.json').write_text(json.dumps({'rows':rows,'source':source,'limits':['Controlled platform poses; normal campaign completion excluded.','125% image uses CSS zoom in Linux Chromium; Windows rasterization unverified.']},ensure_ascii=False,indent=2))
