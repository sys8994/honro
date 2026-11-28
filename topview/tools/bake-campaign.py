"""Bake visible terrain tiles directly in Chromium with the production texture and prop pipeline."""
import argparse,base64,io,json,threading
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from PIL import Image,ImageEnhance
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];TV=ROOT/'topview'
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
parser=argparse.ArgumentParser();parser.add_argument('chapters',nargs='*',type=int,default=list(range(2,11)));args=parser.parse_args()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT));threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for chapter in args.chapters:
        key=f'act1-{chapter:02}';out=TV/'assets/terrain'/key;out.mkdir(exist_ok=True);m=json.loads((TV/f'data/{key}.json').read_text());w,h=m['width']*m['tileWidth'],m['height']*m['tileHeight'];d=1.5;tile=512
        page=browser.new_page();page.goto(f'http://127.0.0.1:{server.server_port}/topview/data/')
        page.evaluate("""async ([key,d])=>{
          const root=new URL('../',location.href),mod=name=>import(new URL('src/'+name,root));
          async function bitmap(file){const im=new Image();im.src=new URL(file,root);await im.decode();return im;}
          const source=await bitmap('assets/source/isometric-pass-surfaces.png'),pics=new Map();
          for(const [id,x,y] of [['grass',0,0],['path',1,0],['gravel',1,1]]){
            const c=document.createElement('canvas');c.width=source.width/2-10;c.height=source.height/2-10;
            c.getContext('2d').drawImage(source,x*source.width/2+5,y*source.height/2+5,c.width,c.height,0,0,c.width,c.height);pics.set(id,c);
          }
          for(const id of ['dirt','rock'])pics.set(id,await bitmap('assets/terrain/'+id+'_texture.png'));
          const m=await (await fetch(new URL('data/'+key+'.json',root))).json();
          await Promise.all([...new Set(m.objects.map(o=>o.asset))].map(async id=>pics.set(id,await bitmap('assets/props/'+id+'.png'))));
          const {buildGround,bakePropShadows}=await mod('ground.mjs'),{paintRelief}=await mod('relief.mjs'),{groundProjection}=await mod('space.mjs');
          const ground=buildGround(m,k=>pics.get(k),d);paintRelief(ground,m,pics,d);
          bakePropShadows(ground,m.objects.map(o=>({...o,x:o.x*m.cell,y:o.y*m.cell})),pics,groundProjection(m.cell,m.tileWidth,m.tileHeight),d);
          window.baked=ground;
        }""",[key,d])
        def output(file,x,y,width,height,pw,ph,q):
            img=page.evaluate("""([x,y,w,h,pw,ph,q])=>{const c=document.createElement('canvas');c.width=pw;c.height=ph;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(baked,x,y,w,h,0,0,pw,ph);return c.toDataURL('image/webp',q).split(',')[1]}""",[x,y,width,height,pw,ph,q])
            file.write_bytes(base64.b64decode(img))
        output(out/'preview.webp',0,0,w*d,h*d,w//3,h//3,.83)
        for y in range(0,h,tile):
            for x in range(0,w,tile):
                W,H=round(min(tile,w-x)*d),round(min(tile,h-y)*d);output(out/f'bank-{x//tile}-{y//tile}.webp',x*d,y*d,W,H,W,H,.86)
        (out/'field.json').write_text(json.dumps(dict(revision=m['meta']['revision'],width=w,height=h,density=d,tile=tile,baseSaturation=.88,folder=key))+'\n')
        page.close();print(key,'baked',flush=True)
    browser.close()
server.shutdown()
