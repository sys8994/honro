"""Static SVG source/trace and optimization evidence; actual frames use qa.py."""
from pathlib import Path
import sys,json,base64,copy
from lxml import etree as E
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'_local/reports/act4-sideview-p1-20261116';OUT=BASE/'vector-proof';OUT.mkdir(exist_ok=True)
sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
def combined(color,alpha):
 tree=E.parse(str(color));root=tree.getroot();ns='http://www.w3.org/2000/svg'
 children=list(root)
 for child in children:root.remove(child)
 defs=E.SubElement(root,'{'+ns+'}defs');clip=E.SubElement(defs,'{'+ns+'}clipPath',id='proof-alpha',clipPathUnits='userSpaceOnUse')
 for child in E.parse(str(alpha)).getroot():clip.append(copy.deepcopy(child))
 group=E.SubElement(root,'{'+ns+'}g',{'clip-path':'url(#proof-alpha)'})
 for child in children:group.append(child)
 return E.tostring(root).decode()
results=[]
with serve_game() as url,sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context();page=ctx.new_page();page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroVectorArt')
 for n,role in [(33,'front-extended'),(40,'front')]:
  td=BASE/f'trace{n}-{role}';reg=BASE/f'registered{n}-v2'
  for label,color,alpha in [('trace',td/'color-raw.svg',td/'alpha-raw.svg'),('before-opt',reg/'color-registered.svg',reg/'alpha-registered.svg'),('final',reg/'color-final.svg',reg/'alpha-registered.svg')]:
   svg=combined(color,alpha)
   for scale in ([1] if label=='trace' else [1,2]):
    png=page.evaluate("""async ({svg,scale})=>{const xml=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;xml.setAttribute('width',1536*scale);xml.setAttribute('height',1024*scale);const blob=new Blob([new XMLSerializer().serializeToString(xml)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),im=new Image();im.src=url;await im.decode();const c=document.createElement('canvas');c.width=1536*scale;c.height=1024*scale;c.getContext('2d').drawImage(im,0,0);URL.revokeObjectURL(url);return c.toDataURL().split(',')[1];}""",{'svg':svg,'scale':scale})
    (OUT/f'{n}-{label}-{scale}x.png').write_bytes(base64.b64decode(png))
  for scale in [1,2]:
   a=np.asarray(Image.open(OUT/f'{n}-before-opt-{scale}x.png').convert('RGBA')).astype(float)/255
   b=np.asarray(Image.open(OUT/f'{n}-final-{scale}x.png').convert('RGBA')).astype(float)/255
   mask=np.maximum(a[:,:,3],b[:,:,3])>0
   # Premultiplied colors avoid attributing hidden transparent RGB to the art.
   diff=np.abs(a[:,:,:3]*a[:,:,3:]-b[:,:,:3]*b[:,:,3:])
   results.append({'stage':n,'scale':scale,'renderer':'Chromium SVG / Canvas static asset comparison','paintedPixelCount':int(mask.sum()),'meanPaintedChannelError':float(diff[mask].mean()),'paintedFractionOver16of255':float((diff.max(2)[mask]>16/255).mean()),'scope':'registered raw vs optimized + bounded compact; same SVG rasterizer; production raw import unavailable over 60000-char guard; final game frames checked separately'})
  # Comparison is photographic evidence; do not resize or regenerate sources.
  font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',20)
  sheet=Image.new('RGB',(1536,1100),'#d9dee1');d=ImageDraw.Draw(sheet)
  files=[ROOT/f'shared/assets/environment/act4-sideview/source/stage{n}-{role}.png',OUT/f'{n}-trace-1x.png',OUT/f'{n}-before-opt-1x.png',OUT/f'{n}-final-1x.png']
  for i,(f,title) in enumerate(zip(files,['이미지 시안','실제 Inkscape raw','접촉선 등록 후 · 최적화 전','최적화 + 최종 직렬화'])):
   im=Image.open(f).convert('RGBA');im.thumbnail((768,512));x=(i%2)*768;y=(i//2)*550;d.text((x+12,y+8),title,fill='#172b35',font=font);sheet.paste(im,(x,y+36),im)
  sheet.save(OUT/f'{n}-source-trace.jpg',quality=94)
 ctx.close();browser.close()
(OUT/'results.json').write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results))
