"""Isolated fixed render metering: prepare/tile/screen/direct paths, not gameplay FPS."""
import argparse,hashlib,json,shutil,subprocess,sys,threading
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
INIT="""async()=>{await HonroCampaignLoader.ensureStage(11);const a=HonroApp;a.frame=()=>{};a.profile=HONRO_CORE.defaults();a.profile.recruited=['archer','mage','knight','occultist'];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=HonroProgression.xpAt(HonroProgression.plan(11).entryLevel);a.profile.settings.music=false;a.profile.settings.sound=false;a.stageId=11;a.stage=HONRO_CONTENT.stages[10];a.dialogue=null;a.mount(HonroMaps.createBattle(HONRO_PROJECT.stages[10],HONRO_PROJECT,a.profile));while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);while(a.dialogue)HonroStory.finish(a);a.dialogue=null;a.turnNotice=null;}"""
VIEWS=[dict(name='west',x=3200,y=6650,z=.18),dict(name='central',x=7290,y=7080,z=.43),dict(name='refuge',x=10350,y=8470,z=.5)]
def instrument(source):
    # Exact checked replacements fail closed if the module's shape changes.
    swaps={
      'const C=G.HONRO_CORE,cache=new WeakMap();':'const C=G.HONRO_CORE;let cache=new WeakMap();',
      'function prepare(t,b){':'function prepare(t,b){const __p=performance.now();G.__s11Meter.counts.prepareCalls++;',
      'let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;':'let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion){G.__s11Meter.counts.prepareHits++;G.__s11Meter.counts.prepareMs+=performance.now()-__p;return q;}G.__s11Meter.counts.prepareMisses++;',
      'cache.set(t,q);return q;':'cache.set(t,q);G.__s11Meter.counts.prepareMs+=performance.now()-__p;return q;',
      'if(!active(b)||!t.honroRavine)return false;':'if(!active(b)||!t.honroRavine)return false;const __m=performance.now();G.__s11Meter.depth++;G.__s11Meter.counts.materialCalls++;',
      'c.restore();return true;':'c.restore();G.__s11Meter.counts.materialMs+=performance.now()-__m;G.__s11Meter.depth--;return true;'
    }
    for old,new in swaps.items():
        assert source.count(old)==1,old
        source=source.replace(old,new)
    # Production already installed the routeSigns hook. Replacing the material
    # test module must not wrap liveWater a second time.
    a=source.index('const live=G.HonroScene.prototype.liveWater;');b=source.index('G.HonroStage11LandscapeArt=',a)
    return source[:a]+'G.__s11ResetPrepare=()=>{cache=new WeakMap();};\n'+source[b:]
def main():
    ap=argparse.ArgumentParser();ap.add_argument('label');ap.add_argument('targets',nargs='+',help='name:absolute-source-root');ns=ap.parse_args()
    targets={};servers=[]
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    for item in ns.targets:
        name,path=item.split(':',1);root=Path(path).resolve();server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start();servers.append(server)
        source=(root/'shared/runtime/stage11-landscape-art.js').read_text();targets[name]={'root':root,'url':f'http://127.0.0.1:{server.server_port}','source':source,'instrumented':instrument(source)}
    rows=[];errors=[]
    names=list(targets);order=names+list(reversed(names)) # paired forward/reverse; targets alternate between visits
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for visit,name in enumerate(order):
          target=targets[name];page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
          page.on('pageerror',lambda e:errors.append(str(e)))
          page.goto(target['url']+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=90000);page.evaluate(INIT);page.wait_for_function('HonroAuthoredFarArt.ready(11)',timeout=90000)
          page.evaluate((ROOT/'tools/testing/stage11-material-probe.js').read_text());page.evaluate(target['instrumented'])
          for view in VIEWS:
            row=page.evaluate('v=>stage11MaterialProbe.run(v)',view);row.update(target=name,visit=visit);rows.append(row);print(name,visit,view['name'],flush=True)
          page.close()
        browser.close()
      out=ROOT/'game/docs/stage11-vector-art-20261022/evidence';out.mkdir(parents=True,exist_ok=True)
      report={'label':ns.label,'scope':'Instrumented fixed production Scene render; dt/effectDt=0, time=10, fixed battle/poses/viewport, far image ready. No engine step, gameplay FPS or GPU completion claim. Instrumentation overhead is included in timings; counts distinguish draw paths. Fresh samples reset only the stage11 prepare cache and create a new battle/Scene.','order':order,'targets':{n:{'root':str(t['root']),'rendererSha256':hashlib.sha256(t['source'].encode()).hexdigest(),'campaignSha256':hashlib.sha256((t['root']/'shared/data/campaign.json').read_bytes()).hexdigest()}for n,t in targets.items()},'errors':errors,'rows':rows}
      (out/(ns.label+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');assert not errors
    finally:
      for server in servers:server.shutdown();server.server_close()
if __name__=='__main__':main()
