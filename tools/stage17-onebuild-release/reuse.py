"""Consume only Stage 17's already browser-tested normal build; never build or deploy."""
from hashlib import sha1,sha256
from io import BytesIO
from pathlib import Path
import json,os,re,subprocess as sp,sys,zipfile

REPO='sys8994/honro'
BASE='4fdb1b182b308f4b0ed4a5dbad0591e28aac207d'
TREE='7a358923f82235759229bc2622783755c1d483f6'
MAN='web/manifest.json'
SRC='shared/data/act2/stage17-compact-package.json'
SHELL={'index.html','HONRO.html','HONRO_WORKSHOP.html'}
HISTORY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
TIME='2026-11-22T00:37:35Z'
EVIDENCE=f'https://github.com/{REPO}/actions/runs/44967387048'
MAN_SHA='f3d8ec0e05b0d49303ddc4d505908e81db27ce60d03eebed8bfec0aa25eb8d7c'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
QA='qa/stage17-rebind-stage33'
KIND='honro-stage17-rebind-normal-review-only-payload'
FIXED='refs/heads/qa/stage17-onebuild-writer-r3'

def j(b):
 def pairs(a):
  d=dict(a);assert len(d)==len(a);return d
 return json.loads(b,object_pairs_hook=pairs)
def hexsha(b):return sha256(b).hexdigest()
def stamp(b):return {'bytes':len(b),'sha256':hexsha(b)}
def blob(b):return sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def canon(x):return hexsha(json.dumps(x,ensure_ascii=True,sort_keys=True,separators=(',',':')).encode())
def cmd(a,cwd=ROOT):return sp.check_output(a,cwd=cwd,timeout=180)
def git(*a,cwd=ROOT):return cmd(['git',*a],cwd)
def api(path):return cmd(['gh','api',f'repos/{REPO}/'+path])
def read(dir,k):
 t=dir/k; assert t.parent.resolve().is_relative_to(dir) and not t.is_symlink() and t.is_file(),k
 return t.read_bytes()
def pins():
 p=j(Path(__file__).with_name('PINS.json').read_bytes())
 assert p['enabled'] is True and p['humanReview']=='PASS_EXACT_CURRENT_PC_MOBILE_ART_AND_SCOPE', 'writer remains disabled'
 assert p['qaHead']=='dab296a1b5339edd66573e1fc759d16a4f3b668f' and p['qaRun']==44971467491 and p['qaJob']==137051975341
 assert type(p['artifact']['id']) is int and 0<p['artifact']['bytes']<24<<20
 for h in (p['artifact']['sha256'],p['receiptSHA256']):assert re.fullmatch('[a-f0-9]{64}',h)
 assert (os.environ.get('GITHUB_REPOSITORY'),os.environ.get('GITHUB_REF'),os.environ.get('GITHUB_EVENT_NAME'))==(REPO,FIXED,'push')
 head=os.environ['GITHUB_SHA'];assert re.fullmatch('[a-f0-9]{40}',head)
 assert git('rev-parse','HEAD').decode().strip()==head and git('show','-s','--format=%P',head).decode().strip()==BASE
 assert git('rev-parse',BASE+'^{tree}').decode().strip()==TREE
 actual=git('diff','--no-renames','--name-status',BASE,head).decode().splitlines()
 files={'.github/workflows/stage17-onebuild-release.yml',*(f'tools/stage17-onebuild-release/{n}' for n in ('reuse.py','safe-push.sh','PINS.json'))}
 assert set(actual)=={'A\t'+k for k in files}
 return p
def zipmembers(raw,expected,outer=False):
 with zipfile.ZipFile(BytesIO(raw)) as z:
  infos=z.infolist(); assert len(infos)==len(expected) and set(z.namelist())==set(expected)
  assert sum(q.file_size for q in infos)<32<<20
  assert all(q.file_size>0 and q.compress_type in (zipfile.ZIP_DEFLATED,zipfile.ZIP_STORED) for q in infos)
  if not outer:assert all(q.external_attr>>16==0o100644 for q in infos)
  return {k:z.read(k) for k in expected}  # also checks CRC
def download(d):
 p=pins(); q=j(api(f"actions/runs/{p['qaRun']}"))
 assert (q['head_sha'],q['head_branch'],q['status'],q['conclusion'],q['event'])==(p['qaHead'],QA,'completed','success','push')
 r=j(api(f"actions/jobs/{p['qaJob']}"))
 assert (r['id'],r['run_id'],r['head_sha'],r['conclusion'])==(p['qaJob'],p['qaRun'],p['qaHead'],'success')
 assert all(any(n in s['name'] and s['conclusion']=='success' for s in r['steps']) for n in ('Exact stock A','Three registered seam poses','Seal exact post-browser normal'))
 a=p['artifact']; ar=j(api(f"actions/artifacts/{a['id']}"))
 assert (ar['name'],ar['size_in_bytes'],ar['digest'],ar['expired'])==(KIND,a['bytes'],'sha256:'+a['sha256'],False)
 assert (ar['workflow_run']['id'],ar['workflow_run']['head_sha'])==(p['qaRun'],p['qaHead'])
 z=api(f"actions/artifacts/{a['id']}/zip"); assert stamp(z)=={k:a[k] for k in ('bytes','sha256')}
 zipname='STAGE17-NORMAL-12-FILES-REVIEW-ONLY.zip';rn='NORMAL-PAYLOAD-RECEIPT.json'
 members=zipmembers(z,{rn,zipname},outer=True); assert hexsha(members[rn])==p['receiptSHA256']
 for k,b in members.items():(d/k).write_bytes(b)

def records(rows):
 m={}
 for a in rows:
  k=a['path']; assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)
  x={v:a[v] for v in ('bytes','sha256')}
  assert type(x['bytes']) is int and x['bytes']>0 and re.fullmatch('[a-f0-9]{64}',x['sha256'])
  assert k not in m or m[k]==x
  m[k]=x
 return m
def registry(m):
 return records([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for g in m['publishedGenerations'] for x in g['files'])])
def payload(d,p):
 raw=read(d,'NORMAL-PAYLOAD-RECEIPT.json'); assert hexsha(raw)==p['receiptSHA256']; r=j(raw)
 assert r['status']=='SEALED_12_NORMAL_STAGE17_BYTES_FOR_REVIEW_ONLY' and r['published'] is False and r['retained'] is False
 assert r['basis']['head']==p['qaHead'] and r['basis']['base']==BASE and r['basis']['baseTree']==TREE
 assert r['oldReachableImmutableKnown']==1336 and r['orderedActiveCurrentCount']==810 and r['graphAndNormalBytesReverifiedAfterBrowser'] is True
 rows=r['files']; mods={SRC,MAN,*SHELL}; adds=set(r['aliases'].values())
 assert len(adds)==len(r['aliases'])==7 and not adds&mods and set(rows)==mods|adds
 for k in adds:assert re.fullmatch(r'web/(data|runtime|entries)/[\w.-]+',k)
 assert all(f['kind']==('A' if k in adds else 'M') and f['mode']=='100644' for k,f in rows.items())
 z=read(d,r['zip']['file']);assert stamp(z)=={k:r['zip'][k] for k in ('bytes','sha256')}
 fs=zipmembers(z,rows)
 for k, b in fs.items():
  row=rows[k];assert {**stamp(b),'git':blob(b)}=={n:row[n]for n in ('bytes','sha256','git')},k
 assert blob(fs[SRC])==r['sourceAfter']['git']
 assert canon({k:v for k,v in j(fs[MAN]).items() if k not in HISTORY})==r['normalManifestNonHistorySHA256']
 return mods,adds,fs,r

def prepare(d):
 p=pins();mods,adds,fs,r=payload(d,p)
 assert not os.environ.get('GH_TOKEN') and not os.environ.get('GITHUB_TOKEN')
 root=d/'product';git('worktree','add','--detach',str(root),BASE)
 assert not git('status','--porcelain=v1',cwd=root)
 oldraw=read(root,MAN);assert hexsha(oldraw)==MAN_SHA
 old=j(oldraw);normal=j(fs[MAN]);oldreg=registry(old);active=records(normal['files'])
 assert len(oldreg)==1336 and len(active)==810 and not adds&oldreg.keys()
 assert len(old['publishedGenerations'])==41 and BASE not in {g['sourceSha'] for g in old['publishedGenerations']}
 assert blob(read(root,SRC))==r['sourceBefore']['git']
 assert set(r['aliases'])==set(records(old['files']))-set(active) and adds==set(active)-set(records(old['files']))
 union={**oldreg,**{k:active[k]for k in adds}}
 for k,b in fs.items():
  t=root/k;assert t.parent.resolve().is_relative_to(root) and not t.is_symlink() and t.exists()==(k in mods)
  if k!=SRC and k!=MAN and k not in SHELL:assert stamp(b)==active[k]
  t.write_bytes(b)
 bridge={**normal,**{k:old[k]for k in HISTORY}};had={x['path']for x in old['previousFiles']}
 bridge['previousFiles']=[*old['previousFiles'],*(dict(path=k,**x)for k,x in oldreg.items()if k not in active and k not in had)]
 assert registry(bridge)==union
 (root/MAN).write_text(json.dumps(bridge,ensure_ascii=False,indent=2)+'\n')
 cmd(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',TIME,'--evidence',EVIDENCE],root)
 final=j(read(root,MAN));before={g['sourceSha']:g for g in old['publishedGenerations']};now={g['sourceSha']:g for g in final['publishedGenerations']}
 assert len(union)==1343 and registry(final)==union and records(final['files'])==active
 # Exact 7-day expiry crossed for one attested graph after the preceding release.
 # Keep *all* of its physical URLs and hashes via the already established union.
 expired='2fdf345e9618a9575177ffefdca0969ee513486f'
 from datetime import datetime,timezone
 limit=datetime(2026,11,22,1,23,51,tzinfo=timezone.utc)
 assert datetime.now(timezone.utc)>=limit and (before[expired]['publishedAt'],before[expired]['publishedAtPrecision'])==('2026-11-15T01:23:51Z','instant')
 assert final['publishedRetention']==old['publishedRetention']=={'version':2,'windowDays':7,'minGraphs':2}
 assert len(now)==41 and set(now)==(set(before)-{expired})|{BASE}
 assert all(now[k]==before[k] for k in set(before)-{expired})
 assert all(p in union and union[p]==v for p,v in records(before[expired]['files']).items())
 saved=now[BASE];assert (saved['publishedAt'],saved['publishedAtPrecision'],saved['evidence'],saved['files'])==(TIME,'instant',EVIDENCE,old['files'])
 assert canon({k:v for k,v in final.items()if k not in HISTORY})==r['normalManifestNonHistorySHA256']
 assert all(stamp(read(root,k))==x for k,x in union.items())
 assert all(read(root,k)==b for k,b in fs.items()if k!=MAN)
 git('add','--',*sorted(fs),cwd=root)
 expect={'M\t'+k for k in mods}|{'A\t'+k for k in adds}
 assert set(git('diff','--cached','--name-status','--no-renames',BASE,cwd=root).decode().splitlines())==expect
 assert not git('diff','--name-only',cwd=root) and not git('ls-files','--others','--exclude-standard',cwd=root)
 env=os.environ|{'GIT_AUTHOR_NAME':'honro automation','GIT_AUTHOR_EMAIL':'github-actions[bot]@users.noreply.github.com','GIT_COMMITTER_NAME':'honro automation','GIT_COMMITTER_EMAIL':'github-actions[bot]@users.noreply.github.com'}
 tree=git('write-tree',cwd=root).decode().strip()
 oid=sp.check_output(['git','commit-tree',tree,'-p',BASE,'-m','Smooth the west terrain shadow in Act 2 Stage 7'],cwd=root,env=env,timeout=60).decode().strip()
 (d/'candidate.sha').write_text(oid+'\n')
 print(json.dumps({'candidate':oid,'tree':tree,'manifest':stamp(read(root,MAN)),'oldUrls':1336,'activeUrls':810,'retainedUrls':1343,'expiredMetadataOnly':expired,'expectedChanges':sorted(expect),'publish':False}))
if __name__=='__main__':
 cmdname=sys.argv[1]; d=Path(sys.argv[2]).resolve()
 if cmdname=='pins':pins()
 elif cmdname=='download':download(d)
 elif cmdname=='prepare':prepare(d)
 else:raise SystemExit('invalid operation')
