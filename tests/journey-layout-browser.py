"""Expanded journey sheet coverage and shared pin/path coordinates in real Chromium."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT = ROOT / '_local/reports/journey-layout'
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('HONRO_BASE_URL', '')
checks = []

def inspect(page, label):
    for layer, selected in [('surface', 12), ('underground', 18), ('city', 30)]:
        for zoom in [.85, 1, 1.35]:
            page.evaluate('''([layer,id,zoom])=>{const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.debugMode=true;a.journeyZoom=zoom;HonroRestJourney.showBook(a,id,layer)}''', [layer, selected, zoom])
            result = page.evaluate('''()=>{
              const v=document.querySelector('.journey-map-scroll'),m=v.querySelector('.journey-map'),svg=m.querySelector('svg'),route=m.querySelector('.journey-route-overlay'),f=HonroJourneyArt.bookFrame;
              const pins=[...m.querySelectorAll('.journey-pin')].map(p=>{const loc=HonroJourneyContent.at(+p.dataset.id),x=parseFloat(p.style.left)/100*m.clientWidth,y=parseFloat(p.style.top)/100*m.clientHeight;const point=route.createSVGPoint();point.x=loc.map[0];point.y=loc.map[1];const screen=point.matrixTransform(route.getScreenCTM()),r=m.getBoundingClientRect();return Math.max(Math.abs(screen.x-r.left-x),Math.abs(screen.y-r.top-y))});
              const legend=document.querySelector('.journey-map-legend'),lr=legend.getBoundingClientRect(),vr=v.getBoundingClientRect();
              return {viewport:[v.clientWidth,v.clientHeight],map:[m.clientWidth,m.clientHeight],pinError:Math.max(...pins),legendInside:lr.left>=vr.left&&lr.right<=vr.right&&lr.bottom<=vr.bottom,viewBox:svg.getAttribute('viewBox'),rootOverflow:document.documentElement.scrollWidth>innerWidth};
            }''')
            assert result['map'][0] >= result['viewport'][0] and result['map'][1] >= result['viewport'][1], (label, layer, zoom, result)
            assert result['pinError'] < 1 and result['legendInside'] and not result['rootOverflow'], (label, layer, zoom, result)
            assert result['viewBox'] == '-180 -105 2160 1260'
            checks.append({'label':label,'layer':layer,'zoom':zoom,**result})
            if zoom == .85:
                page.screenshot(path=str(OUT / f'{label}-{layer}.png'))
                for corner in [[0,0],[100000,0],[0,100000],[100000,100000]]:
                    page.locator('.journey-map-scroll').evaluate('(v,p)=>{v.scrollLeft=p[0];v.scrollTop=p[1]}',corner)
                    assert page.locator('.journey-map').evaluate('(m)=>{const v=m.parentElement,r=m.getBoundingClientRect(),b=v.getBoundingClientRect();return r.left<=b.left+1&&r.right>=b.right-18&&r.top<=b.top+1&&r.bottom>=b.bottom-18}')
    print('PASS', label, 'three layers, all zoom bounds, four scroll corners and matching pin coordinates', flush=True)

with sync_playwright() as pw:
    browser = launch(pw)
    for width,height in [(1917,1025),(1440,900),(2560,1080),(390,844),(844,390)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.goto(BASE.rstrip('/')+'/HONRO.html' if BASE else (ROOT/'HONRO.html').as_uri())
        page.wait_for_function('window.HonroApp')
        inspect(page,f'{width}x{height}')
        page.close()
    browser.close()
(OUT/'report.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
