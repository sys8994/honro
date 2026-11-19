"""Only run with the intended isolated patched Workshop fixture upstream."""
from pathlib import Path
import json, sys, math, os
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:8870/HONRO_WORKSHOP.html'
report={'passed':False,'evidence':'west shoulder physical art study through real browser UI, no geometry mutation API'}
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
        return """()=>HonroWorkshopAPI.getProject().library.find(a=>a.id==='act5:near:42').edgeWall.params.workshopVisibleJoint42"""
    def sha(page):
        return page.evaluate("""async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(HonroWorkshopAPI.getProject()))))).map(n=>n.toString(16).padStart(2,'0')).join('')""")
    def protected(page):
        return page.evaluate("""async()=>{const out=HonroWorkshopAPI.getProject(),a=out.library.find(a=>a.id==='act5:near:42'),v=a.edgeWall.vector;const edited=v.root.children?.[1]?.clipPath==='editor-visible-support';const guard=v.clips['editor-visible-support'];const r=edited?v.root.children[0]:v.root;const c={...v.clips};delete c['editor-visible-support'];delete a.edgeWall;
          const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(n=>n.toString(16).padStart(2,'0')).join('');
          return {sourceBody:await sha([r,c[r.clipPath]]),sourceClips:await sha(c),protectedProject:await sha(out),guard:guard?await sha(guard):null};}""")
    def project_paths(page):
        return page.evaluate("""()=>HonroWorkshopAPI.getProject().library.find(a=>a.id==='act5:near:42').edgeWall.vector.root.children[1].children.map(n=>n.d)""")
    def coords(page, points):
        layout=page.evaluate("""pts=>{const api=HonroWorkshopAPI,s=api.queryScene().stage,e=s.elements.find(e=>e.assetId==='act5:near:42');api.setCamera({x:158,y:1600,zoom:.88});const c=document.querySelector('#stageCanvas'),v=api.getEditorState().stageView,box=c.getBoundingClientRect();return {camera:v,width:c.clientWidth,height:c.clientHeight,points:pts.map(([x,y])=>{const a=c.clientWidth/2+(e.x+x*e.scale-v.x)*v.zoom,b=c.clientHeight/2+(e.y+y*e.scale-v.y)*v.zoom;return {x:a,y:b,unobstructed:document.elementFromPoint(box.left+a,box.top+b)===c};})};}""",points)
        report.setdefault('camera_checks',[]).append(layout)
        for p in layout['points']:
            assert p['unobstructed'] and 10<=p['x']<=layout['width']-10 and 10<=p['y']<=layout['height']-10,('authored point outside or occluded canvas',layout)
        return [{'x':p['x'],'y':p['y']} for p in layout['points']]
    def move(page, local, photo):
        c=page.locator('#stageCanvas')
        q=coords(page,[local])[0];b=c.bounding_box()
        x,y=b['x']+q['x'],b['y']+q['y']
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+7,y+9,steps=9)
        page.screenshot(path=str(out/photo));page.mouse.up()
    def game_frame(page, name):
        # The genuine browser game engine draws the immutable exact Workshop
        # snapshot to a visible CSS canvas. There is no visual-layer substitute.
        try:
            meta=page.evaluate("""async()=>{const doc=HonroWorkshopAPI.getProject(),stage=doc.stages.find(s=>s.id==='stage-42');
               const battle=HonroMaps.createBattle(stage,doc,HonroProfileStore.fresh(),{origin:'campaign'});
               HonroStageRules.sanitizeStageBattle(battle);
               const ids=battle.units.map(u=>[u.id,u.x,u.y]);
               const c=document.createElement('canvas');c.id='qa-game-frame-visible';c.width=1280;c.height=800;
               c.style.cssText='position:fixed;left:5px;top:5px;width:1280px;height:800px;z-index:2147483647';
               document.body.append(c);
               const e=new HONRO_CORE.Engine(battle,()=>{},true),s=new HonroScene(c);
               Object.assign(s,{manual:true,x:150,y:1850,scale:.5,time:2,editorView:false,skillPreview:false});
               HonroBounds.constrain(s,battle);
               const ready=()=>HonroAuthoredFarArt?.ready?.(42,battle.honroPreviewFar,battle)??false;
               for(let k=0;k<45;k++){s.render(e,0,'',.6,false,0);if(k>=3&&ready())break;await new Promise(r=>setTimeout(r,100));}
               s.render(e,0,'',.6,false,0);
               const hash=async q=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',q))).map(n=>n.toString(16).padStart(2,'0')).join('');
               const data=c.getContext('2d').getImageData(0,0,1280,800).data;
               return {camera:[s.x,s.y,s.scale,c.width,c.height],officialFarReady:ready(),
                   rgbaSha256:await hash(data),terrainSha256:await hash(new TextEncoder().encode(JSON.stringify(battle.terrain))),unitsSha256:await hash(new TextEncoder().encode(JSON.stringify(ids)))};
            }""")
            if meta['camera']!=[150,1850,0.5,1280,800] or not meta['officialFarReady']:
                raise RuntimeError('game canvas camera/backdrop not valid: '+str(meta))
            page.locator('#qa-game-frame-visible').screenshot(path=str(out/name),timeout=20000)
            return meta
        except Exception as e:
            report.setdefault('game_capture_errors',[]).append(str(e))
            return None
        finally:
            page.evaluate("document.querySelector('#qa-game-frame-visible')?.remove()")
    ctx=browser.new_context(viewport={'width':1500,'height':1000},accept_downloads=True)
    page=boot(ctx)
    try:
        base=sha(page)
        protected_before=protected(page)
        assert protected_before['sourceBody']=='4a413feb79ba5cabb75a8a3e204bce816548db1c80857e11a9538391625756a8'
        assert protected_before['sourceClips']=='6784931b63ee57114f0c90810a16b886eba91d45f868a319178a4ccf4f11cedb'
        report['source']=protected_before
        initial_scene=game_frame(page,'05-game-west-before.png')
        screen_itinerary=[(635,234),(738,233),(586,379),(567,270),(609,291)]
        section=page.evaluate("ps=>{const e=HonroWorkshopAPI.queryScene().stage.elements.find(e=>e.assetId==='act5:near:42');return ps.map(([x,y])=>[(2*x-1130-e.x)/e.scale,(2*y+1050-e.y)/e.scale]);}",screen_itinerary)
        report['workpad_render_anchors']=screen_itinerary;report['workpad_local_anchors']=section
        page.locator('[aria-label="암층 재질"]').select_option('slate')
        screen=coords(page,section)
        page.screenshot(path=str(out/'00-fresh-same-source.png'))
        for q in screen:page.locator('#stageCanvas').click(position=q)
        assert sha(page)==base and page.evaluate(scope()) is None, 'new section committed before Save'
        page.screenshot(path=str(out/'01-canvas-section-preview.png'))
        page.locator('[data-joint-action="apply"]').click()
        page.wait_for_function(f'()=>!!({scope()})()',timeout=20000)
        first_state=page.evaluate(scope())
        assert math.dist(first_state['anchor'],section[-1])<3 and len(first_state['rim'])==4
        first=project_paths(page)
        before_move=sha(page)
        move(page,first_state['anchor'],'02-canonical-seam-drag.png')
        assert sha(page)==before_move,'motion preview should not commit'
        page.locator('[data-joint-action="apply"]').click()
        authored=sha(page)
        second=project_paths(page)
        assert all(a!=b for a,b in zip(first,second)), 'one or more sides did not move'
        page.screenshot(path=str(out/'03-committed-two-owned-paths.png'))
        with page.expect_download(timeout=20000) as pending:page.locator('[data-joint-action="download"]').click()
        draft=Path(pending.value.path())
        (out/'editor-exported.json').write_bytes(draft.read_bytes())
        payload=draft.read_text()
        assert len(payload.encode())<1024 and 'originalRoot' not in payload and '<svg' not in payload
        new_ctx=browser.new_context(viewport={'width':1500,'height':1000})
        reopened=boot(new_ctx)
        assert sha(reopened)==base,'fresh browser has wrong source'
        with reopened.expect_file_chooser(timeout=20000) as chooser:reopened.locator('[data-joint-action="open"]').click()
        chooser.value.set_files({'name':'scope-joint.json','mimeType':'application/json','buffer':payload.encode()})
        reopened.wait_for_function("['opened','failed'].includes(document.documentElement.dataset.jointDraft)",timeout=30000)
        assert reopened.evaluate("document.documentElement.dataset.jointDraft")== 'opened',reopened.evaluate("document.documentElement.dataset.jointDraftError")
        assert sha(reopened)==authored and project_paths(reopened)==second
        reopened_protected=protected(reopened)
        assert reopened_protected['guard']=='45469a164c7633befa5a5b41777fda5b1eeb314d35b994f9f4bf23807cd60aea'
        assert {k:v for k,v in reopened_protected.items() if k!='guard'}=={k:v for k,v in protected_before.items() if k!='guard'}
        report['reopened_protected']=reopened_protected
        coords(reopened,[reopened.evaluate(scope())['anchor']])
        reopened.screenshot(path=str(out/'04a-fresh-exact-match.png'))
        final_scene=game_frame(reopened,'06-game-west-reopened-exact.png')
        if initial_scene and final_scene:
            invariant_keys=['camera','officialFarReady','terrainSha256','unitsSha256']
            report['game_capture']={'before':initial_scene,'reopened':final_scene,
                'matching_camera_and_scene_data':all(initial_scene[k]==final_scene[k] for k in invariant_keys),
                'changed_game_canvas':initial_scene['rgbaSha256']!=final_scene['rgbaSha256'],
                'description':'composed game-engine frames in browser at fixed camera; not completed playthrough'}
        move(reopened,reopened.evaluate(scope())['anchor'],'04-fresh-editor-editable.png')
        reopened.locator('[data-joint-action="apply"]').click()
        third=project_paths(reopened)
        assert all(a!=b for a,b in zip(second,third)), 'reopened boundary not editable from pointer'
        report.update(passed=True,draft_bytes=len(payload.encode()),fresh_exact_match=True,pointer_reedit=True)
    except Exception as e:
        report['error']=str(e)
        (locals().get('reopened') or page).screenshot(path=str(out/'failure.png'));raise
    finally:
        (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        browser.close()
