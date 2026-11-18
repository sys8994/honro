import os,json,pathlib,hashlib,traceback
from playwright.sync_api import sync_playwright
from identity import Identity
out=pathlib.Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
identity=Identity(out);identity.preflight();source=pathlib.Path(os.environ['HONRO_SYNTHETIC_PROFILE']);raw=source.read_bytes();saved=json.loads(raw);assert saved['honroBattle']['honroStage']==3
provenance=json.loads(pathlib.Path(str(source)+'.provenance.json').read_text());assert provenance['release']==identity.release and provenance['entireCompiledBodyRoundtripExact']
assert provenance['rawAcceptedBodySHA']=='ea8b604fa02da75d49eab049427abec1f49aa78cd571a5da87a012ae64a1efad'
assert provenance['liveBodySHA']==provenance['restoredBodySHA']
result={'passed':False,'release':identity.release,'syntheticProfileSHA256':hashlib.sha256(raw).hexdigest(),'scope':'Public exact release network identity and normal UI import/continue Stage3 smoke. Synthetic profile, not user save, full playthrough, device benchmark or all-stage art review.'}
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);context=browser.new_context(viewport={'width':1331,'height':763});assert context.storage_state()=={'cookies':[],'origins':[]};p=context.new_page();identity.attach(p)
 try:
  p.goto(identity.url,wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=120000)
  result['initialScreen']=p.evaluate('HonroApp.screen');assert result['initialScreen']=='title'
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.honroBattle?.honroStage===3',timeout=30000)
  p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===3&&HonroApp.scene',timeout=60000)
  p.wait_for_timeout(1500)
  state=p.evaluate('()=>({stage:HonroApp.engine.b.honroStage,scene:!!HonroApp.scene,width:HonroApp.engine.b.width,height:HonroApp.engine.b.height,round:HonroApp.engine.b.round,lastError:HonroApp.lastError??null,canvas:{w:document.querySelector("#battlecanvas").width,h:document.querySelector("#battlecanvas").height}})')
  assert state['stage']==3 and state['scene'] and not state['lastError'] and state['canvas']['w']>0 and state['canvas']['h']>0
  body_sha=p.evaluate("async()=>{const a=HonroApp.engine.b.honroLandmarks.find(x=>x.asset?.id==='act1-site:3:body')?.asset;if(!a)throw Error('Missing Stage3 body');async function restore(v){if(typeof v==='string'&&v.startsWith('https://sys8994.github.io/honro/web/graphics/')){const r=await fetch(v);if(!r.ok)throw Error('Missing public body asset');const b=new Uint8Array(await r.arrayBuffer());let text='';for(const n of b)text+=String.fromCharCode(n);const mime={svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[v.split('.').at(-1)];if(!mime)throw Error('Unknown image mime');return 'data:'+mime+';base64,'+btoa(text);}if(Array.isArray(v))return Promise.all(v.map(restore));if(v&&typeof v==='object')return Object.fromEntries(await Promise.all(Object.entries(v).map(async([k,x])=>[k,await restore(x)])));return v;}const original=await restore(a);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(original)))),x=>x.toString(16).padStart(2,'0')).join('')}")
  result['observedBodySHA256']=body_sha
  assert body_sha==provenance['restoredBodySHA'],'Public mounted Stage3 art differs from independently restored official K snapshot'
  result['stage3BodySHA256']=body_sha;result['sourceAndSnapshotProvenance']=provenance;result['state']=state;p.screenshot(path=str(out/'public-stage3.png'));identity.finish(p);result['passed']=True
 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:identity.finish(p)
  except Exception as identity_error:result['identityFailure']=str(identity_error)
  try:p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  (out/'public-stage3-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
assert result['passed'],result.get('failure')
