"""Retain verified ordinary compiled bytes; never build, publish or push."""
import binascii, collections, hashlib, json, os, re, stat, struct, subprocess, sys, zipfile, zlib
from pathlib import Path,PurePosixPath
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes()); Q=P['normal']; BASE=P['baseline']; SOURCE=P['normalSource']
TOP='sys8994/honro'; REF='refs/heads/qa/stage21-west-bedrock-retention-9ac'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
MF='web/manifest.json'; NORMAL_PINS='tools/stage21-r1-normal-qa/PINS.json'
QA_FILES={'.github/workflows/stage21-west-bedrock-retention.yml','tools/stage21-west-bedrock-retention/PINS.json','tools/stage21-west-bedrock-retention/retain.py'}
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
    np=show(Q['head'],NORMAL_PINS);require(blob(np)==Q['normalPinsGitBlob'],'wrong independently pinned comparison card')
    np=j(np)
    require(np['product']['commit']==SOURCE and np['product']['tree']==P['normalSourceTree'] and
      {k:v['git'] for k,v in np['product']['next'].items()}==SRC,'QA card and author candidate diverged')
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
def ordered(raw):
    h,tail=raw.split(b';',1); parts=tail.split(b'await yieldIfNeeded();')
    require(len(parts)>1 and not parts.pop().strip(),'incomplete immutable runtime wrapper')
    return h,[p.strip() for p in parts]
def normalize(raw,aliases):
    for old,new in aliases.items():
        raw=raw.replace(new.encode(),old.encode()).replace(Path(new).name.encode(),Path(old).name.encode())
    return raw
def capsule(archive,np,old,verify_png=True):
    pin=Q['receiptSHA256']; package='B-EXACT-NORMAL-GENERATED-DELTA-NOT-DEPLOYED.zip'
    with zipfile.ZipFile(archive) as z:
        names=safe_zip(z,80<<20) if verify_png else set(z.namelist())
        require(set(pin)|{package}<=names,'qualified receipts or byte delta missing')
        sec={}
        for n,h in pin.items():
            raw=z.read(n);require(sha(raw)==h,'qualified receipt mismatch',n);sec[n]=j(raw)
        src,g,proof=[sec[n] for n in ('SOURCE.json','GRAPH.json','proof.json')]
        require(src=={'base':BASE,'candidate':SOURCE,'candidateTree':P['normalSourceTree'],'transport':Q['head'],'source':np['product']},
          'normal proof source lineage drift')
        require(proof['base']==BASE and proof['product']==SOURCE and proof['complete'] is True and proof['stage']==21 and proof['browser']=='151.0.7922.34' and
          proof['authorizedVisualReference']==np['product']['approvedR1'],'signed real-browser authority')
        saved=proof['oldSave']; state=saved['resumedState']
        require(saved['verified'] is True and saved['sourceStoredNative'] is True and state['localVisualOwner']==-380 and
          [saved[k] for k in ('stage','round','phase')]==[state[k] for k in ('stage','round','phase')]==[21,1,'aim'],
          'ordinary old checkpoint import and Continue not verified')
        require(proof['stage26Control']['verified'] is True and len(proof['stage26Control']['receipts'])==4,
          'prior released Stage26 actual control missing')
        if verify_png:
            require(sha(z.read('B-stage21-9ac-save-resumed.png'))==Q['resumeFrameSHA256'],'old-save actual resume capture absent or different')
        stage26={}
        for row in proof['stage26Control']['receipts']:
            v=re.fullmatch(r'([AB])-s26-(1440x900|390x844)-west-raw\.png',row['file']); require(v is not None,'unknown Stage26 control member')
            arm,width=v.groups(); size=(1440,769) if width=='1440x900' else (390,648)
            require(arm in ('A','B') and row['actual']['x']==-320 and set(row['binding'])==set(Q['stage26Control'].values()),
              'actual Stage26 control is not signed canonical west')
            for k,v in row['binding'].items():require(g[arm]['active'][k]==v,'Stage26 protected active body drift')
            if verify_png:
                raw=z.read(row['file']);require(sha(raw)==row['pngSHA256'] and digest_rgba(raw,*size)==row['rgbaSHA256'],'Stage26 control PNG pixel identity drift')
            stage26[(size,arm)]=[row[k] for k in ('rgbaSHA256','physicsSHA256','actual','viewport','binding')]
        require(len(stage26)==4 and all(stage26[(s,'A')]==stage26[(s,'B')] for s in ((1440,769),(390,648))),'Stage26 west actual pixels or state changed')
        compares=proof['comparison']
        require({tuple(row['key']) for row in compares}=={(w,h,v) for w,h in ((1440,900),(390,844)) for v in ('ordinary','west','overview','east')}
          and len(compares)==8,'eight real paired poses missing')
        for row in compares:
            e=row['key'][-1]; require(row['strictPass'] is True,'strict pose failed',row['key'])
            for metric in row['features'].values():
                require(metric['strict'] is True and metric['outsideIndependentNativeBilinearSupport']==metric['alphaChanged']==metric['protectedOpaqueNativeRimChanged']==metric['whollyAboveExactRoofChanged']==0 and
                  ((metric['changed']==0)==(e=='east')),'actual protected pixel regression or visual absent',row['key'])
            if e in ('ordinary','west'):require(row['replays']==[True,True],'warm and return cache evidence absent')
        m=set()
        for frm in proof['frames']:
            key=(frm['variant'],*frm['viewportCSS'],frm['view']); m.add(key)
            require(frm['priorVisualExact'] is True and frm['phaseReceiptValidated'] is True and frm['nativeWitness']['readbackUnchanged'] is True,
              'actual signed camera or prior art reference changed',key)
            if verify_png:
                for kind,keysize,shaKey in (('raw','backing','rawSHA256'),('png','pixels','pngSHA256')):
                    fn=frm[kind]; raw=z.read(fn); ref=frm['reflectedReference'][kind]
                    require(sha(raw)==frm[shaKey] and ref['size']==frm[keysize] and digest_rgba(raw,*frm[keysize])==ref['rgba'],'actual current approval PNG pixel or byte mismatch',fn)
                for v in frm['nativeWitness']['masks'].values(): require(sha(z.read(v['path']))==v['sha256'],'independent native support mask changed')
                if 'replay' in frm:
                    replay=frm['replay']
                    for state in ('warm','returned'):
                        require(sha(z.read(frm['key']+'-'+state+'.png'))==replay[state+'SHA256'] and replay['equal'] is True,
                          'warm/returned disk proof changed')
        require(len(proof['frames'])==16 and m=={(s,*row['key']) for s in ('A','B') for row in compares},'actual matched-pose identities')
        raw=z.read(package);require(sha(raw)==Q['candidateArchiveSHA256'],'inner normal generated archive SHA mismatch')
    import io
    aliases=g['aliases'];require(aliases==Q['aliases'] and len(aliases)==4,'normal active old to new aliases drift')
    shells=SHELLS|{MF}
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names=safe_zip(z,16<<20)
        require(names==shells|set(aliases.values()) and len(names)==8,'generated zip path scope mismatch')
        files={k:z.read(k) for k in names}
        require(all(stamp(files[k])==g['B']['active'][k] for k in aliases.values()) and stamp(files[MF])==g['B']['manifest'] and stamp(files['HONRO.html'])==g['B']['shell'],'normal ZIP bytes differ from build graph')
    mf=j(files[MF]); aa=inventory(old,810);ba=inventory(mf,810)
    require(aa==g['A']['active'] and ba==g['B']['active'] and set(aa)-set(ba)==set(aliases) and set(ba)-set(aa)==set(aliases.values()) and
      all(aa[k]==ba[k] for k in aa.keys()&ba.keys()),'unexpected old graph, changed in-place asset, or new path')
    require(g['noneOf50ChapterMapOrAssetPacketsChanged'] is True and g['stableSource']==np['product']['immutableCanonicalSource'] and old['project']==mf['project'],'canonical source/map/save payload scope')
    campaign=show(BASE,old['project']); ca=j(campaign)
    require(stamp(campaign)==g['campaignManifest'] and len(ca['stages'])==len(ca['stageLibraries'])==50 and
      all(aa[k]==ba[k] for k in [ca['base'],ca['shared'],*ca['stages'],*ca['stageLibraries']]),'one of the 50 registered stages changed map or asset')
    for i in (20,25,34): # changed stage's art comes only from the wrapped source; 26 west & 35 previous forest remain exact.
        for k in ('stages','stageLibraries'):
            q=ca[k][i];require(stamp(show(BASE,q))==aa[q]==ba[q],'protected Stage21/26/35 compiled authority',q)
            if '-parts.' in q:
                for r in j(show(BASE,q))['parts']:require(aa[r['path']]==ba[r['path']]=={k:r[k] for k in ('bytes','sha256')},'protected split dependency')
    run=next(k for k in aliases if 'ordered-common-17.' in k)
    h1,a=ordered(show(BASE,run));h2,b=ordered(files[aliases[run]])
    reg=g['normalBodyOnly'];ix=reg['wrapperIndex']
    require(h1==h2 and len(a)==len(b) and [i for i,(x,y) in enumerate(zip(a,b)) if x!=y]==[ix] and
      stamp(a[ix])==reg['before'] and stamp(b[ix])==reg['after'] and b'upper-split-return' in b[ix],'stage-local generated wrapper scope differs')
    for k in aliases.keys()-{run}:require(normalize(files[aliases[k]],aliases)==show(BASE,k),'static entry changed beyond immutable linkage',k)
    for k in SHELLS:require(normalize(files[k],aliases)==show(BASE,k),'stable shell changed beyond immutable linkage',k)
    require(files['index.html']==files['HONRO.html'] and mf['gameEntry'].encode() in files['HONRO.html'] and mf['workshopEntry'].encode() in files['HONRO_WORKSHOP.html'],'published shell registration wrong')
    return files,mf,sec
def authority(w):
    np,old=check_scope();ar=Q['artifact'];run=api(f"actions/runs/{Q['run']}")
    require(run['id']==Q['run'] and run['repository']['full_name']==run['head_repository']['full_name']==TOP and
      run['head_sha']==Q['head'] and run['head_branch']=='qa/stage21-west-bedrock-normal-9ac' and run['path']=='.github/workflows/stage21-r1-normal-qa.yml' and
      (run['status'],run['conclusion'],run['event'])==('completed','success','push'),'not exact completed normal carrier')
    job=api(f"actions/jobs/{Q['job']}")
    step_names={'Exact retained old app and canonical normal candidate build','Actual native Chrome screenshots and old-save import/continue','Seal exact build outputs for review, no deployment'}
    require(job['id']==Q['job'] and job['run_id']==Q['run'] and job['name']=='proof' and
       (job['status'],job['conclusion'])==('completed','success') and
       step_names<={s['name'] for s in job['steps'] if s['status']=='completed' and s['conclusion']=='success'},'build/browser/normal output seal not all completed successfully')
    m=api(f"actions/runs/{Q['run']}/artifacts")
    active=[a for a in m['artifacts'] if a['name']=='honro-stage21-r1-normal-build-and-resume-no-deploy' and not a['expired']]
    require(len(active)==1,'expected one pinned official normal output artifact')
    v=active[0]
    require(v['workflow_run']['id']==Q['run'] and v['workflow_run']['head_sha']==Q['head'] and (v['id'],v['size_in_bytes'],v['digest'])==(ar['id'],ar['bytes'],'sha256:'+ar['sha256']),'artifact identity/digest drift')
    p=w/'official.zip'
    with p.open('xb') as s:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{ar['id']}/zip"],stdout=s,check=True)
    require(stamp(p.read_bytes())=={k:ar[k] for k in ('bytes','sha256')},'downloaded outer bytes fail official authority')
    files,_,_=capsule(p,np,old)
    save(w/'verified-authority.json',{'run':Q['run'],'job':Q['job'],'head':Q['head'],'artifact':ar,'nestedNormal':Q['candidateArchiveSHA256'],
       'normalProofReceipts':Q['receiptSHA256'],'decodedApprovedPNGCount':36,'authorizedNormalGenerated':{k:stamp(v) for k,v in files.items()}})

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
    require(cert['decodedApprovedPNGCount']==36 and cert['artifact']==Q['artifact'] and
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
    delivery=done/'stage21-west-bedrock-retained-source-and-generated-delta-no-deploy.zip'
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
