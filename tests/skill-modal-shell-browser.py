"""The header and close button never scroll or overlap the independent body."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'_local/reports/skill-modal-shell';OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 checks.append({'name':name,'data':data});print('PASS',name,flush=True)
with sync_playwright() as pw, serve_game() as base_url:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base_url+'/HONRO.html');p.wait_for_function('window.HonroApp')
 p.evaluate("()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.heroes.archer.xp=C.xpAtLevel(30);for(const n of C.TALENTS.filter(n=>n.cls==='archer'))a.profile.heroes.archer.ranks[n.id]=1;a.showCamp('archer')}")
 for width,height in [(360,800),(390,844),(1280,900),(844,390)]:
  p.set_viewport_size({'width':width,'height':height});p.evaluate("HonroApp.talent('A09')");p.wait_for_function('HonroApp.preview?.fired')
  for place,ratio in [('start',0),('middle',.5),('end',1)]:
   p.locator('.skill-modal-body').evaluate('(e,r)=>e.scrollTop=(e.scrollHeight-e.clientHeight)*r',ratio)
   geom=p.evaluate("""()=>{const d=document.querySelector('.dialog'),h=d.querySelector('.skill-detail-controls'),body=d.querySelector('.skill-modal-body'),x=d.querySelector('[data-action=close]'),r=d.getBoundingClientRect(),hr=h.getBoundingClientRect(),br=body.getBoundingClientRect(),xr=x.getBoundingClientRect();return{gap:Math.abs(hr.top-r.top-1)+Math.abs(hr.left-r.left-1)+Math.abs(hr.right-r.right+1),body:br.top>=hr.bottom-.5,close:x.closest('.skill-detail-controls')===h&&xr.top>=hr.top&&xr.bottom<=hr.bottom,clip:getComputedStyle(d).overflowY==='hidden',fit:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,touch:xr.width>=44&&xr.height>=44,scroll:body.scrollTop}}""")
   check(f'{width} {place}: continuous frame, visible X, body below header',geom['gap']<1 and all(geom[k] for k in ['body','close','clip','fit','touch']),geom)
   if place in ['start','end']:p.screenshot(path=str(OUT/f'modal-{width}-{place}.png'))
  old=p.evaluate('HonroApp.profile.heroes.archer.ranks.A09');scroll=p.locator('.skill-modal-body').evaluate('e=>e.scrollTop')
  p.locator('[data-action=train]').tap();check(f'{width}: header plus and body scroll retained',p.evaluate('HonroApp.profile.heroes.archer.ranks.A09')==old+1 and abs(p.locator('.skill-modal-body').evaluate('e=>e.scrollTop')-scroll)<2)
  p.locator('[data-action=rank-minus-detail]').tap();check(f'{width}: header refund',p.evaluate('HonroApp.profile.heroes.archer.ranks.A09')==old)
  p.locator('.skill-detail-controls [data-action=close]').tap();check(f'{width}: fixed X closes',not p.locator('#modal').evaluate("e=>e.classList.contains('open')"))
 # The exact once-only additional input must change actual velocity and hit a grounded target.
 p.set_viewport_size({'width':390,'height':844});p.evaluate("HonroApp.talent('A09')");p.wait_for_function('HonroApp.preview');p.evaluate("HonroApp.frame=()=>{};window.p=HonroApp.preview;p.hold=true")
 for stage,seconds in [('start',.3),('turn',1.25),('result',2.6)]:
  p.evaluate('t=>{while(p.age<t)HonroSkillPreview.tick(HonroApp,p,1/60)}',seconds)
  p.locator('.skill-modal-body').evaluate('e=>e.scrollTop=100');p.screenshot(path=str(OUT/f'A09-{stage}.png'))
 result=p.evaluate("()=>({turns:p.turns,follow:p.follow,before:p.trace.before.length,after:p.trace.after.length,damage:p.b.units[1].maxHp-p.b.units[1].hp,grounded:p.b.units[1].y===1000,secondInput:p.e.turnArrow({x:1080,y:900})})")
 check('A09: actual turn exactly once, both trajectories, hit, grounded',result['turns']==1 and result['before']>3 and result['after']>3 and result['damage']>0 and result['grounded'] and not result['secondInput'],result)
 p.evaluate("HonroApp.close();HONRO_CORE.TALENT_MAP.A09.name='전로시 비행 중 한 번 방향을 꺾는 아주 긴 이름의 기예';HonroApp.profile.heroes.archer.ranks.A09=0;HonroApp.profile.heroes.archer.xp=0;HonroApp.talent('A09')")
 check('long title and locked zero state fit fixed header',p.locator('[data-action=train]').is_disabled() and p.locator('[data-action=rank-minus-detail]').is_disabled() and p.locator('.skill-detail-controls').evaluate('e=>e.scrollWidth<=e.clientWidth+1'))
 p.screenshot(path=str(OUT/'long-title-locked-360.png'))
 p.evaluate("HonroApp.profile.heroes.archer.xp=HONRO_CORE.xpAtLevel(30);HonroApp.profile.heroes.archer.ranks.A09=8;HonroApp.talent('A09')")
 check('maximum plus disabled and refund reachable',p.locator('[data-action=train]').is_disabled() and not p.locator('[data-action=rank-minus-detail]').is_disabled())
 p.evaluate("()=>{const h=HonroApp.profile.heroes.archer;h.ranks.A09=1;h.statTraining=0;h.statTraining=HONRO_CORE.pointsEarned(h)-HONRO_CORE.pointsSpent(h,'archer');HonroApp.talent('A09')}")
 check('SP exhausted disables plus without hiding points',p.locator('[data-action=train]').is_disabled() and p.locator('.skill-detail-controls .rank-banner').is_visible())
 p.screenshot(path=str(OUT/'sp-exhausted-360.png'))
 p.evaluate("HonroApp.profile.loadouts.archer=['A01','A09','A14','A02'];HonroApp.talent('A09')")
 check('equipped long-title header controls remain 44px with body space',p.locator('.skill-detail-controls').evaluate("e=>[...e.querySelectorAll('button')].every(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.width>=44})&&document.querySelector('.skill-modal-body').clientHeight>100"))
 p.locator('#modal').evaluate("e=>{for(const [side,value]of Object.entries({top:48,bottom:24,left:16,right:12}))e.style.setProperty('--skill-safe-'+side,value+'px')}")
 check('asymmetric safe area reserves space on all four edges',p.locator('.dialog').evaluate('e=>{const r=e.getBoundingClientRect();return r.top>=48&&r.bottom<=innerHeight-24&&r.left>=16&&r.right<=innerWidth-12}'))
 p.screenshot(path=str(OUT/'asymmetric-safe-area-360.png'))
 check('no browser exceptions',not errors,errors);b.close()
(OUT/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
