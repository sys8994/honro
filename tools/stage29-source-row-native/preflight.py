"""Read-only historical acb Stage29 A/B QA, never a comparison with present live master."""
import hashlib,json,os,re,shutil,subprocess,sys
from pathlib import Path
D=Path(__file__).resolve().parent
sys.path.insert(0,str(D.parent/'stage28-poster-native'))
import guard as g
BASE=g.P['base'];TREE=g.P['tree'];R1='4f649f82de09935b9b839ec2f4dd416c3678664b'
R1_TEST='8ed3d35a614006b30b8ab790d3b07bc7a69c30ee'
REF='refs/heads/qa/stage29-source-row-detached-native-acb-r2'
QA={'.github/workflows/stage29-source-row-native.yml',*(f'tools/stage29-source-row-native/{f}'for f in ('prepare.cjs','planes.json','preflight.py','capture.py','watch.js','owner.js'))}
A='shared/assets/environment/act3-handoff/stage29-west-bank.json'; O='shared/data/terrain-path-optimization.json'
PACK='web/data/chapter-29-assets.03bec5fbcabe5e35.json'; MAP='web/data/chapter-29.9c23e7ce4d1312d3.json'
CANDIDATE_PACK='web/data/chapter-29-assets.a5e8bcd76be0de97.json'
CANDIDATE_HASH={'bytes':183306,'sha256':'a5e8bcd76be0de97ea8f10c655c900f0e83f8a501ce0dafa3d5a5e6cc88c7ac0'}
OWNER='act3-handoff:29:west-bank'
ROLE={'packet':r'web/data/chapter-29-assets\.[0-9a-f]{16}\.json','campaign':r'web/data/campaign\.[0-9a-f]{16}\.json',
 'runtime-campaign':r'web/runtime/campaign\.[0-9a-f]{16}\.js','game-js':r'web/entries/game\.[0-9a-f]{16}\.js',
 'game-html':r'web/entries/game\.[0-9a-f]{16}\.html','workshop-js':r'web/entries/workshop\.[0-9a-f]{16}\.js'}
def pre(w):
 rt=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',REF)
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert g.git(rt,'rev-list','--parents','-n1','HEAD').decode().split()==[head,R1_TEST]
 assert g.git(rt,'rev-list','--parents','-n1',R1_TEST).decode().split()==[R1_TEST,R1]
 assert g.git(rt,'rev-parse',BASE+'^{tree}').decode().strip()==TREE
 assert not g.git(rt,'status','--porcelain=v1','-z')
 r2={'.github/workflows/stage29-source-row-native.yml','tools/stage29-source-row-native/preflight.py'}
 assert set(g.git(rt,'diff','--name-status','--no-renames',R1,R1_TEST).decode().splitlines())=={'A\t'+p for p in QA}
 assert set(g.git(rt,'diff','--name-status','--no-renames',R1_TEST,head).decode().splitlines())=={'M\t'+p for p in r2}
 assert all(g.git(rt,'show',R1_TEST+':'+p)==g.git(rt,'show',head+':'+p)for p in QA-r2)
 for p in QA:assert g.git(rt,'ls-tree',head,'--',p).decode().split()[:2]==['100644','blob']
 for arm in ('A','B'):
  t=w/arm;g.git(rt,'worktree','add','--detach',str(t),BASE)
  assert not g.git(t,'status','--porcelain=v1','-z')
  assert g.stamp(g.rd(t,g.MF))==g.P['manifest']
 a=w/'A';b=w/'B';p=w/'script';(p/'original').mkdir(parents=True)
 for q in ('prepare.cjs','planes.json'):shutil.copy(D/q,p/q)
 shutil.copy(a/A,p/'original/stage29-west-bank.json')
 for k,d in ((A,'1da644b12cbb7c09f9e8b7411b6e2f30793163b1'),(O,'1baa483bec04bc905d419cd36dbe803335a7e037'),('shared/act3-handoff-art.mjs','5d1963f4cc630a8343f2c72ca486565746161710'),('shared/terrain-path-optimization.mjs','784e574d21cfa668326215fd16dcc0fb6ffcc832')):
  assert g.blob(g.rd(a,k))==d
 p0=subprocess.check_output(['node',str(p/'prepare.cjs'),'apply',str(b),str(a/PACK)],timeout=120)
 (w/'out'/'SOURCE-RECEIPT.json').write_bytes(p0)
 assert set(g.git(b,'diff','--name-status','--no-renames').decode().splitlines())=={'M\t'+k for k in (A,O)}
def register(paths):
 p={}
 for f in paths:
  [k]=[k for k,q in ROLE.items()if re.fullmatch(q,f)]
  assert k not in p;p[k]=f
 return p
def verify_only_campaign_common_slot(a,b,old,new):
 assert old=='web/runtime/campaign.926544619e01a04a.js' and new!=old
 assert len(a['common'])==len(b['common'])==76 and a['common'][56]==old and a['common'].count(old)==1
 assert not new in a['common']
 strict=a['common'].copy();strict[56]=new
 assert b['common']==strict and b['gameOnly']==a['gameOnly'], 'unexpected executable alias or order outside one exact campaign binding'
def built(w):
 a,b=w/'A',w/'B';o=w/'out'
 src=json.loads(g.rd(o,'SOURCE-RECEIPT.json'))
 assert src['sourcePath']==A and src['registryPath']==O
 assert g.stamp(g.rd(b,A))==src['candidateSource'] and g.stamp(g.rd(b,O))==src['registryProof']['candidate']
 assert src['candidateSource']['git']=='eec5e4bc87474d692e1291e70c41aa67b1e3d0a6'
 sc=('shared','game/src','game/engine','workshop/src','tests','tools','package.json','package-lock.json','game/package.json','game/package-lock.json')
 for root,ds in ((a,set()),(b,{' M '+A,' M '+O})):
  assert g.git(root,'rev-parse','HEAD^{tree}').decode().strip()==TREE
  assert set(g.git(root,'status','--porcelain=v1','--untracked-files=no','--',*sc).decode().splitlines())==ds
 ax,bx=[json.loads(g.rd(x,g.MF))for x in (a,b)]
 ai,bi=map(g.inv,(ax,bx))
 for r,inv in ((a,ai),(b,bi)):
  for p,f in inv.items():assert g.facts(g.rd(r,p))==f
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 ar,br=register(ai.keys()-bi.keys()),register(bi.keys()-ai.keys())
 assert ar.keys()==br.keys()==ROLE.keys() and ar['packet']==PACK and br['packet']==CANDIDATE_PACK and bi[CANDIDATE_PACK]==CANDIDATE_HASH
 pairs=[(ar[k],br[k])for k in ROLE]
 for arm in (a,b):assert g.facts(g.rd(arm,MAP))==ai[MAP]
 g.save(o/'GRAPH-OBSERVED.json',{'status':'post inventory/pre strict normalization only','aliases':pairs,'commonA':ax['common'],'commonB':bx['common'],
  'gameOnlyA':ax['gameOnly'],'gameOnlyB':bx['gameOnly'],'oldHistoricalRun':44937500491,'oldHistoricalJob':136947240127,'oldHistoricalHOLD':True})
 verify_only_campaign_common_slot(ax,bx,ar['runtime-campaign'],br['runtime-campaign'])
 for k in ('runtime-campaign','game-js','game-html','workshop-js'):assert g.rd(a,ar[k])==g.normalize(g.rd(b,br[k]),pairs)
 for p in g.SHELL:assert g.rd(a,p)==g.normalize(g.rd(b,p),pairs)
 for k in ('project','playtest','gameEntry','workshopEntry','common','gameOnly','optionalModules','styles'):
  assert ax[k]==json.loads(g.normalize(json.dumps(bx[k],sort_keys=True).encode(),pairs))
 ac,bc=[json.loads(g.rd(r,role['campaign']))for r,role in ((a,ar),(b,br))]
 assert len(ac['stages'])==len(ac['stageLibraries'])==50 and ac['stages']==bc['stages']
 assert ac['stageLibraries'][28]==PACK and bc['stageLibraries'][28]==CANDIDATE_PACK
 bc['stageLibraries'][28]=PACK; assert ac==bc
 # Strict original source optimizer receipt, current untouched compiled peers and exact packet hash above.
 ap,bp=[json.loads(g.rd(r,role['packet']))for r,role in ((a,ar),(b,br))]
 [i]=[i for i,x in enumerate(ap)if x['id']==OWNER]
 aF,bF=ap[i],bp[i]
 assert ap[:i]+ap[i+1:]==bp[:i]+bp[i+1:] and aF['id']==bF['id']
 assert aF['collision']==bF['collision']==[] and aF['params']['contactMapping']==bF['params']['contactMapping'][1:]
 assert aF['vector']['root']['children'][0]['children'][0]['children']==bF['vector']['root']['children'][0]['children'][0]['children'][:-1]
 inflate=lambda r,v:{**v,**{k:g.facts(g.rd(r,k))for k in g.SHELL|{g.MF}}}
 g.save(o/'GRAPH.json',{'base':BASE,'tree':TREE,'activeA':inflate(a,ai),'activeB':inflate(b,bi),'aliases':pairs,'verifiedMap':MAP,'mapScopes':50,
  'assetPacketsUnaffected':49,'sourceChangesOnly':[A,O],'historicalAcbComparatorOnly':True,'liveMasterNotAsserted':True,'noRelease':True})
if __name__=='__main__':{'pre':pre,'built':built}[sys.argv[1]](Path(sys.argv[2]).resolve())
