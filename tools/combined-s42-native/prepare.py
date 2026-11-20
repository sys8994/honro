"""Strict local source preflight; optionally install into two detached, clean git worktrees."""
import argparse, hashlib, json, os, subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent
def require(c,*msg):
    if not c: raise SystemExit(f'HOLD: {msg}')
def blob(b):
    return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def pinned(doc,path):
    want=doc[path]
    def verify(b): require(blob(b)==want,path,want,blob(b));return b
    return verify
def git(p,*cmd):
    return subprocess.check_output(['git','-C',str(p),*cmd]).decode().strip()
def parse_status_paths(raw):
    # Git porcelain v1 -z is bytes: XY + ASCII space + literal path + NUL.
    # A prepared worktree permits only unstaged modification or a new untracked path.
    # Reject staged, conflicts, ignored, deletes, typechange, and two-path rename/copy records.
    if raw == b"": return set()
    require(raw.endswith(b"\0"),"unterminated Git status")
    records=raw[:-1].split(b"\0")
    paths=set()
    for rec in records:
        require(len(rec)>3 and rec[:3] in (b" M ",b"?? "),"unsupported Git status record",rec[:3])
        path=os.fsdecode(rec[3:])
        require(path not in paths,"duplicate Git status path",path)
        paths.add(path)
    require(len(paths)==len(records),"Git status cardinality")
    return paths
def require_exact_status(p,expected,*scope):
    raw=subprocess.check_output(["git","-C",str(p),"status","--porcelain=v1","-z","--untracked-files=all",*(("--",*scope) if scope else ())])
    paths=parse_status_paths(raw)
    require(len(paths)==len(expected) and paths==set(expected),p,"unexpected source delta",sorted(paths),"expected",sorted(expected))
def read(p,n): return (p/n).read_bytes()
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--baseline-pins',type=Path,help='separately reviewed complete addendum for an exact new Act1 base')
    ap.add_argument('--trees',nargs=3,type=Path,metavar=('A','B','C'))
    args=ap.parse_args()
    pins=json.loads(read(HERE,'PINS.json'))
    if args.baseline_pins:
        alt=json.loads(args.baseline_pins.read_bytes())
        require(set(alt)=={'base','tree','parent','renderer'},'new base may repin only commit/tree/parent/renderer; changed prerequisites need separate review')
        for k,v in alt.items():
            require(isinstance(v,str) and len(v)==40 and all(c in '0123456789abcdef' for c in v),k,v)
        pins.update(alt)
    fixed=json.loads(read(HERE,'PINS.json'))
    D=pins['baselineDependencies']; expected=pins['stage42ChangedPaths']
    F=HERE/'fixture'
    renderer='shared/runtime/renderer.js'
    edge='shared/runtime/act5-edge-art.js'
    body='shared/assets/environment/act5/stage42-registered-body.json'
    for path in D:
        if path!=edge:pinned(D,path)(read(F,path))
    pinned({renderer:fixed['renderer']},renderer)(read(F,renderer))
    for path in expected:pinned(expected,path)(read(F,path))
    approved=pinned({body:pins['approved42']},body)(read(HERE,'approved42.json'))
    h=json.loads(read(HERE,'STAGE42-BOUNDS-HUNK.json'))
    old,new=h['replaceExactlyOnce'].encode(),h['with'].encode()
    target=read(F,edge)
    require(target.count(new)==1,'single Stage42 hunk in target')
    source=target.replace(new,old)
    pinned(D,edge)(source)
    require(source.count(old)==1 and new not in source,'single Stage42 hunk in baseline')
    result={'mode':'sparse source preflight, no build/App','base':pins['base'],
      'tree':pins['tree'],'rendererToUseFromBaseline':pins['renderer'],'baselineEdge':blob(source),
      'derivedEdge':blob(target),'approved':blob(approved),'optimized':expected[body],'changedPaths':expected}
    if args.trees:
        A,B,C=[p.resolve() for p in args.trees]
        require(len({A,B,C})==3,'three distinct worktrees')
        for p in (A,B,C):
            require(git(p,'rev-parse','--show-toplevel')==str(p),p,'not checkout root')
            require(git(p,'branch','--show-current')=='',p,'requires detached disposable worktrees')
            require(git(p,'rev-parse','HEAD')==pins['base'],p,'wrong exact base')
            require(git(p,'rev-parse','HEAD^{tree}')==pins['tree'],p,'wrong tree')
            require(git(p,'show','-s','--format=%P','HEAD')==pins['parent'],p,'wrong ordered parent')
            require_exact_status(p,set())
            pinned({renderer:pins['renderer']},renderer)(read(p,renderer))
            for path in D:pinned(D,path)(read(p,path))
        for p,want_body in [(B,approved),(C,read(F,body))]:
            for path in expected:
                d=want_body if path==body else read(F,path)
                f=p/path
                require(not f.is_symlink(),path,'refuse symlink')
                f.write_bytes(d)
            require_exact_status(p,expected)
            for path in expected:
                require(blob(read(p,path))==(blob(want_body) if path==body else expected[path]),p,path)
        require([path for path in expected if read(B,path)!=read(C,path)]==[body],'B/C asset only')
        result['mode']='A immutable, B/C prepared exactly; build/App not executed'
    else:
        require(not args.baseline_pins,'new baseline must be hash-verified in actual detached trees')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
