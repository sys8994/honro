import json,time,hashlib,os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ.get('HONRO_RUN_DIR','/workspace/honro/_local/act4-rc/play36-fresh')); out.mkdir(parents=True,exist_ok=True);profile=json.load(open('/workspace/honro/tests/fixtures/act4-rc/support-entry-fixture.json'))['profile']
profile['cleared'].update({str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(31,36)});profile['lastStage']=36;profile['mapNode']=36
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8770/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp && window.HonroProgression')
 profile,proof=p.evaluate('''p=>{let C=HONRO_CORE,P=HonroProgression,plan=P.plan(36),wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']}, rows={};for(const cls of p.recruited){let h=p.heroes[cls];h.xp=P.xpAt(plan.entryLevel);h.ranks={[C.baseSkill(cls)]:1};h.statTraining=0;for(let i=0;i<18;i++)C.investStat(h,cls);for(const id of wanted[cls])for(let i=0;i<5;i++)C.train(h,id);while(C.pointsLeft(h,cls)>0)if(!C.investStat(h,cls))break;p.loadouts[cls]=wanted[cls].filter(id=>h.ranks[id]>0);rows[cls]={xp:h.xp,earned:C.pointsEarned(h),spent:C.pointsSpent(h,cls),left:C.pointsLeft(h,cls),stats:h.statTraining,ranks:h.ranks,equipment:h.equipmentIds}};return [p,{plan,rows}]}''',profile)
 (out/'fixture.json').write_text(json.dumps({'scope':'Synthetic previous 1–35 clear; legal growth plan, not actual prior play; no optional Act4 rewards','proof':proof,'profile':profile},ensure_ascii=False,indent=2));print('FIXTURE',json.dumps(proof,ensure_ascii=False),flush=True)
 p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_timeout(3000);p.get_by_text('여정 이어가기').click();p.wait_for_timeout(5000);p.get_by_text('여정첩').click();p.wait_for_timeout(5000);p.mouse.click(330,192);p.get_by_text('진입',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===36',timeout=60000);p.wait_for_timeout(2000);p.screenshot(path=str(out/'entry.png'))
 for _ in range(8):
  if p.get_by_text('확인',exact=True).count() and p.get_by_text('확인',exact=True).first.is_visible():p.get_by_text('확인',exact=True).first.click();p.wait_for_timeout(500)
  else: break
 start=time.monotonic();log=[];last=None;acted=set();stagnant=0
 for i in range(1000000):
  p.wait_for_timeout(1200)
  st=p.evaluate('''()=>{let a=HonroApp,e=a.engine,b=e?.b,u=e?.active;return {screen:a.screen,dialogue:!!a.dialogue,round:b?.round,phase:b?.phase,active:u&&{id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,angle:u.angle},units:b?.units.map(v=>({id:v.id,side:v.side,hp:v.hp,dead:v.dead,x:Math.round(v.x),y:Math.round(v.y)}))}}''');print('STATE',json.dumps(st,ensure_ascii=False),flush=True);log.append(st);(out/'attempt.json').write_text(json.dumps({'fixture':proof,'elapsedWallSec':time.monotonic()-start,'states':log},ensure_ascii=False,indent=2))
  if st['screen']!='battle' or st['phase'] in ['won','lost']:break
  if not any(v['side']==1 and not v['dead'] for v in st['units']):
   p.screenshot(path=str(out/'combat-clear.png'));print('COMBAT CLEARED; controls are manual',flush=True);acted.add((st['round'],st['active']['id']));stagnant=8
  if st['dialogue']:
   p.keyboard.press('Enter');continue
  u=st['active']
  if not u or u['side']!=0 or st['phase']!='aim':continue
  key=(st['round'],u['id']);
  if key in acted or st['round']>=6 or os.environ.get('HONRO_MANUAL')=='1':
   stagnant=stagnant+1
   if stagnant<8 and key in acted and os.environ.get('HONRO_MANUAL')!='1':continue
   p.screenshot(path=str(out/'watchdog.png'));print('WATCHDOG type key <key>, move <d|a> <ms>, screenshot, state, auto, quit',flush=True)
   while True:
    line=input('command> ').strip().split()
    if not line:continue
    if line[0]=='auto':acted.discard(key);stagnant=0;break
    if line[0]=='next':acted.add(key);stagnant=0;break
    if line[0]=='hold':p.keyboard.down(line[1]);p.wait_for_timeout(int(line[2]));p.keyboard.up(line[1])
    if line[0]=='quit':raise SystemExit('operator ended attempt')
    if line[0]=='key':p.keyboard.press(line[1])
    if line[0]=='move':p.keyboard.down(line[1]);p.wait_for_timeout(int(line[2]));p.keyboard.up(line[1])
    if line[0]=='screenshot':p.screenshot(path=str(out/'manual.png'))
    if line[0]=='state':print(p.evaluate('''()=>{let a=HonroApp,b=a.engine.b;return JSON.stringify({round:b.round,phase:b.phase,active:a.engine.active?.id,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),events:b.honroAct4PreviewState,ledger:a.profile.equipment.rewardLedger.eq_hw_t3b,owned:a.profile.equipment.ownedItemIds.filter(x=>x==='itm_hw_06')})}'''),flush=True)
    if line[0]=='snapshot':
     raw=p.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')")
     if raw is None: raise RuntimeError('profile absent')
     target=out/('snapshot-'+str(time.time_ns())+'.json');target.write_text(raw,encoding='utf-8');print('SNAPSHOT',str(target),hashlib.sha256(raw.encode()).hexdigest(),flush=True)
    elif line[0]=='reload':
     before=p.evaluate("""()=>{const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));return {stage:p.honroBattle?.honroStage,round:p.honroBattle?.round,cleared:p.cleared,heroes:p.heroes,equipment:p.equipment,recruited:p.recruited,proof:p.honroAct4,events:((q)=>q&&({door:q.door,events:q.events,receipts:q.receipts,complete:q.complete}))(p.honroBattle?.honroAct4PreviewState),asset:p.honroBattle?.honroMap?.vectorDoorAssetId,units:p.honroBattle?.units?.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))}}""")
     p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('(n)=>HonroApp.engine?.b?.honroStage===n',arg=before['stage'],timeout=60000);p.wait_for_timeout(1200)
     after=p.evaluate("""()=>({stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,cleared:HonroApp.profile.cleared,heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,recruited:HonroApp.profile.recruited,proof:HonroApp.profile.honroAct4,events:((q)=>q&&({door:q.door,events:q.events,receipts:q.receipts,complete:q.complete}))(HonroApp.engine.b.honroAct4PreviewState),asset:HonroApp.engine.b.honroMap?.vectorDoorAssetId,units:HonroApp.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))})""")
     
     if before!=after:
      diff={k:{'before':before[k],'after':after[k]} for k in before if before[k]!=after[k]};(out/'reload-diff.json').write_text(json.dumps(diff,ensure_ascii=False,indent=2));print('RELOAD_MISMATCH',list(diff),flush=True)
     else:print('SAME_CONTEXT_RELOAD',after['stage'],after['round'],flush=True)
    elif line[0]=='export':
     p.keyboard.press('Escape');p.get_by_role('button',name='설정',exact=True).click();p.get_by_role('button',name='기록·관리',exact=False).click()
     with p.expect_download() as dl:p.get_by_role('button',name='JSON 기록 내보내기').click()
     dest=out/('ui-export-'+str(time.time_ns())+'.json');dl.value.save_as(dest);print('UI_EXPORT',str(dest),hashlib.sha256(dest.read_bytes()).hexdigest(),flush=True)
    elif line[0] not in {'hold','quit','key','move','screenshot','state'}:print('ERROR unknown command',line[0],flush=True)
    p.wait_for_timeout(500)
   continue
  stagnant=0
  acted.add(key)
  # Normal controls: open with a small advance; use distinct equipped skills and a charged shot.
  if u['id']!='knight' and st['round']<=5:
   p.keyboard.down('d');p.wait_for_timeout(1000);p.keyboard.up('d')
  p.keyboard.press('2' if u['id'] in ['archer','mage'] else '3');p.keyboard.down('Space');p.wait_for_timeout(650);p.keyboard.up('Space')
 p.screenshot(path=str(out/'last.png'));b.close()
