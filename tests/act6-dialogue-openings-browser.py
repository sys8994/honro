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
 for id,needle in [(51,'고개에서 본 절'),(52,'위에서 본 곳이 셋')]:
  if id==52:page.evaluate("""()=>{const a=HonroApp;HonroRestJourney.showBook(a,52,null,6);}""")
  page.locator(f'[data-action="journey-travel"][data-id="{id}"]').click(timeout=20000)
  page.wait_for_function('n=>HonroApp.engine?.b.honroStage===n && !!HonroApp.dialogue',arg=id,timeout=30000)
  assert not page.evaluate('HonroApp.engine.b.honroState.flags?.["act6.threeSitesSighted"]')
  assert needle in page.locator('#dialogue-root').inner_text()
  page.locator('#dialogue-root [data-action="dialogue-next"]').click(timeout=5000)
  assert page.evaluate('HonroApp.dialogue.index')==1
  page.locator('#dialogue-root [data-action="dialogue-prev"]').click(timeout=5000)
  assert page.evaluate('HonroApp.dialogue.index')==0
  page.screenshot(path=f'_local/reports/dialogue-entry-{id}.png')
  page.locator('#dialogue-root [data-action="dialogue-skip"]').click(timeout=5000)
  page.wait_for_function('!HonroApp.dialogue',timeout=6000)
  assert page.evaluate('HonroApp.engine.b.phase')=='aim'
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
  print('ENTRY AND SKIP',id,flush=True)
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function('!!window.HonroApp',timeout=90000)
  page.evaluate('()=>HonroApp.setDebugMode(true)')
 assert not errors,errors
