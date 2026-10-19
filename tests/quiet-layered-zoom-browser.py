"""Focused real pinch/render regression for the image-first camera override."""
import json, sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

baseline = '--baseline' in sys.argv
out = ROOT / '_local/reports/zoom-startup'
out.mkdir(parents=True, exist_ok=True)
rows, errors = [], []
with sync_playwright() as pw:
    browser = launch(pw)
    page = browser.new_page(viewport={'width':390, 'height':844}, is_mobile=True, has_touch=True)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(story_base_url()+'/HONRO.html')
    page.wait_for_function('document.documentElement.dataset.honroReady')
    page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.launch(1);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,storyFrozen:false,focusId:null,speakerId:null,x:2600,y:1300,scale:.66});a.scene.render(a.engine,0,'',.7,false,0);}''')
    page.wait_for_function('HonroStage1ImageFirstArt.ready(HonroApp.engine.b)')
    session = page.context.new_cdp_session(page)
    box = page.locator('#battlecanvas').bounding_box()
    cx, cy = box['x']+box['width']/2, box['y']+box['height']/2
    def touches(gap):
        return [{'x':cx-gap,'y':cy,'id':1},{'x':cx+gap,'y':cy,'id':2}]
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':touches(80)})
    for gap in [60,40,20,10,4]:
        session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':touches(gap)})
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    row = page.evaluate('''()=>{const a=HonroApp,s=a.scene,b=a.engine.b,before=JSON.stringify(b),inputScale=s.scale,frames=[];for(let i=0;i<3;i++){s.render(a.engine,0,'A01',.7,true,0);frames.push(s.scale);}return{viewport:'portrait',inputScale,frames,min:HonroBounds.zoomLimits(s.size().w).min,contacts:a.contacts.size,battleUnchanged:before===JSON.stringify(b)};}''')
    if not baseline:
        assert all(abs(z-row['min'])<1e-8 for z in [row['inputScale'],*row['frames']]), row
        assert row['contacts']==0 and row['battleUnchanged'], row
    rows.append(row)
    page.locator('#battlecanvas').screenshot(path=str(out/('zoom-baseline.png' if baseline else 'zoom-portrait.png')))
    page.set_viewport_size({'width':844,'height':390})
    page.evaluate('''()=>{const a=HonroApp,s=a.scene;s.render(a.engine,0,'',.7,false,0);s.scale=.5;s.manual=true;s.x=2600;s.y=1300;s.storyTween=null;s.render(a.engine,0,'A01',.7,true,0);}''')
    box=page.locator('#battlecanvas').bounding_box()
    page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5)
    page.mouse.down();page.mouse.move(box['x']+box['width']*.6,box['y']+box['height']*.5,steps=4);page.mouse.up()
    row=page.evaluate('''()=>{const a=HonroApp,s=a.scene,b=a.engine.b,p={x:s.x,y:s.y,z:s.scale},prediction=JSON.stringify(a.engine.predict(a.engine.active,HONRO_CORE.SKILLS.A01,55,.7));s.render(a.engine,0,'A01',.7,true,0);return{viewport:'landscape',before:p,after:{x:s.x,y:s.y,z:s.scale},panned:Math.abs(s.x-2600)>5,predictionUnchanged:prediction===JSON.stringify(a.engine.predict(a.engine.active,HONRO_CORE.SKILLS.A01,55,.7))};}''')
    if not baseline: assert row['panned'] and row['before']==row['after'] and row['predictionUnchanged'],row
    rows.append(row)
    assert not errors,errors
    browser.close()
(out/('zoom-baseline.json' if baseline else 'zoom.json')).write_text(json.dumps({'rows':rows,'errors':errors},indent=2)+'\n')
print(json.dumps(rows))
