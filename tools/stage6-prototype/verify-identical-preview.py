"""Bind independently played Stage6 evidence only to identical served bytes.
Does not create, alter or replace any Stage31 probe/release approval.
"""
import hashlib, json, os, zipfile
from pathlib import Path
OUT = Path(os.environ['OUT'])
packed = Path('/tmp/stage6-independent-proof.zip').read_bytes()
assert hashlib.sha256(packed).hexdigest() == 'd21ea30d1b2595f440d5cdd6fb3df5cfaac637146e6d6f37a0666bcdad6fb85a'
z = zipfile.ZipFile('/tmp/stage6-independent-proof.zip')
def read(path): return json.loads(z.read(path))
prefix = 'stage6-art-preview/'
scope = read('stage6-master-preview/preview-scope.json')
assert scope['source'] == 'b034329c2713ee1b186b55171a149fd1e42b1f61'
assert scope['sameHtml'] and scope['sameActiveFiles'] and not scope['publishing']
digest = json.loads((OUT / 'focused-probes.json').read_text())['digest']
assert digest == scope['runtimeSha256'] == '71ca9ae69206e43d8d0081d594c77d230970876f3bc80fb1d4c698e6eddd3219'
html = hashlib.sha256(Path('HONRO.html').read_bytes()).hexdigest()
assert html == '48508e7cbf43ad5985092a8fb62840fe9a9dabc7d5c7ac9ff49cf161809ee41a'
served = dict((line.split()[1],line.split()[0]) for line in z.read(prefix+'served-sha256.txt').decode().splitlines())
assert html == served['HONRO.html']
normalize = lambda files: sorted((f['path'],f['bytes'],f['sha256']) for f in files)
assert normalize(json.loads(Path('web/manifest.json').read_text())['files']) == normalize(read('stage6-master-preview/preview-active-files.json'))
r = read(prefix+'integrated-play/result.json')
assert r['source'] == scope['source'] and r['status'] == 'terminal-won' and r['pursuitVerified'] and not r['errors']
assert r.get('pursuitNotice') and r.get('pursuitEntry') and r.get('pursuitAction')
capture = read(prefix+'result.json')
assert not capture['errors'] and all(capture['saveContinue'][k] for k in ['terrainUnchanged','persistedReload','coverageReverified'])
assert all(capture['saveFailurePreservation'][k] for k in ['priorBytesUnchanged','liveIdentityUnchanged','liveContentsUnchanged'])
assert capture['coverageCases']['valid'] and all(not capture['coverageCases'][k] for k in ['oldRevision','missingSkin','otherStage','changedTerrain','changedSkin'])
legacy = read(prefix+'integrated-save-boundary.json');assert legacy['preservedGrowthAndLoadout']
views = read(prefix+'checkpoint-review/result.json');assert not views.get('error') and not views['errors'] and len(views['views'])==3
for v in views['views']:
    assert v['dropHpLoss']==0
    assert all(v[k] for k in ['terrainSame','presentationNoMutation','objectiveClear','actualShot','movedLeft','landingProtected','movementProtected'])
save = read('stage6-pursuit-continue/result.json');assert save['status']=='pass' and not save['errors']
assert save['checkpointSHA256']=='19f9cbe6c839b02fcf50b1ad952835f8498efb343c054b51835be9aca2ed61ab'
assert save['second-continue']['eventFlag'] and len(save['second-continue']['members'])==2
summary={'sourceCommit':os.environ['GITHUB_SHA'],'productSource':'9e4ecc00a28c882ae4a928bac58c47d086ea4264','independentSource':scope['source'],'independentRun':41749166355,'artifact':13284369832,'artifactZipSha256':'d21ea30d1b2595f440d5cdd6fb3df5cfaac637146e6d6f37a0666bcdad6fb85a','htmlSha256':html,'runtimeSha256':digest,'activeFilesIdentical':True,'stage6RouteWon':True,'pursuitEntryAndAction':True,'observedRound':r['final']['round'],'pursuitDamage':[v for v in r['observedDamage'] if v['source']=='pursuit'],'r7ContinueResavePassed':True,'threeViewportInputsPassed':True,'legacySavePassed':True,'scope':'Only Stage6 functional evidence is reused because exact HTML, runtime and active asset bytes match; official Stage31 fullplay/attach/gate must separately pass this job.'}
(OUT/'stage6-identical-proof-binding.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
for name in [prefix+'integrated-play/result.json',prefix+'integrated-save-boundary.json',prefix+'checkpoint-review/result.json','stage6-pursuit-continue/result.json']:
    dest=OUT/'stage6-bound-evidence'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(name))
print(json.dumps(summary,ensure_ascii=False))
