"""Focused before/after real Scene evidence; no campaign storage/profile reuse.

Run --phase 1 before beginning phase 2; run --phase 2 after its build.
The preserved baseline determines scope, never the edited review labels.
"""
import argparse, base64, hashlib, io, json
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

parser=argparse.ArgumentParser();parser.add_argument('--phase',type=int,choices=[1,2],required=True);parser.add_argument('--hosts',action='store_true');args=parser.parse_args()
OUT=ROOT/'_local/reports/character-redesign'/f'phase{args.phase}-qa';OUT.mkdir(parents=True,exist_ok=True)
BASE=story_base_url();results={'phase':args.phase,'checks':[],'errors':[],'rows':[]}
def check(name,ok,detail=None):
    results['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print('PASS' if ok else 'FAIL',name,flush=True)
def decode(value):return Image.open(io.BytesIO(base64.b64decode(value.split(',')[1]))).convert('RGBA')
def hash_pixels(im):return hashlib.sha256(im.tobytes()).hexdigest()
DRAW=r'''([id,pixels,motion,phase,facing])=>{const row=HONRO_CATALOG.rows.find(r=>r.id===id),cv=document.createElement('canvas');cv.width=360;cv.height=440;HonroCatalogRenderer.draw(cv,row,{pixels,motion,phase,facing,x:180,y:395});return cv.toDataURL()}'''
with sync_playwright() as p:
    browser=launch(p);pages=[];inventories=[]
    for path in ['_local/reports/character-redesign/before/catalog.html','tools/character-catalog.html']:
        page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1);page.on('pageerror',lambda e:results['errors'].append(str(e)))
        page.goto(BASE+'/'+path);page.wait_for_function('window.HonroCatalogRenderer && window.HONRO_CATALOG');pages.append(page);inventories.append(page.evaluate('HONRO_CATALOG'))
    rows=[r for r in inventories[0]['rows'] if r['review']['verdict']==('우선 개편' if args.phase==1 else '수정 권장')]
    check('Baseline scope count',len(rows)==(13 if args.phase==1 else 33),[r['id'] for r in rows])
    results['baselineSource']=inventories[0]['sourceCommit'];results['currentSource']=inventories[1]['sourceCommit']
    results['artifacts']={path:hashlib.sha256((ROOT/path).read_bytes()).hexdigest() for path in ['_local/reports/character-redesign/before/catalog.html','tools/character-catalog.html','HONRO.html','HONRO_WORKSHOP.html']}
    snapshots=[page.evaluate('JSON.stringify({rows:HONRO_CATALOG.rows,project:HONRO_PROJECT,skills:HONRO_CORE.SKILLS})') for page in pages]
    check('Authored project and skill definitions unchanged',pages[0].evaluate('JSON.stringify([HONRO_PROJECT,HONRO_CORE.SKILLS])')==pages[1].evaluate('JSON.stringify([HONRO_PROJECT,HONRO_CORE.SKILLS])'))
    check('Every catalog unit/context unchanged',all(next(n for n in inventories[1]['rows'] if n['id']==r['id'])['unit']==r['unit'] and next(n for n in inventories[1]['rows'] if n['id']==r['id']).get('context')==r.get('context') for r in inventories[0]['rows']))
    for hero in [r for r in inventories[0]['rows'] if r.get('excluded')]:
        identical=True
        for motion in ['idle','move','attack','hit','jump_fall']:
            for phase in [.15,.65]:
                ims=[decode(page.evaluate(DRAW,[hero['id'],180,motion,phase,1])) for page in pages];identical &= hash_pixels(ims[0])==hash_pixels(ims[1])
        check('Hero pixels unchanged: '+hero['id'],identical)
    for start in range(0,len(rows),4):
        sheet=Image.new('RGB',(2160,490*len(rows[start:start+4])), '#111b1c');d=ImageDraw.Draw(sheet)
        for j,row in enumerate(rows[start:start+4]):
            record={'id':row['id'],'baselineVerdict':row['review']['verdict'],'samples':[]};motion_sheet=Image.new('RGB',(2160,920),'#111b1c');md=ImageDraw.Draw(motion_sheet)
            for k,size in enumerate([180,90,35]):
                for side,page in enumerate(pages):
                    im=decode(page.evaluate(DRAW,[row['id'],size,'idle',.2,1]));x=k*720+side*360;y=j*490
                    sheet.paste(im,(x,y),im);d.text((x+10,y+450),f"{row['id']} {size}px {'BEFORE' if side==0 else 'AFTER'}",fill='#ece4cf')
                    record['samples'].append({'size':size,'version':side,'hash':hash_pixels(im),'bounds':im.getbbox()})
            changed=record['samples'][0]['hash']!=record['samples'][1]['hash'];check('Actual scene changed: '+row['id'],changed)
            motion_hashes={}
            for m,motion in enumerate(['idle','move','attack','hit','jump_fall']):
                for face in [-1,1]:
                    for phase in [.15,.65]:
                        im=decode(pages[1].evaluate(DRAW,[row['id'],180,motion,phase,face]));bounds=im.getbbox();record.setdefault('motionBounds',[]).append({'motion':motion,'phase':phase,'facing':face,'bounds':bounds})
                        motion_hashes[f'{motion}/{face}/{phase}']=hash_pixels(im)
                        if phase==.65:
                            x=m*360;y=0 if face==1 else 460;motion_sheet.paste(im,(x,y),im);md.text((x+10,y+425),f'{motion} facing {face}',fill='#ece4cf')
            record['motionHashes']=motion_hashes
            check('Visible bounded sampled motions: '+row['id'],all(v['bounds'] and v['bounds'][0]>0 and v['bounds'][1]>0 and v['bounds'][2]<360 and v['bounds'][3]<440 for v in record['motionBounds']),record['motionBounds'])
            dead=pages[1].evaluate('''id=>{const row=HONRO_CATALOG.rows.find(r=>r.id===id),cv=document.createElement('canvas');cv.width=360;cv.height=440;const s=new HonroScene(cv),u={...structuredClone(row.unit),x:180,y:395,dead:true};s.battle={units:[u],honroStaging:{hidden:{}}};s.actorEngine={b:s.battle};s.unit(cv.getContext('2d'),u,false,0);return cv.getContext('2d').getImageData(0,0,360,440).data.some((v,i)=>i%4===3&&v)}''',row['id'])
            check('Dead actor suppressed: '+row['id'],not dead)
            motion_sheet.save(OUT/(row['id']+'-motions.png'));results['rows'].append(record)
        sheet.save(OUT/f'comparison-{start//4+1}.png')
    for i,page in enumerate(pages):check(f'Rendering preserves catalog/battle inputs {i}',snapshots[i]==page.evaluate('JSON.stringify({rows:HONRO_CATALOG.rows,project:HONRO_PROJECT,skills:HONRO_CORE.SKILLS})'))
    current=pages[1]
    for w,h in [(1440,1000),(390,844),(844,390)]:
        current.set_viewport_size({'width':w,'height':h});current.evaluate("CharacterCatalog.open('keeper')");current.screenshot(path=str(OUT/f'catalog-keeper-{w}.png'));check(f'Catalog detail fits {w}px',current.locator('#detail').evaluate('e=>e.scrollWidth<=e.clientWidth'));current.locator('#detail').evaluate('e=>e.close()')
    if args.hosts:
        for w,h in [(1440,900),(844,390)]:
            for host in ['HONRO','HONRO_WORKSHOP']:
                page=browser.new_page(viewport={'width':w,'height':h},is_mobile=w<1000,has_touch=w<1000);page.on('pageerror',lambda e:results['errors'].append(str(e)));page.goto(BASE+'/'+host+'.html')
                if host=='HONRO':
                    page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.frame=()=>{}')
                else:page.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
                for sid in ([8,10,18,28] if args.phase==2 else [10,18,28]):
                    if host=='HONRO':
                        state=page.evaluate('''sid=>{const a=HonroApp,st=HONRO_PROJECT.stages[sid-1];a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};for(let i=1;i<=30;i++)a.profile.cleared[i]={};a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{time:0,walkTime:0,manual:true,storyTween:null,goalFocus:null,cinematic:null,x:(([8,18].includes(sid)&&a.engine.b.units.find(u=>u.honroObjectiveTarget))||a.engine.b.units.find(u=>u.honroType==='keeper')||a.engine.b.units.find(u=>['warden','ghost','shade','bellCluster'].includes(u.honroType))||a.engine.b.units.find(u=>u.side===1&&!u.dead)||a.engine.active).x,y:(([8,18].includes(sid)&&a.engine.b.units.find(u=>u.honroObjectiveTarget))||a.engine.b.units.find(u=>u.honroType==='keeper')||a.engine.b.units.find(u=>['warden','ghost','shade','bellCluster'].includes(u.honroType))||a.engine.b.units.find(u=>u.side===1&&!u.dead)||a.engine.active).y-100,scale:.7});a.scene.render(a.engine,0,'',.6,false,0);a.updateHUD(true);return{units:a.engine.b.units.length,targets:a.engine.b.units.filter(u=>u.honroObjectiveTarget).map(u=>({id:u.id,hp:u.hp,side:u.side,x:u.x,y:u.y})),error:a.lastError||null}}''',sid)
                    else:
                        state=page.evaluate('''sid=>{HonroWorkshopAPI.selectStage('stage-'+sid);const st=HonroWorkshopAPI.getProject().stages[sid-1];const e=HonroWorkshopAPI.getRuntime().engine,u=([8,18].includes(sid)&&e.b.units.find(u=>u.honroObjectiveTarget))||e.b.units.find(u=>u.honroType==='keeper')||e.b.units.find(u=>['warden','ghost','shade','bellCluster'].includes(u.honroType))||e.b.units.find(u=>u.side===1&&!u.dead)||e.b.units[0];HonroWorkshopAPI.setCamera({x:u.x,y:u.y-100,zoom:.7});HonroWorkshopAPI.render();return{units:e.b.units.length,focus:u.id,targets:e.b.units.filter(u=>u.honroObjectiveTarget).map(u=>({id:u.id,hp:u.hp,side:u.side}))}}''',sid)
                    page.screenshot(path=str(OUT/f'{host}-stage{sid}-{w}.png'));check(f'{host} real stage {sid} {w}px',state['units']>0 and not state.get('error'),state)
                page.close()
    check('No browser exceptions',not results['errors'],results['errors']);browser.close()
(OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
assert all(c['passed'] for c in results['checks']), 'See results.json; failed checks are not silently waived'
