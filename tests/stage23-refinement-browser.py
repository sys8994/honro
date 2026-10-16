"""Actual Chromium production renderer; isolated setup/camera inspection, not fullplay."""
import json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url();OUT=ROOT/'review/stage23';OUT.mkdir(parents=True,exist_ok=True)
BEFORE=json.loads(subprocess.check_output(['git','show','d7c1f84:shared/data/campaign.json'],cwd=ROOT))
SETUP=r'''()=>{const a=HonroApp;a.frame=()=>{};a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let i=1;i<23;i++)p.cleared[i]={visits:1,rounds:5};p.party=p.recruited=['archer','mage','knight','occultist'];p.settings.sound=false;p.settings.music=false;for(const c of p.party)p.heroes[c].xp=HONRO_CORE.xpAtLevel(17);a.profile=p;a.normalProfile=p;a.launch(23);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;document.getElementById('turn-banner').hidden=true;a.updateHUD(true);window.paint=(v)=>{Object.assign(a.scene,{x:v.x,y:v.y,scale:v.z,manual:true,time:2,storyTween:null,goalFocus:null,cinematic:null,focusId:null,speakerId:null,editorView:!!v.overview,skillPreview:!!v.overview});a.scene.render(a.engine,0,'',.5,false,0,true)};return a.engine.b.honroStage}'''
rows=[];errors=[]
with sync_playwright() as p:
 browser=launch(p)
 for width,height in [(1440,900),(390,844)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},is_mobile=width<600,has_touch=width<600);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for version in ['before','after']:
   page.goto(BASE+'/HONRO.html');page.wait_for_function('!!window.HonroApp && !!window.HonroScene')
   if version=='before':page.evaluate("""(p)=>{for(const a of p.library.filter(v=>v.id.startsWith('stage23:yard-'))){const i=HONRO_PROJECT.library.findIndex(v=>v.id===a.id);HONRO_PROJECT.library[i]=a;}const s=HONRO_PROJECT.stages[22];s.design.escortYardArt=p.stages[22].design.escortYardArt;s.terrains=s.terrains.filter(t=>!t.id.startsWith('sy-roof-'));delete s.design.escortYardRoofs;delete s.design.escortYardRoofProfiles;}""",BEFORE)
   assert page.evaluate(SETUP)==23
   views=[{'id':'entry-hud','x':900,'y':4230,'z':.65}, {'id':'overview','x':4900,'y':3770,'z':.147*width/1600,'overview':True}, {'id':'loading-yard','x':4210,'y':4250,'z':.56}, {'id':'weighing-court','x':2100,'y':4540,'z':.7}, {'id':'sorting-court','x':7040,'y':4490,'z':.7}, {'id':'upper-roofs','x':7390,'y':3100,'z':.6}]
   for v in views:
    page.evaluate('v=>paint(v)',v);page.wait_for_timeout(100);name=f'{version}-{width}-{v["id"]}.png';page.screenshot(path=str(OUT/name));rows.append({'file':name,'version':version,'viewport':[width,height],'view':v,'type':'actual Chromium Game production Scene camera inspection; entry profile fixture; no combat completion claim'})
   if version=='after':
    result=page.evaluate('''()=>{const a=HonroApp;a.export();const saved=JSON.stringify(a.profile.honroBattle);a.stopBattle();a.continue();return {exact:saved===JSON.stringify(a.engine.b),stage:a.engine.b.honroStage,units:a.engine.b.units.length}}''');assert result['exact'],result;rows.append({'viewport':width,'continue':result})
  ctx.close()
 browser.close()
(OUT/'browser.json').write_text(json.dumps({'errors':errors,'rows':rows},ensure_ascii=False,indent=2)+'\n');assert not errors,errors;print('PASS Chromium captures and exact Continue',len(rows))
