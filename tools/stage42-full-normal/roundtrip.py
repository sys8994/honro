"""Genuine native no-deploy round trip of disposable Stage42 save; no response substitution."""
import base64,contextlib,hashlib,io,json,sys
import normal as n
from pathlib import Path
import readback as r
P=r.P
def authored(browser,host,dev,files,stamp,phase):
 ctx,p,seen,errors=r.visit_init(browser,host,dev,files)
 try:
  p.evaluate(r.O['LAUNCH'],42);r.wait_aim(p);x=p.evaluate(r.RESTORED);r.exact_state(x,stamp)
  s=p.evaluate(r.PERSIST,r.KEY)
  r.ensure(s['refs']==[stamp,stamp] and s['state']==s['liveAtPersist'],'normal source save not authoritative')
  # Art and campaign loads are required. FAR must be natural at the later actual view, not now.
  proof=r.q['cases'][dev+'-'+phase]={'profileDigest':r.uploadfact(s['text']),'refs':s['refs'],'wires':r.wire(host,files,seen,errors)}
  r.save();return s
 finally:ctx.close()
def render_eq(x,y):
 return {k:v['rgba']==y['images'][k]['rgba'] for k,v in x['images'].items()}
PAUSE_RAF="""()=>{
 const a=HonroApp, key='__honroFallbackVisualFrameLease';
 if(Object.hasOwn(window,key)||typeof a.frame!=='function')throw Error('invalid visual RAF lease');
 const original=Object.getOwnPropertyDescriptor(a,'frame'), fn=a.frame, suspended=()=>requestAnimationFrame(t=>a.frame(t));
 if(original&&!original.configurable)throw Error('cannot reversibly suspend app frame');
 Object.defineProperty(a,'frame',{configurable:true,writable:true,value:suspended});
 Object.defineProperty(window,key,{configurable:true,value:{app:a,original,fn,suspended}});
 return true;
}"""
RESUME_RAF="""()=>{
 const key='__honroFallbackVisualFrameLease', q=window[key];
 if(!q||q.app!==HonroApp||q.app.frame!==q.suspended)throw Error('lost visual RAF lease');
 if(q.original)Object.defineProperty(q.app,'frame',q.original);else delete q.app.frame;
 if(q.app.frame!==q.fn)throw Error('original app frame not restored');
 delete window[key];return true;
}"""
def core_files(files):
 f=P['stageFar'];return {k:v for k,v in files.items() if k not in {f['config'],f['path']}}
def picture_transport(p,host,dev,files,seen,errors,label,state,oracle,need_oracle,case):
 card=case['photo']={'status':'HOLD','decode':None,'observed':{},'files':{},'arbiter':{}}
 r.save()
 r.ensure(p.evaluate(PAUSE_RAF) is True,'visual RAF suspension not installed')
 try:
  devp=P['devices'][dev];want=devp['views']['low-east'];m=P['cameraModes']['low-east']
  args={'id':42,'mapId':'stage-42','name':m['mode'],'ordinary':want if m['mode']=='ordinary' else [],
        'dx':m['dx'],'dy':m['dy'],'readback':False,'fixedNow':r.O['PHASE']}
  def observe(section,readback):
   try:
    v=p.evaluate(r.O['FROZEN'],{**args,'readback':readback}); raw=v['meta'].pop('signature')
    v['meta']['unprojectedPhysics']=r.sha(raw.encode())
    vv=card['observed'][section]=v;r.save()
    projected=p.evaluate(r.PHYSICS_WITH_PERSISTED_DEFAULTS_ONLY,{'sig':raw,'before':state['units'],'names':r.ZERO_INITIALIZED})
    vv['meta']['physics']=r.sha(projected.encode());r.save();return vv
   except Exception:
    r.mark_failed('photo-'+dev+'-'+label+'-'+section);return None
  first=observe('beforeDecode',False)
  try:card['decode']=p.evaluate(r.O['DECODE']);r.save()
  except Exception:r.mark_failed('photo-'+dev+'-'+label+'-decode')
  later=observe('afterDecode',True)
  # Always keep both independent native images when available, even if decode/pose gate is red.
  for kind in ('raw','dom'):
   try:
    if kind=='raw':b=base64.b64decode(p.evaluate(r.O['CANVAS']),validate=True)
    else:b=p.locator('#battlecanvas').screenshot(animations='disabled',caret='hide',scale='css',timeout=25000)
    file=f'{dev}-{label}-low-east-{kind}.png';(r.proofdir/file).write_bytes(b)
    with r.Image.open(io.BytesIO(b)) as im:
     card['files'][kind]={'file':file,'rgba':r.sha(im.convert('RGBA').tobytes()),'png':r.sha(b),'size':list(im.size)}
    r.save()
   except Exception:r.mark_failed('photo-'+dev+'-'+label+'-'+kind)
  phase=card['arbiter'];phase['decodeSucceeded']=bool(card['decode'] is not None and not card['decode']['failed'])
  phase['metadataExact']=bool(first is not None and later is not None and first==later)
  phase['metadataDifferentKeys']=[] if first is None or later is None else [k for k in dict.fromkeys([*first['meta'],*later['meta']]) if first['meta'].get(k)!=later['meta'].get(k)]
  meta={} if later is None else later['meta']; phase['poseAndPhysicalExact']=bool(meta
   and meta['actual']==dict(zip(('x','y','scale'),want)) and meta['physics']==P['physics'] and meta['actorCount']==34
   and meta['backing']==devp['backing'] and meta['sceneTime']==2 and meta['phase']=='aim' and meta['round']==1)
  phase['dimensionsExact']=set(card['files'])=={'raw','dom'} and card['files']['raw']['size']==devp['backing'] and bool(meta) and all(
    abs(n-meta['css'][k])<2 for n,k in zip(card['files']['dom']['size'],('w','h')))
  far=card['far']=p.evaluate(r.FAR_OBS);key=P['stageFar']['path'];r.save()
  phase['naturalFarExact']=bool(far['key']==P['stageFar']['key'] and far['painted']==[P['stageFar']['key']] and far['url']==host+key and any(x['complete'] and x['width']>0 and x['height']>0 for x in far['decoded']))
  card['wires']=r.wire(host,files,seen,errors);r.save()
  frame={'images':card['files'],'pose':later}
  card['comparisonOracleStatus']='NOT_REQUIRED_SELF_CONTROL' if not need_oracle else 'MISSING_OR_UNQUALIFIED' if oracle is None else 'PRESENT'
  if oracle is not None and set(card['files'])=={'raw','dom'}:card['expectedVisualExact']=render_eq(frame,oracle)
  r.save()
  r.ensure(phase['decodeSucceeded'],'image decode failed independently of frame comparison')
  r.ensure(phase['metadataExact'],'actual replay metadata drift '+repr(phase['metadataDifferentKeys']))
  r.ensure(phase['poseAndPhysicalExact'] and phase['dimensionsExact'] and phase['naturalFarExact'],'actual cold camera, physics, dimensions or natural FAR differs')
  r.ensure(not need_oracle or all(card.get('expectedVisualExact',{}).get(k) is True for k in ('raw','dom')),'exact corresponding visual oracle missing or visual mismatch')
  return frame
 finally:
  p.evaluate(RESUME_RAF);card['rafRestored']=True;r.save()
def ready(browser,host,dev,files,source,stamp,label,oracle=None,shot=None,expect_shot=False,resave=False,negative=False):
 r.ensure(isinstance(source,dict),'missing exact source save')
 ctx,p,seen,errors=r.visit_init(browser,host,dev,files,source['text'])
 try:
  r.ensure(p.evaluate('(k)=>localStorage.getItem(k)',r.KEY)==source['text'] and p.evaluate("()=>!HonroApp.engine&&Boolean(HonroApp.profile.honroBattle)"),'Cold title missing original disposable snapshot')
  p.evaluate(r.TAP);btn=p.locator('.title-actions button[data-action="continue"]').first
  btn.wait_for(state='visible',timeout=12000);btn.click();r.wait_aim(p)
  env,stable=r.stable_ready(p,r.RESTORED);r.exact_state(env,stamp)
  r.ensure(p.evaluate("()=>window.__honroContinueTap")=={'launches':0,'mounts':1},'not one natural cold Continue')
  diag=p.evaluate("()=>window.__honroContinueCheckpoints")
  facts,projection=r.observe_cold(source['state'],env['state'],diag)
  case=r.q['cases'][dev+'-'+label]={'input':r.uploadfact(source['text']),'mounted':env['mounted'],'actualTitleContinue':True,'stability':stable,
   'stateDiff':facts,'explicitInvariant':projection,'fullStateVersusStockReady':None if oracle is None else r.compare_state(oracle,env['state']),
   'readiness':'HOLD'};r.save()
  r.require_ready(case,oracle,env['state'])
  case['readyWires']=r.wire(host,core_files(files),seen,errors)
  case['readiness']='PASS';r.save() # Never depends on image observer or visual oracle.
  frame=None
  try:
   frame=picture_transport(p,host,dev,files,seen,errors,label,source['state'],shot,expect_shot,case)
   case['photo']['status']='PASS';r.save()
  except Exception:r.mark_failed('photo-'+dev+'-'+label)
  if negative:
   case['invalidCases']=p.evaluate(r.NEG,source['text']);r.save()
   r.ensure(all(case['invalidCases'].values()),'fallback broadened actual guard')
  save_after=None
  if resave:
   r.ensure('photo' not in case or case['photo'].get('rafRestored') is True,'unsafe to re-save after visual RAF lease could not be restored')
   save_after=p.evaluate(r.RESAVE_VIA_TITLE,r.KEY);case['resave']=r.uploadfact(save_after['text']);case['resaveRefs']=save_after['refs'];r.save()
   r.ensure(save_after['refs']==[stamp,stamp] and save_after['text']!=source['text'] and save_after['state']==save_after['liveAtPersist'] and save_after['state']==env['state'],'normal title exit did not persist exact selected mounted state and references')
   case['resaveStatus']='PASS';r.save()
  if frame is not None:case['qualification']='PASS';r.save()
  return {'state':env['state'],'frame':frame,'save':save_after}
 finally:ctx.close()
def stock_files(base):
 sh=r.signaturefiles(base,'CURRENT')
 wanted=r.source_routes('CURRENT',sh)
 far=P['stageFar'];wanted.update({k:sh[k] for k in (far['path'],far['config'])})
 k=P['beforeCommon5']['path'];raw=(base/k).read_bytes();m=(base/'web/manifest.json').read_bytes()
 r.ensure(n.blob(m)==P['arms']['B']['manifestGit'],'wrong stock manifest while binding common5')
 manifest=json.loads(m);index={row['path']:row for row in manifest['files']}
 r.ensure(k in manifest['common'] and sum(x.startswith('web/runtime/ordered-common-5.') for x in manifest['common'])==1
   and n.blob(raw)==P['beforeCommon5']['git'] and k.split('.')[-2]==r.sha(raw)[:16]
   and k in index and n.exact_route(base,k,index)==raw,'wrong active stock common5 route')
 wanted[k]=r.sha(raw)
 return wanted
def main(base,forward,fallback,out):
 r.ensure(P['enabled'] is True,'disabled: no browser or network use')
 r.ensure(r.sha((r.D/'observer.json').read_bytes())==P['observerSHA256'],'unreviewed observer')
 from playwright.sync_api import sync_playwright
 from PIL import Image
 r.Image=Image;r.proofdir=out
 src=P['arms']['B']
 forward_proof=json.loads((out/'NORMAL-GRAPH.json').read_bytes())
 fallback_proof=json.loads((out/'FALLBACK-GRAPH.json').read_bytes())
 r.ensure(forward_proof['status']=='PASS_FULL_EXACT_RELEASE_GRAPH' and fallback_proof['status']=='PASS_EXACT_FALLBACK_GRAPH','incomplete authentic normal graphs')
 for home,receipt in ((forward,forward_proof),(fallback,fallback_proof)):
  r.ensure(r.git(home,'rev-parse','HEAD')==src['head'] and r.sha((home/'web/manifest.json').read_bytes())==receipt['manifestSHA256'],'wrong active normal graph')
  for k,v in receipt['routeSHA256'].items():r.ensure(r.sha((home/k).read_bytes())==v,'graph required file changed '+k)
 current=stock_files(base);f=forward_proof['routeSHA256'];back=fallback_proof['routeSHA256']
 # Binds the actual lazily loaded profile module in every normal arm, including forward.
 fk=P['compiledForward']['sha256'];f['web/runtime/ordered-common-5.'+fk[:16]+'.js']=fk
 r.q={'status':'HOLD_FALLBACK_UNPROVEN','forwardStamp':P['full']['signature'],'stockFallbackStamp':P['fallback']['owner'],
      'scope':'Native actual stock, forward and fallback; no intercepted payload, moves, deployed product, saved user data or other chapter changes. Bare stock rollback remains invalid.',
      'cases':{},'errors':{}};r.save()
 with contextlib.ExitStack() as stack:
  hosts={k:stack.enter_context(r.server(v)) for k,v in {'S':base,'F':forward,'R':fallback}.items()}
  w=stack.enter_context(sync_playwright());br=w.chromium.launch(headless=True,chromium_sandbox=True)
  try:
   r.ensure(br.version==P['chrome'],'wrong stock browser')
   for dev in ('PC','M'):
    try:
     ss=P['fallback']['owner'];fs=P['full']['signature']
     stock_input=authored(br,hosts['S'],dev,core_files(current),ss,'stock-author')
     forward_input=authored(br,hosts['F'],dev,core_files(f),fs,'forward-author')
     stock=ready(br,hosts['S'],dev,current,stock_input,ss,'stock-to-stock')
     fself=ready(br,hosts['F'],dev,f,forward_input,fs,'forward-to-forward',stock['state'])
     other=ready(br,hosts['R'],dev,back,forward_input,ss,'forward-to-fallback',stock['state'],stock['frame'],expect_shot=True,resave=True,negative=True)
     again=ready(br,hosts['F'],dev,f,other['save'],fs,'fallback-to-forward',stock['state'],fself['frame'],expect_shot=True,resave=True)
     ready(br,hosts['F'],dev,f,again['save'],fs,'forward-resave-cold',stock['state'],fself['frame'],expect_shot=True)
    except Exception:r.mark_failed('roundtrip-'+dev)
  finally:br.close()
 r.ensure(not r.q['errors'] and len(r.q['cases'])==14 and sum(i.get('qualification')=='PASS' for i in r.q['cases'].values())==10,'native fallback trajectory incomplete; keep HOLD')
 r.q['status']='PASS_EXACT_3032_NORMAL_FORWARD_FALLBACK_FORWARD_NO_DEPLOY';r.save()
if __name__=='__main__':main(*(Path(x).resolve() for x in sys.argv[1:]))
