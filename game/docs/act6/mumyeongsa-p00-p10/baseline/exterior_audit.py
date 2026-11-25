"""Read normal Act 6 exterior support and capture matching with/without outline views."""
import argparse
import base64
import json
from pathlib import Path

from playwright.sync_api import Error, sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from legacy54_live import resume
from second_pass import FOOT, sample_walk, touch

STAGES = (51,52,55,57,59,60)
GEOMETRY = """() => {
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE;
 const bounds=b.honroPlayBounds??{left:0,right:b.width,top:0,bottom:b.height};
 const face=(t,k)=>{
   const ps=C.poly(t),p=ps[k],q=ps[(k+1)%ps.length],dx=q.x-p.x;
   if(dx<=0)return null;
   const slope=(q.y-p.y)/dx;
   const ys=x=>p.y+(x-p.x)*slope;
   const x=Math.max(p.x,bounds.left),hi=Math.min(q.x,bounds.right);
   if(hi<=x)return null;
   const claims=[.2,.5,.8].map(k=>{
    const sx=x+(hi-x)*k,y=ys(sx),z=e.contactSurface(sx,y-4,y+5);
    return {x:sx,y,visibleToSolver:z?.t.id===t.id,other:z?.t.id??null};
   });
   return {from:[x,ys(x)],to:[hi,ys(hi)],slope,walkable:Math.abs(slope)<=1.35,claims};
 };
 const colliders=b.terrain.map(t=>({id:t.id,type:t.oneWay?'platform':'solid',faces:C.poly(t).map((_,i)=>face(t,i)).filter(Boolean)}));
 const mapping={59:{nearGround:'finale-cutout-near-body',westTraversal:'finale-cutout-west-terrace'},
                60:{nearGround:'return-cutout-near-body',westTraversal:'return-cutout-upper-ledges'}}[b.honroStage];
 const rims=[];
 if(mapping){
   const rim=b.honroLandmarks.find(l=>l.id==='authored-contact-rim');
   for(const p of rim?.asset.visual??[]){
    const [left,right]=p.points,t=b.terrain.find(v=>v.id===mapping[p.id.match(/^[A-Za-z]+/)?.[0]]);
    if(!t||left.x>=right.x)continue;
    const x=Math.max(left.x,bounds.left),hi=Math.min(right.x,bounds.right);
    if(hi<=x)continue;
    const measured=[0,.25,.5,.75,1].map(i=>{
      const xx=x+(hi-x)*i,paint=left.y+(right.y-left.y)*(xx-left.x)/(right.x-left.x);
      const matches=C.terrainSurfaces(t,xx),best=matches.sort((a,d)=>Math.abs(a.y-paint)-Math.abs(d.y-paint))[0];
      return {x:xx,paint,contact:best?.y??null,delta:best?paint-best.y:null};
    });
    rims.push({id:p.id,host:t.id,measured});
   }
 }
 return {stage:b.honroStage,bounds,colliders,rims,active:e.active?.id};
}"""
CAPTURE = """camera=>{
 const a=HonroApp,e=a.engine,s=a.scene,cv=document.querySelector('#battlecanvas'),r=cv.getBoundingClientRect();
 const before={x:s.x,y:s.y,scale:s.scale,manual:s.manual};
 const previous=s.viewOptions?.debugTerrainOutline;
 if(camera)Object.assign(s,{...camera,manual:true});
 try{
  s.viewOptions??={};s.viewOptions.debugTerrainOutline=false;s.render(e,0,a.selected,a.power,false,0,true);
  const plain=cv.toDataURL();s.viewOptions.debugTerrainOutline=true;s.render(e,0,a.selected,a.power,false,0,true);
  return {plain,outline:cv.toDataURL(),left:s.world(0,0),right:s.world(r.width,r.height),scale:s.scale};
 }finally{
  Object.assign(s,before);s.viewOptions.debugTerrainOutline=previous;
 }
}"""

def open_stage(browser,stage,mobile,init_script=None):
    if stage!=51:
        context=seeded_context(browser,stage,mobile=mobile,init_script=init_script)
        page=context.new_page()
        resume(page,stage,True,mobile=mobile)
        return context,page
    fixture=json.loads((base.ROOT/'shared/act6-debug-stages/fixtures.json').read_text())['52']['profile']
    context=saved_context(browser,{'honro-first-act-profile-1':json.dumps(fixture,ensure_ascii=False)},mobile=mobile)
    if init_script:
        context.add_init_script(init_script)
    page=context.new_page()
    page.goto(base.BASE+'HONRO.html',wait_until='domcontentloaded')
    page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')",timeout=13000)
    press='tap' if mobile else 'click'
    getattr(base.action(page,'rest'),press)(timeout=6500)
    page.wait_for_function("HonroApp.screen==='rest' && !HonroApp.dialogue",timeout=10000)
    getattr(page.locator('[aria-label="스테이지 진입 · 무명사 외부"]'),press)(timeout=6500)
    page.wait_for_function('HonroApp.engine?.b?.honroStage===51',timeout=13000)
    base.dismiss_dialogue(page)
    return context,page

def capture(page,out,tag,camera=None):
    result=page.evaluate(CAPTURE,camera)
    for key in ('plain','outline'):
        data=result.pop(key).split(',',1)[1]
        (out/f'{tag}-{key}.png').write_bytes(base64.b64decode(data))
    return result

def movement(context,page,mobile):
    before=page.evaluate(FOOT)
    page.wait_for_function('HonroApp.canInput()',timeout=9500)
    if mobile:
        cdp=context.new_cdp_session(page)
        box=page.locator('#joystick').bounding_box()
        assert box
        x,y=box['x']+box['width']/2,box['y']+box['height']/2
        touch(page,cdp,x,y,'touchStart')
        touch(page,cdp,x+35,y,'touchMove')
        page.wait_for_timeout(340)
        touch(page,cdp,x+35,y,'touchEnd')
        page.wait_for_timeout(700)
    else:
        sample_walk(page,1,before['x']+105,2200)
    return {'before':before,'after':page.evaluate(FOOT)}

def audit(browser,out,stage,mobile):
    tag=f'{stage}-'+('touch' if mobile else 'pc')
    context=None
    result={'stage':stage,'interface':'touch' if mobile else 'key','status':'FAIL','errors':[]}
    try:
        context,page=open_stage(browser,stage,mobile)
        page.on('pageerror',lambda exc:result['errors'].append(str(exc)))
        before=storage_hash(base.saved_bytes(page))
        page.wait_for_timeout(740)
        result['geometry']=page.evaluate(GEOMETRY)
        result['start']=capture(page,out,tag+'-start')
        result['movement']=movement(context,page,mobile)
        bounds=result['geometry']['bounds']
        views=[]
        # Each normal viewport is paired with the exact same collision overlay.
        for n in range(5):
            x=bounds['left']+(bounds['right']-bounds['left'])*(.07+.215*n)
            land=page.evaluate("""x=>{
              const e=HonroApp.engine,u=e.active;
              const q=e.contactSurface(x,u.y-650,u.y+800)||e.contactSurface(x,-1500,e.b.height+200);
              return {x,y:q?.y??(e.b.height*.62),id:q?.t.id??null};
            }""",x)
            pair=capture(page,out,f'{tag}-zone-{n}',{'x':x,'y':land['y']-160,'scale':.62 if mobile else .78})
            views.append({'zone':n,'referenceSupport':land,'camera':pair})
        result['zones']=views
        result['storageUnchanged']=before==storage_hash(base.saved_bytes(page))
        assert result['storageUnchanged'] and not result['errors']
        result['status']='CAPTURED'
    except (Error,AssertionError) as exc:
        result['error']=str(exc)[:3000]
    finally:
        if context:context.close()
    return tag,result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--stages',type=int,nargs='+',default=STAGES,choices=STAGES)
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                   args=['--no-sandbox','--disable-dev-shm-usage'])
        for stage in args.stages:
            for mobile in (False,True):
                tag,result=audit(browser,args.out,stage,mobile)
                (args.out/f'{tag}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
                print(tag,result['status'],result.get('error','')[:160],flush=True)
        browser.close()

if __name__=='__main__':
    main()
