"""Production dialogue action-row transparency and visible-text boundaries.
Before uses published424c artifacts; parent injects only the reviewed transparent
row rule over those same artifacts. After uses the actual rebuilt final CSS.
"""
import hashlib,json,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
phase=sys.argv[sys.argv.index('--phase')+1] if '--phase' in sys.argv else 'after'
OUT=ROOT/'_local/reports/dialogue-action-row';OUT.mkdir(parents=True,exist_ok=True);shots=OUT/phase;shots.mkdir(exist_ok=True)
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,13)});profile['lastStage']=13;rows=[];checks=[]
def inspect(p):
 return p.evaluate('''()=>{const s=document.querySelector('#dialogue-root section'),p=s.querySelector('#story-line'),a=s.querySelector('.story-actions'),r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};},area=r(a),sr=r(s),pr=r(p),range=document.createRange();range.selectNodeContents(p);const inner=/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowY),clip=inner?pr:sr,intersect=(x,y)=>x.x<y.right&&x.right>y.x&&x.y<y.bottom&&x.bottom>y.y;const text=[...range.getClientRects()].map(b=>({x:b.x,y:b.y,right:b.right,bottom:b.bottom})).filter(b=>intersect(b,clip)).map(b=>({x:Math.max(b.x,clip.x),y:Math.max(b.y,clip.y),right:Math.min(b.right,clip.right),bottom:Math.min(b.bottom,clip.bottom)})),overlap=text.filter(b=>intersect(b,area));return {scene:sr,line:pr,actions:area,bg:getComputedStyle(a).backgroundColor,lineOverflow:getComputedStyle(p).overflowY,scroll:{scene:[s.scrollHeight,s.clientHeight,s.scrollTop],line:[p.scrollHeight,p.clientHeight,p.scrollTop]},visibleTextRowOverlap:overlap,buttons:[...a.querySelectorAll('button')].map(e=>{const b=r(e);return {action:e.dataset.action,disabled:e.disabled,rect:b,visible:b.x>=sr.x&&b.right<=sr.right&&b.y>=sr.y&&b.bottom<=sr.bottom&&b.y>=0&&b.bottom<=innerHeight&&(e.disabled||document.elementFromPoint(b.x+b.w/2,b.y+b.h/2)?.closest('button')===e)};})};}''')
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);c=browser.new_context(viewport={'width':390,'height':844},has_touch=True,device_scale_factor=1);p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let seed=13;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroApp.launch(13)');p.wait_for_function('HonroApp.engine?.b.honroStage===13');p.evaluate('()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);}')
 if phase=='parent':p.add_style_tag(content='.story-scene .story-actions{background:none}')
 p.evaluate('''()=>{const a=HonroApp,lines=s=>[...(s.story||[]),...Object.values(s.beats||{}).flat(),...(s.outro||[])];window.reviewLines={};for(const who of ['설오','담허','휘겸','소단'])reviewLines[who]=[...lines(a.stage),...HONRO_CONTENT.stages.flatMap(lines)].find(l=>l[0]===who).slice(0,2);}''')
 start=p.evaluate('HonroPortraits.stats()')
 for w,h,view in [(390,844,'mobile'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h})
  for who,long in [('담허',False),('설오',False),('휘겸',False),('소단',False),('담허',True),('문탁',True),('새 주민',True),('서술',True)]:
   p.evaluate('([who,long])=>HonroStory.start(HonroApp,[[who,(reviewLines[who]?.[1]||reviewLines["담허"][1]).repeat(long?35:1)],reviewLines["담허"]],{title:HonroApp.stage.name})',[who,long]);p.wait_for_timeout(240);p.locator('.story-scene').evaluate('e=>Promise.all((e.closest(".dialogue-presentation")||e).getAnimations().map(a=>a.finished.catch(()=>{})))')
   for at in ([0,.5,1] if long else [0]):
    p.evaluate('at=>{const s=document.querySelector("#dialogue-root section"),p=s.querySelector("#story-line"),scroller=/(auto|scroll)/.test(getComputedStyle(p).overflowY)&&p.scrollHeight>p.clientHeight?p:s;scroller.scrollTop=(scroller.scrollHeight-scroller.clientHeight)*at;}',at);p.wait_for_timeout(40)
    row={'view':view,'who':who,'long':long,'at':at,**inspect(p)};rows.append(row);assert all(x['visible']for x in row['buttons']),row
    if phase=='after':assert row['bg']=='rgba(0, 0, 0, 0)' and not row['visibleTextRowOverlap'],row
    if who=='담허' and (not long or at==.5) or who=='새 주민' and at==.5:p.screenshot(path=str(shots/f'{view}-{who}-{"long" if long else "short"}-{at}.jpg'),type='jpeg',quality=93)
   p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue.index===1');p.locator('[data-action="dialogue-prev"]').tap();p.wait_for_function('HonroApp.dialogue.index===0');p.locator('[data-action="dialogue-skip"]').tap();p.wait_for_function('!HonroApp.dialogue')
 resizes=[]
 if phase=='after':
  p.set_viewport_size({'width':390,'height':844});p.evaluate('HonroStory.start(HonroApp,[["담허",reviewLines["담허"][1].repeat(35)],reviewLines["담허"]],{title:HonroApp.stage.name});window.sameReadingPanel=document.querySelector(".story-scene")');p.wait_for_timeout(150)
  for w,h in [(844,390),(390,844),(844,390)]:
   p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(150);r=inspect(p);assert not r['visibleTextRowOverlap'] and all(x['visible']for x in r['buttons']) and p.evaluate('sameReadingPanel===document.querySelector(".story-scene")'),r;resizes.append(r)
 # Guide actions share the transparent reading surface; the guide panel keeps its own colour.
 p.evaluate('HonroStory.start(HonroApp,[["안내",reviewLines["담허"][1]],["담허",reviewLines["담허"][1]]],{title:"검수"})');p.wait_for_timeout(240);guide=p.evaluate('getComputedStyle(document.querySelector(".story-guide .story-actions")).backgroundColor');assert guide=='rgba(0, 0, 0, 0)',guide
 end=p.evaluate('HonroPortraits.stats()');assert end['requests']==start['requests'] and end['decodes']==start['decodes'] and end['waiters']==0,(start,end);assert not errors,errors;browser.close()
report={'phase':phase,'head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'rows':rows,'guideBackground':guide,'liveResizeRetainsPanel':resizes,'imageCounters':{'before':start,'after':end},'errors':errors}
if phase=='after':
 before=json.loads((OUT/'before.json').read_text());comparisons=[]
 for old,new in zip(before['rows'],rows):
  if not new['long'] and '--layout-revision'not in sys.argv:
   for field in ['scene','line','actions']:
    for k in ['x','y','w','h']:assert abs(old[field][k]-new[field][k])<1.1,(new['who'],field,k,old[field][k],new[field][k])
   comparisons.append([new['view'],new['who']])
 report['shortRectsPreserved']=comparisons
 if '--layout-revision'in sys.argv:
  for old,new in zip(before['rows'],rows):
   if '--silhouette-dialogue'not in sys.argv or new['view']=='mobile':assert new['line']['w']>=old['line']['w']-1.1,(old,new)
   else:assert new['line']['w']>=240,(old,new)
  report['bodyWidthNotReduced']='mobile only'if '--silhouette-dialogue'in sys.argv else True
(OUT/(phase+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));print('PASS',phase,len(rows),'positions; overlaps',sum(bool(r['visibleTextRowOverlap'])for r in rows))
