"""One detached ordinary df621 Stage42/C2 build, no publication, source/graph custody only."""
from pathlib import Path
import hashlib,json,os,re,stat,subprocess,sys,zipfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes())
R=Path(os.environ.get('GITHUB_WORKSPACE',Path.cwd())).resolve();B=P['base']['head'];M='web/manifest.json'
WF='.github/workflows/stage40-df621-c2-public-readback.yml'
TOOL='tools/stage40-c2-public/'
SHELLS={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
def need(x,m):
    if not x:raise RuntimeError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def git(q,*args):return subprocess.check_output(['git','-C',str(q),*args],text=True,timeout=150).strip()
def dump(p,v):p.write_text(json.dumps(v,indent=2)+'\n')
def read(p,k):
    q=p/k;need(q.resolve()==q and q.is_file() and stat.S_ISREG(q.lstat().st_mode),'bad exact path '+k)
    return q.read_bytes()
def idx(m):
    r={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
    need(len(r)==len(m['files']) and all(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k,re.ASCII)for k in r),'invalid graph path')
    return r
def enabled():
    need(P['enabled'] is True and os.getenv('GITHUB_REPOSITORY')=='sys8994/honro' and os.getenv('GITHUB_REF')=='refs/heads/'+P['branch'] and sha(read(D,'observer.json'))==P['observerSha256'],'disabled: exact scoped ref only')
