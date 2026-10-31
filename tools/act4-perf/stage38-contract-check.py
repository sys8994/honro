"""Actual UI wheel, drag and movement with autosave; declared synthetic entry."""
import json,math,os,sys,statistics,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];tag=sys.argv[1];out=root/'_local/act4-perf';out.mkdir(parents=True,exist_ok=True);f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,38)};f.update(lastStage=38,mapNode=38);f.pop('honroBattle',None)
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1);p=context.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(f,ensure_ascii=False))+');');p.goto(os.environ.get('HONRO_QA_BASE','http://127.0.0.1:8771')+'/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000);p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(38);HonroApp.launch(38)}''');p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=90000)
 for _ in range(30):
  if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter');p.wait_for_timeout(250)
  else:
   p.wait_for_timeout(500)
   if not p.evaluate('!!HonroApp.dialogue'):break
 p.evaluate("HonroApp.frame=()=>{};HonroApp.scene.storyTween=null;HonroApp.scene.cinematic=null;HonroApp.scene.manual=true")
 p.wait_for_timeout(100)
 data=p.evaluate("""()=>{const e=HonroApp.engine,b=e.b,u=e.active,C=HONRO_CORE,original=window.structuredClone,cast=HonroClearReport.cast,results=[];let count,casts;window.structuredClone=function(x,...args){if(x===b)count.full++;else if(x?.units===b.units)count.narrow++;return original.call(this,x,...args)};HonroClearReport.cast=function(...args){casts++;return cast.apply(this,args)};const checkpoint=original(b);for(const name of ['official','custom','workshop','other-skill','changed-skill-mode','other-mode','other-stage','shared-placement','shared-art','shared-art-child','battle-cycle','accessor-art','invalid-art']){delete b.honroCustom;delete b.honroMapOrigin;delete b.qaAlias;Object.assign(b,original(checkpoint));e.invalidateTerrainCollisionIndex();const actor=e.active;actor.cls='archer';actor.loadout=['A01'];actor.ranks.A01=3;let id='A01',getters=0;const oldMode=C.SKILLS.A01.mode;if(name==='changed-skill-mode')C.SKILLS.A01.mode='qaUnknown';if(name==='custom')b.honroCustom=true;if(name==='workshop')b.honroMapOrigin='workshop';if(name==='other-skill'){id='A02';actor.loadout=[id]}if(name==='other-mode')b.mode='practice';if(name==='other-stage')b.honroStage=37;if(name==='shared-placement')b.qaAlias=b.honroLandmarks.find(l=>l.asset?.vector);if(name==='shared-art')b.qaAlias=b.honroLandmarks.find(l=>l.asset?.vector).asset.vector;if(name==='shared-art-child')b.qaAlias=b.honroLandmarks.find(l=>l.asset?.vector).asset.vector.root;if(name==='battle-cycle')b.qaAlias=b;if(name==='accessor-art'){const v=b.honroLandmarks.find(l=>l.asset?.vector).asset.vector;Object.defineProperty(v,'qaGetter',{enumerable:true,get(){getters++;return 7}})}if(name==='invalid-art')b.honroLandmarks.find(l=>l.asset?.vector).asset.vector.qaBad=()=>{};count={full:0,narrow:0};casts=0;let error=null;try{e.predict(actor,C.SKILLS[id],44,.6,undefined,true,false)}catch(ex){error=ex.name}results.push({name,...count,casts,getters,error});C.SKILLS.A01.mode=oldMode}window.structuredClone=original;HonroClearReport.cast=cast;return results;}""")
 assert data[0]['narrow']==1 and data[0]['full']==0 and data[0]['casts']==1, data
 for row in data[1:]:
  assert row['full']==1 and row['narrow']==0, row
  if row['name']=='invalid-art':assert row['error']=='DataCloneError' and row['casts']==0,row
  else:
   assert row['error'] is None and row['casts']==1,row
   if row['name']=='accessor-art':assert row['getters']==1,row
 (out/f'stage38-contract-{tag}.json').write_text(json.dumps(data,sort_keys=True));print('contract',tag,json.dumps(data),flush=True);context.close();browser.close()
