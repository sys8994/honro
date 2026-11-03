"""Verify and reuse actual exported approach checkpoints, never fabricate battles."""
import importlib.util,io,json,pathlib,zipfile
path=pathlib.Path(__file__).with_name('verify-candidate.py');spec=importlib.util.spec_from_file_location('proof',path);v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
RUN=41576630241;ARTIFACT=13205206279;SHA='05a4271460b5d6e5b7cfad3a64e7e34f967983cc428d69bcf4fdba10b5a6c7cd';SOURCE='b9cadd23981c4da6ece10e4a2a5eb56ef1b806c7'
def validate(archive):
 assert v.digest(archive)==SHA,'Natural evidence archive hash mismatch'
 with zipfile.ZipFile(io.BytesIO(archive)) as z:
  summary=json.loads(z.read('monster-natural/summary.json'));assert [r['result']['phase'] for r in summary['rows']]==['won','won'];assert len(summary['branchErrors'])==8,'Retain known failed branch scope'
  pre=json.loads(z.read('monster-natural/preflight/stage5/natural-result.json'));assert pre['result']['index']==2
  results={}
  for stage in [5,8]:
   data=z.read(f'monster-natural/stage{stage}/natural-result.json');d=json.loads(data);assert d['meta']['candidate']==v.CANDIDATE and d['result']['phase']=='won';assert d['checkpoints']
   b=d['checkpoints'][0]['profile']['honroBattle'];assert b['honroStage']==stage and b['honroMonsterEffectsRevision']==1 and isinstance(b['session'],str) and b['session']
   caster=next(u for u in b['units'] if u['id']==('s5-cave-shade' if stage==5 else 's8-15'));c=caster['enemyEffectCast'];assert c['seen'] and c['offered'] and not c['responded'] and c['target']==b['active']
   results[stage]=data
  return results,summary
if __name__=='__main__':
 run=v.api(f'actions/runs/{RUN}');assert (run['head_sha'],run['status'],run['conclusion'])==(SOURCE,'completed','failure'),'Original route CI failure must not become an all-green claim'
 meta=v.api(f'actions/artifacts/{ARTIFACT}');assert meta['workflow_run']['id']==RUN and meta['workflow_run']['head_sha']==SOURCE and meta['digest']=='sha256:'+SHA and not meta['expired']
 v.ARTIFACT=ARTIFACT;results,summary=validate(v.download_artifact());out=v.ROOT/'_local/reports/monster-natural'
 for stage,data in results.items():
  dest=out/f'stage{stage}';dest.mkdir(parents=True,exist_ok=True);(dest/'natural-result.json').write_bytes(data)
 (out/'checkpoint-reuse.json').write_text(json.dumps({'run':RUN,'artifact':ARTIFACT,'sha256':SHA,'source':SOURCE,'candidate':v.CANDIDATE,'originalSummary':summary,'scope':'Only genuine exported checkpoint branches rerun. Original main-route wins reused with their original provenance; no new end-to-end or final release claim.'},indent=2))
 print('PASS original natural route archive and genuine offered checkpoint provenance; original branch failures retained')
