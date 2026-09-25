import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'game/reports/rc13-ui'; OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def ck(ok,name,detail=None):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append({'name':name,'detail':detail}); print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    stochastic=page.evaluate("""()=>Object.fromEntries(['M13','M14','M15'].map(id=>{const s=HONRO_CORE.SKILLS[id],r=HONRO_CORE.skillScoreBreakdown(s);return[id,{name:s.name,control:r.aimControl,factor:r.factor,effective:s.damage*r.factor}]}))""")
    ck(stochastic['M13']['factor']>1.45 and stochastic['M14']['factor']>2.25 and stochastic['M15']['factor']>1.8,'Stochastic multishot damage compensation is present',stochastic)
    snapshots={}
    for sid in [2,3,6,8,10]:
        d=page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<sid;i++)a.profile.cleared[i]={};a.profile.seen['map-story-v5-0']=true;a.profile.recruited=HonroStageRules.stageParty(sid);a.profile.party=[...a.profile.recruited];a.launch(sid);if(a.dialogue)HonroStory.finish(a);const b=a.engine.b;const get=id=>{const u=b.units.find(x=>x.id===id);return u&&{name:u.name,hp:u.hp,attack:u.attack,armor:u.armor,mid:!!u.honroMidboss,final:!!u.honroFinalBoss}};let reinf=0;const add=x=>{if(!x)return;if(x.type==='spawn'||x.type==='sniperAmbush')reinf+=x.n||1;else if(x.type==='multi')for(const q of x.actions||[])add(q)};for(const e of b.honroEvents||[])add(e.action);return{sid,damheo:get('npc-damheo'),hwigyeom:get('npc-hwigyeom'),mid3:get('midboss-stage3'),mid6:get('midboss-stage6'),boss:get('boss'),normal:b.units.filter(u=>u.side===1&&!u.honroMidboss&&!u.honroFinalBoss&&!u.boss).length,reinf};}""",sid)
        snapshots[str(sid)]=d
    ck(snapshots['2']['damheo']['hp']>=490 and snapshots['2']['damheo']['attack']>=1.35,'Stage 2 Damheo browser stats',snapshots['2']['damheo'])
    ck(snapshots['2']['normal']==6 and snapshots['2']['reinf']==2,'Stage 2 encounter load reduced for 7–8 turn target',snapshots['2'])
    ck(snapshots['3']['hwigyeom']['hp']>=740 and snapshots['3']['hwigyeom']['armor']>=.22,'Stage 3 Hwigyeom browser stats',snapshots['3']['hwigyeom'])
    ck(snapshots['3']['mid3']['mid'] and snapshots['6']['mid6']['mid'] and snapshots['8']['boss']['mid'],'Midbosses appear in Stages 3, 6 and 8',{k:snapshots[k] for k in ['3','6','8']})
    ck(snapshots['10']['boss']['final'] and snapshots['10']['boss']['hp']>=5500 and snapshots['10']['boss']['attack']>=3.3,'Stage 10 Sodan final-boss stats',snapshots['10']['boss'])
    ck(not errors,'No browser runtime exceptions',errors)
    (ROOT/'game/reports/rc13-browser.json').write_text(json.dumps({'checks':checks,'snapshots':snapshots,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('RC13 BROWSER PASSED',len(checks))
