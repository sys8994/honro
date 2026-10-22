"""Public UI entry: one approved arrival, four rescue lines; old round20 Continue.
Unlock/prerequisite fixtures only; not a normal eleven-chapter playthrough.
"""
import json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/narrative-final-current';OUT.mkdir(parents=True,exist_ok=True)
D=ROOT/'game/docs/story/voice-v2-editorial/drafts';arrival=json.loads((D/'arrivals-endings.json').read_text())['arrivals']['11'];entry=json.loads((D/'act2-scenes.json').read_text())['scenes']['11.story'];checks=[];errors=[]
def tap(page,action):
 page.wait_for_function('performance.now()>=(HonroApp.journeyInputAfter||0)');page.wait_for_timeout(220)
 e=page.locator('[data-action="'+action+'"]');e.wait_for();r=e.bounding_box();assert r and r['width']>=32 and r['height']>=32 and r['x']>=0 and r['y']+r['height']<=844,(action,r)
 assert e.evaluate('(e)=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest("button")===e}')
 page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2)
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True);p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady')
 p.evaluate('''()=>{const a=HonroApp,p=HONRO_TOOLS.fresh();for(let n=1;n<=10;n++)p.cleared[n]={visits:1,rounds:10};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(const cls of p.recruited)p.heroes[cls].xp=HONRO_CORE.xpAtLevel(16);p.settings.sound=false;p.settings.music=false;p.seen['map-story-v7-10']=true;p.seen['act-ending-v1:10']=true;a.profile=p;a.normalProfile=p;a.persist();a.showTitle();}''')
 p.locator('.title-actions button').first.click();p.wait_for_function('HonroApp.screen==="rest"&&!!HonroApp.dialogue')
 rows=p.evaluate('HonroApp.dialogue.lines');assert [r[:2] for r in rows]==[r[:2] for r in arrival] and len(rows)==1,rows
 assert p.locator('#story-line').inner_text()==arrival[0][1];p.wait_for_timeout(650);p.screenshot(path=str(OUT/'stage11-approved-arrival-390x844.jpg'),type='jpeg',quality=85);tap(p,'dialogue-next');p.wait_for_function('!HonroApp.dialogue');p.locator('[data-action="journey-enter"][data-id="11"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===11&&!!HonroApp.dialogue')
 actual=p.evaluate('HonroApp.dialogue.lines');story=[r for r in actual if r[0]!='안내'];guides=[r for r in actual if r[0]=='안내'];assert [r[:2] for r in story]==[r[:2] for r in entry] and len(story)==4,actual;assert len(guides)==1 and guides[0][1]=='주민 주변의 적 1명을 처치하세요'
 ids=p.evaluate('HonroNarrativeCatalogue.data.stages[11].story.map(r=>r[2].rowId)');assert [r[2]['rowId'] for r in story]==ids
 p.wait_for_timeout(900);p.screenshot(path=str(OUT/'stage11-rescue-entry-390x844.jpg'),type='jpeg',quality=85)
 shown=[]
 for i,row in enumerate(entry):
  p.wait_for_function('(i)=>HonroApp.dialogue?.index===i',arg=i);shown.append(p.locator('#story-line').inner_text());assert shown[-1]==row[1]
  tap(p,'dialogue-next')
 if guides:tap(p,'dialogue-next')
 p.wait_for_function('!HonroApp.dialogue');goal=p.locator('#objective-text').inner_text();state=p.evaluate('''()=>({revision:HonroApp.engine.b.honroStage11QuestRevision,steps:HonroAct2.steps(HonroApp.engine.b).map(s=>({id:s.id,kind:s.kind})),current:HonroAct2.current(HonroApp.engine.b).id,seen:HonroApp.profile.seen['rest-interlude-v1-11'],frame:HonroApp.scene.storyFrameReport})''');assert state['revision']==1 and state['current']=='resident' and state['seen'];assert [s['id'] for s in state['steps']]==['resident','trace']
 checks.append({'case':'title Continue -> rest arrival1 -> real stage entry4','arrival':rows,'entry':actual,'existingTechnicalGuide':guides,'shown':shown,'goal':goal,'state':state});ctx.close()
 saved=json.loads((ROOT/'_local/reports/stage11-quest-simplification/compat-dialogue-0.json').read_text());ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True);p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',saved);p.reload();p.wait_for_function('document.documentElement.dataset.honroReady');p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b.round===20&&HonroApp.dialogue?.index===0')
 assert p.evaluate('HonroApp.dialogue.lines')==saved['honroBattle']['honroStory']['lines'];assert p.evaluate('HonroApp.engine.b.honroStage11QuestRevision')==1
 before=p.evaluate('JSON.stringify(HonroApp.engine.b.units.map(u=>({id:u.id,hp:u.hp,focus:u.focus,x:u.x,y:u.y})))');p.evaluate('HonroAct2.tick(HonroApp,0)');assert p.evaluate('JSON.stringify(HonroApp.engine.b.units.map(u=>({id:u.id,hp:u.hp,focus:u.focus,x:u.x,y:u.y})))')==before
 p.wait_for_timeout(500);p.screenshot(path=str(OUT/'stage11-round20-Continue-390x844.jpg'),type='jpeg',quality=85);tap(p,'dialogue-next');p.wait_for_function('HonroApp.dialogue?.index===1');tap(p,'dialogue-skip')
 p.wait_for_function('HonroApp.engine.b.phase==="won"',timeout=10000)
 for _ in range(24):
  if p.evaluate('!!HonroApp.profile.cleared[11]'):break
  if p.evaluate('!!HonroApp.dialogue'):p.locator('[data-action="dialogue-next"]').click()
  else:p.evaluate('HonroApp.outcome()')
  p.wait_for_timeout(150)
 result=p.evaluate('''()=>({phase:HonroApp.engine.b.phase,round:HonroApp.engine.b.round,visits:HonroApp.profile.cleared[11]?.visits,trace:HonroAct2.memory(HonroApp.engine.b).checkpoints.filter(c=>c.id==='trace').length})''');assert result=={'phase':'won','round':20,'visits':1,'trace':1},result
 checks.append({'case':'old round20 resident cursor/text Continue, touch next/skip, natural auto-trace/win','result':result});ctx.close();browser.close()
assert not errors,errors
(OUT/'stage11-ui.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'checks':checks,'errors':errors,'limits':__doc__},ensure_ascii=False,indent=2)+'\n')
print('PASS public Continue/rest arrival1 + stage rescue4 with row IDs; mobile touch; old round20 saved dialogue -> natural trace/outcome once')
