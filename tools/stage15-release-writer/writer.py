"""Pinned package verifier and isolated Git tree preparer. This program never pushes."""
import hashlib,json,os,re,stat,subprocess,sys,zipfile
from pathlib import Path,PurePosixPath
from io import BytesIO
HERE=Path(__file__).resolve().parent
P=json.loads((HERE/'PINS.json').read_bytes())
HEX=re.compile(r'^[a-f0-9]{64}$');GIT=re.compile(r'^[a-f0-9]{40}$')
IMM=re.compile(r'^web/(data|entries|runtime)/[A-Za-z0-9_.-]+\.([a-f0-9]{16})\.[A-Za-z0-9_]+$')
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html','web/manifest.json'}
MAN='web/manifest.json';SRC=P['sourceGit'];BASE=P['base'];REF=P['releaseRef'];REPO='sys8994/honro'
OUTER=P['manufacture']['outer'];NEST=P['manufacture']['nested']
def require(t,*why):
    if not t:raise SystemExit('STOP '+repr(why))
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def parse(b):
    def uniq(p):
        r={}
        for k,v in p:
            require(k not in r,'duplicate JSON key',k);r[k]=v
        return r
    return json.loads(b,object_pairs_hook=uniq)
def match_fact(b,p):return fact(b)=={k:p[k]for k in ('bytes','sha256')}
def pins_ok():
    require(P['enabled'] is True and P['repo']==REPO and
        REF=='refs/heads/release/act2-stage15-terrain-20261121' and BASE=='2939958cc87407ef60b58720bb6e086b8559031b','inactive or invalid scope')
    m=P['manufacture']
    require(type(m['job'])is int and GIT.fullmatch(m['head'] or '') and HEX.fullmatch(m['receiptSHA256'] or ''),'unbound manufacture identities')
    require(type(OUTER)is dict and type(OUTER.get('id'))is int and type(OUTER['bytes'])is int and 0<OUTER['bytes']<=120<<20
        and HEX.fullmatch(OUTER['sha256']) and type(NEST)is dict and type(NEST['bytes'])is int and 0<NEST['bytes']<=100<<20 and HEX.fullmatch(NEST['sha256']),'unbound ZIP pins')
    fs=P['files'];require(type(fs)is dict and len(fs)==16 and set(SRC)|SHELL<=set(fs),'unbound scoped file list')
    for f,s in fs.items():
        require(type(s['bytes'])is int and 0<s['bytes']<=60<<20 and HEX.fullmatch(s['sha256']),'bad file pin',f)
        if f not in set(SRC)|SHELL:
            k=IMM.fullmatch(f);require(k and k[2]==s['sha256'][:16],'bad content-addressed destination',f)
    require(re.fullmatch(r'2026-11-21T\d\d:\d\d:\d\dZ',P['commitDate'] or ''),'unbound reviewed commit timestamp')
def safe(z):
    members=z.infolist();names=set()
    for item in members:
        n=PurePosixPath(item.filename)
        require(n.parts and not n.is_absolute() and '..' not in n.parts and chr(92) not in item.filename and
            n.as_posix()==item.filename.rstrip('/') and item.filename not in names and
            not stat.S_ISLNK(item.external_attr>>16),'unsafe archive member',item.filename)
        names.add(item.filename)
    return names
def read(z,k,limit):
    r=z.getinfo(k);require(not r.is_dir() and 0<r.file_size<=limit,'oversized/empty archive file',k)
    return z.read(k)
def validate_nested(body,receipt):
    pins_ok()
    require(match_fact(body,NEST) and sha(receipt)==P['manufacture']['receiptSHA256'],'nested/receipt pin mismatch')
    s=parse(receipt);rr=s['actualNativeAuthority']
    require(s['published']is False and s['deletedPaths']==[] and s['sourceBase']==BASE and
        s['normalManifest']==P['normalManifest'] and s['publishedBaseGenerationPreserved'] is True and
        rr['scoped48Exact']is True and rr['overallIntegratedJobConclusion']=='failure' and rr['run']==44861522565 and
        rr['artifact']['id']==14689619126,'wrong manufactured scope or claims')
    require(s['files']==P['files'] and {p:h[1]for p,h in s['sourceGitBlobs'].items()}==SRC and
        match_fact(body,s['archive']),'receipt file set or archive drift')
    require(s['mutableShells']==['HONRO.html','HONRO_WORKSHOP.html','index.html'] and
        set(s['newImmutable'])==set(P['files'])-set(SRC)-SHELL and
        all(P['files'][k]==v for k,v in s['newImmutable'].items()),'receive only scoped exact additive generated roles')
    out={}
    with zipfile.ZipFile(BytesIO(body))as z:
        require(safe(z)==set(P['files']),'unexpected nested paths')
        for p,w in P['files'].items():
            b=read(z,p,w['bytes'])
            require(fact(b)==w and (p not in SRC or blob(b)==SRC[p]),'independent file or raw source Git mismatch',p)
            out[p]=b
    return out
def get(path):
    return parse(subprocess.check_output(['gh','api','repos/'+REPO+'/'+path]))
def verify_and_handoff(dest):
    pins_ok()
    m=P['manufacture'];run=get(f"actions/runs/{m['run']}")
    require(run['id']==m['run'] and run['repository']['full_name']==run['head_repository']['full_name']==REPO and
        run['head_sha']==m['head'] and run['head_branch']==m['branch'] and run['path']==m['workflow'] and
        run['event']=='push' and run['status']=='completed' and run['conclusion']=='success','wrong manufacturing authority')
    job=get(f"actions/jobs/{m['job']}")
    require(job['id']==m['job'] and job['run_id']==m['run'] and job['name']=='retain-stage15-r3' and
        job['status']=='completed' and job['conclusion']=='success','wrong manufacturing job')
    rows=[a for a in get(f"actions/runs/{m['run']}/artifacts")['artifacts']if not a['expired'] and a['name']==m['artifactName']]
    require(len(rows)==1,'expected one bound manufacture artifact');a=rows[0]
    require(a['id']==OUTER['id'] and a['size_in_bytes']==OUTER['bytes'] and a['digest']=='sha256:'+OUTER['sha256'] and
        a['workflow_run']['head_sha']==m['head'],'outer artifact metadata drift')
    blobpath=dest.parent/'manufacture-input.zip'
    with blobpath.open('xb')as f:subprocess.run(['gh','api',f"repos/{REPO}/actions/artifacts/{OUTER['id']}/zip"],stdout=f,check=True)
    require(match_fact(blobpath.read_bytes(),OUTER),'transport ZIP drift')
    with zipfile.ZipFile(blobpath)as z:
        safe(z)
        receipt=read(z,'RETAINED-DELTA-RECEIPT.json',2<<20)
        nested=read(z,'stage15-r3-source-and-retained-web-delta.zip',NEST['bytes'])
        validate_nested(nested,receipt)
    dest.mkdir()
    (dest/'stage15-r3-source-and-retained-web-delta.zip').write_bytes(nested)
    (dest/'RETAINED-DELTA-RECEIPT.json').write_bytes(receipt)
    for f in ('writer.py','PINS.json','safe-push.sh'):(dest/f).write_bytes((HERE/f).read_bytes())
    lock=''.join(sha(f.read_bytes())+'  '+f.name+'\n'for f in sorted(dest.iterdir()))
    (dest/'HANDOFF.SHA256').write_text(lock)
    print(sha(lock.encode()))
def git(root,*v,inp=None,env=None):
    return subprocess.check_output(['git','-C',str(root),*v],input=inp,env=env)
def prepare(root,target):
    pins_ok()
    require(not any(k in os.environ for k in ('GH_TOKEN','GITHUB_TOKEN','STAGE15_WRITE_TOKEN','STAGE15_NETWORK_TOKEN')),
        'prepare must not receive a writer credential')
    data=validate_nested((HERE/'stage15-r3-source-and-retained-web-delta.zip').read_bytes(),
                         (HERE/'RETAINED-DELTA-RECEIPT.json').read_bytes())
    b=git(root,'rev-parse','HEAD').decode().strip()
    require(b==BASE and git(root,'rev-parse',BASE+'^{tree}').decode().strip()==P['baseTree'],'not exact detached base')
    old=git(root,'show',BASE+':'+MAN);require(sha(old)==P['baseManifestSHA'],'wrong base web archive')
    old,new=parse(old),parse(data[MAN])
    oldFiles={r['path']:r for r in old['files']};newFiles={r['path']:r for r in new['files']}
    require(len(oldFiles)==len(newFiles)==809 and
        all(oldFiles[k]==newFiles[k]for k in oldFiles.keys()&newFiles.keys()),'unexpected active immutable drift')
    generated=set(data)-SHELL-set(SRC)
    require(set(newFiles)-set(oldFiles)==generated and all(fact(data[k])=={p:newFiles[k][p]for p in ('bytes','sha256')}for k in generated),
        'configured bundle does not equal exact active additions')
    pub=[g for g in new['publishedGenerations']if g['sourceSha']==BASE]
    require(len(pub)==1 and pub[0]['files']==old['files'] and pub[0]['publishedAt']=='2026-11-20T21:37:21.9122544Z','published base graph not retained')
    require(data['HONRO.html']==data['index.html'] and fact(data['HONRO.html'])=={'bytes':17379,'sha256':'56ebd2c37c63d16e2a24973f8d4971f991cd1658834b589942de1ba673ef1b84'},'actual game shell changed')
    hist={}
    for e in git(root,'ls-tree','-r','-z',BASE).split(b'\0'):
        if not e:continue
        spec,key=e.split(b'\t',1);hist[key.decode()]=spec.decode().split()
    require(all(k not in hist for k in generated),'new content path already exists')
    require(all(hist.get(k,[None])[0]=='100644'for k in set(SRC)|SHELL),'changed path not existing ordinary file')
    git(root,'read-tree',BASE)
    ordered=sorted(data)
    for k in ordered:
        a=git(root,'hash-object','-w','--no-filters','--stdin',inp=data[k]).decode().strip()
        require(a==blob(data[k]),'Git wrote different data',k)
        git(root,'update-index','--add','--cacheinfo','100644,'+a+','+k)
    tree=git(root,'write-tree').decode().strip()
    delta=git(root,'diff-tree','-r','--no-commit-id','--name-status','--no-renames',BASE,tree).decode().splitlines()
    require(set(delta)=={'M\t'+x for x in set(SRC)|SHELL}|{'A\t'+x for x in generated},'unexpected clean tree delta',delta)
    E=dict(os.environ)
    for t in ('AUTHOR','COMMITTER'):
        E.update({f'GIT_{t}_NAME':'github-actions[bot]',f'GIT_{t}_EMAIL':'41898282+github-actions[bot]@users.noreply.github.com',
            f'GIT_{t}_DATE':P['commitDate']})
    h=git(root,'-c','commit.gpgSign=false','commit-tree',tree,'-p',BASE,
        inp=b'Apply verified Act 2 Stage 5 terrain and retain published web assets\n',env=E).decode().strip()
    require(git(root,'show','-s','--format=%P',h).decode().strip()==BASE,'wrong assembly commit parent')
    git(root,'update-ref','--no-deref','HEAD',h,BASE)
    target.write_text(h+'\n')
    print(json.dumps({'commit':h,'tree':tree,'parent':BASE,'exactPaths':ordered,'released':False}))
if __name__=='__main__':
    mode,*a=sys.argv[1:]
    if mode=='verify':verify_and_handoff(Path(a[0]))
    elif mode=='prepare':prepare(Path(a[0]),Path(a[1]))
    elif mode=='pins':pins_ok()
    else:raise SystemExit('no operation')
