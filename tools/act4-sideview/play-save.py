"""Disposable Chromium saves and real key input; region placement is a fixture."""
from pathlib import Path
import sys,json
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'_local/reports/act4-sideview-p1-20261116';OUT=BASE/'play-save';OUT.mkdir(exist_ok=True)
sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
from browser_fixture import SETUP as setup
FOOT='''()=>{const a=HonroApp,e=a.engine,u=e.active;return {id:u.id,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft,grounded:e.grounded(u),canInput:a.canInput(),round:e.b.round,phase:e.b.phase};}'''
out={'scope':'isolated contexts only; actual key input on fresh entry and positioned region fixtures; no full chapter completion','saves':[],'movement':[],'errors':[]}
with serve_game() as url,sync_playwright() as pw:
 browser=launch(pw)
 for n in [33,40]:
  for kind in ['baseline','final']:
   raw=(BASE/kind/f'storage-{n}.json').read_text(encoding='utf-8');expected=json.loads(raw)['honroBattle']
   ctx=browser.new_context(viewport={'width':1440,'height':900});ctx.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(raw)+');')
   p=ctx.new_page();p.on('pageerror',lambda e:out['errors'].append(str(e)));p.goto(url+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp && HonroApp.profile.honroBattle')
   p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function(f'HonroApp.engine?.b?.honroStage==={n}');p.evaluate('HonroApp.frame=()=>{}')
   state=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return {round:b.round,terrain:b.terrain,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),art:b.honroLandmarks.filter(l=>l.asset?.id?.startsWith('act4-sideview:')).map(l=>l.asset.id),growth:a.profile.heroes};}''')
   assert state['round']==expected['round'];assert state['terrain']==expected['terrain'];assert state['growth']==json.loads(raw)['heroes']
   prior={u['id']:u for u in expected['units']};assert all(u['hp']==prior[u['id']]['hp'] for u in state['units'])
   delta=max(max(abs(u['x']-prior[u['id']]['x']),abs(u['y']-prior[u['id']]['y'])) for u in state['units']);assert delta<30
   assert len(state['art'])==(0 if kind=='baseline' else 1)
   p.screenshot(path=str(OUT/f'{n}-{kind}-resume.png'))
   out['saves'].append({'stage':n,'kind':kind,'round':state['round'],'terrainEqual':True,'growthEqual':True,'hpEqual':True,'maximumNaturalPositionDelta':delta,'newArt':state['art']})
   ctx.close();print('save',n,kind,delta,flush=True)
 for n,tid,x in [(33,None,None),(40,None,None),(33,'approved33-low',4500),(40,'approved40-coast-east',4720),(40,'approved40-upper-east',5000)]:
  ctx=browser.new_context(viewport={'width':1440,'height':900});p=ctx.new_page();p.on('pageerror',lambda e:out['errors'].append(str(e)));p.goto(url+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader');p.evaluate(setup,n)
  if tid:p.evaluate('''({tid,x})=>{const e=HonroApp.engine,u=e.active,t=e.b.terrain.find(t=>t.id===tid);u.x=x;u.y=HONRO_CORE.topAt(t,x,e.b.height);u.vx=u.vy=0;u.jumping=false;Object.assign(HonroApp.scene,{x,y:u.y-120,scale:.7});}''',{'tid':tid,'x':x})
  p.evaluate('''()=>{const a=HonroApp;delete a.frame;a.prev=performance.now();requestAnimationFrame(t=>a.frame(t));}''');p.wait_for_timeout(300)
  before=p.evaluate(FOOT)
  if before['canInput']:
   p.keyboard.down('ArrowRight');p.wait_for_timeout(300);p.keyboard.up('ArrowRight');p.wait_for_timeout(150)
  walked=p.evaluate(FOOT)
  p.keyboard.press('ControlLeft');p.wait_for_timeout(200);air=p.evaluate(FOOT);p.wait_for_timeout(1400);after=p.evaluate(FOOT)
  label=tid or 'entry';p.screenshot(path=str(OUT/f'{n}-{label}.png'))
  row={'stage':n,'region':label,'positionFixture':bool(tid),'input':'ArrowRight 300ms then ControlLeft; no HP/AP/stat modification','before':before,'walked':walked,'air':air,'after':after,'deltaX':walked['x']-before['x']}
  out['movement'].append(row);print('movement',n,label,round(row['deltaX'],2),before['canInput'],after['grounded'],flush=True);ctx.close()
 browser.close()
(OUT/'results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
