"""Export the canonical landmark alone, in transparent overlapping tiles, in the native scene."""
from pathlib import Path
from PIL import Image
import json,io,base64,math
from playwright.sync_api import sync_playwright
import argparse, mimetypes
from urllib.parse import unquote, urlsplit
cli=argparse.ArgumentParser(description=__doc__)
cli.add_argument('stages',nargs='+',type=int,choices=(40,44,45,46,48,49,50))
cli.add_argument('--chromium',default='/usr/bin/chromium')
args=cli.parse_args();ids=args.stages
root=Path(__file__).resolve().parents[2]
out=root/'shared/assets/terrain-zoom'
def serve(route):
 path=root/(unquote(urlsplit(route.request.url).path).removeprefix('/honro/') or 'index.html')
 if path.is_file():route.fulfill(path=str(path),content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream')
 else:route.fulfill(status=404,body='')
def enter(page,n):
 page.goto('https://sys8994.github.io/honro/',wait_until='domcontentloaded')
 page.wait_for_function("window.HonroApp && !document.querySelector('[data-startup-title]')")
 page.evaluate("""async n=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(n);
 a.stopBattle();a.close();const p=HonroProfileStore.fresh();for(let k=1;k<n;k++)p.cleared[k]={visits:1,rounds:12};
 a.profile=a.normalProfile=p;a.launch(n);}""",n)
 page.wait_for_function("n=>HonroApp.engine?.b?.honroStage===n&&HonroApp.scene?.canvas?.isConnected",arg=n)
 return page.evaluate("""()=>{const a=HonroApp;a.frame=()=>{};a.scene.battle=a.engine.b;a.scene._terrainZoom=null;
 return {revision:a.engine.b.honroCampaignMapRevision};}""")
with sync_playwright() as pw:
 br=pw.chromium.launch(executable_path=args.chromium,args=['--no-sandbox','--disable-dev-shm-usage'])
 for n in ids:
  c=br.new_context(viewport={'width':1280,'height':720});c.route('**/*',serve);p=c.new_page();m=enter(p,n)
  lst=p.evaluate('''()=>{const s=HonroApp.scene,b=s.battle;return HonroTerrainDomain.materialLandmarks(b).map(l=>({id:l.id,asset:l.asset.id,x:l.x,y:l.y,scale:l.scale??1,rotation:l.rotation??0,rect:s._landmarkPaintBounds(l),style:HonroVisualStyle.key()}))}''')
  rows=[]
  for l in lst:
   if 41<=n<=50 and l['id']!='a5-near':continue
   if n==40 and l['id'] not in ['approved40-coastal-foundation','approved40-body','approved40-terrain-left-join','approved40-terrain-right-join','act4-sideview:40:front']:continue
   d=l.pop('rect');lft,top=math.floor(d['left'])-8,math.floor(d['top'])-8
   W,H=math.ceil(d['right']-lft)+8,math.ceil(d['bottom']-top)+8
   rs=min(.24,3400/max(W,H),math.sqrt(4700000/(W*H)));iw,ih=math.ceil(W*rs),math.ceil(H*rs);pic=Image.new('RGBA',(iw,ih))
   for yy in range(0,ih,768):
    for xx in range(0,iw,768):
     ww=min(768,iw-xx);hh=min(768,ih-yy)
     raw=p.evaluate('''([id,rs,x,y,w,h,l,t])=>{const s=HonroApp.scene,b=s.battle,lm=HonroTerrainDomain.materialLandmarks(b).find(i=>i.id===id),cv=document.createElement('canvas');cv.width=w+4;cv.height=h+4;const cc=cv.getContext('2d');cc.setTransform(rs,0,0,rs,2-x-l*rs,2-y-t*rs);s._staticCacheBuild=true;try{s.landmark(cc,lm);return cv.toDataURL('image/png').split(',')[1];}finally{s._staticCacheBuild=false;cv.width=1;cv.height=1;}}''',[l['id'],rs,xx,yy,ww,hh,lft,top]);im=Image.open(io.BytesIO(base64.b64decode(raw))).convert('RGBA');pic.paste(im.crop((2,2,ww+2,hh+2)),(xx,yy))
   box=pic.getchannel('A').getbbox()
   if not box:continue
   box=(max(0,box[0]-2),max(0,box[1]-2),min(iw,box[2]+2),min(ih,box[3]+2));pic=pic.crop(box)
   file=f'{n}-{l["id"]}'.replace(':','-')+'.webp';pic.save(out/file,'WEBP',quality=83,method=5,alpha_quality=100)
   rows.append(dict(**l,left=round(lft+box[0]/rs,4),top=round(top+box[1]/rs,4),width=round(pic.width/rs,4),height=round(pic.height/rs,4),revision=m['revision'],file=file))
  (out/f'{n}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=1)+'\n')
  print(n,len(rows),sum((out/r['file']).stat().st_size for r in rows),flush=True);c.close()
 br.close()
