"""Acquire exact approved official QA evidence via standard read-only Actions API."""
from pathlib import Path
import json,os,subprocess,sys
from guard import BASE,TREE
from run import fact,verify_archive
H=Path(__file__).resolve().parent
P=json.loads((H/'AUTHORITY.qa-only.json').read_bytes())
Q=P['official']
REF='refs/heads/qa/stage29-west-hi-readback-31537b'
REPO='sys8994/honro'
W='.github/workflows/stage29-west-hi-readback.yml'
def main(file):
 assert P['enabled'] is True and P['visualApproved'] is True
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(REPO,'push',REF)
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA']
 def git(*a):return subprocess.check_output(['git','-C',str(root),*a],timeout=30).decode().strip()
 assert git('rev-list','--parents','-1','HEAD').split()==[head,BASE] and git('rev-parse',BASE+'^{tree}')==TREE
 want={W,*(str(H.relative_to(root)/n)for n in ('AUTHORITY.qa-only.json','POSES.json','acquire.py','capture.py','guard.py','park.js','run.py'))}
 assert set(git('diff','--name-status','--no-renames',BASE,head).splitlines())=={'A\t'+n for n in want}
 assert all(git('ls-tree',head,'--',n).startswith('100644 blob ')for n in want) and not git('status','--porcelain=v1')
 def api(r):return subprocess.check_output(['gh','api',f'repos/{REPO}/{r}'],timeout=100)
 def obj(r):return json.loads(api(r))
 run=obj(f"actions/runs/{Q['run']}")
 job=obj(f"actions/jobs/{Q['job']}")
 c=obj(f"git/commits/{Q['head']}")
 x=obj(f"actions/artifacts/{Q['artifact']}")
 assert (run['head_sha'],run['head_branch'],run['status'],run['conclusion'])==(Q['head'],Q['branch'],'completed','success')
 assert (job['run_id'],job['head_sha'],job['name'],job['status'],job['conclusion'])==(Q['run'],Q['head'],'compare','completed','success')
 assert c['tree']['sha']==Q['tree'] and [p['sha']for p in c['parents']]==[BASE]
 assert (x['workflow_run']['id'],x['workflow_run']['head_sha'],x['name'],x['expired'],x['digest'],x['size_in_bytes'])==(Q['run'],Q['head'],Q['name'],False,'sha256:'+Q['artifactOuter']['sha256'],Q['artifactOuter']['bytes'])
 body=api(f"actions/artifacts/{Q['artifact']}/zip")
 assert fact(body)==Q['artifactOuter'];verify_archive(P,body)
 file=Path(file).resolve()
 assert file.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 with file.open('xb')as f:f.write(body)
if __name__=='__main__':main(sys.argv[1])
