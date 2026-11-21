"""One exact Stage24 retained package; no network in seal and no ref writes."""
import binascii,hashlib,json,os,re,stat,struct,subprocess,sys,zipfile,zlib,io
from pathlib import Path,PurePosixPath
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
Q=P['normal'];BASE=P['baseline'];SRC=P['sourceAfter'];ALIASES=P['aliases']
TOP='sys8994/honro';REF='refs/heads/qa/stage24-front6-retention-b79'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
MF='web/manifest.json';NORMAL_DIR='tools/stage24-front6-native/'
SELF='tools/stage24-front6-retention/'
QA_FILES={'.github/workflows/stage24-front6-retention.yml',SELF+'PINS.json',SELF+'retain.py'}
RETAINER={'tools/release/retain-published-web.mjs':'8374336b53c74ac81e6d32f5aa43eee575e61daa','shared/web-retention.mjs':'16687b0fc38e432a7d66a015ddf3ebe744163a06'}
SHELLS={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
HISTORY_FIELDS={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
ROI=(6890,2448,7040,2622)
D=Q['nested'];SEAL=D['path'].rsplit('/',1)[0]+'/SEAL.json'
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
        require(off+12<=len(data),'truncated PNG chunk header')
        n,t=struct.unpack_from('>I4s',data,off); off+=8
        require(off+n+4<=len(data),'truncated PNG chunk body')
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
def normalize(raw,aliases):
    for old,new in aliases.items():
        raw=raw.replace(new.encode(),old.encode()).replace(Path(new).name.encode(),Path(old).name.encode())
    return raw
def actual_size(data):
    require(data[:8]==bytes.fromhex('89504e470d0a1a0a') and data[12:16]==b'IHDR','wrong PNG header')
    return struct.unpack_from('>II',data,16)
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

def exact_scope():
    require((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(TOP,REF,'push'),'wrong QA scope')
    h=os.environ['GITHUB_SHA'];q=Q['head']
    require(git(ROOT,'rev-parse','HEAD').decode().strip()==h and not git(ROOT,'status','--porcelain=v1','-z'),'wrong or dirty carrier')
    require(git(ROOT,'rev-parse','--is-shallow-repository').strip()==b'false','fetch-depth not full')
    for a,b in ((h,q),(q,BASE)):
        require(git(ROOT,'rev-list','--parents','-n1',a).decode().split()==[a,b],'wrong sole parent',a,b)
    require(tree(BASE)==P['baselineTree'] and tree(q)==Q['tree'],'wrong pinned commit tree')
    require(diff(q,h)=={'A\t'+p for p in QA_FILES} and diff(BASE,q)=={'A\t'+p for p in P['normalQAPaths']},'unexpected carrier or approved QA scope')
    for rev,paths in ((h,QA_FILES),(q,P['normalQAPaths'])):
        require(all(git(ROOT,'ls-tree',rev,'--',k).split(None,1)[0]==b'100644' for k in paths),'unexpected path mode')
    for k,v in P['normalQAPaths'].items():
        b=show(q,k);require(stamp(b)=={x:v[x]for x in ('bytes','sha256')} and blob(b)==v['git'],'normal QA source mismatch',k)
    for k,v in {**RETAINER,**P['sourceBefore']}.items():
        require(git(ROOT,'rev-parse',BASE+':'+k).decode().strip()==v and git(ROOT,'rev-parse',q+':'+k).decode().strip()==v,'protected source drift',k)
    old=show(BASE,MF);prior=P['priorPages']
    require(blob(old)==prior['manifestGitBlob'] and sha(old)==prior['manifestSHA256'],'wrong old published manifest')
    return j(old)
def exact_pixels(z,p):
    from math import floor,ceil
    from statistics import median
    dims=[(1440,900),(390,844)]; views=('east-ordinary','east','southeast','west','southwest')
    wanted={f's24-{w}x{h}-{p}'for w,h in dims for p in views}
    require(set(p['comparisons'])==wanted and set(p['frames'])=={s+'-'+x for s in ('A','B')for x in wanted},'40 exact frame files not bound')
    require(len(p['visits'])==4 and all(v['status']=='CAPTURED'and not v['errors']for v in p['visits']),'capture run not complete')
    decoded=0;near={}
    for k in sorted(wanted):
        a,b=(p['frames'][side+'-'+k]for side in ('A','B'))
        keys=('physicsSHA256','actual','viewport','focus','zoomLimits','css','backing','actorCount','tide','phase','round','sceneTime')
        require(all(a[x]==b[x]for x in keys) and a['physicsSHA256']==P['physicsSHA256'],'geometry/actor/camera drift',k)
        require((a['phase'],a['round'],a['actorCount'],a['sceneTime'])==('aim',1,30,2),'not frozen normal turn',k)
        cw,ch=a['backing'];v=a['viewport'];z0=a['actual']['scale'];left=v['left'];top=v['top'];negative=k.endswith('west')
        for label in ('raw','dom'):
            raw=(z.read(a[label]),z.read(b[label]))
            require([sha(x)for x in raw]==[a[label+'SHA256'],b[label+'SHA256']],'raw artifact PNG hash mismatch',k,label)
            w,h=actual_size(raw[0]);require(actual_size(raw[1])==(w,h) and w==cw and h in (ch,ch+1),'PNG bounds mismatch')
            u,v0=(digest_rgba(x,w,h,pixels=True)for x in raw);decoded+=2
            require(u[3::4]==v0[3::4],'changed alpha',k,label)
            diff=0
            for n in range(0,len(u),4):
                if u[n:n+4]==v0[n:n+4]:continue
                diff+=1;y,x=divmod(n//4,w);x0=left+x/z0;x1=x0+1/z0;y0=top+y/z0;y1=y0+1/z0
                require(not negative and y<ch and ROI[0]<=x0<=x1<=ROI[2] and ROI[1]<=y0<=y1<=ROI[3] and y0>2446,'independent signed-pixel check',k,label,x,y)
            stated=p['comparisons'][k][label]
            require(stated['strict'] and stated['changed']==diff and diff==(0 if negative else stated['changed']) and (negative or diff>0),
                    'actual pixel count or negative changed',k,label,diff)
            require(not any(stated[n]for n in ('unsigned','alpha','roofOrRim')),'normal protections not exact',k,label)
            if k.endswith('ordinary'):
                vals=[]
                for pixels in (u,v0):
                    strongest=[]
                    for row in range(max(0,ceil((2452-top)*z0-.5)),min(h-1,floor((2610-top)*z0-.5))+1):
                        def sample(col,c):return pixels[(row*w+col)*4+c]
                        first=max(7,ceil((6918-left)*z0-.5));last=min(w-8,floor((7006-left)*z0-.5))
                        strongest.append(max(max(abs(median(sample(i,c)for i in range(col-7,col-2))-median(sample(i,c)for i in range(col+2,col+7)))for c in range(3))for col in range(first,last+1)))
                    arr=sorted(strongest);q=.9*(len(arr)-1);i=floor(q)
                    vals.append({'rows':len(arr),'yWorld':[2452,2610],'medianMaxStep':median(arr),'p90MaxStep':arr[i]+(arr[i+1]-arr[i])*(q-i),'maximum':max(arr)})
                before,after=vals
                require(stated['edge']=={'A':before,'B':after} and stated['edgeIndependentlyImproved'] and after['medianMaxStep']<before['medianMaxStep'] and after['p90MaxStep']<=before['p90MaxStep'] and after['maximum']<=before['maximum'],'independent contrast disagrees with approved actual',k,label)
                near[k+'-'+label]=[before['medianMaxStep'],after['medianMaxStep']]
    require(decoded==Q['actualAuthorityPNGCount'],'PNG count scope')
    return {'independentPNGCount':decoded,'nearMedianDN':near}
def capsule(archive,old,base_read,verify_png):
    require(stamp(archive.read_bytes())=={k:Q['artifact'][k]for k in ('bytes','sha256')},'outer bytes mismatch')
    with zipfile.ZipFile(archive)as z:
        require(safe_zip(z,32<<20)==set(P['outerEntries']),'wrong outer file list')
        require(all(sha(z.read(p))==h for p,h in Q['pins'].items()),'mismatched signed normal receipt')
        src,g,d,p,wire,ss=(j(z.read(k))for k in ('CANDIDATE-SOURCE.json','GRAPH.json','GRAPH-DELTA.json','RECEIPT.json','PACKET-WIRE.json',SEAL))
        require(src['after']==SRC and src['old']==P['sourceBefore'] and src['canonicalVectorSplice']['reverseRestoresOriginalBytes'],'source receipt changed')
        require(src['registeredVectorHash']==P['candidateAuthorOwnerSHA256'] and src['canonicalVectorSplice']['newSliceSHA256']==P['candidateAuthorOwnerSHA256'],'wrong authentic author art')
        require(j(z.read('GATE.json'))['testHead']==Q['head'] and len(j(z.read('GATE.json'))['addOnly'])==5,'wrong actual workflow gate')
        require(wire['status']=='OFFICIAL_WIRE_EXACT' and wire['oldByteExact'] and wire['newByteExact'] and wire['fullParsedExact'] and wire['otherAssetsExact'],'wrong official wire evidence')
        require(p['status']=='PASS_EXACT_STAGE24_VISUAL_SCOPE_AND_CONTRAST_PENDING_HUMAN_REVIEW','normal browser result not pass')
        require(d['aliases']==ALIASES and (d['allStageMaps'],d['otherAssetPackets'],d['activeFiles'],d['sharedActiveExact'])==(50,49,810,804),'unapproved normal delta')
        images=exact_pixels(z,p) if verify_png else {}
        payload=z.read(D['path']);require(stamp(payload)=={k:D[k]for k in ('bytes','sha256')},'nested candidate zip wrong bytes')
        require(ss['files']==P['normalFiles'] and ss['zip']==stamp(payload) and ss['authoringAfterGit']==SRC,'normal seal drift')
        require(ss['sourceRecipe']=={k:P['normalQAPaths'][NORMAL_DIR+'prepare.mjs'][k]for k in ('sha256','bytes')},'wrong actual prepare recipe')
        with zipfile.ZipFile(io.BytesIO(payload))as bz:
            require(safe_zip(bz,16<<20)==set(P['normalFiles']),'nested exact file list')
            files={k:bz.read(k)for k in P['normalFiles']}
        require(all(stamp(v)==P['normalFiles'][k] for k,v in files.items()),'nested body drift')
    normal=j(files[MF]);old_active=inventory(old,810);nactive=inventory(normal,810)
    require(old_active==g['A']['active'] and nactive==g['B']['active'] and
            set(old_active)-set(nactive)==set(ALIASES) and set(nactive)-set(old_active)==set(ALIASES.values()) and             all(nactive[k]==old_active[k]for k in nactive.keys()&old_active.keys()),'unexpected immutable graph drift')
    require(all(stamp(files[k])==nactive[k]for k in ALIASES.values()),'invalid candidate active alias byte binding')
    for k in ALIASES:
        new=ALIASES[k];require(new not in registry(old),'alias already historically registered',new)
        if k.endswith(('.js','.html')):
            require(normalize(files[new],ALIASES)==base_read(k),'changed compiled code beyond normal address remaps',k)
    for k in SHELLS:require(normalize(files[k],ALIASES)==base_read(k),'shell outside link delta',k)
    ac=j(base_read(old['project']));bc=j(files[normal['project']])
    require(len(ac['stages'])==len(ac['stageLibraries'])==50 and bc['stageLibraries'][23]==ALIASES[ac['stageLibraries'][23]],
            'not exact registered Stage24 chapter binding')
    x=bc['stageLibraries'][23];bc['stageLibraries'][23]=ac['stageLibraries'][23];require(bc==ac,'other campaign refs/maps/physical inputs changed')
    ap=j(base_read(ac['stageLibraries'][23]));bp=j(files[x])
    k=next(i for i,a in enumerate(ap)if a['id']=='family24:retaining-earth-faces')
    require(bp[k]['vector']==src['registeredVector'] and {**bp[k],'vector':ap[k]['vector']}==ap[k] and bp[:k]+[ap[k]]+bp[k+1:]==ap,'decoded front6 and 21 owners not exact')
    return files,normal,images
def authority(w):
    old=exact_scope()
    require(api('git/ref/heads/master')['object']['sha']==BASE,'master drift before read-only packaging')
    ar=Q['artifact'];run=api(f"actions/runs/{Q['run']}");prior=P['priorPages'];job=api(f"actions/jobs/{Q['job']}")
    require((run['id'],run['head_sha'],run['head_branch'],run['path'],run['status'],run['conclusion'],run['event'])==
      (Q['run'],Q['head'],Q['branch'],Q['workflow'],'completed','success','push') and run['repository']['full_name']==run['head_repository']['full_name']==TOP,'wrong exact normal run')
    passes={v['name']for v in job['steps']if v['status']=='completed'and v['conclusion']=='success'}
    require((job['id'],job['run_id'],job['name'],job['status'],job['conclusion'])==(Q['job'],Q['run'],'compare','completed','success') and
      {'Exact stock checkout and Stage24 authored normal rebuild only','Genuine Stage24 raw and DOM A/B under matching stock camera','Seal exact compiled Stage24 delta after verified captures'}<=passes,'wrong actual compare job/steps')
    m=api(f"actions/runs/{prior['run']}");pj=api(f"actions/jobs/{prior['job']}")
    require((m['id'],m['head_sha'],m['head_branch'],m['name'],m['status'],m['conclusion'])==(prior['run'],BASE,'master','pages build and deployment','completed','success')and
      (pj['id'],pj['run_id'],pj['name'],pj['status'],pj['conclusion'])==(prior['job'],prior['run'],'deploy','completed','success') and
      any(s['name']=='Deploy to GitHub Pages'and s['conclusion']=='success'for s in pj['steps']),'prior b79 Pages not exact')
    ax=api(f"actions/runs/{Q['run']}/artifacts?name={ar['name']}")['artifacts'];require(len(ax)==1,'wrong official artifact multiplicity')
    a=ax[0];require(not a['expired'] and (a['id'],a['name'],a['size_in_bytes'],a['digest'])==(ar['id'],ar['name'],ar['bytes'],'sha256:'+ar['sha256'])and
      a['workflow_run']['id']==Q['run'] and a['workflow_run']['head_sha']==Q['head'],'wrong artifact pin')
    z=w/'official.zip'
    with z.open('xb')as f:subprocess.run(['gh','api',f"repos/{TOP}/actions/artifacts/{ar['id']}/zip"],stdout=f,check=True,timeout=90)
    files,_,i=capsule(z,old,lambda path:show(BASE,path),verify_png=True)
    save(w/'verified-authority.json',{'scope':'independent official actual QA only', 'run':Q['run'],'job':Q['job'],'head':Q['head'],'tree':Q['tree'],'artifact':ar,
        'priorPages':prior,'nestedNormal':D,'decodedApprovedPNGCount':i['independentPNGCount'],'nearMedianDN':i['nearMedianDN'],
        'authorizedNormalGenerated':{k:stamp(v)for k,v in files.items()}})
def stock_history_bridge(old,normal):
    # Existing previousFiles is the official compatibility carry-forward; it
    # intentionally survives ordinary retention without grandfathering expired
    # publishedGraphs. The exact current stock registry is the sole authority.
    rb=registry(old);active=inventory(normal,810)
    bridge={**normal,**{k:old[k]for k in HISTORY_FIELDS}}
    shadow=list(old['previousFiles']); have={v['path']for v in shadow}
    append=[{'path':k,'bytes':v['bytes'],'sha256':v['sha256']} for k,v in rb.items() if k not in active and k not in have]
    bridge['previousFiles']=shadow+append
    require(bridge['previousFiles'][:len(shadow)]==old['previousFiles'] and
            {k:bridge[k]for k in HISTORY_FIELDS-{'previousFiles'}}=={k:old[k]for k in HISTORY_FIELDS-{'previousFiles'}},'b79 historic metadata lost applying bridge')
    require({k:v for k,v in bridge.items()if k not in HISTORY_FIELDS}=={k:v for k,v in normal.items()if k not in HISTORY_FIELDS},'normal active changed before retention')
    want={**rb,**{k:active[k]for k in ALIASES.values()}}
    require(len(rb)==1311 and len(want)==1317 and registry(bridge)==want,'exact b79 compatibility carry mismatch')
    return bridge,{'baselineRegistered':len(rb),'initialCompatUnion':len(want),'previousFilesStock':len(shadow),
                   'previousFilesAppendedExact':len(append),'samePublishedAsB79':len(old['publishedGenerations']),
                   'candidateNormalPublished':len(normal['publishedGenerations']),
                   'baselinePublishedGraphReceipts':[{k:x[k]for k in ('sourceSha','graphSha256','publishedAt','publishedAtPrecision','evidence')}for x in old['publishedGenerations']]}
def seal(w):
    require(not(os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')),'QA authority token present in assembly')
    require(w.resolve().is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()),'wrong disposable work area')
    old=exact_scope(); cert=jfile(w/'verified-authority.json')
    require(cert['artifact']==Q['artifact'] and cert['head']==Q['head'] and cert['priorPages']==P['priorPages'] and cert['decodedApprovedPNGCount']==40,'actual authority missing or drift')
    files,normal,_=capsule(w/'official.zip',old,lambda path:show(BASE,path),verify_png=False)
    require(cert['authorizedNormalGenerated']=={k:stamp(v)for k,v in files.items()},'authorized generated bytes drift')
    b=w/'B';require(not b.exists(),'detached scratch unexpectedly exists')
    git(ROOT,'worktree','add','--detach',str(b),BASE)
    require(not git(b,'status','--porcelain=v1','-z') and git(b,'rev-parse','HEAD').decode().strip()==BASE and not git(b,'branch','--show-current').strip(),'expect clean b79 detached')
    (w/'out').mkdir(exist_ok=False);out=w/'delivery'
    # Exact normal validated author recipe from pinned checkout, never execute a recipe from the artifact.
    with (out/'prepare-reproduction.log').open('xb')as f:
        subprocess.run(['node',str(ROOT/NORMAL_DIR/'prepare.mjs'),str(w)],cwd=b,stdout=f,stderr=subprocess.STDOUT,check=True,timeout=90)
    candidate=(w/'out'/'CANDIDATE-SOURCE.json').read_bytes()
    require(sha(candidate)==Q['pins']['CANDIDATE-SOURCE.json'],'scratch actual author source receipt not reproduced')
    require(all(blob((b/p).read_bytes())==v for p,v in SRC.items()),'actual authorized source not reproduced')
    for p,body in files.items():
        f=b/p;require(f.resolve().is_relative_to(b)and not f.is_symlink()and f.parent.is_dir(),'unsafe exact output path',p)
        if p not in SHELLS|{MF}:require(not f.exists(),'new content address already physically present',p)
        f.write_bytes(body)
    rb=registry(old)
    require(len(rb)==1311 and len(old['publishedGenerations'])==39 and len(old['previousGenerations'])==2,'unexpected exact prior app registry population')
    require(all(stamp((b/k).read_bytes())==v for k,v in rb.items()),'pre-retention history bytes missing')
    bridge,bridge_cert=stock_history_bridge(old,normal)
    (b/MF).write_bytes((json.dumps(bridge,ensure_ascii=False,indent=2)+'\n').encode())
    require(registry(jfile(b/MF))==registry(bridge),'compatibility input write drift')
    bridge_cert['compatibilityInputManifest']=stamp((b/MF).read_bytes())
    save(out/'B79-COMPATIBILITY-HISTORY.json',bridge_cert)
    prior=P['priorPages']; evidence=f"https://github.com/{TOP}/actions/runs/{prior['run']}"
    with (out/'retainer-output.json').open('xb') as f:
        subprocess.run(['node','tools/release/retain-published-web.mjs',BASE,'--published-at',prior['publishedAt'],'--evidence',evidence],cwd=b,stdout=f,check=True,timeout=140)
    after=jfile(b/MF)
    require({k:v for k,v in after.items()if k not in HISTORY_FIELDS}=={k:v for k,v in normal.items()if k not in HISTORY_FIELDS},'active manifest or module/shell path drift')
    require(all((b/k).read_bytes()==v for k,v in files.items() if k!=MF),'untested compiled alias or shell bytes')
    active=inventory(after,810);rr=registry(after)
    added=set(ALIASES.values());require(len(added)==6 and not added&set(rb),'new alias conflict')
    require(len(rr)==1317 and rr=={**rb,**{k:active[k]for k in added}},'registry lost or changed old approved immutable paths')
    require(all(stamp((b/k).read_bytes())==v for k,v in rr.items()),'history bytes missing after official retainer')
    hp={x['sourceSha']:x for x in old['publishedGenerations']};np={x['sourceSha']:x for x in after['publishedGenerations']}
    require(len(hp)==39 and BASE in np and set(np)<=set(hp)|{BASE} and
            all(np[k]==hp[k]for k in set(np)-{BASE}),'unexpected existing graph identity or falsely added publication')
    expired=set(hp)-set(np); compat={v['path'] for v in after['previousFiles']}
    require(all(f['path']in rr and (f['path']in active or f['path']in compat) for k in expired for f in hp[k]['files']),
            'expired graph bytes not reachable from exact active or compatibility registry')
    bridge_cert.update({'officialWindowRetainedSourceSHAs':sorted(np),'officialWindowExpiredSourceSHAs':sorted(expired),
                        'retainedRegistry':len(rr),'retentionPolicyUnchanged':after['publishedRetention']==old['publishedRetention']})
    require(bridge_cert['retentionPolicyUnchanged'],'published retention policy changed')
    save(out/'B79-COMPATIBILITY-HISTORY.json',bridge_cert)
    published=np[BASE]
    require(published['publishedAt']==prior['publishedAt'] and published['publishedAtPrecision']=='instant' and published['evidence']==evidence and published['files']==old['files'] and not Q['head'] in np,'wrong exact old live graph publication evidence')
    touched=set(SRC)|SHELLS|{MF};allowed=touched|added
    require(set(git(b,'diff','--no-renames','--name-status',BASE,'--').decode().splitlines())=={'M\t'+p for p in touched},'tracked path outside 2 source + 4 generated modifications')
    require(set(git(b,'ls-files','--others','--exclude-standard').decode().splitlines())==added,'untracked files outside six immutable additions')
    require(len(allowed)==12 and len(touched)==6,'allowed path counts')
    records={p:{**stamp((b/p).read_bytes()),'git':blob((b/p).read_bytes()),'mode':'100644','change':('A'if p in added else 'M')}for p in sorted(allowed)}
    git(b,'add','--',*sorted(allowed));index={('A'if p in added else 'M')+'\t'+p for p in allowed}
    require(set(git(b,'diff','--cached','--no-renames','--name-status',BASE).decode().splitlines())==index,'unexpected prepared index')
    tree_id=git(b,'write-tree').decode().strip(); require(git(b,'rev-parse','HEAD').decode().strip()==BASE,'unexpected HEAD movement')
    for p,v in records.items():
        row=git(b,'ls-tree',tree_id,'--',p).decode().split()
        require(row[:3]==['100644','blob',v['git']],'wrong sealed mode/blob',p)
    # Commit-tree does not update a ref. Reproduce an object with an auditable fixed identity only.
    env={**os.environ,'GIT_AUTHOR_NAME':'HONRO QA','GIT_AUTHOR_EMAIL':'qa@honro.invalid','GIT_COMMITTER_NAME':'HONRO QA','GIT_COMMITTER_EMAIL':'qa@honro.invalid',
         'GIT_AUTHOR_DATE':'2026-11-21T14:59:22Z','GIT_COMMITTER_DATE':'2026-11-21T14:59:22Z'}
    cmd=['git','-C',str(b),'-c','commit.gpgsign=false','commit-tree',tree_id,'-p',BASE]
    commit=subprocess.run(cmd,input=b'Stage24: retained terminal face candidate proof (not published)\n',stdout=subprocess.PIPE,check=True,env=env).stdout.decode().strip()
    require(git(b,'rev-list','--parents','-n1',commit).decode().split()==[commit,BASE] and
      git(b,'rev-parse',commit+'^{tree}').decode().strip()==tree_id and git(b,'rev-parse','HEAD').decode().strip()==BASE,'proof commit scope mismatch')
    z=out/'stage24-front6-retained-source-and-generated-delta-no-deploy.zip'
    with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6)as p:
        for path in sorted(allowed):
            info=zipfile.ZipInfo(path,(1980,1,1,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED
            p.writestr(info,(b/path).read_bytes())
    with zipfile.ZipFile(z)as zz:
        require(safe_zip(zz,64<<20)==allowed and all(stamp(zz.read(p))=={k:r[k]for k in ('bytes','sha256')} for p,r in records.items()),'wrong sealed ZIP paths and bytes')
    zs=stamp(z.read_bytes());save(out/'RETAINED-DELTA-RECEIPT.json',{'published':False,'role':'read-only retained QA with local git object proof; no ref write','base':BASE,
      'baseTree':P['baselineTree'],'sourceGitBlobs':SRC,'actualNormalAuthority':cert,'priorPages':prior,'activeCount':810,'publicGraphsOld':39,'publicGraphsFinal':len(np),'expiredGraphsStillHaveBytes':len(expired),'baselineRegisteredVerified':1311,
      'retainedRegisteredVerified':1317,'oldPhysicalTrackedAssetsPreserved':True,'retainedOldPublishedGraphSha256':published['graphSha256'],
      'normalManifestBeforeRetention':stamp(files[MF]),'files':records,'zip':zs,'localRefUnchanged':BASE,'candidateTree':tree_id,'localProofCommit':commit})
    (out/'SHA256SUMS').write_text(zs['sha256']+'  '+z.name+'\n')
    (out/'verified-authority.json').write_bytes((w/'verified-authority.json').read_bytes())

if __name__=='__main__':
    {'authority':authority,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
