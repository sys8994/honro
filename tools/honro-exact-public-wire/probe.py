"""Observe existing exact public assets, with no authentication or changes."""
import hashlib,json,os,pathlib,re,subprocess,tempfile
HEAD='72dd73e03f7d07c1b87d3e1e71a62d187a371e6a'
BASE='https://sys8994.github.io/honro/'
assert os.environ.get('GITHUB_REPOSITORY')=='sys8994/honro'
assert os.environ.get('GITHUB_REF')=='refs/heads/qa/measure-40-46-public-wire-72dd'
rc=json.loads(pathlib.Path(__file__).with_name('EXACT-PACKET-COMPRESS-V1.json').read_text())['facts']
def measure(root,path,expected,n,mode):
 assert path=='web/manifest.json' or re.fullmatch(r'web/data/chapter-(40|46)-assets-part-\d{3}\.[a-f0-9]{16}\.bin',path)
 body=root/'body';heads=root/'heads';u=BASE+path
 args=['curl','--silent','--show-error','--fail','--proto','=https','--connect-timeout','12','--max-time','65','--dump-header',str(heads),'--output',str(body),'--write-out','%{json}']
 args+=['--compressed'] if mode=='curlAccept' else ['--header','Accept-Encoding: identity']
 run=subprocess.run([*args,u],text=True,capture_output=True,check=True)
 a=json.loads(run.stdout);raw=body.read_bytes();real=hashlib.sha256(raw).hexdigest()
 assert a['response_code']==200 and a['url_effective']==u and a['num_redirects']==0 and len(raw)==n and real==expected,(path,len(raw),real)
 f={}
 for line in heads.read_text().splitlines():
  k,sep,v=line.partition(':')
  if sep and k.lower() in ('content-encoding','content-type','content-length','vary','age','etag','x-cache'):f[k.lower()]=v.strip()
 return {'path':path,'mode':mode,'wireBodyBytes':int(a['size_download']),'exactDecodedBytes':len(raw),'decodedSHA256':real,'headers':f}
out=pathlib.Path('out');out.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory() as d:
 root=pathlib.Path(d)
 m=('web/manifest.json','6b2160affabe1f8474948d5556e052c3a68d8f7f460aed894600dc347821cc4c',8335506,'identity')
 start=measure(root,*m)
 rows={n:[{'optionalGzip':c['gzip9'], 'accepted':measure(root,c['path'],c['sha'],c['size'],'curlAccept')} for c in v['checks']]for n,v in rc.items()}
 end=measure(root,*m)
 result={'scope':'public Pages anonymous curl --compressed negotiation, with exact decompressed bytes. Not device speed or candidate deployment.','head':HEAD,'manifestBefore':start,'manifestAfter':end,'stages':rows}
 (out/'PUBLIC-WIRE.json').write_text(json.dumps(result,indent=2)+'\n')
 for k,vs in rows.items():
  print(k,sum(q['accepted']['wireBodyBytes'] for q in vs),sum(q['optionalGzip'] for q in vs),[q['accepted']['headers'].get('content-encoding','identity') for q in vs])
