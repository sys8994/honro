import json,sys,os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
r={'pass':False,'step':'launch'}
def checkpoint(step):
 r['step']=step
 (out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
 print(step,flush=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ["HONRO_CHROME"])
 page=b.new_page(viewport={'width':1500,'height':1000},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto('http://127.0.0.1:8870/HONRO_WORKSHOP.html')
  page.wait_for_function('window.HonroWorkshopAPI?.getProject()?.stages.some(s=>s.id==="stage-42")',timeout=90000)
  page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
  project="()=>HonroWorkshopAPI.getProject()"
  before=page.evaluate(project)
  def body(p):return next(a for a in p['library'] if a['id']=='act5:near:42')['edgeWall']
  def other(p):
   copy=json.loads(json.dumps(p))
   del next(a for a in copy['library'] if a['id']=='act5:near:42')['edgeWall']
   return copy
  def faces(p):return body(p).get('params',{}).get('bodyEditorFaces',[])
  points=[[180,580],[225,598],[265,590],[242,643],[192,638]]
  canvas=page.locator('#stageCanvas')
  screen=page.evaluate("""pts=>{const a=HonroWorkshopAPI,s=a.queryScene().stage,e=s.elements.find(e=>e.assetId==='act5:near:42');a.setCamera({x:e.x+222*e.scale,y:e.y+612*e.scale,zoom:2});const c=document.querySelector('#stageCanvas'),v=a.getEditorState().stageView;return pts.map(([x,y])=>({x:c.clientWidth/2+(e.x+x*e.scale-v.x)*v.zoom,y:c.clientHeight/2+(e.y+y*e.scale-v.y)*v.zoom}));}""",points)
  page.locator('[data-tool="nativeBody"]').click()
  if not page.evaluate("HonroWorkshopAPI.getEditorState().overlayEnabled"):page.locator("#overlayToggle").click()
  page.screenshot(path=str(out/'01-editor-ready.png'))
  checkpoint('editor-ready')
  for i,q in enumerate(screen):
   canvas.click(position=q)
   checkpoint('point-'+str(i+1))
  assert page.evaluate(project)==before,'draft unexpectedly committed'
  page.screenshot(path=str(out/'02-editor-drawing.png'))
  # True pointer drag: do not silently substitute an API call or click-to-place.
  q=screen[1];box=canvas.bounding_box()
  x,y=box['x']+q['x'],box['y']+q['y']
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+22,y+10,steps=8)
  page.screenshot(path=str(out/'03-editor-pointer-drag.png'))
  page.mouse.up()
  page.locator('.body-controls').get_by_role('button',name='미리보기',exact=True).click()
  r['preview_toast']=page.locator('#toast').text_content()
  checkpoint('preview-clicked')
  assert page.evaluate(project)==before,'preview unexpectedly committed'
  page.screenshot(path=str(out/'04-editor-preview.png'))
  page.locator('.body-controls').get_by_role('button',name='저장',exact=True).click()
  r['save_toast']=page.locator('#toast').text_content()
  checkpoint('save-clicked')
  after=page.evaluate(project)
  assert other(after)==other(before)
  assert len(faces(after))==len(faces(before))+1,('new face did not persist',r['preview_toast'],r['save_toast'],len(faces(before)),len(faces(after)))
  verts=faces(after)[-1]['points']
  assert abs(verts[1][0]-225)>4 and verts[1][0]>225,'drag did not persist as an edited vertex'
  assert body(after)['vector']['clips']==body(before)['vector']['clips']
  page.screenshot(path=str(out/'05-editor-committed.png'))
  target_id=faces(after)[-1]['id']
  with page.expect_download(timeout=30000) as d:
   page.get_by_role('button',name='암반 초안 내보내기',exact=True).click()
  # Runner-local only: never include the full draft in artifact output.
  import tempfile
  with tempfile.TemporaryDirectory() as td:
   draft=Path(td)/'stage42-draft.json';d.value.save_as(draft)
   fresh=b.new_context(viewport={'width':1500,'height':1000},device_scale_factor=1).new_page()
   fresh.goto('http://127.0.0.1:8870/HONRO_WORKSHOP.html')
   fresh.wait_for_function('window.HonroWorkshopAPI?.getProject()?.stages.some(s=>s.id==="stage-42")',timeout=90000)
   fresh.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
   assert fresh.evaluate(project)==before,'Fresh editor did not open the original'
   fresh.locator('[data-tool="nativeBody"]').click()
   with fresh.expect_file_chooser() as f:
    fresh.get_by_role('button',name='암반 초안 열기',exact=True).click()
   f.value.set_files(str(draft))
   fresh.wait_for_function("""id=>HonroWorkshopAPI.getProject().library.find(x=>x.id==='act5:near:42').edgeWall.params.bodyEditorFaces?.some(f=>f.id===id)""",arg=target_id,timeout=30000)
   assert fresh.evaluate(project)==after,'Reopened draft differs from saved editor source'
   fresh.evaluate("""()=>{const a=HonroWorkshopAPI,e=a.queryScene().stage.elements.find(e=>e.assetId==='act5:near:42');a.setCamera({x:e.x+222*e.scale,y:e.y+612*e.scale,zoom:2});}""")
   fresh.get_by_role('button',name='최근 작성면 편집',exact=True).click()
   fresh.screenshot(path=str(out/'06-editor-reopened-editable.png'))
  r['fresh_reopen']=True
  r.update(pass_=True,points=verts); r['pass']=True
 except Exception as e:
  r['error']=str(e);page.screenshot(path=str(out/'failure-editor-screen.png'));raise
 finally:
  r['page_errors']=errors;(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
  b.close()
