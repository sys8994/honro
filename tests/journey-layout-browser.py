"""Native artwork and live anchor geometry in actual Chromium; unlocked fixtures."""
import json,os
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/journey-layout';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
with serve_game() as local,sync_playwright() as p:
 b=launch(p)
 for w,h in [(1917,1025),(1440,900),(2560,1080),(390,844),(844,390)]:
  page=b.new_page(viewport={'width':w,'height':h});page.goto(os.environ.get('HONRO_BASE_URL',local).rstrip('/')+'/HONRO.html');page.wait_for_function('window.HonroApp')
  for act,selected in [(1,5),(2,18),(3,25)]:
   page.evaluate('([act,id])=>{HonroApp.debugMode=true;HonroRestJourney.showBook(HonroApp,id,null,act)}',[act,selected]);page.wait_for_function('document.querySelector(".journey-map-image")?.naturalWidth>0')
   for z in [.01,1,1.8]:
    page.evaluate('(z)=>HonroRestJourney.zoomBook(HonroApp,z,0,0)',z)
    r=page.evaluate('''()=>{const v=document.querySelector('.journey-map-scroll'),m=v.querySelector('.journey-map'),r=m.getBoundingClientRect(),d=HonroJourneyImages.definition(HonroApp.journeyAct),legend=document.querySelector('.journey-map-legend').getBoundingClientRect(),vp=v.getBoundingClientRect();return {size:[m.clientWidth,m.clientHeight],native:[d.width,d.height],anchorError:Math.max(...[...m.querySelectorAll('.journey-pin')].map(p=>{const a=d.stages.find(a=>a.stageNumber===+p.dataset.id),i=p.querySelector('i').getBoundingClientRect();return Math.max(Math.abs(i.x+i.width/2-r.x-a.x/d.width*r.width),Math.abs(i.y+i.height/2-r.y-a.y/d.height*r.height));})),legendInside:legend.left>=vp.left&&legend.right<=vp.right&&legend.bottom<=vp.bottom,rootOverflow:document.documentElement.scrollWidth>innerWidth};}''')
    assert abs(r['size'][0]/r['size'][1]-r['native'][0]/r['native'][1])<.005 and r['anchorError']<1 and r['legendInside'] and not r['rootOverflow'],(w,h,act,z,r)
    for corner in [[0,0],[100000,0],[0,100000],[100000,100000]]:
     page.locator('.journey-map-scroll').evaluate('(v,c)=>v.scrollTo(...c)',corner)
     assert page.locator('.journey-map-scroll').evaluate('(v)=>v.scrollLeft>=0&&v.scrollTop>=0&&v.scrollLeft<=Math.max(0,v.scrollWidth-v.clientWidth)&&v.scrollTop<=Math.max(0,v.scrollHeight-v.clientHeight)')
    rows.append({'viewport':[w,h],'act':act,'requestedZoom':z,**r})
  page.close()
 b.close()
(OUT/'report.json').write_text(json.dumps(rows,indent=2));print('PASS native aspect, exact anchors, bounded pan/zoom and legend at five viewports/three acts (fixtures)')
