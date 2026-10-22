import json
from browser_support import launch,ROOT,serve_game
from playwright.sync_api import sync_playwright
out=ROOT/'game/docs/skill-icons-v1/evidence';checks=[]
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);p=b.new_page(viewport={'width':360,'height':800},is_mobile=True,has_touch=True)
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
 p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.profile.heroes.archer.xp=0;a.profile.heroes.archer.ranks.A09=0;a.showCamp('archer');C.TALENT_MAP.A09.name='전로시 비행 중 한 번 방향을 꺾는 아주 긴 이름의 기예';a.talent('A09')}")
 assert p.locator('[data-action=train]').is_disabled() and p.locator('[data-action=rank-minus-detail]').is_disabled()
 assert p.locator('.skill-detail-controls').evaluate("e=>e.scrollWidth<=e.clientWidth+1&&[...e.querySelectorAll('button')].every(b=>b.clientWidth>=42&&b.clientHeight>=42)")
 p.screenshot(path=str(out/'locked-long-title-360.png'));checks.append({'name':'locked long title, disabled plus/refund, header controls fit and >=44px border box','pass':True})
 p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE,h=a.profile.heroes.archer;h.xp=C.xpAtLevel(30);h.ranks.A09=1;h.statTraining=0;h.statTraining=C.pointsEarned(h)-C.pointsSpent(h,'archer');a.talent('A09')}")
 assert p.locator('[data-action=train]').is_disabled() and not p.locator('[data-action=rank-minus-detail]').is_disabled()
 assert p.locator('.rank-banner').is_visible() and p.locator('.rank-banner').inner_text().find('수련점')>=0
 p.screenshot(path=str(out/'sp-exhausted-long-title-360.png'));checks.append({'name':'zero SP disables plus, preserves refund/rank/SP DOM','pass':True})
 for file in out.glob('*long-title*.png'):assert file.stat().st_size<1_000_000
 (out/'disabled-checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n');print('PASS',checks);b.close()
