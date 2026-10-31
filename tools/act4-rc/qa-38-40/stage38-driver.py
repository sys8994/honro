#!/usr/bin/env python3
"""Interactive normal-UI 38 QA; stdin must remain open. No battle-state writes."""
import argparse, hashlib, json, shlex, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

KEY = 'honro-first-act-profile-1'
COMMANDS = {'state','key','hold','wait','screen','snapshot','reload','export','next','help','quit'}
def validate(args):
    if not args or args[0] not in COMMANDS: raise ValueError('unsupported command; use help')
    counts={'state':(1,1),'key':(2,3),'hold':(3,3),'wait':(2,2),'screen':(2,2),'snapshot':(1,2),'reload':(1,1),'export':(1,1),'next':(1,1),'help':(1,1),'quit':(1,1)}
    lo,hi=counts[args[0]]
    if not lo<=len(args)<=hi: raise ValueError('wrong argument count for '+args[0])
    if args[0] in ('wait','hold'): int(args[-1])
    if args[0]=='key' and len(args)==3: int(args[2])
    if args[0] in ('screen','snapshot') and len(args)==2 and not args[1].replace('-','').replace('_','').isalnum(): raise ValueError('unsafe label')
    return args[0]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--url',default='http://127.0.0.1:8772/HONRO.html');ap.add_argument('--profile',required=True);ap.add_argument('--out',required=True);ap.add_argument('--preflight',action='store_true');o=ap.parse_args()
    out=Path(o.out).resolve();out.mkdir(parents=True,exist_ok=False);log=(out/'events.jsonl').open('x',encoding='utf8')
    def record(event):
        event['time']=time.time();log.write(json.dumps(event,ensure_ascii=False)+'\n');log.flush();print(json.dumps(event,ensure_ascii=False),flush=True)
    for bad in ([],['unknown'],['hold','ArrowRight'],['screen','../escape']):
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
            if not before['stage']: raise RuntimeError('no saved live battle')
            page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
            page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('(s)=>HonroApp.engine?.b?.honroStage===s',arg=before['stage'],timeout=60000)
            after_profile=page.evaluate('()=>HonroApp.profile');after=digest(after_profile)
            if before!=after:
                (out/'reload-diff.json').write_text(json.dumps({'before':before,'after':after},ensure_ascii=False,indent=2));raise AssertionError('saved profile mismatch; see reload-diff.json')
            observed=page.evaluate('''()=>{let b=HonroApp.engine.b;return {stage:b.honroStage,round:b.round,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),events:b.honroAct4PreviewState, assets:[...b.honroLandmarks,...b.honroElements].filter(v=>v.asset?.vector).map(v=>v.asset.id)}}''')
            for key in ('stage','round','units','events'):
                if observed[key]!=before[key]:
                    (out/'reload-diff.json').write_text(json.dumps({'before':before,'observed':observed},ensure_ascii=False,indent=2));raise AssertionError('runtime mismatch: '+key)
            if any(ref[2] not in observed['assets'] for ref in before['refs']):raise AssertionError('asset reference failed to restore')
            snapshot('after-page-reload');record({'same_context_reload':'passed','stage':before['stage'],'round':before['round'],'units':len(before['units']),'assetRefs':len(before['refs'])})
        def export_ui():
            page.keyboard.press('Escape');page.get_by_text('설정',exact=True).click();page.get_by_text('기록·관리',exact=False).click()
            with page.expect_download(timeout=60000) as pending: page.get_by_text('JSON 기록 내보내기',exact=True).click()
            d=pending.value;target=out/('ui-export-'+str(int(time.time()))+'.json');d.save_as(str(target));data=target.read_bytes();record({'ui_download':str(target),'suggested_filename':d.suggested_filename,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
            page.keyboard.press('Escape');page.wait_for_timeout(300)
        page.goto(o.url,wait_until='domcontentloaded');page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader',timeout=60000);page.locator('#file-import').set_input_files(str(Path(o.profile).resolve()));page.wait_for_timeout(3000);snapshot('fixture-import');page.get_by_text('여정 이어가기',exact=True).click();page.wait_for_timeout(2000);page.get_by_text('여정첩',exact=True).click();page.locator('[data-action=journey-select][data-id="38"]').click();page.wait_for_timeout(500);page.locator('[data-action=journey-travel][data-id="38"]').click();page.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=60000);page.wait_for_timeout(1500)
        if page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter');page.wait_for_timeout(2000)
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
                elif op=='wait':page.wait_for_timeout(int(args[1]))
                elif op=='screen':page.screenshot(path=str(out/(args[1]+'.png')))
                elif op=='snapshot':snapshot(args[1] if len(args)>1 else 'manual')
                elif op=='reload':reload_same_context()
                elif op=='export':export_ui()
                elif op=='next':page.locator('[data-action=result-continue]').click();page.wait_for_timeout(2500)
                elif op=='help':record({'commands':sorted(COMMANDS)})
                snapshot('after-'+op);record({'state':state()})
            except Exception as e:record({'error':repr(e)})
        ctx.close();browser.close()
if __name__=='__main__':main()
