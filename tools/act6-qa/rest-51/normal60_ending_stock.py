"""QA-only ordinary 60 ending; true DOM actions, lock competition, reload.
Accepts no previous-stage fixtures; caller already drove the current App to win.
"""
import hashlib,json
from urllib.parse import urlsplit
KEY='honro-act6-normal-profile-L-1'
STORE='honro-first-act-profile-1'
GIDS=['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay']

def observe(page,state,mobile,original,tap,out,case,prev):
    origin='http://127.0.0.1:18861'
    assert urlsplit(page.url)._replace(path='',query='',fragment='').geturl()==origin
    href=urlsplit(page.url)._replace(query='',fragment='').geturl()
    ctx=page.context
    root='.honro-ending-60[data-mode="completion"]'
    ending=page.locator(root)
    raw=lambda tab:tab.evaluate('k=>localStorage.getItem(k)',KEY)
    normal=lambda tab:tab.evaluate('k=>localStorage.getItem(k)',STORE)
    serialize="()=>JSON.stringify({p:HonroApp.normalProfile,b:HonroApp.engine.b})"
    original_in_memory=page.evaluate(serialize)
    normal_baseline=page.evaluate("()=>HonroProfileStore.migrate(JSON.stringify(HonroApp.normalProfile))")
    assert page.evaluate('HonroApp.done && HonroApp.engine.b.phase==="won"') and raw(page) is None and normal(page)==original
    earlier=state['campaign59Terminal']['actual']['boundary']
    assert earlier['closed'] and earlier['guardAftermath']['seenBy']==prev['rows']['knight']['id']
    assert [r['id'] for r in earlier['guardAftermath']['poses']]==GIDS
    def need(cut,title,media):
        frame=ending.locator(media)
        button=ending.get_by_role('button',name=title,exact=True)
        for _ in range(30):
            if frame.count()==1 and frame.is_visible() and button.count()==1 and button.is_enabled() and ending.get_attribute('data-cut')==cut:break
            assert not ending.get_by_role('button',name='장면 다시 불러오기').count(),(cut,ending.inner_text())
            page.clock.run_for(150)
        assert frame.is_visible() and button.is_visible() and button.is_enabled() and ending.get_attribute('data-cut')==cut,cut
        assert raw(page) is None and normal(page)==original and page.evaluate(serialize)==original_in_memory
        return button
    cuts=[('last-souls','계속','canvas'),('bridge-record','방패선의 이름을 적기','canvas'),
          ('daybreak','계속','img'),('later-return','여정을 마치기','canvas')]
    for cut,title,media in cuts:
        btn=need(cut,title,media)
        page.screenshot(path=out/f'{case}-ending-{cut}.png',animations='disabled')
        if cut=='bridge-record':
            assert ending.get_by_role('button',name='계속',exact=True).count()==0
            tap(page,root+' button.honro-ending-60-button',mobile)
            btn=need(cut,'계속','canvas')
            assert all(ending.get_by_text(g,exact=False).count()>0 for g in ['곽진','박문돌','이만복'])
            page.screenshot(path=out/f'{case}-ending-bridge-record-names.png',animations='disabled')
        if cut=='daybreak':
            assert ending.locator('img').evaluate('v=>[v.naturalWidth,v.naturalHeight]')==([941,1672] if mobile else [1672,941])
        if cut=='later-return':
            btn.evaluate('v=>v.click()')
            assert raw(page) is None and normal(page)==original
            break
        tap(page,root+' button.honro-ending-60-button',mobile)
    page.clock.resume()
    witness=ctx.new_page()
    errors=[]
    witness.on('pageerror',lambda e:errors.append(str(e)))
    witness.goto(href,wait_until='domcontentloaded',timeout=45000)
    witness.wait_for_function("globalThis.HonroApp?.screen==='title' && !!globalThis.HONRO_READY",timeout=45000)
    lock='honro:profile-slot:'+KEY
    witness.evaluate("""([key,lock])=>{window.__endingEvents=[];window.addEventListener('storage',e=>{if(e.key===key)window.__endingEvents.push([e.oldValue,e.newValue]);});
      return new Promise(acquired=>{navigator.locks.request(lock,{mode:'exclusive'},()=>new Promise(release=>{window.__endingRelease=release;acquired();}));});}""",[KEY,lock])
    try:
        page.bring_to_front()
        tap(page,root+' button.honro-ending-60-button',mobile)
        witness.wait_for_function("async name=>{const q=await navigator.locks.query();return q.held.some(x=>x.name===name)&&q.pending.some(x=>x.name===name);}",arg=lock,timeout=12000)
        assert raw(page) is None and raw(witness) is None
    finally:
        witness.evaluate('()=>window.__endingRelease?.()')
    try:
        ending.get_by_text('여정의 끝을 기록했습니다.',exact=True).wait_for(state='visible',timeout=18000)
    except:
        page.screenshot(path=out/f'{case}-ending-write-failure.png',animations='disabled')
        state['endingFailure']=ending.inner_text()
        raise
    written=raw(page)
    witness.wait_for_function("()=>window.__endingEvents?.length===1",timeout=12000)
    assert witness.evaluate("()=>window.__endingEvents")==[[None,written]] and written==raw(witness)
    profile=json.loads(written)
    receipt=profile['honroEndingReceipt']
    assert profile['honroFlags']['act6.endingCompleted'] is True and not profile.get('honroBattle')
    assert receipt['winner']==prev['rows']['knight']['id']=='p-knight' and receipt['recordedGuardIds']==GIDS
    assert receipt['terminalSha']==state['campaign60Terminal']['receipt']['physical']['lineage']
    assert receipt['key']==f"act6-ending:{profile['equipment']['runId']}:{receipt['terminalSha']}"
    del profile['honroEndingReceipt']; del profile['honroFlags']['act6.endingCompleted']
    assert profile==normal_baseline,'unapproved canonical profile change in dedicated QA slot'
    assert page.evaluate(serialize)==original_in_memory and normal(page)==original
    assert page.evaluate("()=>!Object.keys(sessionStorage).some(k=>k.startsWith('honro-act6-qa-ending:'))")
    assert not ending.locator('button').count()
    for tab in (witness,page):
        tab.reload(wait_until='domcontentloaded',timeout=45000)
        tab.wait_for_function("sha=>globalThis.HonroApp?.screen==='title' && document.documentElement.dataset.act6StockSlotReopened===sha",arg=receipt['terminalSha'],timeout=45000)
        assert raw(tab)==written and normal(tab)==original and tab.evaluate("()=>HonroApp.engine==null")
        assert not tab.locator(root).count()
    assert not errors,errors
    state['campaign60Terminal']['ending']={'cuts':[r[0] for r in cuts],'receipt':receipt,'officialScope':'full-normal-QA only',
      'nativeLockHeldAndPending':True,'writesObserved':1,'freshReopens':2,'normalKeyUnchanged':True,
      'slotBytes':len(written.encode()),'slotSHA256':hashlib.sha256(written.encode()).hexdigest()}
