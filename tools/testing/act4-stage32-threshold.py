"""Controlled Stage 32 threshold regression on a locally built browser bundle.

Fixtures remove enemies and place actors; this is not a playthrough or art approval.
Run the normal release-checked build before using for release verification.
"""
import functools
import http.server
import pathlib
import threading
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parents[2]
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
handler = functools.partial(QuietHandler, directory=str(root))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html')
        page.wait_for_function('!!window.HonroApp')
        result = page.evaluate('''async()=>{
          await HonroCampaignLoader.ensureStage(32);
          const a=HonroApp; a.frame=()=>{};
          for(let n=1;n<32;n++)a.profile.cleared[n]={visits:1,rounds:1};
          a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];
          a.launch(32);a.close();
          const e=a.engine,b=e.b,q=b.honroAct4PreviewState,n=e.unit('a4-shelter-speaker'),hero=e.unit('archer');
          a.dialogue=null;a.modal.classList.remove('open');q.shelterDoor={phase:'open',time:1};
          Object.assign(hero,{x:4650,y:2200});
          Object.assign(a.scene,{manual:true,x:4750,y:2150,scale:.8,storyTween:null,storyFrame:null,cinematic:null,goalFocus:null});
          for(const u of b.units.filter(u=>u.side===1))e.hurt(u,1e6);
          b.phase='aim';b.side=0;b.projectiles=[];b.volley=null;q.quietAt=-10;
          const run=(door,x)=>{
            if(door===null)delete b.honroAct4Design.coords.doorX;else b.honroAct4Design.coords.doorX=door;
            q.observed??={};delete q.observed.threshold;delete q.reunionObserved;delete q.thresholdAt;
            Object.assign(n,{x,y:2200,fixed:false,honroAct4Sheltered:false});
            HonroAct4TerrainPreview.coastObserve(a,.1);a.scene.render(e,0,'',.5,false,0);
            return {x:n.x,fixed:n.fixed,threshold:q.observed?.threshold!==undefined,reunion:!!q.reunionObserved};
          };
          return {authored:run(4790,4785),fallback:run(null,4780)};
        }''')
        for case, row in result.items():
            assert row['fixed'] and row['threshold'] and row['reunion'], (case, row)
        print('PASS Stage 32 authored 4790 and legacy 4780: stopped speaker, visible threshold, reunion observation; controlled fixture')
        browser.close()
finally:
    server.shutdown()
