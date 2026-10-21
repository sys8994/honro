"""Real UI regression for the restored pre-workbench camp and top modal controls."""
import json,os
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT
OUT=ROOT/os.environ.get('HONRO_SKILL_OUT','_local/reports/skill-ui-restore');OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,detail=None):
 assert ok,(name,detail)
 checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
SETUP="""()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.recruited=[...C.CLASS_IDS];a.profile.party=[...C.CLASS_IDS];for(const c of C.CLASS_IDS){const h=a.profile.heroes[c];h.xp=C.xpAtLevel(30);h.ranks={[C.baseSkill(c)]:1};h.statTraining=2;for(const n of C.TALENTS.filter(n=>n.cls===c))h.ranks[n.id]=1;a.profile.loadouts[c]=[C.baseSkill(c),...C.TALENTS.filter(n=>n.cls===c&&!n.passive).slice(0,3).map(n=>n.id)];}a.showCamp('archer');window.profileBefore=JSON.stringify(a.profile);} """
with sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(os.environ.get('HONRO_SKILL_URL','http://localhost:8002/HONRO.html'));p.wait_for_function('window.HonroApp');p.evaluate(SETUP)
 for width in [360,390,1280]:
  p.set_viewport_size({'width':width,'height':844})
  for cls in ['archer','mage','knight','occultist']:
   p.evaluate('c=>HonroApp.showCamp(c)',cls)
   for branch in range(4):
    if width<=540:p.locator(f'.branch-tabs button[data-id="{branch}"]').click()
    panel=p.locator(f'[data-branch-panel="{branch}"]')
    check(f'{width}/{cls}/{branch}: restored 8-pip investment bars',panel.locator('.rank-track i').count()==40 and panel.is_visible())
   check(f'{width}/{cls}: no horizontal clipping',p.evaluate("document.querySelector('#armory').scrollWidth<=document.querySelector('#armory').clientWidth+1"))
  p.evaluate("HonroApp.showCamp('archer')");p.locator('.tree-tools').scroll_into_view_if_needed();p.screenshot(path=str(OUT/f'restored-invested-{width}.png'))
 check('opening camp and switching tabs does not change profile',p.evaluate('profileBefore===JSON.stringify(HonroApp.profile)'))
 for cls in ['archer','mage','knight','occultist']:
  for branch in range(4):
   sid=p.evaluate('([c,branch])=>HONRO_CORE.TALENTS.filter(n=>n.cls===c&&n.branch===branch).at(-1).id',[cls,branch])
   p.evaluate('c=>HonroApp.showCamp(c)',cls)
   p.locator(f'.tree-node[data-skill="{sid}"]').click()
   controls=p.locator('.skill-detail-controls');dialog=p.locator('.talent-dialog')
   check(cls+f'/{branch}: buttons precede summary and preview',controls.is_visible() and p.evaluate("document.querySelector('.skill-detail-controls').compareDocumentPosition(document.querySelector('.skill-modal-grid'))&Node.DOCUMENT_POSITION_FOLLOWING"))
   p.locator('[data-action=train]').click()
   check(cls+f'/{branch}: modal plus updates rank and bar',p.evaluate('id=>HonroApp.profile.heroes[HONRO_CORE.SKILLS[id].cls].ranks[id]',sid)==2 and p.locator('.rank-banner .rank-track i.on').count()==2)
   dialog.evaluate('e=>e.scrollTop=e.scrollHeight')
   check(cls+f'/{branch}: top controls remain visible while scrolling',controls.bounding_box()['y']>=dialog.bounding_box()['y']-2 and controls.bounding_box()['y']+controls.bounding_box()['height']<=dialog.bounding_box()['y']+dialog.bounding_box()['height'])
   p.locator('[data-action=rank-minus-detail]').click()
   check(cls+f'/{branch}: modal refund returns one SP',p.evaluate('id=>HonroApp.profile.heroes[HONRO_CORE.SKILLS[id].cls].ranks[id]',sid)==1)
   p.evaluate('HonroApp.close()')
 check('plus/refund round trip preserves growth and loadouts',p.evaluate('profileBefore===JSON.stringify(HonroApp.profile)'),p.evaluate('()=>{const old=JSON.parse(profileBefore),now=HonroApp.profile;return Object.keys(now).filter(k=>JSON.stringify(old[k])!==JSON.stringify(now[k])).map(k=>[k,old[k],now[k]])}'))
 # Guard states and list controls on an independent empty allocation.
 p.evaluate("()=>{const a=HonroApp,h=a.profile.heroes.archer;h.xp=0;h.ranks={A01:1};h.statTraining=0;a.profile.loadouts.archer=['A01','','',''];a.showCamp('archer')}")
 check('zero investment cannot be refunded',p.locator('[data-action=rank-minus][data-skill=A14]').is_disabled())
 check('prerequisite/level lock prevents purchase',p.locator('[data-action=rank-plus][data-skill=A02]').is_disabled())
 p.set_viewport_size({'width':360,'height':844})
 p.evaluate("HonroApp.profile.heroes.archer.xp=HONRO_CORE.xpAtLevel(30);HonroApp.branch=0;HonroApp.showCamp('archer')")
 plus=p.locator('[data-action=rank-plus][data-skill=A14]');minus=p.locator('[data-action=rank-minus][data-skill=A14]')
 plus.tap();check('touch list plus updates investment',p.evaluate('HonroApp.profile.heroes.archer.ranks.A14===1') and p.locator('.tree-node[data-skill=A14] .rank-track .on').count()==1)
 check('point tap never opens details',not p.locator('#modal').evaluate("e=>e.classList.contains('open')"))
 minus.tap();check('touch refund reaches zero',p.evaluate('!HonroApp.profile.heroes.archer.ranks.A14'))
 for i in range(8):plus.tap()
 check('maximum disables plus',plus.is_disabled())
 p.evaluate("HonroApp.profile.heroes.archer.statTraining=HONRO_CORE.pointsEarned(HonroApp.profile.heroes.archer)-8;HonroApp.showCamp()")
 check('no SP disables available purchases',p.locator('.rank-step.plus:not(:disabled)').count()==0)
 minus.tap();check('refund restores one remaining SP',p.evaluate("HONRO_CORE.pointsLeft(HonroApp.profile.heroes.archer,'archer')===1"))
 p.evaluate('window.savedProfile=JSON.stringify(HonroApp.profile)')
 saved=p.evaluate('savedProfile');p.reload();p.wait_for_function('window.HonroApp');p.evaluate("HonroApp.showCamp('archer')")
 check('saved XP, ranks, training, and loadouts survive reentry',p.evaluate('saved=>JSON.stringify(HonroApp.profile)===saved',saved))
 for width in [360,390,1280]:
  p.set_viewport_size({'width':width,'height':844});p.evaluate("HonroApp.talent('A14')");p.wait_for_function('HonroApp.preview?.fired')
  p.screenshot(path=str(OUT/f'restored-modal-{width}.png'))
  check(f'{width}: modal fits viewport and scrolls',p.locator('.talent-dialog').evaluate("e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth+1&&getComputedStyle(e).overflowY==='auto'}"))
  p.evaluate('HonroApp.close()')
 check('no browser exceptions',not errors,errors);b.close()
(OUT/'checks.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2))
