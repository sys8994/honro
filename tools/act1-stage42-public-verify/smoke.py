import json,sys
from pathlib import Path
from hashlib import sha256
from urllib.parse import urljoin, urlsplit
from playwright.sync_api import sync_playwright
H = '87b82bd0b887a02294a70a9c3768d2b61d247a8f23a30f204a878046f2209192'
M = '731580b179f4ec6e0b321a647288edeee1313060c953da53aa568dd19133a14b'
E = 'web/entries/game.340c32a30a66adad.js'
C = 'web/data/campaign.9840d8f258b12a6d.json'
A = 'web/data/chapter-42-assets.396ec98508d5b8c8.json'
A_SHA = '396ec98508d5b8c828a8d0bbf24c2f6cac1a734a55989db3f3d3fcc1d80bb1df'
LIVE = '1e043b09d4ce107e1d2dcf70fe2274dff7098476'
def sha(b): return sha256(b).hexdigest()

def smoke(base, out):
    assert base=='https://sys8994.github.io/honro/'
    out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={'width': 1440, 'height': 960},
                                  service_workers='block')
        p = ctx.new_page(); p.set_default_timeout(30000)
        seen, errors = {}, []
        def response(r):
            u = urlsplit(r.url); home = urlsplit(base)
            if (u.scheme, u.netloc) != (home.scheme, home.netloc): return
            if u.path.startswith(home.path):
                seen[u.path[len(home.path):]] = r
        p.on('response', response)
        p.on('pageerror', lambda exc: errors.append(str(exc)))
        def read(rel, expected):
            u = urljoin(base, rel)
            r = ctx.request.get(u, timeout=30000, max_redirects=0)
            assert r.status == 200 and r.url == u, (rel, r.status, r.url)
            assert sha(r.body()) == expected, (rel, 'release hash not yet served')
            return r
        for _ in range(8):
            try:
                read('index.html', H)
                read('web/manifest.json', M)
                break
            except AssertionError:
                p.wait_for_timeout(5000)
        else:
            raise AssertionError('existing public paths did not serve the exact release after Pages success')
        read('index.html', H)
        manifest = read('web/manifest.json', M).json()
        assert manifest['gameEntry'] == E and manifest['project'] == C
        active = {v['path']:v for v in manifest['files']}
        assert len(active) == len(manifest['files']) and active[A]['sha256'] == A_SHA
        older = [g for g in manifest['publishedGenerations'] if g['sourceSha'] == LIVE]
        assert len(older) == 1
        retained = next(v for v in older[0]['files']
                        if v['path'] not in active and v['path'].startswith('web/entries/'))
        read(retained['path'], retained['sha256'])
        shell = p.goto(urljoin(base,'HONRO.html'), wait_until='domcontentloaded')
        assert shell and shell.status == 200 and shell.url == urljoin(base,'HONRO.html')
        assert sha(shell.body()) == H
        p.wait_for_function("document.documentElement.dataset.honroReady === 'true' && typeof globalThis.HonroApp?.launch === 'function'")
        p.locator('.honro-title [data-action="settings"]:visible').first.click()
        p.locator('[data-action="settings-page"][data-id="records"]:visible').click()
        p.locator('[data-action="settings-page"][data-id="debug"]:visible').click()
        p.locator('label[for="debug-mode-setting"]:visible').click()
        p.wait_for_function("HonroApp.debugMode === true && HonroApp.screen === 'rest'")
        p.evaluate('async () => { await HonroCampaignLoader.ensureStage(42); return HonroApp.launch(42); }')
        p.wait_for_function("HonroApp.screen === 'battle' && HonroApp.engine?.b.honroStage === 42 && !HonroApp.engine.b.honroCustom && !HonroApp.training")
        canvas = p.locator('#battlecanvas'); canvas.wait_for(state='visible')
        p.wait_for_function("document.querySelector('#battlecanvas')?.width > 10 && document.querySelector('#battlecanvas')?.height > 10")
        p.evaluate('() => document.fonts.ready.then(() => null)')
        stageMap = read(C, active[C]['sha256']).json()
        assert len(stageMap['stages']) == len(stageMap['stageLibraries']) == 50
        assert stageMap['stageLibraries'][41] == A
        paths = {E, C, A, stageMap['stages'][41]} | {
            k for k in seen if k.startswith(('web/fonts/', 'web/styles/'))}
        assert any(k.startswith('web/fonts/') for k in paths)
        assert any(k.startswith('web/styles/') for k in paths)
        for k in paths:
            r = seen.get(k)
            assert r and r.status == 200, ('normal actual browser request', k)
            b = r.body()
            assert (len(b),sha(b)) == (active[k]['bytes'],active[k]['sha256']), k
        assert p.evaluate("""() => {
            const b=HonroApp.engine.b;
            return (b.honroLandmarks||[]).filter(x=>x.id==='a5-near' &&
               x.asset?.id==='act5:near:42' && x.asset.edgeWall).length===1;
        }""")
        assert not errors, errors
        image=canvas.screenshot(animations='disabled')
        (out/'stage42-public-canvas.png').write_bytes(image)
        receipt={'publicHTML':H,'publicManifest':M,'normalStage42Canvas':True,
                 'stage42PacketSHA256':A_SHA,'oldImmutableRetained':retained['path'],
                 'checkedActualResponses':sorted(paths), 'canvasPNGSHA256':sha(image),
                 'mode':'published Pages, no-account test browser with native debug switch'}
        (out/'PUBLIC-DELIVERY.json').write_text(json.dumps(receipt,indent=2)+'\n')
        print(json.dumps(receipt))
        ctx.close(); browser.close()

if __name__=='__main__': smoke('https://sys8994.github.io/honro/',Path(sys.argv[1]))
