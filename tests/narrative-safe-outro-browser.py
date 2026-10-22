"""Current stage10 late-objective fixture through real extraction/outcome APIs.
No full six-round combat claim, no injected outro, one native JPG.
"""
import json,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/narrative-voice-v2-integration/safe-outro';OUT.mkdir(parents=True,exist_ok=True)
KEY='honro-first-act-profile-1';errors=[]
SETUP=r'''async ()=>{
 await HonroCampaignLoader.ensureStage(10);const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let n=1;n<10;n++)p.cleared[n]={visits:1,rounds:5};p.recruited=['archer','mage','knight'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;for(const c of p.recruited)p.heroes[c].xp=HONRO_CORE.xpAtLevel(16);a.profile=p;a.normalProfile=p;a.audio.configure(p.settings);a.launch(10);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;
 const e=a.engine,b=e.b,hs=b.honroState,boss=e.unit('boss');b.phase='aim';b.side=0;b.projectiles=[];delete b.volley;hs.receivers=2;hs.sodanBinding.phase='accepted';for(const t of HonroQuestTargets.records(b))if(t.id==='sodan-binding'){t.broken=true;t.hp=0;}const binding=e.unit('sodan-binding');if(binding){binding.dead=true;binding.hp=0;}
 a.actorBoundary=e.active.id;HonroMission.finale(a);while(a.dialogue)HonroStory.finish(a);a.actorBoundary=null;
 if(!hs.sodanCoop||boss.side!==2||!boss.honroAlly||boss.hp<=0)throw Error('normal channeler conversion failed '+JSON.stringify({sodanCoop:hs.sodanCoop,phase:hs.sodanBinding.phase,bindingReady:HonroNarrativeRevision.bindingReady(b),binding:HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding')?.broken,boss:{name:boss.name,side:boss.side,hp:boss.hp,ally:boss.honroAlly},events:hs.finaleWaves?.length}));
 Object.assign(hs,{coopHold:6,finaleDefenseTurns:6,finaleWave:6,finaleLastEnemyEnd:b.teamEnds[1]});b.round=14;b.phase='aim';b.side=0;b.projectiles=[];delete b.volley;hs.storyQueue=[];hs.deferredStory=[];hs.storyBanter=[];hs.banterLine=null;a.turnNotice=null;a.lastTurnNotice='14:player';
 window.safeOutroTrace=[];const trace=(name,fn)=>function(...args){const out=fn.apply(this,args);safeOutroTrace.push({name,phase:b.phase,withdrawal:hs.sodanWithdrawal?.phase,worldOutro:hs.sodanWithdrawal?.worldOutro,index:a.dialogue?.index,count:a.dialogue?.lines.length});return out;};
 for(const [obj,name]of [[a,'checkMission'],[a,'outcome'],[HonroSodanWithdrawal,'prepareWorldOutro']])obj[name]=trace(name,obj[name]);
 HonroSodanWithdrawal.tick(a);if(hs.sodanWithdrawal.phase!=='escape')throw Error('escape did not open');if(HonroObjectives.state(b,a.stage).complete)throw Error('six rounds alone won');
 const goal=HonroSodanWithdrawal.exit(b),scout=e.active;Object.assign(scout,{x:goal.x,y:goal.y,vx:0,vy:0,airborne:false,jumping:false});if(!e.grounded(scout))throw Error('scout not on real ground');
 const before={round:b.round,phase:b.phase,goal,party:b.units.filter(u=>!u.dead&&u.hp>0&&(u.side===0&&!u.summoned||u.id==='boss')).map(u=>({id:u.id,name:u.name,hp:u.hp,focus:u.focus,cooldowns:u.cooldowns})),enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length};
 HonroSodanWithdrawal.tick(a);if(hs.sodanWithdrawal.phase!=='withdrawing')throw Error('supported arrival failed');safeOutroTrace.unshift({name:'exit-arrival',phase:b.phase,withdrawal:hs.sodanWithdrawal.phase,worldOutro:hs.sodanWithdrawal.worldOutro});return before;
}'''
STATE=r'''()=>{const a=HonroApp,b=a.engine.b,raw=HonroObjectiveRevision.contentFor(b,a.stage).outro,lines=a.dialogue.lines,sodan=b.units.find(u=>u.id==='boss'),prior={dead:sodan.dead,hp:sodan.hp};let unavailableFiltered;try{Object.assign(sodan,{dead:true,hp:0});unavailableFiltered=raw.map((r,i)=>({index:i,who:r[0],text:r[1],rowId:r[2]?.rowId,allowed:HonroStory.allowed(a,r[0],r[2])})).filter(r=>!r.allowed);}finally{Object.assign(sodan,prior);}return {unavailableFiltered,phase:b.phase,round:b.round,withdrawal:b.honroState.sodanWithdrawal,quiet:HonroSodanWithdrawal.worldOutroDialogue(a),camera:a.scene.storyFrameReport,canvas:document.querySelector('#battlecanvas').getBoundingClientRect().toJSON(),panel:document.querySelector('.story-scene').getBoundingClientRect().toJSON(),blackBackdrop:!!document.querySelector('#sodan-safe-backdrop'),raw:raw.map(r=>r.slice(0,2)),effective:lines.map(r=>r.slice(0,2)),filtered:raw.filter(r=>!lines.some(q=>q[2]?.rowId===r[2]?.rowId)).map(r=>({who:r[0],text:r[1],rowId:r[2]?.rowId})),party:b.units.filter(u=>!u.dead&&u.hp>0&&(u.side===0&&!u.summoned||u.id==='boss')).map(u=>({id:u.id,name:u.name,x:u.x,y:u.y,hp:u.hp,focus:u.focus,cooldowns:u.cooldowns,ground:HonroMapEngine.surfaceY(b.honroWorldTerrain?.length?b.honroWorldTerrain:b.terrain,u.x,u.y,b.honroMapAnchors.exit.support)?.y,nearestEnemy:Math.min(...b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).map(v=>Math.hypot(v.x-u.x,v.y-u.y)))})),enemyCount:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length,report:b.honroReport.final,trace:window.safeOutroTrace,hud:[...document.querySelectorAll('.battle-head,.minimap-dock,.allied-roster,.battle-bottom')].map(n=>getComputedStyle(n).visibility)}}'''
COMBAT=r'''()=>JSON.stringify(Object.fromEntries(['units','round','side','time','projectiles','items','teamEnds'].map(k=>[k,HonroApp.engine.b[k]])))'''
with sync_playwright() as p:
 browser=launch(p);page=browser.new_page(viewport={'width':390,'height':844},has_touch=True);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('.title-actions button').first.click();before=page.evaluate(SETUP)
 page.wait_for_function('HonroApp.engine.b.phase==="won" && HonroApp.engine.b.honroState.sodanWithdrawal.worldOutro===2 && !!HonroApp.dialogue');page.wait_for_timeout(800);state=page.evaluate(STATE)
 approved=json.loads((ROOT/'game/docs/story/voice-v2-editorial/drafts/act1-scenes.json').read_text())['scenes']['10.outro'];expected=[r[:2] for r in approved]
 assert [r['index'] for r in state['unavailableFiltered']]==[0,2,5,7,13]
 assert state['effective']==expected and len(state['effective'])==16 and not state['filtered'],state
 assert state['phase']=='won' and state['withdrawal']['phase']=='safe' and state['withdrawal']['worldOutro']==2 and state['quiet'] and not state['blackBackdrop'],state
 assert state['camera']['id']=='10:safe-exit' and len(state['party'])==4 and state['enemyCount']==before['enemies'],state
 assert all(v=='hidden' for v in state['hud']),state['hud']
 for u in state['party']:
  assert abs(u['y']-u['ground'])<1 and u['nearestEnemy']>=650,u
  prior=next(v for v in before['party'] if v['id']==u['id']);assert u['hp']==prior['hp'] and u.get('focus')==prior.get('focus') and u.get('cooldowns')==prior.get('cooldowns'),u
  cam=state['camera']['camera'];rect=state['camera']['rect'];cv=state['canvas'];x=(u['x']-cam['x'])*cam['scale']+cv['width']/2;y=(u['y']-cam['y'])*cam['scale']+cv['height']/2
  assert rect['x']-1<=x<=rect['x']+rect['w']+1 and rect['y']-1<=y<=rect['y']+rect['h']+1,(u,x,y,rect)
 page.screenshot(path=str(OUT/'stage10-safe-outro-390x844.jpg'),type='jpeg',quality=85)
 frozen=page.evaluate(COMBAT);shown=[]
 for i,row in enumerate(expected):
  page.wait_for_function('(i)=>HonroApp.dialogue.index===i',arg=i);shown.append([page.locator('#story-speaker').inner_text(),page.locator('#story-line').inner_text()]);assert shown[-1][1]==row[1]
  assert page.evaluate('HonroSodanWithdrawal.worldOutroDialogue(HonroApp)')
  if i<len(expected)-1:page.locator('[data-action="dialogue-next"]').click()
 assert frozen==page.evaluate(COMBAT)
 saved=page.evaluate('JSON.parse(localStorage.getItem("'+KEY+'"))');saved_cursor=saved['honroBattle']['honroStory']['index'];assert saved_cursor==15
 page.reload();page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.continue()');page.wait_for_function('!!HonroApp.dialogue');page.wait_for_timeout(650);resumed=page.evaluate(STATE)
 assert page.evaluate('HonroApp.dialogue.index')==15 and resumed['effective']==expected and resumed['quiet'] and resumed['party']==state['party']
 assert frozen==page.evaluate(COMBAT),'Continue must preserve terminal combat'
 page.locator('[data-action="dialogue-skip"]').click();page.wait_for_selector('#act-ending');ending=page.evaluate('({screen:HonroApp.screen,pending:HonroApp.profile.honroActEnding,visits:HonroApp.profile.cleared[10].visits,report:HonroApp.engine.b.honroReport.final,profile:JSON.stringify(HonroApp.profile)})');assert ending['visits']==1 and ending['report']==state['report']
 page.evaluate('HonroApp.outcome();HonroApp.outcome()');assert page.evaluate('JSON.stringify(HonroApp.profile)')==ending['profile']
 for _ in range(len(json.loads((ROOT/'shared/data/narrative-current.json').read_text())['actEndings']['10']['lines'])+1):page.wait_for_timeout(380);page.keyboard.press('Enter')
 page.wait_for_function('HonroApp.screen==="rest"');final=page.evaluate('({screen:HonroApp.screen,ending:HonroApp.profile.honroActEnding||null,visits:HonroApp.profile.cleared[10].visits,seen:HonroApp.profile.seen["act-ending-v1:10"],battle:HonroApp.profile.honroBattle,reportNotice:HonroApp.profile.honroReportNotice,report:HonroApp.profile.honroClearReports?.[10]})')
 assert final['ending'] is None and final['visits']==1 and final['seen'] and final['battle'] is None and final['reportNotice']['stage']==10 and final['report']==state['report'],final
 page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp)');page.locator('.rest-report[data-id="10"]').click();page.wait_for_selector('#clear-report-title');assert page.locator('#clear-report-title').inner_text()=='상세 보고서'
 final['reportUIOpened']=page.evaluate('HonroApp.modalKind==="clear-report" && HonroApp.profile.cleared[10].visits===1');assert final['reportUIOpened']
 assert not errors,errors
 browser.close()
source={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'shared/data/narrative-current.json',ROOT/'shared/runtime/sodan-withdrawal.js',ROOT/'shared/runtime/story-framing.js',ROOT/'shared/runtime/story.js',ROOT/'shared/runtime/main.js']}
(OUT/'checks.json').write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'sourceHashes':source,'input':'Controlled late-objective fixture; normal channeler conversion, six hold rounds marked complete, living party/Sodan, grounded scout arrival. No direct outro injection.','before':before,'outro':state,'shown':shown,'Continue':{'cursor':saved_cursor,'phase':resumed['phase'],'worldOutro':resumed['withdrawal']['worldOutro'],'all16Preserved':True,'frozenCombat':True},'ending':{k:v for k,v in ending.items() if k!='profile'},'final':final,'errors':errors,'limits':['Six hold rounds were fixture-completed, not replayed in combat.','Native Chromium 390x844; no physical mobile testing.']},ensure_ascii=False,indent=2)+'\n')
print('PASS normal supported exit -> withdrawal -> won/worldOutro2; four grounded survivors, safe camera, all16 unfiltered current lines, Continue cursor15, skip -> ending -> rest/report; one native JPG')
