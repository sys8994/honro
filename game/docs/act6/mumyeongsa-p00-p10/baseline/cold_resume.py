"""Replay the repository's captured Act 6 boundary envelopes in isolated Chromium storage."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base

NODE = """
const fs=require('node:fs'), crypto=require('node:crypto');
const raw=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const {profile,body}=raw[process.argv[2]];
const sha=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
if(process.argv[3]==='bad-m09'){
  body.custody.witness.skill='M01';
  body.custodySHA=sha(body.custody);
}
console.log(JSON.stringify({
  'honro-first-act-profile-1':JSON.stringify(profile),
  [body.slot]:JSON.stringify({...profile,honroAct6ChapterBoundary:{body,sha:sha(body)}})
}));
"""

def storage_hash(records):
    return hashlib.sha256(json.dumps(records,sort_keys=True).encode()).hexdigest()

def seeded_context(browser,stage,negative=False,init_script=None,mobile=False):
    fixture=base.ROOT/"shared/act6-debug-stages/fixtures.json"
    seed=json.loads(subprocess.check_output(["node","-e",NODE,str(fixture),str(stage),
                                             "bad-m09" if negative else "exact"],text=True))
    context=saved_context(browser,seed,mobile)
    if init_script:
        context.add_init_script(init_script)
    return context

def saved_context(browser,seed,mobile=False):
    viewport={'width':390,'height':844} if mobile else {'width':1280,'height':900}
    context=browser.new_context(viewport=viewport,has_touch=mobile,is_mobile=mobile,device_scale_factor=1)
    context.route("**/*",lambda r:base.local_route(r) if r.request.url.startswith(base.BASE) else r.abort())
    context.add_init_script("""(() => {
        if(sessionStorage.getItem('honro-test-seeded'))return;
        for(const [k,v] of Object.entries(SEED))localStorage.setItem(k,v);
        sessionStorage.setItem('honro-test-seeded','1');
    })()""".replace("SEED",json.dumps(seed)))
    return context

def capture(browser,stage,negative=False):
    context=seeded_context(browser,stage,negative)
    page=context.new_page()
    row={"stage":stage,"negativeM09":negative,"errors":[],"warnings":[]}
    page.on("pageerror",lambda e:row["errors"].append(str(e)))
    page.on("console",lambda msg:row["warnings"].append(msg.text) if msg.type=="warning" else None)
    resume=f'[data-act6-boundary-resume="{stage}"]'
    try:
        for desc in ("first","reload"):
            if desc=="first":
                page.goto(base.BASE+"HONRO.html",wait_until="domcontentloaded")
            else:
                page.reload(wait_until="domcontentloaded")
            page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')",timeout=13000)
            base.action(page,"rest").click(timeout=6000)
            page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue",timeout=10000)
            button=page.locator(resume)
            row[desc]={"digestBefore":storage_hash(base.saved_bytes(page))}
            button.click(timeout=6000)
            if negative:
                page.wait_for_function("document.querySelector('#notice')?.textContent.includes('기록을 열지 못했습니다')",timeout=6000)
                row[desc]["held"]=page.evaluate("HonroApp.screen==='rest'&&!HonroApp.engine")
            else:
                page.wait_for_function("stage=>HonroApp.engine?.b?.honroStage===stage",arg=stage,timeout=10000)
                row[desc]["mounted"]=page.evaluate(base.SNAPSHOT)
            row[desc]["digestAfter"]=storage_hash(base.saved_bytes(page))
        runs=(row[k] for k in ("first","reload"))
        safe=all(run["digestBefore"]==run["digestAfter"] and (run["held"] if negative else run["mounted"]["stageId"]==stage)
                 for run in runs)
        row["status"]="PASS" if safe and not row["errors"] else "FAIL"
    except Error as error:
        row["status"]="FAIL"
        row["error"]=str(error)
        row["state"]=page.evaluate("()=>({app:HonroApp?.screen,body:document.body.innerText.slice(0,700)})")
    finally:
        context.close()
    return row

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build",required=True,type=Path)
    parser.add_argument("--out",required=True,type=Path)
    args=parser.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path="/usr/bin/chromium",headless=True,
                                           args=["--no-sandbox","--disable-dev-shm-usage"])
        for stage,negative in [(54,False),(55,False),(56,False),(55,True)]:
            result=capture(browser,stage,negative)
            case=f"cold-{stage}"+("-bad-m09" if negative else "")
            (args.out/f"{case}.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
            print(case,result["status"],result.get("error",""),flush=True)
        browser.close()

if __name__=="__main__":
    main()
