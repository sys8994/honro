"""Exact normal source-build scope and candidate-only output; no release/write authority."""
import copy, hashlib, json, os, re, subprocess, sys, zipfile
from pathlib import Path
import exact as x

P=json.loads((Path(__file__).resolve().parent/'PINS.json').read_bytes())
PRODUCT=P['product']
BASE=x.BASE
REF='refs/heads/qa/stage35-combined-normal-71fb'
DIR='tools/stage35-combined-build'
FILES={'.github/workflows/stage35-combined-build.yml',*(DIR+'/'+f for f in ('PINS.json','entry.json','guard.py','views.py','exact.py'))}
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
    require(diff(r,BASE,CANDIDATE)=={('M' if p in PRODUCT['modified'] else 'A')+'\t'+p for p in SOURCE},'unexpected product author diff')
    require(git(r,'rev-parse',BASE+':shared/build.mjs').decode().strip()=='dfd27d06ac0751043da85595e3a8897f728cd43f','unexpected build predecessor')
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
def package(r,p,pins,count):
    d=json.loads(read(r,p,pins));require(d.get('$honroJsonParts')==1 and len(d['parts'])==2,'expected normal two-part source transport')
    observed=[]
    for i,e in enumerate(d['parts']):
        k=e['path']
        require(bool(re.fullmatch(f'web/data/chapter-35-assets-part-{i:03d}\\.[0-9a-f]{{16}}\\.bin',k)) and pins[k]=={z:e[z] for z in ('bytes','sha256')},'unregistered Chapter35 split leaf')
        observed.append(read(r,k,pins))
    b=b''.join(observed);require(facts(b)=={z:d[z] for z in ('bytes','sha256')},'split assembled SHA/size drift')
    return d,x.decode_pool(b,count)
def classes(paths):
    matched={}
    rx=[
     ('part000',r'web/data/chapter-35-assets-part-000\.[\da-f]{16}\.bin'),('part001',r'web/data/chapter-35-assets-part-001\.[\da-f]{16}\.bin'),
     ('map',r'web/data/chapter-35\.[\da-f]{16}\.json'),
     ('far-data',r'web/data/HONRO_AUTHORED_FAR\.[\da-f]{16}\.json'),
     ('far-module',r'web/runtime/HONRO_AUTHORED_FAR\.[\da-f]{16}\.js'),
     ('descriptor',r'web/data/chapter-35-assets-parts\.[\da-f]{16}\.json'),('campaign',r'web/data/campaign\.[\da-f]{16}\.json'),
     ('campaign-module',r'web/runtime/campaign\.[\da-f]{16}\.js'),('provider-module',r'web/runtime/ordered-common-12\.[\da-f]{16}\.js'),
     ('game-js',r'web/entries/game\.[\da-f]{16}\.js'),('game-html',r'web/entries/game\.[\da-f]{16}\.html'),
     ('workshop-js',r'web/entries/workshop\.[\da-f]{16}\.js')]
    for p in paths:
        c=[k for k,rule in rx if re.fullmatch(rule,p)]
        require(len(c)==1 and c[0] not in matched,'unexpected generated path '+p)
        matched[c[0]]=p
    require(set(matched)=={k for k,_ in rx},('expected exact twelve renamed reviewed output classes',sorted(matched)))
    return matched
def entry_normalize(b,delta):
    for old,new in sorted(delta,key=lambda z:len(z[1]),reverse=True):
        for a,c in ((old,new),(Path(old).name,Path(new).name)):
            b=b.replace(c.encode(),a.encode())
    return b

def named(g,token,ext):
    found=[k for k in g if k.startswith(token+'.') and k.endswith('.'+ext)]
    require(len(found)==1,'one immutable role required: '+token)
    return found[0]
def built(w):
    a,b=w/'A',w/'B'
    arm(a,BASE,True);arm(b,CANDIDATE,True)
    live=json.loads(git(a,'show',BASE+':'+x.MANIFEST))
    A,B=(json.loads(read(r,x.MANIFEST)) for r in (a,b))
    aa,bb=inventory(A),inventory(B);require(aa==inventory(live) and (len(aa),len(bb))==(809,810),'fresh stock graph or expected B+1 changed')
    for r,active in ((a,aa),(b,bb)):
        for p in active:read(r,p,active)
    require(all(read(a,k)==git(a,'show',BASE+':'+k) for k in SHELLS),'fresh stock stable shell drift')
    require(all(aa[p]==bb[p] for p in aa.keys()&bb.keys()),'same-name active bytes drift')
    farold=P['far']['old']['name']
    farnew=named(bb,'web/graphics/honro_authored_far-images-'+P['far']['new']['key'],'webp')
    require(farold in aa and aa[farold]==bb[farold] and bb[farnew]=={k:P['far']['new'][k] for k in ('bytes','sha256')},'original/unique new far image bytes differ')
    gone=classes(aa.keys()-bb.keys());new=classes((bb.keys()-aa.keys())-{farnew}); delta=[(gone[k],new[k]) for k in sorted(gone)]
    c,d=(json.loads(read(r,m['project'],v)) for r,m,v in ((a,A,aa),(b,B,bb)))
    require(all(len(c[z])==len(d[z])==50 for z in ('stages','stageLibraries')),'not full normal published campaign')
    require([c['stages'][34],d['stages'][34]]==[gone['map'],new['map']] and [c['stageLibraries'][34],d['stageLibraries'][34]]==[gone['descriptor'],new['descriptor']],'wrong normal Stage35 indices')
    require(gone['map']==x.MAP and aa[x.MAP]==x.PINS[x.MAP],'Stage35 exact current base map differs')
    for z in ('stages','stageLibraries'):
        require(c[z][:34]+c[z][35:]==d[z][:34]+d[z][35:],'one or more non-Stage35 path changed '+z)
        for i,p in enumerate(c[z]):
            if i==34:continue
            require(aa[p]==bb[p],('49 non-target active chapter bytes not preserved',p))
            if '-parts.' in p:
                q=json.loads(read(a,p,aa));require(q.get('$honroJsonParts')==1 and all({k:v[k] for k in ('bytes','sha256')}==bb[v['path']] for v in q['parts']),'non-target split leaf changed')
    dc=copy.deepcopy(d);dc['stages'][34]=c['stages'][34];dc['stageLibraries'][34]=c['stageLibraries'][34]
    dc['libraryOrder']=[k for k in dc['libraryOrder'] if k not in P['sides']]
    require(dc==c and c['assetEncodings']['stageLibraries'][34]=='json-pool-v1','global campaign/source dependencies changed')
    ma,mb=(json.loads(read(r,z['map'],v)) for r,z,v in ((a,gone,aa),(b,new,bb)))
    oldNative=ma['design']['nativeArt'];newNative=mb['design']['nativeArt']
    require([oldNative['far'],newNative['far']]==[P['far']['old']['key'],P['far']['new']['key']],'Stage35 authored raster dispatch mismatch')
    ids=list(P['sides'])
    require([l['id'] for l in mb['elements'][:3]]==ids+['approved35-forest-foundation'],'side strands not ordered before signed masking rock')
    for v,k,xv,yv in zip(mb['elements'][:2],ids,(-4208,4862),(-24,192)):
        require(v=={'id':k,'assetId':k,'x':xv,'y':yv,'scale':1,'rotation':0,'opacity':1,'snap':False,'depthLayer':'L1','layer':'structural-back','nativeArtLayer':'structure'},'compiled exact W/E placement drift')
    norm=copy.deepcopy(mb);norm['design']['nativeArt']['far']=oldNative['far'];norm['elements']=norm['elements'][2:]
    require(norm==ma,'Stage35 map differs outside exact two visual placements and far selector')
    for q in ('terrains','units','events','objectives','markers','initialState','encounters','playBounds','terrainBounds'):
        require(mb[q]==ma[q],('Stage35 physical/game state changed',q))
    ad,ax=package(a,gone['descriptor'],aa,7);bd,bx=package(b,new['descriptor'],bb,9)
    require(ad=={'$honroJsonParts':1,**x.AGG,'parts':x.PARTS},'fresh stock normal split drift')
    require(list(ax)==[k for k in bx if k not in P['sides']] and {k for k in ax if ax[k]!=bx[k]}=={TARGET},'normal packet change exceeds seam and two added owners')
    require({k:sha(dump(v)) for k,v in ax.items()}==P['stockStageAssetSHA256'],'signed unchanged Stage35 source art owner drift')
    require({k:sha(dump(bx[k])) for k in ids}==P['sides'],'normal compiler side bamboo owner hash drift')
    new_asset=bx[TARGET]
    require(sha(dump(new_asset))==P['assetCandidateSHA256'],'normal compiler did not emit exact approved seam owner')
    patch=P['patch'];reverted=copy.deepcopy(new_asset)
    require(reverted['vector']['clips'].pop(patch['clipId'])==patch['clip'] and reverted['vector']['root']['children'].pop()==patch['group'] and reverted==ax[TARGET],'changing unexpected tree or plane')
    oldmod,newmod=(read(r,z['provider-module'],v) for r,z,v in ((a,gone,aa),(b,new,bb)))
    require(oldmod.count(PROVIDERS[0])==newmod.count(PROVIDERS[1])==1 and newmod.replace(PROVIDERS[1],PROVIDERS[0],1)==oldmod,'non-Stage35 compatibility logic/metadata changed')
    fm0,fm1=(json.loads(read(r,z['far-data'],v)) for r,z,v in ((a,gone,aa),(b,new,bb)))
    require(fm1['images'].pop(P['far']['new']['key'])=={'$honroAsset':farnew} and fm0==fm1,'global authored far changed outside one additional Stage35-only image key')
    for z in ('campaign-module','game-js','game-html','workshop-js'):
        require(entry_normalize(read(b,new[z],bb),delta)==read(a,gone[z],aa),('non-link generated shell or code differences',z))
    # Authored FAR module's immutable data path and path-array contain the explicitly added image key only.
    farpath=b',["images","act4FarBambooGrove35"]'
    fa0=read(a,gone['far-module'],aa);fa1=entry_normalize(read(b,new['far-module'],bb),delta)
    require(fa1.count(farpath)==1 and fa1.replace(farpath,b'',1)==fa0,'authored FAR runtime module changed beyond additive decode path/new data address')
    for s in SHELLS:
        require(entry_normalize(read(b,s),delta)==read(a,s),('non-link stable shell difference',s))
    for name in ('project','gameEntry','workshopEntry','playtest','common','gameOnly','styles','optionalModules','workshopStyle'):
        require(entry_normalize(dump(B[name]),delta)==dump(A[name]),('active app linkage changed',name))
    graph={}
    for arm0,r,m,active,z,pk in [('A',a,A,aa,gone,ax),('B',b,B,bb,new,bx)]:
        dp=json.loads(read(r,z['descriptor'],active))
        allFiles={**active,**{s:facts(read(r,s)) for s in SHELLS},x.MANIFEST:facts(read(r,x.MANIFEST))}
        f=farnew if arm0=='B' else farold
        seen=[m['gameEntry'],m['project'],z['map'],z['descriptor'],z['campaign-module'],z['provider-module'],z['far-data'],z['far-module'],f,
         *[p['path'] for p in dp['parts']],*P['graphExpected'][1:3],P['graphExpected'][-2]]
        graph[arm0]={'files':allFiles,'mustObserve':list(dict.fromkeys(['HONRO.html',*seen])),
           'farFile':f,'stageAssets':{k:sha(dump(v)) for k,v in pk.items()},
           'candidateArchivePaths':sorted([*z.values(),farnew,*SHELLS,x.MANIFEST]) if arm0=='B' else []}
    write(w/'out'/'GRAPH.json',{'scope':'normal compiled assets for visual QA only; no retention/deploy','A':graph['A'],'B':graph['B'],
      '49OtherMapsAndAssetsAndActualLeavesExact':True,'Stage35ReverseOnlyTwoPlacementsAndFarSelectorRestoredMap':True,
      'signedOwnerTable':True,'Stage35ProviderMetadataOnly':True,'authorizedRenamedPaths':delta})

def archive(w):
    o=w/'out';g=json.loads((o/'GRAPH.json').read_bytes());f=json.loads((o/'BROWSER.json').read_bytes())
    require(f.get('status')=='PASS_COMBINED_NORMAL_SOURCE_AND_NATIVE_CAMERAS_ART_JUDGMENT_PENDING' and len(f['frames'])==len(P['frames']),'not eligible for separate QA only output')
    paths=g['B']['candidateArchivePaths'];require(len(paths)==17,'unexpected candidate graph size')
    records={}
    candidate=o/'stage35-combined-normal-generated-QA-only.zip'
    with zipfile.ZipFile(candidate,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in paths:
            q=read(w/'B',p,g['B']['files']);records[p]=facts(q)
            zi=zipfile.ZipInfo(p,date_time=(1980,1,1,0,0,0));zi.compress_type=zipfile.ZIP_DEFLATED;zi.external_attr=0o100644<<16
            z.writestr(zi,q)
    write(o/'CANDIDATE-CHECK-ONLY.json',{'role':'not retained, not approved for deploy, aesthetic review still required',
      'sourceCommit':CANDIDATE,'stockParent':BASE,'generated':records,'zip':facts(candidate.read_bytes()),
      'browserReceipt':facts((o/'BROWSER.json').read_bytes()),'graphReceipt':facts((o/'GRAPH.json').read_bytes())})
if __name__=='__main__':
    {'pre':pre,'built':built,'archive':archive}[sys.argv[1]](Path(sys.argv[2]))
