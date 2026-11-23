"""Native f6/a6/render-only candidate, no publication or rewrites of known stock."""
import contextlib,json,os,sys,hashlib,re,subprocess
from pathlib import Path
from PIL import Image
from io import BytesIO
from readback import P,D,O,ob,require,git,closure,collect,server,sha
from continue_probe import run_continue
M='web/manifest.json'
S='shared/runtime/act5-edge-art.js'
WF='.github/workflows/stage44-a6-render-suppression.yml'
TOOL='tools/stage44-a6-render-suppression/'
TOOLS={'PINS.json','candidate.py','graph.mjs','readback.py','observe-under.js','observer.json','continue_probe.py'}
def put(f,data):f.write_text(json.dumps(data,indent=2)+'\n')
def gates():
 require(P['enabled'] is True and os.getenv('GITHUB_REF')==P['qaRef'] and os.getenv('GITHUB_REPOSITORY')=='sys8994/honro','disabled: approved QA branch only')
 require(sha(ob)==P['observerSHA256'],'wrong original observer')
def pre(w,qa):
 b=P['arms']['B'];c=P['candidate'];s=c['source']['act5-edge-art.js']
 require(all(isinstance(x,str) and re.fullmatch(r'[0-9a-f]{40}',x) for x in (c['head'],c['tree'],s['stock'],s['candidate'])),'exact C Git pins unfilled')
 require(set(c['source'])=={'act5-edge-art.js'} and s['path']==S and s['stock']!=s['candidate'],'only signed renderer source may differ')
 require(not git(qa,'status','--porcelain','--untracked-files=all') and git(qa,'rev-parse','HEAD')==os.environ['GITHUB_SHA'],'unbound QA carrier checkout')
 require(git(qa,'show','-s','--format=%P','HEAD')==b['head'] and git(qa,'rev-parse',b['head']+'^{tree}')==b['tree'],'wrong QA carrier parent')
 require(set(git(qa,'diff','--name-status','--no-renames',b['head'],'HEAD').splitlines())=={'A\t'+r for r in {WF,*(TOOL+x for x in TOOLS)}},'non-exact add-only QA carrier')
 require(not git(w/'C','status','--porcelain','--untracked-files=all') and git(w/'C','rev-parse','HEAD')==c['head'] and git(w/'C','rev-parse','HEAD^{tree}')==c['tree'],'wrong candidate checkout')
 require(git(w/'C','show','-s','--format=%P','HEAD')==b['head'],'candidate must be exact a6 child')
 expected={'M\t'+S};t=c['test']
 if t is not None:
  require(t['path']=='tests/stage44-under-visual-recovery.mjs' and isinstance(t['git'],str) and git(w/'C','rev-parse','HEAD:'+t['path'])==t['git'],'wrong optional signed test')
  expected.add('A\t'+t['path'])
 require(set(git(w/'C','diff','--name-status','--no-renames',b['head'],'HEAD').splitlines())==expected,'unauthorized candidate diff')
 require(git(w/'B','rev-parse','HEAD:'+S)==s['stock'] and git(w/'C','rev-parse','HEAD:'+S)==s['candidate'],'wrong exact renderer Git blobs')
 for arm in ('A','B'):closure(arm,w/arm)
 locks=['package.json','package-lock.json','game/package.json','game/package-lock.json']
 require(all((w/'B'/f).read_bytes()==(w/'C'/f).read_bytes() for f in locks),'package inputs differing from exact a6')
 for f in (r for r in locks if r.endswith('lock.json')):
  lock=json.loads((w/'C'/f).read_bytes())
  require(lock['lockfileVersion']==3 and all(not k or k.startswith('node_modules/') and not v.get('link') and re.fullmatch(r'https://registry\.npmjs\.org/[^?#]+\.tgz',v.get('resolved','')) and re.fullmatch(r'sha512-[A-Za-z0-9+/]+={0,2}',v.get('integrity','')) for k,v in lock['packages'].items()),'invalid locked npm source')
 put(w/'out'/'SOURCE.json',{'status':'EXACT_PINNED_A6_CHILD','source':c,'old':P['arms']['A']['head'],'base':b['head'],'deploy':False})
def file(root,rel):return root.joinpath(rel).read_bytes()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def graph(w):
 b,c=w/'B',w/'C';bp=P['arms']['B'];target=P['candidate'];refs=P['arms']['B']['files']
 require(git(c,'rev-parse','HEAD')==target['head'] and not git(c,'diff','--cached','--name-only'),'builder altered Git authority')
 for relative in (S,'shared/runtime/profile-store.js','shared/web-build.mjs','shared/build.mjs','package-lock.json','game/package-lock.json'):
  src=target['source']['act5-edge-art.js']
  require(git(c,'hash-object',relative)==(src['candidate'] if relative==S else git(b,'rev-parse','HEAD:'+relative)),'post-build source drift '+relative)
 def inventory(root):
  z=json.loads(file(root,M));rows={x['path']:{k:x[k] for k in ('bytes','sha256')} for x in z['files']}
  require(len(rows)==len(z['files']) and all(k.startswith('web/') and not (set(k.split('/'))&{'..','.'}) for k in rows),'unsafe/ambiguous emitted graph')
  for k,v in rows.items():require(fact(file(root,k))==v,'changed bytes under active alias '+k)
  return {'manifest':z,'active':rows,'shell':fact(file(root,'HONRO.html')),'workshopShell':fact(file(root,'HONRO_WORKSHOP.html'))}
 B,C=map(inventory,(b,c));bi,ci=B['active'],C['active'];a=set(bi);z=set(ci)
 require(len(a)==len(z) and all(bi[k]==ci[k] for k in a&z),'immutable active file changed')
 cb,cc=B['manifest'],C['manifest']
 require(cb['project']==cc['project']==bp['campaign'],'active campaign alias changed')
 record=json.loads(file(b,bp['campaign']))
 require(len(record['stages'])==len(record['stageLibraries'])==50 and set(record['stages']+record['stageLibraries'])<=a&z,'all 50 chapter maps/art must match a6')
 active_data={k:v for k,v in refs.items() if k.startswith(('web/data/','web/graphics/'))}
 require(all(sha(file(c,k))==v for k,v in active_data.items()),'active art/map/far dependencies changed')
 # No requirement to publish or ship C outputs on this QA carrier.
 put(w/'out'/'CLOSURE-PRE.json',{'b':B,'c':C,'bonly':sorted(a-z),'conly':sorted(z-a)})
def native(w):
 from playwright.sync_api import sync_playwright
 x=json.loads((w/'out'/'ORDERED.json').read_bytes())
 require(x['status']=='PASS_ONLY_EXACT_RENDERER_SOURCE_AND_POINTERS','no structurally signed normal C')
 q=json.loads((w/'out'/'CLOSURE-PRE.json').read_bytes());aliases=x['addressPairs']
 B=P['arms']['B'];C={**P['candidate'],'map':B['map'],'campaign':B['campaign'],'provider':B['provider'],'files':{}}
 for k,v in B['files'].items():
  mapped=aliases.get(k,k);v=q['c']['active'].get(mapped,{}).get('sha256',v)
  C['files'][mapped]=v
 C['files'][M]=sha(file(w/'C',M));C['files']['HONRO.html']=sha(file(w/'C','HONRO.html'))
 P['arms']['C']=C;out=w/'out';report={'status':'HOLD','fresh':{}}
 def save():put(out/'PREDEPLOY-NATIVE.json',report)
 save()
 try:
  with contextlib.ExitStack() as s:
   urls={a:s.enter_context(server(w/a)) for a in ('A','B','C')}
   pw=s.enter_context(sync_playwright());br=pw.chromium.launch(headless=True,chromium_sandbox=True)
   try:
    require(br.version==P['chromium'],'wrong authority Chromium')
    oldManifest=json.loads(file(w/'A',M))
    oldActive={z['path']:z for z in oldManifest['files']}
    for dev in ('PC','M'):
     frames={}
     oldRaw,old=collect(br,w/'A',urls['A'],'A',dev,'FINAL',oldActive)
     with Image.open(BytesIO(oldRaw)) as im:oldRGBA=sha(im.convert('RGBA').tobytes())
     name=f'{dev}-A-SAME-RUN';(out/(name+'.png')).write_bytes(oldRaw)
     report['fresh'][name]={**old,'rgbaSHA256':oldRGBA,'expectedArchiveA':P['Araw'][dev]};save()
     require(oldRGBA==P['Araw'][dev],'same-run f6 drifts from exact archive; no candidate comparison '+dev)
     for lane in ('FINAL','COUNT_ONLY'):
      raw,r=collect(br,w/'C',urls['C'],'C',dev,lane,q['c']['active']);frames[lane]=raw
      with Image.open(BytesIO(raw))as im:rgba=sha(im.convert('RGBA').tobytes())
      name=f'{dev}-C-{lane}';(out/(name+'.png')).write_bytes(raw)
      report['fresh'][name]={**r,'rgbaSHA256':rgba,'expectedArchiveA':P['Araw'][dev]};save()
      require(r['objectiveFont']==old['objectiveFont'],'live objective text/layout/font witness differs '+dev)
      require(rgba==oldRGBA==P['Araw'][dev],'candidate fresh does not match independently pinned old view '+dev)
     require(frames['FINAL']==frames['COUNT_ONLY'],'positive count observer altered real candidate')
    close=P['closeWestPC'];require(close[2]>1.05,'close west must exercise native non-tile scale')
    closeFrames={}
    for arm,active in [('A',oldActive),('C',q['c']['active'])]:
     raw,r=collect(br,w/arm,urls[arm],arm,'PC','FINAL',active,pose_override=close)
     name=f'PC-CLOSE-WEST-{arm}';(out/(name+'.png')).write_bytes(raw)
     with Image.open(BytesIO(raw))as im:closeFrames[arm]=sha(im.convert('RGBA').tobytes())
     report['fresh'][name]={**r,'rgbaSHA256':closeFrames[arm]};save()
    require(closeFrames['A']==closeFrames['C'] and report['fresh']['PC-CLOSE-WEST-A']['objectiveFont']==report['fresh']['PC-CLOSE-WEST-C']['objectiveFont'],'actual native close-west A vs candidate mismatch')
    r=run_continue(br,urls,P,O,out)
    require(r['status']=='VERIFIED_DISPOSABLE_F6_AND_A6_TITLE_CONTINUE_C','native title Continue not verified')
   finally:br.close()
  report['status']='PASS_PREDEPLOY_NATIVE_FRESH_PC_M_AND_OLD_CURRENT_CONTINUE'
 except BaseException as e:report['firstError']=repr(e);raise
 finally:save()
if __name__=='__main__':
 gates()
 op=sys.argv[1];w=Path(sys.argv[2]).resolve(strict=True)
 if op=='pre':pre(w,Path(sys.argv[3]).resolve(strict=True))
 elif op=='graph':graph(w)
 elif op=='native':native(w)
 else:raise ValueError('no operation except scoped native QA')
