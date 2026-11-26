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
  print('ENTRY AND SKIP',id,flush=True)
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function('!!window.HonroApp',timeout=90000)
  page.evaluate('()=>HonroApp.setDebugMode(true)')
 assert not errors,errors
