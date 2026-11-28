"""Bake the dry receivers and two independently advected water surfaces from the editable field."""
import base64
import io
import json
import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
out = root / 'topview/assets/terrain/yeonmok'
out.mkdir(exist_ok=True)
density, tile = 2.5, 384
timeline=json.loads((root/'shared/data/timeline.json').read_text())
stage=timeline['stages']['1']
base_sat=next(k['sat'] for k in timeline['profiles'][stage['profile']]['keys'] if k['t']==stage['start'])
source = Image.open(root / 'topview/assets/source/isometric-pass-surfaces.png').convert('RGB')
w, h = source.size
water = source.crop((5, h // 2 + 5, w // 2 - 5, h - 5)).resize((256, 256), Image.Resampling.LANCZOS)
sample = np.asarray(water, dtype=float)
# A mirrored source with wraparound coordinates keeps both current layers seamless.
sample = np.concatenate((sample, sample[:, ::-1]), axis=1)
sample = np.concatenate((sample, sample[::-1]), axis=0)
y, x = np.mgrid[:512, :512]
a = x * (2 * np.pi / 512)
b = y * (2 * np.pi / 512)
u = np.mod((x + 14*np.sin(b+2*a) + 6*np.sin(3*b-a)).astype(int), 512)
v = np.mod((y + 16*np.sin(2*a+b) + 4*np.cos(3*a-b)).astype(int), 512)
tone = sample[v, u]
body=Image.fromarray(np.uint8(np.clip(tone * [.72,.86,.89] + [4,8,10], 0,255)))
ImageEnhance.Color(body).enhance(base_sat).save(out/'current.webp',quality=91)
# Broken, low specular crests move across the deeper, broader reflections.
depth=np.asarray(Image.fromarray(sample.astype('uint8')).convert('L').filter(ImageFilter.GaussianBlur(8)),dtype=float)
depth=(depth-depth.mean())/max(1,depth.std())
wave = np.cos(9*b + 2*a + 1.6*np.sin(4*a+2*b) + .7*np.sin(5*a-3*b) + .72*depth)
breaks = np.clip(.45 + .38*np.sin(3*a-b) + .25*np.cos(4*b+2*a),0,1)
crest = np.clip((wave-.70)/.30,0,1)**2 * breaks
trough = np.clip((-wave-.15)/.85,0,1)**2 * (.4+.6*breaks)
rgba = np.empty((512,512,4),np.uint8)
rgba[:,:,:3] = np.where((crest>trough*.32)[:,:,None], [157,184,169], [14,40,46])
rgba[:,:,3] = np.uint8(np.maximum(crest*.28,trough*.22)*255)
Image.fromarray(rgba).save(out/'ripples.webp',lossless=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1',0), partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    page = browser.new_page()
    page.goto(f'http://127.0.0.1:{server.server_port}/topview/assets/')
    png = page.evaluate("""async density=>{
      const root=new URL('/topview/',location.href),module=p=>import(new URL('src/'+p,root));
      const {buildGround,bakePropShadows}=await module('ground.mjs'),{groundProjection}=await module('space.mjs');
      const m=await (await fetch(new URL('data/yeonmok.json',root))).json(),assets=new Map();
      async function load(file){const im=new Image();im.src=new URL('assets/'+file,root);await im.decode();return im;}
      const source=await load('source/isometric-pass-surfaces.png');
      for(const [name,col,row] of [['grass',0,0],['path',1,0],['gravel',1,1]]){
        const c=document.createElement('canvas');c.width=Math.floor(source.width/2)-10;c.height=Math.floor(source.height/2)-10;
        c.getContext('2d').drawImage(source,Math.floor(col*source.width/2)+5,Math.floor(row*source.height/2)+5,c.width,c.height,0,0,c.width,c.height);assets.set(name,c);
      }
      for(const id of ['rock','dirt'])assets.set(id,await load('terrain/'+id+'_texture.png'));
      const ground=buildGround(m,id=>assets.get(id),density);
      for(const id of new Set(m.objects.map(o=>o.asset)))assets.set(id,await load('props/'+id+'.png'));
      const project=groundProjection(m.cell,m.tileWidth,m.tileHeight);
      bakePropShadows(ground,m.objects.map(o=>({...o,x:o.x*m.cell,y:o.y*m.cell})),assets,project,density);
      return ground.toDataURL('image/png').split(',')[1];
    }""",density)
    bitmap = ImageEnhance.Color(Image.open(io.BytesIO(base64.b64decode(png))).convert('RGBA')).enhance(base_sat)
    browser.close()
server.shutdown()
m=json.loads((root/'topview/data/yeonmok.json').read_text())
width,height=round(m['width']*m['tileWidth']),round(m['height']*m['tileHeight'])
bitmap.resize((width//2,height//2),Image.Resampling.LANCZOS).save(out/'preview.webp',quality=87)
for y0 in range(0,height,tile):
    for x0 in range(0,width,tile):
        bounds=tuple(round(v*density) for v in (x0,y0,min(x0+tile,width),min(y0+tile,height)))
        bitmap.crop(bounds).save(out/f'bank-{x0//tile}-{y0//tile}.webp',quality=92,method=5)
(out/'field.json').write_text(json.dumps(dict(revision=m['meta']['revision'],width=width,height=height,density=density,tile=tile,baseSaturation=base_sat))+'\n')
