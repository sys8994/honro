"""Isolated Continue fixtures: declared interrupted / stranded states, not user saves."""
import json,subprocess,argparse
from contextlib import nullcontext
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game
OUT=ROOT/'_local/reports/critical-20261111'
if not all((OUT/n).exists() for n in ['turn-34-orphan-battle.json','turn-40-pending-battle.json']):subprocess.run(['node','tests/critical-turn-recovery.mjs'],cwd=ROOT,check=True)
parser=argparse.ArgumentParser();parser.add_argument('--base');args=parser.parse_args()
rows=[];errors=[]
with (nullcontext(args.base) if args.base else serve_game()) as base,sync_playwright() as w:
 browser=launch(w)
 for n,name in [(34,'turn-34-orphan-battle.json'),(40,'turn-40-pending-battle.json')]:
  ctx=browser.new_context(viewport={'width':1280,'height':800});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  b=json.loads((OUT/name).read_text(encoding='utf-8'))
  if n==40:
   # Explicit unavailable dry-bank state; App settles synthetic wide blockers.
   b['honroAct4PreviewState']['water']['dry']['archer']['y']=3900
   b['units'][0]['honroAct4Recovering']['entry']['y']=3900
   b['units']=[b['units'][0]]
  page.evaluate("""async ({b,n})=>{await HonroCampaignLoader.ensureStage(n);const p=HONRO_TOOLS.fresh();for(let i=1;i<n;i++)p.cleared[i]={visits:1};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;b.mode='campaign';b.stageId=n;b.honroMapOrigin='campaign';b.honroCampaignMapRevision=HonroCampaignMapRevision.current(n);p.honroBattle=HonroProfileStore.compactBattleArt(b);localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));}""",{'b':b,'n':n})
  page.reload();page.wait_for_function('window.HonroApp',timeout=120000);page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine',timeout=90000)
  page.evaluate("""()=>{const a=HonroApp;for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.turnNotice=null;document.getElementById('turn-banner').hidden=true;}""")
  if n==34:
   page.wait_for_function('HonroApp.engine.b.phase==="aim"',timeout=15000)
   page.keyboard.down('d');page.wait_for_timeout(120);page.keyboard.up('d')
   result=page.evaluate('({phase:HonroApp.engine.b.phase,busy:HonroApp.engine.settleBusy(),canInput:!!HonroApp.canInput()})');assert not result['busy'];assert result['canInput'],result
  else:
   page.wait_for_function('HonroApp.engine.b.phase==="lost"',timeout=15000)
   result=page.evaluate('({phase:HonroApp.engine.b.phase,hp:HonroApp.engine.b.units.find(u=>u.id==="archer").hp,reason:HonroApp.engine.b.honroAct4PreviewState.failure})');assert result['hp']==138;assert result['reason'];page.wait_for_selector('[data-action=retry]',timeout=10000);result['resultText']=page.locator('.result-body').inner_text();assert result['reason'] in result['resultText'];page.locator('[data-action=retry]').click();page.wait_for_function('HonroApp.engine?.b.phase!=="lost"',timeout=15000);result['retryFresh']=True
  page.screenshot(path=str(OUT/f'turn-{n}-browser.png'));rows.append({'stage':n,**result});ctx.close()
 browser.close()
(OUT/'turn-browser.json').write_text(json.dumps({'rows':rows,'errors':errors,'scope':__doc__+' Synthetic campaign metadata and current revision normalized before compact save injection.'},ensure_ascii=False,indent=2),encoding='utf-8')
assert not errors,errors
print('PASS',rows)
