from pathlib import Path
import sys,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/narration-panel-20261023';rows=[];errors=[]
with serve_game()as base,sync_playwright()as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('async()=>{const a=HonroApp;a.frame=()=>{};await HonroCampaignLoader.ensureStage(1);a.launch(1);for(let i=0;a.dialogue&&i<80;i++)HonroStory.next(a);a.close();a.turnNotice=null;document.getElementById("turn-banner").hidden=true;window.__narr=[];const walk=x=>{if(Array.isArray(x)&&x[0]==="서술"&&typeof x[1]==="string")__narr.push(structuredClone(x));else if(x&&typeof x==="object")Object.values(x).forEach(walk)};walk(HonroNarrativeCatalogue.data);}')
 for w,h in[(390,844),(844,390)]:
  p.set_viewport_size({'width':w,'height':h});p.evaluate('HonroStory.start(HonroApp,__narr.slice(0,2),{title:"길 위의 기록"})');p.wait_for_timeout(220);assert p.locator('.narration-scene').is_visible();assert p.locator('.story-portrait').count()==0
  style=p.locator('.narration-scene').evaluate('(n)=>{const s=getComputedStyle(n);return{borderLeft:s.borderLeftWidth,radius:s.borderRadius,line:getComputedStyle(n.querySelector("#story-line")).color,rule:getComputedStyle(n.querySelector(".story-copy"),"::before").height,actions:getComputedStyle(n.querySelector(".story-actions")).backgroundColor}}');assert style['borderLeft']=='1px' and style['rule']=='2px' and style['actions']=='rgba(0, 0, 0, 0)'
  p.screenshot(path=str(OUT/(str(w)+'-narration.jpg')),type='jpeg',quality=90);p.locator('[data-action=dialogue-next]').click();assert p.evaluate('HonroApp.dialogue.index')==1;p.locator('[data-action=dialogue-prev]').click();assert p.evaluate('HonroApp.dialogue.index')==0
  # Stress-only fixture, not a production text edit: repeated existing narration.
  p.evaluate('(()=>{const l=structuredClone(__narr[0]);l[1]=Array(15).fill(l[1]).join(" ");HonroStory.start(HonroApp,[l]);})()');p.wait_for_timeout(220)
  for where in[0,.5,1]:
   p.locator('#story-line').evaluate('(n,k)=>n.scrollTop=(n.scrollHeight-n.clientHeight)*k',where)
   rect=p.locator('.story-actions').bounding_box();line=p.locator('#story-line').bounding_box();assert line['y']+line['height']<=rect['y']+1;assert p.locator('.story-actions button').evaluate_all('(a)=>a.every(n=>{const r=n.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight&&n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})')
  p.locator('[data-action=dialogue-skip]').click();assert p.evaluate('!HonroApp.dialogue');rows.append({'view':[w,h],'style':style,'manualNextPrevSkip':True,'longBodyOnlyScroll3Positions':True})
 assert not errors; (OUT/'browser.json').write_text(json.dumps({'rows':rows,'errors':errors,'scope':'Existing canonical narration in prepared standard Story reader; repeated text only in stress fixture. Document source, UI and campaign prose untouched.'},ensure_ascii=False,indent=2));b.close();print('PASS narration shape/color, no portrait, next/prev/skip, body-only scroll390/844')
