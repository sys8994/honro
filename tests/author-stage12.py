"""Apply the design through the running Workshop, then save its canonical export."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch

out=ROOT/'reports/stage12-redesign';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1600,'height':1000})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());page.wait_for_function('window.HonroWorkshopAPI')
    page.add_script_tag(path=str(ROOT/'workshop/recipes/stage12-forest-basin.js'))
    original=page.evaluate('HonroWorkshopAPI.exportProject()')
    result=page.evaluate('''()=>{const a=HonroWorkshopAPI,commands=HonroStage12Design.commands(a.getProject());a.previewCommands(commands);return {commands:commands.length,validation:a.validateMap()}}''')
    assert page.evaluate('HonroWorkshopAPI.exportProject()')==original
    page.evaluate('HonroWorkshopAPI.applyPreview()');edited=page.evaluate('HonroWorkshopAPI.exportProject()')
    page.evaluate('HonroWorkshopAPI.undo()');assert page.evaluate('HonroWorkshopAPI.exportProject()')==original
    page.evaluate('HonroWorkshopAPI.redo()');assert page.evaluate('HonroWorkshopAPI.exportProject()')==edited
    assert not [x for x in page.evaluate('HonroWorkshopAPI.validateMap()') if x['level']=='err']
    (ROOT/'shared/data/campaign.json').write_text(edited+'\n',encoding='utf-8',newline='\n')
    page.evaluate('HonroWorkshopAPI.setOverlay(false)')
    for sid in [1,2]:
        page.evaluate('id=>{const a=HonroWorkshopAPI;a.selectStage("stage-"+id);const s=a.queryScene().stage||a.getProject().stages[id-1];a.setCamera({x:s.width/2,y:s.height/2,zoom:id===1?.245:.20});}',sid)
        page.wait_for_timeout(200)
        page.screenshot(path=str(out/f'workshop-stage-{sid}.png'))
    assert not errors,errors
    result.update({'previewUnchanged':True,'undoRedoExact':True,'errors':errors})
    (out/'authoring.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(result)
    browser.close()
