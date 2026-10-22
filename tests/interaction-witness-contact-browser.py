"""Prepared rescued-monk save: real walking/contact, no extra interaction click."""
import json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/interaction-enemy-gates';profile=json.loads((OUT/'witness-contact-save.json').read_text());errors=[]
with serve_game()as base,sync_playwright()as p:
 b=launch(p);c=b.new_context(viewport={'width':390,'height':844});c.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile,ensure_ascii=False))+')');page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroStage===16')
 for _ in range(50):
  if page.evaluate('!!HonroApp.dialogue'):page.locator('[data-action="dialogue-skip"]').click()
  elif page.evaluate('HonroApp.canInput()&&!HonroApp.turnNotice'):break
  page.wait_for_timeout(150)
 assert not page.evaluate('!!HonroAct2.memory(HonroApp.engine.b).done.witness'),'No remote witness reward from rescued flag alone';assert not page.evaluate('!!HonroAct2.memory(HonroApp.engine.b).done.record')
 vitals=page.evaluate('JSON.stringify(HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,!!u.dead]))');page.keyboard.down('d');page.wait_for_function('!!HonroAct2.memory(HonroApp.engine.b).done.witness',timeout=10000);page.keyboard.up('d');assert not page.evaluate('!!HonroAct2.memory(HonroApp.engine.b).done.record'),'Record remains behind hall';assert not page.evaluate('!!HonroAct2.memory(HonroApp.engine.b).done["clear-rescue-threat"]');assert page.evaluate('JSON.stringify(HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,!!u.dead]))')==vitals
 proof=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='witness'),point=m.target?b.units.find(u=>u.id===m.target):m;return{actor:{id:a.engine.active.id,x:a.engine.active.x,y:a.engine.active.y},point:{x:point.x,y:point.y},record:!!HonroAct2.memory(b).done.record,clear:!!HonroAct2.memory(b).done['clear-rescue-threat'],fieldProof:b.honroState.fieldEvidence?.events?.witness}}''');page.screenshot(path=str(OUT/'focus-contact-stage16.jpg'),type='jpeg',quality=85);assert not errors;(OUT/'witness-contact-browser.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'proof':proof,'errors':errors,'scope':__doc__},indent=2)+'\n');print(json.dumps(proof));b.close()
