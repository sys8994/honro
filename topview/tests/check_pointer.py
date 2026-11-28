"""Exercise the desktop camera and native unit card, and measure the three action buttons."""
import argparse
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
from native_entry import enter_chapter

parser = argparse.ArgumentParser()
parser.add_argument('--base', required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
args.out.mkdir(exist_ok=True, parents=True)
report = {}
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1180,'height':760})
    errors=[]
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.base)
    enter_chapter(page)
    while page.locator('[data-action=dialogue-next]:visible').count():
        page.locator('[data-action=dialogue-next]:visible').first.click()
    page.wait_for_function('HonroApp.canInput()&&!HonroStory.turnPaused(HonroApp)')
    assert not page.locator('[data-center],[data-zoom]').count()
    def camera():
        return page.evaluate('()=>[HonroApp.scene.cx,HonroApp.scene.cy,HonroApp.scene.zoomLevel]')
    def drag(start, end):
        page.mouse.move(*start);page.mouse.down();page.mouse.move(*end,steps=5);page.mouse.up()
    mini=page.locator('#minimap').bounding_box()
    mid=lambda x,y: (mini['x']+x*mini['width'],mini['y']+y*mini['height'])
    page.mouse.click(*mid(.5,.5));before=camera()
    drag((535,245),(630,270))
    assert camera()==before, (before,camera())
    drag(mid(.50,.50),mid(.76,.67));after=camera()
    assert after[0]>before[0]+220 and after[1]>before[1]+100,(before,after)
    report['fieldDragAndMinimap']=[before,after]
    page.mouse.move(4,200)
    page.wait_for_function('x=>HonroApp.scene.cx<x-50',arg=after[0])
    page.mouse.move(575,215);stop=camera()
    page.wait_for_timeout(200)
    assert camera()==stop
    report['edgePan']={'left':[after,stop]}
    for name,x,y,axis,sign in [('right',1176,240,0,1),('up',530,2,1,-1),('down',570,758,1,1)]:
        page.mouse.click(*mid(.5,.5));origin=camera();page.mouse.move(x,y)
        prop='cx' if axis==0 else 'cy'
        page.wait_for_function(f'([v,sign])=>(HonroApp.scene.{prop}-v)*sign>30',arg=[origin[axis],sign])
        page.mouse.move(570,215);report['edgePan'][name]=[origin,camera()]
    # Place the camera on a real unit, then use a real pointer on its painted silhouette.
    def actor(id):
        return page.evaluate('''async id=>{
          const a=HonroApp,s=a.scene,e=a.engine,u=id?e.unit(id):e.b.units.find(v=>v.side===1&&!v.dead);
          s.centerAt(u.x,u.y-u.h*.5);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
          const f=s.screenPoint(u.x,u.y-u.h*.5),z=s.zoomLevel;
          for(let h=8;h<65;h+=2)for(let dx=-4;dx<=4;dx+=2){
            const point={x:f.x+dx*z,y:f.y-h*z};if(s.pickScreenUnit(point,0)?.id===u.id)return {...point,id:u.id,name:u.name};
          }
          throw Error('No visible body for '+u.id);
        }''', id)
    foe=actor(None)
    page.mouse.move(foe['x'],foe['y'])
    page.wait_for_function('id=>HonroApp.scene.hoverUnitId===id',arg=foe['id'])
    page.mouse.click(foe['x'],foe['y'])
    panel=page.locator('#unit-info')
    panel.wait_for(state='visible')
    assert panel.get_attribute('data-unit-id')==foe['id'] and foe['name'] in panel.locator('h3').inner_text()
    report['nativeUnitCard']={'id':foe['id'],'title':panel.locator('h3').inner_text()}
    page.screenshot(path=args.out/'native-unit-card.jpg',quality=85)
    panel.locator('.unit-info-close').click()
    hero=actor('p-archer');page.mouse.move(hero['x'],hero['y']);page.mouse.click(hero['x'],hero['y'])
    page.wait_for_function("HonroApp.engine.b.active==='p-archer'&&HonroApp.scene.inspectUnitId==='p-archer'")
    panel.locator('.unit-info-close').click()
    report['ally']=hero['id']
    report['HUD']={}
    for width,height in [(1180,760),(844,480),(390,844),(320,690)]:
        page.set_viewport_size({'width':width,'height':height})
        b=page.evaluate('''()=>Object.fromEntries(['fire','lock','guard','skills','readout'].map((name,i)=>{
          const el=document.querySelector(['#fire','#move-lock','.honro-defend','#combat-skills','.shot-readout'][i]),r=el.getBoundingClientRect();
          return [name,{x:r.x,y:r.y,w:r.width,h:r.height,ownsCenter:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}];
        }))''')
        fire,lock,guard=b['fire'],b['lock'],b['guard']
        assert all(x['ownsCenter'] for x in [fire,lock,guard]),b
        assert fire['w']>=lock['w']*1.8 and lock['y']+lock['h']<guard['y'] and lock['x']+lock['w']<=fire['x']+1,b
        assert b['skills']['x']+b['skills']['w']<=lock['x']+1 and b['readout']['y']>=fire['y']+fire['h']-.5,b
        assert all(0<=x['x'] and x['x']+x['w']<=width+1 and x['y']+x['h']<=height+1 for x in [fire,lock,guard]),b
        page.locator('.radial-actions').screenshot(path=args.out/f'hud-{width}.png')
        report['HUD'][str(width)]=b
    browser.close()
    report['errors']=errors
    assert not errors,errors
(args.out/'pointer.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
