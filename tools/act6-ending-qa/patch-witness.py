"""Prepare the isolated appellate QA fixtures from the previously sealed witness."""
from pathlib import Path
import sys
t=Path(sys.argv[1])
def patch(file,edits):
 p=t/file;s=p.read_text()
 for a,b,n in edits:
  assert s.count(a)==n,(file,a,s.count(a),n)
  s=s.replace(a,b)
 p.write_text(s)
patch('smoke.py',[
 ('from normal52_witness import stage52','from debug_ui import check as ending_debug,prepare as ending_prepare\nfrom normal52_witness import stage52',1),
 ("    if RELEASE_SHAPE and arm=='ON': route_only_local_release(ctx)","    if RELEASE_SHAPE and arm=='ON':\n        route_only_local_release(ctx)\n        ending_prepare(ctx)",1),
 ("        for label,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:","        audio_only=os.environ.get('HONRO_ACT6_ENDING_AUDIO_ONLY')=='1'\n        viewports=[('PC',1440,900,False)] if audio_only else [('PC',1440,900,False),('M',390,844,True)]\n        for label,w,h,mobile in viewports:",1),
 ("            for arm,kind in [('OFF','fresh-pending'),('ON','fresh-pending'),('ON','legacy-format')]:","            arms=[('ON','fresh-pending')] if audio_only else [('OFF','fresh-pending'),('ON','fresh-pending'),('ON','legacy-format')]\n            for arm,kind in arms:",1),
 ('        browser.close()','        if RELEASE_SHAPE and not audio_only:\n            debug={}\n            ending_debug(browser,route_only_local_release,tap,RELEASE_ORIGIN+\'/honro/HONRO.html\',out,debug)\n            (out/\'DEBUG-ENDING.json\').write_text(json.dumps(debug,ensure_ascii=False,indent=2)+\'\\n\')\n        browser.close()',1)
])
patch('normal60_ending_stock.py',[
 ('from urllib.parse import urlsplit','from urllib.parse import urlsplit\nfrom debug_ui import actual_pixels',1),
 ("    cuts=[('last-souls','계속','canvas')",'''    def audio():
        return page.evaluate("""()=>{ const a=globalThis.act6EndingMedia?.[0]?.el,m=HonroApp.audio?.music;
          if(!a||!m)return null;
          return {src:a.currentSrc,time:a.currentTime,playing:!a.paused&&!a.ended&&!a.muted&&a.volume>0,
            ready:a.readyState,loop:a.loop,stockPaused:m.paused&&[m.current,m.outgoing].every(x=>!x||x.paused),
            same:a===globalThis.__normalEndingTrack,streams:act6EndingMedia.length};}""")
    def sounding(same=False):
        for _ in range(24):
            info=audio()
            if info and info['playing'] and info['ready']>=2 and (not same or info['same']):break
            page.wait_for_timeout(100)
        assert info and info['playing'] and info['ready']>=2 and info['stockPaused'] and not info['loop'] and info['streams']==1, info
        assert info['src'].endswith('/honro/assets/bgm/main.mp3')
        if same: assert info['same']
        return info
    def advances(before,same=False):
        for _ in range(24):
            page.wait_for_timeout(100)
            info=sounding(same)
            if info['time']-before['time']>=.15: return info
        raise AssertionError(('Ending track time did not advance',before,info))
    cuts=[('last-souls','계속','canvas')''',1),
 ("        page.screenshot(path=out/f'{case}-ending-{cut}.png',animations='disabled')","        if cut not in ('homecoming','jeomungol-record'):\n            page.screenshot(path=out/f'{case}-ending-{cut}.png',animations='disabled')",1),
 ("    ending=page.locator(root)","    ending=page.locator(root)\n    main=root+' button.honro-ending-60-button:not([data-ending-action]),'+root+' button[data-ending-action=next]'",1),
 ("('daybreak','계속','img'),('later-return','여정을 마치기','canvas')]",
  "('daybreak','계속','img'),('homecoming','계속','.h6ending-naru'),('jeomungol-record','계속','.h6ending-ledger'),('later-return','여정을 마치기','canvas')]",1),
 ("tap(page,root+' button.honro-ending-60-button',mobile)","tap(page,main,mobile)",3),
 ("        if cut=='later-return':","""        if cut=='daybreak' and os.environ.get('HONRO_ACT6_ENDING_AUDIO_ONLY')=='1':
            start=sounding()
            page.evaluate("()=>{globalThis.__normalEndingTrack=act6EndingMedia[0].el}")
            state['endingNormalAudio']={'dawnStart':start,'dawnAdvanced':advances(start,True)}
        if cut=='homecoming':
            assert ending.locator('.h6ending-ferry path').count()>=4 and ending.locator('.h6ending-sack path').count()==2
            assert '큰애는 아직' in ending.inner_text()
            page.wait_for_function("()=>['.h6ending-seol','.h6ending-yeonsil','.h6ending-naru .h6ending-backdrop img'].every(s=>document.querySelector(s)?.naturalWidth>0)",timeout=10000)
            assert ending.locator('.h6ending-backdrop img').evaluate("e=>e.currentSrc.includes('act6-ending-shore-dawn'+(innerWidth/innerHeight<.95?'-m.':'.'))")
            assert ending.locator('.h6ending-ferry-arrival').evaluate("e=>getComputedStyle(e).animationName")=='h6naru-arrive'
        if cut=='jeomungol-record':
            assert all(ending.get_by_text(name,exact=False).count()>0 for name in ['왕실 고관','대도사','한태록'])
            assert ending.locator('.h6ending-evidence-slip').count()==3
            page.wait_for_function("()=>['.h6ending-hwi','.h6ending-ledger .h6ending-backdrop img'].every(s=>document.querySelector(s)?.naturalWidth>0)",timeout=10000)
            assert ending.locator('.h6ending-backdrop img').evaluate("e=>e.currentSrc.includes('act6-ending-dossier-room'+(innerWidth/innerHeight<.95?'-m.':'.'))")
            assert ending.locator('.h6ending-evidence-slip').nth(2).evaluate("e=>getComputedStyle(e).animationName")=='h6fold-proof'
        if cut in ('homecoming','jeomungol-record'):
            page.screenshot(path=out/f'{case}-ending-{cut}-first.png')
            state.setdefault('endingVisibleLayers',{})[cut]=actual_pixels(page,ending,cut,clock=True)
            page.screenshot(path=out/f'{case}-ending-{cut}.png',animations='disabled')
        if cut=='later-return':""",1),
 ("    assert not ending.locator('button').count()",
  """    assert ending.get_attribute('data-cut')=='credits'
    assert ending.get_by_role('button',name='타이틀로 돌아가기',exact=True).is_enabled()
    assert page.evaluate("()=>act6EndingMedia.length===1&&!act6EndingMedia[0].el.loop&&act6EndingMedia[0].el.currentSrc.endsWith('/honro/assets/bgm/main.mp3')")
    if os.environ.get('HONRO_ACT6_ENDING_AUDIO_ONLY')=='1':
        after=sounding(True)
        assert after['time']>state['endingNormalAudio']['dawnAdvanced']['time']
        state['endingNormalAudio'].update({'creditsStart':after,'creditsAdvanced':advances(after,True)})
    page.screenshot(path=out/f'{case}-ending-credits.png',animations='disabled')
    tap(page,root+' [data-ending-action=return]',mobile)
    page.wait_for_function("HonroApp.screen==='title'")
    assert raw(page)==written and normal(page)==original and not ending.count()""",1)
])
