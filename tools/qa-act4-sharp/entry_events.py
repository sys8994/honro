"""QA entry with real story loader; dismiss story and sample event landmarks after settling."""
import argparse,json,sys,threading,functools,hashlib
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'qa-stage31'))
from candidate_browser import ROOT,launch
parser=argparse.ArgumentParser();parser.add_argument('--stages',nargs='+',type=int,default=[31,34,35,36,37]);args=parser.parse_args()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=launch(pw)
 for n in args.stages:
  out=ROOT/f'review/act4-sharp-browser/stage{n}/entry';out.mkdir(parents=True,exist_ok=True);raw=(ROOT/f'_local/reports/act4-sharp-browser-inputs/stage{n}.json').read_bytes();project=json.loads(raw);errors=[];page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000)
  page.evaluate('''p=>{let a=HonroApp;globalThis.HONRO_PROJECT=p;let m=p.stages.find(s=>s.id===p.activeStageId),profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(m)};for(let i=1;i<m.metadata.stageId;i++)profile.cleared[i]={};profile.settings.sound=false;profile.settings.music=false;a.launchMap(p,m.id,{profile});}''',project)
  page.wait_for_timeout(1000)
  for _ in range(20):
   page.evaluate('''()=>{if(HonroApp.dialogue)HonroStory.finish(HonroApp);}''');page.wait_for_timeout(250)
  page.wait_for_timeout(500)
  state=page.evaluate('''()=>{let a=HonroApp,e=a.engine,b=e.b;a.frame=()=>{};a.close();a.turnNotice=null;return {phase:b.phase,dialogue:!!a.dialogue,stage:b.honroStage,landmarks:(b.honroLandmarks||[]).map(l=>({id:l.id,asset:l.asset?.id,layer:l.layer,native:l.nativeArtLayer,x:l.x,y:l.y})),dynamic:(b.honroAct4PreviewDynamic||[]).map(l=>({id:l.id,asset:l.asset?.id,x:l.x,y:l.y})),units:b.units.map(u=>({id:u.id,kind:u.kind,side:u.side,x:u.x,y:u.y,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id}))};}''')
  page.screenshot(path=str(out/'entry.png'))
  rows=[]
  for item in state['landmarks']+state['dynamic']:
   if item.get('native') or item.get('x') is None or item.get('y') is None:continue
   i=len(rows); info=page.evaluate('''q=>{let a=HonroApp,s=a.scene;Object.assign(s,{x:q.x,y:q.y,scale:.65,manual:true,storyTween:null,goalFocus:null,cinematic:null});HonroBounds.constrain(s,a.engine.b);s.render(a.engine,0,'',.6,false,0);return {x:s.x,y:s.y,scale:s.scale};}''',item);page.locator('#battlecanvas').screenshot(path=str(out/f'landmark-{i}.png'));rows.append({'landmark':item,**info,'file':f'landmark-{i}.png'})
  (out/'results.json').write_text(json.dumps({'candidateSha256':hashlib.sha256(raw).hexdigest(),'scope':'Story started normally then dismissed; stationary event/landmark inspection, not gameplay completion','state':state,'shots':rows,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');print(n,len(rows),errors,flush=True);page.close()
 browser.close()
server.shutdown()
