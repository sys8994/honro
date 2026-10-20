"""Focused production-browser evidence, frozen debug battles; not combat completion.
Serve the repository over HTTP before running; optional URL and label arguments.
"""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'_local/reports/all-stage-far-browser';out.mkdir(exist_ok=True,parents=True)
url=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8842/HONRO.html'
label=sys.argv[2] if len(sys.argv)>2 else 'local'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=__import__('shutil').which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url);p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000)
 rows=[]
 for sid in range(1,31):
  p.evaluate('''async sid=>{await HonroCampaignLoader.ensureStage(sid);let a=HonroApp;a.frame=()=>{};a.isOpen=()=>true;a.profile.settings.music=false;a.profile.settings.sound=false;a.debugMode=true;for(let n=1;n<sid;n++)a.profile.cleared[n]=true;a.launch(sid);}''',sid)
  p.wait_for_function('(sid)=>HonroApp.engine?.b.honroStage===sid',arg=sid)
  p.evaluate('''()=>{let a=HonroApp;a.dialogue=null;a.turnNotice=null;a.close();let s=a.scene,b=a.engine.b,u=b.units.find(u=>u.team==='player'||u.side===0);Object.assign(s,{manual:true,storyTween:null,goalFocus:null,x:u.x+600,y:u.y-230,scale:.65});s.render(a.engine,0,'',.6,false,0);}''')
  p.wait_for_function('(sid)=>HonroAuthoredFarArt.ready(sid)',arg=sid)
  for width,height in [(1440,900),(1920,720),(390,844)]:
   p.set_viewport_size({'width':width,'height':height});p.wait_for_timeout(100)
   for view in ['normal','max-out','max-in']:
    if view=='max-in' and width!=1440:continue
    row=p.evaluate('''view=>{let a=HonroApp,s=a.scene,b=a.engine.b,{w,h}=s.size(),u=b.units.find(u=>u.team==='player'||u.side===0);Object.assign(s,{x:u.x+400,y:u.y-180,scale:view==='normal'?.65:view==='max-in'?HonroBounds.zoomLimits(w).max:HonroBounds.zoomLimits(w).min});const before=JSON.stringify(b);s.render(a.engine,0,'',.6,false,0);const frames=[];for(let [x,y] of [[0,0],[b.width,b.height],[b.width/2,b.height/2]]){const ox=s.x,oy=s.y;s.x=x;s.y=y;s.render(a.engine,0,'',.6,false,0);for(let layer of HonroAuthoredFarArt.frames(s,w,h,b)){let f=layer.frame;frames.push({key:layer.key,covered:f.x<=0&&f.y<=0&&f.x+f.w>=w&&f.y+f.h>=h,...f});}s.x=ox;s.y=oy;}s.render(a.engine,0,'',.6,false,0);return{stage:b.honroStage,view,w,h,scale:s.scale,frames,keys:s.environmentStats.authoredFar,cache:HonroAuthoredFarArt.stats(),pure:before===JSON.stringify(b),vector:!window.HonroVectorCampaignArt};}''',view)
    assert row['pure'];assert row['vector'];assert all(f['covered'] for f in row['frames']);assert row['cache']['entries']<=3;assert row['keys'];assert not row['cache']['errors']
    p.locator('#battlecanvas').screenshot(path=str(out/f'{label}-stage{sid:02}-{width}-{view}.png'));rows.append(row);print(f'stage{sid:02} {width} {view}',flush=True)
  if sid in [7,12,13,14,15,16,17,18,19,20,22,25,26,27,29]:
   p.set_viewport_size({'width':1440,'height':900});p.evaluate("()=>{let a=HonroApp,s=a.scene,b=a.engine.b;Object.assign(s,{x:b.width/2,y:b.height/2,scale:.22});s.render(a.engine,0,'',.6,false,0);}");p.locator('#battlecanvas').screenshot(path=str(out/f'{label}-stage{sid:02}-center.png'))
 p.set_viewport_size({'width':1440,'height':900});p.evaluate('''()=>{let a=HonroApp;a.debugRestStage=3;HonroRestJourney.showRest(a);}''');p.wait_for_timeout(800);p.screenshot(path=str(out/f'{label}-rest03.png'))
 (out/f'{label}-result.json').write_text(json.dumps({'url':url,'rows':rows,'errors':errors},indent=2));print(json.dumps({'rows':len(rows),'errors':errors,'out':str(out)}));b.close();assert not errors,errors
