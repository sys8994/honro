"""Only run with the intended isolated patched Workshop fixture upstream."""
from pathlib import Path
import json, sys, math, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageDraw, ImageFilter
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:8870/HONRO_WORKSHOP.html'
plan=json.loads(Path(os.environ.get('HONRO_WORKPAD_PLAN',str(Path(__file__).with_name('workpad.json')))).read_text())
report={'passed':False,'evidence':'V4 irregular west shoulder through actual pointer and file controls; no geometry mutation API','itinerary':plan}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME'))
    def boot(ctx):
        page=ctx.new_page()
        page.on('pageerror',lambda e:report.setdefault('page_errors',[]).append(str(e)))
        page.goto(url)
        page.wait_for_function('window.HonroWorkshopAPI?.getProject()?.stages.some(s=>s.id==="stage-42")',timeout=90000)
        page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
        page.locator('[data-tool="nativeJoint"]').click()
        if not page.evaluate("HonroWorkshopAPI.getEditorState().overlayEnabled"):page.locator('#overlayToggle').click()
        return page
    def scope():
        return """()=>{const s=HonroWorkshopAPI.getProject().library.find(a=>a.id==='act5:near:42').edgeWall.params.workshopVisibleJoint42;if(!s)return null;const {rim,end,chain,ledges,materials}=s;return {rim,end,chain,ledges,materials};}"""
    def sha(page):
        return page.evaluate("""async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(HonroWorkshopAPI.getProject()))))).map(n=>n.toString(16).padStart(2,'0')).join('')""")
    def protected(page):
        return page.evaluate("""async()=>{const out=HonroWorkshopAPI.getProject(),a=out.library.find(a=>a.id==='act5:near:42'),v=a.edgeWall.vector;const edited=v.root.children?.[1]?.clipPath==='editor-visible-support';const guard=v.clips['editor-visible-support'];const r=edited?v.root.children[0]:v.root;const c={...v.clips};delete c['editor-visible-support'];delete a.edgeWall;
          const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(n=>n.toString(16).padStart(2,'0')).join('');
          return {sourceBody:await sha([r,c[r.clipPath]]),sourceClips:await sha(c),protectedProject:await sha(out),guard:guard?await sha(guard):null};}""")
    def project_paths(page):
        return page.evaluate("""()=>HonroWorkshopAPI.getProject().library.find(a=>a.id==='act5:near:42').edgeWall.vector.root.children[1].children.map(n=>n.d)""")
    def coords(page, points):
        layout=page.evaluate("""pts=>{const api=HonroWorkshopAPI,s=api.queryScene().stage,e=s.elements.find(e=>e.assetId==='act5:near:42'),c=document.querySelector('#stageCanvas'),box=c.getBoundingClientRect();
          const presets=[{x:158,y:1600,zoom:.88},{x:400,y:1370,zoom:.88},{x:600,y:1270,zoom:.78},{x:500,y:1340,zoom:.7},{x:350,y:1290,zoom:.55}];
          let attempts=[];for(const preset of presets){api.setCamera(preset);const v=api.getEditorState().stageView;
           const points=pts.map(([x,y])=>{const a=c.clientWidth/2+(e.x+x*e.scale-v.x)*v.zoom,b=c.clientHeight/2+(e.y+y*e.scale-v.y)*v.zoom;return {x:a,y:b,unobstructed:document.elementFromPoint(box.left+a,box.top+b)===c};});
           const result={camera:v,width:c.clientWidth,height:c.clientHeight,points};
           if(points.every(p=>p.unobstructed&&p.x>=10&&p.y>=10&&p.x<=c.clientWidth-10&&p.y<=c.clientHeight-10))return {...result,success:true};
           attempts.push(result);
          }return {success:false,attempts};}""",points)
        report.setdefault('camera_checks',[]).append(layout)
        assert layout['success'], ('authored point outside or occluded canvas', layout)
        return [{'x':p['x'],'y':p['y']} for p in layout['points']]
    def draw(page, points, min_css_spacing=0):
        if not points:raise AssertionError('no points')
        c=page.locator('#stageCanvas')
        screen=coords(page,points)
        if min_css_spacing:
            assert all(math.hypot(a['x']-b['x'],a['y']-b['y'])>min_css_spacing for i,a in enumerate(screen) for b in screen[i+1:]),'ledge point spacing would hit an existing handle'
        for q in screen:c.click(position=q)
    def move(page, start, end, photo):
        c=page.locator('#stageCanvas')
        a,b=coords(page,[start,end]);box=c.bounding_box()
        point=lambda p:(box['x']+p['x'],box['y']+p['y'])
        assert math.dist(point(a),point(b))>=2, 'pointer movement too small'
        page.mouse.move(*point(a));page.mouse.down()
        try:
            page.mouse.move(*point(b),steps=10)
            page.screenshot(path=str(out/photo))
        finally:page.mouse.up()
    def click(page, name):
        page.locator(f'[data-joint-action="{name}"]').click()
    def checkpoint(name):
        report['step']=name
        (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    def game_frame(page, name, expected):
        # The genuine browser game engine draws the immutable exact Workshop
        # snapshot to a visible CSS canvas. There is no visual-layer substitute.
        try:
            meta=page.evaluate("""async expected=>{const doc=HonroWorkshopAPI.getProject(),stage=doc.stages.find(s=>s.id==='stage-42');
               const hash=async q=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',q))).map(n=>n.toString(16).padStart(2,'0')).join('');
               if(await hash(new TextEncoder().encode(JSON.stringify(doc)))!==expected)throw Error('scene input differs from exact Workshop project');
               const battle=HonroMaps.createBattle(stage,doc,HonroProfileStore.fresh(),{origin:'campaign'});
               HonroStageRules.sanitizeStageBattle(battle);
               const ids=JSON.stringify(battle.units.map(u=>[u.id,u.x,u.y])),terrain=JSON.stringify(battle.terrain);
               const c=document.createElement('canvas');c.id='qa-game-frame-visible';c.width=1280;c.height=800;
               c.style.cssText='position:fixed;left:5px;top:5px;width:1280px;height:800px;z-index:2147483647';
               document.body.append(c);
               const e=new HONRO_CORE.Engine(battle,()=>{},true),s=new HonroScene(c);
               Object.assign(s,{manual:true,x:150,y:1850,scale:.5,time:2,editorView:false,skillPreview:false});
               HonroBounds.constrain(s,battle);
               const ready=()=>HonroAuthoredFarArt?.ready?.(42,battle.honroPreviewFar,battle)??false;
               for(let k=0;k<45;k++){s.render(e,0,'',.6,false,0);if(k>=3&&ready())break;await new Promise(r=>setTimeout(r,100));}
               s.render(e,0,'',.6,false,0);
               const data=c.getContext('2d').getImageData(0,0,1280,800).data;
               return {camera:[s.x,s.y,s.scale,c.width,c.height],officialFarReady:ready(),
                   rgbaSha256:await hash(data),terrainSha256:await hash(new TextEncoder().encode(terrain)),unitsSha256:await hash(new TextEncoder().encode(ids))};
            }""",expected)
            if meta['camera']!=[150,1850,0.5,1280,800] or not meta['officialFarReady']:
                raise RuntimeError('game canvas camera/backdrop not valid: '+str(meta))
            page.locator('#qa-game-frame-visible').screenshot(path=str(out/name),timeout=20000)
            return meta
        except Exception as e:
            report.setdefault('game_capture_errors',[]).append(str(e))
            raise
        finally:
            page.evaluate("document.querySelector('#qa-game-frame-visible')?.remove()")
    def scene_pixel_gate(rim):
        a=Image.open(out/'00-game-west-original.png').convert('RGB')
        b=Image.open(out/'04-game-west-exact-reopened.png').convert('RGB')
        assert a.size==b.size==(1280,800)
        r,g,c=ImageChops.difference(a,b).split()
        significant=ImageChops.lighter(ImageChops.lighter(r,g),c).point(lambda n:255 if n>3 else 0)
        support=Image.new('L',a.size)
        ImageDraw.Draw(support).polygon([tuple(p) for p in rim],fill=255)
        support=support.filter(ImageFilter.MaxFilter(7))
        outside=ImageChops.multiply(significant,ImageChops.invert(support))
        report['game_pixel_gate']={'inside_changed':significant.histogram()[255]-outside.histogram()[255],
            'outside_changed':outside.histogram()[255],'allowance_px':3,'rgb_channel_delta':3}
        assert report['game_pixel_gate']['inside_changed']>0 and report['game_pixel_gate']['outside_changed']==0,report['game_pixel_gate']
    ctx=browser.new_context(viewport={'width':1500,'height':1000},device_scale_factor=1,accept_downloads=True)
    page=boot(ctx)
    try:
        base=sha(page)
        pin=plan['official']; initial=protected(page)
        assert initial=={'sourceBody':pin['bodySha'],'sourceClips':pin['clipSha'],'protectedProject':pin['nonTarget'],'guard':None}
        report['source']=initial;report['base_project_sha256']=base
        before_game=game_frame(page,'00-game-west-original.png',base)
        checkpoint('verified-original-game-frame')
        local=lambda ps:page.evaluate("ps=>{const e=HonroWorkshopAPI.queryScene().stage.elements.find(e=>e.assetId==='act5:near:42');return ps.map(([x,y])=>[(2*x-1130-e.x)/e.scale,(2*y+1050-e.y)/e.scale]);}",ps)
        rim,chain,ledge=map(local,[plan['rim'],plan['chain'],plan['ledge']])
        valid_drag,reopened_drag,invalid_drag=local([plan['rimDrag'],plan['reopenedDrag'],plan['invalidRimDrag']])
        page.locator('[aria-label="암층 재질"]').select_option('slate')
        draw(page,rim[:plan['end']+1])
        click(page,'rim-end')
        draw(page,rim[plan['end']+1:])
        click(page,'rim-close')
        draw(page,chain)
        click(page,'preview')
        assert sha(page)==base and page.evaluate(scope()) is None,'preview committed early'
        page.screenshot(path=str(out/'01-irregular-rim-preview.png'))
        click(page,'apply')
        first=page.evaluate(scope())
        assert first and len(first['rim'])==22 and first['end']==plan['end'] and len(first['chain'])==4 and not first['ledges']
        assert all(math.dist(a,b)<2 for a,b in zip(rim,first['rim']))
        assert all(math.dist(a,b)<2 for a,b in zip(chain,first['chain']))
        page.locator('[aria-label="편집 암면"]').select_option('right')
        click(page,'ledge-new')
        draw(page,ledge,min_css_spacing=10.6)
        before_ledge=sha(page)
        click(page,'ledge-preview')
        assert sha(page)==before_ledge
        click(page,'apply')
        state=page.evaluate(scope())
        assert len(state['ledges'])==1 and len(state['ledges'][0]['points'])==6
        before_drag=sha(page)
        prior=project_paths(page)
        move(page,state['rim'][7],valid_drag,'02-actual-rim-drag.png')
        assert sha(page)==before_drag,'preview mutated already'
        click(page,'apply')
        new_state=page.evaluate(scope())
        assert math.dist(new_state['rim'][7],valid_drag)<2
        assert [a!=b for a,b in zip(prior,project_paths(page))]==[False,True,False]
        assert new_state['chain']==state['chain'] and new_state['end']==state['end']
        authored=sha(page)
        move(page,new_state['rim'][0],valid_drag,'02a-protected-N.png')
        move(page,new_state['rim'][6],invalid_drag,'02b-reject-if-outside.png')
        assert sha(page)==authored
        with page.expect_download(timeout=20000) as pending:click(page,'download')
        payload=Path(pending.value.path()).read_text()
        parsed=json.loads(payload)
        assert parsed['kind']=='honro-stage42-visible-rim-v4'
        assert parsed['section']['end']==13 and len(parsed['section']['rim'])==22
        assert len(payload.encode())<8192 and 'originalRoot' not in payload and '<svg' not in payload
        new_ctx=browser.new_context(viewport={'width':1500,'height':1000},device_scale_factor=1)
        reopened=boot(new_ctx)
        assert sha(reopened)==base,'fresh browser has wrong source'
        with reopened.expect_file_chooser(timeout=20000) as chooser:click(reopened,'open')
        chooser.value.set_files({'name':'west-rim-editor-export.json','mimeType':'application/json','buffer':payload.encode()})
        reopened.wait_for_function("['opened','failed'].includes(document.documentElement.dataset.jointDraft)",timeout=30000)
        assert reopened.evaluate("document.documentElement.dataset.jointDraft")== 'opened',reopened.evaluate("document.documentElement.dataset.jointDraftError")
        assert sha(reopened)==authored and project_paths(reopened)==project_paths(page)
        prot=protected(reopened)
        assert prot['guard']==pin['guardSha'] and {k:v for k,v in prot.items() if k!='guard'}=={k:v for k,v in initial.items() if k!='guard'}
        coords(reopened,[new_state['rim'][10]])
        reopened.screenshot(path=str(out/'03-reopened-irregular-rim.png'))
        game=game_frame(reopened,'04-game-west-exact-reopened.png',authored)
        assert all(before_game[k]==game[k] for k in ('camera','officialFarReady','terrainSha256','unitsSha256'))
        raw=new_state['rim']
        final_rim=reopened.evaluate("q=>{const e=HonroWorkshopAPI.queryScene().stage.elements.find(e=>e.assetId==='act5:near:42');return q.map(([x,y])=>[(e.x+x*e.scale+1130)/2,(e.y+y*e.scale-1050)/2]);}",raw)
        scene_pixel_gate(final_rim)
        move(reopened,new_state['rim'][10],reopened_drag,'05-reopened-rim-reedit.png')
        click(reopened,'apply')
        assert sha(reopened)!=authored
        report.update(passed=True,fresh_exact_match=True,pointer_reedit=True,draft_bytes=len(payload.encode()),game_both=[before_game,game])
        checkpoint('complete')
    except Exception as e:
        report['error']=str(e)
        (locals().get('reopened') or page).screenshot(path=str(out/'failure.png'));raise
    finally:
        (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        browser.close()
