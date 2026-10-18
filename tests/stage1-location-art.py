"""Stage1-only real Chromium art checks. Serve repository via HTTP first.
Captures are fixtures for visual review, not normal-combat completion evidence.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/stage1-location-paint'
OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('HONRO_TEST_URL','http://127.0.0.1:8000/HONRO.html')
errors=[]
with sync_playwright() as p:
    browser=launch(p)
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL)
    page.wait_for_function('window.HonroApp')
    page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();a.launch(1);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.banterCurrent=null;a.modal.classList.remove('open');const s=a.scene;s.storyTween=null;s.goalFocus=null;s.cinematic=null;s.manual=true;HonroStory.tick(a,performance.now()+10000);document.getElementById('turn-banner')?.remove();a.updateHUD(true);s.render(a.engine,0);}''')
    page.wait_for_function('HonroStage1LocationArt.ready() && ["forestFar","pineA","pineB","dead","roots"].every(HonroPaintedPilots.ready)')
    initial=page.evaluate('''()=>{const a=HonroApp;window.artBattleBefore=JSON.stringify(a.engine.b);return{camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},mapRevision:a.engine.b.honroCampaignMapRevision,water:JSON.stringify(a.engine.b.honroSurfaceZones?.filter(z=>/water|current/.test(z.kind))),exit:a.engine.b.honroMapAnchors?.exit,assets:Object.keys(HonroPaintedPilots.images)}}''')
    def capture(name,view=None):
        page.evaluate('''v=>{const a=HonroApp,s=a.scene;if(v)Object.assign(s,{x:v[0],y:v[1],scale:v[2]});s.render(a.engine,0);s.render(a.engine,0);}''',view)
        page.screenshot(path=str(OUT/(name+'.png')))
    capture('stage1-default')
    capture('stage1-great-pine-creek',[2350,1250,.68])
    capture('stage1-zoom-out',[2650,1200,.3])
    capture('stage1-east-pass',[5000,530,.72])
    page.set_viewport_size({'width':480,'height':900})
    capture('stage1-mobile',[2350,1280,.56])
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.set_viewport_size({'width':1440,'height':900})
    cache=page.evaluate('''()=>{const a=HonroApp,s=a.scene;Object.assign(s,{x:2350,y:1250,scale:.68});s.render(a.engine,0);s.render(a.engine,0);const before={...s._cacheStats},tiles=s._domainTiles.tiles.size,bg=s._screenBackgroundCache.canvas,world=s._screenWorldCache.canvas;let filters=0;const desc=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'filter');Object.defineProperty(CanvasRenderingContext2D.prototype,'filter',{...desc,set(v){if(v!=='none')filters++;return desc.set.call(this,v);}});try{for(let i=0;i<24;i++)s.render(a.engine,0);}finally{Object.defineProperty(CanvasRenderingContext2D.prototype,'filter',desc);}return{before,after:s._cacheStats,tilesBefore:tiles,tilesAfter:s._domainTiles.tiles.size,backgroundReused:bg===s._screenBackgroundCache.canvas,worldReused:world===s._screenWorldCache.canvas,filters,statePure:window.artBattleBefore===JSON.stringify(a.engine.b)};}''')
    assert cache['statePure'] and cache['filters']==0,cache
    assert cache['backgroundReused'] and cache['worldReused'],cache
    assert cache['tilesBefore']==cache['tilesAfter']<=48,cache
    assert cache['before']['worldBuilds']==cache['after']['worldBuilds'],cache
    assert not any(n in initial['assets'] for n in ['bellRear','depotRear','underground']),initial
    # Exact SKY coverage including far pans and zoom extremes; no world rectangle.
    sky=page.evaluate('''()=>{const b=HonroApp.engine.b,rows=[];for(const [w,h] of [[1440,900],[480,900],[844,390]])for(const x of [-2000,0,b.width,b.width+2000])for(const y of [-1200,b.height+2000]){const q=HonroEnvironment.act1BackdropFrame({x,y,scale:.25},w,h,b,2048,1024);if(q.x>0||q.y>0||q.x+q.w<w||q.y+q.h<h)throw Error('Uncovered sky');rows.push([w,h,x,y]);}return rows.length;}''')
    # Engine fixture only: ordinary ground movement plus the retained low-root
    # jump. Fixture placement is explicit and is not campaign traversal evidence.
    movement=page.evaluate('''()=>{const C=HONRO_CORE,a=HonroApp,b=structuredClone(a.engine.b),e=new C.Engine(b),u=e.active;const floor=b.terrain.find(t=>t.id==='forest-floor'),root=b.terrain.find(t=>t.id==='fc-choice-1-low-pine-root');b.units=[u];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;Object.assign(u,{x:250,y:C.topAt(floor,250),vx:0,vy:0,jumping:false,airborne:false,acted:false,moveLeft:10000});const x0=u.x;for(let n=0;n<60;n++){e.walk(u,1,1/120);e.integrateBody(u,1/120,true);}const walk={from:x0,to:u.x,grounded:e.grounded(u)};Object.assign(u,{x:2101,y:C.topAt(floor,2101),vx:0,vy:0,jumping:false,airborne:false,acted:false,moveLeft:10000});const jumped=e.jump(u);let min=u.y,landed=false;for(let n=0;n<360;n++){e.integrateBody(u,1/120,true);min=Math.min(min,u.y);if(n>2&&e.grounded(u)){landed=true;break;}}return{walk,jumped,min,landed,landingY:u.y,rootY:C.topAt(root,u.x),branches:b.terrain.filter(t=>t.mat==='wood').map(t=>({id:t.id,oneWay:t.oneWay,hp:t.hp,maxHp:t.maxHp})),exit:b.honroMapAnchors?.exit};}''')
    assert movement['walk']['to']>movement['walk']['from'] and movement['walk']['grounded'],movement
    assert movement['jumped'] and movement['landed'] and abs(movement['landingY']-movement['rootY'])<1, movement
    # Debug overlay is still a separate production switch; presentation does
    # not replace its source or store the setting in a battle.
    debug=page.evaluate('''()=>{const a=HonroApp;const before={...a.scene.viewOptions},key=a.scene._worldCacheKey(a.engine.b,innerWidth);a.scene.viewOptions={...before,debugTerrainOutline:true};a.scene.render(a.engine,0);a.scene.viewOptions=before;return typeof a.scene.collisionTerrainOutline==='function'&&key===a.scene._worldCacheKey(a.engine.b,innerWidth);}''')
    report={'scope':'Stage1 Chromium screenshots and small Engine fixtures only; no full combat, other chapters or skill suite.','initial':initial,'cache':cache,'skyCoverageCases':sky,'movement':movement,'debugTogglePreserved':debug,'errors':errors,'screenshots':['stage1-default.png','stage1-great-pine-creek.png','stage1-zoom-out.png','stage1-east-pass.png','stage1-mobile.png']}
    (OUT/'checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    assert debug
    assert not errors,errors
    browser.close()
    print(json.dumps({'statePure':cache['statePure'],'idleFilters':cache['filters'],'tiles':cache['tilesAfter'],'skyCases':sky,'movement':movement,'pageerrors':errors},ensure_ascii=False))
