"""Default candidate bundle smoke, local Chromium, not public/full-play proof."""
import json,os,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/production-smoke';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8771')
FLAGS="""()=>({phase:HONRO_ACT23_V4_PHASE_A,ch11:HONRO_ACT23_V4_PHASE_B_CH11,stages:HONRO_ACT23_V4_PHASE_B_STAGES,act3:Array.from({length:10},(_,i)=>globalThis['HONRO_ACT23_V4_PHASE_B_CH'+(21+i)]),count:HONRO_ACT23_V4_REVIEWED.rows.length+Object.values(HONRO_ACT23_V4_REVIEWED_CHAPTERS).reduce((n,d)=>n+d.rows.length,0)+Array.from({length:10},(_,i)=>globalThis['HONRO_ACT23_V4_REVIEWED_CH'+(21+i)].rows.length).reduce((n,v)=>n+v,0)+HONRO_ACT23_V4_REVIEWED_COMMON.rows.length})"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);game=browser.new_page(viewport={'width':1280,'height':800});editor=browser.new_page(viewport={'width':1280,'height':800});errors=[]
 for page in [game,editor]:page.on('pageerror',lambda e:errors.append(str(e)))
 game.goto(BASE+'/HONRO.html');game.wait_for_function('!!globalThis.HonroApp');flags=game.evaluate(FLAGS);assert flags['phase'] and flags['ch11'] and flags['stages']==list(range(12,21)) and all(flags['act3']) and flags['count']==676,flags
 game.evaluate("""()=>{const a=HonroApp;a.reviewPaused=true;a.profile=HonroProfileStore.fresh();a.launch(1);for(let i=0;i<20&&a.dialogue;i++)HonroStory.finish(a);a.turnNotice=null;}""")
 assert game.evaluate('HonroApp.engine.b.honroStage===1&&!HonroAct23V4.active(HonroApp.engine.b)&&!HonroApp.engine.b.honroState.reviewedBarks');assert game.locator('canvas').first.is_visible()
 editor.goto(BASE+'/HONRO_WORKSHOP.html');editor.wait_for_function('!!globalThis.HonroWorkshopAPI?.getRuntime()?.scene');workshop=editor.evaluate(FLAGS);assert workshop==flags
 assert editor.locator('canvas').first.is_visible();game.screenshot(path=str(OUT/'game-stage1.png'));editor.screenshot(path=str(OUT/'workshop.png'))
 assert not errors,errors;(OUT/'summary.json').write_text(json.dumps({'flags':flags,'workshopFlags':workshop,'stage1UnchangedDelivery':True,'canvasSurfaces':True,'pageErrors':errors,'limits':'Local built artifacts, fresh stage1 and Workshop initialization only. No public deployment or full campaign claim.'},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS default Game/Workshop all reviewed676 payload and20 chapter flags; original stage1 delivery/no empty bark state; Canvas/pageerror0')
