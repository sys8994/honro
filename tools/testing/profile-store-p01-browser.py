"""P0.1 synthetic records in fresh Chromium contexts. UI gestures/files only after fixture setup; normal App/rAF stays running."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/profile-store-p01';OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1';good=(OUT/'valid-profile.json').read_text();resume=(OUT/'continue-profile.json').read_text();broken=' \n{private-synthetic-profile-body\t';checks=[];errors=[];quota_only='--quota-only'in sys.argv;prior=None
if quota_only:
 prior=json.loads((OUT/'browser.json').read_text());checks=[c for c in prior['checks']if not c.startswith(('debug','normal quota'))]

def setup(context,text=None,read_error=False,quota=False,migration=False):
 context.add_init_script('''(()=>{const key='''+json.dumps(KEY)+''',text='''+json.dumps(text)+''';if(text!==null&&localStorage.getItem(key)===null)localStorage.setItem(key,text);window.fixtureReadError='''+json.dumps(read_error)+''';window.fixtureQuota='''+json.dumps(quota)+''';window.fixtureWrites=0;window.fixtureReads=0;const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k===key){fixtureReads++;if(fixtureReadError)throw Error('fixture read');}return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k===key){fixtureWrites++;if(fixtureQuota)throw Error('fixture quota');}return set.call(this,k,v)};window.fixtureStored=()=>get.call(localStorage,key);'''+('''let progression;Object.defineProperty(window,'HonroProgression',{configurable:true,get(){return progression},set(v){progression=v;v.repairRecruits=()=>{throw Error('fixture migration')}}});''' if migration else '')+'''})();''')

def state(p):return p.evaluate('''({locked:HonroApp.profileStore.locked,state:HonroApp.profileStore.state,screen:HonroApp.screen,stage:HonroApp.engine?.b.honroStage||null,writes:fixtureWrites,error:HonroApp.lastError||null})''')
def assert_preserved(p,text):
 assert p.evaluate('fixtureStored()')==text
 assert p.evaluate('HonroApp.profileStore.locked')
 assert text not in p.locator('body').inner_text()
def click(p,action):p.locator('[data-action="'+action+'"]').first.click()
def choose_file(p,text):
 click(p,'import')
 with p.expect_file_chooser() as picker:click(p,'menu-confirm')
 picker.value.set_files({'name':'fixture.json','mimeType':'application/json','buffer':text.encode()})
 p.wait_for_function('document.getElementById("file-import").value===""')
def start(browser,base,text=None,**flags):
 c=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True);setup(c,text,**flags);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp&&document.documentElement.dataset.honroReady',timeout=90000);return c,p
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw)
 if not quota_only:
  # Failed read/parse must not become a normal campaign through settings, close, retry or reload.
  c,p=start(b,base,broken);assert state(p)['state']['reason']=='parse';assert p.locator('[data-action=profile-original]').is_enabled();p.screenshot(path=str(OUT/'parse-recovery-390.jpg'),type='jpeg',quality=82)
  with p.expect_download() as download:click(p,'profile-original')
  assert Path(download.value.path()).read_bytes()==broken.encode();assert_preserved(p,broken)
  click(p,'profile-retry');assert_preserved(p,broken);assert state(p)['writes']==0
  click(p,'close');assert p.locator('[data-action=profile-recovery]').is_visible();assert not p.locator('[data-action=continue]').count();assert not p.locator('[data-action=rest]').count()
  click(p,'settings');p.locator('[data-action=settings-page][data-id=sound]').click();p.locator('[data-setting=music]').uncheck();assert_preserved(p,broken);p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=screen]').click();p.locator('[data-setting=minimapVisible]').uncheck();assert_preserved(p,broken);click(p,'close');p.reload();p.wait_for_function('window.HonroApp&&document.documentElement.dataset.honroReady',timeout=90000);assert_preserved(p,broken)
  click(p,'import');click(p,'menu-cancel');assert_preserved(p,broken)
  choose_file(p,'{invalid import');assert_preserved(p,broken);assert '불러왔어' not in p.locator('#notice').inner_text()
  p.evaluate('fixtureQuota=true');before=state(p)['writes'];choose_file(p,good);assert_preserved(p,broken);assert state(p)['writes']==before+1;assert '저장하지 못했습니다' in p.locator('#notice').inner_text();assert '불러왔어' not in p.locator('#notice').inner_text()
  click(p,'newgame');click(p,'menu-cancel');assert_preserved(p,broken);click(p,'newgame');click(p,'menu-confirm');assert_preserved(p,broken)
  p.evaluate('fixtureQuota=false');choose_file(p,good);p.wait_for_function('!HonroApp.profileStore.locked&&HonroApp.screen==="title"');assert json.loads(p.evaluate('fixtureStored()'))['cleared']==json.loads(good)['cleared'];assert '기록을 불러왔어' in p.locator('#notice').inner_text();checks.append('parse exact byte download; retry/settings/close/reload/cancel/bad import preserve; quota import/newgame fail without success; valid UI import unlocks');print(checks[-1] if checks else 'fixture captured',flush=True);c.close()
  # A read failure cannot download invented bytes. A successful retry is a confirmed import.
  c,p=start(b,base,resume,read_error=True);assert state(p)['state']['reason']=='read';assert p.locator('[data-action=profile-original]').is_disabled();p.screenshot(path=str(OUT/'read-unavailable-390.jpg'),type='jpeg',quality=82);p.evaluate('fixtureReadError=false');click(p,'profile-retry');assert '다시 읽은 기록' in p.locator('#menu-title').inner_text();click(p,'menu-cancel');assert_preserved(p,resume);click(p,'profile-retry');click(p,'menu-confirm');p.wait_for_function('!HonroApp.profileStore.locked');assert p.locator('[data-action=continue]').count();checks.append('getItem throw disables export; successful retry cancel stays locked; explicit retry import confirmation unlocks');print(checks[-1] if checks else 'fixture captured',flush=True);c.close()
  for name,text,flags,reason in [('version',json.dumps(dict(json.loads(good),schema=99)),{},'version'),('format','null',{},'format'),('migration',good,{'migration':True},'migration')]:
   c,p=start(b,base,text,**flags);assert state(p)['state']['reason']==reason;assert_preserved(p,text);click(p,'close');assert not p.locator('[data-action=continue]').count();checks.append(name+' failure classified and locked');print(checks[-1] if checks else 'fixture captured',flush=True);c.close()
  # Explicitly confirmed fresh journey is the other permitted unlock path.
  c,p=start(b,base,broken);click(p,'newgame');click(p,'menu-cancel');assert_preserved(p,broken);click(p,'newgame');click(p,'menu-confirm');p.wait_for_function('!HonroApp.profileStore.locked');fresh=json.loads(p.evaluate('fixtureStored()'));assert fresh['cleared']=={} and fresh['lastStage']==1;p.screenshot(path=str(OUT/'confirmed-new-journey-390.jpg'),type='jpeg',quality=82);checks.append('new journey cancellation preserves; explicit confirmation writes and unlocks');print(checks[-1] if checks else 'fixture captured',flush=True);c.close()
  # Real Continue from a prepared suspended battle, current and representative old schema.
  for schema in (4,1):
   profile=json.loads(resume);profile['schema']=schema;c,p=start(b,base,json.dumps(profile));assert not state(p)['locked'];click(p,'continue');p.wait_for_function('HonroApp.engine?.b.honroStage===13',timeout=90000);assert state(p)['stage']==13;click(p,'pause');click(p,'settings');p.locator('[data-action=settings-page][data-id=sound]').click();p.locator('[data-setting=music]').uncheck();assert not json.loads(p.evaluate('fixtureStored()'))['settings']['music'];checks.append(f'schema{schema} normal Continue and real setting save');print(checks[-1] if checks else 'fixture captured',flush=True);c.close()
 # Current battle progress is valid even when the storage device is temporarily full.
 c,p=start(b,base,resume);click(p,'continue');p.wait_for_function('HonroApp.engine?.b.honroStage===13&&HonroApp.canInput()&&!HonroApp.turnNotice',timeout=90000);before=p.evaluate('fixtureStored()');uid=p.evaluate('HonroApp.engine.b.active');assert not p.evaluate('id=>HonroApp.engine.unit(id).acted',uid);p.evaluate('fixtureQuota=true');p.keyboard.press('f');p.wait_for_function('id=>HonroApp.engine.unit(id).acted',arg=uid,timeout=15000);assert not state(p)['locked'];assert p.evaluate('fixtureStored()')==before;click(p,'pause');click(p,'settings');p.locator('[data-action=settings-page][data-id=records]').click()
 with p.expect_download() as download:click(p,'export')
 exported=json.loads(Path(download.value.path()).read_text());assert next(u for u in exported['honroBattle']['units']if u['id']==uid)['acted'];assert p.evaluate('fixtureStored()')==before;assert not state(p)['locked'];p.evaluate('fixtureQuota=false');p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=sound]').click();p.locator('[data-setting=music]').uncheck();p.wait_for_function('old=>fixtureStored()!==old',arg=before);assert next(u for u in json.loads(p.evaluate('fixtureStored()'))['honroBattle']['units']if u['id']==uid)['acted'];checks.append('normal quota: actual defend progress stays in memory and exported battle; stored bytes unchanged; capacity recovery setting persist succeeds');print(checks[-1],flush=True);c.close()
 # Debug changes stay session-only; direct minimap save still writes only normal preferences.
 c,p=start(b,base,good);click(p,'settings');p.locator('[data-action=settings-page][data-id=records]').click();p.locator('[data-action=settings-page][data-id=debug]').click();p.locator('[data-setting=debugMode]').click();p.wait_for_function('HonroApp.debugMode&&HonroApp.screen==="rest"');
 for _ in range(30):
  if not p.locator('[data-action=dialogue-skip]').count():break
  click(p,'dialogue-skip')
 normal=p.evaluate('fixtureStored()');click(p,'settings');p.locator('[data-action=settings-page][data-id=sound]').click();p.locator('[data-setting=music]').uncheck();assert p.evaluate('fixtureStored()')==normal;p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=screen]').click();p.locator('[data-setting=minimapVisible]').uncheck();stored=json.loads(p.evaluate('fixtureStored()'));assert stored['settings']['music'] and not stored['settings']['minimapVisible'];p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=records]').click()
 with p.expect_download() as download:click(p,'export')
 assert json.loads(Path(download.value.path()).read_text())==stored;checks.append('debug UI stays independent; direct minimap write/export use normal profile only');p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=screen]').click();p.evaluate('fixtureQuota=true');before=p.evaluate('fixtureStored()');p.locator('[data-setting=minimapVisible]').check();assert p.evaluate('!HonroApp.profileStore.locked&&HonroApp.debugMode');assert p.evaluate('fixtureStored()')==before;p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=records]').click();assert not p.locator('[data-action=import]').count();assert not p.locator('[data-action=newgame]').count()
 with p.expect_download() as download:click(p,'export')
 assert json.loads(Path(download.value.path()).read_text())['settings']['minimapVisible'];assert p.evaluate('fixtureStored()')==before;p.evaluate('fixtureQuota=false');p.locator('[data-action=settings-back]').click();p.locator('[data-action=settings-page][data-id=screen]').click();p.locator('[data-setting=minimapVisible]').uncheck();assert not json.loads(p.evaluate('fixtureStored()'))['settings']['minimapVisible'];checks.append('debug direct quota stays unlocked; latest normal preferences export; ordinary replacement prohibition and later saving preserved');print(checks[-1],flush=True);c.close()
 if not quota_only:
  # Missing record retains the established new campaign flow.
  c,p=start(b,base);assert state(p)['state']['kind']=='absent';assert not state(p)['locked'];click(p,'rest');p.wait_for_function('HonroApp.screen!=="title"');assert p.evaluate('fixtureStored()') is not None;checks.append('absent record enters ordinary new journey and saves');print(checks[-1] if checks else 'fixture captured',flush=True);c.close()
 assert not errors,errors
 (OUT/'browser.json').write_text(json.dumps(dict(entry=json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],retainedPrefixEntry=(prior.get('retainedPrefixEntry')or prior['entry'])if prior else None,checks=checks,errors=errors,scope=__doc__+' Read/quota/migration are injected exceptions; resume fixture is a prepared suspended stage13, not normal campaign traversal. No user save, public site or physical device accessed.'),ensure_ascii=False,indent=2));b.close()
print(json.dumps(dict(checks=checks,errors=errors),ensure_ascii=False))
