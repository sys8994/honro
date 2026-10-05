"""Actual Game/Stage View/Playtest parity and room framing. Run only where the
supported browser can access the built HTML. These captures are visual evidence,
not an automatic art approval or a normal-combat clear."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/act2-spatial/browser'
OUT.mkdir(parents=True, exist_ok=True)
rows, errors = [], []

def prepare(page, sid):
    page.evaluate('''id=>{const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();a.profile.recruited=['archer','mage','knight','occultist'];for(let n=1;n<21;n++)a.profile.cleared[n]={rounds:20};a.launch(id);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.banterCurrent=null;a.modal.classList.remove('open');const s=a.scene;s.storyTween=null;s.goalFocus=null;s.cinematic=null;s.manual=true;}''', sid)

def snapshot(page, expression):
    return page.evaluate('''expression=>{const r=eval(expression),b=r.engine.b;return {stage:b.honroStage,space:b.honroMap.space,terrain:b.terrain.map(t=>({id:t.id,vertices:t.vertices,x:t.x,y:t.y,w:t.w,h:t.h,oneWay:t.oneWay})),markers:b.honroMarkers.map(m=>({id:m.id,x:m.x,y:m.y})),units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,attack:u.attack})),bell:b.honroElements.filter(e=>e.assetId==='act2:bell').map(e=>({id:e.id,x:e.x,y:e.y,scale:e.scale}))}}''', expression)

with sync_playwright() as p:
    browser = launch(p)
    game = browser.new_page(viewport={'width': 1440, 'height': 900})
    editor = browser.new_page(viewport={'width': 1440, 'height': 900})
    for page in (game, editor):
        page.on('pageerror', lambda e: errors.append(str(e)))
    game.goto((ROOT / 'HONRO.html').as_uri())
    game.wait_for_function('window.HonroApp')
    editor.goto((ROOT / 'HONRO_WORKSHOP.html').as_uri())
    editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    for sid in range(11, 21):
        prepare(game, sid)
        actual = snapshot(game, 'HonroApp')
        assert actual['space']['geometryRevision'] == 3
        editor.evaluate('id=>HonroWorkshopAPI.selectStage("stage-"+id)', sid)
        stage_view = snapshot(editor, 'HonroWorkshopAPI.getRuntime()')
        # The campaign profile may have different hero XP; map geometry and
        # authored target placement must agree in all three execution paths.
        for key in ('space', 'terrain', 'markers', 'bell'):
            assert actual[key] == stage_view[key], (sid, 'Game/Stage View', key)
        saved = editor.evaluate('HonroWorkshopAPI.exportProject()')
        editor.click('[data-tab="play"]')
        editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
        play = editor.frames[1]
        play.evaluate('HonroApp.frame=()=>{};while(HonroApp.dialogue)HonroStory.finish(HonroApp)')
        played = snapshot(play, 'HonroApp')
        for key in ('space', 'terrain', 'markers', 'bell'):
            assert played[key] == stage_view[key], (sid, 'Playtest/Stage View', key)
        editor.click('#stopPlay')
        assert editor.evaluate('HonroWorkshopAPI.exportProject()') == saved
        for width, height in ((1440, 900), (390, 844), (844, 390)):
            game.set_viewport_size({'width': width, 'height': height})
            for index, room in enumerate(actual['space']['rooms']):
                data = game.evaluate('''room=>{const a=HonroApp,s=a.scene,b=a.engine.b,box=room.bounds;const before=JSON.stringify({terrain:b.terrain.map(t=>t.vertices),units:b.units.map(u=>[u.id,u.x,u.y,u.hp])});s.x=box.x+box.w/2;s.y=box.y+box.h/2;s.scale=Math.max(HonroBounds.zoomLimits(innerWidth).min,Math.min(.68,innerWidth/Math.max(100,box.w)));s.render(a.engine,0);a.updateHUD(true);return {finite:[s.x,s.y,s.scale].every(Number.isFinite),overflow:document.documentElement.scrollWidth>innerWidth,pure:before===JSON.stringify({terrain:b.terrain.map(t=>t.vertices),units:b.units.map(u=>[u.id,u.x,u.y,u.hp])})}}''', room)
                assert data['finite'] and not data['overflow'] and data['pure'], (sid, room['id'], width, data)
                game.screenshot(path=str(OUT / f"stage-{sid}-{room['id']}-{width}.png"))
        rows.append({'stage': sid, 'topology': actual['space']['topologyId'], 'rooms': len(actual['space']['rooms']), 'parity': ['Game', 'Stage View', 'Playtest']})
    assert not errors, errors
    browser.close()

(OUT / 'checks.json').write_text(json.dumps({'rows': rows, 'errors': errors, 'limitations': 'Geometry parity and real-render framing. Human art/readability review remains separate from automated assertions.'}, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'stages': len(rows), 'screenshots': len(list(OUT.glob('*.png'))), 'errors': errors}))
