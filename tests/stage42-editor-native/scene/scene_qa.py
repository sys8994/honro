"""Seven same-camera Scene proofs from actual Workshop browser sessions, no imported static vector."""
import base64
import hashlib
import json
import os
import re
from pathlib import Path

VIEWS = ('overview', 'west', 'east', 'top', 'bottom', 'contact', 'portrait')
HERE = Path(__file__).resolve().parent
STAGE = 'stage-42'
OWNER = 'act5:near:42'


def capture_pair(browser, candidate_page, snapshot, before, after, out, result, checkpoint):
    source = os.environ['GITHUB_SHA']
    assert re.fullmatch(r'[a-f0-9]{40}', source)
    assert os.environ['GITHUB_REF'] == 'refs/heads/qa/stage42-editor-native'
    spec = json.loads((HERE/'views.json').read_text())
    assert tuple(spec)==VIEWS
    assert after['count'] == before['count']+1
    assert after['clips'] == before['clips'] and after['other'] == before['other']
    assert before['full'] != after['full']
    assert before["full"] == os.environ["HONRO_AUTHORED_BASE_SHA256"], "Official Workshop base differs from the verified source pin"
    assert candidate_page.evaluate(snapshot) == after, 'Did not preserve exact reopened state'
    result['scene'] = {'source_sha':source, 'baseline_project_sha256':before['full'],
                       'candidate_project_sha256':after['full'],
                       'approved_body_clips_sha256':before['clips'], 'views':{}}
    code=(HERE/'scene-capture.js').read_text()
    base_context=browser.new_context(viewport={'width':1500,'height':1000},device_scale_factor=1)
    baseline_page=base_context.new_page()
    try:
        baseline_page.goto('http://127.0.0.1:8870/HONRO_WORKSHOP.html')
        baseline_page.wait_for_function('window.HonroWorkshopAPI?.getEditorState()',timeout=90000)
        baseline_page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
        assert baseline_page.evaluate(snapshot) == before, 'Scene baseline differs from untouched Workshop'
        checkpoint('scene-pinned-baseline')
        for name in VIEWS:
            pair = {}
            for variant, p, proof in (('baseline',baseline_page,before), ('candidate',candidate_page,after)):
                shot = p.evaluate(code, {'view':spec[name], 'projectSha256':proof['full'],
                                        'stageId':STAGE, 'faceCount':proof['count'], 'ownerAssetId':OWNER})
                assert shot['stageId']==STAGE and shot['view']==name and shot['farReady']
                assert shot['projectSha256']==proof['full']
                assert re.fullmatch(r'[a-f0-9]{64}',shot['pixelSha256'])
                png_data=shot.pop('png')
                assert png_data.startswith('data:image/png;base64,')
                pixels=base64.b64decode(png_data.split(',',1)[1],validate=True)
                assert pixels.startswith(b'\x89PNG\r\n\x1a\n')
                (out/f'scene-{name}-{variant}.png').write_bytes(pixels)
                pair[variant]=(shot,hashlib.sha256(pixels).hexdigest())
            baseline, baseline_png=pair['baseline']
            candidate, candidate_png=pair['candidate']
            for key in ('camera', 'physicsSha256', 'unitsSha256'):
                assert baseline[key]==candidate[key], f'Mismatched {name}: {key}'
            result['scene']['views'][name]={
                'camera':baseline['camera'],'official_far_ready':True,
                'physics_sha256':baseline['physicsSha256'],'units_sha256':baseline['unitsSha256'],
                'baseline_png_sha256':baseline_png,'candidate_png_sha256':candidate_png,
                'baseline_rgba_sha256':baseline['pixelSha256'],'candidate_rgba_sha256':candidate['pixelSha256'],
                'changed_pixels':baseline['pixelSha256']!=candidate['pixelSha256']
            }
            checkpoint(f'scene-{name}-paired')
        assert any(s['changed_pixels'] for s in result['scene']['views'].values()), 'No visual difference in any requested view'
        assert baseline_page.evaluate(snapshot) == before, 'Scene mutated baseline'
        assert candidate_page.evaluate(snapshot) == after, 'Scene mutated candidate'
        result['scene']['pass']=True
        checkpoint('scene-seven-pairs-passed')
    finally:
        base_context.close()
