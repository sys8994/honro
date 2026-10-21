"""Isolated production movement/render fixture for optional east access.
The hero is initially placed on the east road and enemies/NPCs are removed.
This is not a normal combat or campaign victory.
"""
import json,sys,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
source=(root/'tests/tactical-finite-driver.mjs').read_text().replace('export function','function')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8872/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(2);const a=HonroApp;a.frame=()=>{};a.profile.cleared[1]=true;a.launch(2);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;}');p.wait_for_function('HonroAuthoredFarArt.ready(2)',timeout=90000)
 p.evaluate('()=>{const a=HonroApp,e=a.engine,b=e.b;window.__east={b,e};const u=e.heroesAlive()[0];b.units=[u];b.phase="aim";b.active=u.id;b.side=0;e.checkEnd=()=>false;Object.assign(u,{x:2920,y:HONRO_CORE.topAt(b.terrain.find(t=>t.id==="canyon-ground"),2920),vx:0,vy:0});}')
 results=[]
 for name,points in [('root',[{'x':2920,'support':'canyon-ground','jumpTo':{'x':3030,'support':'right-climbing-root'},'delay':16}]),('ledge',[{'x':3300,'support':'right-climbing-root','jumpTo':{'x':3440,'support':'right-descent-stone-low'}}])]:
  r=p.evaluate('(points)=>{'+source+';const q=window.__east,u=q.e.heroesAlive()[0];return drive(window,q,u,points,{jump:false,label:"Isolated east "+points[0].support});}',points);assert r['passed'],r;results.append(r)
  p.evaluate('()=>{const a=HonroApp,s=a.scene;HonroStory.turn(a,true);HonroStory.tick(a,performance.now()+2000);a.turnNotice=null;Object.assign(s,{manual:true,storyTween:null,cinematic:null,goalFocus:null,x:3210,y:2570,scale:.7});s.render(a.engine,0,"",.6,false,0);}');p.locator('#battlecanvas').screenshot(path=str(out/(name+'.png')))
 (out/'route.json').write_text(json.dumps({'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'scope':__doc__,'routes':results},ensure_ascii=False,indent=2));print('PASS isolated browser east route feet/rim/root/ledge with actual Engine jump and move');b.close()
