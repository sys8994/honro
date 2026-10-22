"""Production void + report timer integration. Deep-gallery pose is a fixture."""
import ast, hashlib, json, os, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

OUT=ROOT/os.environ.get('HONRO_RELEASE_VOID_OUT','_local/reports/release-final/void-report')
OUT.mkdir(parents=True,exist_ok=True)
constants={}
for n in ast.parse((ROOT/'tests/act3-void-browser.py').read_text()).body:
    if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ['SETUP','BEGIN']:
        constants[n.targets[0].id]=ast.literal_eval(n.value)
PROBE="""()=>{const a=HonroApp,b=a.engine.b,r=b.honroReport,clock=a.reportClock,s=r.seconds,n=performance.now();
try{HonroClearReport.time(a,n);HonroClearReport.time(a,n+4000);return {state:b.honroAct3Void.state,secondsBefore:s,secondsAfter:r.seconds,active:a.reportClock.active,blocked:HonroAct3Void.blocked(a),dialogue:!!a.dialogue,quiet:HonroSodanWithdrawal.worldOutroDialogue(a)};}finally{a.reportClock=clock;}}"""
rows=[];errors=[]
with sync_playwright() as pw:
    browser=launch(pw);page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('window.HonroApp')
    for target in ['FALLING','DARKENING','VOID','RETURNING','RETURN_DIALOGUE']:
        page.evaluate(constants['SETUP'])
        assert page.evaluate(constants['BEGIN'])
        if target in ['DARKENING','VOID']:
            page.wait_for_function('(s)=>HonroApp.engine.b.honroAct3Void.state===s',arg=target)
        elif target in ['RETURNING','RETURN_DIALOGUE']:
            page.evaluate('HonroAct3Void.skip(HonroApp)')
            if target=='RETURN_DIALOGUE':
                page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED" && !!HonroApp.dialogue')
        quest=page.evaluate('JSON.stringify({objectives:HonroApp.engine.b.honroObjectives,act3:HonroApp.engine.b.honroState.act3})')
        row=page.evaluate(PROBE);row['target']=target
        assert row['secondsBefore']==row['secondsAfter'] and not row['active'] and not row['quiet'],row
        assert row['blocked'] or row['dialogue'],row
        page.wait_for_timeout(100)
        assert page.evaluate('HonroApp.engine.b.honroReport.seconds')==row['secondsBefore'],row
        assert quest==page.evaluate('JSON.stringify({objectives:HonroApp.engine.b.honroObjectives,act3:HonroApp.engine.b.honroState.act3})')
        rows.append(row);print('PASS real report excludes',target,flush=True)
        if target!='RETURN_DIALOGUE':
            page.evaluate('HonroAct3Void.skip(HonroApp)')
            page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED" && !!HonroApp.dialogue')
        page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp)')
    # Positive control: the same collector counts ordinary active battle time.
    control=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,clock=a.reportClock,s=b.honroReport.seconds;try{HonroClearReport.time(a,1000);HonroClearReport.time(a,2000);return b.honroReport.seconds-s;}finally{a.reportClock=clock;}}""")
    assert control==1,control
    assert not errors,errors
    version=browser.version;browser.close()
source=['shared/runtime/act3-void.js','shared/runtime/clear-report.js','shared/runtime/main.js','shared/runtime/sodan-withdrawal.js','web/manifest.json']
(OUT/'summary.json').write_text(json.dumps({'executionSHA':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'browser':version,'rows':rows,'ordinaryBattleControlSeconds':control,'errors':errors,'sourceHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in source},'limits':['Explicit deep-gallery pose, not normal stage27 completion.','Synthetic collector timestamps plus real frame observation; Chromium, not physical mobile.']},ensure_ascii=False,indent=2)+'\n')
