"""Real Chromium title layout checks. Run with HONRO_BASE_URL for deployed Pages.
Profile fixtures cover title branches only; this is not normal campaign proof.
"""
import json, os
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT=ROOT/'_local/reports/title-ashen/browser'
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('HONRO_BASE_URL','')
checks=[]
with sync_playwright() as pw:
    browser=launch(pw)
    for w,h in [(1440,900),(400,800),(333,740),(333,592),(844,390),(667,333)]:
        page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
        page.goto(BASE.rstrip('/')+'/HONRO.html' if BASE else (ROOT/'HONRO.html').as_uri())
        page.wait_for_function('window.HonroApp && document.querySelector(".title-brand")')
        page.evaluate('''()=>{const a=HonroApp;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.honroJourney={story:{id:'layout-fixture'}};a.profile.honroBattle={stageId:1};a.showTitle()}''')
        page.wait_for_function('Array.from(document.querySelectorAll(".honro-title img")).every(i=>i.complete&&i.naturalWidth>0)')
        result=page.evaluate('''()=>{
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
          const hanja=rect(document.querySelector('.title-hanja')),hangul=rect(document.querySelector('.title-hangul'));
          const mark=rect(document.querySelector('.honro-logo-wrap')),tag=rect(document.querySelector('.title-tagline')),actions=rect(document.querySelector('.title-actions')),footer=rect(document.querySelector('.footer'));
          const buttons=[...document.querySelectorAll('.honro-title button')].map(rect),syllables=[...document.querySelectorAll('.title-reading-glyph')].map(rect);
          return {mark,hanja,hangul,tag,actions,footer,buttons,syllables,ink:getComputedStyle(document.querySelector('.title-brand')).filter,overflow:document.documentElement.scrollWidth>innerWidth,portrait:matchMedia('(orientation:portrait)').matches,source:document.querySelector('.title-painting img').currentSrc.slice(0,30),animation:getComputedStyle(document.querySelector('.title-main')).animationName};
        }''')
        assert not result['overflow'],(w,h,result)
        assert result['hangul']['x'] >= result['hanja']['x']+result['hanja']['w']*.95,(w,h,result)
        assert result['hangul']['y'] > result['hanja']['y']+result['hanja']['h']*.5,(w,h,result)
        assert result['hangul']['right'] <= w,(w,h,result)
        assert len(result['syllables'])==2 and abs(result['syllables'][0]['x']-result['syllables'][1]['x'])<1,(w,h,result)
        assert result['syllables'][0]['bottom'] <= result['syllables'][1]['y']+1,(w,h,result)
        assert 'honro-title-ink' in result['ink']
        assert page.locator('.title-brand').get_attribute('aria-label') == '혼로'
        assert page.locator('.title-tagline').inner_text() == '떠나지 못한 이들을 위한 길.'
        assert page.locator('.honro-logo-hanja').count()==1 and page.locator('.honro-logo-hangul').count()==2
        assert page.locator('.title-roman').count()==0
        assert result['mark']['bottom']<=result['tag']['y']+1,(w,h,result)
        assert result['tag']['bottom']<result['actions']['y'],(w,h,result)
        assert result['actions']['bottom']<=result['footer']['y'],(w,h,result)
        assert all(b['x']>=0 and b['right']<=w+1 and b['y']>=0 and b['bottom']<=h+1 and b['h']>=44 for b in result['buttons']),(w,h,result)
        assert result['animation']=='none'
        page.keyboard.press('ArrowDown')
        assert page.locator('.title-actions button').nth(0).evaluate('(b)=>b===document.activeElement')
        page.keyboard.press('ArrowDown')
        assert page.locator('.title-actions button').nth(1).evaluate('(b)=>b===document.activeElement')
        page.screenshot(path=str(OUT/f'{w}x{h}.png'))
        page.locator('[data-action="settings"]').click()
        assert page.locator('#modal').evaluate('(m)=>m.classList.contains("open")')
        page.keyboard.press('Escape')
        assert not page.locator('#modal').evaluate('(m)=>m.classList.contains("open")')
        page.locator('[data-action="journal"]').click()
        page.keyboard.press('Escape')
        page.evaluate('HonroApp.showTitle()')
        before_failure=page.locator('.honro-logo-wrap').bounding_box()
        page.locator('.honro-logo-hanja').evaluate('(i)=>i.onerror()')
        assert page.locator('.title-logo-fallback').is_visible()
        assert page.locator('.title-logo-fallback').inner_text()=='魂路'
        page.locator('.honro-logo-hangul').evaluate_all('(images)=>images.forEach(i=>i.onerror())')
        assert all(page.locator('.title-reading-fallback').nth(i).is_visible() for i in range(2))
        assert page.locator('.title-reading-fallback').all_inner_texts()==['혼','로']
        after_failure=page.locator('.honro-logo-wrap').bounding_box()
        assert abs(before_failure['height']-after_failure['height']) < 1,(before_failure,after_failure)
        page.locator('.title-painting img').evaluate('(i)=>i.onerror()')
        assert page.locator('.title-actions button').nth(0).is_visible()
        page.screenshot(path=str(OUT/f'{w}x{h}-art-failure.png'))
        checks.append({'viewport':[w,h],**result})
        page.close()
    browser.close()
(OUT/'report.json').write_text(json.dumps({'checks':checks,'limits':['Fixture save branches; not normal gameplay. Art approval requires direct image review.']},ensure_ascii=False,indent=2)+'\n')
print('PASS six title viewports, focus, settings/journal return, image failure; see screenshots for art approval')
