"""Read only. Validate normal Act1 C generated archive and optional retained assembly."""
from __future__ import annotations
import argparse,hashlib,json,re,subprocess,tarfile
from pathlib import Path,PurePosixPath
H=Path(__file__).resolve().parent
P=json.loads((H/'RELEASE-PINS.json').read_bytes())
RELEASE=('HONRO.html','HONRO_WORKSHOP.html','index.html','workshop/HONRO_MAP_WORKSHOP.html')
MANIFEST='web/manifest.json'
RETAIN_KEYS={'publishedRetention','publishedGenerations','previousFiles','previousGenerations'}
IMM=re.compile(r'^web/(?:runtime|entries|data|styles|graphics|fonts)/[\w.-]+\.[a-f0-9]{16}\.[\w]+$',re.ASCII)
def require(ok,*why):
    if not ok:raise SystemExit(f'HOLD: {why}')
def sha(b):return hashlib.sha256(b).hexdigest()
def streamsha(f):
    h=hashlib.sha256()
    for b in iter(lambda:f.read(1<<20),b''):h.update(b)
    return h.hexdigest()
def j(b):
    def unique(pairs):
        d={}
        for k,v in pairs:require(k not in d,'malformed duplicate JSON key',k);d[k]=v
        return d
    return json.loads(b,object_pairs_hook=unique)
def stamp_bytes(b):return {'sha256':sha(b),'bytes':len(b)}
def stamp_file(p):
    require(p.is_file() and not p.is_symlink(),'not a regular assembled file',str(p))
    with p.open('rb') as f:return {'sha256':streamsha(f),'bytes':p.stat().st_size}
def git(root,*a):return subprocess.check_output(['git','-C',str(root),*a])
def blob(root,ref,path):return git(root,'rev-parse',ref+':'+path).decode().strip()
def compact(o):return json.dumps(o,separators=(',',':'),ensure_ascii=False).encode()
def graph(rows):return sha(compact([[r['path'],r['sha256'],r['bytes']] for r in sorted(rows,key=lambda r:r['path'])]))
def file_rows(groups):
    out={}
    for rs in groups:
        for r in rs:
            p=r['path'];row={'sha256':r['sha256'],'bytes':r['bytes']}
            require(IMM.fullmatch(p) and type(row['bytes']) is int and row['bytes']>=0 and re.fullmatch('[a-f0-9]{64}',row['sha256']) and p.split('.')[-2]==row['sha256'][:16],'bad immutable manifest row',p)
            require(p not in out or out[p]==row,'immutable path collision',p)
            out[p]=row
    return out
def groups(m):
    return [m['files'],m.get('previousFiles',[]),*m.get('previousGenerations',[]),*(x['files'] for x in m.get('publishedGenerations',[]))]
def git_scope(root):
    b=P['live']['commit']; c=P['sourceCandidate']
    require(git(root,'rev-parse',c+'^{tree}').decode().strip()==P['candidateTree'],'candidate tree')
    require(git(root,'show','-s','--format=%P',c).decode().strip()==P['sourceParent'],'candidate source parent')
    require(git(root,'merge-base',b,c).decode().strip()==b,'candidate no longer relates to attested live base')
    paths=git(root,'diff','--name-only','--no-renames','-z',b,c).split(b'\0')[:-1]
    require(len(paths)==len(P['sourceFiles']) and set(x.decode() for x in paths)==set(P['sourceFiles']),'candidate product-only source scope')
    for name,expected in P['sourceFiles'].items(): require(blob(root,c,name)==expected,'source blob',name)
    require(blob(root,b,MANIFEST)==P['live']['manifestGitBlob'],'wrong attested source manifest')
    require(blob(root,b,'HONRO.html')==P['live']['htmlGitBlob'],'wrong attested entry')
    for name,k in (('tools/release/retain-published-web.mjs','existingRetainerGitBlob'),('shared/web-retention.mjs','retentionModuleGitBlob')):
        require(blob(root,c,name)==blob(root,b,name)==P['live'][k],'existing standard retention source changed',name)
    return j(git(root,'show',b+':'+MANIFEST))
def qa_evidence(out):
    """Gate the real successful browser receipt, not arbitrary unpacked PNGs."""
    report=j((out/'ACT1-FINAL-C.json').read_bytes())
    require(len(report)==84 and len({(x['stage'],x['view'],x['width']) for x in report})==84 and all(x['pass'] and x['detail']['noErrors'] for x in report),'not 84 actual final-C valid controls')
    g=j((out/'C-GRAPH.json').read_bytes())
    require(g['source']==P['sourceCandidate'] and g['htmlSHA256']==P['currentGameHTMLSHA256'],'wrong 84-view generated source')
    d={k:v for k,v in g['all'].items() if k.startswith('web/')}
    require(sha(json.dumps(d,sort_keys=True,separators=(',',':')).encode())==P['activeGameGraphSHA256'],'active browser graph does not match successful Stage42 proof')
    return g
def read_tar(p,expected):
    with p.open('rb') as f:require(streamsha(f)==expected,'generated archive transfer hash')
    stamp={};docs={};seen=set();gitBlobs={};total=0
    with tarfile.open(p,'r|gz') as t:
        for m in t:
            n=m.name;q=PurePosixPath(n)
            require(n==q.as_posix() and not q.is_absolute() and '..' not in q.parts and n not in seen,'unsafe/duplicate archive path',n)
            seen.add(n)
            if m.isdir():
                require(n=='web' or n.startswith('web/'),'unexpected archive directory',n);continue
            require(m.isfile() and not m.issym() and not m.islnk() and (n in (*RELEASE,MANIFEST) or IMM.fullmatch(n)),'unsafe/unexpected archive member',n)
            total+=m.size;require(total<=1_500_000_000,'archive expanded beyond audit ceiling')
            f=t.extractfile(m);assert f
            if n==MANIFEST:
                require(m.size<=16*1024*1024,'manifest unusually large')
                raw=f.read();docs[n]=raw;stamp[n]=stamp_bytes(raw)
            else:
                h=hashlib.sha256();g=hashlib.sha1(f'blob {m.size}\0'.encode())
                for b in iter(lambda:f.read(1<<20),b''):h.update(b);g.update(b)
                stamp[n]={'sha256':h.hexdigest(),'bytes':m.size};gitBlobs[n]=g.hexdigest()
    require(set((*RELEASE,MANIFEST))<=set(stamp),'incomplete normal-generated shells')
    return stamp,docs[MANIFEST],gitBlobs
def inherited_blobs(root,ref):
    out={}
    for row in git(root,'ls-tree','-r','-z',ref,'--','web').split(b'\0'):
        if not row:continue
        fields,p=row.split(b'\t',1)
        mode,kind,id=fields.split()
        if mode==b'100644' and kind==b'blob':out[p.decode()]=id.decode()
    return out
def normal(tar,sha_z,ret_receipt,proof,repo):
    stamp,raw,gitBlobs=read_tar(tar,sha_z);m=j(raw);rows=file_rows(groups(m))
    require(m['gameEntry']==P['currentGameEntry'] and m['project']==P['currentCampaignEntry'],'candidate entry/manifest drift')
    require(stamp['HONRO.html']['sha256']==P['currentGameHTMLSHA256'],'candidate HTML drift')
    require(P['currentStage42Packet'] in {e['path'] for e in m['files']},'candidate lost Stage42 packet')
    require(sha(raw)==ret_receipt['manifestSHA256'] and graph(m['files'])==ret_receipt['graphSHA256'],'wrong normal-generated tar vs official receipt')
    require({r:stamp[r]['sha256'] for r in RELEASE}==ret_receipt['shells'],'normal generation shell mismatch')
    for p,v in rows.items(): require(stamp.get(p)==v,'ordinary generated path bytes',p)
    for p,v in proof['all'].items():
        if p.startswith('web/'):require(stamp.get(p)==v,'actual active graph file not in normal QA archive',p)
    extras=set(stamp)-set(rows)-{*RELEASE,MANIFEST}
    # Normal build does not sweep every tracked intermediate asset present in the worktree.
    # An archive-only, non-current asset is legal only if its exact bytes were already tracked.
    existing=inherited_blobs(repo,P['sourceCandidate'])
    for p in sorted(extras):
        require(IMM.fullmatch(p),'unbound path outside generated asset space',p)
        require(p in existing and gitBlobs[p]==existing[p],'new or changed unbound generation file',p)
    return stamp,m,len(extras)
def staged(root,before_stamp,before,live):
    require(git(root,'rev-parse','HEAD').decode().strip()==P['sourceCandidate'],'assembly must be based on exact product candidate')
    raw=(root/MANIFEST).read_bytes();after=j(raw)
    require({k:v for k,v in before.items() if k not in RETAIN_KEYS}=={k:v for k,v in after.items() if k not in RETAIN_KEYS},
            'not retention-only metadata; active files/roles must be byte-proven unchanged')
    for p,v in before_stamp.items():
        if p!=MANIFEST:require(stamp_file(root/p)==v,'normal generated shell/asset changed',p)
    pubs=[g for g in after.get('publishedGenerations',[]) if g['sourceSha']==P['live']['commit']]
    require(len(pubs)==1,'missing unique currently attested master graph')
    g=pubs[0]
    require(g['publishedAt']==P['live']['publishedAt'] and g['publishedAtPrecision']=='instant' and g['evidence']==f"https://github.com/sys8994/honro/actions/runs/{P['live']['run']}" and g['files']==live['files'] and g['graphSha256']==graph(live['files']),
            'not the actual attested currently deployed graph')
    after_rows=file_rows(groups(after))
    for p,v in after_rows.items():require(stamp_file(root/p)==v,'retained/active asset bytes',p)
    live_old=file_rows(groups(live))
    extra=set(after_rows)-set(before_stamp)
    require(all(p in live_old and after_rows[p]==live_old[p] for p in extra),'retention introduced unproven new path')
    changed={p.decode() for p in (git(root,'diff','--name-only','--no-renames','-z','HEAD','--')+git(root,'ls-files','--others','--exclude-standard','-z')).split(b'\0') if p}
    require(changed<=(set(before_stamp)|extra),'non-generation paths altered',sorted(changed-set(before_stamp)-extra))
    return {'assembledWebManifestSHA256':sha(raw),'activeGraphUnchanged':True,'activeGraphSHA256':graph(after['files']),
            'verifiedNewRetentions':len(extra),'assemblyChangedCount':len(changed),'changed':sorted(changed)}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--repo',type=Path,required=True)
    ap.add_argument('--app-receipt-dir',type=Path,required=True,help='actual ACT1-FINAL-C and C-GRAPH in same dir')
    ap.add_argument('--tar',type=Path,required=True);ap.add_argument('--tar-sha256',required=True)
    ap.add_argument('--retention-receipt',type=Path,required=True)
    ap.add_argument('--assembly',type=Path,help='optional disposable prepublication tree after existing retention tool')
    a=ap.parse_args()
    live=git_scope(a.repo);proof=qa_evidence(a.app_receipt_dir)
    before_stub,before,inherited=normal(a.tar,a.tar_sha256,j(a.retention_receipt.read_bytes()),proof,a.repo)
    rec={'source':P['sourceCandidate'],'priorAttestedLive':P['live']['commit'],'browserCases':84,
         'originalNormalTarSHA256':a.tar_sha256,'normalActiveGraphSHA256':graph(before['files']),
         'prepublicationArtifactsValidated':True,'inheritedUnboundUnchanged':inherited,'published':False}
    if a.assembly:rec.update(staged(a.assembly,before_stub,before,live))
    print(json.dumps(rec,indent=2))
if __name__=='__main__':main()
