"""Run inside the normal campaign route with disposable, genuine playtest saves."""
from hashlib import sha256

def witness(page,state,mobile,tap,out,case,stage):
    page.wait_for_function("HonroApp.screen==='rest'&&!HonroApp.dialogue")
    page.wait_for_timeout(400)
    def keys():
        return page.evaluate("()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('honro-')).sort().map(k=>[k,localStorage.getItem(k)]))")
    before=keys()
    tap(page,'[data-action="journey-book"]',mobile)
    cap='.journey-act-6 .journey-map'
    page.locator(cap).wait_for(state='visible',timeout=12000)
    assert page.locator('[data-action="journey-act"][data-id="6"]').get_attribute('aria-pressed')=='true'
    page.wait_for_function("()=>document.querySelector('.journey-act-6 .journey-map-image')?.naturalWidth===1024", timeout=10000)
    assert page.evaluate("()=>document.querySelector('.journey-act-6 .journey-map-image').src.startsWith(location.origin+'/honro/web/graphics/journey-map-act6.')")
    ids=page.locator('.journey-act-6 .journey-pin').evaluate_all("rows=>rows.map(el=>+el.dataset.id)")
    end=60 if stage=='done' else stage
    assert ids==list(range(51,end+1)),(case,stage,ids)
    realms=page.locator('.journey-act-6 .journey6-realm').all_text_contents()
    assert realms==(['무명사 외부','무명사 내부'] if end>=53 else ['무명사 외부']),(case,stage,realms)
    art=page.locator('.journey-map-image').evaluate("im=>[im.naturalWidth,im.naturalHeight]")
    assert art==[1024,1536],art
    assert page.locator('.journey-act-6 .journey-progress path[data-to]').count()==end-51
    assert bool(page.locator('.journey-act-6 .journey-fog').count())==(stage!='done')
    assert page.locator('.journey-act-6 .journey-pin[aria-current="location"]').count()==(0 if stage=='done' else 1)
    if end>=52:
        assert page.locator('.journey-act-6 path[data-from="51"]').evaluate("e=>getComputedStyle(e).strokeDasharray")=='none'
    if end>=53:
        assert page.locator('.journey-act-6 path[data-from="52"]').evaluate("e=>getComputedStyle(e).strokeDasharray")!='none'
    if stage!= 'done':
        assert page.get_by_text('쉼터에서 이어가기',exact=True).count()==1
    pos=page.locator('[data-action="journey-fit"]')
    pos.tap() if mobile else pos.click()
    # A fitting plate should be wholly in the scroll viewport, even when the
    # final selected node or its invisible label extends past the image edge.
    bounds=page.evaluate('''()=>{
        const m=document.querySelector('.journey-act-6 .journey-map').getBoundingClientRect();
        const v=document.querySelector('.journey-act-6 .journey-map-scroll').getBoundingClientRect();
        return {left:m.left-v.left, top:m.top-v.top,right:v.right-m.right,bottom:v.bottom-m.bottom};
    }''')
    assert all(x>=-2.0 for x in bounds.values()),(case,stage,bounds)
    labels=page.evaluate('''()=>{
        const viewport=document.querySelector('.journey-act-6 .journey-map-scroll');
        const v=viewport.getBoundingClientRect();
        return [...viewport.querySelectorAll('.journey-pin span,.journey6-realm')].map(e=>{
            const r=e.getBoundingClientRect(), label=e.textContent;
            return {label,left:r.left-v.left,top:r.top-v.top,right:v.right-r.right,bottom:v.bottom-r.bottom};
        });
    }''')
    assert all(all(v>=-1.5 for k,v in row.items() if k!='label') for row in labels),(case,stage,labels)
    page.screenshot(path=out/f'{case}-journey6-{stage}.png')
    if stage=='done':
        row=page.locator('[data-action="journey-select"][data-id="59"]')
        row.tap() if mobile else row.click()
        assert '같은 교각' in page.locator('.journey6-detail').inner_text()
        # Following themes can be inspected without launching old battles.
        assert page.get_by_text('쉼터에서 이어가기',exact=True).count()==0
        page.screenshot(path=out/f'{case}-journey6-bridge.png')
    assert keys()==before,'The journal modified a saved record'
    # Only the original stock rest action may reveal the trusted resume button.
    tap(page,'[data-action="rest"].journey-exit',mobile)
    page.wait_for_function("HonroApp.screen==='rest'&&!HonroApp.engine")
    if stage==51:
        assert page.locator('.rest-next[aria-label="스테이지 진입 · 무명사 외부"]').is_enabled()
    elif stage=='done':
        assert page.get_by_text('6막 여정 완료',exact=True).count()==1
    else:
        assert page.locator(f'[data-act6-boundary-resume="{stage}"]').is_enabled()
    state.setdefault('journeyProof',{})[str(stage)]={'ids':ids,'renderedImage':True,'savedBytesUnchanged':True,'validatedRestReturn':True,'beforeProfileHash':sha256(next(iter(before.values())).encode()).hexdigest()}
