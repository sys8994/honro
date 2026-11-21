"""Exact normal source-build scope and candidate-only output; no release/write authority."""
import copy, hashlib, json, os, re, subprocess, sys, zipfile
from pathlib import Path
import exact as x

P=json.loads((Path(__file__).resolve().parent/'PINS.json').read_bytes())
PRODUCT=P['product']
BASE=x.BASE
REF='refs/heads/qa/stage35-opaque-union-normal-71fb'
DIR='tools/stage35-product-build'
FILES={'.github/workflows/stage35-product-build.yml',*(DIR+'/'+f for f in ('PINS.json','entry.json','guard.py','views.py','exact.py'))}
CANDIDATE=PRODUCT['candidateCommit']; TREE=PRODUCT['candidateTree']
SOURCE=PRODUCT['sourceFiles']
TARGET=P['patch']['asset']; ID=P['patch']['owner']
PROVIDERS=(b'"approved35:near-geology":{stage:35,previous:"359227:635a5188",current:"295465:df15d6ec"}',
           b'"approved35:near-geology":{stage:35,previous:"359227:635a5188",current:"298307:55096145",previousOptimized:"295465:df15d6ec"}')
SHELLS=['HONRO.html','HONRO_WORKSHOP.html','index.html']
def require(ok,reason):
    if not ok:raise AssertionError(reason)
def git(r,*s):return subprocess.check_output(['git','-C',str(r),*s])
def dump(s):return json.dumps(s,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def write(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def diff(r,a,b):return set(git(r,'diff','--name-status','--no-renames',a,b).decode().splitlines())

def ancestry(r):
    require(PRODUCT['candidateReady'] is True and all(re.fullmatch('[0-9a-f]{40}',i) and i!='0'*40 for i in (CANDIDATE,TREE)),
            'candidate source commit and tree disabled until coordinator bind')
    require(os.environ['GITHUB_REPOSITORY']=='sys8994/honro' and os.environ['GITHUB_EVENT_NAME']=='push' and os.environ['GITHUB_REF']==REF,'wrong carrier scope')
    h=os.environ['GITHUB_SHA']
    require(git(r,'rev-list','--parents','-n1','HEAD').decode().split()==[h,CANDIDATE],'wrong carrier sole parent')
    require(git(r,'rev-list','--parents','-n1',CANDIDATE).decode().split()==[CANDIDATE,BASE],'wrong candidate sole parent')
    require(git(r,'rev-parse',BASE+'^{tree}').decode().strip()==x.TREE and git(r,'rev-parse',CANDIDATE+'^{tree}').decode().strip()==TREE,'wrong pinned source trees')
    require(git(r,'status','--porcelain=v1','-z')==b'' and diff(r,CANDIDATE,h)=={'A\t'+p for p in FILES},'carrier not exact clean add-only')
    require(diff(r,BASE,CANDIDATE)=={('M' if p=='shared/build.mjs' else 'A')+'\t'+p for p in SOURCE},'unexpected product author diff')
    require(git(r,'rev-parse',BASE+':shared/build.mjs').decode().strip()==PRODUCT['previousBuildBlob'],'unexpected build predecessor')
    require(all(git(r,'rev-parse',CANDIDATE+':'+p).decode().strip()==v for p,v in SOURCE.items()),'product source blob drift')
    return h
def arm(r,rev,post=False):
    require(git(r,'rev-parse','HEAD').decode().strip()==rev and not git(r,'branch','--show-current').strip(),'not exact detached arm')
    require(not git(r,'status','--porcelain=v1','-z','--untracked-files=all','--','shared','game/engine','game/src','tests','workshop/build.mjs','tools','package.json','package-lock.json','game/package.json','game/package-lock.json'),'build mutated tracked source')
    if not post:require(git(r,'status','--porcelain=v1','-z','--untracked-files=all')==b'','dirty stock or test checkout')
def pre(w):
    r=Path(os.environ['GITHUB_WORKSPACE']); h=ancestry(r)
    base=git(r,'show',BASE+':'+x.MANIFEST);require(facts(base)==x.PINS[x.MANIFEST],'retained baseline authority drift')
    require(facts(git(r,'show',BASE+':HONRO.html'))==P['stockHtml'],'stock HTML drift')
    for a,v in (('A',BASE),('B',CANDIDATE)):
        git(r,'worktree','add','--detach',str(w/a),v);arm(w/a,v)
    write(w/'out'/'SOURCE.json',{'qaHead':h,'A':BASE,'A-tree':x.TREE,'B':CANDIDATE,'B-tree':TREE,'threeProductSourceBlobs':SOURCE,'activeArtAuthority':PRODUCT['authority']})
def read(r,p,pins=None):
    require(not p.startswith('/') and '..' not in Path(p).parts and '?' not in p and '#' not in p,'invalid generated immutable path: '+p)
    raw=(r/p).read_bytes()
    if pins is not None:require(facts(raw)==pins[p],'compiled generated body hash mismatch '+p)
    return raw
def inventory(m):
    v={f['path']:{k:f[k] for k in ('bytes','sha256')} for f in m['files']}
    require(len(v)==len(m['files']),'duplicate active path')
    return v
def package(r,p,pins):
    d=json.loads(read(r,p,pins));require(d.get('$honroJsonParts')==1 and len(d['parts'])==2,'expected normal two-part source transport')
    observed=[]
    for i,e in enumerate(d['parts']):
        k=e['path']
        require(bool(re.fullmatch(f'web/data/chapter-35-assets-part-{i:03d}\\.[0-9a-f]{{16}}\\.bin',k)) and pins[k]=={z:e[z] for z in ('bytes','sha256')},'unregistered Chapter35 split leaf')
        observed.append(read(r,k,pins))
    b=b''.join(observed);require(facts(b)=={z:d[z] for z in ('bytes','sha256')},'split assembled SHA/size drift')
    return d,x.decode_pool(b)
def classes(paths):
    matched={}
    rx=[
     ('part000',r'web/data/chapter-35-assets-part-000\.[\da-f]{16}\.bin'),('part001',r'web/data/chapter-35-assets-part-001\.[\da-f]{16}\.bin'),
     ('descriptor',r'web/data/chapter-35-assets-parts\.[\da-f]{16}\.json'),('campaign',r'web/data/campaign\.[\da-f]{16}\.json'),
     ('campaign-module',r'web/runtime/campaign\.[\da-f]{16}\.js'),('provider-module',r'web/runtime/ordered-common-12\.[\da-f]{16}\.js'),
     ('game-js',r'web/entries/game\.[\da-f]{16}\.js'),('game-html',r'web/entries/game\.[\da-f]{16}\.html'),
     ('workshop-js',r'web/entries/workshop\.[\da-f]{16}\.js')]
    for p in paths:
        c=[k for k,rule in rx if re.fullmatch(rule,p)]
        require(len(c)==1 and c[0] not in matched,'unexpected generated path '+p)
        matched[c[0]]=p
    require(set(matched)=={k for k,_ in rx},('expected exact nine renamed reviewed output classes',sorted(matched)))
    return matched
def entry_normalize(b,delta):
    for old,new in sorted(delta,key=lambda z:len(z[1]),reverse=True):
        for a,c in ((old,new),(Path(old).name,Path(new).name)):
            b=b.replace(c.encode(),a.encode())
    return b

def built(w):
    a,b=w/'A',w/'B'
    arm(a,BASE,True);arm(b,CANDIDATE,True)
    live=json.loads(git(a,'show',BASE+':'+x.MANIFEST))
    A,B=(json.loads(read(r,x.MANIFEST)) for r in (a,b))
    aa,bb=inventory(A),inventory(B);require(aa==inventory(live) and len(aa)==len(bb)==809,'fresh stock active graph differs from published authority')
    for r,active in ((a,aa),(b,bb)):
        for p in active:read(r,p,active)
    require(all(facts(read(a,k))==facts(git(a,'show',BASE+':'+k)) for k in SHELLS),'fresh stock shell drift')
    require(all(aa[p]==bb[p] for p in aa.keys()&bb.keys()),'same-name active bytes drift')
    gone=classes(aa.keys()-bb.keys());new=classes(bb.keys()-aa.keys()); delta=[(gone[k],new[k]) for k in sorted(gone)]
    c,d=(json.loads(read(r,m['project'],v)) for r,m,v in ((a,A,aa),(b,B,bb)))
    require(len(c['stages'])==len(d['stages'])==50 and c['stages']==d['stages'],'chapter map path drift')
    require(c['stages'][34]==x.MAP and aa[x.MAP]==x.PINS[x.MAP],'Stage35 map differs')
    require(c['stageLibraries'][34]==gone['descriptor'] and d['stageLibraries'][34]==new['descriptor'] and len(c['stageLibraries'])==len(d['stageLibraries'])==50,'bad normal Stage35 asset registration')
    require(c['stageLibraries'][:34]+c['stageLibraries'][35:]==d['stageLibraries'][:34]+d['stageLibraries'][35:],'a non-Stage35 chapter asset packet changed')
    dc=copy.deepcopy(d);dc['stageLibraries'][34]=c['stageLibraries'][34]
    require(dc==c and c['assetEncodings']['stageLibraries'][34]=='json-pool-v1','non-target Stage35 data graph changed')
    for p in [*c['stages'],*(k for i,k in enumerate(c['stageLibraries']) if i!=34)]:
        require(p in aa and p in bb and aa[p]==bb[p],('protected chapter registered body changed',p))
        # Split descriptors identify every actual leaf, not just the top-level filenames.
        if '-parts.' in p:
            f=json.loads(read(a,p,aa));require(f.get('$honroJsonParts')==1 and all(z['path'] in bb and {k:z[k] for k in ('bytes','sha256')}==bb[z['path']] for z in f['parts']),'non-target normal split leaf drift')
    ad,ax=package(a,gone['descriptor'],aa);bd,bx=package(b,new['descriptor'],bb)
    require(ad=={'$honroJsonParts':1,**x.AGG,'parts':x.PARTS},'fresh stock normal split differs from signed source')
    require(list(ax)==list(bx) and {k for k in ax if ax[k]!=bx[k]}=={TARGET},'one-owner normal pool difference not proven')
    old,new_asset=ax[TARGET],bx[TARGET]
    require(sha(dump(old))==P['assetOriginalSHA256'][ID] and sha(dump(new_asset))==P['assetCandidateSHA256'],'normal compiler did not emit exact approved owner')
    patch=P['patch'];reverted=copy.deepcopy(new_asset)
    require(reverted['vector']['clips'].pop(patch['clipId'])==patch['clip'] and reverted['vector']['root']['children'].pop()==patch['group'] and reverted==old,'normal compiled candidate changed more than exact authored clip/group')
    oldmod,newmod=(read(r,z['provider-module'],v) for r,z,v in ((a,gone,aa),(b,new,bb)))
    require(oldmod.count(PROVIDERS[0])==newmod.count(PROVIDERS[1])==1 and newmod.replace(PROVIDERS[1],PROVIDERS[0],1)==oldmod,'compatibility code chunk outside exact provider row changed')
    for z in ('campaign-module','game-js','game-html','workshop-js'):
        oldp,newp=gone[z],new[z]
        require(entry_normalize(read(b,newp,bb),delta)==read(a,oldp,aa),('non-link generated shell/code differences',z))
    for s in SHELLS:
        require(entry_normalize(read(b,s),delta)==read(a,s),('non-link stable shell difference',s))
    for name in ('project','gameEntry','workshopEntry','playtest','common','gameOnly','styles','optionalModules','workshopStyle'):
        require(entry_normalize(dump(B[name]),delta)==dump(A[name]),('active structure changed',name))
    graph={}
    for arm0,r,m,active,z in [('A',a,A,aa,gone),('B',b,B,bb,new)]:
        dp=json.loads(read(r,z['descriptor'],active))
        files={**active,**{s:facts(read(r,s)) for s in SHELLS},x.MANIFEST:facts(read(r,x.MANIFEST))}
        observed=[m['gameEntry'],m['project'],x.MAP,z['descriptor'],z['campaign-module'],z['provider-module'],
         *[p['path'] for p in dp['parts']],*P['graphExpected'][1:3],*P['graphExpected'][-2:]]
        graph[arm0]={'files':files,'mustObserve':list(dict.fromkeys(['HONRO.html',*observed])),
           'candidateArchivePaths':sorted([*z.values(),*SHELLS,x.MANIFEST]) if arm0=='B' else [],
           'activeManifest':facts(read(r,x.MANIFEST)),'candidateOwnerSHA256':P['assetCandidateSHA256'] if arm0=='B' else P['assetOriginalSHA256'][ID]}
    write(w/'out'/'GRAPH.json',{'scope':'exact normal compiled assets; candidate-only, no retention/deploy','A':graph['A'],'B':graph['B'],
      'stockMatchesPublishedActive809':True,'50MapPathsAndBytesExact':True,'49NonStage35AssetPacketsAndLeavesExact':True,
      'onlyTargetCanonicalOwnerExact':True,'ownerOrdinal':list(ax).index(TARGET),'providerMetadataOnly':True,'authorizedRenamedPaths':delta})

def archive(w):
    out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes());f=json.loads((out/'BROWSER.json').read_bytes())
    require(f.get('status')=='PASS_NORMAL_BUILD_BROWSER_RAW_DOM_MATERIAL_EXACT' and len(f['frames'])==7,'not eligible for assembling a candidate check archive')
    paths=g['B']['candidateArchivePaths'];require(len(paths)==13,'unexpected candidate graph size')
    records={}
    outzip=out/'stage35-normal-generated-candidate-check-only.zip'
    with zipfile.ZipFile(outzip,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in paths:
            b=read(w/'B',p,g['B']['files']);records[p]=facts(b)
            zi=zipfile.ZipInfo(p,date_time=(1980,1,1,0,0,0));zi.compress_type=zipfile.ZIP_DEFLATED;zi.external_attr=0o100644<<16
            z.writestr(zi,b)
    write(out/'CANDIDATE-CHECK-ONLY.json',{'role':'not retained, not deployable, for exact candidate build verification only',
      'sourceCommit':CANDIDATE,'parent':BASE,'generated':records,'zip':facts(outzip.read_bytes()),
      'browserReceipt':facts((out/'BROWSER.json').read_bytes()),'graphReceipt':facts((out/'GRAPH.json').read_bytes())})
if __name__=='__main__':
    {'pre':pre,'built':built,'archive':archive}[sys.argv[1]](Path(sys.argv[2]))
