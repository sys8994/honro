"""Single approved release replacement, actual App/Engine/WebAudio; no listening QA."""
import ast,json,hashlib
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/bowstring-v4-20261024';OUT.mkdir(parents=True,exist_ok=True)
module=ast.parse((ROOT/'tests/approved-weapons-v3-browser.py').read_text());constants={n.targets[0].id:ast.literal_eval(n.value)for n in module.body if isinstance(n,ast.Assign)and isinstance(n.value,ast.Constant)and isinstance(n.targets[0],ast.Name)}
checks=[]
def check(name,ok,data=None):
 assert ok,(name,data)
 checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as pw,serve_game() as url:
 b=launch(pw);p=b.new_page();p.add_init_script(constants['INIT']);errors=[];requests=[];p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:requests.append(r.url));p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=60000);p.evaluate("async()=>{const a=HonroApp;a.profile.settings.sound=true;a.profile.settings.music=false;a.audio.configure(a.profile.settings);await HonroOptionalRuntime.load('training')}");p.keyboard.press('Shift');p.wait_for_function("HonroApp.audio.context?.state==='running'")
 cases=[]
 for kind,ms in [('quick',20),('held',500),('cancel',100),('mute',20)]:
  p.evaluate(constants['LAUNCH'],'A01');p.evaluate('async()=>{await HonroApp.audio.skills.prepareWanted()}')
  if kind=='mute':p.evaluate("()=>{const a=HonroApp;a.profile.settings.sound=false;a.audio.configure(a.profile.settings)}")
  p.keyboard.down('Space');p.wait_for_timeout(ms)
  if kind=='cancel':p.evaluate('HonroApp.cancelInput()')
  p.keyboard.up('Space');p.wait_for_timeout(70);trace=p.evaluate('trace');release=[x for x in trace if x['asset']=='bow_release'];cases.append({'kind':kind,'trace':trace})
  check(kind+' release count',len(release)==(1 if kind in ['quick','held']else 0),trace)
  for s in release:check(kind+' gain.95 and decoded duration',abs(s['gains'][0]-.95)<1e-5 and abs(s['duration']-.468004535)<.002,s)
  if kind=='mute':p.evaluate("()=>{const a=HonroApp;a.profile.settings.sound=true;a.audio.configure(a.profile.settings)}");p.wait_for_timeout(80);check('unmute no delayed release',not p.evaluate("trace.some(x=>x.asset==='bow_release')"))
 src=p.evaluate('HONRO_SKILL_AUDIO.assets.bow_release.src');raw=p.request.get(src).body();manifest=json.loads((ROOT/'shared/assets/sfx/bowstring-v4/manifest.json').read_text());check('served hash exact approved MP3',hashlib.sha256(raw).hexdigest()==manifest['outputSHA256']and len(raw)==8402)
 check('old v2/v3 release never requested',not any(h in r for r in requests for h in ['b3e6c5d8466d7b21','2ed1b2fc8853979f']))
 check('no browser exceptions',not errors,errors)
 q=b.new_page();q.add_init_script(constants['INIT']);qrequests=[];q.on('request',lambda r:qrequests.append(r.url));q.route('**/*honro_skill_audio-assets-bow_release-src*.mp3',lambda route:route.fulfill(status=503,body='temporary'));q.goto(url+'/HONRO.html');q.wait_for_function('window.HonroApp',timeout=60000);q.evaluate("async()=>{await HonroOptionalRuntime.load('training')}");q.keyboard.press('Shift');q.evaluate(constants['LAUNCH'],'A01');q.evaluate('async()=>{await HonroApp.audio.skills.prepareWanted()}');q.evaluate("HonroApp.engine.fire('A01',40,.6)");q.wait_for_timeout(100)
 check('failure no release/procedural fallback',not q.evaluate("trace.some(x=>x.asset==='bow_release'||x.asset==='legacy:arrow')")and not any(h in r for r in qrequests for h in ['b3e6c5d8466d7b21','2ed1b2fc8853979f']))
 (OUT/'browser.json').write_text(json.dumps({'checks':checks,'cases':cases,'sourceSHA256':manifest['outputSHA256'],'bytes':len(raw),'requests':requests,'limits':['Real Chromium App input/Engine events/source.start; no subjective listening or physical-device claim.']},ensure_ascii=False,indent=2));b.close()
