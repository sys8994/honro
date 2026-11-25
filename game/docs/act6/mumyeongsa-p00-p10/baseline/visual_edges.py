"""Capture matching play-view and collision overlays for the 53, 54, and 58 hulls."""
import argparse
import base64
import hashlib
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps
from playwright.sync_api import sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from exterior_audit import capture
from legacy54_live import resume
from mobile_seams import REPLAY
from native_b import finish_wall

GEOMETRY="""() => {
 const e=HonroApp.engine,b=e.b,C=HONRO_CORE;
 const play=b.honroPlayBounds??{left:0,right:b.width,top:0,bottom:b.height};
 const world=b.honroTerrainBounds??play;
 const write=t=>({id:t.id,points:C.poly(t).map(p=>[p.x,p.y]),oneWay:!!t.oneWay,type:t.type??null});
 const key=p=>JSON.stringify(p.map(v=>[v.x,v.y]).sort(([x,y],[a,z])=>x-a||y-z));
 const landmark=b.honroLandmarks?.find(l=>l.asset?.id==='mumyeongsa-broken-rail');
 const paint=new Set((landmark?.asset.visual??[]).map(p=>key(p.points)));
 const terrain=new Map(b.terrain.map(p=>[p.id,p]));
 const sharedB=(b.honroWorldTerrain??[]).filter(t=>t.id.startsWith('b-dummy-')).map(t=>({
  id:t.id,points:write(t).points,visual:paint.has(key(C.poly(t))),
  localCollision:terrain.has(t.id)&&key(C.poly(t))===key(C.poly(terrain.get(t.id))),
 }));
 return {stage:b.honroStage,play,world,active:e.active.id,domain:HonroTerrainDomain.active(b),
  local:b.terrain.map(write),worldTerrain:(b.honroWorldTerrain??[]).map(write),sharedB,
  artwork:(b.honroLandmarks??[]).map(l=>({id:l.id,x:l.x,y:l.y,faces:l.asset?.visual?.length??0,layer:l.depthLayer})),
  d:b.honroState.localHallDOrigin??null};
}"""
BULK="""({name, scale}) => {
 const a=HonroApp,b=a.engine.b,scene=a.scene,C=HONRO_CORE,domain=HonroTerrainDomain;
 const play=b.honroPlayBounds,outer=b.honroTerrainBounds;
 const allowed=({
   '53':t=>['south','west','north','east'].includes(t.id)||t.id.startsWith('b-'),
   '54-B':t=>t.id.startsWith('b-'),
   '58':t=>t.id.startsWith('local-lower-08'),
 })[name]??(t=>!t.oneWay);
 const choose=({
   '53':l=>['art-m53-grey-bedrock','art-mumyeongsa-broken-rail'].includes(l.id),
   '54-B':l=>l.id==='art-mumyeongsa-broken-rail',
   '58':l=>/-(body|facets)$/.test(l.id),
 })[name]??(l=>/^art-g(?:00|1[0-6])-/.test(l.id));
 const ts=domain.render(b).filter(t=>!t.broken&&allowed(t));
 const ls=domain.materialLandmarks(b).filter(choose);
 const paint=document.createElement('canvas');
 paint.width=Math.ceil((outer.right-outer.left)*scale);
 paint.height=Math.ceil((outer.bottom-outer.top)*scale);
 const c=paint.getContext('2d',{alpha:true});
 c.setTransform(scale,0,0,scale,-outer.left*scale,-outer.top*scale);
 for(const t of ts)scene.terrain(c,t);
 for(const layer of ['back','structural-back','mid','prop','front'])scene._landmarkLayer(c,ls,layer);
 const dimensions={paint:ts.map(t=>({id:t.id,vertices:C.poly(t).length})),art:ls.map(l=>({
   id:l.id,faces:l.asset.visual?.length??0,sourcePolygonEndpoints:l.asset.visual?.reduce((n,f)=>n+f.points.length,0)??0,
   treeNodes:l.asset.params?.nodeCount??null,clip:l.asset.vector?.root?.clipPath??null,
 }))};
 return {image:paint.toDataURL('image/png'),dimensions,play,outer};
}"""


def scene_context(browser, stage, source=None, mobile=False):
    if not source:
        return seeded_context(browser,stage,mobile=mobile)
    path,key=source
    fixture=base.ROOT/'shared/act6-debug-stages/fixtures.json'
    records=json.loads(subprocess.check_output(
        ['node','-e',REPLAY,str(fixture),str(path),key,str(stage)],text=True))
    return saved_context(browser,records,mobile=mobile)


def sheet(out, name, kind, labels):
    tile_w,tile_h,label_h=520,315,24
    atlas=Image.new('RGB',(tile_w*3,(tile_h+label_h)*3),'#121619')
    write=ImageDraw.Draw(atlas)
    for i,label in enumerate(labels):
        with Image.open(out/f'{name}-{label}-{kind}.png') as file:
            tile=ImageOps.contain(file.convert('RGB'),(tile_w-8,tile_h-4))
        x,y=(i%3)*tile_w,(i//3)*(tile_h+label_h)
        atlas.paste(tile,(x+(tile_w-tile.width)//2,y+(tile_h-tile.height)//2))
        write.text((x+12,y+tile_h+5),label,fill='#e6e2dc')
    atlas.save(out/f'{name}-edges-{kind}.webp',quality=87)


def measure_bulk(page,out,name):
    rows=[]
    for ratio in (1,2):
        scale=ratio*1440/6800
        data=page.evaluate(BULK,{'scale':scale,'name':name})
        png=base64.b64decode(data.pop('image').split(',',1)[1])
        with Image.open(io.BytesIO(png)) as render:
            alpha=render.getchannel('A')
        play,outer=data['play'],data['outer']
        crop=tuple(round((play[k]-outer['left' if k in ('left','right') else 'top'])*scale)
                   for k in ('left','top','right','bottom'))
        def area(mask):
            return sum(i*n for i,n in enumerate(mask.histogram()))/(255*scale*scale)
        interior=area(alpha.crop(crop))
        total=area(alpha)
        mask=out/f'{name}-bulk-{ratio}x.png'
        alpha.save(mask)
        rows.append({'scale':scale,'mask':mask.name,'maskSHA256':hashlib.sha256(mask.read_bytes()).hexdigest(),
                     'playWorldArea':round(interior,2),'outerOnlyWorldArea':round(total-interior,2),**data})
    return rows


def survey(browser,args,stage,name,source,enter=None):
    with scene_context(browser,stage,source) as context:
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda exc:errors.append(str(exc)))
        resume(page,stage,True)
        before=storage_hash(base.saved_bytes(page))
        if enter:
            enter(page)
        page.locator('#turn-banner').wait_for(state='hidden',timeout=4500)
        page.wait_for_function('!HonroReinforcementCamera.active(HonroApp.scene)',timeout=6000)
        geometry=page.evaluate(GEOMETRY)
        p=geometry['play']
        l,t,r,b=(p[k] for k in ('left','top','right','bottom'))
        width,height=r-l,b-t
        canvas=page.locator('#battlecanvas').bounding_box()
        full=min(canvas['width']/width,canvas['height']/height)*.9
        middle=((l+r)/2,(t+b)/2)
        corners={'northwest':(l,t),'north':(middle[0],t),'northeast':(r,t),
                 'west':(l,middle[1]),'center':middle,'east':(r,middle[1]),
                 'southwest':(l,b),'south':(middle[0],b),'southeast':(r,b)}
        views={label:capture(page,args.out,f'{name}-{label}',{'x':x,'y':y,'scale':.62}) for label,(x,y) in corners.items()}
        overview=capture(page,args.out,f'{name}-overview',{'x':middle[0],'y':middle[1],'scale':full})
        o=geometry['world']
        outer_center=((o['left']+o['right'])/2,(o['top']+o['bottom'])/2)
        outer_scale=min(canvas['width']/(o['right']-o['left']),canvas['height']/(o['bottom']-o['top']))*.94
        outer=capture(page,args.out,f'{name}-world',{'x':outer_center[0],'y':outer_center[1],'scale':outer_scale})
        for label,(x,y) in corners.items():
            view=views[label]
            assert view['left']['x']<=x<=view['right']['x'] and view['left']['y']<=y<=view['right']['y'],(name,label,view)
        for kind in ('plain','outline'):
            sheet(args.out,name,kind,corners)
            for span in ('overview','world'):
                with Image.open(args.out/f'{name}-{span}-{kind}.png') as img:
                    img.save(args.out/f'{name}-{span}-{kind}.webp',quality=89)
        assert before==storage_hash(base.saved_bytes(page)) and not errors,errors
        return {'stage':stage,'chart':name,'viewport':page.viewport_size,'bounds':geometry,'views':views,
                'overview':overview,'worldView':outer,'bulk':measure_bulk(page,args.out,name),
                'unchangedStorage':True,'status':'CAPTURED'}


def seam_views(browser,args):
    assert args.b_proof and args.d_proof and args.r_proof
    cases=[('B-touch',54,(args.b_proof,'checkpoint54'),True,3160,490,.82),
           ('B-wall',54,(args.b_proof,'checkpoint54'),False,3200,380,.98),
           ('58-soffit-touch',58,(args.d_proof,'checkpoint58'),True,4200,2550,.82),
           ('R-58-send',58,(args.d_proof,'checkpoint58'),False,3260,3230,.90),
           ('R-59-receive-touch',59,(args.r_proof,'checkpoint59'),True,3260,3230,.82)]
    result=[]
    for name,stage,source,mobile,x,y,z in cases:
        with scene_context(browser,stage,source,mobile) as context:
            page=context.new_page()
            resume(page,stage,True,mobile=mobile)
            storage=storage_hash(base.saved_bytes(page))
            viewport=page.viewport_size
            frame=capture(page,args.out,name,dict(x=x,y=y,scale=z))
            assert abs((frame['left']['x']+frame['right']['x'])/2-x)<1 and abs(frame['scale']-z)<1e-9,frame
            assert storage==storage_hash(base.saved_bytes(page))
            result.append({'name':name,'stage':stage,'viewport':viewport,'frame':frame,'saveSHA256':storage})
            print(name,'CAPTURED',frame,flush=True)
    (args.out/'seams.json').write_text(json.dumps(result,indent=2)+'\n')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--build',required=True,type=Path)
    p.add_argument('--out',required=True,type=Path)
    p.add_argument('--b-proof',type=Path)
    p.add_argument('--d-proof',type=Path)
    p.add_argument('--r-proof',type=Path)
    p.add_argument('--seams',action='store_true')
    p.add_argument('--only',nargs='+')
    args=p.parse_args()
    base.ROOT=args.build.resolve()
    args.out.mkdir(parents=True,exist_ok=True)
    cases=[(53,'53',None,None),(54,'54-legacy-N',None,None),(58,'58',(args.d_proof,'checkpoint58') if args.d_proof else None,None)]
    if args.b_proof:
        source=(args.b_proof,'checkpoint54')
        cases.insert(2,(54,'54-B',source,None))
        cases.insert(3,(54,'54-native-N',source,lambda page:finish_wall(page,{})))
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            if args.seams:
                seam_views(browser,args)
                raise SystemExit(0)
            results=[]
            for stage,name,proof,enter in cases:
                if args.only and name not in args.only:
                    continue
                data=survey(browser,args,stage,name,proof,enter)
                results.append(data)
                print(name,'CAPTURED',len(data['views']),'edges and center',flush=True)
    (args.out/'edges.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
