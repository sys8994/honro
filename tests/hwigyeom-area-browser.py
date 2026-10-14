"""Shared fixtures plus real fire-button/RAF AoE in Game and Workshop Playtest."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT=ROOT/'_local/reports/hwigyeom-area';OUT.mkdir(parents=True,exist_ok=True)
fixture=(ROOT/'tests/hwigyeom-area-fixture.mjs').read_text().replace('export function swordAreaSuite','function swordAreaSuite')
rows=[];errors=[]
def suite(page,owner,label):
    page.evaluate(fixture+'\nwindow.swordAreaSuite=swordAreaSuite;')
    checks=page.evaluate('swordAreaSuite(HONRO_CORE)')
    page.evaluate("""()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();a.trainingClass='knight';a.trainingSkill='S03';a.trainingRanks.S03=1;a.trainingPassives={};a.launch(1,true,'S03');a.dialogue=null;a.turnNotice=null;
    const e=a.engine,b=e.b,u=e.active;Object.assign(b,{width:4000,height:2200,practiceCombat:false,terrain:[{id:'floor',x:0,y:1900,w:4000,h:300,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],wind:0,honroLandmarks:[],honroSurfaceZones:[],honroMarkers:[]});Object.assign(u,{x:1000,y:1900,spawnX:1000,spawnY:1900,attack:1,focus:1000,maxFocus:1000,angle:0,acted:false,vx:0,vy:0,airborne:false,jumping:false});b.units=[u];
    for(const dx of [45,80,115,420,-160])b.units.push(C.makeUnit('archer',1,u.x+dx,u.y,{id:'area-'+dx,role:'dummy',fixed:true,hp:10000,maxHp:10000,armor:0,shield:0,awake:true,loadout:['LA01']}));e.random=()=>.99;b.sceneVersion++;a.selected='S03';a.selectedByUnit[u.id]='S03';Object.assign(a.scene,{manual:true,x:1100,y:1750,scale:.8,turnTarget:undefined});a.updateHUD(true);window.areaRound=b.round;}""")
    box=page.locator('#fire').bounding_box();owner.mouse.click(box['x']+box['width']/2,box['y']+box['height']/2,delay=130)
    page.wait_for_function("HonroApp.engine.b.units.filter(t=>t.id.startsWith('area-')&&t.hp<10000).length===3",timeout=15000)
    state=page.evaluate("(()=>{const a=HonroApp,b=a.engine.b;return{hp:b.units.filter(t=>t.id.startsWith('area-')).map(t=>({id:t.id,hp:t.hp})),shots:b.shots,error:a.lastError||null};})()")
    assert all(v['hp']<10000 for v in state['hp'][:3]) and all(v['hp']==10000 for v in state['hp'][3:]),state
    assert state['shots']==1 and not state['error'],state
    owner.screenshot(path=str(OUT/(label+'.png')))
    rows.append({'host':label,'checks':checks,'liveFire':state});print('PASS',label,len(checks),'fixtures and real fire-button three-target AoE',flush=True)
with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');suite(page,page,'Game');page.close()
    page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());page.wait_for_function('window.HonroWorkshopAPI');before=page.evaluate('HonroWorkshopAPI.exportProject()');page.click('[data-tab=play]');page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');suite(page.frames[1],page,'Workshop');page.click('#stopPlay');assert before==page.evaluate('HonroWorkshopAPI.exportProject()');browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'rows':rows,'errors':errors},ensure_ascii=False,indent=2)+'\n')
