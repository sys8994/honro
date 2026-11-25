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
 ('        browser.close()','        if RELEASE_SHAPE:\n            debug={}\n            ending_debug(browser,route_only_local_release,tap,RELEASE_ORIGIN+\'/honro/HONRO.html\',out,debug)\n            (out/\'DEBUG-ENDING.json\').write_text(json.dumps(debug,ensure_ascii=False,indent=2)+\'\\n\')\n        browser.close()',1)
])
patch('normal60_ending_stock.py',[
 ("    ending=page.locator(root)","    ending=page.locator(root)\n    main=root+' button.honro-ending-60-button:not([data-ending-action]),'+root+' button[data-ending-action=next]'",1),
 ("('daybreak','계속','img'),('later-return','여정을 마치기','canvas')]",
  "('daybreak','계속','img'),('homecoming','계속','.h6ending-naru'),('jeomungol-record','계속','.h6ending-ledger'),('later-return','여정을 마치기','canvas')]",1),
 ("tap(page,root+' button.honro-ending-60-button',mobile)","tap(page,main,mobile)",3),
 ("        if cut=='later-return':","""        if cut=='homecoming':
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
        if cut=='later-return':""",1),
 ("    assert not ending.locator('button').count()",
  """    assert ending.get_attribute('data-cut')=='credits'
    assert ending.get_by_role('button',name='타이틀로 돌아가기',exact=True).is_enabled()
    assert page.evaluate("()=>act6EndingMedia.length===1&&!act6EndingMedia[0].el.loop&&act6EndingMedia[0].el.currentSrc.endsWith('/honro/assets/bgm/main.mp3')")
    page.screenshot(path=out/f'{case}-ending-credits.png',animations='disabled')
    tap(page,root+' [data-ending-action=return]',mobile)
    page.wait_for_function("HonroApp.screen==='title'")
    assert raw(page)==written and normal(page)==original and not ending.count()""",1)
])
