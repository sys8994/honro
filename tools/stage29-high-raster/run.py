"""Preflight signed normal-build evidence, then one local high-raster PC pair; no build."""
from guard import BASE,MAN0,MF,NEW,OLD,ROOT,SRC,SHELL,blob,custody,fact,sha,save
from pathlib import Path,PurePosixPath
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import argparse,io,json,os,re,subprocess,sys,threading,urllib.parse,zipfile
HERE=Path(__file__).resolve().parent
MODE='PASS_PENDING_ART'
INNER='B-generated-pass-pending-art/B-PASS-PENDING-ART-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip'
SEAL='B-generated-pass-pending-art/SEAL.json'
DEVICE='1440x900'
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=30).decode().strip()
def jsonf(p):return json.loads(Path(p).read_bytes())
def pin(f,m):
 assert fact(f)==m
 return f
def relative(n):
 p=PurePosixPath(n)
 assert p.as_posix()==n and n and not p.is_absolute() and all(x not in ('.','..') for x in p.parts)
 return n
def verify_archive(pins,raw):
 h=pins['official']
 assert pins['enabled'] is True and pins['visualApproved'] is True
 assert pins['base']==BASE and h['conclusion']=='success' and h['head']!=BASE
 assert re.fullmatch('[a-f0-9]{40}',h['head'])and re.fullmatch('[a-f0-9]{40}',h['tree'])
 assert h['branch']=='qa/stage29-west-normal-small-31537b'
 assert all(type(h[k])is int and h[k]>0 for k in ('run','job','artifact'))
 assert fact(raw)==h['artifactOuter']
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  assert z.testzip() is None and len(set(z.namelist()))==len(z.namelist())
  art,proof,graph,seal=(json.loads(pin(z.read(n),pins['receipts'][n]))for n in ('SOURCE.json','BROWSER.json','GRAPH.json',SEAL))
  assert art['base']==graph['base']==seal['base']==BASE and art['head']==h['head'] and art['candidate']['git']==NEW
  assert graph['identical50MapsPacketsGraphics'] is True and graph['onlySingleCompiledModuleCodeChanged'] is True
  assert proof['browser']=='151.0.7922.34' and proof['source']==BASE and custody(proof)==MODE
  assert seal['custody']==MODE and seal['technicalPixelGatePassed'] is True and seal['canDeploy'] is False and seal['authorPath']==SRC and seal['authorGit']==NEW
  assert seal['actual']==pins['receipts']['BROWSER.json'] and seal['graph']==pins['receipts']['GRAPH.json']
  bib=pin(z.read(INNER),seal['zip'])
  for v in proof['visits']:
   for p in v['frames'].values():
    for k in ('raw','dom'):pin(z.read(relative(p[k]['path'])),p[k]['fact'])
 expected=set(graph['aliases'].values())|SHELL|{MF}
 assert len(expected)==8 and set(seal['files'])==expected
 for n in expected:relative(n)
 with zipfile.ZipFile(io.BytesIO(bib))as z:
  assert z.testzip() is None and len(z.namelist())==8 and set(z.namelist())==expected
  entries={}
  for n in sorted(expected):
   body=pin(z.read(n),graph['activeB'][n])
   assert {**fact(body),'git':blob(body)}==seal['files'][n]
   entries[n]=body
 # Reuse original full graph attestation. Only stock files with the same active digest may be read in B;
 # B's four compiled aliases, three shells and manifest come from the sealed candidate ZIP unchanged.
 a,b=graph['activeA'],graph['activeB']
 assert b.keys()-a.keys()==set(graph['aliases'].values()) and all(a.get(n)==b[n]for n in b.keys()-expected)
 return graph,entries
def authority(args):
 pins=jsonf(args.authority)
 assert pins['enabled'] is True and pins['visualApproved'] is True
 graph,entries=verify_archive(pins,args.zip.read_bytes())
 b0=args.base.resolve()
 assert git(b0,'rev-parse','HEAD')==BASE
 assert fact((b0/MF).read_bytes())==MAN0 and blob((b0/SRC).read_bytes())==OLD
 for arm,x in [('A',graph['activeA']),('B',graph['activeB'])]:
  req=set(graph['stage29Required'])|{'HONRO.html',graph['currentProject'][arm],graph['gameEntry'][arm],graph['runtime'][arm]}
  assert req<=x.keys()
  for n in req:pin(entries[n] if arm=='B' and n in entries else (b0/relative(n)).read_bytes(),x[n])
 return b0,graph,entries,pins
def server(port,root,known,entries,logs):
 media={f'assets/bgm/{n}.mp3'for n in ('main','battle-1','battle-2','battle-3','battle-4')}
 class S(SimpleHTTPRequestHandler):
  def do_GET(self):
   u=self.path
   if not u.startswith('/') or '?' in u or '#' in u or '%' in u:return self.send_error(404)
   n=u[1:]
   if n in entries:
    b=entries[n];self.send_response(200);self.send_header('Content-Type',self.guess_type(n));self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b);return
   if n not in known and n not in media:return self.send_error(404)
   q=(root/relative(n)).resolve()
   assert q.is_relative_to(root) and q.is_file()
   if n in known:pin(q.read_bytes(),known[n])
   return super().do_GET()
  def log_message(self,fmt,*t):print((fmt%t),file=logs,flush=True)
 def maker(*a,**k):return S(*a,directory=str(root),**k)
 return ThreadingHTTPServer(('127.0.0.1',port),maker)
def main():
 p=argparse.ArgumentParser()
 for k in ('authority','base','zip','work'):p.add_argument('--'+k,required=True,type=Path)
 p.add_argument('--preflight-only',action='store_true');x=p.parse_args()
 r,g,overlay,pins=authority(x)
 if x.preflight_only:
  print('Exact QA PASS and selected active A/B bytes; no build or browser');return
 w=x.work.resolve();w.mkdir(exist_ok=False);o=w/'out';o.mkdir()
 save(o/'GRAPH.json',g);save(o/'SUFFIX-INPUT.json',{'authority':pins,'noBuild':True,'borrowedBase':BASE,'sealedBytes':{n:fact(v)for n,v in overlay.items()}})
 with (o/'http-A.log').open('x')as fa,(o/'http-B.log').open('x')as fb:
  with server(18891,r,g['activeA'],{},fa)as a,server(18892,r,g['activeB'],overlay,fb)as b:
   for t in (a,b):threading.Thread(target=t.serve_forever,daemon=True).start()
   try:subprocess.run([sys.executable,str(HERE/'capture.py'),str(w)],check=True,timeout=660,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
   finally:
    for t in (a,b):t.shutdown()
if __name__=='__main__':main()
