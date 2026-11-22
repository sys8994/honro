"""Freeze the exact normal B files after browser QA. Not a build, retention job or release."""
import hashlib,json,re,stat,sys,zipfile
from pathlib import Path
import guard as n
def sha(data):return hashlib.sha256(data).hexdigest()
def J(path):
 def obj(pairs):
  m=dict(pairs);assert len(m)==len(pairs),'duplicate JSON key';return m
 return json.loads(path.read_bytes(),object_pairs_hook=obj)
def canon(m):return sha(json.dumps(m,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode())
def read(root,path):
 assert '..'not in Path(path).parts and not Path(path).is_absolute()
 t=root/path;assert t.parent.resolve().is_relative_to(root) and t.is_file()and not t.is_symlink()
 assert stat.S_ISREG(t.stat(follow_symlinks=False).st_mode) and not t.stat().st_mode & 0o111
 return t.read_bytes()
def registry(man):
 rows=[*man['files'],*man['previousFiles']]
 for gen in man['previousGenerations']:rows.extend(gen)
 for gen in man['publishedGenerations']:rows.extend(gen['files'])
 x={}
 for a in rows:
  path=a['path'];fact={k:a[k]for k in ('bytes','sha256')}
  assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',path)
  assert path not in x or x[path]==fact
  x[path]=fact
 return x
def seal(w):
 h=n.auth(w);a,b,out=w/'A',w/'B',w/'out'
 graph=J(out/'GRAPH.json');normal=(out/'GRAPH.json').read_bytes();auth=J(out/'AUTHORITY.json');src=J(out/'SOURCE.json')
 # Fully repeat readback of post-browser graph, not builder/normal tests.
 assert n.compiled(w,write=False)==graph and (out/'GRAPH.json').read_bytes()==normal
 assert graph['basis']==src['base']==auth['base']==n.B and h==src['head']==auth['head']
 assert src['B']['git']==n.NEW and src['A']['git']==n.OLD
 proof=J(out/'FOOTPRINT-CONFIRM.json');ref=J(n.H/'SCOPE.json')
 assert proof['status']=='PASS_CURRENT_STAGE17_NARROW_NORMAL_QA_NO_RELEASE'
 assert proof['R2']=='FAILED_OFFICIAL_EXPLORATORY_GUARD_UNCHANGED'
 assert proof['chrome']=='151.0.7922.34' and not proof['errors']
 assert proof['originalLedgerSHA256']==ref['ledgerSHA256']
 assert set(proof['visits'])=={'A1','B'} and set(proof['scopeComparison'])==set(ref['views'])
 for label,x in proof['visits'].items():
  assert set(x)==set(ref['views'])
  for k,r in x.items():
   assert r['verifiedServedClosure'] is True and r['photoExactR2']==ref['views'][k]['screens'][label]
 for k,t in proof['scopeComparison'].items():
  assert t['unchangedRegisteredRawAndDom'] is True and t['scannedExactReallyChangedFootprints']==len(ref['views'][k]['exceptions'])
 assert sum(t['scannedExactReallyChangedFootprints']for t in proof['scopeComparison'].values())==198
 aliases=graph['aliases'];adds=set(aliases.values())
 old=J(a/n.MF);bm=J(b/n.MF);historic=registry(old)
 assert len(historic)==n.PINS['expectedPriorImmutableCount'] and len(aliases)==len(adds)==7
 assert set(aliases)<=historic.keys() and all(graph['activeA'][p]==historic[p]for p in aliases)
 assert not(historic.keys()&adds)
 assert set(n.PINS['verifiedStage17CandidateCompactChunks'])<=adds
 roles={bm[k].split('?')[0]:k for k in ('gameEntry','workshopEntry','playtest')}
 assert len(roles)==3 and adds==set(roles)|set(n.PINS['verifiedStage17CandidateCompactChunks'])
 modifications={n.SRC:'stage17-author-source',n.MF:'normal-manifest-original',**{k:'root-document'for k in n.SHELL}}
 assert len(modifications)==5 and not set(modifications)&adds
 payload={};rows={}
 for k in sorted(set(modifications)|adds):
  v=payload[k]=read(b,k);role=modifications.get(k,roles.get(k,'exact-stage17-compact-route'))
  expected=src['B']if k==n.SRC else graph['activeB'][k]
  assert n.fact(v)=={j:expected[j]for j in ('bytes','sha256')},k
  rows[k]={**n.fact(v),'git':n.blob(v),'mode':'100644','kind':'A'if k in adds else 'M','role':role}
 assert len(payload)==12 and sum(map(len,payload.values()))<24<<20
 d=out/'review-only';d.mkdir()
 z=d/'STAGE17-NORMAL-12-FILES-REVIEW-ONLY.zip'
 with zipfile.ZipFile(z,'x',zipfile.ZIP_DEFLATED,compresslevel=8)as f:
  for k,v in payload.items():
   i=zipfile.ZipInfo(k,(1980,1,1,0,0,0));i.external_attr=0o100644<<16;i.compress_type=zipfile.ZIP_DEFLATED;f.writestr(i,v)
 with zipfile.ZipFile(z)as f:
  assert f.testzip()is None and f.namelist()==list(payload)
  assert all(i.external_attr>>16==0o100644 and f.read(i.filename)==payload[i.filename] for i in f.infolist())
 sha_input={k:sha((out/k).read_bytes())for k in ('SOURCE.json','GRAPH.json','AUTHORITY.json','FOOTPRINT-CONFIRM.json','release-guard.log','build.log','production-contract.log')}
 n.save(d/'NORMAL-PAYLOAD-RECEIPT.json',{
  'status':'SEALED_12_NORMAL_STAGE17_BYTES_FOR_REVIEW_ONLY','published':False,'basis':auth,'jobName':n.os.environ.get('GITHUB_JOB'),
  'prototypeOldOfficialOutcomes':['R2_FAILURE','TARGETED_FAILURE'],'normalGraphCanonicalSHA256':canon(graph),'rawAuthorityFileSHA256':sha_input,
  'approvedSupportReviewSHA256':n.PINS['independentFootprintDOMReceiptSHA256'],'sourceBefore':src['A'],'sourceAfter':src['B'],
  'normalManifestNonHistorySHA256':canon({k:v for k,v in bm.items()if k not in {'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}}),
  'oldReachableImmutableKnown':len(historic),'orderedActiveCurrentCount':810,'retained':False,'files':rows,'aliases':aliases,
  'zip':{'file':z.name,**n.fact(z.read_bytes())},'graphAndNormalBytesReverifiedAfterBrowser':True})
if __name__=='__main__':seal(Path(sys.argv[1]).resolve())
