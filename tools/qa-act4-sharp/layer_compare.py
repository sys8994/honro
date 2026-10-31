"""QA-only layer and direct-vs-cached diagnostic; no release or gameplay claim."""
import argparse, json, sys, threading, functools
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'qa-stage31'))
from candidate_browser import ROOT, launch
p=argparse.ArgumentParser();p.add_argument('--stage',type=int,choices=[34,38],required=True);p.add_argument('--mobile',action='store_true');args=p.parse_args()
project=json.loads((ROOT/f'_local/reports/act4-sharp-browser-inputs/stage{args.stage}.json').read_bytes()); out=ROOT/f'review/act4-sharp-browser/stage{args.stage}'/('diagnostic-mobile' if args.mobile else 'diagnostic');out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':390,'height':844} if args.mobile else {'width':1440,'height':900},device_scale_factor=3 if args.mobile else 1);page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000)
 info=page.evaluate('''project=>{const a=HonroApp;a.frame=()=>{};globalThis.HONRO_PROJECT=project;a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(project.stages[0])};for(let i=1;i<=30;i++)a.profile.cleared[i]={};a.profile.settings.sound=false;a.profile.settings.music=false;a.launchMap(project,project.activeStageId,{story:false});for(let i=0;a.dialogue&&i<80;i++)HonroStory.finish(a);a.close();a.turnNotice=null;const s=a.scene,b=a.engine.b;Object.assign(s,{x:b.width/2,y:b.height/2,scale:0.65,manual:true,time:0,storyTween:null,goalFocus:null,cinematic:null});window._originalLandmark=s.landmark.bind(s);s.render(a.engine,0,'',.6,false,0);return {landmarks:b.honroLandmarks.map(l=>({id:l.id,asset:l.asset?.id,layer:l.layer,nativeArtLayer:l.nativeArtLayer})),far:b.honroMap?.nativeArt?.far};}''',project)
 page.wait_for_timeout(1500)
 if args.mobile: page.evaluate('''()=>{let s=HonroApp.scene;Object.assign(s,{x:-320,y:2304,scale:HonroBounds.zoomLimits(innerWidth).min});HonroBounds.constrain(s,HonroApp.engine.b)}''')
 def shot(mode):
  extra=page.evaluate('''mode=>{let a=HonroApp,s=a.scene,b=a.engine.b;s.landmark=function(c,l,...rest){if(mode==='no-body'&&l.nativeArtLayer==='body'||mode==='no-structure'&&l.nativeArtLayer==='structure'||mode==='no-front'&&l.nativeArtLayer==='front'||mode==='no-landmarks')return;return window._originalLandmark(c,l,...rest)}; b.sceneVersion=(b.sceneVersion||0)+1; if(mode==='direct'){s._drawStaticWorldCached=function(c,b,w,h){this._landmarkLayer(c,b.honroLandmarks||[],'back');this._landmarkLayer(c,b.honroLandmarks||[],'structural-back');for(const t of b.terrain||[])if(!t.broken)this.terrain(c,t);this.surfaceZones?.(c,b);for(const layer of ['mid','prop','front'])this._landmarkLayer(c,b.honroLandmarks||[],layer);this.terrainReadability?.(c,b)};}s.render(a.engine,0,'',.6,false,0);return {x:s.x,y:s.y,scale:s.scale,far:HonroAuthoredFarArt.frames(s,innerWidth,innerHeight,b),stats:s.environmentStats};}''',mode)
  page.locator('#battlecanvas').screenshot(path=str(out/f'{mode}.png'));return extra
 modes=['baseline','no-body','no-structure','no-front','no-landmarks','direct'] if args.stage==38 else ['baseline','direct']
 info['shots']={m:shot(m) for m in modes};(out/'results.json').write_text(json.dumps(info,indent=2,ensure_ascii=False)+'\n');browser.close()
server.shutdown()
