"""Only read tracked release trees, validate exact pins, construct disposable single-response overlay."""
import hashlib,json,subprocess,sys
from pathlib import Path
T=Path(__file__).resolve().parent
P=json.loads((T/'PINS.json').read_bytes())
def need(ok,msg):
 if not ok: raise AssertionError(msg)
def pin(v):return {'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()}
def git(root,*a):return subprocess.check_output(['git','-C',str(root),*a],text=True).strip()
def output(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
SPLICES=[
 ('const stage46OpeningSnapshots=new WeakMap;', 'const stage46OpeningSnapshots=new WeakMap,stage46ClosingEntries=new WeakMap;'),
 ('stage46OpeningSnapshots.set(app,openingBattle);try{', 'stage46OpeningSnapshots.set(app,openingBattle);stage46ClosingEntries.set(app.dialogue,openingBattle);try{'),
 ('function save(app){G.HonroStoryStaging?.snapshot(app);','function save(app,closingBattle){G.HonroStoryStaging?.snapshot(app);'),
 ('stage46OpeningSnapshots.get(app)===app.engine.b?G.HonroAct5?.snapshot46Opening?.(app.engine.b)', '(stage46OpeningSnapshots.get(app)===app.engine.b||closingBattle===app.engine.b)?G.HonroAct5?.snapshot46Opening?.(app.engine.b)'),
 ('}save(app);if(d.journeyInterludeId){','}const fastClose=stage46ClosingEntries.get(d)===battle&&app.engine?.b===battle&&d.after==="entry"&&!app.training&&!app.debugMode&&!app.customMap&&!app.done&&!G.HONRO_EMBEDDED;if(fastClose)stage46ClosingEntries.delete(d);save(app,fastClose?battle:undefined);if(d.journeyInterludeId){'),
]
def overlay(raw):
 stock=raw.decode('utf-8'); b=stock
 for a,c in SPLICES:
  need(b.count(a)==1,'exact single stock marker not present: '+a)
  b=b.replace(a,c,1)
 r=b
 for a,c in reversed(SPLICES):
  need(r.count(c)==1,'disposable marker not uniquely reversible')
  r=r.replace(c,a,1)
 need(r.encode()==raw,'nonlocal runtime byte change')
 return b.encode()
def check(root,r):
 need(git(root,'rev-parse','HEAD')==r['head'] and git(root,'rev-parse','HEAD^{tree}')==r['tree'],'unrecognized checked-out authority')
 need(not git(root,'status','--porcelain'),'release worktree is dirty')
 for path,wanted in r['files'].items():need(pin((root/path).read_bytes())==wanted,'unexpected tracked bytes '+path)
 f=json.loads((root/'web/manifest.json').read_bytes())
 book={x['path']:{k:x[k] for k in ('bytes','sha256')} for x in f['files']}
 for path in r['activeRoutes']:need(book.get(path)==r['files'][path],'route not registered as exact active '+path)
 need(f['project']==r['campaign'] and f['gameEntry']==r['entry'],'unexpected boot graph')
 c=json.loads((root/r['campaign']).read_bytes())
 for n in r['stages']:
  st=r['stages'][n];i=int(n)-1
  need([c['stages'][i],c['stageLibraries'][i]]==[st['map'],st['packet']], 'unexpected active stage route '+n)
  if st.get('parts'):
   meta=json.loads((root/st['packet']).read_bytes())
   need([z['path'] for z in meta['parts']]==st['parts'],'unexpected signed parts order')
   joined=b''.join((root/x).read_bytes() for x in st['parts'])
   need(pin(joined)=={'bytes':meta['bytes'],'sha256':meta['sha256']},'unexpected joined packet')
 return book
if __name__=='__main__':
 current,historical,out=map(Path,sys.argv[1:]);out.mkdir(exist_ok=True)
 need(P['enabled'] is True,'disabled until separately reviewed')
 r=P['current'];h=P['historical'];rc=check(current,r);rh=check(historical,h)
 for x,k in r['sources'].items():need(git(current,'hash-object',x)==k,'wrong source authority: '+x)
 need(P['module'] in json.loads((current/'web/manifest.json').read_bytes())['gameOnly'],'module not actual game executable')
 if r['files'][r['stages']['46']['packet']]!=P['previousPhaseDescriptor']:raise AssertionError('not exact earlier B descriptor')
 m=(current/P['module']).read_bytes(); q=overlay(m)
 need(pin(q)==P['overlay'],'unpinned candidate QA byte delta')
 (out.parent/'one-temporary-module.js').write_bytes(q)
 output(out/'AUTHORITY.json',{'status':'PINNED_RELEASE_AND_REVERSIBLE_SINGLE_RESPONSE_ONLY','current':r['head'],'historical':h['head'],
  'stockModule':pin(m),'overlay':pin(q),'splices':len(SPLICES),'currentRouteCount':len(rc),'historicalRouteCount':len(rh),'repoProductWrites':0})
