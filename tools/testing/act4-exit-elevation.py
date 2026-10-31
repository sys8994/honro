"""Controlled actual browser exit-height checks; not a normal playthrough."""
import functools, http.server, pathlib, threading
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2]
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':900})
  page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('!!window.HonroApp')
  for n in (33,34,37,38):
   r=page.evaluate('''async n=>{
    await HonroCampaignLoader.ensureStage(n);const a=HonroApp;a.frame=()=>{};
    for(let i=1;i<n;i++)a.profile.cleared[i]={visits:1,rounds:1};
    a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];
    a.launch(n);a.close();a.dialogue=null;const e=a.engine,b=e.b,q=b.honroAct4PreviewState,exit=b.honroAct4Design.exit;
    q.events.signal={terminal:true,presented:[]};b.phase='aim';b.side=0;b.active='archer';
    const us=b.units.filter(u=>u.side===0),points=us.map((u,i)=>exit.x-180+i*40);
    function place(far){return us.map((u,i)=>{const x=points[i];const surfaces=b.terrain.flatMap(t=>HONRO_CORE.terrainSurfaces(t,x)).sort((v,w)=>Math.abs(v.y-exit.y)-Math.abs(w.y-exit.y));const y=far?surfaces.find(v=>Math.abs(v.y-exit.y)>300)?.y:surfaces[0]?.y;if(y===undefined)throw Error('fixture has no distinct surface '+n+' x='+x);Object.assign(u,{x,y,vx:0,vy:0});return {x,y,grounded:e.grounded(u)}})}
    const near=place(false),nearAllowed=HonroAct4TerrainPreview.interact(a,true),far=place(true),farAllowed=HonroAct4TerrainPreview.interact(a,true);
    // Explicit unit contrast: force only the grounded predicate, keeping the far
    // positions identical. This is not a claim of real ground at that height.
    const originalGrounded=e.grounded; e.grounded=()=>true;
    const legacyWouldAllow=us.every(v=>v.x>exit.x-300&&e.grounded(v));
    const farForcedAllowed=HonroAct4TerrainPreview.interact(a,true);e.grounded=originalGrounded;
    return {exit,near,nearAllowed,far,farAllowed,legacyWouldAllow,farForcedAllowed};
   }''',n)
   assert all(x['grounded'] for x in r['near']), (n,r)
   if n != 34: assert all(x['grounded'] for x in r['far']), (n,r)
   assert r['nearAllowed'] and not r['farAllowed'], (n,r)
   assert r['legacyWouldAllow'] and not r['farForcedAllowed'], (n,r)
   print(f"PASS {n}: exit level accepted, separated level rejected; far grounded={all(x['grounded'] for x in r['far'])}; forced-ground unit contrast confirms height; no walking proof")
  browser.close()
finally: server.shutdown()
