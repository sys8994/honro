"""Retain verified ordinary compiled bytes; never build, publish or push."""
import binascii, collections, hashlib, json, os, re, stat, struct, subprocess, sys, zipfile, zlib
from pathlib import Path,PurePosixPath
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes()); Q=P['normal']; BASE=P['baseline']; SOURCE=P['normalSource']
TOP='sys8994/honro'; REF='refs/heads/qa/stage35-blue-forest-retention-71fb'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
MF='web/manifest.json'; NORMAL_PINS='tools/stage35-blue-forest/PINS.json'
QA_FILES={'.github/workflows/stage35-blue-forest-retention.yml','tools/stage35-blue-forest-retention/PINS.json','tools/stage35-blue-forest-retention/retain.py'}
SRC=P['sourceFiles']; MODIFIED=set(P['sourceModified'])
SOURCE_DIFF={('M' if k in MODIFIED else 'A')+'\t'+k for k in SRC}
RETAINER={'tools/release/retain-published-web.mjs':'8374336b53c74ac81e6d32f5aa43eee575e61daa',
          'shared/web-retention.mjs':'16687b0fc38e432a7d66a015ddf3ebe744163a06'}
SHELLS={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
HISTORY_FIELDS={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
def require(q,*m):
    if not q:raise AssertionError(m)
def sha(a):return hashlib.sha256(a).hexdigest()
def stamp(a):return {'bytes':len(a),'sha256':sha(a)}
def blob(a):return hashlib.sha1(f'blob {len(a)}\0'.encode()+a).hexdigest()
def j(a):return json.loads(a)
def jfile(a):return j(a.read_bytes())
def save(p,o):p.write_text(json.dumps(o,indent=2,ensure_ascii=False)+'\n')
def git(r,*s):return subprocess.check_output(['git','-C',str(r),*s])
def show(ref,p):return git(ROOT,'show',ref+':'+p)
def tree(rev):return git(ROOT,'rev-parse',rev+'^{tree}').decode().strip()
def diff(a,b):return set(git(ROOT,'diff','--no-renames','--name-status',a,b).decode().splitlines())
def pinned(h,n):return type(h) is str and bool(re.fullmatch('[a-f0-9]{'+str(n)+'}',h)) and set(h)!={'0'}
def check_scope():
    require(P['enabled'] is True and Q['job']>0 and Q['artifact']['id']>0 and 0<Q['artifact']['bytes']<=120<<20 and
      pinned(Q['head'],40) and pinned(Q['tree'],40) and all(pinned(h,64) for h in [
       Q['artifact']['sha256'],Q['candidateArchiveSHA256'],*Q['receiptSHA256'].values()]),'authority pins not enabled or incomplete')
    require(os.environ['GITHUB_REPOSITORY']==TOP and os.environ['GITHUB_REF']==REF and os.environ['GITHUB_EVENT_NAME']=='push','wrong execution scope')
    h=os.environ['GITHUB_SHA']
    for a,b in [(h,Q['head']),(Q['head'],SOURCE),(SOURCE,BASE)]:
        require(git(ROOT,'rev-list','--parents','-n1',a).decode().split()==[a,b],'wrong exact ancestry',a,b)
    require(git(ROOT,'rev-parse','--is-shallow-repository').strip()==b'false','history checkout is shallow; preservation unavailable')
    require(git(ROOT,'rev-parse','HEAD').decode().strip()==h and not git(ROOT,'status','--porcelain=v1','-z'),
      'dirty or wrong carrier head')
    require(tree(BASE)==P['baselineTree'] and tree(SOURCE)==P['normalSourceTree'] and tree(Q['head'])==Q['tree'],'wrong source tree')
    require(diff(Q['head'],h)=={'A\t'+p for p in QA_FILES} and
            len(SRC)==13 and diff(BASE,SOURCE)==SOURCE_DIFF,'unexpected carrier or product source paths')
    require(all(blob(show(SOURCE,k))==v for k,v in SRC.items()) and
       all(blob(show(BASE,k))==blob(show(SOURCE,k))==v for k,v in RETAINER.items()),'exact producer/retainer bytes drift')
    prior=show(BASE,MF)
    require(blob(prior)==P['priorPages']['manifestGitBlob'] and sha(prior)==P['priorPages']['manifestSHA256'],'wrong published manifest')
    np=show(Q['head'],NORMAL_PINS);require(blob(np)==Q['normalPinsGitBlob'],'wrong independently pinned comparison card')
    np=j(np)
    require(np['product']['candidateCommit']==SOURCE and np['product']['candidateTree']==P['normalSourceTree'] and
      np['product']['sourceFiles']==SRC,'QA card and author candidate diverged')
    return np, j(prior)
def api(path):
    return j(subprocess.check_output(['gh','api',f'repos/{TOP}/'+path]))
def safe_zip(z,cap):
    seen=set(); total=0
    for e in z.infolist():
        p=PurePosixPath(e.filename)
        require(not p.is_absolute() and p.parts and '..' not in p.parts and '\\' not in e.filename and
                p.as_posix()==e.filename.rstrip('/') and e.filename not in seen and not stat.S_ISLNK(e.external_attr>>16),
          'unsafe/duplicate archive path',e.filename)
        seen.add(e.filename);total+=e.file_size
    require(total<=cap and z.testzip() is None,'archive excess or CRC failure')
    return seen
def digest_rgba(data,w,h):
    """Independent PNG 8bit RGB/RGBA decode for the concrete Chrome receipt."""
    require(data[:8]==bytes.fromhex('89504e470d0a1a0a'),'wrong PNG header')
    off=8;comp=bytearray();header=None
    while off<len(data):
        n,t=struct.unpack_from('>I4s',data,off); off+=8
        s=data[off:off+n];c,=struct.unpack_from('>I',data,off+n);off+=n+4
        require(binascii.crc32(t+s)&0xffffffff==c,'bad PNG chunk CRC')
        if t==b'IHDR':header=struct.unpack('>IIBBBBB',s)
        elif t==b'IDAT':comp.extend(s)
        elif t==b'IEND':break
    require(off==len(data) and header in ((w,h,8,2,0,0,0),(w,h,8,6,0,0,0)),'unexpected PNG encoding/dimensions')
    cc=3 if header[3]==2 else 4;line=w*cc;tail=zlib.decompress(comp)
    require(len(tail)==h*(line+1),'wrong inflated PNG dimensions')
    prev=bytearray(line);digest=hashlib.sha256();rgba=bytearray([255])*(w*4)
    for p in range(0,len(tail),line+1):
        typ=tail[p];now=bytearray(tail[p+1:p+1+line])
        require(typ<=4,'unknown PNG filter')
        if typ==1:
            for i in range(cc,line):now[i]=(now[i]+now[i-cc])&255
        elif typ==2:now=bytearray((s+t)&255 for s,t in zip(now,prev))
        elif typ==3:
            for i in range(line):now[i]=(now[i]+((prev[i]+(now[i-cc] if i>=cc else 0))//2))&255
        elif typ==4:
            for i in range(line):
                a=now[i-cc] if i>=cc else 0;b=prev[i];c=prev[i-cc] if i>=cc else 0
                da=abs(b-c);db=abs(a-c);dc=abs(a+b-c-c)
                now[i]=(now[i]+(a if da<=db and da<=dc else b if db<=dc else c))&255
        prev=now
        if cc==3:
            for k in range(3):rgba[k::4]=now[k::3]
            digest.update(rgba)
        else:digest.update(now)
    return digest.hexdigest()
def inventory(v,count):
    rows=v['files'];out={q['path']:{k:q[k] for k in ('sha256','bytes')} for q in rows}
    require(len(out)==len(rows)==count,'wrong active manifest population',count)
    return out
def capsule(path,np,old,verify_png=True):
    pin=Q['receiptSHA256'];package='stage35-blue-forest-normal-generated-QA-only.zip'
    with zipfile.ZipFile(path) as z:
        names=safe_zip(z,175<<20) if verify_png else set(z.namelist())
        require(set(pin)|{package}<=names,'required normal proof sections missing')
        sec={}
        for n,h in pin.items():
            data=z.read(n);require(sha(data)==h,'normal proof member drift',n);sec[n]=j(data)
        src,g,app,c=[sec[n] for n in ('SOURCE.json','GRAPH.json','BROWSER.json','CANDIDATE-CHECK-ONLY.json')]
        require(src['qaHead']==Q['head'] and src['A']==BASE and src['B']==SOURCE and src['A-tree']==P['baselineTree'] and src['B-tree']==P['normalSourceTree'] and src['thirteenProductSourceBlobs']==SRC and src['activeArtAuthority']==np['product']['authority'],'wrong official source checkout')
        require(all(g[k] is True for k in ('49OtherMapsAndAssetsAndActualLeavesExact','Stage35ReverseOnlyTwoPlacementsAndFarSelectorRestoredMap','signedOwnerTable','Stage35ProviderMetadataOnly','Stage35FourSignedPaintOnlyOwnersAndPier')),'normal graph failed required scope')
        require(app['status']=='PASS_COMBINED_NORMAL_SOURCE_AND_NATIVE_CAMERAS_ART_JUDGMENT_PENDING' and 'No payload injection' in app['scope'] and 'activeProbe' not in app,'actual normal A/B not passed')
        require(set(app['frames'])==set(np['frames']) and len(app['frames'])==22,'missing registered native pose')
        for k,f in np['frames'].items():
            r=app['frames'][k];a,b=r['A'],r['B']
            require(r['physicalBodyAndCanvasAlphaExact']=='yes' and all(a[p]==b[p] for p in ('rawAlpha','domAlpha','bodyAlpha','normalizedLegacyPhysicalSHA256')),'protected canvas alpha, body silhouette or physics drift',k)
            require(a['rawRGBA']!=b['rawRGBA'] and a['domRGBA']!=b['domRGBA'] and (not (k.endswith('-ordinary') or k.endswith('-overview')) or a['bodyRGBA']!=b['bodyRGBA']),'missing intended native raster change',k)
            require(a['rawRGBA']==f.get('expectedStockRAWPixels',a['rawRGBA']) and a['domRGBA']==f.get('expectedStockDOMPixels',a['domRGBA']),'stock frame differs from prior exact evidence',k)
            for side in ('A','B'):
                row=r[side];far=np['far']['old' if side=='A' else 'new']
                require(row['normalizedLegacyPhysicalSHA256']==f['physicsSHA256'] and row['registeredVisibleFarImage']==g[side]['farFile'] and row['farKey']==far['key'] and row['natural']==far['size'] and all(v['inside']==0 for v in row['sideAlpha'].values()) and all(g[side]['stageAssets'][id]==h for id,h in row['actualAssets'].items()),'protected state/far/vector ownership changed',k,side)
                if verify_png:
                    for kind in ('raw','dom'):
                        p=f'{k}-{side}-{kind}.png';d=z.read(p)
                        require(sha(d)==row[kind+'PNG'],'actual PNG raw byte pin mismatch',p)
                        require(digest_rgba(d,*(f['pixels'] if kind=='dom' else f['backing']))==row[kind+'RGBA'],'actual PNG differs from independently verified archived RGBA',p)
        for size in ('1440x900','390x844'):
            for side in ('A','B'):
                logged=app['HTTP'][size][side]['verified']; active=g[side]['files']
                require(set(g[side]['mustObserve'])<=set(logged) and all(active[k]==v for k,v in logged.items()),'normal signed route or generated bytes changed',size,side)
        nat=z.read(package);require(sha(nat)==Q['candidateArchiveSHA256'] and c['zip']==stamp(nat) and c['sourceCommit']==SOURCE and c['stockParent']==BASE and c['browserReceipt']['sha256']==pin['BROWSER.json'] and c['graphReceipt']['sha256']==pin['GRAPH.json'],'sealed inner normal delta does not match authority')
    import io
    with zipfile.ZipFile(io.BytesIO(nat)) as z:
        names=safe_zip(z,16<<20)
        require(names==set(c['generated'])==set(g['B']['candidateArchivePaths']) and len(names)==18 and SHELLS|{MF}<=names,'inner normal generated path count/scope')
        extra=names-(SHELLS|{MF})
        files={k:z.read(k) for k in names}
        require(all(stamp(v)==c['generated'][k]==g['B']['files'][k] for k,v in files.items()),'registered B build body changed in nested ZIP')
    mf=j(files[MF]);new=inventory(mf,810);base=inventory(old,809);keep=base.keys()&new.keys()
    require({k:v for k,v in g['A']['files'].items() if k not in SHELLS|{MF}}==base,'normal stock graph differs from signed live')
    require({k:v for k,v in g['B']['files'].items() if k not in SHELLS|{MF}}==new,'normal candidate graph and generated manifest disagree')
    require(extra==new.keys()-base.keys() and all(base[k]==new[k] for k in keep),'unexpected unchanged/generated files')
    require(g['authorizedRenamedPaths']==Q['expectedRenames'],'exact attested immutable paths drift')
    delta=dict(Q['expectedRenames']); loss=base.keys()-new.keys()
    oldFar=g['A']['farFile'];far=Q['newFarPath']
    require(set(delta)==loss and set(delta.values())|{far}==extra and len(delta)==13 and far==g['B']['farFile'] and oldFar in keep,'normal graph old to new mapping ambiguous')
    require(new[far]['sha256']==np['far']['new']['sha256'] and oldFar==Q['oldFar']['path'] and base[oldFar]=={k:Q['oldFar'][k] for k in ('bytes','sha256')},'far-owner image changed from visual proof')
    camp=j(files[mf['project']]);bo=j(show(BASE,old['project']))
    require(all(len(t[q])==50 for t in (bo,camp) for q in ('stages','stageLibraries')),'not exact 50 campaign records')
    norm={**camp,'libraryOrder':[x for x in camp['libraryOrder'] if x not in np['sides']]}
    for key in ('stages','stageLibraries'):
        cur,prior=camp[key],bo[key]
        require(delta[prior[34]]==cur[34] and all(cur[i]==prior[i] and new[cur[i]]==base[prior[i]] for i in range(50) if i!=34),'other 49 packet/map paths or bytes changed',key)
        norm[key]=[*cur[:34],prior[34],*cur[35:]]
    require(bo==norm and camp['assetEncodings']['stageLibraries'][34]=='json-pool-v1','protected campaign metadata changed')
    k=camp['stageLibraries'][34]; d=j(files[k]); a=b''.join(files[t['path']] for t in d['parts'])
    require(d['$honroJsonParts']==1 and len(d['parts'])==2 and stamp(a)=={n:d[n] for n in ('bytes','sha256')} and
      all(stamp(files[t['path']])=={n:t[n] for n in ('bytes','sha256')} for t in d['parts']),'candidate split leaf closure hash')
    oldmap=j(show(BASE,bo['stages'][34]));bow=j(files[camp['stages'][34]])
    require([y['id'] for y in bow['elements'][:2]]==list(np['sides']) and bow['design']['nativeArt']['far']==np['far']['new']['key'],'map owners or far selector changed')
    bow['elements']=bow['elements'][2:];bow['design']['nativeArt']['far']=np['far']['old']['key']
    require(oldmap==bow,'protected map and gameplay changed')
    oldprovider=next(k for k in loss if 'ordered-common-12.' in k)
    cp=files[delta[oldprovider]];op=show(BASE,oldprovider)
    for k,(_,_,precursor,prev,now) in np['paintedOwners'].items():
        start=(json.dumps(k)+':{stage:35,previous:'+json.dumps(precursor)+',current:').encode()
        before=start+json.dumps(prev).encode()+b'}'
        after=start+json.dumps(now).encode()+b',previousOptimized:'+json.dumps(prev).encode()+b'}'
        require(cp.count(after)==op.count(before)==1,'exact old/new provider signature row changed',k)
        cp=cp.replace(after,before,1)
    require(cp==op,'unexpected provider or compiled code changed')
    pr=np['pierRuntime'];before,after=pr['old'].encode(),pr['new'].encode()
    oldmodule,newmodule=show(BASE,pr['stock']),files[pr['candidate']]
    require(delta[pr['stock']]==pr['candidate'] and oldmodule.count(before)==newmodule.count(after)==1 and newmodule.replace(after,before,1)==oldmodule,'procedural runtime changed outside the locked Stage35 pair')
    require(files['HONRO.html']==files['index.html'] and mf['gameEntry'].encode() in files['HONRO.html'] and mf['workshopEntry'].encode() in files['HONRO_WORKSHOP.html'],'canonical stable shell registration mismatch')
    return files, mf, sec
def authority(w):
    np,old=check_scope();ar=Q['artifact'];run=api(f"actions/runs/{Q['run']}")
    require(run['id']==Q['run'] and run['repository']['full_name']==run['head_repository']['full_name']==TOP and
      run['head_sha']==Q['head'] and run['head_branch']=='qa/stage35-blue-forest-normal-71fb' and run['path']=='.github/workflows/stage35-blue-forest.yml' and
      (run['status'],run['conclusion'],run['event'])==('completed','success','push'),'not exact completed normal carrier')
    job=api(f"actions/jobs/{Q['job']}")
    step_names={'Verify exact retained stock and produce B normal compiled output','Actual normal compiled Chrome gameplay renders, no payload substitution','Seal verified normal output as a separate check-only archive'}
    require(job['id']==Q['job'] and job['run_id']==Q['run'] and job['name']=='verify' and
       (job['status'],job['conclusion'])==('completed','success') and
       step_names<={s['name'] for s in job['steps'] if s['status']=='completed' and s['conclusion']=='success'},'build/browser/normal output seal not all completed successfully')
    m=api(f"actions/runs/{Q['run']}/artifacts")
    active=[a for a in m['artifacts'] if a['name']=='honro-stage35-blue-forest-and-play-qa-only' and not a['expired']]
    require(len(active)==1,'expected one pinned official normal output artifact')
    v=active[0]
    require(v['workflow_run']['id']==Q['run'] and v['workflow_run']['head_sha']==Q['head'] and (v['id'],v['size_in_bytes'],v['digest'])==(ar['id'],ar['bytes'],'sha256:'+ar['sha256']),'artifact identity/digest drift')
    p=w/'official.zip'
    with p.open('xb') as s:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{ar['id']}/zip"],stdout=s,check=True)
    require(stamp(p.read_bytes())=={k:ar[k] for k in ('bytes','sha256')},'downloaded outer bytes fail official authority')
    files,_,_=capsule(p,np,old)
    save(w/'verified-authority.json',{'run':Q['run'],'job':Q['job'],'head':Q['head'],'artifact':ar,'nestedNormal':Q['candidateArchiveSHA256'],
       'normalProofReceipts':Q['receiptSHA256'],'decodedApprovedPNGCount':88,'authorizedNormalGenerated':{k:stamp(v) for k,v in files.items()}})

def registry(m):
    rows=[*m.get('files',[]),*m.get('previousFiles',[])]
    for g in m.get('previousGenerations',[]):rows.extend(g)
    for g in m.get('publishedGenerations',[]):rows.extend(g['files'])
    out={}
    for f in rows:
        path=f['path'];desc={k:f[k] for k in ('bytes','sha256')}
        require(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',path) and
                pinned(desc['sha256'],64) and (path not in out or out[path]==desc),'invalid registry/conflict',path)
        out[path]=desc
    return out

def seal(w):
    require(not(os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')),'network-approved token erroneously present in assembly')
    np,old=check_scope()
    cert=jfile(w/'verified-authority.json');z=w/'official.zip'
    require(cert['decodedApprovedPNGCount']==88 and cert['artifact']==Q['artifact'] and
      stamp(z.read_bytes())=={k:Q['artifact'][k] for k in ('bytes','sha256')},'prior read-only authority missing/changed')
    files,mf,_=capsule(z,np,old,verify_png=False)
    b=w/'candidate';require(not b.exists(),'candidate output not clean')
    git(ROOT,'worktree','add','--detach',str(b),SOURCE)
    require(not git(b,'status','--porcelain=v1','-z') and git(b,'rev-parse','HEAD').decode().strip()==SOURCE,'not clean exact disposable candidate source checkout')
    for p,body in files.items():
        f=b/p;require(not f.is_symlink() and f.parent.is_dir(),'unexpected candidate output parent')
        if p not in SHELLS|{MF}:require(not f.exists(),'immutable output alias already exists',p)
        f.write_bytes(body)
    base_regs=registry(old)
    require(all(stamp((b/k).read_bytes())==v for k,v in base_regs.items()),'some history registered assets drift before retention')
    evidence=f"https://github.com/{TOP}/actions/runs/{P['priorPages']['run']}"
    done=w/'delivery'
    with (done/'retainer-output.json').open('xb') as s:
        subprocess.run(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',P['priorPages']['publishedAt'],'--evidence',evidence],cwd=b,stdout=s,check=True)
    retained=jfile(b/MF)
    require({k:v for k,v in retained.items() if k not in HISTORY_FIELDS}=={k:v for k,v in mf.items() if k not in HISTORY_FIELDS},'retainer changed normal active graph/shell roles')
    require(all((b/k).read_bytes()==v for k,v in files.items() if k!=MF),'retainer changed verified normal shell/asset bytes')
    regs=registry(retained)
    require(all(stamp((b/k).read_bytes())==v for k,v in (base_regs|regs).items()),'registered immutable bytes lost after retention')
    require(all(base_regs.get(k,v)==v for k,v in regs.items()),'published history registry mutated historic identity')
    pub=[x for x in retained['publishedGenerations'] if x['sourceSha']==BASE]
    require(len(pub)==1 and pub[0]['publishedAt']==P['priorPages']['publishedAt'] and
       pub[0]['publishedAtPrecision']=='instant' and pub[0]['evidence']==evidence and pub[0]['files']==old['files'] and
       not any(x['sourceSha']==SOURCE for x in retained['publishedGenerations']),'did not retain exact old live active generation or marked unpublished candidate live')
    # Git compares every old tracked web blob against the exact published tree; no historical physical deletion is allowed.
    track=set(git(b,'diff','--no-renames','--name-status',BASE,'--').decode().splitlines())
    require(track==SOURCE_DIFF|{'M\t'+p for p in SHELLS|{MF}},'pre-existing physical web file or other tracked path changed',sorted(track))
    expected=set(files)-(SHELLS|{MF})
    require(set(git(b,'ls-files','--others','--exclude-standard').decode().splitlines())==expected,'unexpected output filesystem path')
    paths=sorted(set(SRC)|set(files));require(len(paths)==31,'wrong exact source + retained graph cardinality')
    records={k:stamp((b/k).read_bytes()) for k in paths}
    require(all(blob((b/k).read_bytes())==v for k,v in SRC.items()),'copied producer source drift')
    delivery=done/'stage35-blue-forest-retained-source-and-generated-delta-no-deploy.zip'
    with zipfile.ZipFile(delivery,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as zp:
        for p in paths:
            info=zipfile.ZipInfo(p,(1980,1,1,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED
            zp.writestr(info,(b/p).read_bytes())
    with zipfile.ZipFile(delivery) as zp:
        require(safe_zip(zp,16<<20)==set(paths) and all(stamp(zp.read(p))==v for p,v in records.items()),'retained ZIP roundtrip scope/hash drift')
    actual=stamp(delivery.read_bytes())
    save(done/'RETAINED-DELTA-RECEIPT.json',{'published':False,'role':'read-only retained assembly, not release or deployment','base':BASE,
       'source':SOURCE,'sourceGitBlobs':SRC,'actualNormalAuthority':cert,'priorPages':P['priorPages'],'activeCount':len(inventory(retained,810)),
       'baselineRegisteredVerified':len(base_regs),'retainedRegisteredVerified':len(regs),'oldPhysicalTrackedAssetsPreserved':True,
       'retainedOldPublishedGraphSha256':pub[0]['graphSha256'],'normalManifestBeforeRetention':stamp(files[MF]),'files':records,'zip':actual})
    (done/'SHA256SUMS').write_text(actual['sha256']+'  '+delivery.name+'\n')
    (done/'verified-authority.json').write_bytes((w/'verified-authority.json').read_bytes())

if __name__=='__main__':
    {'authority':authority,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
