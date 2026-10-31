"""Manual UI play of stage 36 two-cluster QA with prior legal-growth fixture.

Run against the separate two-cluster disposable QA build. Uses the declared fixture;
never changes live battle state. Every command gets bounded before/after records.
"""
import hashlib, json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

src=Path(os.environ.get('HONRO_FIXTURE','/workspace/honro/_local/act4-rc/final-4ebe-representative/fixture.json'))
raw=src.read_bytes();assert hashlib.sha256(raw).hexdigest()=='03a9b9a9e2ae9ed487575acc0fce08ef0c2ca475478b270c6292ffb7631ca758'
fixture=json.loads(raw);profile=fixture['profile'];assert 'honroBattle' not in profile or not profile['honroBattle'];assert fixture['proof']['rows']['archer']['ranks']['A02']==5
out=Path(os.environ.get('HONRO_RUN_DIR','/workspace/honro/_local/act4-rc/design36-play'));out.mkdir(parents=True,exist_ok=False)
state_js='''()=>{let a=HonroApp,e=a.engine,b=e?.b,u=e?.active;if(!b)return {screen:a.screen};return {screen:a.screen,stage:b.honroStage,round:b.round,phase:b.phase,active:u?.id,side:u?.side,canInput:a.canInput(),grounded:u?e.grounded(u):null,selected:a.selected,charge:a.charging,power:a.power,camera:{x:a.scene?.x,y:a.scene?.y,scale:a.scene?.scale},angle:u?.angle,move:u?.moveLeft,shot:b.shot,shots:b.shots,hits:b.hits,kills:b.kills,seed:b.seed,rng:b.rng,projectiles:b.projectiles.length,volley:!!b.volley,dialogue:a.dialogue&&{index:a.dialogue.index,line:a.dialogue.lines[a.dialogue.index]?.slice(0,2)},units:b.units.map(v=>({id:v.id,side:v.side,x:Math.round(v.x*10)/10,y:Math.round(v.y*10)/10,hp:Math.round(v.hp*10)/10,attack:v.attack,dead:v.dead,acted:v.acted,angle:v.angle})),lastShots:Object.fromEntries(Object.entries(b.lastShots||{}).map(([k,v])=>[k,{skill:v.skill,angle:v.angle,power:v.power,wind:v.wind}])),ledger:a.profile.equipment?.rewardLedger?.eq_hw_t3b,owned:a.profile.equipment?.ownedItemIds?.filter(x=>x==='itm_hw_06'),events:((q)=>q&&({door:q.door,events:q.events,receipts:q.receipts}))(b.honroAct4PreviewState)}}'''
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':900})
 page.add_init_script("""window.__qaProjectiles=[];window.__qaLast={};window.__qaTraceTimer=setInterval(()=>{const b=window.HonroApp?.engine?.b;if(!b)return;for(const p of b.projectiles||[]){if(p.owner!=='archer'||p.skill!=='A02')continue;const v={round:b.round,shot:p.shot,id:p.id,pierces:p.pierces,hit:[...(p.hit||[])]},sig=JSON.stringify(v);if(window.__qaLast[p.id]!==sig){window.__qaLast[p.id]=sig;if(window.__qaProjectiles.length<10000)window.__qaProjectiles.push(v);}}},50)""")
 page.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8772')+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp')
 page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.wait_for_timeout(1000)
 page.get_by_text('여정 이어가기').click();page.wait_for_timeout(2500);page.get_by_text('여정첩').click();page.wait_for_timeout(2500);page.mouse.click(330,192);page.get_by_text('진입',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===36',timeout=60000);page.wait_for_timeout(1500)
 for _ in range(8):
  if page.get_by_text('확인',exact=True).count() and page.get_by_text('확인',exact=True).first.is_visible():page.get_by_text('확인',exact=True).first.click();page.wait_for_timeout(500)
  else:break
 log=(out/'actions.jsonl').open('x',encoding='utf8',buffering=1);initial=page.evaluate(state_js)
 assert (initial['round'],initial['seed'],initial['rng'],initial['shots'],initial['kills'])==(1,19388,19388,0,0),initial
 assert len([u for u in initial['units'] if u['side']==1])==7 and all(not u['dead'] for u in initial['units'])
 page.screenshot(path=str(out/'initial.png'));(out/'initial-state.json').write_text(json.dumps({'fixtureSha256':hashlib.sha256(raw).hexdigest(),'proof':fixture['proof'],'initial':initial},ensure_ascii=False,indent=2))
 print('READY',json.dumps(initial,ensure_ascii=False),flush=True)
 if os.environ.get('HONRO_PREFLIGHT')=='1':
  page.mouse.move(700,350);page.mouse.wheel(0,500);page.wait_for_timeout(1000);wide=page.evaluate(state_js)
  assert abs(wide['camera']['scale']-initial['camera']['scale'])>.01,(initial['camera'],wide['camera'])
  for k in ('round','phase','active','shots','kills','seed','rng','units'):assert wide[k]==initial[k],k
  page.mouse.wheel(0,-500);page.wait_for_timeout(1000);restored=page.evaluate(state_js)
  assert abs(restored['camera']['scale']-initial['camera']['scale'])<.03,(initial['camera'],restored['camera'])
  page.keyboard.press('Escape');page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='기록·관리',exact=False).click()
  with page.expect_download() as download:page.get_by_role('button',name='JSON 기록 내보내기').click()
  export=out/'preflight-ui-export.json';download.value.save_as(export);assert export.stat().st_size>1000
  raw_snapshot=page.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')");assert raw_snapshot;(out/'preflight-raw-snapshot.json').write_text(raw_snapshot)
  page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===36');page.wait_for_timeout(1000);after=page.evaluate(state_js)
  for k in ('round','phase','active','shots','kills','seed','rng','units'):assert after[k]==initial[k],k
  print('EXPORT_RELOAD_PREFLIGHT_OK',hashlib.sha256(export.read_bytes()).hexdigest(),hashlib.sha256(raw_snapshot.encode()).hexdigest(),flush=True)
  (out/'camera-preflight.json').write_text(json.dumps({'before':initial['camera'],'wide':wide['camera'],'restored':restored['camera'],'battleUnchanged':True},indent=2));print('CAMERA_PREFLIGHT_OK',json.dumps({'before':initial['camera'],'wide':wide['camera'],'restored':restored['camera']}),flush=True);browser.close();sys.exit(0)
 for text in sys.stdin:
  args=text.strip().split()
  if not args: continue
  command=args[0];pre=page.evaluate(state_js);t=time.monotonic();record={'input':args,'before':pre,'wallTime':time.time()};print('BEFORE',json.dumps(pre,ensure_ascii=False),flush=True)
  try:
   if command in ('move','hold') and len(args)==3:
    page.keyboard.down(args[1]);page.wait_for_timeout(int(args[2]));page.keyboard.up(args[1])
   elif command=='key' and len(args)==2:page.keyboard.press(args[1])
   elif command=='wait' and len(args)==2:page.wait_for_timeout(int(args[1]))
   elif command=='wheel' and len(args)==4:page.mouse.move(float(args[1]),float(args[2]));page.mouse.wheel(0,float(args[3]))
   elif command=='capture' and len(args)==2:
    assert args[1].replace('-','').replace('_','').isalnum();page.screenshot(path=str(out/(args[1]+'.png')))
   elif command=='state':pass
   elif command=='snapshot':
    value=page.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')");assert value;dest=out/('snapshot-'+str(time.time_ns())+'.json');dest.write_text(value);print('SNAPSHOT',dest,hashlib.sha256(value.encode()).hexdigest(),flush=True)
   elif command=='export':
    page.keyboard.press('Escape');page.get_by_role('button',name='설정',exact=True).click();page.get_by_role('button',name='기록·관리',exact=False).click()
    with page.expect_download() as download:page.get_by_role('button',name='JSON 기록 내보내기').click()
    dest=out/('ui-export-'+str(time.time_ns())+'.json');download.value.save_as(dest);print('UI_EXPORT',dest,hashlib.sha256(dest.read_bytes()).hexdigest(),flush=True);page.keyboard.press('Escape')
   elif command=='reload':
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===36');page.wait_for_timeout(1000)
   elif command=='quit':break
   else:raise ValueError('unsupported command')
   page.wait_for_timeout(400);post=page.evaluate(state_js);record['after']=post;record['elapsedSec']=round(time.monotonic()-t,3);record['acceptedShot']=post.get('shots',0)>pre.get('shots',0);record['projectileObservations']=page.evaluate('()=>window.__qaProjectiles?.splice(0)||[]');record['hpDelta']={x['id']:round(x['hp']-next((v['hp'] for v in pre.get('units',[]) if v['id']==x['id']),x['hp']),1) for x in post.get('units',[])};record['status']='ok';print('AFTER',json.dumps(post,ensure_ascii=False),flush=True)
  except Exception as exc:record['status']='error';record['error']=str(exc);print('ERROR',repr(exc),flush=True)
  finally:log.write(json.dumps(record,ensure_ascii=False)+'\n');log.flush()
 browser.close()
