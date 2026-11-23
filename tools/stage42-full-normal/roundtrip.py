"""Genuine native no-deploy round trip of disposable Stage42 save; no response substitution."""
import contextlib,json,sys
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
def ready(browser,host,dev,files,source,stamp,label,oracle=None,shot=None,resave=False,negative=False):
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
   'stateDiff':facts,'explicitInvariant':projection,'fullStateVersusStockReady':None if oracle is None else r.compare_state(oracle,env['state'])};r.save()
  r.require_ready(case,oracle,env['state'])
  frame=r.pictures(p,dev,'low-east',label,source['state']);case['frame']=frame;r.save()
  far=p.evaluate(r.FAR_OBS);case['frame']['far']=far;r.save()
  key=P['stageFar']['path'];r.ensure(far['key']==P['stageFar']['key'] and far['painted']==[P['stageFar']['key']] and far['url']==host+key and any(x['complete'] and x['width']>0 and x['height']>0 for x in far['decoded']),'missing natural valleyFar on registered camera')
  case['wires']=r.wire(host,files,seen,errors);r.save()
  if shot is not None:
   case['expectedVisualExact']=render_eq(frame,shot);r.save()
   r.ensure(all(case['expectedVisualExact'].values()),'paired fallback/forward picture differs from correct actual platform baseline')
  if negative:
   case['invalidCases']=p.evaluate(r.NEG,source['text']);r.save()
   r.ensure(all(case['invalidCases'].values()),'fallback broadened actual guard')
  save_after=None
  if resave:
   save_after=p.evaluate(r.RESAVE_VIA_TITLE,r.KEY);case['resave']=r.uploadfact(save_after['text']);case['resaveRefs']=save_after['refs'];r.save()
   r.ensure(save_after['refs']==[stamp,stamp] and save_after['text']!=source['text'] and save_after['state']==save_after['liveAtPersist'] and save_after['state']==env['state'],'normal title exit did not persist exact selected mounted state and references')
  case['qualification']='PASS';r.save()
  return {'state':env['state'],'frame':frame,'save':save_after}
 finally:ctx.close()
def stock_files(base):
 sh=r.signaturefiles(base,'CURRENT')
 # Unlike source author, this is used after the registered rendered view.
 wanted=r.source_routes('CURRENT',sh)
 far=P['stageFar'];wanted.update({k:sh[k] for k in (far['path'],far['config'],P['beforeCommon5']['path'])})
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
     def source_files(files):
      cloud=P['stageFar']
      return {k:v for k,v in files.items() if k not in {cloud['path'],cloud['config']}}
     stock_input=authored(br,hosts['S'],dev,source_files(current),ss,'stock-author')
     forward_input=authored(br,hosts['F'],dev,source_files(f),fs,'forward-author')
     stock=ready(br,hosts['S'],dev,current,stock_input,ss,'stock-to-stock')
     fself=ready(br,hosts['F'],dev,f,forward_input,fs,'forward-to-forward',stock['state'])
     other=ready(br,hosts['R'],dev,back,forward_input,ss,'forward-to-fallback',stock['state'],stock['frame'],resave=True,negative=True)
     again=ready(br,hosts['F'],dev,f,other['save'],fs,'fallback-to-forward',stock['state'],fself['frame'],resave=True)
     ready(br,hosts['F'],dev,f,again['save'],fs,'forward-resave-cold',stock['state'],fself['frame'])
    except Exception:r.mark_failed('roundtrip-'+dev)
  finally:br.close()
 r.ensure(not r.q['errors'] and len(r.q['cases'])==14 and sum(i.get('qualification')=='PASS' for i in r.q['cases'].values())==10,'native fallback trajectory incomplete; keep HOLD')
 r.q['status']='PASS_EXACT_3032_NORMAL_FORWARD_FALLBACK_FORWARD_NO_DEPLOY';r.save()
if __name__=='__main__':main(*(Path(x).resolve() for x in sys.argv[1:]))
