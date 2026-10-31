"""Compare independently captured full-clone and candidate Chromium results."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]/'_local/act4-perf'
def read(name):return json.loads((root/name).read_text())
def verify(a,b,label):
 assert a==b,label+' differs'
 print(label,hashlib.sha256(json.dumps(a,sort_keys=True).encode()).hexdigest())
base=read('stage40-all-skills-baseline.json');candidate=read('stage40-all-skills-candidate.json')
assert len(base['results'])==745
assert all(x['unchanged'] and x['rngBefore']==x['rngAfter'] and 'error' not in x['output'] for x in base['results'])
verify(base,candidate,'745 skills')
for fixture in ('sailing-observation','landed'):
 a=read(f'stage40-checkpoint-diff-{fixture}-baseline-v2.json');b=read(f'stage40-checkpoint-diff-{fixture}-candidate.json');assert len(a['results'])==36
 assert all(x['unchanged'] and x['rngBefore']==x['rngAfter'] and 'error' not in x['output'] for x in a['results'])
 for name in ('actor-moved','skill-changed','angle-changed','power-changed','wind-changed'):
  for ignore in (False,True):
   match=lambda n:next(x['output'] for x in a['results'] if x['name']==n and x['ignore']==ignore)
   assert match(name)!=match('unchanged'),(fixture,name,ignore)
 verify(a,b,fixture+' 36')
a=read('stage40-prediction-parity-baseline.json');b=read('stage40-prediction-parity-candidate.json');assert len(a['r'])==24 and a['unchanged'];verify(a,b,'24 trajectories and frame')
