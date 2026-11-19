"""Only run with the intended isolated patched Workshop fixture upstream."""
from pathlib import Path
import json, sys, math, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageDraw, ImageFilter
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:8870/HONRO_WORKSHOP.html'
plan=json.loads(Path(os.environ.get('HONRO_WORKPAD_PLAN',str(Path(__file__).with_name('workpad.json')))).read_text())
report={'passed':False,'evidence':'V3 west shoulder through actual pointer and file controls; no geometry mutation API','itinerary':plan}
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
        return """()=>{const s=HonroWorkshopAPI.getProject().library.find(a=>a.id==='act5:near:42').edgeWall.params.workshopVisibleJoint42;if(!s)return null;const {rim,chain,ledges,materials}=s;return {rim,chain,ledges,materials};}"""
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
    def scene_pixel_gate():
        a=Image.open(out/'00-game-west-original.png').convert('RGB')
        b=Image.open(out/'04-game-west-exact-reopened.png').convert('RGB')
        assert a.size==b.size==(1280,800)
        r,g,c=ImageChops.difference(a,b).split()
        significant=ImageChops.lighter(ImageChops.lighter(r,g),c).point(lambda n:255 if n>3 else 0)
        support=Image.new('L',a.size)
        ImageDraw.Draw(support).polygon([tuple(p) for p in plan['rim']],fill=255)
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
        valid_drag,ledge_drag,invalid_drag=local([plan['seamDrag'],plan['ledgeDrag'],plan['invalidSeamDrag']])
        page.locator('[aria-label="암층 재질"]').select_option('slate')
        draw(page,rim+chain)
        click(page,'preview')
        assert sha(page)==base and page.evaluate(scope()) is None,'preview committed early'
        page.screenshot(path=str(out/'01-multipoint-preview.png'))
        click(page,'apply')
        first=page.evaluate(scope())
        assert first and len(first['rim'])==4 and len(first['chain'])==len(chain) and not first['ledges']
        assert all(math.dist(a,b)<2 for a,b in zip(chain,first['chain']))
        startpaths=project_paths(page)
        assert len(startpaths)==2
        before_drag=sha(page)
        move(page,first['chain'][1],valid_drag,'02-shared-point-drag.png')
        assert sha(page)==before_drag
        click(page,'apply')
        changed=page.evaluate(scope())
        assert math.dist(changed['chain'][1],valid_drag)<2
        assert [p for i,p in enumerate(changed['chain']) if i!=1]==[p for i,p in enumerate(first['chain']) if i!=1]
        assert all(a!=b for a,b in zip(startpaths,project_paths(page)))
        seam_paths=project_paths(page)
        checkpoint('multipoint-create-and-shared-drag')
        page.locator('[aria-label="편집 암면"]').select_option('right')
        click(page,'ledge-new')
        draw(page,ledge,min_css_spacing=10.6)
        before_ledge=sha(page)
        click(page,'ledge-preview')
        assert sha(page)==before_ledge
        page.screenshot(path=str(out/'03-ledge-preview.png'))
        click(page,'apply')
        final=page.evaluate(scope())
        assert len(final['ledges'])==1 and final['ledges'][0]['parent']=='right'
        assert len(final['ledges'][0]['points'])==len(ledge)
        paths=project_paths(page)
        assert len(paths)==3 and paths[:2]==seam_paths
        authored=sha(page)
        with page.expect_download(timeout=25000) as pending:click(page,'download')
        payload=Path(pending.value.path()).read_text()
        parsed=json.loads(payload)
        assert len(payload.encode())<2048 and 'originalRoot' not in payload and '<svg' not in payload
        assert set(parsed['section'])=={'rim','chain','materials','ledges'}
        report['draft_bytes']=len(payload.encode())
        checkpoint('ledge-committed-and-compact-downloaded')
        new_ctx=browser.new_context(viewport={'width':1500,'height':1000},device_scale_factor=1)
        reopened=boot(new_ctx)
        assert sha(reopened)==base,'fresh browser source differs'
        with reopened.expect_file_chooser(timeout=25000) as chooser:click(reopened,'open')
        chooser.value.set_files({'name':'ledge-v3.json','mimeType':'application/json','buffer':payload.encode()})
        reopened.wait_for_function("['opened','failed'].includes(document.documentElement.dataset.jointDraft)",timeout=45000)
        assert reopened.evaluate("document.documentElement.dataset.jointDraft")=='opened',reopened.evaluate("document.documentElement.dataset.jointDraftError")
        assert sha(reopened)==authored and project_paths(reopened)==paths
        protected_after=protected(reopened)
        assert protected_after=={**initial,'guard':pin['guardSha']}
        report['reopened_protected']=protected_after
        after_game=game_frame(reopened,'04-game-west-exact-reopened.png',authored)
        assert sha(reopened)==authored and sha(page)==authored
        for k in ['camera','officialFarReady','terrainSha256','unitsSha256']:
            assert before_game[k]==after_game[k],('game frame parity',k,before_game,after_game)
        assert before_game['rgbaSha256']!=after_game['rgbaSha256'],'native authored paths not visible in game scene'
        report['game']={'before':before_game,'reopened':after_game,'read_from_exact_reopened':True,'not_playthrough':True}
        scene_pixel_gate()
        checkpoint('paired-game-frames-exact-reopened')
        reopened.locator('[aria-label="편집 암면"]').select_option('right')
        reopened.locator('[aria-label="침식턱 선택"]').select_option(final['ledges'][0]['id'])
        move(reopened,final['ledges'][0]['points'][1],ledge_drag,'05-reopened-ledge-point-drag.png')
        click(reopened,'ledge-preview')
        assert sha(reopened)==authored
        click(reopened,'apply')
        reedited=sha(reopened)
        new_paths=project_paths(reopened)
        assert new_paths[:2]==paths[:2] and new_paths[2]!=paths[2]
        assert math.dist(page.evaluate(scope())['ledges'][0]['points'][1],reopened.evaluate(scope())['ledges'][0]['points'][1])>1
        reopened.locator('#undoBtn').click()
        assert sha(reopened)==authored,'undo did not restore entire ledge edit'
        reopened.locator('#redoBtn').click()
        assert sha(reopened)==reedited,'redo did not restore entire ledge edit'
        move(reopened,reopened.evaluate(scope())['chain'][1],invalid_drag,'06-invalid-parent-crossing-drag.png')
        reopened.wait_for_function("document.querySelector('#toast')?.textContent.includes('부모 암면')",timeout=6000)
        assert sha(reopened)==reedited,'rejected seam drag still changed state'
        report.update(passed=True,fresh_exact_match=True,pointer_reedit=True,atomic_rejection=True)
        checkpoint('complete')
    except Exception as e:
        report['error']=str(e)
        try:(locals().get('reopened') or page).screenshot(path=str(out/'failure.png'),timeout=10000)
        except Exception:pass
        raise
    finally:
        (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        browser.close()
