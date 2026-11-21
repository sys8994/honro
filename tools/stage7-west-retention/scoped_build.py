"""Retained candidate manufacturing. QA-only branch, never writer or deploy."""
import json,os,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
TOOLS=HERE.parent
sys.path.insert(0,str(TOOLS/'stage7-west-closure'))
import guard as native
import retention_template as retained
ROOT=native.ROOT
REF='refs/heads/qa/stage7-west-retention-cd8f69d'
NATIVEFILES={'.github/workflows/stage7-west-retention.yml',*(f'tools/stage7-west-retention/{x}' for x in (
 'scoped_build.py','retention_template.py','verify-native-authority.py','NATIVE-PROOF-PINS.json'))}
RETAINER={'tools/release/retain-published-web.mjs':'8374336b53c74ac81e6d32f5aa43eee575e61daa',
          'shared/web-retention.mjs':'16687b0fc38e432a7d66a015ddf3ebe744163a06'}
def scoped(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(native.REPO,REF,'push')
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 h=os.environ['GITHUB_SHA']
 git=native.git
 assert git(ROOT,'rev-parse','HEAD').decode().strip()==h and not git(ROOT,'status','--porcelain=v1','-z')
 assert git(ROOT,'rev-parse','--is-shallow-repository')==b'false\n'
 pins=retained.authority(w);p=pins['nativeHead']
 assert git(ROOT,'rev-list','--parents','-n1',h).decode().split()==[h,p]
 assert git(ROOT,'rev-list','--parents','-n1',p).decode().split()==[p,native.BASE]
 assert git(ROOT,'rev-parse',p+'^{tree}').decode().strip()==pins['nativeTree'] and git(ROOT,'rev-parse',native.BASE+'^{tree}').decode().strip()==native.TREE
 assert set(git(ROOT,'diff','--no-renames','--name-status',native.BASE,p).decode().splitlines())=={'A\t'+x for x in native.QA}
 assert set(git(ROOT,'diff','--no-renames','--name-status',p,h).decode().splitlines())=={'A\t'+x for x in NATIVEFILES}
 assert all(git(ROOT,'ls-tree',h,'--',f).decode().split()[:2]==['100644','blob'] for f in native.QA|NATIVEFILES)
 assert all(git(ROOT,'rev-parse',native.BASE+':'+name).decode().strip()==id for name,id in RETAINER.items())
 return h
native.exact=scoped
def prep(w):
 old=retained.exact(w)
 native.pre(w)
 for tag in ('A','B'):
  d=w/tag
  assert all(retained.facts(retained.rd(d,k))==v for k,v in retained.registry(old).items())
if __name__=='__main__':
 {'pre':prep,'seal':retained.seal}[sys.argv[1]](Path(sys.argv[2]).resolve())
