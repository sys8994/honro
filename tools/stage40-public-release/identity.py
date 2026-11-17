"""Test-only release identity checks. No browser or network runs at import time."""
import concurrent.futures,hashlib,json,os,re,subprocess,urllib.parse,urllib.request
from pathlib import Path
BASE='https://sys8994.github.io/honro/'
def sha(data):return hashlib.sha256(data).hexdigest()
def safe_path(value):
 assert isinstance(value,str) and value and not value.startswith('/') and '\\' not in value
 assert all(p not in ['.','..',''] for p in value.split('/'))
 assert not urllib.parse.urlsplit(value).scheme and '?' not in value and '#' not in value
 return value
class Identity:
 def __init__(self,out):
  assert os.environ.get('HONRO_PUBLIC_REPLAY_ENABLED')=='1','Public execution not activated'
  self.release=os.environ['HONRO_EXPECTED_RELEASE_SHA'];assert re.fullmatch('[a-f0-9]{40}',self.release)
  self.root=Path(os.environ['HONRO_RELEASE_ROOT']).resolve();self.out=out;self.rows=[]
  assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=self.root,text=True).strip()==self.release
  subprocess.run(['git','diff','--exit-code','HEAD','--','HONRO.html','web'],cwd=self.root,check=True,stdout=subprocess.DEVNULL)
  self.expected={}
  for p in ['HONRO.html','web/manifest.json']:
   data=(self.root/p).read_bytes();self.expected[p]={'sha256':sha(data),'bytes':len(data)}
  manifest=json.loads((self.root/'web/manifest.json').read_bytes());assert manifest['version']==1 and manifest['game']=='HONRO.html'
  assert isinstance(manifest['files'],list) and manifest['files']
  for f in manifest['files']:
   p=safe_path(f['path']);assert re.fullmatch('[a-f0-9]{64}',f['sha256']) and isinstance(f['bytes'],int)
   data=(self.root/p).read_bytes();assert len(data)==f['bytes'] and sha(data)==f['sha256'],p
   assert p not in self.expected,self.expected.get(p);self.expected[p]={'sha256':f['sha256'],'bytes':f['bytes']}
  self.url=BASE+'HONRO.html?release='+self.release
  assert os.environ.get('HONRO_CAPTURE_URL',self.url)==self.url,'Unexpected destination'
  os.environ['HONRO_CAPTURE_URL']=self.url
 def fetch(self,p):
  request=urllib.request.Request(BASE+p+'?verify='+self.release,headers={'Cache-Control':'no-cache'})
  with urllib.request.urlopen(request,timeout=60)as response:
   assert urllib.parse.urlsplit(response.url).scheme=='https' and response.url.startswith(BASE),'Unexpected redirect'
   data=response.read();row={'path':p,'status':response.status,'url':response.url,'sha256':sha(data),'bytes':len(data),'etag':response.headers.get('ETag')}
  assert row['status']==200 and row['sha256']==self.expected[p]['sha256'] and row['bytes']==self.expected[p]['bytes'],row
  return row
 def preflight(self):
  result={'passed':False,'release':self.release,'url':self.url,'scope':'Exact entry/manifest and every current manifest.files resource; retained previous generations are not pre-fetched','expected':self.expected,'resources':self.rows}
  try:
   for p in ['HONRO.html','web/manifest.json']:self.rows.append(self.fetch(p))
   with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:
    for row in pool.map(self.fetch,[p for p in self.expected if p not in ['HONRO.html','web/manifest.json']]):self.rows.append(row)
   result['passed']=True
  finally:(self.out/'release-identity.json').write_text(json.dumps(result,indent=2))
 def attach(self,page):
  self.network=[];self.errors=[];self.console=[];self.failed=[]
  page.on('pageerror',lambda e:self.errors.append(str(e)))
  page.on('console',lambda e:self.console.append({'type':e.type,'text':e.text}) if e.type=='error' else None)
  page.on('requestfailed',lambda r:self.failed.append({'url':r.url,'failure':r.failure}))
  def finished(request):
   row={'url':request.url,'type':request.resource_type};self.network.append(row)
   try:
    response=request.response();assert response is not None
    row['status']=response.status
    if request.url.startswith('data:'):return
    u=urllib.parse.urlsplit(request.url);assert u.scheme=='https' and u.netloc=='sys8994.github.io' and u.path.startswith('/honro/'),'Unexpected origin/path'
    p=safe_path(urllib.parse.unquote(u.path[len('/honro/'):]))
    expected=(self.root/p).read_bytes();body=response.body();row['path']=p;row['bytes']=len(body);row['sha256']=sha(body)
    if response.status==206:
     match=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',response.headers.get('content-range',''));assert match,'Missing content range';start,end,total=map(int,match.groups());assert total==len(expected);expected=expected[start:end+1];row['range']=[start,end,total]
    else:assert response.status==200,'HTTP error'
    row['expectedSha256']=sha(expected);assert body==expected,'Observed body differs from release';row['verified']=True
   except Exception as error:row['error']=str(error)
  page.on('requestfinished',finished)
 def finish(self,page):
  result={'release':self.release,'url':page.url,'browserVersion':page.context.browser.version,'network':self.network,'pageErrors':self.errors,'consoleErrors':self.console,'requestFailures':self.failed,'passed':False}
  try:
   assert self.network and any(r.get('path')=='HONRO.html' and r.get('verified')for r in self.network),'Entry response not verified'
   assert not self.errors and not self.console,'Browser error'
   assert not [r for r in self.network if r.get('error')],'Unverified response'
   # Record normal media cancellations separately; never ignore an HTTP or hash mismatch.
   assert not [r for r in self.failed if r['failure']!='net::ERR_ABORTED'],'Network failure'
   result['passed']=True
  finally:(self.out/'observed-network.json').write_text(json.dumps(result,indent=2))
