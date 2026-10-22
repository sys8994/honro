"""Stage11 saved battles on the shipped HTML. Chromium simulation, not device data.

HONRO_BATTLE_ROOT selects an immutable build snapshot. RUN names the output.
MODE=profile adds inclusive method timing; use separate unwrapped runs for results.
"""
import gzip, hashlib, json, os, sys, subprocess
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright

build = Path(os.environ.get('HONRO_BATTLE_ROOT', ROOT))
out = ROOT / '_local/reports/battle-runtime'
out.mkdir(parents=True, exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(build)))
Thread(target=server.serve_forever, daemon=True).start()
rows = []
mode = os.environ.get('MODE', 'measure')
with sync_playwright() as p:
    for name in os.environ.get('SAVES', 'round1,round7,round15,round16').split(','):
        path = ROOT / os.environ.get('SAVE_DIR', '_local/reports/battle-runtime/current-saves') / (name+'.json')
        if not path.exists(): path = path.with_suffix('.json.gz')
        raw = gzip.decompress(path.read_bytes()) if path.suffix == '.gz' else path.read_bytes()
        record = json.loads(raw)
        saved = record.get('b', record.get('initial', {}).get('battle'))
        profile = record.get('profile', record.get('initial', {}).get('profile'))
        profile['honroBattle'] = saved; profile['lastStage'] = 11
        # The reused native controller owns engine progression, not the HTML
        # envelope. Supply the two App storage markers without changing battle.
        profile['game'] = 'honro'; profile['schema'] = 4
        profile['settings']['music'] = False; profile['settings']['sound'] = False
        for rep in range(int(os.environ.get('REPS', '1'))):
            # Separate processes prevent earlier saves' compositor resources
            # from contaminating the next saved-battle comparison.
            browser = launch(p)
            ctx = browser.new_context(viewport={'width': int(os.environ.get('WIDTH', '1280')), 'height': int(os.environ.get('HEIGHT', '800'))}, device_scale_factor=1)
            page = ctx.new_page(); errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.add_init_script('localStorage.clear();localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');')
            page.add_init_script('window.seedRandom=()=>{let s=899411;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296)};seedRandom();')
            cd = ctx.new_cdp_session(page)
            cd.send('Emulation.setCPUThrottlingRate', {'rate': float(os.environ.get('CPU', '1'))})
            page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html')
            page.wait_for_function('document.documentElement.dataset.honroReady')
            page.evaluate('window.nativeFrame=HonroApp.frame.bind(HonroApp);HonroApp.frame=()=>{};')
            page.locator('.title-actions button.primary').click()
            page.wait_for_function('HonroApp.engine?.b.honroStage===11')
            assert page.evaluate('HonroApp.engine.b.round') == saved['round'], 'Continue must preserve the checkpoint, never silently restart at entry'
            page.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;window.savedProfile=structuredClone(a.profile);savedProfile.honroBattle=structuredClone(a.engine.b);}''')
            for scenario in os.environ.get('SCENARIOS', 'idle,zoom-in,zoom-out,pan,zoom-cycle,fire').split(','):
                page.evaluate('''()=>{seedRandom();const a=HonroApp;a.profile=structuredClone(savedProfile);a.continue();while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.done=false;a.dirty=false;a.prev=0;a.uiAge=0;const u=a.engine.active;Object.assign(a.scene,{manual:true,x:u.x,y:u.y-140,scale:.68,storyTween:null,goalFocus:null,storyFrozen:false,focusUntil:0,speakerUntil:0});}''')
                page.wait_for_timeout(100)
                data = page.evaluate((ROOT / 'tools/testing/battle-runtime-sample.js').read_text(), {'scenario':scenario, 'profile':mode == 'profile', 'frames':int(os.environ.get('FRAMES', '180'))})
                data.update(save=name, saveSha256=hashlib.sha256(raw).hexdigest(), rep=rep, scenario=scenario, mode=mode, errors=errors.copy())
                rows.append(data)
                print(name, rep, scenario, json.dumps({k:data[k] for k in ['frame','raf','longtask','counts','parts']}), flush=True)
            ctx.close()
            browser.close()
server.shutdown(); server.server_close()
(out / (os.environ.get('RUN', 'before')+'.json')).write_text(json.dumps({'sourceCommit':os.environ.get('HONRO_BATTLE_SHA',subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()),'samplerSha256':hashlib.sha256((ROOT/'tools/testing/battle-runtime-sample.js').read_bytes()).hexdigest(),'buildRoot':str(build),'htmlSha256':hashlib.sha256((build/'HONRO.html').read_bytes()).hexdigest(),'manifestSha256':hashlib.sha256((build/'web/manifest.json').read_bytes()).hexdigest(),'browser':browser.version,'cpu':os.environ.get('CPU','1'),'width':os.environ.get('WIDTH','1280'),'height':os.environ.get('HEIGHT','800'),'rows':rows}, indent=2))
