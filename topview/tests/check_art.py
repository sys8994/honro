"""Measure the chapter's actual projected sprites and local edge contrast at neutral motion."""
import argparse, io, json, os, statistics
from PIL import Image
from pathlib import Path
from playwright.sync_api import sync_playwright
from native_entry import enter_chapter

parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True)
parser.add_argument('--original',action='store_true',help='Measure the 3472c704 baseline before per-sheet grading existed.')
parser.add_argument('--out',type=Path,required=True)
parser.add_argument('--views',action='store_true',help='Also save the six fixed-camera chapter views.')
args=parser.parse_args()
args.out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    p=b.new_page(viewport={'width':1100,'height':730},reduced_motion='reduce')
    p.goto(args.base);enter_chapter(p)
    while p.locator('[data-action=dialogue-next]:visible').count():
        p.locator('[data-action=dialogue-next]:visible').first.click()
    p.wait_for_function('HonroApp.canInput()&&!HonroStory.turnPaused(HonroApp)')
    p.wait_for_timeout(2500);p.mouse.move(380,320)
    if args.views:
        views=[('entry',320,791),('timber',994,308),('stone',927,791),('cart',654,563),('temple',710,670),('ridge',1518,310)]
        cameras={}
        p.mouse.move(560,354)
        p.screenshot(path=args.out/'default.jpg',quality=89)
        for name,x,y in views:
            cameras[name]=p.evaluate("""async ([x,y])=>{
                const s=HonroApp.scene;s.placeCamera(x,y,1.4);
                await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
                return [s.cx,s.cy,s.zoomLevel];
            }""",[x,y])
            p.screenshot(path=args.out/(name+'.jpg'),quality=90)
        (args.out/'cameras.json').write_text(json.dumps(cameras,indent=2)+'\n')
    # Terrain, moving water, figures and daylight are composited by the browser.
    # Capture the visible field for contrast; the transparent actor canvas alone omits the bank.
    metrics=p.evaluate('''async original=>{
      const path=s=>new URL('topview/'+s,document.baseURI);
      const {paintSprite,animals}=await import(path('src/actors.mjs'));
      const {actorBody}=await import(path('src/body.mjs'));
      const fieldPalette=original?((id,image)=>image):(await import(path('src/palette.mjs'))).fieldPalette;
      const imgs=new Map(),assets=['seolo-states','woodcutter',...animals.map(id=>'turns-'+id)];
      for(const id of assets){const im=new Image();im.src=path('assets/actors/'+id+'.webp');await im.decode();imgs.set(id,fieldPalette(id,im));}
      const s=HonroApp.scene,e=HonroApp.engine,cast={},bounds={};
      const types=['seolo','woodcutter',...animals];
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      for(const kind of types){
        const sample={id:kind==='woodcutter'?'npc-woodcutter':'sample',side:kind==='seolo'?0:1,honroType:kind};
        bounds[kind]=[];
        for(let row=0;row<8;row++){
          ctx.clearRect(0,0,160,160);paintSprite(ctx,imgs,kind,'idle',row,0,80,100,actorBody(sample).size,0);
          const data=ctx.getImageData(0,0,160,160).data;let x0=160,x1=-1,y0=160,y1=-1;
          for(let k=3;k<data.length;k+=4)if(data[k]>96){const x=(k>>2)%160,y=k>>2;
            x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,Math.floor(y/160));y1=Math.max(y1,Math.floor(y/160));}
          bounds[kind].push([x1-x0+1,y1-y0+1]);
        }
      }
      s.placeCamera(s.cx,s.cy,1.4);
      const {sceneryParts,drawScenery}=await import(path('src/canopy.mjs'));
      const map=await (await fetch(path('data/yeonmok.json'))).json();
      const hero=e.active,foot=HonroTopview.projection.forward(hero.x,hero.y-hero.h/2),near=[];
      for(const o of map.objects.filter(o=>o.asset.startsWith('pine'))){
        const at={x:o.x*map.tileWidth,y:o.y*map.tileHeight};
        if(Math.abs(at.x-foot.x)>o.width*.65||at.y<foot.y-o.height||at.y>foot.y+o.height)continue;
        for(const ext of ['','-base','-crown']){const key=o.asset+ext;if(imgs.has(key))continue;
          const im=new Image();im.src=path('assets/props/'+key+'.png');await im.decode();imgs.set(key,im);}
        near.push(...sceneryParts(o,at,imgs).filter(part=>part.depth>foot.y));
      }
      const ink=s.actorArt.frame(hero,false,true,0).art;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,160,160);ctx.drawImage(ink,0,0,160,160);
      const body=ctx.getImageData(0,0,160,160).data;ctx.clearRect(0,0,160,160);
      ctx.setTransform(1.6,0,0,1.6,80-foot.x*1.6,88*1.6-foot.y*1.6);
      for(const part of near)drawScenery(ctx,part,0);
      const occluders=ctx.getImageData(0,0,160,160).data;let covered=0,total=0;
      for(let i=3;i<body.length;i+=4)if(body[i]>=96){total++;if(occluders[i]>=96)covered++;}
      const next=()=>new Promise(requestAnimationFrame),rect=s.canvas.getBoundingClientRect(),dpr=s.canvas.width/rect.width;
      window.contrastSample=async id=>{
        const u=e.unit(id),foot={x:u.x,y:u.y-u.h*.5};s.centerAt(foot.x,foot.y);await next();await next();
        const at=s.screenPoint(foot.x,foot.y),z=s.zoomLevel,im=s.actorArt.frame(u,false,u===e.active,0).art;
        const left=Math.max(0,Math.floor(at.x-55*z)),top=Math.max(0,Math.floor(at.y-90*z));
        const width=Math.min(Math.ceil(at.x+55*z),rect.width)-left,height=Math.min(Math.ceil(at.y+15*z),rect.height)-top;
        ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,160,160);ctx.drawImage(im,0,0,160,160);
        const mask=ctx.getImageData(0,0,160,160);
        const alpha=(x,y)=>x<0||y<0||x>=160||y>=160?0:mask.data[(y*160+x)*4+3];
        const point=(x,y)=>[Math.round((at.x-left+(x/1.6-50)*z)*dpr),Math.round((at.y-top+(y/1.6-88)*z)*dpr)];
        const pairs=[];
        for(let y=3;y<157;y+=2)for(let x=3;x<157;x+=2){
          if(alpha(x,y)<180)continue;
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            if(alpha(x+dx*2,y+dy*2)<=64&&alpha(x+dx*5,y+dy*5)<35&&alpha(x-dx*2,y-dy*2)>185)
              pairs.push([point(x-dx*2,y-dy*2),point(x+dx*5,y+dy*5)]);
          }
        }
        return {rect:{x:left+rect.x,y:top+rect.y,width,height},pairs};
      };
      for(const u of e.b.units){const k=actorBody(u).kind;if(!u.dead&&!cast[k])cast[k]={id:u.id};}
      return {zoom:s.zoomLevel,startingPines:{covered,total},atlasBounds:bounds,firstEncounter:cast};
    }''',args.original)
    for row in metrics['firstEncounter'].values():
        sample=p.evaluate('contrastSample',row['id'])
        shot=Image.open(io.BytesIO(p.screenshot(clip=sample['rect']))).convert('RGB')
        def light(point):
            return sum(c*k for c,k in zip(shot.getpixel(tuple(point)),(.2126,.7152,.0722)))
        differences=[abs(light(a)-light(b)) for a,b in sample['pairs']
                     if all(0<=x<shot.width and 0<=y<shot.height for x,y in (a,b))]
        row.update(n=len(differences),contrast=round(statistics.median(differences),1) if differences else None)
    (args.out/'art.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
    b.close()
