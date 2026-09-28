import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import shutil, json, hashlib
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/game-reports/rc11-ui';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def ck(ok,name,detail=None):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    title=page.evaluate("""()=>({logo:!!document.querySelector('.honro-logo'),src:document.querySelector('.honro-logo')?.src||'',posterBg:getComputedStyle(document.querySelector('.title-bg')).backgroundImage})""")
    ck(title['logo'] and len(title['src'])>10000,'Main page uses cropped HONRO calligraphy logo',{'srcBytesApprox':len(title['src'])*3//4})
    ck('data:image' not in title['posterBg'],'Full poster is not used as main-page background',title['posterBg'])
    page.screenshot(path=str(OUT/'title.png'))
    art_hashes=[];maps=[]
    for sid in range(1,11):
        detail=page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<sid;i++)a.profile.cleared[i]={};a.launch(sid);const img=document.querySelector('.stage-intro-art img');return {src:img?.src||'',title:a.stage.name,w:a.engine.b.width,h:a.engine.b.height};}""",sid)
        ck(detail['src'].startswith('data:image/jpeg;base64,') and len(detail['src'])>10000,f'Stage {sid} entry uses its poster-panel crop',{'title':detail['title'],'bytesApprox':len(detail['src'])*3//4})
        art_hashes.append(hashlib.sha256(detail['src'].encode()).hexdigest())
        if sid in (2,5,7,10): page.screenshot(path=str(OUT/f'intro-{sid}.png'))
        runtime=page.evaluate("""()=>{const a=HonroApp;if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.updateHUD(true);const b=a.engine.b,mc=document.getElementById('minimap'),r=mc.getBoundingClientRect();return {w:b.width,h:b.height,mw:r.width,mh:r.height,revision:b.honroRevision,terrain:b.terrain.length,polygon:b.terrain.filter(t=>Array.isArray(t.vertices)&&t.vertices.length>=3).length};}""")
        err=abs(runtime['mw']/runtime['mh']-runtime['w']/runtime['h'])/(runtime['w']/runtime['h'])
        ck(runtime['revision']==11 and runtime['polygon']==runtime['terrain'],f'Stage {sid} loads RC11 polygon map',runtime)
        ck(err<0.02,f'Stage {sid} minimap preserves map aspect ratio',{'world':runtime['w']/runtime['h'],'ui':runtime['mw']/runtime['mh'],'relError':err})
        maps.append(runtime)
        # Render a broad playable view centered on a meaningful anchor, not an intro image.
        page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,anchors=b.honroMapAnchors||{},q=anchors.ritual||anchors.courtyard||anchors.basin||anchors.mudflat||anchors.ridge||anchors.exit||{x:b.width*.5,y:b.height*.55};a.done=true;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=q.x;a.scene.y=q.y-180;a.scene.scale=b.height>b.width?.34:(b.width/b.height>2.5?.45:.58);a.scene.render(a.engine,0,a.selected,.6,false,.02);}""")
        page.screenshot(path=str(OUT/f'stage-{sid}.png'))
    ck(len(set(art_hashes))==10,'All ten stage-entry crops are distinct',len(set(art_hashes)))
    # Stage 3 bridge permanence at runtime.
    bridge=page.evaluate("""()=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<3;i++)a.profile.cleared[i]={};a.launch(3);if(a.dialogue)HonroStory.finish(a);const b=a.engine.b,e=a.engine,ts=b.terrain.filter(t=>t.id.startsWith('permanent-bridge'));const before=ts.map(t=>t.hp);for(const t of ts)e.damageTerrain(t,999999);return {count:ts.length,indestructible:ts.every(t=>t.indestructible),broken:ts.some(t=>t.broken),same:ts.every((t,i)=>t.hp===before[i])};}""")
    ck(bridge['count']==2 and bridge['indestructible'] and not bridge['broken'] and bridge['same'],'Stage 3 crossing bridges cannot be destroyed',bridge)
    # Desktop E prompt and Stage 5 positional co-operation.
    coop=page.evaluate("""()=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<5;i++)a.profile.cleared[i]={};a.launch(5);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const b=a.engine.b,e=a.engine,m=b.honroMarkers.find(x=>x.id==='receiver-5'),mage=e.unit('p-mage'),archer=e.unit('p-archer'),veil=b.terrain.find(t=>t.id==='waterfall-veil'),seal=b.terrain.find(t=>t.id==='cliff-cleat');b.phase='aim';b.side=0;b.active=mage.id;Object.assign(mage,{x:m.x,y:m.y,dead:false,airborne:false,jumping:false,vy:0,acted:false,moveLeft:9999});a.done=false;a.updateHUD(true);HonroInteractions.refresh(a);const host=document.getElementById('context-interact'),prompt={hidden:host.hidden,text:host.innerText};const hp0=seal.hp;e.damageTerrain(seal,100);const blockedHp=seal.hp;const used=HonroInteractions.use(a,m);const after={active:!!b.honroState.ritual?.active,veilOpen:!!veil.broken,hp:seal.hp};e.damageTerrain(seal,100);const activeDamage=hp0-seal.hp;mage.x+=300;HonroMission.tick(a,1/120);const left={active:!!b.honroState.ritual?.active,veilOpen:!!veil.broken};return {prompt,used,hp0,blockedHp,after,activeDamage,left};}""")
    ck((not coop['prompt']['hidden']) and 'E' in coop['prompt']['text'],'Desktop E interaction prompt is visible near the ritual',coop['prompt'])
    ck(coop['used'] and coop['after']['active'] and coop['after']['veilOpen'],'Damheo opens the Stage 5 firing window while holding the array',coop)
    ck(coop['blockedHp']==coop['hp0'] and coop['activeDamage']>0,'Stage 5 cleat ignores hits while closed and accepts hits while open',coop)
    ck((not coop['left']['active']) and (not coop['left']['veilOpen']),'Stage 5 firing window closes when Damheo leaves position',coop['left'])
    ck(not errors,'No browser runtime exceptions',errors)
    (ROOT/'_local/game-reports/rc11-browser.json').write_text(json.dumps({'checks':checks,'maps':maps,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('RC11 BROWSER PASSED',len(checks))
