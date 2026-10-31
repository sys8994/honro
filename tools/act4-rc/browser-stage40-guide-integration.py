"""Actual title/settings/file chooser and Continue using a preserved stage-40 save."""
import hashlib,json,lzma,sys,os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];qa=Path(sys.argv[1]).resolve();out=root/'_local/act4-perf';out.mkdir(parents=True,exist_ok=True);raw=lzma.decompress((qa/'tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz').read_bytes());sha=hashlib.sha256(raw).hexdigest();assert sha=='2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141';source=json.loads(raw)
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1);p=context.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(os.environ.get('HONRO_QA_BASE','http://127.0.0.1:8770')+'/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader');p.evaluate('''()=>{window.qaPrep=[];const f=HonroVectorArt.prepareIncremental;HonroVectorArt.prepareIncremental=async(...a)=>{const t=performance.now(),s=await f(...a);qaPrep.push({t,status:s});return s}}''')
 p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files({'name':'stage40-record.json','mimeType':'application/json','buffer':raw});p.wait_for_function('HonroApp.profile?.honroBattle?.honroStage===40',timeout=120000)
 imported=p.evaluate('''()=>({stage:HonroApp.profile.honroBattle?.honroStage,locked:HonroApp.profileStore.locked,screen:HonroApp.screen,cleared:HonroApp.profile.cleared,heroes:HonroApp.profile.heroes,reader:HonroApp.profile.honroBattle?.honroAct4PreviewState?.reader})''');assert not imported['locked'];assert imported['cleared']==source['cleared'];assert imported['heroes']==source['heroes'];p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===40',timeout=120000);p.wait_for_timeout(2500)
 state=p.evaluate('''()=>({stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,dialogue:!!HonroApp.dialogue,screen:HonroApp.screen,phase:HonroApp.engine.b.honroAct4PreviewState?.returnEscort?.phase,clock:HonroApp.engine.b.honroAct4PreviewState?.returnEscort?.clock,prepares:qaPrep,cache:HonroApp.scene.renderCacheStats()})''');assert state['stage']==40 and not errors,errors
 p.locator('[data-action="pause"]').first.click();p.get_by_text('다시 걷기',exact=True).click();p.get_by_text('전투 처음부터',exact=True).click();p.get_by_role('button',name='계속',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===40 && HonroApp.engine.b.round===1',timeout=90000);p.wait_for_timeout(6000)
 restarted=p.evaluate('''()=>({stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,dialogue:!!HonroApp.dialogue,prepares:qaPrep,screen:HonroApp.screen,cache:HonroApp.scene.renderCacheStats()})''');assert restarted['stage']==40 and restarted['round']==1 and restarted['dialogue'] and any(z['status']=='prepared' for z in restarted['prepares']),restarted

 # Repeat actual UI retries, interrupt a pending preparation with viewport,
 # early key and wheel input, and sample heap after requested GC.
 cdp=context.new_cdp_session(p);cdp.send('Performance.enable');runs=[]
 def retry():
  if p.evaluate('!!HonroApp.dialogue'):
   p.keyboard.press('Enter');p.wait_for_function('!HonroApp.dialogue',timeout=30000)
  p.locator('[data-action="pause"]').first.click();p.get_by_text('다시 걷기',exact=True).click();p.get_by_text('전투 처음부터',exact=True).click();p.get_by_role('button',name='계속',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===40 && HonroApp.engine.b.round===1 && !!HonroApp.dialogue',timeout=90000);p.wait_for_timeout(150)
 for action in ('viewport','early','wheel','camera'):
  retry();before=p.evaluate('''()=>({n:qaPrep.length,view:{x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale,w:innerWidth,h:innerHeight}})''')
  if action=='viewport':p.set_viewport_size({'width':1280,'height':800})
  elif action=='early':p.keyboard.press('Enter')
  elif action=='wheel':p.mouse.move(700,400);p.mouse.wheel(0,300)
  else: # Camera-only diagnostic: hold a changed view across frames.
   p.evaluate('''()=>{const s=HonroApp.scene,x=s.x+100;s.manual=true;window.qaCameraTimer=setInterval(()=>{s.x=x},4)}''')
  p.wait_for_timeout(700);after=p.evaluate('''n=>({events:qaPrep.slice(n),dialogue:!!HonroApp.dialogue,view:{x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale,w:innerWidth,h:innerHeight},cache:HonroApp.scene.renderCacheStats(),tiles:HonroApp.scene._domainTiles?.tiles.size||0})''',before['n']);assert any(z['status']=='cancelled' for z in after['events']), (action,before,after);assert after['tiles']<=24
  if action=='camera':p.evaluate('clearInterval(window.qaCameraTimer)')
  if action=='viewport':p.set_viewport_size({'width':1440,'height':900})
  cdp.send('HeapProfiler.collectGarbage');metrics={v['name']:v['value'] for v in cdp.send('Performance.getMetrics')['metrics']};runs.append({'action':action,'before':before,'after':after,'jsHeapUsed':metrics.get('JSHeapUsedSize')})
 report={'inputSha256':sha,'inputScope':'preserved localStorage boarding checkpoint; no changed progress or pose','imported':{k:v for k,v in imported.items() if k not in ('cleared','heroes')},'preservedCleared':True,'preservedHeroes':True,'resumed':state,'restarted':restarted,'interruptions':runs,'errors':errors};(out/'ui-import-stage40.json').write_text(json.dumps(report,indent=2));p.screenshot(path=str(out/'ui-import-stage40.png'));print(json.dumps(report),flush=True);context.close();browser.close()
