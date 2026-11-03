"""Synthetic revision-3 saved battle through real Chromium Continue. No user save."""
import json,traceback,os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('_local/reports/stage6-art-preview');r={'scope':'Synthetic older-revision battle based on the current fixture, not an imported real-user save','source':os.environ.get('GITHUB_SHA')}
try:
 profile=json.loads((out/'integrated-entry.json').read_text())['profile'];b=json.loads((out/'fixture-battle.json').read_text());b['honroCampaignMapRevision']=3;profile['honroBattle']=b
 xp=profile['heroes']['archer']['xp'];b['heroes']['archer']['xp']=xp+17
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1440,'height':900});page.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
  # Normalize the entry through the actual loader first. The old fixture has
  # no equipment object, so its normal automatic initial grants are not loss.
  entry={**profile,'honroBattle':None};page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',entry);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000);page.evaluate('async()=>{await HONRO_APP_READY}')
  profile=page.evaluate('()=>structuredClone(HonroApp.profile)');before={k:profile.get(k) for k in ['equipment','cleared','loadouts']};before['ranks']=profile['heroes']['archer']['ranks'];before['statTraining']=profile['heroes']['archer'].get('statTraining');r['beforeNormalized']=before;profile['honroBattle']=b
  page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000);r['titleActions']=page.locator('.title-actions').inner_text();page.screenshot(path=str(out/'revision3-title.png'));page.locator('.title-actions button[data-action="continue"]:visible').first.click();page.wait_for_function('HonroApp.engine?.b?.honroStage===6',timeout=60000)
  r['continue']=page.evaluate('''()=>{const a=HonroApp,p=a.profile,b=a.engine.b;return {stage:b.honroStage,revision:b.honroCampaignMapRevision,xp:p.heroes.archer.xp,equipment:p.equipment,cleared:p.cleared,loadouts:p.loadouts,ranks:p.heroes.archer.ranks,statTraining:p.heroes.archer.statTraining,round:b.round,x:a.engine.unit('p-archer').x};}''')
  assert r['continue']['revision']==4 and r['continue']['round']==1 and r['continue']['xp']==xp+17,r
  for key,value in before.items():assert r['continue'].get(key)==value,key
  r['preservedGrowthAndLoadout']=True;page.screenshot(path=str(out/'revision3-to4-continue.png'));browser.close()
except Exception:r['error']=traceback.format_exc()
finally:(out/'integrated-save-boundary.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False))
if r.get('error'):raise SystemExit(1)
