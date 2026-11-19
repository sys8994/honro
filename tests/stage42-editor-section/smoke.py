"""Only run with the intended isolated patched Workshop fixture upstream."""
from pathlib import Path
import json, sys, math, os
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:8870/HONRO_WORKSHOP.html'
report={'passed':False,'evidence':'real browser UI, no geometry mutation API'}
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
        return page.evaluate("""pts=>{const api=HonroWorkshopAPI,s=api.queryScene().stage,e=s.elements.find(e=>e.assetId==='act5:near:42');api.setCamera({x:150,y:1850,zoom:.6});const c=document.querySelector('#stageCanvas'),v=api.getEditorState().stageView;return pts.map(([x,y])=>{const a=c.clientWidth/2+(e.x+x*e.scale-v.x)*v.zoom,b=c.clientHeight/2+(e.y+y*e.scale-v.y)*v.zoom;if(a<10||b<10||a>c.clientWidth-10||b>c.clientHeight-10)throw Error('authored point outside canvas');return {x:a,y:b};});}""",points)
    def move(page, local, photo):
        c=page.locator('#stageCanvas')
        q=coords(page,[local])[0];b=c.bounding_box()
        x,y=b['x']+q['x'],b['y']+q['y']
        page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+26,y+18,steps=9)
        page.screenshot(path=str(out/photo));page.mouse.up()
    ctx=browser.new_context(viewport={'width':1500,'height':1000},accept_downloads=True)
    page=boot(ctx)
    try:
        base=sha(page)
        protected_before=protected(page)
        assert protected_before['sourceBody']=='4a413feb79ba5cabb75a8a3e204bce816548db1c80857e11a9538391625756a8'
        assert protected_before['sourceClips']=='6784931b63ee57114f0c90810a16b886eba91d45f868a319178a4ccf4f11cedb'
        report['source']=protected_before
        section=[[-105,511],[-45,617],[-148,762],[-255,666],[-143,626]]
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
