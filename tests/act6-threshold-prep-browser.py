"""Check the stock 6-2 preparation UI and both 6-3 entry paths. The fixture supplies combat contact/aim to keep the test short."""
import argparse, json, mimetypes, subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
arg=argparse.ArgumentParser()
arg.add_argument('--chromium',default='/usr/bin/chromium')
arg.add_argument('--out',type=Path,default=Path('_local/reports/act6-threshold-prep'))
arg.add_argument('--mobile',action='store_true')
arg.add_argument('--live',action='store_true')
args=arg.parse_args()
root=Path.cwd()
origin='https://sys8994.github.io'
out=args.out;out.mkdir(parents=True,exist_ok=True)
seeds=json.loads(subprocess.check_output(['node','-e',"""
const {profile,body}=require('./shared/act6-debug-stages/fixtures.json')[52];
const sha=body=>require('crypto').createHash('sha256').update(JSON.stringify(body)).digest('hex');
console.log(JSON.stringify({'honro-first-act-profile-1':JSON.stringify(profile),[body.slot]:JSON.stringify({...profile,honroAct6ChapterBoundary:{body,sha:sha(body)}})}));
"""],text=True))
baseKey='honro-first-act-profile-1'
key=next(k for k in seeds if k!=baseKey)
def handle(route):
 p=root/urlparse(route.request.url).path.removeprefix('/honro/')
 if p.is_dir():p=p/'index.html'
 if not p.is_file():return route.fulfill(status=404)
 route.fulfill(path=str(p),content_type={'.js':'text/javascript','.mjs':'text/javascript'}.get(p.suffix,mimetypes.guess_type(p)[0]))

fixture=r"""() => {
const app=HonroApp,e=app.engine,b=e.b,C=HONRO_CORE;
function foot(u,x,id){
 const t=b.terrain.find(t=>t.id===id); if(!t)throw Error('support '+id);
 Object.assign(u,{x,y:C.topAt(t,x),vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});
 if(!e.grounded(u)||!C.validTerrainContactPose(b.terrain,u))throw Error('bad contact '+u.cls+' '+x);
 return u;
}
function active(cls,x,id){
 const u=b.units.find(v=>v.side===0&&v.cls===cls);
 Object.assign(b,{side:0,phase:'aim',active:u.id,projectiles:[]});
 return foot(u,x,id);
}
window.qaPrep={active,foot};
}"""
direct=r"""() => {
 const e=HonroApp.engine,b=e.b,u=qaPrep.active('archer',1200,'west-watch-and-descent'),s=e.unit('cliff-stone');
 for(let i=0;i<8&&!s.dead;i++){
  qaPrep.active('archer',1200,'west-watch-and-descent');u.focus=u.maxFocus;u.facing=1;
  if(!e.fire('A01',75,.55))throw Error('native archer shot rejected');
  const p=b.projectiles.find(v=>v.owner===u.id&&v.skill==='A01');if(!p)throw Error('no projectile');
  Object.assign(p,{x:s.x,y:s.y-s.h*.65-28,vx:0,vy:650});
  for(let j=0;j<25&&b.projectiles.includes(p);j++)e.stepProjectile(p,1/120);
 }
 if(!s.dead)throw Error('archer did not open cliff');
 qaPrep.active('archer',1200,'west-watch-and-descent');
}"""
read_actor="""() => {
 const m=HonroApp.engine.b.units.find(u=>u.cls==='mage'&&u.side===0);
 return Object.fromEntries(['loadout','equipmentIds','hp','maxHp','focus','maxFocus','attack','armor','critChance','critMultiplier'].map(k=>[k,m[k]??null]));
}"""
finish='for(let i=0;HonroApp.dialogue&&i<30;i++)HonroStory.finish(HonroApp)'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.chromium,args=['--no-sandbox','--single-process','--no-zygote','--disable-gpu'],proxy={'server':__import__('os').environ['HTTPS_PROXY']} if args.live else None)
 c=browser.new_context(viewport={'width':390 if args.mobile else 1440,'height':844 if args.mobile else 900},has_touch=args.mobile,is_mobile=args.mobile,ignore_https_errors=args.live)
 if not args.live:c.route(origin+'/honro/**',handle)
 page=c.new_page()
 page.on('pageerror',lambda e:print('PAGEERROR',e,flush=True))
 page.on('console',lambda e: print(e.type,e.text[:400],flush=True) if e.type=='warning' else None)
 page.add_init_script("if(!sessionStorage.getItem('prep-seeded')){for(const [k,v] of Object.entries("+json.dumps(seeds)+"))localStorage.setItem(k,v);sessionStorage.setItem('prep-seeded','1');}")
 def enter(s):
  page.wait_for_function('!!window.HonroApp',timeout=120000)
  page.evaluate('HonroApp.showRest();'+finish)
  page.locator(f'[data-act6-boundary-resume="{s}"]').click(timeout=15000)
  page.wait_for_function(f'HonroApp.engine?.b.honroStage==={s}',timeout=30000)
  page.evaluate(finish)
 page.goto(origin+'/honro/')
 enter(52)
 print('Mounted 52',flush=True)
 page.clock.install();page.clock.pause_at(page.evaluate('Date.now()+1000'))
 page.evaluate(fixture);page.evaluate(direct)
 btn=page.locator('[data-act6-qa-lookout]')
 prep=page.locator('[data-act6-threshold-prep]')
 assert prep.is_hidden()
 def action():
  btn.click()
  page.evaluate(finish)
 action()
 page.evaluate("""()=>{const e=HonroApp.engine,k=e.unit('bridge-keeper');e.hurt(k,1e6,'p-knight',true,undefined,{x:k.x,y:k.y-k.h/2},'normal');qaPrep.active('knight',3290,'broken-arch-west');}""")
 action()
 page.evaluate("qaPrep.active('occultist',4399,'east-return-buttress')")
 action()
 assert prep.is_visible()
 prep.click()
 assert page.locator('[data-prep-roster]').count()==0
 page.evaluate("""()=>{const b=HonroApp.engine.b;b.units.filter(u=>u.side===0&&!u.honroAlly).forEach((u,i)=>qaPrep.foot(u,4399+22*i,'east-return-buttress'));qaPrep.active('mage',4480,'east-return-buttress');}""")
 before=page.evaluate(read_actor)
 snapshot=page.evaluate('(k)=>localStorage.getItem(k)',key)
 prep.click()
 modal=page.locator('.act6-threshold-prep')
 assert modal.is_visible()
 modal.locator('[data-prep-clear]').click()
 assert not modal.is_visible()
 assert page.evaluate(read_actor)==before
 prep.click()
 mage=modal.locator('details').filter(has_text='담허')
 mage.get_by_label('전용 장비').select_option('itm_da_02')
 mage.get_by_label('기예 1').select_option('M07')
 mage.get_by_label('기예 2').select_option('M10')
 modal.locator('[data-prep-apply]').click()
 assert not modal.is_visible(),modal.inner_text()
 assert page.evaluate(read_actor)==before
 assert page.evaluate('(k)=>localStorage.getItem(k)',key)==snapshot
 prep.click()
 page.screenshot(path=out/('mobile.png' if args.mobile else 'desktop.png'))
 page.keyboard.press('Escape')
 action()
 assert page.evaluate('HonroApp.engine.b.phase')=='won'
 button=page.locator('[data-act6-qa-next="53"]')
 page.clock.resume()
 button.click(timeout=15000)
 page.wait_for_function('HonroApp.engine?.b.honroStage===53',timeout=40000)
 page.evaluate(finish)
 warm=page.evaluate(read_actor)
 assert warm['equipmentIds']==['itm_da_02'] and warm['loadout']==['M01','M07','M10',''],warm
 assert warm['hp']<=before['hp'] and warm['focus']<=before['focus']
 assert page.evaluate('(k)=>localStorage.getItem(k)',baseKey)==seeds[baseKey]
 print('Warm 53',warm,flush=True)
 page.reload(wait_until='domcontentloaded')
 enter(53)
 cold=page.evaluate(read_actor)
 assert warm==cold,(warm,cold)
 assert page.evaluate('(k)=>localStorage.getItem(k)',baseKey)==seeds[baseKey]
 assert 'M09' not in cold['loadout']
 assert page.evaluate("""()=>{const a=HonroApp,e=a.engine;return e.b.stakes.length===2&&e.b.stakes.every(s=>s.skill==='M09'&&s.owner===e.active.id)}""")
 print('Cold 53',cold,flush=True)
 page.screenshot(path=out/('mobile-arrival.png' if args.mobile else 'desktop-arrival.png'))
 # Stock passage action, then aim and release through the regular game handler.
 page.evaluate(fixture)
 page.evaluate("qaPrep.active('mage',2690,'south')")
 page.locator('[data-act6-qa-lookout]').click()
 shot=page.evaluate("""()=>{
  const a=HonroApp,e=a.engine,u=e.active,k=HONRO_CORE.SKILLS.M09,b=e.b;
  if(!e.grounded(u)||e.contactSurface(u.x,u.y-4,u.y+4)?.t.id!=='upper-threshold-footing')throw Error('passage did not reach footing');
  for(const f of [-1,1]){u.facing=f;
   for(let angle=30;angle<=150;angle+=2)for(const power of [.15,.25,.35,.45,.55,.65,.75,.9]){
    const p=e.predict(u,k,angle,power,undefined,true);
    if(p.terrain==='upper-threshold-footing'&&p.x>=2450&&p.x<=2600){
      const before=b.shot, old=a.chargePower;u.angle=angle;a.updateHUD(true);a.selected='M09';a.charging=true;a.chargePower=()=>power;try{a.releaseCharge();}finally{a.chargePower=old;}
      return {released:b.shot>before,slots:u.loadout,focus:u.focus};
    }
   }
  }return null;
 }""")
 assert shot and shot['released'] and shot['slots']==cold['loadout'],shot
 print('Native M09 released without changing the equipped slots',flush=True)
 browser.close()
