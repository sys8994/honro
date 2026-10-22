"""Focused built-browser save boundary: old11 Continue/export/import vs fresh retry.
The historical snapshot receives the current map stamp explicitly; this is not
an unstamped legacy save migration or a combat playthrough.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url

parser=argparse.ArgumentParser()
parser.add_argument('--out',default='_local/reports/act2-pacing-release/save')
parser.add_argument('--reference',type=Path,help='Latest-master browser Continue snapshot, before this integration')
parser.add_argument('--record-reference',action='store_true',help='Read-only baseline capture; no retry/export assertions')
args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
old=json.loads(Path('tests/fixtures/stage11-trace-exit-save.json').read_text())
fields=['id','side','x','y','hp','maxHp','dead','cls']
rows=[];errors=[];http=[]
with sync_playwright() as pw:
    browser=launch(pw)
    page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
    page.goto(story_base_url()+'/HONRO.html')
    page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
    stamped=page.evaluate('''async p=>{await HonroCampaignLoader.ensureStage(11);
      p.honroBattle.honroCampaignMapRevision=HonroCampaignMapRevision.current(11);
      localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));return p;}''',old)
    page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
    page.evaluate('HonroApp.frame=()=>{};HonroApp.continue()')
    page.wait_for_function('HonroApp.engine?.b.honroStage===11',timeout=90000)
    expected=[{k:u.get(k) for k in fields} for u in stamped['honroBattle']['units']]
    actual=page.evaluate('''keys=>HonroApp.engine.b.units.map(u=>Object.fromEntries(keys.map(k=>[k,u[k]??null])))''',fields)
    terrain=page.evaluate('HonroApp.engine.b.terrain')
    if args.record_reference:
        (out/'reference.json').write_text(json.dumps({'sourceSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'actors':actual,'terrain':terrain,'errors':errors,'httpFailures':http},ensure_ascii=False,indent=2)+'\n')
        assert not errors and not http
        print('PASS latest-master read-only old11 Continue reference')
        browser.close()
        raise SystemExit(0)
    if args.reference:
        reference=json.loads(args.reference.read_text())
        assert reference['sourceSHA']=='9cb849a5eceb2529a4204232fdf55a09e543d079'
        expected=reference['actors']
        assert terrain==reference['terrain']
    if actual!=expected:
        (out/'actor-comparison.json').write_text(json.dumps({'expected':expected,'actual':actual},ensure_ascii=False,indent=2))
        print('ACTOR DIFFERENCES',[(e['id'],{k:[e[k],a[k]] for k in fields if e[k]!=a[k]}) for e,a in zip(expected,actual) if e!=a],flush=True)
    assert actual==expected,'Old Continue must preserve every saved actor, position and HP'
    assert page.evaluate('HonroApp.engine.b.honroMarkers.find(m=>m.id==="trace").x')==15040
    assert page.evaluate('HonroApp.engine.b.honroAct2PacingRevision')==1
    if not args.reference:assert terrain==stamped['honroBattle']['terrain']
    rows.append({'case':'current-map-stamped old11 Continue','actors':len(actual),'actorSHA256':hashlib.sha256(json.dumps(actual,sort_keys=True).encode()).hexdigest(),'oldTraceX':15040,'savedActorsHPPositionsTerrainExact':True,'comparedWith':reference['sourceSHA'] if args.reference else 'raw fixture','limit':'Historical actor/stat migrations already occur in master; equality is against master Continue, not raw historical HP/poses.'})
    page.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);}''')
    page.wait_for_timeout(400)
    with page.expect_download() as download:page.evaluate('HonroApp.export()')
    exported=out/'old11-export.json';download.value.save_as(str(exported))
    before=page.evaluate('JSON.stringify({units:HonroApp.engine.b.units,terrain:HonroApp.engine.b.terrain,markers:HonroApp.engine.b.honroMarkers,growth:HonroApp.engine.b.honroGrowth,heroes:HonroApp.engine.b.heroes})')
    page.locator('#file-import').set_input_files(str(exported))
    page.wait_for_function('document.querySelector("#file-import").value===""')
    page.evaluate('HonroApp.continue()')
    page.wait_for_function('HonroApp.engine?.b.honroStage===11',timeout=90000)
    assert before==page.evaluate('JSON.stringify({units:HonroApp.engine.b.units,terrain:HonroApp.engine.b.terrain,markers:HonroApp.engine.b.honroMarkers,growth:HonroApp.engine.b.honroGrowth,heroes:HonroApp.engine.b.heroes})')
    rows.append({'case':'real browser download/file-input/repeated Continue','snapshotExact':True})
    page.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.close();a.retry();}''')
    page.wait_for_function('HonroApp.engine?.b.honroMarkers.find(m=>m.id==="trace")?.x===11900',timeout=90000)
    assert page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===1).length')==43
    rows.append({'case':'production retry','newTraceX':11900,'initialEnemies':43})
    assert not errors and not http,(errors,http)
    browser.close()
(out/'summary.json').write_text(json.dumps({'executionSHA':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'scope':__doc__,'rows':rows,'errors':errors,'httpFailures':http},ensure_ascii=False,indent=2)+'\n')
print('PASS old11 built-browser Continue, real download/import, saved actors/terrain and fresh retry')
