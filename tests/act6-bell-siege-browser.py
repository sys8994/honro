"""Check the normal 6-5 entry and repeated wave integration from an isolated checkpoint."""
import argparse
import json
import mimetypes
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('stage',type=int,choices=[55])
parser.add_argument('--chromium',default='/usr/bin/chromium')
parser.add_argument('--out',type=Path,default=Path('_local/reports/act6-siege'))
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

 page.clock.install()
 page.clock.pause_at(page.evaluate('Date.now()+1000'))
 drive="""({round,x,support})=>{
   const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,u=b.units.find(v=>v.cls==='knight'&&v.side===0);
   const t=b.terrain.find(v=>v.id===support);
   Object.assign(b,{side:0,phase:'aim',active:u.id,round,projectiles:[]});
   Object.assign(u,{x,y:C.topAt(t,x),vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});
   if(!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u))throw Error('stage 55 invalid test contact');
   e.refreshActivation();
   for(let i=0;i<180;i++)a.missionTick(1/60);
   a.scene.x=(x<1000?955:2670);a.scene.y=(x<1000?850:1580);
   if(a.scene.targetCamX!==undefined)a.scene.targetCamX=a.scene.x;
   return b.units.filter(u=>u.honroSpawnSource?.startsWith('bell-siege-'))
     .map(u=>({id:u.id,x:u.x,y:u.y,grounded:e.grounded(u),awake:u.awake,support:u.honroEncounterSupport}));
 }"""
 west=page.evaluate(drive,dict(round=2,x=550,support='west-ring-descent'))
 assert len(west)==2 and all(u['grounded'] and u['awake'] for u in west),west
 page.clock.run_for(1400)
 page.screenshot(path=args.out/f"6-5-west-{'mobile' if args.mobile else 'pc'}.png")
 east=page.evaluate(drive,dict(round=4,x=2500,support='arrival-core-terrace'))
 assert len(east)==4 and all(u['x']>2500 and u['grounded'] and u['awake'] for u in east[2:]),east
 page.clock.run_for(1400)
 page.screenshot(path=args.out/f"6-5-east-{'mobile' if args.mobile else 'pc'}.png")
 assert page.locator('[data-act6-sodan-body]').is_disabled()
 assert '좌정' in page.locator('[data-act6-sodan-body]').inner_text()
 assert page.evaluate('(key)=>localStorage.getItem(key)',native)==seeds[native]
 assert not errors,errors
 print('PASS 55: west/east waves spawned as actual grounded active foes; original save unchanged',east,flush=True)
 b.close()
