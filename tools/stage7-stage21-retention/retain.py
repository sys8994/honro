"""Retain verified ordinary compiled bytes; never build, publish or push."""
import binascii, collections, hashlib, json, os, re, stat, struct, subprocess, sys, zipfile, zlib
from pathlib import Path,PurePosixPath
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes()); Q=P['normal']; BASE=P['baseline']; SOURCE=P['normalSource']
TOP='sys8994/honro'; REF='refs/heads/qa/stage7-root-line-retention-42879'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
MF='web/manifest.json'; NORMAL_DIR='tools/stage7-stage21-transplant/'
QA_FILES={'.github/workflows/stage7-stage21-retention.yml','tools/stage7-stage21-retention/PINS.json','tools/stage7-stage21-retention/retain.py'}
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
            len(SRC)==2 and diff(BASE,SOURCE)==SOURCE_DIFF,'unexpected carrier or product source paths')
    require(all(blob(show(SOURCE,k))==v for k,v in SRC.items()) and
       all(blob(show(BASE,k))==blob(show(SOURCE,k))==v for k,v in RETAINER.items()),'exact producer/retainer bytes drift')
    prior=show(BASE,MF)
    require(blob(prior)==P['priorPages']['manifestGitBlob'] and sha(prior)==P['priorPages']['manifestSHA256'],'wrong published manifest')
    configs={
      'next':NORMAL_DIR+'NEXT.json','r2':NORMAL_DIR+'PINS.json','approved21':NORMAL_DIR+'STAGE21-OFFICIAL.json',
    }
    np={}
    for name,path in configs.items():
        raw=show(Q['head'],path)
        require(blob(raw)==P['qaFiles'][name],'independent prior approval file changed',name)
        np[name]=j(raw)
    n=np['next'];r=np['r2']
    require(n['source']==SOURCE and n['sourceTree']==P['normalSourceTree'] and n['base']==BASE and n['baseTree']==P['baselineTree'] and r['productGit']==SRC,
      'QA card and source lineage differ')
    require(all(blob(show(BASE,path))==blob(show(SOURCE,path))==n['stage21'][key] for path,key in (
      ('shared/runtime/act3-handoff-art.js','source'),('tests/stage21-west-bedrock-source.mjs','test'))),'prior Stage21 source changed')
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
def digest_rgba(data,w,h,pixels=False):
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
    rows=bytearray() if pixels else None;prev=bytearray(line);digest=hashlib.sha256();rgba=bytearray([255])*(w*4)
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
            if pixels:rows.extend(rgba)
        else:
            digest.update(now)
            if pixels:rows.extend(now)
    return bytes(rows) if pixels else digest.hexdigest()
def inventory(v,count):
    rows=v['files'];out={q['path']:{k:q[k] for k in ('sha256','bytes')} for q in rows}
    require(len(out)==len(rows)==count,'wrong active manifest population',count)
    return out
def ordered(raw):
    h,tail=raw.split(b';',1); parts=tail.split(b'await yieldIfNeeded();')
    require(len(parts)>1 and not parts.pop().strip(),'incomplete immutable runtime wrapper')
    return h,[p.strip() for p in parts]
def normalize(raw,aliases):
    for old,new in aliases.items():
        raw=raw.replace(new.encode(),old.encode()).replace(Path(new).name.encode(),Path(old).name.encode())
    return raw
def actual_size(data):
    require(data[:8]==bytes.fromhex('89504e470d0a1a0a') and data[12:16]==b'IHDR','wrong PNG header')
    return struct.unpack_from('>II',data,16)
def independent_bbox(p0,p1):
    w,h=actual_size(p0)
    require(actual_size(p1)==(w,h),'actual A/B shape mismatch')
    a,b=(digest_rgba(p,w,h,pixels=True) for p in (p0,p1))
    require(a[3::4]==b[3::4],'actual A/B alpha drift')
    if a==b:return None
    xx=[w,h,0,0]
    for n,(l,r) in enumerate(zip(a,b)):
        if l==r:continue
        y,x=divmod(n//4,w)
        xx=[min(xx[0],x),min(xx[1],y),max(xx[2],x+1),max(xx[3],y+1)]
    return xx
def capsule(archive,np,old,verify_png=True):
    pin=Q['receiptSHA256'];package='B-EXACT-NORMAL-GENERATED-DELTA-NOT-DEPLOYED.zip'
    with zipfile.ZipFile(archive) as z:
        names=safe_zip(z,200<<20) if verify_png else set(z.namelist())
        require(set(pin)|{package}<=names,'qualified receipts missing')
        sec={}
        for n,h in pin.items():
            raw=z.read(n);require(sha(raw)==h,'qualified receipt mismatch',n);sec[n]=j(raw)
        src,g,pr,s21,seal=[sec[k] for k in ('SOURCE.json','GRAPH.json','BROWSER.json','STAGE21-CONTROL.json','NORMAL-SEAL-NOT-PUBLISHED.json')]
        require(src['base']==BASE and src['source']==SOURCE and src['sourceTree']==P['normalSourceTree'] and src['baseTree']==P['baselineTree'] and src['stage7']==SRC and src['stage21']==np['next']['stage21'] and src['stage35']==P['protected35'],'wrong source witnesses')
        require(seal['activeBase']==BASE and seal['builtProduct']==SOURCE and seal['qaHead']==Q['head'] and seal['source']==SRC and seal['notRetainedOrPublished'] is True and
          {k:v['sha256'] for k,v in seal['receipts'].items()}=={k:v for k,v in pin.items() if k!='NORMAL-SEAL-NOT-PUBLISHED.json'},'official normal seal not exact')
        require(pr['status']=='PASS_EXACT_SCOPED_STAGE7_FALSE_BOTTOM_LINE' and 'active' not in pr and not pr['latePixelGateMismatches'],'Stage7 browser gate not completed')
        refs={r['key']:r for r in np['r2']['frames']}
        require(set(pr['frames'])==set(refs) and len(refs)==14,'all 14 registered camera comparisons required')
        for key,arms in pr['frames'].items():
            s=refs[key]; f=arms['verification']; real=s['id']==7
            require(all(arms['A'][k]==arms['B'][k] for k in ('camera','mapSHA256','registeredArtSHA256','domainSHA256','physicsSHA256','raster','fixedCloud','fixedGrade')) and arms['A']['physicsSHA256']==P['priorR2Physics']['byStage'][str(s['id'])] and arms['A']['camera']=={k:s[k] for k in ('actual','viewport','css','backing')},'real map/physics/camera drift',key)
            require(set(arms)-{'verification'}==({'A','B','A2','B2'} if real and s['view']=='south' else {'A','B'}),'wrong same-arm controls',key)
            for mode in set(arms)-{'verification'}:
                w=arms[mode]
                require(all(w['identicalImmediateReplay'].values()) and w['archiveCameraReferenceOriginalPNG']==s['pngSHA256'] and
                 (not real or w['observedClosure']==(1 if mode.startswith('A') else 0)),'unconfirmed live line or replay',key,mode)
            for kind in ('raw','dom'):
                q=f['modes'][kind]
                require(q['exactProtected'] is True and bool(q['changedLTRB'])==bool(f['lineTargetInActualViewport']) and (real or not q['changedLTRB']),'signed visual scope not proven',key)
                if verify_png:
                    d={mode:z.read(f'{key}-{mode}-{kind}.png') for mode in set(arms)-{'verification'}}
                    require(all(stamp(png)==arms[mode][kind] for mode,png in d.items()),'actual corresponding PNG bytes changed',key,kind)
                    require(independent_bbox(d['A'],d['B'])==q['changedLTRB'],'different independent actual RGB bounds',key,kind)
                    if 'A2' in d:
                        for m in ('A','B'):
                            require(independent_bbox(d[m],d[m+'2']) is None,'fresh same-arm repaint differs',key,m,kind)
        n=np['approved21']
        require(s21['complete'] is True and not s21['mismatches'] and s21['reference']==n['authority'] and len(s21['records'])==4 and len(s21['cases'])==8,'already published Stage21 verification incomplete')
        for label,r in s21['cases'].items():
            arm,css,pose=label.split('-')
            require(arm in ('A','B') and css in ('1440x900','390x844') and pose in ('ordinary','west'),'unapproved Stage21 record key')
            q=n['frames'][f'B-s21-{css}-{pose}']; f=r['frame']
            require(all(f[k]==v for k,v in q['frame'].items()) and r['owner']==n['owners'][css.split('x')[0]] and r['native']==q['native'],'published Stage21 captured native model differs',label)
            if verify_png:
                for kind,ref in [('raw','raw'),('dom','png')]:
                    fn=f'{label}-s21-{kind}.png';d=z.read(fn)
                    require(stamp(d)==r['pngs'][kind] and digest_rgba(d,*q['rgba'][ref]['size'])==q['rgba'][ref]['rgba'],'actual Stage21 published pixel comparison drift',fn)
        for can in s21['records'].values():require(can['restoredIsolatedApp'] and not can['errors'] and set(can['required'])<=set(can['observed']),'Stage21 native requests not loaded')
        raw=z.read(package)
        require(stamp(raw)==seal['zip'] and sha(raw)==Q['candidateArchiveSHA256'],'inner sealed normal ZIP differs')
    import io
    aliases=dict(g['allRenamedPaths'])
    require(aliases==Q['aliases'] and len(aliases)==4 and g['activeAssetsAnd50MapsExact'] is True and g['orderedModulesExactOutsideReadability'] is True,'normal graph change outside scope')
    require(g['repacked']==[['web/runtime/ordered-common-16.c094392d4ee992d9.js',next(iter(P['newCommon16']))]],'reviewed Stage7 wrapper no longer unique')
    shells=SHELLS|{MF}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names=safe_zip(z,18<<20)
        require(names==set(seal['generated'])==shells|set(aliases.values()) and len(names)==8,'generated ZIP path scope drift')
        files={k:z.read(k) for k in names}
        require(all(stamp(files[k])==g['B'][k]==seal['generated'][k] for k in names),'normal ZIP bytes differ from graph')
    mf=j(files[MF]);aa=inventory(old,810);ba=inventory(mf,810)
    require(aa=={k:v for k,v in g['A'].items() if k not in shells} and ba=={k:v for k,v in g['B'].items() if k not in shells}
       and set(aa)-set(ba)==set(aliases) and set(ba)-set(aa)==set(aliases.values())
       and all(aa[k]==ba[k] for k in aa.keys()&ba.keys()),'unexpected active immutable alias or shared bytes drift')
    for k,v in {**P['newCommon16'],**P['protected21'],**P['protected35'],**np['approved21']['mapAndPacket']}.items():
        require(ba[k]==v,'one protected canonical active body changed',k)
    require(mf['project']==old['project'],'campaign index changed')
    camp=j(show(BASE,mf['project']))
    require(len(camp['stages'])==len(camp['stageLibraries'])==50 and all(aa[k]==ba[k] for k in [camp['base'],camp['shared'],*camp['stages'],*camp['stageLibraries']]),'published stage map/packet closure changed')
    for k in aliases:
        if 'ordered-common-16.' in k:
            h1,a=ordered(show(BASE,k));h2,b=ordered(files[aliases[k]])
            ch=[i for i,(x,y) in enumerate(zip(a,b)) if x!=y]
            # Both module payloads are independently pinned by the official normal exporter.
            require(h1==h2 and len(a)==len(b) and len(ch)==1 and b'5069.18' in b[ch[0]] and b'5732.24' in b[ch[0]],'unexpected ordered runtime module drift')
        else:require(normalize(files[aliases[k]],aliases)==show(BASE,k),'entry only link change failed',k)
    for k in SHELLS:require(normalize(files[k],aliases)==show(BASE,k),'mutable shell differed beyond link changes',k)
    return files,mf,sec
def authority(w):
    np,old=check_scope();ar=Q['artifact'];run=api(f"actions/runs/{Q['run']}")
    require(run['id']==Q['run'] and run['repository']['full_name']==run['head_repository']['full_name']==TOP and
      run['head_sha']==Q['head'] and run['head_branch']=='qa/stage7-closure-after-stage21-42879' and run['path']=='.github/workflows/stage7-closure-after-stage21.yml' and
      (run['status'],run['conclusion'],run['event'])==('completed','success','push'),'not exact completed normal carrier')
    job=api(f"actions/jobs/{Q['job']}")
    step_names={'Exact tracked A and one normal B build','Actual Stage7 14 A/B plus original fresh same-arm replay controls','Keep already approved Stage21 normal west PC and mobile','Seal the verified normal output once; not retained or published'}
    require(job['id']==Q['job'] and job['run_id']==Q['run'] and job['name']=='proof' and
       (job['status'],job['conclusion'])==('completed','success') and
       step_names<={s['name'] for s in job['steps'] if s['status']=='completed' and s['conclusion']=='success'},'build/browser/normal output seal not all completed successfully')
    m=api(f"actions/runs/{Q['run']}/artifacts")
    active=[a for a in m['artifacts'] if a['name']=='honro-stage7-after-stage21-normal-and-eight-bytes-no-deploy' and not a['expired']]
    require(len(active)==1,'expected one pinned official normal output artifact')
    v=active[0]
    require(v['workflow_run']['id']==Q['run'] and v['workflow_run']['head_sha']==Q['head'] and (v['id'],v['size_in_bytes'],v['digest'])==(ar['id'],ar['bytes'],'sha256:'+ar['sha256']),'artifact identity/digest drift')
    p=w/'official.zip'
    with p.open('xb') as s:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{ar['id']}/zip"],stdout=s,check=True)
    require(stamp(p.read_bytes())=={k:ar[k] for k in ('bytes','sha256')},'downloaded outer bytes fail official authority')
    files,_,_=capsule(p,np,old)
    save(w/'verified-authority.json',{'run':Q['run'],'job':Q['job'],'head':Q['head'],'artifact':ar,'nestedNormal':Q['candidateArchiveSHA256'],
       'normalProofReceipts':Q['receiptSHA256'],'decodedApprovedPNGCount':80,'authorizedNormalGenerated':{k:stamp(v) for k,v in files.items()}})

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
    require(cert['decodedApprovedPNGCount']==80 and cert['artifact']==Q['artifact'] and
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
    paths=sorted(set(SRC)|set(files));require(len(paths)==10,'wrong exact source + retained graph cardinality')
    records={k:stamp((b/k).read_bytes()) for k in paths}
    require(all(blob((b/k).read_bytes())==v for k,v in SRC.items()),'copied producer source drift')
    delivery=done/'stage7-root-line-retained-source-and-generated-delta-no-deploy.zip'
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
