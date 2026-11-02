"""Actual built-browser normal entry and read-only prediction smoke, not mission play.
Run after genuine release build; HONRO_BASE_URL may point to the built deployment.
Spawn probes need not intersect the bell; focused baseline-failing native tests
supply target-hit semantics. No live actor/flag/resource writes or paused frames.
"""
import argparse, hashlib, json, subprocess, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--out',default='_local/reports/preview-observation-browser')
args=parser.parse_args();out=ROOT/args.out;out.mkdir(parents=True,exist_ok=True)
fixture=json.loads((ROOT/'tests/fixtures/act23-v4-preview-entry.json').read_text())
report={'passed':False,'scope':__doc__,'fixture':fixture,'sourceSHA':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'rows':[],'pageErrors':[],'httpFailures':[],'exception':None}

SETUP="""({stage,party})=>{
 const p=HonroProfileStore.fresh();p.recruited=[...party];p.party=[...party];
 p.settings.debugMode=false;
 for(let i=1;i<stage;i++)p.cleared[i]={visits:1,rounds:3};
 p.honroJourney={version:1,restStageId:stage,talked:{}};
 localStorage.setItem('honro-first-act-profile-1',JSON.stringify(p));
 return {hasBattle:!!p.honroBattle,priorClearCount:Object.keys(p.cleared).length};
}"""
PROBES="""()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,u=e.active;
 if(!e['honroReviewed'+b.honroStage+'Bound'])throw Error('reviewed observer wrapper is not attached');
 if(!u||u.side!==0||b.side!==0||a.dialogue)throw Error('not a normal player observation boundary');
 const legal=HonroStakeCrossing.skills(b,u).find(id=>C.SKILLS[id]&&!C.SKILLS[id].passive);
 const wrong=Object.values(C.SKILLS).find(s=>['archer','mage','knight','occultist'].includes(s.cls)&&s.cls!==u.cls&&!s.passive&&s.id&&!HonroStakeCrossing.skills(b,u).includes(s.id));
 if(!legal||!wrong)throw Error('missing legal/incompatible test skills');
 const target=b.honroStage===16?e.unit('resident-1'):undefined;
 const rows=[];
 for(const test of [{skill:legal,collect:false,name:'hypothetical-legal'},{skill:wrong.id,collect:true,name:'collected-incompatible'}]){
  for(const angle of [u.angle,45,95]){
   const before=JSON.stringify(b);let hit,exception=null;
   try{hit=e.predict(u,C.SKILLS[test.skill],angle,u.lastPower??.5,target,test.collect);}catch(err){exception=String(err.stack||err);}
   const after=JSON.stringify(b);
   rows.push({...test,angle,actor:u.id,actorClass:u.cls,available:HonroStakeCrossing.skills(b,u).includes(test.skill),unchanged:before===after,beforeBytes:before.length,afterBytes:after.length,exception,endpoint:hit?{x:hit.x,y:hit.y,terrain:hit.terrain,unit:hit.unit}:null});
   if(exception||before!==after)break;
  }
  if(rows.some(r=>r.exception||!r.unchanged))break;
 }
 return {stage:b.honroStage,round:b.round,phase:b.phase,active:u.id,selected:a.selected,debugMode:a.debugMode===true,rows,limit:'Initial-spawn probes, not guaranteed bell intersection or full mission; no live state repair.'};
}"""

def drain(page):
    for _ in range(180):
        if not page.evaluate('!!HonroApp.dialogue'):
            page.wait_for_timeout(120)
            if not page.evaluate('!!HonroApp.dialogue'):return
        button=page.locator('[data-action="dialogue-next"]:visible')
        if button.count():button.first.click();page.wait_for_timeout(40)
        else:page.keyboard.press('Enter');page.wait_for_timeout(100)
    raise AssertionError('normal dialogue did not drain within 180 UI advances')

try:
    with sync_playwright() as pw:
        browser=launch(pw);base=story_base_url()
        for viewport in fixture['viewports']:
            for stage in fixture['stages']:
                label=f'{stage}-{viewport["width"]}'
                ctx=browser.new_context(viewport=viewport,is_mobile=viewport['width']<600,has_touch=viewport['width']<600)
                page=ctx.new_page()
                page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
                page.on('response',lambda r:report['httpFailures'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
                try:
                    response=page.goto(base+'/HONRO.html');assert response and response.ok
                    html=response.body();page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
                    receipt=page.evaluate(SETUP,{'stage':stage,'party':fixture['party']});assert not receipt['hasBattle']
                    page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000)
                    page.locator('[data-action="rest"]').first.click();drain(page)
                    page.locator(f'[data-action="journey-enter"][data-id="{stage}"]').click()
                    page.wait_for_function('(stage)=>HonroApp.engine?.b.honroStage===stage',arg=stage,timeout=120000)
                    drain(page)
                    page.wait_for_function('!HonroApp.dialogue&&HonroApp.engine?.b.side===0&&HonroApp.engine.active?.side===0',timeout=30000)
                    row=page.evaluate(PROBES);row.update({'viewport':viewport,'fixtureReceipt':receipt,'builtHTMLSHA256':hashlib.sha256(html).hexdigest()})
                    report['rows'].append(row)
                    page.screenshot(path=str(out/f'{label}-entry.png'),full_page=True)
                    assert not row['debugMode'],row
                    assert all(r['unchanged'] and not r['exception'] for r in row['rows']),row
                except Exception:
                    page.screenshot(path=str(out/f'{label}-failure.png'),full_page=True)
                    raise
                finally:ctx.close()
        browser.close()
    assert not report['pageErrors'] and not report['httpFailures'],report
    report['passed']=True
except Exception:
    report['exception']=traceback.format_exc()
    raise
finally:
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('PASS normal UI 16/18 desktop/mobile entry and immutable spawn prediction probes; not full mission acceptance')
