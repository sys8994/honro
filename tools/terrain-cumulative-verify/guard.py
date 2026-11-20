import json,subprocess,sys
from pathlib import Path
q=Path(__file__).resolve().parent
j=json.loads((q/'lineage.json').read_text())
base='1e043b09d4ce107e1d2dcf70fe2274dff7098476'
target='52119985ad21a7d3de04245ee146293045edbeba'
def git(*a):return subprocess.check_output(['git',*a],text=True).strip()
assert (j['base'],j['latest'])==(base,target)
assert git('rev-parse',base+'^{tree}')=='749dc3403620e8291acf582302761bf6a0e4e89a'
assert git('rev-parse',target+'^{tree}')=='746fafe4563775327f4ce87e65c87ae1d9a0b159'
assert git('merge-base',base,target)==base
assert git('rev-list','--left-right','--count',base+'...'+target)=='0\t12'
assert git('rev-list','--reverse',base+'..'+target).splitlines()==[i['sha'] for i in j['commits']]
for row in j['commits']:
 assert git('rev-parse',row['sha']+'^{tree}')==row['tree']
 assert git('rev-parse',row['sha']+'^')==row['parent'][0]
want={'added':'A','modified':'M'}
actual={line.split('\t')[1]:line.split('\t')[0] for line in git('diff','--name-status',base,target).splitlines()}
assert len(j['files'])==19 and actual=={i['path']:want[i['status']] for i in j['files']}
for i in j['files']:assert git('rev-parse',target+':'+i['path'])==i['blob'],i
files={'capture.py','guard.py','verify.py','views.json','lineage.json','smoke-init.py'}
expected={f'tools/terrain-cumulative-verify/{n}' for n in files}|{'.github/workflows/terrain-cumulative-verify.yml'}
oldqa='840fc1db0ae9d92f141ec1f88753c5bf7ed4a5a8'
retry='0afacc948aa25ac83f68155e348e54fd630e3dee'
init='081dd4a5cad7cc7d5b28fb83199736e80deb9e10'
canary='7c38e48c16d05f43be2e50d717669dc98c0e202f'
assert git('rev-parse','HEAD^')==canary and git('rev-parse',canary+'^')==init and git('rev-parse',init+'^')==retry and git('rev-parse',retry+'^')==oldqa and git('rev-parse',oldqa+'^')==target
assert set(git('diff','--name-status',canary,'HEAD').splitlines())=={
 'M\t.github/workflows/terrain-cumulative-verify.yml','M\ttools/terrain-cumulative-verify/guard.py','M\ttools/terrain-cumulative-verify/capture.py'}
assert set(git('diff','--name-only',target,'HEAD').splitlines())==expected
assert all(x.startswith('A\t') for x in git('diff','--name-status',target,'HEAD').splitlines())
print('Exact base and 12 source commits, latest 19 approved tracked blobs, and seven QA-only descendant files confirmed')
