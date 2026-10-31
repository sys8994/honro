"""Actual resumed UI comparison: passive wait versus normal defense turns.
No battle/receipt/position changes are injected; inputs only use Continue, F and Enter.
"""
import sys,json,threading,functools,hashlib,time
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
source=root/'_local/reports/stage39-screen-route-final2/snapshots/round-10-storage.json';raw=source.read_bytes();storage=json.loads(raw);value=next(v['value'] for o in storage['origins'] for v in o['localStorage'] if v['name']=='honro-first-act-profile-1');original=json.loads(value);b=original['honroBattle'];q=b['honroAct4PreviewState'];assert b['honroStage']==39 and b['round']==10 and q['netOpen'] and q['exitStable'] and not q.get('rescued')
projectRaw=(root/'_local/inputs/stage39-presentation/stage39.json').read_bytes();project=json.loads(projectRaw);assert hashlib.sha256(projectRaw).hexdigest()=='0bb8dd43bf33af941c88800c4e7e13bbf2c7d3dd924444c035c997daad8f5dcb'
out=root/'_local/reports/stage39-lineproof';out.mkdir(parents=True,exist_ok=False)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}'
state="""()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState||{},p=e.active;return{round:b.round,side:b.side,phase:b.phase,shot:b.shot,active:p?.id,canInput:!!a.canInput(),retreat:!!p?.retreat,screen:a.screen,dialogue:!!a.dialogue,modalOpen:a.modal.classList.contains('open'),modalKind:a.modalKind??null,storyTurnPaused:!!HonroStory.turnPaused(a),hidden:document.hidden,visibility:document.visibilityState,done:!!a.done,clock:q.clock,netOpen:q.netOpen,exitStable:q.exitStable,rescued:q.rescued,failure:q.failure,tide:q.tide,escort:q.escort,artillery:q.artillery,pilots:b.units.filter(u=>u.honroPilotMidboss).map(u=>({id:u.id,combat:u.honroPilotCombat})),residents:b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,grounded:e.grounded(u)})),aliveFoes:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).map(u=>u.id)}}"""
result={'scope':'Actual saved round-10 branch after normal release/stabilization. Two new headless Chromium contexts, same game-produced localStorage value. Idle receives no inputs after Continue; turn branch uses normal F/Enter, no attacks. No normal-campaign prior-play claim.','sourceStorageSha256':hashlib.sha256(raw).hexdigest(),'sourceValueSha256':hashlib.sha256(value.encode()).hexdigest(),'sourceRun':b['session'],'candidateSha256':hashlib.sha256(projectRaw).hexdigest(),'manifestSha256':hashlib.sha256((root/'web/manifest.json').read_bytes()).hexdigest(),'observerSha256':hashlib.sha256((root/'tools/qa-stage39-observer/observer-v5.js').read_bytes()).hexdigest(),'arms':{}}
with sync_playwright() as pw:
 browser=launch(pw)
 for arm in ('turns',):
  ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",value);page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
  page.evaluate("""async project=>{await HonroCampaignLoader.ensureStage(39);const all=HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat(project.stages);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp'}""",project)
  page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===39',timeout=60000);page.add_script_tag(path=str(root/'tools/qa-stage39-observer/observer-v5.js'));page.evaluate("()=>window.__probe=HonroQAObserver.install(HonroApp.engine,{purpose:'wait-vs-turn'},100000,HonroApp)");page.evaluate("""()=>{const e=HonroApp.engine;window.__lines=[];for(const method of ['fire','impact']){const orig=e[method];e[method]=function(...args){const b=e.b,p=args[0],h=args[1],u=method==='fire'?e.active:e.unit(p?.owner),old=new Set(b.projectiles.map(v=>v.id)),before={round:b.round,side:b.side,shot:b.shot,actor:u?{id:u.id,x:u.x,y:u.y}:null};let ret;try{return ret=orig.apply(this,args)}finally{if(method==='fire'&&ret){for(const v of b.projectiles.filter(v=>!old.has(v.id)))__lines.push({kind:'launch',...before,skill:v.skill,projectileId:v.id,projectileShot:v.shot,x:v.x,y:v.y});}else if(method==='impact')__lines.push({kind:'impact',...before,skill:p?.skill,projectileId:p?.id,projectileShot:p?.shot,x:p?.x,y:p?.y,target:h?.unit?{id:h.unit.id,x:h.unit.x,y:h.unit.y,side:h.unit.side,resident:!!h.unit.honroAct4Resident}:null,terrain:h?.terrain?.id??null});}}}}""");start=time.monotonic();events=[];lastAction=-10
  page.screenshot(path=str(out/(arm+'-start.png')))
  while True:
   elapsed=time.monotonic()-start;s=page.evaluate(state);action=None
   if arm=='turns' and elapsed-lastAction>=2:
    if s['dialogue']:page.keyboard.press('Enter');action='Enter dialogue';lastAction=elapsed
    elif s['canInput'] and s['side']==0 and s['phase']=='aim':page.keyboard.press('f');action='F normal defend or retreat-end';lastAction=elapsed
   events.append({'wallSeconds':elapsed,'action':action,'state':s})
   if elapsed>=35 or s.get('failure') or s.get('done'):break
   page.wait_for_timeout(1000)
  page.screenshot(path=str(out/(arm+'-end.png')));trace=page.evaluate('()=>({rows:__probe.rows,failures:__probe.failures,lines:__lines})');(out/(arm+'-trace.json')).write_text(json.dumps(trace,ensure_ascii=False,separators=(',',':')));(out/(arm+'-timeline.json')).write_text(json.dumps(events,ensure_ascii=False,indent=2));ctx.storage_state(path=str(out/(arm+'-storage.json')))
  result['arms'][arm]={'samples':len(events),'wallSeconds':events[-1]['wallSeconds'],'start':events[0]['state'],'end':events[-1]['state'],'actions':[{'wallSeconds':x['wallSeconds'],'action':x['action']}for x in events if x['action']],'observerFailures':trace['failures'],'errors':errors};print(arm,'done',round(events[-1]['wallSeconds'],2),flush=True);ctx.close()
 browser.close()
(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));srv.shutdown();srv.server_close()
