"""Separate exact Chromium pixel, save/Continue and repeated-cache checks.
Requires immutable baseline HONRO_BATTLE_BEFORE and current shipped build.
"""
import base64,gzip,hashlib,json,os,sys
from PIL import Image,ImageChops,ImageStat
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/battle-runtime';OUT.mkdir(parents=True,exist_ok=True)
servers=[];urls={}
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def handle(self):
        try:super().handle()
        except (BrokenPipeError,ConnectionResetError):pass
for label,root in [('before',os.environ.get('HONRO_BATTLE_BEFORE','/tmp/honro-performance-before')),('after',ROOT)]:
    s=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(root)));Thread(target=s.serve_forever,daemon=True).start();servers.append(s);urls[label]=f'http://127.0.0.1:{s.server_port}/HONRO.html'
rows=[]
with sync_playwright() as p:
    browser=launch(p)
    for name in os.environ.get('SAVES','round1,round7,round15,round16').split(','):
        path=ROOT/os.environ.get('SAVE_DIR','_local/reports/battle-runtime/current-saves')/(name+'.json')
        if not path.exists():path=path.with_suffix('.json.gz')
        raw=gzip.decompress(path.read_bytes()) if path.suffix=='.gz' else path.read_bytes();record=json.loads(raw)
        profile=record['profile'];profile.update(game='honro',schema=4,lastStage=11,honroBattle=record['b']);profile['settings'].update(music=False,sound=False)
        images={};checks={};pixels={};dimensions=None
        for label in ['before','after']:
            ctx=browser.new_context(viewport={'width':int(os.environ.get('WIDTH','1280')),'height':int(os.environ.get('HEIGHT','800'))},device_scale_factor=1);pg=ctx.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
            pg.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');')
            pg.goto(urls[label]);pg.wait_for_function('document.documentElement.dataset.honroReady');pg.evaluate('HonroApp.frame=()=>{}');pg.locator('.title-actions button.primary').click();pg.wait_for_function('HonroApp.engine?.b.honroStage===11');assert pg.evaluate('HonroApp.engine.b.round')==record['b']['round']
            contract=pg.evaluate((ROOT/'tools/testing/battle-runtime-cache-check.js').read_text()) if label=='after' else None
            pg.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const u=a.engine.active;Object.assign(a.scene,{manual:true,x:u.x,y:u.y-140,scale:.68,time:2,storyTween:null,goalFocus:null,storyFrozen:false,focusUntil:0,speakerUntil:0});a.updateHUD(true);}''')
            pg.wait_for_function('HonroAct2SpatialArt.ready(HonroApp.engine.b)')
            data=pg.evaluate('''()=>{const a=HonroApp,e=a.engine,s=a.scene,base={x:s.x,y:s.y};const snapshots=[];const state=()=>JSON.stringify({round:e.b.round,phase:e.b.phase,active:e.b.active,units:e.b.units,heroes:e.b.heroes,projectiles:e.b.projectiles,terrain:e.b.terrain,objectives:e.b.honroObjectives,flags:e.b.honroState,growth:e.b.honroGrowth,items:e.b.items});const before=state();
              for(let i=0;i<180;i++){s.x=base.x+[0,650,-650,0][Math.floor(i/5)%4];s.scale=[.32,.5,.68,1,1.35,.68][Math.floor(i/5)%6];s.render(e,0,'',.6,false,0);if(i%30===29||i===0)snapshots.push({i,cache:s.renderCacheStats(),tiles:s._domainTiles?.tiles.size||0});}
              const renderPreserved=before===state();a.profile.honroBattle=structuredClone(e.b);a.persist();a.continue();const continuePreserved=before===state()&&JSON.stringify(e.b.units)===JSON.stringify(a.engine.b.units);return{renderPreserved,continuePreserved,snapshots,round:e.b.round,error:a.lastError||null};}''')
            assert data['renderPreserved'] and data['continuePreserved'] and not data['error'] and not errors,data
            # Continue creates a new Scene. Compare the same view after recycling
            # against a fresh cache, then compare both complete shipped builds.
            shots=[];pixels[label]=[]
            for index,scale in enumerate([.32,.5,.68,1,1.35,.68,.32]):
                payload=pg.evaluate('''z=>{const a=HonroApp,s=a.scene,u=a.engine.active;Object.assign(s,{manual:true,x:u.x,y:u.y-140,scale:z,time:2,storyTween:null,goalFocus:null,storyFrozen:false,focusUntil:0,speakerUntil:0});s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);const d=s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data;let b='';for(let i=0;i<d.length;i+=16384)b+=String.fromCharCode(...d.subarray(i,i+16384));return btoa(b);}''',scale)
                raw_pixels=base64.b64decode(payload);pixels[label].append(raw_pixels);shots.append(hashlib.sha256(raw_pixels).hexdigest())
                dimensions=pg.evaluate('[HonroApp.scene.canvas.width,HonroApp.scene.canvas.height]')
                if index in [2,4]:pg.screenshot(path=str(OUT/f'{label}-{name}-{index}.jpg'),type='jpeg',quality=90)
            # Exercise the actual storage read and mount boundary as well.
            pg.evaluate('HonroApp.profile.honroBattle=structuredClone(HonroApp.engine.b);HonroApp.persist();')
            protected=pg.evaluate('({units:HonroApp.engine.b.units,heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared,round:HonroApp.engine.b.round,items:HonroApp.engine.b.items})')
            pg.reload();pg.wait_for_function('document.documentElement.dataset.honroReady');pg.evaluate('HonroApp.frame=()=>{}');pg.locator('.title-actions button.primary').click();pg.wait_for_function('HonroApp.engine?.b.honroStage===11')
            restored=pg.evaluate('({units:HonroApp.engine.b.units,heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared,round:HonroApp.engine.b.round,items:HonroApp.engine.b.items})')
            assert protected==restored,(name,label,'Storage reload must preserve battle and growth')
            images[label]=shots;checks[label]={**data,'errors':errors,'storageReloadPreserved':True,'cacheContract':contract}
            ctx.close()
        comparisons=[]
        for i,(left,right) in enumerate(zip(pixels['before'],pixels['after'])):
            diff=ImageChops.difference(Image.frombytes('RGBA',tuple(dimensions),left),Image.frombytes('RGBA',tuple(dimensions),right))
            max_channel=max(v[1] for v in diff.getextrema());mean=sum(ImageStat.Stat(diff).sum)/(len(left))
            comparisons.append({'view':i,'exact':left==right,'maxChannelDifference':max_channel,'meanChannelDifference':mean,'bbox':diff.convert('RGB').getbbox()})
            assert max_channel<=2,(name,i,'Native-resolution alpha compositing must stay within rounding error',max_channel)
        rows.append({'save':name,'saveSha256':hashlib.sha256(raw).hexdigest(),'pixelsExact':images['before']==images['after'],'comparisons':comparisons,'pixelSha256':images,'checks':checks});print(name,json.dumps(comparisons),flush=True)
    browser.close()
for s in servers:s.shutdown();s.server_close()
(OUT/os.environ.get('PIXEL_OUT','pixels.json')).write_text(json.dumps(rows,indent=2))
