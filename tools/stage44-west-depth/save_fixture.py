# Actual A-authored and B-authored disposable save. Never use an operating profile.
import json
KEY='honro-first-act-profile-1'
SIG='3323278:8ab035ae'
READY="()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'"
PROVIDER="""()=>{const p=HONRO_PROJECT.library.find(a=>a.id==='act5:near:44');if(!p)throw Error('provider is missing');return JSON.stringify(p);}"""
STABLE="""()=>{const a=HonroApp,b=a.engine?.b;if(b?.honroStage!==44||!b.honroCanonical||b.honroCustom!==false||a.stageId!==44||a.profileStore.locked)
 throw Error('not a restored normal canonical Stage44 battle');
 return JSON.stringify({mode:b.mode,phase:b.phase,round:b.round,terrain:b.terrain,units:b.units,water:b.water,stage:b.honroStage,
 mapStamp:b.honroCampaignMapRevision,revision:b.honroRevision,roster:b.heroes});}"""
def visit(br,o,g,url,observer,fact,sha,write):
 result={'status':'HOLD','kind':'real stock/current app save in separate disposable profiles; no live user data','visits':{}}
 def persist():write(o,'SAVE-CONTINUE.json',result)
 persist()
 def launch(side,fixture=None):
  host=url[side]; ctx=br.new_context(viewport={'width':390,'height':844},device_scale_factor=1,service_workers='block')
  page=ctx.new_page(); errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
  origin=host.rstrip('/')
  page.add_init_script('('+observer['INIT']+')();'+observer['INIT_SEED'])
  page.add_init_script('''(()=>{if(location.origin!=='''+json.dumps(origin)+''')return;const data='''+json.dumps(fixture)+''';
   if(data!==null&&localStorage.getItem('honro-first-act-profile-1')===null)localStorage.setItem('honro-first-act-profile-1',data);
  })();''')
  try:
   r=page.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
   assert r and r.status==200 and not r.from_service_worker and fact(r.body())==g['shell'][side]
   page.wait_for_function(READY,timeout=90000)
   return ctx,page,errors
  except BaseException:
   ctx.close();raise
 def provider(page):
  s=page.evaluate(PROVIDER)
  assert len(s.encode('utf8'))+3==3323328
  assert sha(('['+s+']\n').encode())==g['wire']['stockProvider']
  return sha(s.encode())
 def create(side):
  ctx,p,err=launch(side)
  try:
   p.evaluate(observer['LAUNCH'],44)
   p.locator('#battlecanvas').wait_for(state='visible')
   p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.querySelector('#turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}""",polling=125,timeout=12000)
   p.evaluate("()=>{const a=HonroApp;a.dirty=true;a.flushBattleSave();}")
   text=p.evaluate('(k)=>localStorage.getItem(k)',KEY);assert isinstance(text,str) and text
   q=json.loads(text)['honroBattle'];assert q['honroStage']==44 and q['phase']=='aim'
   r=next(v for v in q['honroLandmarks'] if v['id']=='a5-near')['asset']
   assert r=={'honroStaticAssetRef':1,'id':'act5:near:44','signature':SIG}
   state=p.evaluate(STABLE);assert not err,err
   result['visits']['author-'+side]={'profile':fact(text.encode()),'schemaRef':r,'battle':sha(state.encode()),'provider':provider(p)};persist()
   return text,state
  finally:ctx.close()
 def resume(side,label,text,ref,negative=False):
  ctx,p,err=launch(side,text)
  try:
   btn=p.locator('.title-actions button[data-action="continue"]').first
   btn.wait_for(state='visible',timeout=12000)
   assert p.evaluate('(k)=>localStorage.getItem(k)',KEY)==text
   # Keep the disposable world from advancing after restore; do not call
   # private restore, change the profile, or bypass the normal title button.
   p.evaluate("()=>{HonroApp.frame=()=>{};}")
   btn.click()
   if negative:
    p.wait_for_function("()=>document.getElementById('notice')?.textContent.includes('저장된 장의 그림 자료를 불러오지 못했습니다')",timeout=50000)
    assert p.evaluate("()=>!HonroApp.engine && HonroApp.screen==='title'")
    assert p.evaluate('(k)=>localStorage.getItem(k)',KEY)==text
    result['visits'][label]={'stockInvalidStillRejected':True,'profile':fact(text.encode())}
   else:
    p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===44 && HonroApp.engine?.b?.phase==='aim'",timeout=50000)
    p.locator('#battlecanvas').wait_for(state='visible')
    state=p.evaluate(STABLE)
    assert ref is None or state==ref,('same old fixture did not restore identical B battle',label)
    result['visits'][label]={'resumedWithoutStageRestart':True,'profile':fact(text.encode()),'battle':sha(state.encode()),'provider':provider(p)}
   assert not err,err
   persist();return state if not negative else None
  finally:ctx.close()
 try:
  old,old_start=create('A')
  a=resume('A','old-save-stock-A',old,None)
  assert a==old_start,'stock normal Continue did not restore its own saved stable battle'
  resume('B','old-save-current-B',old,a)
  new,new_start=create('B')
  b=resume('B','new-save-current-B',new,None)
  assert b==new_start,'current normal Continue did not restore its own saved stable battle'
  resume('A','new-save-stock-A',new,b)
  s=json.loads(old)
  ref=next(v for v in s['honroBattle']['honroLandmarks'] if v['id']=='a5-near')['asset'];assert ref['signature']==SIG
  ref['signature']='3323278:00000000';resume('B','tampered-old-save-current-B',json.dumps(s,ensure_ascii=False,separators=(',',':')),None,True)
  result['status']='PASS_REAL_OLD_AND_CURRENT_CONTINUE'
 except BaseException as e:
  result['firstFailure']=repr(e)
 finally:persist()
 return result
