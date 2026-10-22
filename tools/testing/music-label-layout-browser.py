import sys,json
from pathlib import Path
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tests'))
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
O=R/'_local/reports/bgm-label-layout';O.mkdir(parents=True,exist_ok=True);rows=[]
with sync_playwright() as p:
 b=launch(p)
 for w,h,safe in [(320,568,False),(390,844,True),(844,390,False),(1280,800,False)]:
  c=b.new_context(viewport={'width':w,'height':h},is_mobile=w<900,has_touch=w<900);pg=c.new_page()
  if safe:c.new_cdp_session(pg).send('Emulation.setSafeAreaInsetsOverride',{'insets':{'top':44,'left':0,'right':0,'bottom':34}})
  pg.goto(story_base_url()+'/HONRO.html');pg.wait_for_function('document.documentElement.dataset.honroReady');pg.get_by_role('button',name='설정',exact=True).click();pg.wait_for_function('!document.getElementById("bgm-now-playing").hidden');pg.locator('#modal button.close').click();pg.wait_for_function('document.getElementById("bgm-now-playing").textContent==="배경음 - 혼로"');wrap=pg.locator('#bgm-now-playing').evaluate('''l=>{const prior=l.style.maxWidth,text=l.textContent;l.textContent='배경음 - 불완전한 의식';l.style.maxWidth='55px';const r=l.getBoundingClientRect(),ok=r.height>parseFloat(getComputedStyle(l).lineHeight)&&l.scrollWidth<=Math.ceil(r.width);l.style.maxWidth=prior;l.textContent=text;return ok}''');assert wrap;pg.screenshot(path=str(O/f'title-label-{w}-{safe}.png'));pg.evaluate('HonroApp.debugMode=true;HonroApp.launch(1)');pg.wait_for_function('HonroApp.audio.music.current?.currentTime>.1&&HonroApp.screen==="battle"');pg.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp)');pg.locator('#turn-banner').wait_for(state='hidden')
  q=pg.locator('#bgm-now-playing').evaluate('''l=>{const r=l.getBoundingClientRect(),s=getComputedStyle(l);const overlap=[...document.querySelectorAll('.battle button,.battle [role=application]')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top}).map(e=>({id:e.id,action:e.dataset.action,rect:e.getBoundingClientRect().toJSON()}));return {text:l.textContent,rect:r.toJSON(),whiteSpace:s.whiteSpace,overlap}}''');q.update(width=w,height=h,safe=safe,longTitleWrap=True);assert q['text']=='배경음 - 장막 너머의 음' and not q['overlap'];rows.append(q);pg.screenshot(path=str(O/f'battle-label-{w}-{safe}.png'));c.close()
 b.close()
(O/'label-layout.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False))
