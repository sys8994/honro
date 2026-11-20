"""Final C only: hash every active asset graph file against successful integrated C."""
from pathlib import Path
from subprocess import check_output
import argparse,json,hashlib,re,posixpath
from dag import references,sha
H=Path(__file__).resolve().parent
P=json.loads((H/'pins.json').read_bytes())
def require(y,*t):
 if not y:raise AssertionError(t)
def git(root,*cmd):return check_output(['git','-C',str(root),*cmd])
def source(root,scope=True):
 head=git(root,'rev-parse','HEAD').decode().strip();assert head==P['candidate']
 assert git(root,'rev-parse','HEAD^{tree}').decode().strip()==P['tree']
 assert git(root,'show','-s','--format=%P','HEAD').decode().strip()==P['parent']
 rows=git(root,'diff','--name-status','--no-renames','-z',P['parent'],head).split(b'\0')
 assert rows[-1]==b'' and len(rows)==9 and set(rows[:-1:2])<={b'M',b'A'}
 assert set(x.decode() for x in rows[1:-1:2])==set(P['source'])
 pins=P['source']|{'shared/runtime/renderer.js':P['renderer']}
 for name,h in pins.items():
  b=(root/name).read_bytes(); assert hashlib.sha1(('blob '+str(len(b))+'\0').encode()+b).hexdigest()==h,name
 if scope:assert git(root,'status','--porcelain=v1','-z','--untracked-files=all')==b''
def digest(d):return sha(json.dumps(d,sort_keys=True,separators=(',',':')).encode())
def build(root,out):
 source(root,False)
 d=references(root); capsule=d['referenceDocument']
 allRows={p:{k:v[k] for k in ('sha256','bytes')}for p,v in d['reachable'].items()}
 assert d['htmlSHA256']==P['htmlSHA256'] and d['entry']['path']==P['roles']['entry'] and d['campaign']['path']==P['roles']['manifest']
 assert len(allRows)==P['coreDAGEntries'] and digest(allRows)==P['coreDAGSHA256'],'actual active C graph differs from deployed candidate verified lineage'
 for p in [P['roles']['loader'],P['roles']['packet']]:assert p in allRows
 for v in P['compiled']:assert v['path'] in allRows and allRows[v['path']]=={k:v[k] for k in ('sha256','bytes')}
 actual={str(i+1):{'stage':p,'assets':capsule['stageLibraries'][i]} for i,p in enumerate(capsule['stages'])}
 assert actual==P['leaves']
 f=list(P['fontAuthority'].values())[0]['ownerCSS'];catalog=json.loads((root/'web/manifest.json').read_bytes())
 assert catalog['styles'].count(f)==1 and f in allRows
 def stamp(p,w):
  b=(root/p).read_bytes();expect={k:w[k]for k in ('bytes','sha256')}
  assert {'sha256':sha(b),'bytes':len(b)}==expect
  return expect
 css=(root/f).read_text();refs={posixpath.normpath(posixpath.join(posixpath.dirname(f),x)) for x in re.findall(r'url\("(\.\./fonts/[a-z0-9-]+\.[a-f0-9]{16}\.woff2)"\)',css)}
 assert set(P['fontAuthority'])<=refs and len(refs)==206
 for p,w in P['fontAuthority'].items():
  assert w['ownerCSS']==f
  assert [r for r in catalog['files'] if r['path']==p]==[{'path':p,'bytes':w['bytes'],'sha256':w['sha256']}]
  allRows[p]=stamp(p,w)
 assert len(allRows)==P['allRows'] and digest(allRows)==P['extensionDAGSHA256']
 for p,w in P['staticAudio'].items():allRows[p]=stamp(p,dict(bytes=w[0],sha256=w[1]))
 out.write_text(json.dumps({'all':allRows,'roles':P['roles'],'leaves':actual,'htmlSHA256':d['htmlSHA256'],'source':P['candidate'],'compiled':P['compiled']},indent=2)+'\n')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('phase',choices=('source','built'));p.add_argument('root',type=Path);p.add_argument('out',type=Path,nargs='?');a=p.parse_args()
 if a.phase=='source': source(a.root)
 else: assert a.out;build(a.root,a.out)
