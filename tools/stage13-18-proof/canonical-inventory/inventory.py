#!/usr/bin/env python3
"""Read-only outer harness. Input map bytes and complete messages stay in process."""
import argparse, collections, hashlib, json, re, subprocess, sys
from pathlib import Path
sys.dont_write_bytecode=True
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'ci'))
from splice import plan,git_blob,sha256

BASE='787206f6dce947868ad9199da45fbe393d3f3c53'
RAW=Path('shared/data/campaign.json')
RAW_BLOB='edaf31a5fda2b7db0202bc0efb52dd83e54f6b9e'
CANDIDATE_BLOB='93cde49bc09b85a1e93d555e7d55cab7bf4fb28d'
PREFIX=b'QA_CANONICAL_INVENTORY_PRIVATE:'

CATEGORIES=[
 ('encounter-member-reference',r': missing member '),
 ('environment-scale-eligibility',r': scale outside .+ range$|: invalid physical scale range$|: missing/invalid background scale range$'),
 ('asset-reference',r'missing (asset|scenery asset)|invalid reference height|vector extends outside reference|missing asset'),
 ('identity-duplicates',r'duplicate|must be unique'),
 ('scene-reference-or-layer',r'(scene|scenery|scenic|depth layer|draw layer|battlefield element|terrain ?face|face burial|face underpaint)'),
 ('terrain-geometry-reference',r'polygon|one-way|support|terrain|bounds|surface|ceiling'),
 ('actor-definition',r'unknown unit|unknown team|player start|stageId'),
 ('event-goal-and-marker',r'objective|event|goal|marker'),
 ('environment-schema',r'environment schema|environment preset|environment zone'),
 ('uncategorized-pinned-schema-error',r'.*'),
]
COMPILED=[(k,re.compile(expr,re.I)) for k,expr in CATEGORIES]

def digest(value):
 return hashlib.sha256(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def group(s):
 return next(k for k,p in COMPILED if p.search(s))

def safe_summary(s):
 # Refuse to expose bulk payloads, controls, literal external paths/URLs, and
 # structurally ambiguous unexpected lines. Hash still counts each item.
 if len(s)>240 or re.search(r'[\x00-\x1f\x7f{}\[\]]|(?:https?://)|(?:/home/|/workspace/|/tmp/)',s):
  return '[withheld unbounded/structured diagnostic; SHA256 '+sha256(s.encode())+']'
 return s

def report_messages(messages):
 if messages is None:return None
 cats={}
 for index,s in enumerate(messages):
  k=group(s)
  cat=cats.setdefault(k,{'count':0,'first20':[]})
  cat['count']+=1
  if len(cat['first20'])<20:cat['first20'].append({'ordinal':index+1,'diagnostic':safe_summary(s)})
 return {'total':len(messages),'uniqueDiagnosticLines':len(set(messages)),'orderedLinesSHA256':digest(messages),'categories':cats}

def expected_stage18_fixed(before):
 st=before['stages'][17]
 assert st['metadata']['stageId']==18
 present={u['id'] for u in st['units']}
 lines=[f"{r['id']}: missing member {u}" for r in st['encounters'] for u in r['unitIds'] if u not in present]
 assert len(lines)==len(set(lines))==45
 return collections.Counter(lines)

def compare(before,after,expected):
 if before is None or after is None:
  return {'status':'cannot compare complete finalized schema errors'}
 a,b=map(collections.Counter,(before,after))
 removed=a-b;added=b-a
 expand=lambda c: list(c.elements())
 return {'removed':report_messages(expand(removed)),'added':report_messages(expand(added)),
         'knownStage18ExpectedCount':sum(expected.values()),
         'knownStage18ResolvedCount':sum((removed&expected).values()),
         'onlyExpectedStage18Removed':removed==expected and not added,
         'unexpectedRemoved':report_messages(expand(removed-expected))}

def git(root,*args):
 return subprocess.check_output(['git','--no-optional-locks','-C',str(root),*args],text=True).strip()

def observe(repo,data):
 p=subprocess.run(['node',str(HERE/'observe.mjs'),str(repo)], cwd=repo,
   input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False,timeout=180)
 # Neither recorded stdout nor unprocessed stderr is copied to output or logs.
 if p.returncode:
  raise RuntimeError('Node observer did not yield a result; exit='+str(p.returncode)+' stderrSHA256='+sha256(p.stderr))
 rows=[x[len(PREFIX):] for x in p.stdout.splitlines() if x.startswith(PREFIX)]
 assert len(rows)==1,'One private observer receipt expected'
 ret=json.loads(rows[0])
 assert ret['rawSHA256']==sha256(data) and ret['rawSizeBytes']==len(data)
 return ret

def run(repo,out):
 repo=repo.resolve()
 out=out.resolve()
 assert out!=repo and not out.is_relative_to(repo),'QA receipts must be outside repository'
 assert git(repo,'rev-parse','HEAD')==BASE
 base_status=git(repo,'status','--porcelain=v1','--untracked-files=no')
 assert base_status=='','Canonical checkout must be clean and exactly pinned'
 assert git(repo,'rev-parse','HEAD:'+str(RAW))==RAW_BLOB
 raw=(repo/RAW).read_bytes()
 assert len(raw)==9318671 and git_blob(raw)==RAW_BLOB
 changed,typed=plan(raw,'raw-campaign')
 assert typed['oldGitBlob']==RAW_BLOB and typed['newGitBlob']==CANDIDATE_BLOB
 # Same detached snapshot and unchanged official code for both. Only the
 # in-memory argument changes; no compact/author writes or override switches.
 orig=observe(repo,raw); after=observe(repo,changed)
 assert git(repo,'rev-parse','HEAD')==BASE
 assert git(repo,'status','--porcelain=v1','--untracked-files=no')==base_status
 assert (repo/RAW).read_bytes()==raw
 expected=expected_stage18_fixed(json.loads(raw))
 op,ap=orig.pop('errors'),after.pop('errors')
 inventory={'pinned':BASE,'scope':'Exact canonical scratch checkout; unchanged official Stage22 author through original schema/finalize boundary. Not whole regeneration/art equality, build or play.',
   'trackedCheckoutUnchanged':True,'authoredImmutableInputBlob':RAW_BLOB,
   'postKnownStage18InMemoryInputBlob':CANDIDATE_BLOB,
   'structuredErrorCountsOnlyWhenOriginalFinalizeObserved':True,
   'baseline':{**orig,'schema':report_messages(op)},
   'knownStage18Only':{**after,'schema':report_messages(ap)},
   'difference':compare(op,ap,expected)}
 out.write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
 # Inventory creation is not a release test. Distinct nonzero statuses for
 # expected strict rejections and attribution/data failures, never hides either.
 if op is None or ap is None or not inventory['difference'].get('onlyExpectedStage18Removed'):
  return 2
 return 1 if op or ap else 0

if __name__=='__main__':
 arg=argparse.ArgumentParser()
 arg.add_argument('checkout',type=Path)
 arg.add_argument('external_report',type=Path)
 cfg=arg.parse_args()
 sys.exit(run(cfg.checkout,cfg.external_report))
