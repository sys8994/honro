"""Read-only production HTTP check; the only browser save is a disposable test fixture."""
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright

HERE=Path(__file__).parent
SITE='https://sys8994.github.io/honro/'
KEY='honro-first-act-profile-1'
SHA=sys.argv[1]
OUT=Path(sys.argv[2]);OUT.mkdir(parents=True,exist_ok=True)
def get(path):
    req=Request(SITE+path,headers={'Cache-Control':'no-cache','User-Agent':'HONRO-release-readback'})
    with urlopen(req,timeout=15) as res:
        assert res.status==200 and res.geturl().startswith(SITE)
        return res.read()
sha=lambda raw:hashlib.sha256(raw).hexdigest()
for _ in range(45):
    try:
        raw=get('web/manifest.json')
        if sha(raw)==SHA: break
    except Exception:
        pass
    time.sleep(8)
else:
    raise RuntimeError('Published manifest never reached the exact expected artifact')
m=json.loads(raw)
assert m['gameEntry'].encode() in get('HONRO.html')
assert m['gameEntry'].encode() in get('index.html')
r=[x for x in m['files'] if any(i in x['path'] for i in (
    'act6-qa-chapter-','/act6-terrain-art-','/act6-far-','/act6-ending-dawn-','/act6-qa-art-59.',
    '-normal51.','/stage51-campaign-provider.'))]
assert len([x for x in r if 'act6-qa-chapter-' in x['path']])==10
assert len([x for x in r if 'act6-terrain-art-' in x['path']])==10
for f in r:
    raw=get(f['path'])
    assert len(raw)==f['bytes'] and sha(raw)==f['sha256'],f['path']
expected=json.loads((HERE/'settled-witness.json').read_bytes())['profile']
expected['cleared'].update({str(n):True for n in range(1,50)})
expected['lastStage']=50
p=json.dumps(expected,ensure_ascii=False,separators=(',',':'))
def tap(t,selector,mobile):
    loc=t.locator(selector)
    loc.wait_for(state='visible',timeout=15000)
    loc.tap(timeout=15000) if mobile else loc.click(timeout=15000)
checks=[]
def save_delta(before,after):
    a,b=json.loads(before),json.loads(after)
    return {k:[a.get(k),b.get(k)] for k in sorted(set(a)|set(b)) if a.get(k)!=b.get(k) or (k in a)!=(k in b)}

with sync_playwright() as pw:
    browser=pw.chromium.launch(chromium_sandbox=True)
    for mode,size,mobile in [('PC',{'width':1440,'height':900},False),('M',{'width':390,'height':844},True)]:
        with browser.new_context(viewport=size,is_mobile=mobile,has_touch=mobile,device_scale_factor=1) as ctx:
            ctx.add_init_script("if(location.href.startsWith("+json.dumps(SITE)+")&&!localStorage.getItem("+json.dumps(KEY)+"))localStorage.setItem("+json.dumps(KEY)+","+json.dumps(p)+");")
            ctx.add_init_script("""(()=>{
              const KEY='honro-first-act-profile-1', old=Storage.prototype.setItem;
              window.act6StorageLog=[];
              Storage.prototype.setItem=function(k,v){
                if(k===KEY){const prev=this.getItem(k);window.act6StorageLog.push({prev,v,screen:window.HonroApp?.screen,stage:window.HonroApp?.engine?.b?.honroStage,stack:(new Error()).stack});}
                return old.call(this,k,v);
              };
            })()""")
            t=ctx.new_page();errors=[]
            t.on('pageerror',lambda e:errors.append(str(e)))
            t.goto(SITE+'HONRO.html',wait_until='domcontentloaded',timeout=45000)
            t.wait_for_function("globalThis.HonroApp?.screen==='title' && !!globalThis.HONRO_READY",timeout=45000)
            t.evaluate("async()=>await globalThis.HONRO_READY")
            assert t.evaluate("HonroApp.launch(51,false)===false")
            tap(t,'.title-actions button.primary[data-action="rest"]',mobile)
            t.wait_for_function("HonroApp.screen==='rest'",timeout=25000)
            for _ in range(40):
                if not t.evaluate("!!HonroApp.dialogue"): break
                t.wait_for_timeout(260);tap(t,'[data-action="dialogue-next"]',mobile)
            t.wait_for_function("!HonroApp.dialogue && HonroApp.screen==='rest'",timeout=12000)
            beforeWait=t.evaluate("k=>localStorage.getItem(k)",KEY)
            t.wait_for_timeout(1800)
            prev=t.evaluate("k=>localStorage.getItem(k)",KEY)
            gate='.rest-next[aria-label="스테이지 진입 · 무명사 외부"]'
            t.locator(gate).evaluate('el=>el.click()');assert t.evaluate("HonroApp.screen")== 'rest'
            afterSynthetic=t.evaluate("k=>localStorage.getItem(k)",KEY)
            tap(t,gate,mobile)
            t.wait_for_function("HonroApp.engine?.b?.honroStage===51 && HonroApp.scene?.environmentStats?.authoredFar?.length>0",timeout=25000)
            atStart=t.evaluate("k=>localStorage.getItem(k)",KEY)
            t.wait_for_function("HonroApp.scene?.act6TerrainArtStats?.revision===2 && HonroApp.scene.act6TerrainArtStats.drawCalls>0",timeout=15000)
            t.wait_for_timeout(700)
            assert t.evaluate("()=>HonroApp.engine.b.mode==='campaign'&&HonroApp.engine.b.honroAuthoredId==='stage-51'&&HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned&&HonroApp.engine.grounded(u)).length===4")
            after=t.evaluate("k=>localStorage.getItem(k)",KEY)
            writes=t.evaluate("window.act6StorageLog")
            log=[{'screen':x.get('screen'),'stage':x.get('stage'),'stack':x.get('stack'),'keys':list(save_delta(x['prev'],x['v'])) if x.get('prev') else ['first-write']} for x in writes]
            t.screenshot(path=OUT/f'live-act6-start-{mode}.png')
            d={'restDelay':save_delta(beforeWait,prev),'syntheticClick':save_delta(prev,afterSynthetic),'immediateEntry':save_delta(afterSynthetic,atStart),'duringBattle':save_delta(atStart,after)}
            checks.append({'viewport':mode,'stage':51,'realOrigin':t.url,'legacySaveUnchangedIn6':after==afterSynthetic,'terrainArt':t.evaluate('HonroApp.scene.act6TerrainArtStats'),'errors':errors,'expectedBeforeWaitSHA':sha(beforeWait.encode()),'beforeEntrySHA':sha(afterSynthetic.encode()),'afterEntrySHA':sha(after.encode())})
            (OUT/f'SAVE-DIFFERENCE-{mode}.json').write_text(json.dumps({'delta':d,'changes':log},ensure_ascii=False,indent=2)+'\n')

    browser.close()
(OUT/'LIVE.json').write_text(json.dumps({'manifestSHA':SHA,'HTTPAssetHashes':len(r),'app':checks},indent=2)+'\n')

assert all(row['legacySaveUnchangedIn6'] and not row['errors'] for row in checks),[(r['viewport'],r['legacySaveUnchangedIn6']) for r in checks]
