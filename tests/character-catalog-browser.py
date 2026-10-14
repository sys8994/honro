"""Focused catalog QA. Does not run a game, change campaign saves, or claim gameplay QA."""
import base64, hashlib, json
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'_local/reports/character-catalog';OUT.mkdir(parents=True,exist_ok=True)
@contextmanager
def preview_server():
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    thread=Thread(target=server.serve_forever,daemon=True);thread.start()
    try: yield f'http://127.0.0.1:{server.server_port}/tools/character-catalog.html'
    finally: server.shutdown();server.server_close();thread.join()
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
with preview_server() as URL, sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True)
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.add_init_script('''(()=>{const set=Storage.prototype.setItem,get=Storage.prototype.getItem;set.call(localStorage,'honro-catalog-preservation-sentinel','unchanged');window.storageCalls=[];for(const k of ['getItem','setItem','removeItem','clear']){const old=Storage.prototype[k];Storage.prototype[k]=function(...args){storageCalls.push([k,...args]);return old.apply(this,args)}}window.readSentinel=()=>get.call(localStorage,'honro-catalog-preservation-sentinel')})()''')
    page.goto(URL);page.wait_for_function('window.CharacterCatalog')
    data=page.evaluate('HONRO_CATALOG')
    check('53 primary + 15 compatibility routes + 4 targets; 44 vectors / 209 slots',all(data['counts'][k]==v for k,v in {'primary':53,'compatibility':15,'vector':44,'clips':209,'targets':4}.items()),data['counts'])
    check('30 fresh chapters collected',len(data['stages'])==30)
    check('Every entry has completed pixel review',all(r['review']['verdict'] in ['유지','수정 권장','우선 개편','미사용 후보'] for r in data['rows']))
    check('Historical summons are not counted as current player skills',all(not r.get('skills') and not r['stages'] for r in data['rows'] if r['id'] in ['summon_host','summon_charger']))
    check('No App, iframe, audio host or persisted game state',page.evaluate('!window.HonroApp && !document.querySelector("iframe,audio") && window.HONRO_EMBEDDED === true'))
    check('Default view shows 53 primary entries and 4 targets',page.locator('.card').count()==53+data['counts']['targets'])
    page.screenshot(path=str(OUT/'desktop.png'),full_page=False)
    page.fill('#search','종지기');check('Korean search',page.locator('.card').count()==1)
    page.click('[data-open=keeper]');page.screenshot(path=str(OUT/'keeper-desktop.png'))
    check('Keeper evidence is old body plus stole', 'act2-art.js' in page.locator('#routes').inner_text())
    page.click('#play');page.wait_for_timeout(220);check('Playback advances phase',page.evaluate('CharacterCatalog.phase')>0)
    page.click('#play');phase=page.evaluate('CharacterCatalog.phase');page.wait_for_timeout(80);check('Pause freezes phase',page.evaluate('CharacterCatalog.phase')==phase)
    page.locator('#scrub').evaluate("e=>{e.value='.55';e.dispatchEvent(new Event('input'))}")
    check('Scrub displays exact phase',page.locator('#phase').inner_text()=='55%')
    a=page.locator('#focus').evaluate('c=>c.toDataURL()');page.click('#flip');check('Facing changes actual pixels',page.locator('#focus').evaluate('c=>c.toDataURL()')!=a)
    page.keyboard.press('Escape');check('Native dialog closes with Escape',not page.locator('#detail').evaluate('d=>d.open'))
    page.click('#reset');page.select_option('#act','2');check('Act filter excludes first-act-only units',all(2 in r['acts'] for r in data['rows'] if r['id'] in page.locator('[data-open]').evaluate_all('es=>es.map(e=>e.dataset.open)')))
    page.click('#reset');page.check('#legacy');check('Explicit compatibility view shows all 72 entries',page.locator('.card').count()==len(data['rows']))
    proof=page.evaluate('''()=>{const C=HONRO_CORE,p=C.defaults(),st=HONRO_CONTENT.stages[10];p.recruited=HonroStageRules.stageParty(11);const b=HonroWorld.build(st,p,false,'archer','A01');HonroStageRules.sanitizeStageBattle(b);const create=(kind,team='ally',label)=>HonroUnits.create({...HonroUnits.record(kind,'catalog-proof',100,100,team),label},b,p,st);const daoist=create('ally:daoist'),renamed=create('ally:daoist','ally','사용자 도사'),medium=create('ally:medium'),renamedMedium=create('ally:medium','ally','사용자 무당'),hound=create('hound','player'),guard=create('possessedGuard','enemy'),archer=create('possessedArcher','enemy');guard.elite=true;archer.elite=true;const engine=new C.Engine(structuredClone(b)),owner=engine.b.units.find(u=>u.side===0&&u.cls==='occultist'&&!u.summoned),host=engine.spawnSummon(owner,'host',owner.x,owner.y);return {daoist:resolveRebuildCharacter(daoist),renamed:HonroActorVisual.kind(renamed),medium:resolveRebuildCharacter(medium),renamedMedium:HonroActorVisual.kind(renamedMedium),houndSide:hound.side,houndVector:HonroMonsterVisual.kind(hound),guard:HonroMonsterVisual.kind(guard),archer:HonroMonsterVisual.kind(archer),host:HonroActorVisual.kind(host),currentHost:Object.values(C.SKILLS).some(s=>!s.enemyOnly&&s.mode==='summonHost'),oldUltimateOnly:C.SKILLS.O99.enemyOnly};}''')
    check('Actual map names route to party or ally art',proof['daoist']=='damheo' and proof['medium']=='sodan' and proof['renamed']=='ally_daoist' and proof['renamedMedium']=='ally_medium',proof)
    check('Actual custom player monster bypasses latest enemy dispatcher',proof['houndSide']==0 and proof['houndVector'] is None)
    check('Elite and historical summon factories remain reachable',proof['guard']=='gateMaster' and proof['archer']=='archerMaster' and proof['host']=='summon_host' and not proof['currentHost'] and proof['oldUltimateOnly'])
    before=page.evaluate('JSON.stringify(HONRO_CATALOG.rows)')
    animation=page.evaluate('''()=>{const cv=document.createElement('canvas');cv.width=420;cv.height=360;const result=[];for(const row of HONRO_CATALOG.rows.filter(r=>r.excluded))for(const mode of ['scene','clip']){const frames=[.1,.45].map(phase=>{HonroCatalogRenderer.draw(cv,row,{mode,motion:'move',phase});return cv.toDataURL()});result.push({id:row.id,mode,changed:frames[0]!==frames[1]});}return result}''')
    check('All four style baselines visibly animate in Scene and clip modes',all(r['changed'] for r in animation),animation)
    # Draw the actual production Scene and each defined vector clip, never a substitute drawing.
    results=page.evaluate('''()=>{const out=[];const cv=document.createElement('canvas');cv.width=420;cv.height=360;document.body.append(cv);for(const row of HONRO_CATALOG.rows){const hashes=[];for(const mode of row.layer==='현행 전용 벡터'?['scene','clip']:['scene'])for(const motion of row.clips)for(const phase of [0,.27,.68]){HonroCatalogRenderer.draw(cv,row,{mode,motion:motion.id,phase});const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0,edge=0;for(let i=3;i<d.length;i+=4)if(d[i]>20){n++;const pos=(i-3)/4,x=pos%cv.width,y=Math.floor(pos/cv.width);if(x===0||x===cv.width-1||y===0||y===cv.height-1)edge++;}hashes.push({mode,motion:motion.id,phase,n,edge});}out.push({id:row.id,samples:hashes});}cv.remove();return out;}''')
    check('Every entry and selected motion paints visible pixels',all(s['n']>20 for r in results for s in r['samples']))
    check('Preview frames do not clip against canvas edges',all(s['edge']==0 for r in results for s in r['samples']),[r['id'] for r in results if any(s['edge'] for s in r['samples'])])
    check('Rendering never mutates inventory units or battle snapshots',before==page.evaluate('JSON.stringify(HONRO_CATALOG.rows)'))
    (OUT/'pixel-samples.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
    # Contact sheets for direct human visual review, 16 entries per sheet.
    for start in range(0,len(data['rows']),16):
        image=page.evaluate('''start=>{const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=1280;const c=sheet.getContext('2d');c.fillStyle='#19251f';c.fillRect(0,0,1200,1280);const tile=document.createElement('canvas');tile.width=300;tile.height=280;HONRO_CATALOG.rows.slice(start,start+16).forEach((r,i)=>{HonroCatalogRenderer.draw(tile,r,{phase:.2});c.drawImage(tile,i%4*300,Math.floor(i/4)*320);c.fillStyle='#e3d9b9';c.font='15px sans-serif';c.fillText(r.id,i%4*300+14,Math.floor(i/4)*320+303);});return sheet.toDataURL()}''',start)
        (OUT/f'contact-{start//16+1}.png').write_bytes(base64.b64decode(image.split(',')[1]))
    # Store individual full-size detail frames for all primary and compatibility entries.
    for row in data['rows']:
        page.evaluate('id=>CharacterCatalog.open(id)',row['id'])
        page.locator('#focus').screenshot(path=str(OUT/(row['id']+'.png')))
    page.evaluate("CharacterCatalog.open('resonance')")
    a=page.locator('#focus').evaluate('c=>c.toDataURL()');page.check('#hiddenSpirit');check('Hidden spirit uses actual visibility branch',a!=page.locator('#focus').evaluate('c=>c.toDataURL()'))
    page.locator('#detail').evaluate('d=>d.close()')
    for width,height in [(390,844),(333,667),(667,333)]:
        page.set_viewport_size({'width':width,'height':height});page.click('#reset');page.evaluate('window.scrollTo(0,0)');page.screenshot(path=str(OUT/f'mobile-{width}.png'))
        check(f'{width}px list has no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.evaluate("CharacterCatalog.open('keeper')");page.screenshot(path=str(OUT/f'keeper-{width}.png'))
        check(f'{width}px detail has no horizontal overflow',page.locator('#detail').evaluate('e=>e.scrollWidth<=e.clientWidth'))
        page.locator('#detail').evaluate('d=>d.close()')
    check('Save storage was neither read nor written',page.evaluate('storageCalls.length===0 && readSentinel()==="unchanged"'),page.evaluate('storageCalls'))
    check('No browser script errors',not errors,errors)
    (OUT/'browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors,'sourceSha256':data['sourceSha256'],'htmlSha256':hashlib.sha256((ROOT/'tools/character-catalog.html').read_bytes()).hexdigest()},ensure_ascii=False,indent=2)+'\n')
    browser.close()
