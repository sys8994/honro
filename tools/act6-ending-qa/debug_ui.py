"""Operate the published application UI on the isolated release-host browser fixture."""
from io import BytesIO
from PIL import Image,ImageChops
import json
ROOT='.honro-ending-60[data-mode="debug"]'
AUDIO_SPY="""(() => {
 const old=HTMLMediaElement.prototype.play;
 globalThis.act6EndingMedia=[];
 HTMLMediaElement.prototype.play=function(...args){
  if(this.dataset.honroEndingTrack==='provisional'){
   if(!act6EndingMedia.some(x=>x.el===this))act6EndingMedia.push({el:this,attempts:0});
   act6EndingMedia.find(x=>x.el===this).attempts++;
   if(globalThis.act6EndingDeny)return Promise.reject(new DOMException('Blocked in fallback fixture','NotAllowedError'));
  }
  return old.apply(this,args);
 };
})();"""
def prepare(context):
    context.add_init_script(AUDIO_SPY)
def actual_pixels(page,view,cut,clock=False):
    # Compare real final-composited browser pixels, not authored source files or DOM width.
    plate=view.locator('.h6ending-naru' if cut=='homecoming' else '.h6ending-ledger')
    targets=('.h6ending-backdrop img','.h6ending-yeonsil','.h6ending-seol') if cut=='homecoming' else ('.h6ending-backdrop img','.h6ending-hwi')
    def paints():
        if clock: page.clock.run_for(90)
        else: page.evaluate("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))")
    def capture(): return Image.open(BytesIO(plate.screenshot(animations='disabled'))).convert('RGB')
    paints(); on=capture(); w,h=on.size; actual={}
    for selector in targets:
        im=plate.locator(selector)
        box=im.bounding_box()
        assert box and box['width']>12 and box['height']>12, (cut,selector,box)
        saved=im.evaluate("el=>{const s=el.style.visibility;el.style.visibility='hidden';return s}")
        try: paints(); off=capture()
        finally:
            im.evaluate("(el,s)=>{el.style.visibility=s}",saved)
            paints()
        parts=ImageChops.difference(on,off).split()
        max_rgb=ImageChops.lighter(ImageChops.lighter(parts[0],parts[1]),parts[2])
        n=sum(max_rgb.histogram()[20:]); actual[selector]=n
        limit=int(w*h*.18) if 'backdrop' in selector else max(70,int(w*h*.0014))
        assert n>=limit,('Decoded but missing rendered pixels',cut,selector,n,limit,box)
    return actual
def check(browser,route,tap,homepage,out,outer):
    for case,w,h,mobile,muted,deny in [('PC-sound',1440,900,False,False,False),('M-blocked',390,844,True,False,True),('M-muted',390,844,True,True,False)]:
        ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
        route(ctx);prepare(ctx)
        if deny:ctx.add_init_script('globalThis.act6EndingDeny=true')
        # Reduced motion is an independent browser presentation setting.
        page=ctx.new_page();errors=[];packets=[];motion={};raster={}
        if muted:page.emulate_media(reduced_motion='reduce')
        page.on('pageerror',lambda err:errors.append(str(err)))
        page.on('request',lambda req:packets.append(req.url) if 'act6-qa-chapter-' in req.url else None)
        try:
            page.goto(homepage,wait_until='domcontentloaded',timeout=45000)
            page.wait_for_function("globalThis.HonroApp?.screen==='title'&&!!globalThis.HONRO_READY",timeout=45000)
            page.evaluate("async()=>await globalThis.HONRO_READY")
            def menu():
                tap(page,'#app [data-action=settings]',mobile)
                tap(page,'#modal [data-action=settings-page][data-id=records]',mobile)
                tap(page,'#modal [data-action=settings-page][data-id=debug]',mobile)
            menu()
            assert not page.locator('#modal [data-action="debug-act-ending-preview"][data-id="60"]').count()
            # Playing the preview is not allowed until the ordinary user toggle.
            tap(page,'#debug-mode-setting',mobile)
            page.wait_for_function("HonroApp.debugMode&&HonroApp.profile!==HonroApp.normalProfile")
            # A fresh debug rest may already have a tutorial. Close those
            # authored screens normally before opening the settings again.
            for _ in range(24):
                if not page.evaluate('!!HonroApp.dialogue'):break
                page.wait_for_timeout(270);tap(page,'[data-action=dialogue-next]',mobile)
            menu()
            if muted:page.evaluate("()=>HonroApp.profile.settings.music=false") # only an unsaved setting fixture, never a save write
            stage='#modal [data-action="debug-act-ending-preview"][data-id="60"]'
            snapshot="""()=>JSON.stringify({
              local:Object.entries(localStorage).sort(), session:Object.entries(sessionStorage).sort(),
              profile:HonroApp.profile,original:HonroApp.normalProfile,
              battle:HonroApp.engine?.b??null, stage:HonroApp.stageId,rest:HonroApp.debugRestStage??null
            })"""
            before=page.evaluate(snapshot);screen=page.evaluate('HonroApp.screen')
            tap(page,stage,mobile)
            assert page.locator(ROOT).is_visible()
            assert not page.evaluate('!!HonroApp.engine')
            for cut in ['last-souls','bridge-record','daybreak','homecoming','jeomungol-record','later-return']:
                view=page.locator(ROOT+f'[data-cut="{cut}"]')
                view.wait_for(state='visible',timeout=8000)
                if cut in ('last-souls','bridge-record','daybreak','later-return'):
                    page.wait_for_function("()=>document.querySelector('.honro-ending-60[data-mode=debug] img')?.naturalWidth>0",timeout=10000)
                if cut=='bridge-record':
                    assert page.evaluate('act6EndingMedia.length')==0
                    tap(page,ROOT+' [data-ending-action=next]',mobile)
                    assert '박문돌' in view.inner_text()
                if cut=='homecoming':
                    assert view.locator('.h6ending-ferry path').count()>=4 and view.locator('.h6ending-sack path').count()==2
                    hero=view.locator('.h6ending-seol');hero.wait_for(state='visible')
                    page.wait_for_function("()=>['.h6ending-seol','.h6ending-yeonsil','.h6ending-naru .h6ending-backdrop img'].every(s=>document.querySelector(s)?.naturalWidth>0)",timeout=10000)
                    assert view.locator('.h6ending-backdrop img').evaluate("e=>e.currentSrc.includes('act6-ending-shore-dawn'+(innerWidth/innerHeight<.95?'-m.':'.'))")
                    name=view.locator('.h6ending-ferry-arrival').evaluate("e=>getComputedStyle(e).animationName")
                    assert name==('none' if muted else 'h6naru-arrive')
                    motion['boat']=name
                if cut=='jeomungol-record':
                    assert view.locator('.h6ending-evidence-slip dt').all_text_contents()==['폐쇄 승인','학살','은폐']
                    page.wait_for_function("()=>['.h6ending-hwi','.h6ending-ledger .h6ending-backdrop img'].every(s=>document.querySelector(s)?.naturalWidth>0)",timeout=10000)
                    assert view.locator('.h6ending-backdrop img').evaluate("e=>e.currentSrc.includes('act6-ending-dossier-room'+(innerWidth/innerHeight<.95?'-m.':'.'))")
                    name=view.locator('.h6ending-evidence-slip').nth(2).evaluate("e=>getComputedStyle(e).animationName")
                    assert name==('none' if muted else 'h6fold-proof')
                    motion['evidence']=name
                if cut=='daybreak':
                    if muted:assert not page.evaluate('act6EndingMedia.length')
                    elif deny:
                        btn=view.get_by_role('button',name='곡 재생',exact=True)
                        btn.wait_for(state='visible')
                        page.evaluate("act6EndingDeny=false");tap(page,ROOT+' [data-ending-action=listen]',mobile)
                    if not muted:
                        page.wait_for_function("()=>act6EndingMedia.length===1&&act6EndingMedia[0].el.readyState>=2&&!act6EndingMedia[0].el.paused",timeout=10000)
                        assert page.evaluate("()=>act6EndingMedia[0].el.currentSrc.endsWith('/honro/assets/bgm/main.mp3')&&!act6EndingMedia[0].el.loop&&HonroApp.audio.music.paused")
                if cut in ('homecoming','jeomungol-record'):
                    page.screenshot(path=out/f'{case}-preview-{cut}-first.png')
                    raster[cut]=actual_pixels(page,view,cut)
                page.screenshot(path=out/f'{case}-preview-{cut}.png',animations='disabled')
                assert before==page.evaluate(snapshot),cut
                tap(page,ROOT+' [data-ending-action=next]',mobile)
            assert page.locator(ROOT+'[data-cut="credits"]').is_visible()
            if not muted:assert page.evaluate("()=>!act6EndingMedia[0].el.paused&&!act6EndingMedia[0].el.ended")
            tap(page,ROOT+' [data-ending-action=return]',mobile)
            page.locator(stage).wait_for(state='visible')
            assert before==page.evaluate(snapshot) and page.evaluate('HonroApp.screen')==screen
            assert not page.locator(ROOT).count() and (muted or page.evaluate("()=>act6EndingMedia[0].el.paused"))
            assert not packets and not errors,(errors,packets)
            outer[case]={'scenes':6,'storageByteIdentical':True,'noEngineNoRewardsNoPacket':True,'temporaryMusic':not muted,'fallbackRetried':deny,'animationNames':motion,'actualArtAndOfficialCast':True,'compositedRasterPixels':raster}
        finally:ctx.close()
