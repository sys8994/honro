"""Identical before/after cameras, vertical sweep, water motion and authoring QA."""
import base64
import io
import json
import subprocess
import sys
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

mode = 'before' if '--before' in sys.argv else 'after'
out = ROOT / '_local/reports/environment-v3' / mode
out.mkdir(parents=True, exist_ok=True)
errors, rows = [], []
source = ROOT / 'HONRO.html'
if mode == 'before':
    source = out.parent / 'baseline-HONRO.html'
    source.write_bytes(subprocess.check_output(['git','show','HEAD:HONRO.html'],cwd=ROOT))

with sync_playwright() as pw:
    browser = launch(pw)
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(source.as_uri())
    page.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
    if mode == 'after':
        page.wait_for_function('window.HonroAct1Background?.ready()')
        variations=page.evaluate('''()=>{const a=HonroApp,cv=document.createElement('canvas');cv.width=960;cv.height=540;
          const c=cv.getContext('2d'),images=[],graded=[],variants=[],light=[];for(let sid=1;sid<=10;sid++){
            a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});const b=a.engine.b,s=a.scene;
            Object.assign(s,{x:b.width*.5,y:b.height*.5});c.clearRect(0,0,960,540);s.background(c,960,540,b);images.push(cv.toDataURL());
            s.environmentTone(c,960,540,b);graded.push(cv.toDataURL());const pixels=c.getImageData(0,0,960,540).data;
            let l=0;for(let i=0;i<pixels.length;i+=4)l+=pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722;light.push(l/(960*540));
            variants.push(HonroAct1Background.imageFor(sid)===HonroAct1Background.images[sid<6?'mountains':'gorge']);}
          return {unique:new Set(images).size,graded:new Set(graded).size,variants,light,cache:HonroAct1Background.cacheSize()};}''')
        assert variations['unique']==2 and variations['graded']==10 and all(variations['variants']) and variations['cache']==2,variations
        for start in [0,5]:
            assert all(variations['light'][i]>variations['light'][i+1] for i in range(start,start+4)),variations
        parallax=page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-6',{story:false});
          const s=a.scene,b=a.engine.b,cv=document.createElement('canvas');cv.width=960;cv.height=540;const c=cv.getContext('2d'),calls=[],frames=[],draw=c.drawImage.bind(c);
          c.drawImage=(...args)=>{calls.push(args.slice(1));draw(...args);};
          for(const [x,y] of [[b.width/2,b.height/2],[b.width/2+500,b.height/2],[b.width/2,b.height/2+500],[-1e6,-1e6],[1e6,1e6]]){
            Object.assign(s,{x,y});c.clearRect(0,0,960,540);s.background(c,960,540,b);frames.push(cv.toDataURL());}
          return{calls,unique:new Set(frames).size};}''')
        assert parallax['unique']==5,parallax
        center,px,py,*edges=parallax['calls']
        dx,dy=center[0]-px[0],center[1]-py[1]
        assert 0<dy<dx<20 and dy<3,parallax
        for x,y,w,h in parallax['calls']:
            assert x<=.001 and y<=.001 and x+w>=959.999 and y+h>=539.999 and abs(w/h-1600/900)<1e-10,parallax
        custom_visible=page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-2',{story:false});const b=a.engine.b,
          p=b.honroEnvironment.placements.find(e=>e.depthLayer==='L2');if(!p)return -1;
          const e={...p,id:'authored-background-prop',x:b.width*.5},env=b.honroEnvironment;env.placements.push(e);
          const group=env.groups.find(g=>g.id===e.groupId),support=env.surfaces.find(s=>s.id===e.supportId),
          cv=document.createElement('canvas');cv.width=960;cv.height=540;const s=a.scene;
          Object.assign(s,{x:e.x,y:group.y+HonroEnvironment.surfaceY(support,e.x),scale:.16});
          s.background(cv.getContext('2d'),960,540,b);return s.environmentStats.visibleAssets;}''')
        assert custom_visible>=1,custom_visible
    page.evaluate('HonroApp.frame=()=>{}')
    for sid in range(1, 11):
        page.evaluate('''sid=>{const a=HonroApp; a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});
          a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{manual:true,storyTween:null,
          goalFocus:null,cinematic:null,time:0,walkTime:0});}''', sid)
        stage = page.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})')
        cameras = [('normal', stage['w']*.5, stage['h']*.55, .66),
                   ('wide', stage['w']*.5, stage['h']*.5, .16),
                   ('near', stage['w']*.5, stage['h']*.55, 1.65)]
        if sid == 1:
            cameras.append(('forest', 1250, 1400, .66))
        if sid == 3:
            cameras.append(('water', 2250, 2150, .66))
        if sid == 5:
            cameras += [(f'{name}-{z}', 2450, y, z) for name, y in
                        [('bottom',3150),('slope',2650),('ridge',1400)] for z in [.16,.66,1.65]]
            cameras += [(f'boundary-{index}-{offset}',2450,stage['h']*cut+offset,.66)
                        for index,cut in enumerate([.37,.67]) for offset in [-32,0,32]]
            cameras.append(('waterfall', 3050, 2750, .66))
        for name,x,y,z in cameras:
            data = page.evaluate('''([x,y,z])=>{const a=HonroApp,s=a.scene;Object.assign(s,{x,y,scale:z,time:0});
              s.render(a.engine,0,'',.6,false,0);return {x:s.x,y:s.y,zoom:s.scale,
              nodes:document.querySelectorAll('*').length,svg:document.querySelectorAll('svg *').length,
              stats:s.environmentStats||null};}''', [x,y,z])
            page.locator('#battlecanvas').screenshot(path=str(out / f'stage-{sid}-{name}.png'))
            rows.append({'stage':sid,'view':name,**data})
    if mode == 'after':
        for width,height in [(867,703),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-2',{story:false});
              a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{manual:true,storyTween:null,
              goalFocus:null,x:2150,y:1650,scale:.16,time:0,walkTime:0});
              a.scene.render(a.engine,0,'',.6,false,0);}''')
            page.locator('#battlecanvas').screenshot(path=str(out/f'stage-2-{width}x{height}.png'))
        page.set_viewport_size({'width':1280,'height':720})
    # Enclosed authoring preset is also rendered through the real game.
    page.evaluate('''()=>{const p=structuredClone(HONRO_PROJECT),s=p.stages[4];s.backdrop='temple';
      s.environment=HonroEnvironment.makeEnvironment?.(s)||{preset:'enclosed',placements:HonroEnvironment.makePlacements({...s,environment:{preset:'enclosed'}})};
      HonroApp.launchMap(p,s.id,{story:false});Object.assign(HonroApp.scene,{manual:true,storyTween:null,goalFocus:null,x:2450,y:2600,scale:.66,time:0});
      HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)}''')
    page.locator('#battlecanvas').screenshot(path=str(out/'enclosed.png'))
    if mode == 'after':
        # Move the real camera slowly upward through both height-zone boundaries.
        transition=page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-5',{story:false});
          const s=a.scene,st=HONRO_PROJECT.stages[4],E=HonroEnvironment;Object.assign(s,{manual:true,storyTween:null,goalFocus:null,x:2450,scale:.66,time:0});
          let previous=null,maxPositionStep=0,maxOpacityStep=0,maxColorStep=0,frames=0;
          for(let y=3400;y>=1350;y-=8){s.y=y;s.render(a.engine,0,'',.6,false,0);
            const groups=st.environment.groups.map(g=>E.groupTransform(s,1280,720,st,g)),palette=E.atmosphereAt(st,y);
            if(previous){groups.forEach((g,i)=>{maxPositionStep=Math.max(maxPositionStep,Math.abs(g.y-previous.groups[i].y));maxOpacityStep=Math.max(maxOpacityStep,Math.abs(g.opacity-previous.groups[i].opacity));});
              for(const k of Object.keys(palette))if(typeof palette[k]==='string')for(const index of [1,3,5])maxColorStep=Math.max(maxColorStep,Math.abs(parseInt(palette[k].slice(index,index+2),16)-parseInt(previous.palette[k].slice(index,index+2),16)));}
            previous={groups,palette};frames++;}return {frames,maxPositionStep,maxOpacityStep,maxColorStep};}''')
        assert transition['frames']>250 and abs(transition['maxPositionStep']-8*.66)<.001 and transition['maxOpacityStep']==0 and transition['maxColorStep']<=2,transition
        # Exercise the REAL render path and observe animation, not merely a helper.
        motion=[]
        for sid,x,y in [(1,1960,1610),(2,2100,2980),(3,2250,2150),(5,3050,2750)]:
            page.evaluate('''([sid,x,y])=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});
              Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,x,y,scale:.66,time:0});
              a.scene.render(a.engine,0,'',.6,false,0)}''',[sid,x,y])
            pair=page.evaluate('''()=>{const s=HonroApp.scene,b=HonroApp.engine.b,cv=document.createElement('canvas');cv.width=1280;cv.height=720;const c=cv.getContext('2d');
              const frames=[];for(const time of [0,.73]){s.time=time;c.clearRect(0,0,1280,720);c.save();c.translate(640,360);c.scale(s.scale,s.scale);c.translate(-s.x,-s.y);s.liveWater(c,b);c.restore();frames.push(cv.toDataURL().split(',')[1]);}
              return {frames,stats:s.environmentStats};}''')
            imgs=[Image.open(io.BytesIO(base64.b64decode(s))).convert('RGB') for s in pair['frames']]
            diff=ImageChops.difference(*imgs)
            changed=sum(max(p)>4 for p in (diff.get_flattened_data() if hasattr(diff,'get_flattened_data') else diff.getdata()))
            assert changed>15,(sid,changed,pair['stats'])
            for i,img in enumerate(imgs): img.save(out/f'water-motion-{sid}-{i}.png')
            motion.append({'stage':sid,'changedPixels':changed,'stats':pair['stats']})
        # Saved battle migration must not move, damage or reset anything.
        saved=page.evaluate('''()=>{const b=HonroApp.engine.b,result=[];delete b.honroEnvironment.version;
          for(const missing of [false,true]){if(missing)delete b.honroEnvironment;const before=JSON.stringify(b),env=HonroEnvironmentRenderer.ensureBattle(b);
            for(let i=0;i<2;i++)HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0);
            result.push({same:JSON.stringify(b)===before,version:env.version,cached:env===HonroEnvironmentRenderer.ensureBattle(b)});}return result;}''')
        assert saved==[{'same':True,'version':page.evaluate('HonroEnvironment.VERSION'),'cached':True}]*2,saved
        rows.append({'motion':motion,'savedBattle':saved,'transition':transition})

        editor=browser.new_page(viewport={'width':1440,'height':900})
        editor.on('pageerror',lambda e: errors.append(str(e)))
        editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri())
        editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
        editor.evaluate('HonroWorkshopAPI.selectStage("stage-5")')
        editor.select_option('#placeDepthLayer','L2')
        editor.select_option('#placeZone','slope')
        editor.select_option('#environmentPreset','temple')
        assert editor.evaluate('HonroWorkshopAPI.getProject().stages[4].environment.atmosphere.preset')=='temple'
        editor.evaluate('HonroWorkshopAPI.applyCommands([{op:"scenery.place",id:"authored-qa",assetId:"ancient_pine",depthLayer:"L2",zoneId:"slope",x:2100}])')
        editor.evaluate('HonroWorkshopAPI.setCamera({x:2100,y:2600,zoom:.66})')
        editor.screenshot(path=str(out/'workshop-authoring.png'))
        exported=editor.evaluate('HonroWorkshopAPI.exportProject()')
        editor.evaluate('p=>HonroWorkshopAPI.importProject(JSON.parse(p))',exported)
        assert editor.evaluate('HonroWorkshopAPI.exportProject()')==exported
        editor.click('[data-tab="play"]')
        editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
        play=editor.frames[1]
        play.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.dialogue=null;a.turnNotice=null;
          document.querySelectorAll('.story-overlay,.narration-overlay,.story-history-overlay').forEach(node=>node.remove());document.body.classList.remove('story-lock');
          Object.assign(a.scene,{manual:true,storyFrozen:false,cinematic:null,storyTween:null,goalFocus:null,x:2100,y:2600,scale:.66,time:.73});
          a.scene.render(a.engine,0,'',.6,false,0)}''')
        play.locator('#battlecanvas').screenshot(path=str(out/'playtest.png'))
        assert play.evaluate('HonroApp.engine.b.honroEnvironment.placements.some(e=>e.id==="authored-qa"&&e.supportId)')
        assert play.evaluate('HonroApp.engine.b.honroEnvironment.atmosphere.preset')=='temple'
        # Late-act SVG, drift and grading must also use the actual iframe runtime.
        play.wait_for_function('HonroAct1Background.ready(6)')
        assert play.evaluate('HONRO_ACT1_FAR_DATA.gorge')==page.evaluate('HONRO_ACT1_FAR_DATA.gorge')
        play.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-6',{story:false});a.dialogue=null;a.turnNotice=null;
          Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:a.engine.b.width/2,y:a.engine.b.height*.55,scale:.66,time:0});
          a.scene.render(a.engine,0,'',.6,false,0);}''')
        play.locator('#battlecanvas').screenshot(path=str(out/'playtest-gorge.png'))
        assert play.evaluate('HonroAct1Background.cacheSize()')==2
        page.set_viewport_size({'width':390,'height':844})
        page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-6',{story:false});a.dialogue=null;a.turnNotice=null;
          Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x:a.engine.b.width/2,y:a.engine.b.height*.55,scale:.16,time:0});
          a.scene.render(a.engine,0,'',.6,false,0);}''')
        page.locator('#battlecanvas').screenshot(path=str(out/'stage-6-390x844.png'))
        editor.close()
    browser.close()

assert not errors, errors
(out/'report.json').write_text(json.dumps({'views':rows,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'PASS {mode} composition capture: {len(rows)} views')
