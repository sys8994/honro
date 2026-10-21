import sys,json,os
from pathlib import Path
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tests'))
from browser_support import launch
from story_browser_server import story_base_url
from playwright.sync_api import sync_playwright
O=R/'_local/reports/entry-render';O.mkdir(parents=True,exist_ok=True);save=json.loads(Path(os.environ['HONRO_ENTRY_SAVE']).read_text());rows=[]
with sync_playwright() as p:
 b=launch(p)
 for kind in ['new','continue21']:
  for rep in range(3):
   c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);pg=c.new_page()
   if kind=='continue21':pg.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(save))+')')
   cd=c.new_cdp_session(pg);cd.send('Emulation.setCPUThrottlingRate',{'rate':4});pg.goto(story_base_url()+'/HONRO.html');pg.wait_for_function('document.documentElement.dataset.honroReady')
   pg.evaluate('''()=>{window.parts=[];window.frameId=0;window.clicked=0;function wrap(o,k,label=k,extra=()=>({})){const f=o[k];if(typeof f!=='function')return;o[k]=function(...a){const t=performance.now();try{return f.apply(this,a)}finally{if(clicked&&frameId<4)parts.push({key:label,frame:frameId,ms:performance.now()-t,...extra(this,a)})}}}for(const k of ['continue','start','mount','showRest','updateHUD','drawPortraits','updateAudio','persist'])wrap(HonroApp,k);for(const k of ['getImageData','drawImage'])wrap(CanvasRenderingContext2D.prototype,k,k,(c,a)=>({w:c.canvas.width,h:c.canvas.height}));wrap(HTMLCanvasElement.prototype,'toDataURL');wrap(HonroScene.prototype,'unit','unit',(c,a)=>({portrait:!!a[1]?.portraitOnly,cls:a[1]?.cls}));for(const k of ['background','_drawTerrainDomainTiles','occludedUnitSilhouettes'])wrap(HonroScene.prototype,k);const f=HonroScene.prototype.render;HonroScene.prototype.render=function(...a){frameId++;const t=performance.now();try{return f.apply(this,a)}finally{if(frameId<4)parts.push({key:'render',frame:frameId,ms:performance.now()-t})}};document.addEventListener('click',()=>{clicked=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>window.finished=performance.now()))},{once:true,capture:true});}''')
   pg.locator('.title-actions button.primary').click();pg.wait_for_function('window.finished');r=pg.evaluate('({entry:finished-clicked,parts,screen:HonroApp.screen})');r.update(kind=kind,rep=rep);rows.append(r);print(kind,rep,round(r['entry']),flush=True);c.close()
 b.close()
(O/(os.environ.get('RUN','profile-before')+'.json')).write_text(json.dumps(rows,indent=2))
