"""Smoke test the shipped Sodan controls from isolated existing chapter saves."""
import argparse
import json
import mimetypes
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('stage',type=int,choices=[53,55,57])
parser.add_argument('--chromium',default='/usr/bin/chromium')
parser.add_argument('--out',type=Path,default=Path('_local/reports/act6-sodan'))
parser.add_argument('--mobile',action='store_true')
parser.add_argument('--live',action='store_true')
args=parser.parse_args()
root=Path.cwd()
args.out.mkdir(exist_ok=True,parents=True)
origin='https://sys8994.github.io'
native='honro-first-act-profile-1'
seeds=json.loads(subprocess.check_output(['node','-e',"""
const stage=+process.argv[1],{profile,body}=require('./shared/act6-debug-stages/fixtures.json')[stage];
const sha=body=>require('crypto').createHash('sha256').update(JSON.stringify(body)).digest('hex');
// Stage 53 uses a fixture with one extra learned branch skill but no loadout edit.
if(stage===53){
 const s=body.custody.full.occultist;
 s.ranks.O07=1;
 body.terminal.actors.find(u=>u.cls==='occultist').ranks.O07=1;
 body.terminalSHA=sha(body.terminal);body.custodySHA=sha(body.custody);
}
console.log(JSON.stringify({'honro-first-act-profile-1':JSON.stringify(profile),[body.slot]:JSON.stringify({...profile,honroAct6ChapterBoundary:{body,sha:sha(body)}})}));
""",str(args.stage)],text=True))
errors=[]
def local(route):
 f=root/urlparse(route.request.url).path.removeprefix('/honro/')
 if f.is_dir(): f=f/'index.html'
 if not f.is_file(): return route.fulfill(status=404)
 route.fulfill(path=str(f),content_type={'.js':'text/javascript','.mjs':'text/javascript'}.get(f.suffix,mimetypes.guess_type(f)[0]))

with sync_playwright() as p:
 proxy={'server':os.environ['HTTPS_PROXY']} if args.live and os.environ.get('HTTPS_PROXY') else None
 b=p.chromium.launch(executable_path=args.chromium,args=['--no-sandbox','--single-process','--no-zygote','--disable-gpu'],proxy=proxy)
 c=b.new_context(viewport={'width':390 if args.mobile else 1440,'height':844 if args.mobile else 900},has_touch=args.mobile,is_mobile=args.mobile,ignore_https_errors=args.live)
 if not args.live: c.route(origin+'/honro/**',local)
 page=c.new_page()
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda e:print(e.type,e.text[:420],flush=True) if e.type=='warning' else None)
 page.add_init_script("for(const [k,v] of Object.entries("+json.dumps(seeds)+"))localStorage.setItem(k,v);")
 page.goto(origin+'/honro/',wait_until='domcontentloaded')
 page.wait_for_function('!!window.HonroApp',timeout=120000)
 finish='for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp)'
 page.evaluate('HonroApp.showRest();'+finish)
 page.locator(f'[data-act6-boundary-resume="{args.stage}"]').click(timeout=15000)
 page.wait_for_function(f'HonroApp.engine?.b.honroStage==={args.stage}',timeout=30000)
 page.evaluate(finish)
 print(f'Mounted {args.stage}',flush=True)
 if args.stage==53:
  chooser=page.get_by_label('소단의 혼이 사용할 주박 기예')
  assert chooser.locator('option').evaluate_all('(list)=>list.map(x=>x.value)')==['O06','O07']
  chooser.select_option('O07')
  # A valid nearby contact and deterministic prediction isolate the UI / stock
  # cast from a complete playthrough and from AI choosing a different target.
  page.evaluate("""()=>{
   const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,t=b.terrain.find(t=>t.id==='upper-threshold-footing');
   const foe=b.units.find(q=>q.side===1);
   for(const [actor,x] of [[u,2640],[foe,2550]])Object.assign(actor,{x,y:C.topAt(t,x),vx:0,vy:0,acted:false,airborne:false,jumping:false});
   if(!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u))throw Error('invalid support contact');
   const old=e.predict;e.predict=(actor,skill,...rest)=>skill.id==='O07'?{unit:foe.id}:old.call(e,actor,skill,...rest);
   a.scene.x=u.x;a.scene.y=u.y-170;
  }""")
  action=page.locator('[data-act6-sodan-spirit]')
  page.wait_for_function("!document.querySelector('[data-act6-sodan-spirit]').disabled")
  page.screenshot(path=args.out/f'6-3-{"mobile" if args.mobile else "pc"}.png')
  start=page.evaluate('HonroApp.engine.b.shot')
  action.click()
  assert page.evaluate('HonroApp.engine.b.shot')==start+1
  assert chooser.is_hidden() and action.is_disabled()
  assert '혼령 지원' in action.inner_text()
 elif args.stage==55:
  assert page.locator('[data-act6-sodan-body]').is_disabled()  # no O13 on this saved roster
  assert page.evaluate("""()=>{const e=HonroApp.engine,u=e.b.units.find(v=>v.cls==='occultist'&&v.side===0);
   return u.fixed&&!e.actors(0).includes(u)&&!e.select(u.id)&&!e.walk(u,1,.1)&&!e.jump(u)&&!e.skillAllowed(HONRO_CORE.SKILLS.O06,u)}""")
  page.evaluate("""()=>{const a=HonroApp,u=a.engine.b.units.find(v=>v.cls==='occultist'&&v.side===0);a.scene.x=u.x;a.scene.y=u.y-115;}""")
  page.screenshot(path=args.out/f'6-5-{"mobile" if args.mobile else "pc"}.png')
 elif args.stage==57:
  held=page.locator('[data-act6-sodan-tether]')
  assert '좌정' in held.inner_text()
  assert page.evaluate("""()=>{const a=HonroApp,e=a.engine,u=e.b.units.find(v=>v.cls==='occultist'&&v.side===0);
   if(!e.select(u.id))return false;a.scene.x=u.x;a.scene.y=u.y-115;
   return u.fixed&&e.canAct()&&!e.walk(u,-1,.1)&&!e.jump(u)&&!e.canDrop(u)&&!e.skillAllowed(HONRO_CORE.SKILLS.O06,u)}""")
  page.screenshot(path=args.out/f'6-7-{"mobile" if args.mobile else "pc"}.png')
 assert page.evaluate('(key)=>localStorage.getItem(key)',native)==seeds[native]
 assert not errors,errors
 print(f'PASS Sodan controls {args.stage}; stock campaign save unchanged',flush=True)
 b.close()
