"""Short post-merge growth/save/equip round trip through the real camp UI."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'_local/reports/skill-integration-persistence';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok):
 assert ok,name
 checks.append({'name':name,'ok':True});print('PASS',name,flush=True)
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page(viewport={'width':360,'height':800},has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp')
 p.evaluate('''()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.recruited=[...C.CLASS_IDS];a.profile.party=[...C.CLASS_IDS];for(const cls of C.CLASS_IDS){const h=a.profile.heroes[cls];h.xp=C.xpAtLevel(30);h.statTraining=2;h.ranks={[C.baseSkill(cls)]:1};for(const t of C.TALENTS.filter(t=>t.cls===cls))h.ranks[t.id]=1;a.profile.loadouts[cls]=[C.baseSkill(cls),...C.TALENTS.filter(t=>t.cls===cls&&!t.passive).slice(0,3).map(t=>t.id)];}a.showCamp('archer');a.persist();window.beforeProfile=JSON.stringify(a.profile);}''')
 for cls,id in [('archer','A09'),('occultist','O16')]:
  p.evaluate('id=>HonroApp.talent(id)',id);p.wait_for_function('HonroApp.preview')
  p.locator('.skill-modal-body').evaluate('e=>e.scrollTop=e.scrollHeight')
  p.locator('[data-action=train]').tap();check(id+' increase and pips',p.evaluate('id=>HonroApp.profile.heroes[HONRO_CORE.SKILLS[id].cls].ranks[id]===2',id) and p.locator('.rank-banner .rank-track i.on').count()==2)
  p.locator('[data-action=rank-minus-detail]').tap();check(id+' refund restores growth exactly',p.evaluate('beforeProfile===JSON.stringify(HonroApp.profile)'))
  # Slot three is replaced via the same confirmation used by the modal UI.
  p.locator('.skill-detail-controls [data-action=equip]').tap()
  p.locator('[data-action=equip-select-slot][data-slot="3"]').tap()
  p.locator('[data-action=equip-apply][data-slot="3"]').tap()
  check(id+' equipment applies',p.evaluate('([c,id])=>HonroApp.profile.loadouts[c][3]===id',[cls,id]))
  p.locator('.skill-detail-controls [data-action=close]').tap();check(id+' X closes modal',not p.locator('#modal').evaluate("e=>e.classList.contains('open')"))
  saved=p.evaluate('JSON.stringify(HonroApp.profile)');p.reload();p.wait_for_function('window.HonroApp');check(id+' exact profile survives save and reload',p.evaluate('s=>JSON.stringify(HonroApp.profile)===s',saved))
  # Continue with the new equipped profile as the baseline for the next character.
  p.evaluate('window.beforeProfile=JSON.stringify(HonroApp.profile)')
 check('no browser exceptions',not errors);b.close()
(OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2))
