"""Exercise the pinned Act 6 app with real touch, walking, and read-only support captures."""
import argparse
import base64
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

from browser import BASE, SNAPSHOT, action, dismiss_dialogue, local_route, saved_bytes

FOOT = """() => {
    const a=HonroApp,e=a.engine,u=e.active,s=a.scene;
    return {id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,move:u.moveLeft,grounded:e.grounded(u),
      support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id??null,phase:e.b.phase,round:e.b.round,
      chart:[e.b.width,e.b.height],gravity:e.b.physics.gravity};
}"""

def enter(browser, stage, mobile=False):
    viewport = {"width":390,"height":844} if mobile else {"width":1440,"height":960}
    ctx = browser.new_context(viewport=viewport, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
    ctx.route("**/*", lambda r: local_route(r) if r.request.url.startswith(BASE) else r.abort())
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    def press(node):
        node.tap(timeout=6500) if mobile else node.click(timeout=6500)
    try:
        page.goto(BASE+"HONRO.html", wait_until="domcontentloaded")
        page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')", timeout=15000)
        for name, tail in (("settings",""),("settings-page",'[data-id="records"]'),("settings-page",'[data-id="debug"]')):
            press(action(page,name,tail))
        press(page.locator("#debug-mode-setting"))
        page.wait_for_function('HonroApp.screen==="rest" && HonroApp.debugMode', timeout=8000)
        dismiss_dialogue(page)
        page.wait_for_timeout(450)
        press(action(page,"journey-book"))
        press(action(page,"journey-act",'[data-id="6"]'))
        press(action(page,"journey-select",f'[data-id="{stage}"]'))
        page.wait_for_timeout(450)
        protected = saved_bytes(page)
        press(action(page,"journey-travel",f'[data-id="{stage}"]'))
        page.wait_for_function("id => HonroApp.engine?.b?.honroStage===id && !!HonroApp.scene", arg=stage, timeout=14000)
        dismiss_dialogue(page)
        page.wait_for_timeout(500)
        return ctx,page,protected,errors
    except Exception:
        ctx.close()
        raise

def touch(page,session,x,y,kind):
    points = [] if kind=="touchEnd" else [{"x":x,"y":y,"id":1,"radiusX":2,"radiusY":2}]
    session.send("Input.dispatchTouchEvent",{"type":kind,"touchPoints":points})

def mobile_case(browser,stage,out):
    ctx,page,protected,errors=enter(browser,stage,mobile=True)
    try:
        before=page.evaluate(FOOT)
        page.screenshot(path=out/f"mobile-{stage}.png")
        page.evaluate("""window.touchEvidence=[];
          for(const type of ['pointerdown','pointermove','pointerup'])
            document.addEventListener(type,e=>{if(e.target.closest('#joystick,#jump,#fire'))
              touchEvidence.push({type,pointer:e.pointerType,trusted:e.isTrusted,target:e.target.closest('#joystick,#jump,#fire').id});},true);""")
        stick=page.locator("#joystick").bounding_box()
        x=stick["x"]+stick["width"]*.5
        y=stick["y"]+stick["height"]*.5
        session=ctx.new_cdp_session(page)
        touch(page,session,x,y,"touchStart")
        touch(page,session,x+32,y,"touchMove")
        page.wait_for_timeout(280)
        touch(page,session,x+32,y,"touchEnd")
        page.wait_for_timeout(170)
        walked=page.evaluate(FOOT)
        page.locator("#jump").tap(timeout=5000)
        page.wait_for_timeout(75)
        rising=page.evaluate(FOOT)
        page.wait_for_function('HonroApp.engine.grounded(HonroApp.engine.active)',timeout=2500)
        landed=page.evaluate(FOOT)
        touches=page.evaluate("touchEvidence")
        return {"stage":stage,"before":before,"walked":walked,"rising":rising,"landed":landed,
                "viewport":page.viewport_size,"pointerEvents":touches,"normalSaveUnchanged":protected==saved_bytes(page),
                "errors":errors}
    finally:
        ctx.close()

def external_case(browser,stage,out):
    ctx,page,_,errors=enter(browser,stage)
    try:
        pixel_samples=page.evaluate("""() => {
          const a=HonroApp,e=a.engine,s=a.scene,b=e.b,u=e.active,cv=document.querySelector('#battlecanvas');
          const rect=cv.getBoundingClientRect(), view={wx:s.x,wy:s.y,scale:s.scale,bias:s.bias??0,width:rect.width,height:rect.height,
            canvasWidth:cv.width,canvasHeight:cv.height};
          const points=[-90,0,90].map(dx=>{
            const x=u.x+dx,support=e.contactSurface(x,u.y-150,u.y+150);
            return support?{x,y:support.y,id:support.t.id}:null;
          });
          const plain=cv.toDataURL();
          const previous=s.viewOptions?.debugTerrainOutline;
          s.viewOptions??={};s.viewOptions.debugTerrainOutline=true;
          s.render(e,0,a.selected,a.power,false,0,true);
          const overlay=cv.toDataURL();
          s.viewOptions.debugTerrainOutline=previous;
          const left=s.world(0,0),right=s.world(rect.width,rect.height);
          return {view,project:[left,right],foot:{x:u.x,y:u.y},points,plain,overlay};
        }""")
        for name in ("plain","overlay"):
            path=out/f"outer-{stage}-{name}.png"
            path.write_bytes(base64.b64decode(pixel_samples.pop(name).split(",")[1]))
        return {"stage":stage,"errors":errors,**pixel_samples}
    finally:
        ctx.close()

def sample_walk(page, direction, goal=None, limit=3500):
    """Measure piecewise world arclength during completed, trusted key movement."""
    page.evaluate("""() => {
      const e=HonroApp.engine;
      window.footTrace=[];
      const observe=()=>{const u=e.active;if(!u||HonroApp.engine!==e)return;
        if(window.traceWalk) { footTrace.push([u.x,u.y,e.grounded(u)]);requestAnimationFrame(observe); }
      };window.traceWalk=true;observe();
    }""")
    key="ArrowRight" if direction==1 else "ArrowLeft"
    page.keyboard.down(key)
    reached=False
    try:
        if goal is None:
            page.wait_for_timeout(limit)
        else:
            try:
                page.wait_for_function("([x,d])=>(HonroApp.engine.active.x-x)*d>=0",
                                       arg=[goal,direction],timeout=limit)
                reached=True
            except Error:
                pass
    finally:
        page.keyboard.up(key)
    page.wait_for_timeout(125)
    points=page.evaluate("() => { window.traceWalk=false; return footTrace; }")
    return {"direction":direction,"goal":goal,"reached":reached,"end":page.evaluate(FOOT),"points":points}

def chart(page):
    before=page.evaluate(FOOT)
    page.locator("[data-act6-qa-lookout]").click()
    notice=page.locator("#notice").text_content()
    page.wait_for_timeout(650)
    after=page.evaluate(FOOT)
    return {"before":before,"after":after,"notice":notice,"changed":before["chart"]!=after["chart"]}

def routes_case(browser,stage,out):
    ctx,page,protected,errors=enter(browser,stage)
    try:
        start=page.evaluate(FOOT)
        if stage==53:
            page.locator("[data-act6-qa-lookout]").click()
            page.wait_for_timeout(480)
            upper=page.evaluate(FOOT)
            toward_exit=sample_walk(page,1,2720)
            upper_walk={"gateStart":start,"gateArrival":upper,"upperToExit":toward_exit}
        else:
            first=sample_walk(page,1,518)
            early=chart(page)
            target=sample_walk(page,1,550) if not early["changed"] else None
            retry=chart(page) if target else None
            left=sample_walk(page,-1,2450) if (retry or early)["changed"] else None
            if left:
                page.wait_for_timeout(1500)
                left["postFall"]=page.evaluate(FOOT)
                next_chart=chart(page) if left["postFall"]["support"]=="mid-contact" else None
            else:
                next_chart=None
            upper_walk={"initialApproach":first,"earlyChart":early,"adjustedApproach":target,
                        "retriedChart":retry,"LLeft":left,"LtoC":next_chart}
        page.screenshot(path=out/f"route-{stage}.png")
        save_before_reload=protected==saved_bytes(page)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')", timeout=15000)
        reload_state=page.evaluate("()=>({screen:HonroApp.screen,engine:!!HonroApp.engine,debug:HonroApp.debugMode})")
        return {"stage":stage,"start":start,"paths":upper_walk,"reload":reload_state,
                "unchangedBeforeReload":save_before_reload,"unchangedAfterReload":protected==saved_bytes(page),
                "errors":errors}
    finally:
        ctx.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--case",choices=("mobile","outside","routes"),required=True)
    parser.add_argument("--stage",type=int,nargs="+")
    args=parser.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    launch={"mobile":(range(51,61),mobile_case),"outside":([51,52,55,57,59,60],external_case),
            "routes":([53,54],routes_case)}
    defaults,case=launch[args.case]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(executable_path="/usr/bin/chromium",headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        for stage in args.stage or defaults:
            try:
                result=case(browser,stage,args.out)
            except Error as error:
                result={"stage":stage,"harnessError":str(error)}
            result["chromium"]=browser.version
            (args.out/f"{args.case}-{stage}.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
            print(args.case,stage,result.get("harnessError","recorded"),flush=True)
        browser.close()

if __name__=="__main__":
    main()
