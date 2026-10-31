import json,sys,hashlib,threading,functools
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
import argparse
from candidate_browser import ROOT, DEFAULT_CANDIDATE, launch
parser=argparse.ArgumentParser(description='Static art capture; freezes frame and dismisses intro; NOT gameplay')
parser.add_argument('--candidate',type=Path,default=DEFAULT_CANDIDATE);parser.add_argument('--out',type=Path,default=ROOT/'_local/reports/stage31-static-capture');args=parser.parse_args()
root=ROOT;file=args.candidate.resolve();raw=file.read_bytes();project=json.loads(raw);out=args.out;out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}';rows=[];errors=[]
with sync_playwright() as p:
 browser=launch(p)
 for w,h in [(1440,900),(390,844)]:
  ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append({'text':m.text,'location':m.location}) if m.type=='error' else None)
  try:
   page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000)
   entry=page.evaluate('''project=>{const a=HonroApp;a.frame=()=>{};globalThis.HONRO_PROJECT=project;a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(project.stages[0])};for(let i=1;i<=30;i++)a.profile.cleared[i]={};a.profile.settings.sound=false;a.profile.settings.music=false;a.launchMap(project,project.activeStageId,{story:false});for(let i=0;a.dialogue&&i<80;i++)HonroStory.finish(a);a.close();a.turnNotice=null;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;const e=a.engine,b=e.b;return {stage:b.honroStage,preview:b.honroAct4Preview,custom:b.honroCustom,units:b.units.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id})),terrain:b.terrain.length,landmarks:b.honroLandmarks?.length,water:b.honroAct4Design?.waterPolicies,scaleBounds:HonroBounds.zoomLimits(innerWidth),environment:b.honroMap?.nonplayEnvironment};}''',project)
   shots=[('normal-entry',1100,2700,.65),('normal-center',3456,2850,.65),('normal-right',5800,3000,.65),('whole',3456,2600,.20),('min-left-bottom',0,4608,None),('min-right-bottom',6912,4608,None)] if w==1440 else [('portrait-entry',1000,2700,.62),('portrait-center',3456,2850,.62),('portrait-min-left-bottom',0,4608,None),('portrait-min-right-bottom',6912,4608,None)]
   entry['viewport']=[w,h];entry['shots']=[];rows.append(entry)
   for name,x,y,z in shots:
    info=page.evaluate('''q=>{const a=HonroApp,s=a.scene,b=a.engine.b;Object.assign(s,{x:q.x,y:q.y,scale:q.z??HonroBounds.zoomLimits(innerWidth).min,manual:true,time:0,storyTween:null,goalFocus:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);return {x:s.x,y:s.y,scale:s.scale,viewport:HonroBounds.viewport(s,s.canvas.clientWidth,s.canvas.clientHeight)};}''',{'x':x,'y':y,'z':z});page.locator('#battlecanvas').screenshot(path=str(out/f'{name}.png'));entry['shots'].append({'name':name,**info})
   page.screenshot(path=str(out/f'ui-{w}x{h}.png'))
  except Exception as ex:rows.append({'viewport':[w,h],'error':str(ex)})
  ctx.close()
 browser.close()
server.shutdown();server.server_close()
result={'candidateSha256':hashlib.sha256(raw).hexdigest(),'candidateBytes':len(raw),'scope':'Local browser QA import and static engine/render/grounding only, not ordinary story/combat/boarding or deployed build','rows':rows,'errors':errors};(out/'results.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(json.dumps(result,ensure_ascii=False))
if any('error' in row for row in rows) or any(isinstance(error, str) for error in errors):
 raise SystemExit('Static capture encountered a page error; inspect results.json')
