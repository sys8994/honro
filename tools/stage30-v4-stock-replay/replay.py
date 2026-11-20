import json,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright,TimeoutError
o=Path(os.environ['OUT']);events=[];shots=[];seen={};start=None;result=None
read='''()=>{const a=HonroApp,b=a.engine?.b,s=a.scene,c=s?.canvas,r=c?.getBoundingClientRect(),m=b?.honroState?.act23v4?.stage30,u=a.engine?.active;
const D=a.dialogue?document.querySelector('.story-dialogue,#story-dialogue,[role=dialog]'):null;
const B=document.querySelector('#turn-banner'); const v=b?.honroV4Stage30;
return{stage:b?.honroStage,revision:b?.honroAct23V4Revision,legacyMarker:b?.honroMarkers?.some(x=>x.id==='transport-map'),debug:a.debugMode,phase:b?.phase,side:b?.side,round:b?.round,serial:b?.honroState?.actorTurnSerial,dialogue:!!a.dialogue,modal:!!a.modal?.classList.contains('open'),banner:!!B&&!B.hidden,can:!a.dialogue&&!a.modal?.classList.contains('open')&&b?.phase==='aim'&&b?.side===0&&u&&!u.dead&&!u.acted&&!u.airborne&&!u.jumping,active:u?{id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,acted:u.acted}:null,
heroes:b?.units?.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),ready:m?.ready||false,boat:m?.boat??null,rescued:m?.rescued??[],waves:m?.waves??{},hold:m?.hold??null,probe:!!v,
canvas:r?{left:r.left,top:r.top,width:r.width,height:r.height,dpr:devicePixelRatio}:null,camera:s?{x:s.x,y:s.y,scale:s.scale}:null,objective:(document.querySelector('.battle-info')?.innerText||'').slice(0,250)};}'''
def save():
 (o/'proof.json').write_text(json.dumps({'scope':'One actual stock desktop V4 path; fresh profile predecessor/entry XP only prior to App.launch; no game writes after launch; movement/defense ordinary keys, read-only observation. Partial accepted as evidence of where attempt stopped, not success.','start':start,'phaseSnapshots':seen,'events':events,'shots':shots,'final':result},indent=2))
def snapshot(page,name,state):
 if not state['canvas']:return
 img=page.locator('#battlecanvas').screenshot(path=str(o/(name+'.png')),timeout=5000);shots.append({'file':name+'.png','sha256':hashlib.sha256(img).hexdigest(),'camera':state['camera'],'boat':state['boat']});save()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1);errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 try:
  page.goto('http://127.0.0.1:8884/HONRO.html',wait_until='domcontentloaded',timeout=180000)
  page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
  page.evaluate('''async()=>{await HONRO_APP_READY;const a=HonroApp;await HonroCampaignLoader.ensureStage(30);a.profile.settings.music=false;a.profile.settings.sound=false;
   for(let n=1;n<30;n++)a.profile.cleared[n]=true;for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(30).entryLevel);
   a.launch(30);if(a.engine?.b.honroStage!==30)throw Error('Actual stock Stage30 not reached');}''')
  start=page.evaluate(read); save()
  assert start['revision']==1 and not start['legacyMarker'] and not start['debug'] and start['probe'] and not start['ready'] and not start['rescued'] and not start['waves'] and ((start['boat'] or {}).get('leg',0)==0),start
  page.locator('#battlecanvas').wait_for(state='visible',timeout=20000)
  status='bounded-input-budget'
  for i in range(160):
   s=page.evaluate(read); bo=s['boat'] or {};phase=bo.get('status')
   if phase in ['boarding','outbound','unboarding','returning'] and phase not in seen:
    seen[phase]=s;snapshot(page,'v4-'+phase,s)
    if len(seen)==4:status='four-native-phases-observed';break
   if s['phase'] in ['won','lost'] or s['stage']!=30:status='stage-outcome-or-exit';break
   if s['modal']:status='unexpected-modal';snapshot(page,'blocked-modal',s);break
   key=None
   if s['dialogue']:key='Space';page.keyboard.press(key);page.wait_for_timeout(260)
   elif s['can'] and not s['banner']:
    u=s['active'];
    if u['move']>=25 and u['x']<5750:
     key='d';page.keyboard.down('d');page.wait_for_timeout(520);page.keyboard.up('d');page.wait_for_timeout(180)
     t=page.evaluate(read)
     if t['can'] and t['active']['id']==u['id'] and t['active']['x']-u['x']<13:
      key='d then f';page.keyboard.press('f');page.wait_for_timeout(350)
    else:key='f';page.keyboard.press('f');page.wait_for_timeout(400)
   else:page.wait_for_timeout(350)
   if key:events.append({'index':i,'key':key,'before':s,'after':page.evaluate(read)});save()
   if i in [6,25,55,99]:snapshot(page,f'checkpoint-{i}',page.evaluate(read))
  result={'status':status,'state':page.evaluate(read),'errors':errs};snapshot(page,'final',result['state']);assert not errs,errs
 except Exception as e:
  result={'status':'exception','error':str(e),'errors':errs};raise
 finally:save();browser.close()
