"""Real Chromium regression for edge-filled skill frames and unchanged controls.
Run frame/state/responsive separately for focused pixel reviews, then final.
"""
import hashlib, json, subprocess, sys
from playwright.sync_api import sync_playwright
from browser_support import launch, ROOT, serve_game

MODE = sys.argv[1] if len(sys.argv) > 1 else 'final'
assert MODE in ['frame', 'state', 'responsive', 'final']
OUT = ROOT / 'game/docs/skill-icon-edge-buttons/evidence'
OUT.mkdir(parents=True, exist_ok=True)
rows, errors = [], []

def check(name, value, data=None):
    rows.append({'검사': name, '통과': bool(value), '측정': data})
    assert value, (name, data)

def settle(p):
    p.wait_for_function('HonroSkillImages.status().active===0&&HonroSkillImages.status().queued===0')
    p.wait_for_timeout(100)

def shot(p, name):
    settle(p)
    f = OUT / f'{MODE}-{name}.jpg'
    p.screenshot(path=str(f), type='jpeg', quality=87)
    assert f.stat().st_size < 1_000_000

PROFILE = """()=>{const a=HonroApp,C=HONRO_CORE;a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.profile.recruited=['archer','knight','mage','occultist'];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=C.xpAtLevel(30);for(const t of C.TALENTS.filter(n=>n.cls===cls))a.profile.heroes[cls].ranks[t.id]=1;}a.profile.loadouts.archer=['A01','A14','A02','A08'];a.showCamp('archer')}"""
FRAME = """es=>es.map(e=>{const a=e.querySelector('.skill-art'),img=a.querySelector('img'),r=e.getBoundingClientRect(),ar=a.getBoundingClientRect(),ir=img.getBoundingClientRect(),s=getComputedStyle(e),as=getComputedStyle(a);const b=parseFloat(s.borderLeftWidth);return {id:a.dataset.skillIcon,radius:s.borderRadius,border:s.borderColor,padding:s.padding,margin:as.margin,frame:[r.width,r.height],art:[ar.width,ar.height],gap:[ar.left-r.left-b,ar.top-r.top-b,r.right-b-ar.right,r.bottom-b-ar.bottom],imageState:a.dataset.imageState,imageGap:a.dataset.imageState==='ready'?[ir.left-ar.left,ir.top-ar.top,ar.right-ir.right,ar.bottom-ir.bottom]:[],imageRadius:getComputedStyle(img).borderRadius}})"""
CONTROLS = """()=>Object.fromEntries(['#joystick','#fire','#jump','#drop','[data-action=defend]','#battle-bottom','#battlecanvas',...Array.from({length:4},(_,i)=>'#combat-skills .skill-button:nth-child('+(i+1)+')')].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return[s,[r.x,r.y,r.width,r.height]]}))"""

def frames(p, selector, name):
    settle(p)
    data = p.locator(selector).evaluate_all(FRAME)
    check(name, len(data)>0 and all(x['radius']=='0px' and x['imageRadius']=='0px' and x['padding']=='0px' and x['margin']=='0px' and max(map(abs,x['gap']+x['imageGap']))<.6 for x in data), data)

def training(p):
    p.evaluate('HonroApp.startTraining()')
    p.wait_for_selector('.training-dialog')
    p.locator('[data-training-action=apply]').tap()
    p.wait_for_selector('#combat-skills .skill-button')
    hud(p)

def hud(p, ids=None, focus=10000):
    ids = ids or ['A01','A14','A02','A08']
    p.evaluate("o=>{const a=HonroApp,u=a.engine.active;u.loadout=o.ids;u.ranks={...u.ranks,...Object.fromEntries(o.ids.map(id=>[id,1]))};u.focus=o.focus;u.cooldowns={};a.selected=o.ids[1];a.selectedByUnit[u.id]=a.selected;a.updateHUD(true)}", {'ids':ids,'focus':focus})
    settle(p)

with sync_playwright() as pw, serve_game() as base:
    b=launch(pw)
    p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate(PROFILE)
    if MODE in ['frame','final']:
        for cls in ['archer','knight','mage','occultist']:
            p.evaluate('(cls)=>HonroApp.showCamp(cls)',cls)
            p.locator('.equipped-panel').scroll_into_view_if_needed()
            frames(p,'.slot-card .skill-stamp','출전 슬롯 내부 채움 '+cls)
            if cls=='archer': shot(p,'camp-slots-390')
            p.locator('.passive-summary').scroll_into_view_if_needed();settle(p)
            data=p.locator('.passive-chip>.skill-art').evaluate_all("es=>es.map(e=>({radius:getComputedStyle(e).borderRadius,ready:e.dataset.imageState,padding:getComputedStyle(e).padding}))")
            check('상시 기예 단일 사각 프레임 '+cls,all(x['radius']=='0px' and x['ready']=='ready' and x['padding']=='0px' for x in data) and len(data)==5,data)
            if cls=='archer':shot(p,'passives-390')
            for branch in range(4):
                p.evaluate('o=>{HonroApp.branch=o.branch;HonroApp.showCamp(o.cls)}',{'cls':cls,'branch':branch})
                p.locator('.tree-grid').scroll_into_view_if_needed()
                frames(p,'.branch.mobile-current .skill-stamp','기예 트리 내부 채움 '+cls+' '+str(branch))
                if cls=='archer' and branch==0:shot(p,'tree-390')
        # Every supplied icon's real detail header uses the same filled stamp.
        inventory=json.loads((ROOT/'game/docs/skill-icons-v1/inventory.json').read_text())
        for skill in inventory['skills']:
            p.evaluate('id=>HonroApp.talent(id)',skill['id'])
            p.wait_for_function("id=>document.querySelector('.skill-modal-title [data-skill-icon='+id+']')?.dataset.imageState==='ready'",arg=skill['id'])
            frames(p,'.skill-modal-title .skill-stamp','상세 '+skill['id'])
            if skill['id'] in ['A14','A02','AP01']:shot(p,'detail-'+skill['id']+'-390')
            p.evaluate('HonroApp.close()')
        p.evaluate("HonroApp.showCamp('archer')")
        p.locator('[data-action=slot][data-slot="1"]').tap()
        frames(p,'.loadout-compare-card .skill-stamp,.equip-option .skill-stamp','장착 비교 및 목록')
        shot(p,'equip-390');p.evaluate('HonroApp.close()')
        training(p);frames(p,'#combat-skills .skill-button','전투 이미지가 버튼 내부 전체 채움');shot(p,'hud-390')
    if MODE in ['state','final']:
        p.evaluate("()=>{const a=HonroApp,h=a.profile.heroes.archer;h.xp=0;h.ranks.A14=0;a.branch=HONRO_CORE.TALENT_MAP.A14.branch;a.showCamp('archer')}")
        locked=p.locator('.tree-node[data-talent=A14]');locked.scroll_into_view_if_needed()
        check('미해금 기예 설명 접근 가능', 'locked' in locked.get_attribute('class') and not locked.is_disabled())
        locked.tap();p.wait_for_selector('.skill-modal-body');check('잠금 시 수련 비활성',p.locator('[data-action=train]').is_disabled());shot(p,'locked-detail-390')
        p.evaluate('HonroApp.close()');p.evaluate(PROFILE)
        p.locator('.passive-summary').scroll_into_view_if_needed();button=p.locator('.passive-chip').first
        button.focus();p.keyboard.press('Tab');p.keyboard.press('Shift+Tab')
        check('패시브 키보드 포커스',button.evaluate("e=>e===document.activeElement&&e.matches(':focus-visible')"));shot(p,'passive-focus-390')
        p.keyboard.press('Enter');check('Enter로 상시 상세 열기',p.locator('.passive-detail').count()==1);p.evaluate('HonroApp.close()')
        training(p)
        selected=p.locator('#combat-skills [data-skill=A14]')
        check('선택 상태 및 단축키/이름/MP 유지',selected.get_attribute('aria-pressed')=='true' and selected.locator('.key').inner_text()=='2' and selected.locator('.skill-name').inner_text()!='' and selected.locator('.mana-cost').inner_text()!='',selected.evaluate("e=>({pressed:e.getAttribute('aria-pressed'),key:e.querySelector('.key').textContent,name:e.querySelector('.skill-name').textContent,mp:e.querySelector('.mana-cost').textContent,selected:HonroApp.selected})"))
        selected.focus();p.keyboard.press('ArrowLeft')
        check('전투 포커스 테두리',selected.evaluate("e=>e.matches(':focus-visible')&&getComputedStyle(e).outlineStyle==='solid'"));shot(p,'hud-focus-390')
        p.keyboard.press('Digit3');check('숫자 단축키 선택',p.evaluate('HonroApp.selected')=='A02')
        p.locator('#combat-skills [data-skill=A14]').tap();check('터치 선택',p.evaluate('HonroApp.selected')=='A14')
        hud(p,focus=0);check('기력 부족 점선 프레임',p.locator('#combat-skills [data-skill=A14]').evaluate("e=>e.classList.contains('unaffordable')&&getComputedStyle(e).borderStyle==='dashed'&&getComputedStyle(e).opacity==='1'"));shot(p,'hud-unaffordable-390')
        p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.focus=10000;HONRO_CORE.SKILLS.A14.cooldown=2;u.cooldowns.A14=a.engine.b.round+2;a.updateHUD(true)}")
        check('재사용 회수 가독성',p.locator('#combat-skills [data-skill=A14] .mana-cost').inner_text()=='2회');shot(p,'hud-cooldown-390');p.evaluate('delete HONRO_CORE.SKILLS.A14.cooldown')
        # Real warrior restriction path: only sword skills after a follow-up landing.
        hud(p,['S00','S03','S13','S11']);p.evaluate("()=>{const a=HonroApp,u=a.engine.active;u.cls='knight';u.meleeFollow='ready';a.updateHUD(true)}")
        check('비활성 네이티브 버튼',p.locator('#combat-skills [data-skill=S13]').is_disabled() and not p.locator('#combat-skills [data-skill=S00]').is_disabled());shot(p,'hud-disabled-390')
        p.evaluate("HonroApp.engine.active.meleeFollow=undefined;HonroApp.engine.active.cls='archer'");hud(p)
        p.evaluate("HonroApp.engine.active.loadout[3]='';HonroApp.updateHUD(true)");check('빈 슬롯 비활성 보존',p.locator('#combat-skills .empty').is_disabled());shot(p,'hud-empty-390');hud(p)
        # Genuine 404, cold page and untouched loader: SVG and labels survive.
        q=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        q.route('**/skill-icon-A14.*.webp',lambda r:r.fulfill(status=404,body='deliberate test failure'))
        q.goto(base+'/HONRO.html');q.wait_for_function('window.HonroApp');q.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A14')")
        q.wait_for_function("document.querySelector('.skill-modal-title [data-skill-icon=A14]').dataset.imageState==='error'")
        check('네트워크 실패 SVG 폴백',q.locator('.skill-modal-title [data-skill-icon=A14] svg').is_visible());shot(q,'fallback-detail-390')
        training(q);q.wait_for_function("document.querySelector('#combat-skills [data-skill-icon=A14]').dataset.imageState==='error'")
        check('전투 폴백/이름 보존',q.locator('#combat-skills [data-skill-icon=A14] svg').is_visible() and q.locator('#combat-skills [data-skill=A14] .skill-name').is_visible());shot(q,'fallback-hud-390');q.close()
    if MODE in ['responsive','final']:
        p.evaluate(PROFILE);training(p)
        original_css=subprocess.check_output(['git','show','0a9acf40396452e2f424cd9731f8f91f3478da03:game/src/skill-icons.css'],cwd=ROOT,text=True)
        for w,h in [(390,844),(844,390),(360,800),(1280,900)]:
            p.set_viewport_size({'width':w,'height':h});hud(p)
            before=p.evaluate(CONTROLS)
            p.locator('link[href*="game-src-skill-icons"]').evaluate_all('es=>es.forEach(e=>e.disabled=true)')
            old=p.add_style_tag(content=original_css);baseline=p.evaluate(CONTROLS);old.evaluate('e=>e.remove()')
            p.locator('link[href*="game-src-skill-icons"]').evaluate_all('es=>es.forEach(e=>e.disabled=false)')
            check(f'{w} 기존 조작/전장 위치와 크기 동일',before==baseline,{'변경후':before,'기준':baseline})
            frames(p,'#combat-skills .skill-button',f'{w} 이미지 가장자리')
            check(f'{w} 버튼 터치 영역',all(r[2]>=44 and r[3]>=44 for s,r in before.items() if '.skill-button' in s))
            shot(p,f'hud-{w}')
            p.locator('#combat-skills [data-skill=A02]').tap();check(f'{w} 스킬 터치',p.evaluate('HonroApp.selected')=='A02')
            joy=p.locator('#joystick').bounding_box();fire=p.locator('#fire').bounding_box()
            check(f'{w} 조이스틱/발사와 스킬 비중첩',all(r[0]>=joy['x']+joy['width'] and r[0]+r[2]<=fire['x'] for s,r in before.items() if '.skill-button' in s),before)
            cdp=p.context.new_cdp_session(p)
            def touch(kind,x,y):
                cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if kind=='touchEnd' else [{'x':x,'y':y}]})
            jx,jy=joy['x']+joy['width']/2,joy['y']+joy['height']/2
            touch('touchStart',jx,jy);touch('touchMove',jx+12,jy-8)
            check(f'{w} 실제 터치 조이스틱 잡기',p.evaluate('HonroApp.stickPointer!==null'))
            touch('touchEnd',jx+12,jy-8);check(f'{w} 조이스틱 해제',p.evaluate('HonroApp.stickPointer===null'))
            fx,fy=fire['x']+fire['width']/2,fire['y']+fire['height']/2
            touch('touchStart',fx,fy);check(f'{w} 발사 버튼 충전 입력',p.evaluate('HonroApp.charging'))
            touch('touchEnd',fx,fy);check(f'{w} 발사 버튼 해제',p.evaluate('!HonroApp.charging'))
            cdp.detach()
            p.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A14')")
            frames(p,'.skill-modal-title .skill-stamp',f'{w} 상세 프레임')
            p.locator('.skill-modal-body').evaluate('e=>e.scrollTop=e.scrollHeight')
            check(f'{w} 상세 닫기 조작 및 화면 내부',p.locator('.skill-detail-controls [data-action=close]').evaluate("e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}"))
            shot(p,f'detail-{w}');p.locator('.skill-detail-controls [data-action=close]').tap()
            p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.locator('[data-training-action=apply]').tap();hud(p)
    check('실행 중 자바스크립트 오류 없음',not errors,errors)
    result={'검수':MODE,'소스_SHA':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'아이콘_CSS_SHA256':hashlib.sha256((ROOT/'game/src/skill-icons.css').read_bytes()).hexdigest(),'브라우저':'Chromium '+b.version,'범위':'실제 로컬 프로덕션 빌드. 준비한 프로필과 허공터 사용. 캠페인 완주/실기기 검수가 아님.','결과':rows}
    (OUT/f'{MODE}-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    b.close()
print(f'PASS {MODE}: {len(rows)} checks')
