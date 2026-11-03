"""Reuse one genuine R17 checkpoint from the exact6b natural route."""
import importlib.util,io,json,pathlib,zipfile
path=pathlib.Path(__file__).parents[1]/'monster-a1-qa/verify-candidate.py';spec=importlib.util.spec_from_file_location('proof',path);v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
RUN=41587173987;ARTIFACT=13208647885;SHA='3a94e61a893ebd1650ee2a2e00debb9e20568f8d656105e66e94d91fc2ece28e';QA='0e8725aa2c7b3573e7db116b7170323f6508bcf5';SOURCE='6b00abe2308275410c2947412c1cd0c7d62b733d'
def validate(archive):
 assert v.digest(archive)==SHA
 with zipfile.ZipFile(io.BytesIO(archive)) as z:
  proof=json.loads(z.read('stage8-crow-qa/built-provenance.json'));assert proof['candidate']==SOURCE and proof['qaCommit']==QA
  result=json.loads(z.read('monster-natural/stage8/natural-result.json'));assert result['result']['phase']=='won' and result['result']['round']==18
  data=z.read('monster-natural/stage8/round-17.json');d=json.loads(data);b=d['profile']['honroBattle'];assert d['sourceHash']==SOURCE and b['honroStage']==8 and b['round']==17 and b['side']==0 and b['active']=='p-archer';assert not b['honroState']['stage8Bier']['entries'].get('stage8-settled-crows')
  return data,proof
if __name__=='__main__':
 run=v.api(f'actions/runs/{RUN}');assert (run['head_sha'],run['status'],run['conclusion'])==(QA,'completed','success')
 meta=v.api(f'actions/artifacts/{ARTIFACT}');assert meta['workflow_run']['id']==RUN and meta['digest']=='sha256:'+SHA and not meta['expired']
 v.ARTIFACT=ARTIFACT;data,proof=validate(v.download_artifact());out=v.ROOT/'_local/reports/stage8-crow-visibility';out.mkdir(parents=True,exist_ok=True);(out/'round-17.json').write_bytes(data);(out/'round-17-profile.json').write_text(json.dumps(json.loads(data)['profile'],ensure_ascii=False));(out/'reuse-proof.json').write_text(json.dumps({'run':RUN,'artifact':ARTIFACT,'artifactSha256':SHA,'source':SOURCE,'checkpointSha256':v.digest(data),'originalBuiltProof':proof,'scope':'Same-run genuine R17 continuation branches only, not another full-route win'},indent=2));print('PASS exact genuine6b R17 checkpoint')
