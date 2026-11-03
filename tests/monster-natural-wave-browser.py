"""Same-run genuine late-wave checkpoint visibility, normal camera inputs, HP+shield evidence."""
import ast,json,os,pathlib
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/stage8-crow-visibility';OUT.mkdir(parents=True,exist_ok=True);BASE=os.environ.get('HONRO_MONSTER_BASE_URL','http://127.0.0.1:8871');CONTROLLER=ROOT/'_local/reports/monster-natural/controller.js'
tree=ast.parse((ROOT/'tests/monster-natural-browser.py').read_text());SCHEDULER=next(n.value.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SCHEDULER' for t in n.targets))
resume=json.loads((OUT/'round-17.json').read_text());manifest=json.loads((ROOT/'_local/reports/monster-natural/controller-manifest.json').read_text());request=json.loads((ROOT/os.environ.get('HONRO_NATURAL_REQUEST','tools/monster-a1-qa/request.json')).read_text());meta={**manifest,'stage':8,'checkpointSource':'6b00abe2308275410c2947412c1cd0c7d62b733d','runtimeSha256':request['expected']['runtimeSha256'],'scope':'Genuine same-run R17 continuation, not independent full-route completion'}
PAINT='''()=>{const a=HonroApp;a.updateHUD(true);a.renderBattleFrame(a.engine,0,0,!!a.dialogue||!!HonroStory.turnPaused(a,performance.now())||a.modal.classList.contains('open')||!!a.done);}'''
READ='''()=>{const a=HonroApp,b=a.engine.b,s=a.scene,cv=s.canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect(),mini=document.querySelector('#minimap').getBoundingClientRect(),state=HonroObjectives.state(b,a.stage),marker=state.targets.find(t=>t.id==='stage8-settled-crows-warning'),entry=marker||b.honroStage8BierSpec.entries['stage8-settled-crows'];return {round:b.round,side:b.side,phase:b.phase,active:b.active,eventText:a.eventText,objectiveText:document.querySelector('#objective-text')?.textContent,missionTargets:state.targets,marker:marker||null,warning:b.honroState.stage8Bier.warnings['stage8-settled-crows'],entry:b.honroState.stage8Bier.entries['stage8-settled-crows'],canInput:a.canInput(),camera:{x:s.x,y:s.y,scale:s.scale,manual:s.manual},viewport:{width:innerWidth,height:innerHeight,hudTop:hud?.top,mini:{x:mini.x,y:mini.y,w:mini.width,h:mini.height}},pan:{x:Math.max(1,Math.min(mini.width-1,entry.x/b.width*mini.width)),y:Math.max(1,Math.min(mini.height-1,entry.y/b.height*mini.height))},actors:b.units.filter(u=>u.id===b.active||u.honroSpawnSource==='stage8-settled-crows').map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,shield:u.shield,left:(u.x-u.r-s.x)*s.scale+cv.width/2+cv.left,right:(u.x+u.r-s.x)*s.scale+cv.width/2+cv.left,head:(u.y-u.h-s.y)*s.scale+cv.height/2+cv.top,feet:(u.y-s.y)*s.scale+cv.height/2+cv.top})),damage:qa.damage};}'''
rows=[]
def open_saved(browser,profile,checkpoint,viewport,mobile,dest):
 context=browser.new_context(viewport=viewport,is_mobile=mobile,has_touch=mobile,accept_downloads=True);context.add_init_script(SCHEDULER);p=context.new_page();p.set_default_timeout(45000)
 def evidence(_source,name,data):
  if not name.endswith('.png'):(dest/pathlib.Path(name).name).write_text(data)
 p.expose_binding('qaEvidence',evidence);p.goto(BASE+'/HONRO.html');p.wait_for_function('!!window.HonroApp');p.evaluate('()=>{qaStopScheduling();}');p.add_script_tag(path=str(CONTROLLER))
 p.locator('#file-import').set_input_files(str(profile));p.wait_for_function('(id)=>HonroApp.screen==="title"&&HonroApp.profile.honroBattle?.session===id',arg=checkpoint['profile']['honroBattle']['session'],polling=50)
 button=p.locator('[data-action="continue"]').first;button.tap() if mobile else button.click();p.wait_for_function('!!HonroApp.engine',polling=50)
 assert p.evaluate('(b)=>canonical(HonroApp.engine.b)===canonical(b)',checkpoint['profile']['honroBattle']),'Import changed genuine checkpoint'
 p.evaluate('q=>{qaAttach({profile:q.checkpoint.profile,resume:q.checkpoint},q.meta);}',{'checkpoint':checkpoint,'meta':meta});p.evaluate(PAINT);return context,p
with sync_playwright() as pw:
 browser=launch(pw);prep=OUT/'prepare';prep.mkdir(exist_ok=True);context,p=open_saved(browser,OUT/'round-17-profile.json',resume,{'width':1440,'height':900},False,prep)
 try:
  p.evaluate('async()=>{window.qaStopAtCrowWarning=true;await qaRun8();if(!window.qaWarningCheckpoint)throw Error("No genuine offered crow warning before next policy action");}')
  checkpoint=p.evaluate('()=>qaWarningCheckpoint');warning_path=OUT/'genuine-warning-profile.json';warning_path.write_text(json.dumps(checkpoint['profile'],ensure_ascii=False));(OUT/'genuine-warning-controller.json').write_text(json.dumps(checkpoint,ensure_ascii=False));p.evaluate(PAINT);p.screenshot(path=str(OUT/'genuine-warning-origin.png'),timeout=15000)
 finally:context.close()
 for name,viewport,mobile in [('desktop',{'width':1440,'height':900},False),('portrait',{'width':390,'height':844},True),('landscape',{'width':844,'height':390},True)]:
  dest=OUT/name;dest.mkdir(exist_ok=True);context,p=open_saved(browser,warning_path,checkpoint,viewport,mobile,dest);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  try:
   p.evaluate('()=>{window.qaVisibilityOps=createPlayerOperations({app:HonroApp,g,C});qaVisibilityOps.frame();if(!qaVisibilityOps.ready(3000))throw Error("Warning input never became ready");}');p.evaluate(PAINT);before=p.evaluate('()=>canonical(HonroApp.engine.b)');initial=p.evaluate(READ);p.screenshot(path=str(dest/'warning-default.png'),timeout=15000)
   assert initial['canInput'] and initial['warning']['status']=='announced' and not initial['warning'].get('opportunity'),'Warning response already consumed'
   assert initial['marker'] and '중앙 마당 위 까마귀 3' in initial['objectiveText'],'Persistent pending location notice missing after Continue'
   assert any(t['id']=='boss' for t in initial['missionTargets']),'Existing boss goal removed'
   # A directed minimap click/tap follows the actual rendered pending marker; pixels still require review.
   target=initial['pan'];button=p.locator('#minimap');button.tap(position=target) if mobile else button.click(position=target);p.evaluate(PAINT);p.screenshot(path=str(dest/'warning-player-pan.png'),timeout=15000);panned=p.evaluate(READ);assert p.evaluate('()=>canonical(HonroApp.engine.b)')==before,'Camera pan consumed response or changed battle'
   # Resume the unchanged policy for precisely this real knight command, stopping observationally at birth.
   p.evaluate('async()=>{qa.haltAtCrowBirth=true;try{await qaRun8();}catch(e){if(e.message!=="QA_CROW_BIRTH_BOUNDARY")throw e;}if(!qa.haltedAtCrowBirth)throw Error("Crow birth not reached");}')
   p.evaluate(PAINT);admitted=p.evaluate(READ);assert admitted['marker'] is None,'Pending marker survived actual admission';assert '마당 위 까마귀 3' not in admitted['objectiveText'],'Pending HUD survived admission';p.screenshot(path=str(dest/'admission-immediate.png'),timeout=15000)
   p.evaluate('()=>{window.qaVisibilityOps=createPlayerOperations({app:HonroApp,g,C});for(let i=0;i<90;i++)qaVisibilityOps.frame();}');p.evaluate(PAINT);after90=p.evaluate(READ);p.screenshot(path=str(dest/'admission-after90frames.png'),timeout=15000)
   p.evaluate('()=>{let n=0;while(n++<6000&&(HonroApp.engine.b.side!==0||HonroApp.engine.b.round<18||!HonroApp.canInput()))qaVisibilityOps.frame();if(n>=6000)throw Error("Enemy boundary did not finish");}');p.evaluate(PAINT);end=p.evaluate(READ);p.screenshot(path=str(dest/'enemy-turn-complete.png'),timeout=15000)
   rows.append({'viewport':name,'default':initial,'playerPan':panned,'admission':admitted,'after90':after90,'end':end,'cameraPanBattleExact':True,'pageErrors':errors});assert not errors,errors;(dest/'receipt.json').write_text(json.dumps(rows[-1],ensure_ascii=False,indent=2))
  except Exception as error:
   (dest/'failure.json').write_text(json.dumps({'error':str(error),'state':p.evaluate(READ)},ensure_ascii=False));p.screenshot(path=str(dest/'failure.png'),timeout=15000);raise
  finally:context.close()
 browser.close()
(OUT/'summary.json').write_text(json.dumps({'scope':meta['scope'],'unpublishedPreviewSource':meta['candidate'],'checkpointSource':meta['checkpointSource'],'rows':rows,'limits':['Directed minimap pan follows derived marker coordinates; visual readability requires pixel review.','Admission capture pauses deterministic test scheduling only; not an in-game time stop.','Programmatic exposed App policy and native pointer minimap/Continue; not manual pointer combat.','Final integrated replay remains required.']},ensure_ascii=False,indent=2));print('PASS bounded genuine checkpoint visibility observations; pixels require review')
