from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
settings="""async id=>{
 const a=HonroApp;
 a.stopBattle();a.close();a.profile=HonroProfileStore.fresh();a.normalProfile=a.profile;
 a.profile.recruited=[...HONRO_CORE.CLASS_IDS];a.profile.party=[...a.profile.recruited];
 for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1,rounds:18};
 for(const cls of a.profile.party){const h=a.profile.heroes[cls];h.xp=HONRO_CORE.xpAtLevel(25);HONRO_CORE.autoTrain(h,cls);HONRO_CORE.sanitizeLoadout(a.profile,cls);}
 await HonroCampaignLoader.ensureStage(id);a.launch(id);
}"""
with serve_game() as url,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':1365,'height':850})
 errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('!!window.HonroApp',timeout=90000)
 for id,search in [(44,'큰애를 놓친 골'),(45,'서로 비킬 데')]:
  p.evaluate(settings,id)
  p.wait_for_function('n=>HonroApp.engine?.b.honroStage===n && !!HonroApp.dialogue',arg=id,timeout=20000)
  rows=p.evaluate('HonroApp.dialogue.lines')
  hit=[i for i,r in enumerate(rows) if search in r[1]]
  assert len(hit)==1,(id,rows)
  for _ in range(hit[0]):
   p.locator('#dialogue-root [data-action="dialogue-next"]').click(timeout=5000)
  assert search in p.locator('#dialogue-root').inner_text()
  p.screenshot(path=f'_local/reports/dialogue-entry-{id}.png')
  print('VISIBLE',id,hit[0],len(rows),flush=True)
 assert not errors,errors
