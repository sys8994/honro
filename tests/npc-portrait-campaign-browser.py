"""Readiness, identity and mobile/PC composition on the actual dialogue reader.
The Act 6 test uses actual event interactions at verified grounded positions.
The regular-stage cohort supplies canonical scene rows and does not claim campaign completions.
"""
import json, mimetypes, re, sys
from pathlib import Path
from urllib.parse import urlparse, unquote
from playwright.sync_api import sync_playwright
from browser_support import launch, ROOT
OUT=ROOT/'_local/reports/npc-portrait-campaign-v4'; OUT.mkdir(exist_ok=True,parents=True)
CONFIG=json.loads((ROOT/'game/config/npc-portraits.json').read_text())
def assets(route):
    sub=unquote(urlparse(route.request.url).path).removeprefix('/honro/').lstrip('/')
    target=(ROOT/(sub or 'index.html')).resolve()
    if not target.is_relative_to(ROOT) or not target.is_file():
        route.fulfill(status=404,body='local fixture unavailable');return
    route.fulfill(status=200,path=target,content_type=mimetypes.guess_type(target)[0] or 'application/octet-stream')
def canonical(n,who,rid):
    reviewed=json.loads((ROOT/f'shared/data/reviewed/act23-v4-ch{n}.json').read_text())
    row=next(r for r in reviewed['rows']+reviewed.get('familyRestoration',{}).get('rows',[]) if r['id']==rid)
    assert row.get('speaker',row.get('speaker_channel','').split(' · ')[0])==who
    return [who,row['text'],{**row,'rowId':rid,'kind':'character'}]
def ready(page,aid,name):
    page.wait_for_selector('#story-portrait-canvas[data-portrait-state="ready"]',timeout=18000)
    row=page.evaluate("""({aid,name})=>{
      const d=HonroApp.dialogue,[who,,meta]=d.lines[d.index], v=HonroNPCPortraits.resolve(HonroApp,who,meta,null),
      c=document.querySelector('#story-portrait-canvas'),b=document.querySelector('.dialogue-scene'),
      title=b.querySelector('.story-speaker-name').textContent;
      const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      const dims=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,h:r.height,w:r.width};};
      const actions=[...b.querySelectorAll('button')].map(e=>{
        const q=dims(e);return{inside:q.x>=0&&q.right<=innerWidth+.1&&q.y>=0&&q.bottom<=innerHeight+.1,hit:e.disabled||document.elementFromPoint(q.x+q.w/2,q.y+q.h/2)?.closest('button')===e};});
      return {stage:HonroApp.stage.id,aid:v?.id,src:v?.src,who,title,row:meta?.rowId,canvas:dims(c),
        line:dims(document.querySelector('#story-line')),actions,state:c.dataset.portraitState,
        sourceLoaded:performance.getEntriesByName(v?.src??'missing').some(x=>x.transferSize>=0),alpha:p.some((v,k)=>k%4===3&&v>180),
        topAlpha:p.slice(3,c.width*4).filter((_,k)=>k%4===0).some(v=>v>16)};}""",{'aid':aid,'name':name})
    assert row['aid']==aid and row['who']==name and row['title']==name and row['alpha'] and not row['topAlpha'],row
    assert row['canvas']['w']>0 and row['canvas']['h']>0 and row['src'] and all(q['hit'] and q['inside'] for q in row['actions']),row
    return row

def open_stage(page,n):
    page.evaluate('n=>{const a=HonroApp;a.setDebugMode(true);HonroRestJourney.showBook(a,n,null,Math.ceil(n/10));}',n)
    page.locator(f'[data-action="journey-travel"][data-id="{n}"]').click(timeout=20000)
    page.wait_for_function('n=>HonroApp.engine?.b.honroStage===n',arg=n,timeout=30000)
def act6_native(page):
    open_stage(page,58)
    skip=page.locator('#dialogue-root [data-action="dialogue-skip"]')
    skip.click(timeout=8000)
    page.wait_for_function('!HonroApp.dialogue')
    btn=page.locator('[data-act6-qa-lookout]')
    def at(cls,x):
        return page.evaluate("""({cls,x})=>{
          const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(v=>v.side===0&&v.cls===cls);
          const s=HONRO_CORE.terrainSurface(b.terrain.filter(t=>t.id==='local-lower-08-body'),x,2100,3555,Infinity);
          if(!u||!s)return false;
          Object.assign(b,{side:0,phase:'aim',active:u.id,projectiles:[]});
          Object.assign(u,{x,y:s.y,vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});
          a.updateHUD(true);return e.grounded(u);
        }""",{'cls':cls,'x':x})
    assert at('occultist',3496);btn.click()
    page.wait_for_function('HonroApp.engine.b.honroState.flags.localColumnSealAligned===true')
    assert not page.evaluate("!!HonroApp.engine.unit('a6-c08-boss')")
    skip.click();page.wait_for_function('!HonroApp.dialogue')
    assert at('mage',3680);btn.click()
    page.wait_for_function("!!HonroApp.engine.unit('a6-c08-boss')")
    assert page.evaluate("HonroApp.dialogue.lines[0][0]")== '대도사'
    return skip

def dialogue_fixture(page,n,line):
    # Put an exact saved-reader row onto the game's UI at a noncombat context.
    # Feature gates already checked by native event tests; not replay assertions.
    page.evaluate("""({n,line})=>{
      const a=HonroApp;
      a.stage={...a.stage,id:n};a.dialogue={lines:[line,line],index:0,presentationOnly:true};
      HonroStory.draw(a);
    }""",{'n':n,'line':line})

with sync_playwright() as pw:
    browser=launch(pw); page=browser.new_page(viewport={'width':1280,'height':800},has_touch=True)
    errs=[]; reqs=[]
    page.on('pageerror',lambda e:errs.append(str(e)))
    page.on('request',lambda q:reqs.append(q.url) if '/npc-portrait-' in q.url else None)
    page.route('https://sys8994.github.io/honro/**',assets)
    page.goto('https://sys8994.github.io/honro/',wait_until='domcontentloaded')
    page.wait_for_function('!!window.HonroApp',timeout=90000)
    assert not reqs,reqs
    skip=act6_native(page)
    result=[]
    for w,h in [(1280,800),(390,844)]:
        page.set_viewport_size({'width':w,'height':h})
        row=ready(page,'daedosa','대도사')
        assert 'npc-portrait-daedosa.' in row['src'] and row['row']=='act6-milestone-58-threshold-0',row
        page.screenshot(path=str(OUT/f'{w}-58-daedosa.png')); row['viewport']=[w,h];result.append(row)
    page.locator('#dialogue-root [data-action="dialogue-next"]').click()
    page.locator('#dialogue-root [data-action="dialogue-prev"]').click()
    ready(page,'daedosa','대도사')
    assert len([x for x in reqs if 'npc-portrait-daedosa.' in x])==1,reqs
    skip.click();assert not page.evaluate('HonroApp.dialogue')
    fixtures=[
        (18,'유헌','A2.S18.INTRO.03','keeper_ritual'),
        (18,'생존자','A2.S18.MID.04','survivor18'),
        (19,'주민 1','A2.S19.INTRO.01','worker_mature'),
        (19,'주민 2','A2.S19.INTRO.03','woman_mature'),
        (19,'동생의 혼','19.beats.separate-1:spirit-warning','spiritbrother'),
        (19,'언니의 혼','19.beats.send-2:spirit-rises','spiritsister'),
        (19,'이름 없는 혼','19.beats.send-3:permission','spiritunnamed'),
        (19,'생존자','A2.S19.MID.06','survivor19'),
        (24,'주민','A3.S24.ENTRY.03','workshop24'),
        (29,'한태록','A3.S29.INTRO.01','hantaerok'),
        (20,'읍성 피란민','A2.S20.NEWS.01','refugee'),
        (21,'곽진','A3.S21.INTRO.01','gwakjin'),
        (30,'나루 사공','A3.S30.THIRTEEN.03','ferryman'),
    ]
    cases=[(n,who,aid,canonical(n,who,rid)) for n,who,rid,aid in fixtures]
    act4=json.loads((ROOT/'shared/data/act4/reviewed.json').read_text())
    for n,rid,aid in [(32,'A4.S32.REUNION.02','hometown'),(39,'A4.S39.SAFE_SHORE.03','dosik')]:
        _,who,text=next(r for q in act4['scenes'] if q['stage']==n for r in q['lines'] if r[0]==rid)
        cases.append((n,who,aid,[who,text,{'kind':'character','rowId':rid}]))
    for n,who,aid,sid,text in [
        (43,'장무율','jangmuyul','act1-v6:entry-43','암문 닫아라. 살아 있는 놈도 넘기지 마라.'),
        (46,'현묵','hyeonmuk','act1-v6:act5-46-memory','셋째 진목을 옮긴다. 위쪽 줄은 붙잡아 두어라.'),
    ]:
        cases.append((n,who,aid,[who,text,{'kind':'character','storyId':sid}]))
    for n,who,aid,line in cases:
        dialogue_fixture(page,n,line)
        for w,h in [(1280,800),(390,844)]:
            page.set_viewport_size({'width':w,'height':h})
            obj=ready(page,aid,who);obj['viewport']=[w,h];result.append(obj)
            if w==390: page.screenshot(path=str(OUT/f'{w}-{n}-{aid}.png'))
    assert not errs,errs
    expected={v['id'] for v in CONFIG['assets'].values() if '/npc-campaign-v4/' in v['file']}
    assert expected<={q['aid'] for q in result},(expected,{q['aid'] for q in result})
    (OUT/'browser.json').write_text(json.dumps({'rows':result,'requests':reqs,'errors':errs},ensure_ascii=False,indent=2)+'\n')
    print('PASS actual A6.S58 threshold + targeted paired mobile/PC dialogue portraits',len(result),'views',flush=True)
    browser.close()
