"""Prepared full-health Stage13 rescue; real built Continue and E, no combat playthrough."""
import json,sys,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/rescue-hp-removal-20261023';record=json.loads((OUT/'stage13-resident-ready.json').read_text())
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(record))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===13&&HonroApp.canInput()&&!HonroApp.dialogue&&!HonroApp.turnNotice',timeout=90000)
 before=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='resident'),s=a.engine.unit(m.spiritId);HonroInteractions.refresh(a);return{hp:s.hp,maxHp:s.maxHp,actor:a.engine.active.cls,ok:HonroInteractions.eligibility(a,m),guide:HonroObjectives.state(b,a.stage).blockReason};}''');assert before['hp']==before['maxHp']and before['actor']=='occultist'and before['ok']['ok'];assert '40%'not in(before['guide']or'');assert p.locator('[data-context-interact=resident]').is_enabled()
 p.keyboard.press('e');p.wait_for_function('HonroAct2.memory(HonroApp.engine.b).done.resident');after=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='resident');return{released:a.engine.unit(m.spiritId).honroReleased,resolved:a.engine.unit(m.target).honroResolved,checkpoints:HonroAct2.memory(b).checkpoints.filter(x=>x.id==='resident').length};}''');assert after=={'released':True,'resolved':True,'checkpoints':1};assert not errors
 (OUT/'browser.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'before':before,'after':after,'errors':errors,'scope':__doc__},ensure_ascii=False,indent=2));print('PASS built390px Continue/full-HP Sodan rescue, real KeyE, guide and one completion');b.close()
