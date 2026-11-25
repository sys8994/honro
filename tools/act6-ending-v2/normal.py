import hashlib,json,os,argparse,mimetypes
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
r=Path.cwd()
arg=argparse.ArgumentParser()
arg.add_argument('--chromium',required=True)
arg.add_argument('--live',action='store_true')
args=arg.parse_args()
origin='https://sys8994.github.io'
sh=lambda data:hashlib.sha256(data.encode('utf-8')).hexdigest()
jsonstr=lambda a:json.dumps(a,ensure_ascii=False,separators=(',',':'))
q=json.loads((r/'shared/act6-debug-stages/fixtures.json').read_text())['60']
boot=jsonstr(q['profile'])
raw={**q['profile'],'honroAct6ChapterBoundary':{'body':q['body'],'sha':sh(jsonstr(q['body']))}}
fixture=jsonstr(raw)
path60=next((r/'web/data').glob('act6-qa-chapter-60.483701a278a8ccc6.json'))
quiet=json.loads(path60.read_text())['quiet']
driver=(r/'tools/act6-ending-v2/drive60.js').read_text()
out=r/'_local/reports/ending-v2';out.mkdir(parents=True,exist_ok=True)
def local(route):
 f=r/urlparse(route.request.url).path.removeprefix('/honro/')
 if f.is_dir():f=f/'index.html'
 if not f.is_file():return route.fulfill(status=404)
 route.fulfill(path=str(f),content_type={'.js':'text/javascript','.mjs':'text/javascript'}.get(f.suffix,mimetypes.guess_type(f)[0]))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=args.chromium,args=['--no-sandbox'])
 c=b.new_context(viewport={'width':1440,'height':900})
 if not args.live:c.route(origin+'/honro/**',local)
 page=c.new_page()
 page.on('console',lambda e:print('console:',e.type,e.text[:400],flush=True) if e.type in ('error','warning') else None)
 page.on('pageerror',lambda e:print('PAGEERR',str(e),flush=True))
 page.add_init_script("if(location.origin==='"+origin+"'&&!localStorage.getItem('honro-first-act-profile-1')){localStorage.setItem('honro-first-act-profile-1',"+jsonstr(boot)+");localStorage.setItem("+jsonstr(q['body']['slot'])+","+jsonstr(fixture)+");}")
 page.goto(origin+'/honro/')
 page.wait_for_function('!!window.HonroApp',timeout=120000)
 page.evaluate('HonroApp.showRest(); for(let i=0;HonroApp.dialogue&&i<100;i++)HonroStory.finish(HonroApp)')
 page.locator('[data-act6-boundary-resume="60"]').click()
 page.wait_for_function('HonroApp.engine?.b.honroStage===60',timeout=120000)
 page.evaluate('for(let i=0;HonroApp.dialogue&&i<100;i++)HonroStory.finish(HonroApp)')
 print('mounted 60',flush=True)
 page.clock.install()
 page.clock.pause_at(page.evaluate('Date.now()+1000'))
 page.evaluate('(payload)=>globalThis.testDriver=('+driver+')(payload)',[quiet,None])
 step=page.evaluate('testDriver.next()')
 while not step['done']:
  k=step['value']['kind']
  loc=page.locator('[data-act6-qa-lookout]' if k=='guide' else '[data-act6-qa-walk]')
  loc.click(force=True)
  step=page.evaluate('testDriver.next(true)')
 assert step['value']['shot']==0 and len(step['value']['escort'])==2
 print('completed native walk',step['value']['round'],flush=True)
 page.clock.run_for(400)
 main=page.locator('.he-root[data-ending-mode="completion"]')
 main.wait_for(timeout=15000)
 page.clock.fast_forward(16000)
 assert main.locator('[data-ending-action="record"]').count()==1,main.inner_text()
 page.screenshot(path=out/'normal-ledger.png')
 main.locator('[data-ending-action="record"]').click(force=True)
 page.clock.run_for(800)
 assert main.locator('.he-names').inner_text().split()==['곽진','박문돌','이만복'],main.inner_text()
 before=page.evaluate('JSON.stringify(HonroApp.engine.b.units)')
 page.clock.fast_forward(5700)
 page.keyboard.down('KeyD');page.clock.run_for(3000)
 page.screenshot(path=out/'normal-walk.png')
 page.clock.run_for(2600);page.keyboard.up('KeyD');page.clock.run_for(1200)
 assert page.evaluate('JSON.stringify(HonroApp.engine.b.units)')==before
 finale=page.evaluate("JSON.parse(localStorage.getItem('honro-campaign-act6-finale-v1:'+HonroApp.profile.equipment.runId))")
 assert all(finale['honroFlags'][k] is True for k in ('act6.endingCompleted','game_completed','ending_act6_seen')) and finale['honroEndingReceipt']['winner']=='p-knight'
 assert page.evaluate("localStorage.getItem('honro-first-act-profile-1')")==boot
 assert main.get_attribute('data-ending-still')=='still_01'
 page.clock.fast_forward(201000)
 assert page.evaluate("HonroApp.screen==='title'&&!HonroApp.endingGallery")
 print(jsonstr({'normalStage60PhysicalRoute':True,'liveRosterUnchanged':True,'verifiedFinaleReceipt':True,'baseSaveByteExact':True,'naturalTitleReturn':True,'live':args.live}))
 b.close()
