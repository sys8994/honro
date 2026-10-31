import json,sys,threading,functools
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import argparse
from candidate_browser import ROOT, DEFAULT_CANDIDATE, launch, launch_candidate
parser=argparse.ArgumentParser(description='Mutating postcombat and relocated-actor diagnostics; not mission play')
parser.add_argument('--candidate',type=Path,default=DEFAULT_CANDIDATE);parser.add_argument('--out',type=Path,default=ROOT/'_local/reports/stage31-boat-diagnostic');args=parser.parse_args()
root=ROOT;out=args.out;out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}';result={'scope':'local candidate QA import; real keyboard; postcombat scenario explicitly removes enemies; no normal mission clear','cases':[],'errors':[]}
state='''()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState,u=e.active;return {phase:b.phase,side:b.side,round:b.round,active:b.active,canInput:a.canInput(),dialogue:a.dialogue?.lines?.[a.dialogue.index]?.[1]??null,tour:q?.arrivalTour,boat:q?.boat,events:q?.events,water:q?.water,goal:document.getElementById('objective-text')?.textContent,actor:u&&{id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,moveLeft:u.moveLeft,acted:u.acted,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id},dynamic:b.honroAct4PreviewDynamic?.filter(l=>l.asset?.id==='a4:boat').map(l=>({x:l.x,y:l.y,scale:l.scale})),deck:b.terrain.find(t=>t.id==='a4-boat-deck'),foes:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length};}'''
with sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:result['errors'].append(str(e)));result['fixture']=launch_candidate(page,base,args.candidate)
 page.wait_for_timeout(100);result['initial']=page.evaluate(state);page.screenshot(path=str(out/'initial.png'))
 page.keyboard.press('Escape');page.wait_for_timeout(300);
 if page.evaluate("HonroApp.modal.classList.contains('open')"):page.keyboard.press('Escape')
 page.wait_for_timeout(300)
 for n in range(10):
  if not page.evaluate('!!HonroApp.dialogue'):break
  page.keyboard.press('Enter');page.wait_for_timeout(200)

 for _ in range(60):
  page.wait_for_timeout(250)
  if page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter')
  if page.evaluate('HonroApp.canInput()'):break
 result['afterIntro']=page.evaluate(state)
 before=page.evaluate(state);page.keyboard.down('ArrowRight');page.wait_for_timeout(1300);page.keyboard.up('ArrowRight');page.wait_for_timeout(400);result['cases'].append({'name':'spawn-keyboard-right','before':before,'after':page.evaluate(state)});page.screenshot(path=str(out/'spawn-move.png'))
 # Postcombat observation fixture: remove all enemies, no HP damage or victory claim.
 page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;b.units=b.units.filter(u=>u.side!==1);b.phase='aim';b.side=0;b.projectiles=[];b.volley=null;a.dialogue=null;a.close();a.turnNotice=null;}''')
 for i in range(80):
  page.wait_for_timeout(250)
  if page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter')
  if page.evaluate("HonroApp.engine.b.honroAct4PreviewState?.boat?.phase==='docked'"):break
 result['postcombat']={'precondition':'all enemies removed and phase set to aim; Enter advances scenes; no combat victory','after':page.evaluate(state),'secondsWaited':(i+1)*.25};page.screenshot(path=str(out/'postcombat.png'))
 # Separate controlled location fixture: stand at real western ledge, no enemies.
 landing=page.evaluate('''()=>{const e=HonroApp.engine,b=e.b,u=e.unit('archer'),t=b.terrain.find(t=>t.id==='approved31-entry');b.active=u.id;b.side=0;b.phase='aim';u.acted=false;u.x=230;u.y=HONRO_CORE.terrainSurfaces(t,230)[0].y;u.vx=u.vy=0;u.jumping=u.airborne=false;HonroApp.close();return {x:u.x,y:u.y,grounded:e.grounded(u)};}''');page.wait_for_timeout(400);before=page.evaluate(state);page.keyboard.down('ArrowLeft');page.wait_for_timeout(2200);page.keyboard.up('ArrowLeft');page.wait_for_timeout(3000);result['cases'].append({'name':'west-edge-fall','precondition':'postcombat enemies removed; archer placed on real entry terrain at x230, active and unacted; movement/fall by continuous ArrowLeft','placement':landing,'before':before,'after':page.evaluate(state)});page.screenshot(path=str(out/'water-fall.png'))
 # Independent harbor approach fixture, no enemy combat or completed objective.
 landing=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.unit('mage'),t=b.terrain.find(t=>t.id==='approved31-harbor-landing');b.active=u.id;b.side=0;b.phase='aim';u.acted=false;u.x=6200;u.y=HONRO_CORE.terrainSurfaces(t,6200)[0].y;u.vx=u.vy=0;u.jumping=u.airborne=false;a.close();a.dialogue=null;return {x:u.x,y:u.y,grounded:e.grounded(u)};}''');page.wait_for_timeout(300);before=page.evaluate(state);page.keyboard.down('ArrowRight');page.wait_for_timeout(800);mid=page.evaluate(state);page.screenshot(path=str(out/'harbor-mid.png'));page.wait_for_timeout(1200);page.keyboard.up('ArrowRight');page.wait_for_timeout(700);result['cases'].append({'mid':mid,'name':'harbor-keyboard-approach','precondition':'postcombat enemies removed; mage with remaining movement placed on real harbor landing x6200, active and unacted; movement by continuous ArrowRight','placement':landing,'before':before,'after':page.evaluate(state)});page.screenshot(path=str(out/'harbor-approach.png'))
 (out/'movement-final-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False));browser.close()
server.shutdown();server.server_close()
