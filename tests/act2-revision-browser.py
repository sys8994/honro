"""Revision 2 visual/contact audit, using actual shared game and editor scenes."""
import json,sys
from PIL import Image
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
iteration=sys.argv[1] if len(sys.argv)>1 else 'current'
OUT=ROOT/'_local/reports/act2-revision'/iteration;OUT.mkdir(parents=True,exist_ok=True)
errors=[];rows=[];seams=[]
with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1440,'height':900})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp')
    page.evaluate("HonroApp.frame=()=>{};HonroApp.profile=HONRO_TOOLS.fresh();HonroApp.profile.recruited=['archer','mage','knight','occultist'];for(let id=1;id<21;id++)HonroApp.profile.cleared[id]={rounds:20};for(const cls of HonroApp.profile.recruited){const h=HonroApp.profile.heroes[cls];h.xp=HONRO_CORE.xpAtLevel(14);HONRO_CORE.autoTrain(h,cls);}")
    for sid in range(11,21):
        page.evaluate('id=>{HonroApp.launch(id);while(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;HonroApp.banterCurrent=null;}',sid)
        row=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene;
          s.storyTween=null;s.goalFocus=null;s.cinematic=null;s.manual=true;s.scale=HonroBounds.zoomLimits(innerWidth).min;
          s.x=u.x+1100;s.y=u.y-100;s.render(e,0);a.updateHUD(true);
          return{stage:b.honroStage,width:b.width,height:b.height,enemies:e.alive(1).length,terrainNodes:b.terrain.reduce((n,t)=>n+(t.vertices?.length||4),0),lamps:b.honroMarkers.filter(m=>m.id.startsWith('spirit-lamp')).length,overscan:s.overscanStats}}''')
        rows.append(row);page.evaluate('HonroStory.tick(HonroApp,performance.now()+5000);document.getElementById("turn-banner")?.remove()');page.screenshot(path=str(OUT/f'stage-{sid}-entry.png'))
        for zone in ['middle','final']:
            page.evaluate('''zone=>{const a=HonroApp,b=a.engine.b,s=a.scene,ms=b.honroMarkers.filter(m=>m.type==='act2'&&!m.id.startsWith('spirit-lamp')),m=ms[zone==='middle'?Math.floor(ms.length/2):ms.length-1];s.x=m?.x||b.width*.6;s.y=(m?.y||b.height*.6)-300;s.scale=.5;s.render(a.engine,0);}''',zone)
            page.screenshot(path=str(OUT/f'stage-{sid}-{zone}.png'))
        if 13<=sid<=19:
            for edge in ['top','left','right','bottom']:
                page.evaluate('''edge=>{const a=HonroApp,b=a.engine.b,s=a.scene,p=b.honroCaveEnvelope.portals.find(p=>p.side===edge);s.x=edge==='left'?0:edge==='right'?b.width:b.width*.5;s.y=edge==='top'?0:edge==='bottom'?b.height:p?(p.top+p.bottom)*.5:b.height*.5;s.render(a.engine,0)}''',edge)
                shot=OUT/f'stage-{sid}-{edge}.png';page.screenshot(path=str(shot))
                if edge in ('left','right'):
                    # A closed tunnel fill may be necessary, but its closing
                    # edge must never be stroked through the open mouth.
                    cx,cy=page.evaluate('''()=>{const r=HonroApp.scene.canvas.getBoundingClientRect();return[Math.round(r.x+r.width/2),Math.round(r.y+r.height/2)]}''')
                    im=Image.open(shot).convert('RGB');px=im.load()
                    # Inspect the open upper half of the mouth. At floor height,
                    # foreground houses and props can end exactly on the boundary.
                    seam=max(sum(sum(abs(px[x,y][k]-(px[x-2,y][k]+px[x+2,y][k])/2) for k in range(3))/3 for y in range(cy-100,cy-49,5))/11 for x in range(cx-10,cx+10))
                    seams.append({'stage':sid,'side':edge,'edgeContrast':round(seam,2)})
                    assert seam<8,(sid,edge,seam)
    page.evaluate("HonroApp.launch(14);while(HonroApp.dialogue)HonroStory.finish(HonroApp)")
    for width,height in [(390,844),(844,390)]:
        page.set_viewport_size({'width':width,'height':height})
        page.evaluate('''()=>{const a=HonroApp,s=a.scene,u=a.engine.active;s.storyTween=null;s.goalFocus=null;s.manual=true;s.x=1300;s.y=u.y-50;s.scale=HonroBounds.zoomLimits(innerWidth).min;s.render(a.engine,0);a.updateHUD(true)}''')
        page.evaluate('HonroStory.tick(HonroApp,performance.now()+5000);document.getElementById("turn-banner")?.remove()');page.screenshot(path=str(OUT/f'mobile-{width}.png'))
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.set_viewport_size({'width':1440,'height':900})
    visibility=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=a.scene,spirit=b.units.find(u=>u.honroSpirit),archer=b.units.find(u=>u.side===0&&u.cls==='archer'),sodan=b.units.find(u=>u.side===0&&u.cls==='occultist');
     while(a.dialogue)HonroStory.finish(a);a.modal.classList.remove('open');a.done=false;s.storyTween=null;s.manual=true;s.scale=1;s.x=spirit.x;s.y=spirit.y-spirit.h*.5;s.render(a.engine,0);
     const pt={x:s.canvas.getBoundingClientRect().width/2,y:s.canvas.getBoundingClientRect().height/2};
     b.active=archer.id;const hidden=!HonroAct2.visible(b,spirit),hiddenPick=HonroUnitInfo.pick(a,pt)?.id===spirit.id;
     b.active=sodan.id;const seen=HonroAct2.visible(b,spirit),sodanPick=HonroUnitInfo.pick(a,pt)?.id===spirit.id;
     b.active=archer.id;HonroAct2.expose(b,b.round+2,spirit,150);const manifestedPick=HonroUnitInfo.pick(a,pt)?.id===spirit.id;
     return{hidden,hiddenPick,seen,sodanPick,manifestedPick}}''')
    assert visibility=={'hidden':True,'hiddenPick':False,'seen':True,'sodanPick':True,'manifestedPick':True},visibility
    rows.append({'visibility':visibility})
    editor=browser.new_page(viewport={'width':1440,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    for sid in [13,14,15,18,19,20]:
        editor.evaluate('id=>HonroWorkshopAPI.selectStage("stage-"+id)',sid)
        row=editor.evaluate('''()=>{const r=HonroWorkshopAPI.getRuntime(),b=r.engine.b;return{stage:b.honroStage,width:b.width,height:b.height,revision:b.honroAct2Revision}}''')
        assert row['revision']==2,row
        rows.append({'workshop':row});editor.screenshot(path=str(OUT/f'workshop-{sid}.png'))
    assert not errors,errors
    browser.close()
(OUT/'result.json').write_text(json.dumps({'rows':rows,'seams':seams,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(rows),'seamChecks':len(seams),'maxSeamContrast':max(s['edgeContrast'] for s in seams),'errors':errors,'output':str(OUT)},ensure_ascii=False))
