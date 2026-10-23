import json
from browser_support import *
from playwright.sync_api import sync_playwright
OUT=ROOT/'game/docs/skill-icons-v1/integration/evidence'
with sync_playwright() as pw,serve_game() as base:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);requests=[];failures=[];errors=[]
 p.on('request',lambda r:requests.append(r.url) if 'skill-icon-' in r.url and '.webp' in r.url else None)
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp')
 m=p.evaluate('HONRO_SKILL_ICON_MANIFEST');assert m['complete'] and m['artReview']=='approved' and len(m['icons'])==84;assert not requests
 p.route('**/skill-icon-A08.*.webp',lambda r:(failures.append(r.request.url),r.fulfill(status=404,body='deliberate unavailable file'))[-1])
 for i in range(3):
  p.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A08')")
  p.wait_for_function("document.querySelector('.skill-modal-title [data-skill-icon=A08]').dataset.imageState==='error'")
  assert p.locator('.skill-modal-title [data-skill-icon=A08] svg').count()==0
 assert 1<=len(failures)<=3
 p.screenshot(path=str(OUT/'network-failure-A08.jpg'),type='jpeg',quality=85)
 p.evaluate("HonroApp.showCamp('mage');HonroApp.talent('M05')")
 p.wait_for_function("document.querySelector('.skill-modal-title [data-skill-icon=M05]').dataset.imageState==='ready'")
 p.screenshot(path=str(OUT/'final-build-M05.jpg'),type='jpeg',quality=85)
 states=[]
 for cls,id in [('archer','A09'),('knight','S13'),('mage','M05'),('occultist','O14')]:
  p.evaluate("opts=>{const a=HonroApp,C=HONRO_CORE;a.profile.recruited=['archer','knight','mage','occultist'];const h=a.profile.heroes[opts.cls];h.xp=C.xpAtLevel(30);h.statTraining=0;h.ranks={[C.baseSkill(opts.cls)]:1,...Object.fromEntries(C.TALENTS.filter(t=>t.cls===opts.cls).map(t=>[t.id,1]))};h.ranks[opts.id]=2;a.showCamp(opts.cls);a.talent(opts.id)}",{'cls':cls,'id':id})
  p.wait_for_function("id=>document.querySelector('.skill-modal-title [data-skill-icon='+id+']')?.dataset.imageState==='ready'",arg=id)
  p.locator('[data-action=train]').tap();assert p.evaluate('(opts)=>HonroApp.profile.heroes[opts.cls].ranks[opts.id]',{'cls':cls,'id':id})==3
  p.locator('[data-action=rank-minus-detail]').tap();assert p.evaluate('(opts)=>HonroApp.profile.heroes[opts.cls].ranks[opts.id]',{'cls':cls,'id':id})==2
  p.evaluate("opts=>{const a=HonroApp,C=HONRO_CORE,h=a.profile.heroes[opts.cls];h.statTraining=C.pointsEarned(h)-C.pointsSpent(h,opts.cls);a.talent(opts.id)}",{'cls':cls,'id':id})
  assert p.locator('[data-action=train]').is_disabled() and not p.locator('[data-action=rank-minus-detail]').is_disabled()
  p.wait_for_timeout(100);p.screenshot(path=str(OUT/('sp0-'+cls+'.jpg')),type='jpeg',quality=85)
  p.evaluate("opts=>{const a=HonroApp,C=HONRO_CORE,h=a.profile.heroes[opts.cls];h.xp=0;h.statTraining=0;h.ranks={[C.baseSkill(opts.cls)]:1};a.talent(opts.id)}",{'cls':cls,'id':id})
  assert p.locator('[data-action=train]').is_disabled() and p.locator('[data-action=rank-minus-detail]').is_disabled()
  p.wait_for_timeout(100);p.screenshot(path=str(OUT/('locked-'+cls+'.jpg')),type='jpeg',quality=85)
  states.append({'class':cls,'id':id,'addRemove':True,'zeroSP':True,'locked':True})
 assert not errors
 (OUT/'final-build-smoke.json').write_text(json.dumps({'browser':b.version,'complete':m['complete'],'artReview':m['artReview'],'icons':len(m['icons']),'imageURLs':{id:item['url'] for id,item in m['icons'].items()},'coldIntroRequests':0,'404RequestsAcrossThreeModalVisits':len(failures),'404URL':failures[0],'fallbackSVGVisible':False,'pageErrors':errors,'classStateChecks':states},ensure_ascii=False,indent=2)+'\n');b.close()
print('PASS final build: approved 84 mapped icons, intro zero requests, bounded 404 retries across 3 visits, neutral placeholder without SVG, M05 real modal, no exceptions')
