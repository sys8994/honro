"""Manual UI comparison from unmodified representative initial battle save.

Run against the original 4ebe disposable QA build. Reads the real saved profile;
never changes live battle state. Every command gets bounded before/after records.
"""
import hashlib, json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

src=Path(os.environ.get('HONRO_INITIAL_SAVE','/workspace/honro/_local/act4-rc/final-4ebe-representative/snapshot-1793474963848542824.json'))
raw=src.read_bytes(); expected=os.environ.get('HONRO_INITIAL_SHA','1a94cf8169ea4db4ac8a2e4f8b4e0a69a09c575cc486080bfef1bd36453433eb'); assert hashlib.sha256(raw).hexdigest()==expected
p=json.loads(raw); b=p['honroBattle']; assert b['honroStage']==36 and b['seed']==19388; expected_state=(b['round'],b['seed'],b['rng'],b['shots'],b['kills'])
out=Path(os.environ.get('HONRO_RUN_DIR','/workspace/honro/_local/act4-rc/control-36-comparison'));out.mkdir(parents=True,exist_ok=False)
state_js='''()=>{let a=HonroApp,e=a.engine,b=e?.b,u=e?.active;if(!b)return {screen:a.screen};return {screen:a.screen,stage:b.honroStage,round:b.round,phase:b.phase,active:u?.id,side:u?.side,canInput:a.canInput(),grounded:u?e.grounded(u):null,selected:a.selected,charge:a.charging,power:a.power,angle:u?.angle,move:u?.moveLeft,shot:b.shot,shots:b.shots,hits:b.hits,kills:b.kills,seed:b.seed,rng:b.rng,projectiles:b.projectiles.length,volley:!!b.volley,dialogue:a.dialogue&&{index:a.dialogue.index,line:a.dialogue.lines[a.dialogue.index]?.slice(0,2)},units:b.units.map(v=>({id:v.id,side:v.side,x:Math.round(v.x*10)/10,y:Math.round(v.y*10)/10,hp:Math.round(v.hp*10)/10,dead:v.dead,acted:v.acted,angle:v.angle})),lastShots:Object.fromEntries(Object.entries(b.lastShots||{}).map(([k,v])=>[k,{skill:v.skill,angle:v.angle,power:v.power,wind:v.wind}])),events:((q)=>q&&({door:q.door,events:q.events,receipts:q.receipts}))(b.honroAct4PreviewState)}}'''
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':900})
 page.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8772')+'/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.evaluate('(raw)=>localStorage.setItem("honro-first-act-profile-1",raw)',raw.decode());page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===36');page.wait_for_timeout(1500)
 log=(out/'actions.jsonl').open('x',encoding='utf8',buffering=1); initial=page.evaluate(state_js); assert (initial['round'],initial['seed'],initial['rng'],initial['shots'],initial['kills'])==expected_state,initial
 for v in initial['units']:
  original=next(x for x in b['units'] if x['id']==v['id']);assert abs(v['hp']-original['hp'])<.11 and abs(v['x']-original['x'])<.11 and abs(v['y']-original['y'])<.11,(v,original['id'])
 print('READY',json.dumps(initial,ensure_ascii=False),flush=True)
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
   elif command=='quit':break
   else:raise ValueError('unsupported command')
   page.wait_for_timeout(400);post=page.evaluate(state_js);record['after']=post;record['elapsedSec']=round(time.monotonic()-t,3);record['acceptedShot']=post.get('shots',0)>pre.get('shots',0);record['hpDelta']={x['id']:round(x['hp']-next((v['hp'] for v in pre.get('units',[]) if v['id']==x['id']),x['hp']),1) for x in post.get('units',[])};record['status']='ok';print('AFTER',json.dumps(post,ensure_ascii=False),flush=True)
  except Exception as exc:record['status']='error';record['error']=str(exc);print('ERROR',repr(exc),flush=True)
  finally:log.write(json.dumps(record,ensure_ascii=False)+'\n');log.flush()
 browser.close()
