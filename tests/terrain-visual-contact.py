"""Chromium regression for terrain painted separately from its live collision."""
import json
import os
from pathlib import Path

from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PROFILE = json.loads((ROOT / 'tests/fixtures/act4-rc/support-entry-fixture.json').read_bytes())['profile']

PROBE = '''([id, x, y, elementId]) => {
  const app = HonroApp, scene = app.scene, b = app.engine.b;
  scene.battle = b;
  const surface = app.engine.contactSurface(x, y - 2, y + 2);
  if (surface?.t.id !== id) throw Error('Expected live contact: ' + id);
  const landmarks = HonroTerrainDomain.materialLandmarks(b);
  const element = landmarks.find(l => l.id === elementId);
  if (!element) throw Error('Missing landmark: ' + elementId);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 30;
  const c = cv.getContext('2d', {willReadFrequently: true});
  c.translate(15 - x, 15 - surface.y);
  scene._landmarkLayer(c, [element], element.layer);
  return c.getImageData(15, 19, 1, 1).data[3];
}'''

def walk_waterfall_platform(page):
    start = page.evaluate('''() => {
      const a=HonroApp,e=a.engine,b=e.b,u=e.unit('p-mage');
      const x=2105,t=b.terrain.find(t=>t.id==='stage5-timber-low');
      Object.assign(u,{x,y:HONRO_CORE.topAt(t,x),vx:0,vy:0,jumping:false,airborne:false});
      b.active=u.id;a.turnNotice=null;b.turnAge=2;
      // Restore the normal frame loop after the isolated paint checks.
      delete a.frame;
      a.prev=performance.now();requestAnimationFrame(t=>a.frame(t));
      return {hp:u.hp,session:b.session};
    }''')
    page.wait_for_function('HonroApp.canInput()')
    page.keyboard.down('ArrowRight')
    try:
        page.wait_for_function('HonroApp.engine.active.x >= 2160', timeout=4000)
    finally:
        page.keyboard.up('ArrowRight')
    saved = page.evaluate('''() => {
      const a=HonroApp,e=a.engine,u=e.active;
      if(!e.grounded(u)||e.contactSurface(u.x,u.y-2,u.y+2)?.t.id!=='stage5-timber-low')throw Error('Actor left the deck');
      a.dirty=true;a.flushBattleSave();
      return {hp:u.hp,x:u.x,y:u.y,session:e.b.session};
    }''')
    assert saved['hp'] == start['hp'] and saved['session'] == start['session']
    page.reload(wait_until='domcontentloaded')
    page.locator('[data-action="continue"]:visible').first.click()
    page.wait_for_function('HonroApp.engine?.b?.honroStage === 5')
    resumed = page.evaluate('''() => {
      const e=HonroApp.engine,u=e.active;
      return {hp:u.hp,x:u.x,y:u.y,session:e.b.session};
    }''')
    assert saved == resumed, (saved, resumed)
    print('PASS Stage 5 keyboard walk and Continue on the painted deck', flush=True)

with serve_game() as local, sync_playwright() as pw:
    browser = launch(pw)
    page = browser.new_page(viewport={'width': 1100, 'height': 720})
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    url = os.getenv('HONRO_VISUAL_URL', local + '/HONRO.html')
    page.goto(url, wait_until='domcontentloaded')
    page.wait_for_function('window.HonroApp && window.HonroCampaignLoader')

    cases = [
        (5, 'stage5-timber-low', 'stage5-art-old-pine', [(2056.4,1879.22),(2160,1877)]),
        (22, 'v22-art-main-document-archive:collision:0', 'v22-art-main-document-archive', [(2972.97068,2606.31837)]),
        (24, 'ancestral-family-hall:collision:0', 'ancestral-family-hall', [(2655.36837,2221.31837)]),
        (32, 'approved32-east-face', 'approved32-body', [(3294.5,1417.9)]),
        (35, 'approved35-bridge-pier', 'approved35-body', [(2997.69,1413)]),
    ]
    for stage, terrain, landmark, points in cases:
        page.evaluate('''async ([p,n]) => {
          const a=HonroApp;a.frame=()=>{};
          await HonroCampaignLoader.ensureStage(n);
          a.profile={...a.profile,...p,honroBattle:null,lastStage:n,mapNode:n,cleared:Object.fromEntries(
            Array.from({length:n-1},(_,i)=>[i+1,{visits:1,rounds:5}]))};
          a.launch(n);
          for(let i=0;i<6&&a.dialogue;i++)HonroStory.finish(a,true);
          a.turnNotice=null;
        }''', [PROFILE, stage])
        for x,y in points:
            alpha = page.evaluate(PROBE, [terrain, x, y, landmark])
            assert alpha >= 192, (stage, terrain, x, alpha)
            print('PASS painted support', stage, terrain, x, flush=True)
        if stage == 5:
            walk_waterfall_platform(page)

    assert not errors, errors
    browser.close()
