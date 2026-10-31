#!/usr/bin/env python3
"""Interactive normal-UI 38/40 QA; stdin must remain open. No battle-state writes."""
import argparse, hashlib, json, shlex, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

KEY = 'honro-first-act-profile-1'
COMMANDS = {'state','key','hold','jumpmove','charge','wait','screen','snapshot','reload','export','next','advance','help','quit'}
def validate(args):
    if not args or args[0] not in COMMANDS: raise ValueError('unsupported command; use help')
    counts={'state':(1,1),'key':(2,3),'hold':(3,3),'jumpmove':(3,3),'charge':(2,3),'wait':(2,2),'screen':(2,2),'snapshot':(1,2),'reload':(1,1),'export':(1,1),'next':(1,1),'advance':(1,1),'help':(1,1),'quit':(1,1)}
    lo,hi=counts[args[0]]
    if not lo<=len(args)<=hi: raise ValueError('wrong argument count for '+args[0])
    if args[0] in ('wait','hold','jumpmove'): int(args[-1])
    if args[0]=='jumpmove' and (args[1] not in ('ArrowLeft','ArrowRight') or not 1<=int(args[2])<=3000): raise ValueError('jumpmove requires a horizontal direction and 1..3000 ms')
    if args[0]=='charge' and any(not 5<=int(v)<=95 for v in args[1:]): raise ValueError('charge percentage must be 5..95')
    if args[0]=='key' and len(args)==3: int(args[2])
    if args[0] in ('screen','snapshot') and len(args)==2 and not args[1].replace('-','').replace('_','').isalnum(): raise ValueError('unsafe label')
    return args[0]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--url',default='http://127.0.0.1:8772/HONRO.html');ap.add_argument('--profile',required=True);ap.add_argument('--out',required=True);ap.add_argument('--stage',type=int,choices=(38,40),default=38);ap.add_argument('--preflight',action='store_true');ap.add_argument('--preserve-reader',action='store_true');ap.add_argument('--expected-sha256',help='Exact hash for a previously exported UI checkpoint');o=ap.parse_args()
    out=Path(o.out).resolve();out.mkdir(parents=True,exist_ok=False);log=(out/'events.jsonl').open('x',encoding='utf8')
    def record(event):
        event['time']=time.time();log.write(json.dumps(event,ensure_ascii=False)+'\n');log.flush();print(json.dumps(event,ensure_ascii=False),flush=True)
    for bad in ([],['unknown'],['hold','ArrowRight'],['jumpmove','ArrowUp','500'],['jumpmove','ArrowRight','3001'],['screen','../escape']):
        try: validate(bad)
        except ValueError: pass
        else: raise AssertionError('invalid command accepted: '+repr(bad))
    record({'preflight':'command validation passed','commands':sorted(COMMANDS)})
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True);page=ctx.new_page()
        page.on('pageerror',lambda e:record({'pageerror':str(e)}))
        def snapshot(label):
            raw=page.evaluate('(key)=>localStorage.getItem(key)',KEY)
            if raw is None: raise RuntimeError('profile storage absent')
            data=raw.encode();sha=hashlib.sha256(data).hexdigest();path=out/(sha+'.json')
            if not path.exists():path.write_bytes(data)
            record({'snapshot':label,'sha256':sha,'bytes':len(data),'type':'localStorage read-only; not UI download'})
            return json.loads(raw)
        def state():return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,q=b?.honroAct4PreviewState||{};return {screen:a.screen,stage:b?.honroStage,round:b?.round,side:b?.side,phase:b?.phase,active:u?.id,x:u?.x,y:u?.y,grounded:u&&e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,text:document.querySelector('#story-line')?.innerText,heroes:b?.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y,acted:v.acted})),foes:b?.units.filter(v=>v.side===1&&!v.dead).length,residents:b?.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),q,body:document.body.innerText.slice(0,900)}}''')
        def digest(p):
            b=p.get('honroBattle') or {}; units=[{k:u.get(k) for k in ('id','x','y','hp','dead')} for u in b.get('units',[])]
            refs=[(group,v.get('id'),v.get('asset',{}).get('id'),v.get('asset',{}).get('signature')) for group in ('honroLandmarks','honroElements') for v in b.get(group,[]) if v.get('asset',{}).get('honroStaticAssetRef')==1]
            return {'stage':b.get('honroStage'),'round':b.get('round'),'cleared':p.get('cleared'),'heroes':p.get('heroes'),'equipment':p.get('equipment'),'recruited':p.get('recruited'),'proof':p.get('honroAct4'),'units':units,'events':b.get('honroAct4PreviewState'),'refs':refs}
        def reload_same_context():
            page.wait_for_timeout(1800);page.keyboard.press('Escape');page.wait_for_timeout(300)
            saved=snapshot('before-page-reload');before=digest(saved)
            live=page.evaluate('''()=>{const b=HonroApp.engine.b;return {units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead??null})),events:JSON.parse(JSON.stringify(b.honroAct4PreviewState||{}))}}''')
            if not before['stage']: raise RuntimeError('no saved live battle')
            page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
            # Compare the loaded profile before Continue can advance clocks or notification queues.
            # Newer RC writes the final live state in pagehide; read the actual last write.
            written=digest(snapshot('after-pagehide-write'))
            loaded=digest(page.evaluate('()=>HonroApp.profile'))
            if written!=loaded:
                (out/'reload-diff.json').write_text(json.dumps({'before':before,'written':written,'loaded':loaded},ensure_ascii=False,indent=2));raise AssertionError('last-written profile mismatch; see reload-diff.json')
            if live['units']!=written['units']:
                (out/'reload-diff.json').write_text(json.dumps({'live':live,'written':written},ensure_ascii=False,indent=2));raise AssertionError('pagehide differs from paused live units')
            for key in ('phase','routes','safeSlots','safeSlotsMigrated'):
                if (live['events'].get('returnEscort') or {}).get(key)!=(written['events'] or {}).get('returnEscort',{}).get(key):raise AssertionError('pagehide changed escort '+key)
            for key in ('stage','round','cleared','heroes','equipment','recruited','proof','refs'):
                if before[key]!=written[key]:
                    (out/'reload-diff.json').write_text(json.dumps({'before':before,'written':written},ensure_ascii=False,indent=2));raise AssertionError('pagehide changed stable state: '+key)
            for key,default in (('receipts',[]),('connected',None),('observed',{})):
                if (before['events'] or {}).get(key,default)!=(written['events'] or {}).get(key,default):raise AssertionError('pagehide changed event: '+key)
            before=written
            page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('(s)=>HonroApp.engine?.b?.honroStage===s',arg=before['stage'],timeout=60000)
            page.keyboard.press('Escape')
            observed=page.evaluate('''()=>{let b=HonroApp.engine.b,q=b.honroAct4PreviewState||{};return {stage:b.honroStage,round:b.round,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead??null})),receipts:q.receipts||[],connected:q.connected??null,observed:q.observed||{},assets:[...b.honroLandmarks,...b.honroElements].filter(v=>v.asset?.vector).map(v=>v.asset.id)}}''')
            for key in ('stage','round'):
                if observed[key]!=before[key]:
                    (out/'reload-diff.json').write_text(json.dumps({'before':before,'observed':observed},ensure_ascii=False,indent=2));raise AssertionError('runtime mismatch: '+key)
            # Continue resumes the world before this script can pause it. The
            # imported saved bytes were compared exactly above; check stationary
            # units exactly and permit a small, bounded natural rescue-NPC step.
            expected={u['id']:u for u in before['units']}; actual={u['id']:u for u in observed['units']}
            if expected.keys()!=actual.keys():raise AssertionError('runtime unit roster mismatch')
            for uid,u in expected.items():
                v=actual[uid]
                if u['hp']!=v['hp'] or u['dead']!=v['dead']:raise AssertionError('runtime unit health mismatch: '+uid)
                if uid.startswith('a4-rescue-'):
                    if abs(u['x']-v['x'])>120 or abs(u['y']-v['y'])>120:raise AssertionError('runtime resident moved too far: '+uid)
                elif (u['x'],u['y'])!=(v['x'],v['y']):raise AssertionError('runtime unit position mismatch: '+uid)
            q=before['events'] or {}
            for key,default in (('receipts',[]),('connected',None),('observed',{})):
                if observed[key]!=q.get(key,default):raise AssertionError('runtime event mismatch: '+key)
            if any(ref[2] not in observed['assets'] for ref in before['refs']):raise AssertionError('asset reference failed to restore')
            snapshot('after-page-reload');record({'same_context_reload':'passed','stage':before['stage'],'round':before['round'],'units':len(before['units']),'assetRefs':len(before['refs'])})
        def export_ui():
            page.keyboard.press('Escape');page.get_by_text('설정',exact=True).click();page.get_by_text('기록·관리',exact=False).click()
            with page.expect_download(timeout=60000) as pending: page.get_by_text('JSON 기록 내보내기',exact=True).click()
            d=pending.value;target=out/('ui-export-'+str(int(time.time()))+'.json');d.save_as(str(target));data=target.read_bytes();record({'ui_download':str(target),'suggested_filename':d.suggested_filename,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
            for _ in range(4):
                if not page.evaluate("document.querySelector('#modal')?.classList.contains('open')"):break
                page.keyboard.press('Escape');page.wait_for_timeout(300)
            if page.evaluate("document.querySelector('#modal')?.classList.contains('open')"):raise RuntimeError('could not close export menu')
        page.goto(o.url,wait_until='domcontentloaded');page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader',timeout=60000)
        raw=Path(o.profile).read_bytes();source_sha=hashlib.sha256(raw).hexdigest()
        if o.stage==40 and source_sha!=(o.expected_sha256 or 'c3724ff6ff7e2417489147457c0956c1642af3907b8b5bd923b4843c41675f6f'):raise ValueError('unexpected stage 40 source hash')
        record({'input_sha256':source_sha,'stage':o.stage})
        page.locator('#file-import').set_input_files(str(Path(o.profile).resolve()));page.wait_for_timeout(5000);snapshot('fixture-import')
        if o.stage==38:
            # A mid-battle checkpoint offers a different Continue label than a rest profile.
            continuing_battle=page.evaluate("()=>!!HonroApp.profile?.honroBattle")
            page.get_by_text('이어서 걷기' if continuing_battle else '여정 이어가기',exact=True).click();page.wait_for_function("HonroApp.screen==='rest'||HonroApp.engine?.b?.honroStage===38",timeout=60000)
            if page.evaluate("HonroApp.screen==='rest'"):
                page.get_by_text('여정첩',exact=True).click();page.locator('[data-action=journey-select][data-id="38"]').click();page.wait_for_timeout(500);page.locator('[data-action=journey-travel][data-id="38"]').click()
        else:
            page.get_by_text('이어서 걷기',exact=True).click()
        page.wait_for_function('(stage)=>HonroApp.engine?.b?.honroStage===stage',arg=o.stage,timeout=60000);page.wait_for_timeout(1500)
        if o.stage==40:
            proof=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,p=a.profile.honroAct4;return {valid:HonroAct4TerrainPreview.proofValid(b),safeSeven:p.safeSeven,rescued:p.rescued,run:p.runId,entry:b.honroAct4EntryProof,residents:b.honroAct4EntryResidents,release:b.honroAct4Design?.geometry40?.followerRelease}}''')
            record({'stage40_proof':proof})
            if not proof['valid']:raise AssertionError('stage 40 proof invalid')
            expected={'boardingIndex':7,'passengerIndex':2,'minSeparation':160,'passengerJumpClearBounds':{'x1':4000,'x2':5100,'y1':1750,'y2':2350}}
            if proof['release']!=expected:raise AssertionError('stage 40 followerRelease mismatch')
        if not o.preserve_reader and page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter');page.wait_for_timeout(2000)
        snapshot('entry');record({'state':state()})
        if o.preflight:
            reload_same_context();record({'preflight':'actual same-context entry reload completed'})
        record({'ready':True,'commands':sorted(COMMANDS)})
        for line in sys.stdin:
            try:
                args=shlex.split(line);op=validate(args);record({'input':args})
                if op=='quit':break
                if op=='key':page.keyboard.press(args[1]);page.wait_for_timeout(int(args[2]) if len(args)>2 else 700)
                elif op=='hold':
                    page.keyboard.down(args[1]);page.wait_for_timeout(int(args[2]));page.keyboard.up(args[1]);page.wait_for_timeout(700)
                elif op=='jumpmove':
                    # Ordinary simultaneous movement+jump; always release both keys.
                    page.keyboard.down(args[1])
                    try:
                        page.keyboard.press('Control');page.wait_for_timeout(int(args[2]))
                    finally:
                        page.keyboard.up(args[1])
                    page.wait_for_timeout(700)
                elif op=='charge':
                    target=int(args[1]);threshold=int(args[2]) if len(args)>2 else target
                    actor=page.evaluate('()=>HonroApp.engine?.active?.id');page.keyboard.down('Space');handle=None
                    try:
                        handle=page.wait_for_function("threshold=>{const b=document.querySelector('#fire');const t=b?.querySelector('.fire-label')?.textContent||'';return b?.classList.contains('charging')&&parseInt(t,10)>=threshold?t:false}",arg=threshold,timeout=5000,polling='raf')
                    finally:page.keyboard.up('Space')
                    sampled=handle.json_value() if handle else None
                    page.wait_for_timeout(1000)
                    actual=page.evaluate('(id)=>HonroApp.engine?.b?.lastShots?.[id]||null',actor)
                    record({'charge_target_percent':target,'release_threshold_percent':threshold,'trigger_visible_percent':sampled,'actual_last_shot':actual})
                elif op=='wait':page.wait_for_timeout(int(args[1]))
                elif op=='screen':page.screenshot(path=str(out/(args[1]+'.png')))
                elif op=='snapshot':snapshot(args[1] if len(args)>1 else 'manual')
                elif op=='reload':reload_same_context()
                elif op=='export':export_ui()
                elif op=='next':page.locator('[data-action=result-continue]').click();page.wait_for_timeout(2500)
                elif op=='advance':
                    # Give the actual visible row time to render, and only
                    # click Next after the game has observed this exact row.
                    page.wait_for_timeout(1800)
                    visible=page.evaluate('''()=>{const a=HonroApp,d=a.dialogue,line=d?.lines[d.index],q=a.engine?.b?.honroAct4PreviewState;return {text:document.querySelector('#story-line')?.textContent,id:line?.[2]?.act4PreviewRow,key:q?.reader?.key}}''')
                    if not visible.get('text'):raise RuntimeError('no visible dialogue row')
                    if visible.get('id'):
                        if not visible.get('key'):raise RuntimeError('Act 4 row lacks reader')
                        page.wait_for_function('''v=>{const q=HonroApp.engine?.b?.honroAct4PreviewState,d=HonroApp.dialogue,line=d?.lines[d.index];return line?.[2]?.act4PreviewRow===v.id&&q?.events?.[v.key]?.presented?.includes(v.id)}''',arg=visible,timeout=15000)
                    record({'observed_before_advance':visible});page.locator('[data-action=dialogue-next]').click();page.wait_for_timeout(700)
                elif op=='help':record({'commands':sorted(COMMANDS)})
                snapshot('after-'+op);record({'state':state()})
            except Exception as e:record({'error':repr(e)})
        ctx.close();browser.close()
if __name__=='__main__':main()
