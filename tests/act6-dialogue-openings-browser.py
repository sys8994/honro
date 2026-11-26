import json
from browser_support import launch,ROOT
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse,unquote
import mimetypes
def assets(route):
 sub=unquote(urlparse(route.request.url).path).removeprefix('/honro/').lstrip('/')
 target=(ROOT/(sub or 'index.html')).resolve()
 if not target.is_relative_to(ROOT) or not target.is_file():
  route.fulfill(status=404,body='local fixture unavailable');return
 route.fulfill(status=200,path=target,content_type=mimetypes.guess_type(target)[0] or 'application/octet-stream')
with sync_playwright() as pw:
 browser=launch(pw); page=browser.new_page(viewport={'width':1365,'height':850})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://sys8994.github.io/honro/**',assets)
 page.goto('https://sys8994.github.io/honro/',wait_until='domcontentloaded')
 page.wait_for_function('!!window.HonroApp',timeout=90000)
 page.evaluate("""()=>{const a=HonroApp;a.setDebugMode(true);HonroRestJourney.showBook(a,51,null,6);}""")
 for id,needle in [(51,'고개에서 본 절'),(52,'위에서 본 곳이 셋'),(53,'들어오긴 했네'),(54,'처마가 저리'),(55,'소단, 종터까지'),(56,'저 아래로 가는 혼'),(57,'진목 받침이 기울었소'),(58,'네 사람이 다 들어왔군'),(59,'산문 밖입니다'),(60,'여기까지는 소리가')]:
  if id!=51:page.evaluate('n=>HonroRestJourney.showBook(HonroApp,n,null,6)',id)
  page.locator(f'[data-action="journey-travel"][data-id="{id}"]').click(timeout=20000)
  page.wait_for_function('n=>HonroApp.engine?.b.honroStage===n && !!HonroApp.dialogue',arg=id,timeout=30000)
  if id==51: assert not page.evaluate('HonroApp.engine.b.honroState.flags?.["act6.threeSitesSighted"]')
  assert needle in page.locator('#dialogue-root').inner_text()
  carried=page.evaluate('JSON.stringify(HonroApp.profile)')
  page.locator('#dialogue-root [data-action="dialogue-next"]').click(timeout=5000)
  assert page.evaluate('HonroApp.dialogue.index')==1
  if id in (53,54,56): assert page.evaluate("HonroApp.dialogue.lines.some(row=>row[0]==='소단')")
  page.locator('#dialogue-root [data-action="dialogue-prev"]').click(timeout=5000)
  assert page.evaluate('HonroApp.dialogue.index')==0
  page.screenshot(path=f'_local/reports/dialogue-entry-{id}.png')
  page.locator('#dialogue-root [data-action="dialogue-skip"]').click(timeout=5000)
  page.wait_for_function('!HonroApp.dialogue',timeout=6000)
  assert page.evaluate('HonroApp.engine.b.phase')=='aim'
  assert page.evaluate('JSON.stringify(HonroApp.profile)')==carried
  if id==52:
   marks=json.loads((ROOT/'shared/data/act6-qa/first-two.json').read_text())['rows']['52']['mission']['marks']
   button=page.locator('[data-act6-qa-lookout]')
   def position(index,target=None):
    return page.evaluate("""({mark,target})=>{
     const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,
      u=b.units.find(v=>v.side===0&&v.cls===mark.cls),
      t=b.terrain.find(v=>v.id===mark.support);
      const at=()=>{Object.assign(b,{side:0,phase:'aim',active:u.id,projectiles:[]});Object.assign(u,{x:mark.x,y:C.topAt(t,mark.x),vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});};
      at();
      if(target==='stone'){
       const stone=e.unit('cliff-stone');
       for(let i=0;i<7&&!stone.dead;i++){
        at();u.focus=u.maxFocus;u.facing=1;
        if(!e.fire('A01',75,.55))throw Error('shot not admitted');
        const p=b.projectiles.find(v=>v.owner===u.id&&v.skill==='A01');
        Object.assign(p,{x:stone.x,y:stone.y-stone.h*.65-28,vx:0,vy:650});
        for(let j=0;j<25&&b.projectiles.includes(p);j++)e.stepProjectile(p,1/120);
       }if(!stone.dead)throw Error('stone not down');
      }
      if(target==='keeper'){const k=e.unit(mark.afterEnemy);e.hurt(k,1000000,null,false,undefined,undefined,'environment');if(!k.dead)throw Error('keeper not down');}
      at();a.updateHUD(true);return e.grounded(u);
    }""",{'mark':marks[index],'target':target})
   assert position(0)
   button.click();assert not page.evaluate('HonroApp.dialogue')
   for i,target,word in [(0,'stone','맞혔습니다'),(1,'keeper','석교 쪽은 비웠소'),(2,None,'묶었어요')]:
    assert position(i,target)
    button.click()
    assert word in page.locator('#dialogue-root').inner_text()
    page.locator('#dialogue-root [data-action="dialogue-skip"]').click()
    assert not page.evaluate('HonroApp.dialogue')
   assert not page.evaluate('HonroApp.done')
   print('VERIFIED CLIFF → BRIDGE → BELL; INVALID CLIFF NO DIALOGUE',flush=True)
  if id==58:
   button=page.locator('[data-act6-qa-lookout]')
   def at58(cls,x):
    return page.evaluate("""({cls,x})=>{
     const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(v=>v.side===0&&v.cls===cls);
     const surface=HONRO_CORE.terrainSurface(b.terrain.filter(t=>t.id==='local-lower-08-body'),x,2100,3555,Infinity);
     if(!u||!surface)return false;
     Object.assign(b,{side:0,phase:'aim',active:u.id,projectiles:[]});
     Object.assign(u,{x,y:surface.y,vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});
     a.updateHUD(true);return e.grounded(u);
    }""",{'cls':cls,'x':x})
   assert at58('mage',3496);button.click();assert not page.evaluate('!!HonroApp.dialogue')
   assert at58('occultist',3496);button.click();assert '기둥 뒤에서' in page.locator('#dialogue-root').inner_text()
   assert page.evaluate('HonroApp.engine.b.honroState.flags.localColumnSealAligned===true')
   assert not page.evaluate("!!HonroApp.engine.unit('a6-c08-boss')")
   page.locator('#dialogue-root [data-action="dialogue-skip"]').click()
   assert at58('mage',3680);button.click()
   assert page.evaluate("!!HonroApp.engine.unit('a6-c08-boss')")
   assert '그 진목을 뽑아라' in page.locator('#dialogue-root').inner_text()
   page.locator('#dialogue-root [data-action="dialogue-skip"]').click()
   assert page.evaluate('JSON.stringify(HonroApp.profile)')==carried
   print('VERIFIED DAEDOSA APPEARS ONLY AFTER COLUMN → THRESHOLD',flush=True)
  if id==60:
   button=page.locator('[data-act6-qa-lookout]')
   page.evaluate("""()=>{
    const a=HonroApp,e=a.engine,b=e.b,role=b.units.find(v=>v.side===0&&v.cls==='occultist'),soul=b.units.find(v=>v.side===2);
    if(!role||!soul)throw Error('escort test fixture');
    const floor=e.contactSurface(soul.x,soul.y-3,soul.y+4)?.t;
    if(!floor)throw Error('soul has no floor');
    Object.assign(b,{side:0,phase:'aim',active:role.id,projectiles:[]});
    Object.assign(role,{x:5360,y:HONRO_CORE.topAt(floor,5360),vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:role.maxMove,moving:0});
    delete role.platformDrop;delete role.groundContact;delete role.moveTarget;
    a.updateHUD(true);
   }""")
   page.wait_for_function('HonroApp.canInput() && HonroApp.engine.canAct()')
   button.click()
   assert '제가 먼저 걸을게요' in page.locator('#dialogue-root').inner_text()
   page.locator('#dialogue-root [data-action="dialogue-skip"]').click()
   assert not page.evaluate('HonroApp.done')
   print('VERIFIED SOUL ESCORT ACCEPTED BEFORE DIALOGUE',flush=True)
  print('ENTRY AND SKIP',id,flush=True)
  if id!=60:
   page.reload(wait_until='domcontentloaded')
   page.wait_for_function('!!window.HonroApp',timeout=90000)
   page.evaluate('()=>HonroApp.setDebugMode(true)')
 assert not errors,errors
