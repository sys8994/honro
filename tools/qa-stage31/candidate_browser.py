"""Local-only candidate importer. Import launch_candidate from other QA scripts.

The loader deliberately preserves the actual story, event, input and animation
hooks; only a fresh prepared campaign profile and candidate are supplied.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tests'))
from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright

DEFAULT_CANDIDATE = ROOT / 'art/act4-grounding-v1/stage31/project-v40-candidate.json'
DEFAULT_OUT = ROOT / '_local/reports/stage31-candidate-browser'


def launch_candidate(page, base_url, candidate=DEFAULT_CANDIDATE):
    """Launch Stage 31 with real entry story. Does not dismiss dialogue or move actors."""
    candidate = Path(candidate).resolve()
    raw = candidate.read_bytes()
    project = json.loads(raw)
    page.goto(base_url + '/HONRO.html')
    page.wait_for_function('window.HonroApp && window.HONRO_PROJECT', timeout=60000)
    entry = page.evaluate('''project=>{
      const a=HonroApp,map=project.stages.find(s=>s.id===project.activeStageId);
      if(!map||map.metadata?.stageId!==31)throw Error('Expected Stage 31 candidate');
      globalThis.HONRO_PROJECT=project;
      const profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(map)};
      profile.cleared={...profile.cleared};for(let i=1;i<=30;i++)profile.cleared[i]={};
      profile.settings={...profile.settings,sound:false,music:false};
      a.launchMap(project,map.id,{profile});
      const e=a.engine,b=e.b;
      return {stage:b.honroStage,preview:b.honroAct4Preview,custom:b.honroCustom,
        phase:b.phase,side:b.side,active:b.active,
        units:b.units.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,
          grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id})),
        terrain:b.terrain.length,landmarks:b.honroLandmarks?.length,
        boat:b.honroAct4PreviewState?.boat,water:b.honroAct4Design?.waterPolicies};
    }''', project)
    return {'candidate': str(candidate), 'candidateBytes': len(raw),
            'candidateSha256': hashlib.sha256(raw).hexdigest(), 'entry': entry}


def main():
    parser = argparse.ArgumentParser(description='Local Stage 31 candidate entry, with untouched story and game loop')
    parser.add_argument('--candidate', type=Path, default=DEFAULT_CANDIDATE)
    parser.add_argument('--out', type=Path, default=DEFAULT_OUT)
    parser.add_argument('--width', type=int, default=1440)
    parser.add_argument('--height', type=int, default=900)
    parser.add_argument('--wait-ms', type=int, default=2000)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    result = {'scope': 'Local custom-map Stage 31 entry; prepared fresh profile with prior clears. Story and game loop active; no mission completion claim.', 'pageErrors': [], 'consoleErrors': []}
    with serve_game() as base, sync_playwright() as pw:
        browser = launch(pw)
        try:
            page = browser.new_page(viewport={'width': args.width, 'height': args.height})
            page.on('pageerror', lambda e: result['pageErrors'].append(str(e)))
            page.on('console', lambda m: result['consoleErrors'].append({'text': m.text, 'location': m.location}) if m.type == 'error' else None)
            result.update(launch_candidate(page, base, args.candidate))
            page.wait_for_timeout(args.wait_ms)
            page.screenshot(path=str(args.out / 'entry.png'))
            result['afterWait'] = page.evaluate('''()=>({stage:HonroApp.engine.b.honroStage,
              phase:HonroApp.engine.b.phase,dialogue:!!HonroApp.dialogue,
              boat:HonroApp.engine.b.honroAct4PreviewState?.boat})''')
        finally:
            browser.close()
    (args.out / 'entry.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps(result, ensure_ascii=False))
    if result['pageErrors']:
        raise SystemExit('Page errors; inspect entry.json')


if __name__ == '__main__':
    main()
