"""Local-only disabled assembly from one normal B. Verify first; no build/browser/Git or network writes except an explicitly enabled disposable local worktree."""
import io,json,math,os,re,subprocess,sys,zipfile
from datetime import datetime,timezone
from hashlib import sha1,sha256
from pathlib import Path
H=Path(__file__).resolve().parent
P=json.loads((H/'RELEASE-PINS.json').read_bytes()); A=json.loads((H/'PINS.json').read_bytes())
REL=P['previousPublic']['release']; BASE,TREE=REL['head'],REL['tree']
MAN='web/manifest.json';SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
HISTORY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
SRC={'shared/data/act4/world.parts/manifest.json',*(f'shared/data/act4/world.parts/part-{i:03d}.jsonpart'for i in range(7,30))}
def sha(b):return sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def gith(b):return sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def read(r,p):
 t=r/p;assert t.is_file() and t.resolve().is_relative_to(r.resolve()) and not t.is_symlink(),p
 return t.read_bytes()
def j(b):
 def obj(rows):
  d=dict(rows);assert len(d)==len(rows);return d
 return json.loads(b,object_pairs_hook=obj)
def dump(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def run(r,*a):return subprocess.check_output(a,cwd=r,timeout=180).decode().strip()
def git(r,*a):return run(r,'git',*a)
def inventory(rows):
 d={}
 for v in rows:
  k=v['path'];assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)
  x={a:v[a]for a in ('bytes','sha256')}
  assert type(x['bytes']) is int and x['bytes']>0 and re.fullmatch('[a-f0-9]{64}',x['sha256'])
  assert k not in d or d[k]==x
  d[k]=x
 return d
def registry(m):return inventory([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(p for g in m['publishedGenerations']for p in g['files'])])
def zipread(raw,expected,cap):
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  names=z.namelist();assert len(names)==len(set(names)) and set(names)==set(expected)
  assert sum(x.file_size for x in z.infolist())<cap and z.testzip() is None
  assert all(x.file_size>0 and x.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED) for x in z.infolist())
  assert all(not k.startswith('/') and '..' not in Path(k).parts for k in names)
  return {k:z.read(k)for k in names}
def prior(r):
 rows={k:read(r,k)for k in ('PAGES-AUTHORITY.json','PUBLIC-HTTP.json','PUBLIC-BROWSER.json')}
 for name,key in [('PAGES-AUTHORITY.json','authoritySHA256'),('PUBLIC-HTTP.json','httpSHA256'),('PUBLIC-BROWSER.json','browserSHA256')]:
  assert sha(rows[name])==P['previousPublic'][key]
 pages,http,br=(j(rows[k])for k in rows)
 assert pages['status']=='EXACT_STAGE17_MASTER_PAGES' and pages['release']==REL
 assert br['release']==BASE or br['release']==REL
 assert fact(rows['PAGES-AUTHORITY.json'])['sha256']==P['previousPublic']['authoritySHA256']
 return pages
def payload(outer,priorPath):
 prior(priorPath)
 raw=outer.read_bytes();assert fact(raw)==P['official']['outer']
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  names=z.namelist();assert len(names)==32 and len(set(names))==32 and all(len(Path(k).parts)==1 for k in names)
  assert z.testzip() is None
  for k,h in P['receipts'].items():assert sha(z.read(k))==h
  src,graph,br,authority,ret=(j(z.read(k+'.json'))for k in ('AUTHOR','GRAPH','BROWSER','AUTHORITY','RETENTION'))
  inner=z.read(P['inner']['name']);assert fact(inner)=={k:P['inner'][k]for k in ('bytes','sha256')}
  assert br['status']=='HOLD', 'Never represent historical strict pixel checks as passed'
  assert all(v['status']=='A_ACTUAL_CAPTURED' and not v['networkErrors'] for v in br['visits'].values()) and len(br['visits'])==8
  for kind,pin in [('raw','expectedRawOutside'),('dom','expectedDOMOutside')]:
   assert all(br['comparisons'][k+'-'+kind]['outside']==n and br['comparisons'][k+'-'+kind]['alpha']==0 for k,n in P[pin].items())
  assert authority['base']==graph['releasedBase']==BASE and authority['head']==P['official']['head'] and authority['tree']==TREE
  assert graph['mapCount50Identical'] and graph['other49PacketsGraphExact']
  assert ret['allOldURLBytesPreserved']==graph['oldBytesPreserved']==P['priorURLBytes']
  assert src==graph['sourceRecipe'] and src['asset']==A['id'] and src['new']==A['newOwner'] and src['otherBytesExact']
  assert src['sourceOffset']==16320708 and src['changedSourceWorld']=='55d22b333065275b4de00acbae7543b8ccb64adb53a248e20a400fd054b92275'
  assert {x.strip()[2:]for x in graph['sourcesChangedInDetachedB']}==SRC
  assert len([k for k in names if k.endswith('.png')])==16
  for v in br['visits'].values():
   p=v['phase']['backing-reuse']
   for k in ('raw','dom'):assert fact(z.read(p[k]['path']))==p[k]['png']
 targets=graph['emitted'];files=zipread(inner,targets,20<<20)
 assert all(fact(b)==targets[k]for k,b in files.items())
 adds=set(files)-SHELL-{MAN};assert len(adds)==6 and len(files)==10
 assert all(re.fullmatch(r'web/(data|runtime|entries)/[\w.-]+',k)for k in adds)
 assert gith(read(H,'author.mjs'))==P['exactQAAuthorGit']
 return src,graph,adds,files
def prepare(outer,previous,repo,work):
 assert P['enabled'] is True and P['scopeDecision']==P['expectedScopeReviewIfLaterAuthorized'],'disabled; requires separately attested scoped visual decision'
 assert not any(os.getenv(k) for k in ('GH_TOKEN','GITHUB_TOKEN'))
 assert not work.exists() and work.parent.resolve()==Path(os.environ.get('RUNNER_TEMP','/tmp')).resolve()/'stage34-release' and work.name=='assemble'
 assert git(repo,'rev-parse','HEAD')==BASE and git(repo,'rev-parse','HEAD^{tree}')==TREE and not git(repo,'status','--porcelain=v1')
 limit=datetime.fromisoformat(P['previousPublic']['expectedNextMetadataExpiryUTC'].replace('Z','+00:00'))
 assert datetime.now(timezone.utc)<limit,'publication clock window changed; stop'
 src,graph,adds,files=payload(outer,previous)
 work.mkdir();(work/'out').mkdir();b=work/'B';git(repo,'worktree','add','--detach',str(b),BASE)
 original=read(b,MAN);assert fact(original)=={k:REL['manifest'][k]for k in ('bytes','sha256')} and gith(original)==REL['manifest']['git']
 old,normal=j(original),j(files[MAN]);oldreg=registry(old);active=inventory(normal['files'])
 assert len(oldreg)==P['priorURLBytes'] and len(active)==810 and not adds&oldreg.keys()
 assert len(old['publishedGenerations'])==41 and BASE not in {g['sourceSha']for g in old['publishedGenerations']}
 assert set(active)-set(inventory(old['files']))==adds and all(oldreg[k]==active[k]for k in oldreg.keys()&active.keys())
 assert all(fact(read(b,k))==v for k,v in oldreg.items())
 run(b,'node',str(H/'author.mjs'),'source',str(work));assert j(read(work/'out','AUTHOR.json'))==src
 assert set(git(b,'diff','--name-only','--','shared','tools','tests').splitlines())==SRC
 for k,raw in files.items():
  path=b/k;assert not path.is_symlink() and path.parent.resolve().is_relative_to(b) and path.exists()==(k in (SHELL|{MAN}))
  path.write_bytes(raw)
 merged={**normal,**{k:old[k]for k in HISTORY}}
 previous_names={f['path']for f in old['previousFiles']}
 merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**v)for k,v in oldreg.items()if k not in active and k not in previous_names)]
 union={**oldreg,**{k:active[k]for k in adds}}
 assert registry(merged)==union and len(union)==P['nextURLBytes']
 dump(b/MAN,merged)
 run(b,'node','tools/release/retain-published-web.mjs',BASE,'--published-at',REL['publishedAt'],'--evidence',f'https://github.com/sys8994/honro/actions/runs/{REL["pagesRun"]}')
 final=j(read(b,MAN));old_groups={z['sourceSha']:z for z in old['publishedGenerations']};new_groups={z['sourceSha']:z for z in final['publishedGenerations']}
 assert set(new_groups)==set(old_groups)|{BASE} and all(new_groups[k]==v for k,v in old_groups.items())
 assert new_groups[BASE]['files']==old['files'] and new_groups[BASE]['publishedAt']==REL['publishedAt']
 assert registry(final)==union and inventory(final['files'])==active and all(fact(read(b,k))==v for k,v in union.items())
 assert final['publishedRetention']==old['publishedRetention']
 assert {k:v for k,v in final.items()if k not in HISTORY}=={k:v for k,v in normal.items()if k not in HISTORY}
 assert all(read(b,k)==v for k,v in files.items()if k!=MAN)
 mods=SRC|SHELL|{MAN}
 assert set(git(b,'diff','--name-only',BASE).splitlines())==mods
 assert set(git(b,'ls-files','--others','--exclude-standard').splitlines())==adds
 note={'status':'PREPARED_LOCAL_NO_PUBLICATION', 'notStrictPixelPass':True,'base':BASE,'source':src,
       'modify':sorted(mods),'add':sorted(adds),'previousURLBytesProtected':len(oldreg),'registry':len(union),'manifest':fact(read(b,MAN))}
 dump(work/'out'/'ASSEMBLED-DISABLED-CARRIER-RECEIPT.json',note)
 print(json.dumps(note,ensure_ascii=False))
if __name__=='__main__':
 mode=sys.argv[1];outer,previous=(Path(x).resolve()for x in sys.argv[2:4])
 if mode=='verify':
  src,g,adds,files=payload(outer,previous)
  print(json.dumps({'status':'VERIFIED_INPUTS_ONLY_DISABLED','prior':BASE,'qaStrict':'FAIL','source':src,
                   'exactModifiedScope':sorted(SRC|SHELL|{MAN}),'exactImmutableAddedScope':sorted(adds),'normalNestedFiles':len(files)},ensure_ascii=False,indent=2))
 elif mode=='prepare':prepare(outer,previous,*(Path(x).resolve()for x in sys.argv[4:6]))
 else:raise SystemExit('verify or disabled prepare')
