"""Short fresh-document control for the completed continuous run.
The original paused live comparison was not saved after the adapter exception;
use the captured final live AIM frames as an explicitly approximate control.
"""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/battle-runtime/continuous';run=json.loads((OUT/'continuous.json').read_text());profile=json.loads((OUT/'final-profile.json').read_text());last=run['snapshots'][-1]
last_fire={}
for action in run['result']['actions']:
    if action['op'] in ['fire','heal-stake']:last_fire[action['hero']]=action
active=next(u for u in profile['honroBattle']['units'] if u['id']==profile['honroBattle']['active'])
view={**last['camera'],'time':0,'selected':last_fire.get(active['cls'],{}).get('skill',active['loadout'][0])}
state_keys=['round','rng','phase','units','projectiles','terrain','honroState','items']
with serve_game() as url,sync_playwright() as p:
    browser=launch(p);ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1);page=ctx.new_page()
    page.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');')
    page.goto(url+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady')
    page.evaluate('''()=>{window.compareNativeFrame=HonroApp.frame.bind(HonroApp);HonroApp.frame=()=>{};}''')
    page.locator('.title-actions button.primary').click();page.wait_for_function('HonroApp.engine?.b.honroStage===11');page.wait_for_function('HonroAuthoredFarArt.ready(11)')
    restored=page.evaluate('HonroApp.engine.b');equal=all(restored[k]==profile['honroBattle'][k] for k in state_keys)
    sample=page.evaluate((ROOT/'tools/testing/battle-runtime-continuous-compare.js').read_text(),view)
    page.screenshot(path=str(OUT/'fresh-final.jpg'),type='jpeg',quality=90)
    result={'stateEqualBeforeSampling':equal,'checkedStateKeys':state_keys,'liveTail':run['rounds'][-1],'fresh':sample,'view':view,'limits':['Original live document was closed after a post-run adapter exception; its paused comparison was not serialized.','This compares captured live final AIM frames with a later fresh document, not a simultaneous exact paired comparison.','Visual clock resets in fresh document; camera/selected skill reconstructed from captured final camera and input log. No forced GC; live heap also includes graph/controller/metric history.']}
    (OUT/'fresh-control.json').write_text(json.dumps(result,indent=2));print('FRESH CONTROL',equal,sample['frame'],sample['raf'],flush=True)
    browser.close()
