"""Read-only actual R22/R29 saves on the integrated production web artifact.

Production Continue/export and one declared inspection render per save. Frame
scheduling is frozen before Continue; no combat input, tick or art migration.
Fresh Stage18 art is inspected separately with stage18-floor-finish-capture.py.
"""
import gzip
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests'))
from story_browser_server import story_base_url

OUT = ROOT / '_local/reports/stage18-integration/browser'
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path=shutil.which('chromium'), headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage'])
    rows = []
    for key in ['post-descent-r22', 'stop-r29']:
        source = ROOT / f'tests/fixtures/stage18-current-{key}-20261022.json.gz'
        original_bytes = source.read_bytes()
        record = json.loads(gzip.decompress(original_bytes))
        expected = record['profile']['honroBattle']
        context = browser.new_context(viewport={'width': 1180, 'height': 757})
        page = context.new_page()
        errors, http = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: http.append({
            'url': response.url, 'status': response.status})
            if response.status >= 400 else None)
        page.goto(story_base_url() + '/HONRO.html', wait_until='domcontentloaded')
        page.wait_for_function('window.HonroApp', timeout=90000)
        page.evaluate('''async()=>{
          await HonroCampaignLoader.ensureStage(18); HonroApp.frame=()=>{};
        }''')
        page.wait_for_timeout(80)
        page.evaluate('''profile=>{
          const a=HonroApp; a.debugMode=false; a.profile=profile;
          a.normalProfile=profile; a.continue();
        }''', record['profile'])
        page.wait_for_function('HonroApp.engine?.b.honroStage===18', timeout=90000)
        battle = lambda: json.loads(page.evaluate('JSON.stringify(HonroApp.engine.b)'))
        assert battle() == expected, 'Continue must preserve the whole actual battle'
        page.wait_for_function('HonroAuthoredFarArt.ready(18)', timeout=90000)
        info = page.evaluate('''()=>{
          const a=HonroApp,b=a.engine.b,s=a.scene;
          a.close(); a.updateHUD(true);
          Object.assign(s,{manual:true,x:7400,y:7100,scale:.3,
            goalFocus:null,cinematic:null,storyTween:null});
          s.render(a.engine,0,'',.6,false,0);
          const target=HonroQuestTargets.records(b).find(t=>t.id==='upper-chain');
          const actor=a.engine.unit('upper-chain');
          return {round:b.round,phase:b.phase,goal:HonroAct2.current(b)?.id,
            descent:structuredClone(HonroStage18Bell.memory(b)),
            target:structuredClone(target),targetActor:{hp:actor.hp,dead:actor.dead},
            heroes:a.engine.heroesAlive().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,
              grounded:a.engine.grounded(u),
              validBody:HONRO_CORE.validTerrainContactPose(b.terrain,u),
              support:a.engine.contactSurface(u.x,u.y-5,u.y+5)?.t?.id})),
            keeper:structuredClone(a.engine.unit('act2-keeper')),
            savedVisualEqualsFresh:JSON.stringify(b.honroMap.space.terrainPlanes)===
              JSON.stringify(HONRO_PROJECT.stages[17].design.space.terrainPlanes)};
        }''')
        assert not info['savedVisualEqualsFresh'], 'Old snapshot art stays distinct from fresh art'
        for hero in info['heroes']:
            if hero['grounded']:
                assert hero['validBody'], hero
        assert len(info['heroes']) == 4
        assert info['targetActor']['dead'] == bool(info['target'].get('broken'))
        assert info['targetActor']['hp'] == (0 if info['target'].get('broken') else info['target']['hp'])
        shot = OUT / f'actual-{key}.jpg'
        page.screenshot(path=str(shot), type='jpeg', quality=85)
        assert shot.stat().st_size < 1_000_000
        assert battle() == expected, 'Inspection render must preserve actual gameplay'
        with page.expect_download() as download:
            page.evaluate('HonroApp.export()')
        exported = json.loads(Path(download.value.path()).read_text())
        assert exported['honroBattle'] == expected, 'Export must preserve the whole battle'
        assert battle() == expected
        assert source.read_bytes() == original_bytes
        assert not errors, errors
        assert not http, http
        rows.append({'input': str(source.relative_to(ROOT)),
            'inputSha256': hashlib.sha256(original_bytes).hexdigest(),
            'wholeBattleContinueAndExportExact': True, 'renderPure': True,
            'savedArtPreservedDistinctFromFresh': True,
            'scope': 'Actual saved battle, frozen inspection. No new combat.',
            'view': info, 'errors': errors, 'httpFailures': http})
        context.close()
    browser.close()

result = {'checkedCommit': subprocess.check_output(
    ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'rows': rows,
    'entry': json.loads((ROOT / 'web/manifest.json').read_text())['gameEntry']}
(OUT / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print('PASS production browser actual R22/R29 whole-battle Continue/export exact; old art preserved')
