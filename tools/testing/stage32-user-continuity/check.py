import json,sys,pathlib
p=pathlib.Path(sys.argv[1]);cfg=json.load(open(pathlib.Path(__file__).with_name('config.json')));rows=[]
for v in cfg['views']:
 data=[json.load(open(p/(k+'-'+v['name']+'.json'))) for k in ['baseline','candidate','window']]
 for k,r in zip(['baseline','candidate','window'],data):
  assert r['ok'] and r['commit']==cfg['baseline' if k=='baseline' else 'candidate']
  assert not r['storage'] and not r['errors']
  assert r['width']==v['width'] and r['height']==v['height']
 for r in data[1:]:
  assert r['unitsSHA']==data[0]['unitsSHA'] and r['terrainSHA']==data[0]['terrainSHA'],'Gameplay difference'
  assert r['camera']==data[0]['camera'],'Cannot compare different actual framing'
 rows.append(dict(view=v['name'],camera=data[0]['camera'],sameGameplay=True,manualArtReviewRequired=True))
(p/'result.json').write_text(json.dumps(dict(passed=True,qualityAccepted=False,rows=rows,scope='Actual requested portrait/left/lower Scenes. Not exact recovered user screenshot camera, no timing or all-stage claim.'),indent=2))
print('PASS same actual framing and gameplay; inspect all nine PNGs before judging continuity')
