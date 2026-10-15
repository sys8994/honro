"""Three artwork revisions through the same current Scene; never approves art."""
import base64, hashlib, io, json, subprocess
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/animal-preview';OUT.mkdir(parents=True,exist_ok=True)
current=(ROOT/'shared/assets/monsters/monsters.runtime.js').read_text().strip()
html=(ROOT/'tools/character-catalog.html').read_text();assert current in html
for label,sha in [('original','3899a2f'),('rejected','6a8638c')]:
    old=subprocess.check_output(['git','show',sha+':shared/assets/monsters/monsters.runtime.js'],cwd=ROOT,text=True).strip()
    (OUT/(label+'.html')).write_text(html.replace(current,old))
(OUT/'candidate.html').write_text(html)
DRAW='''([id,pixels,motion,phase,facing])=>{const row=HONRO_CATALOG.rows.find(r=>r.id===id),c=document.createElement('canvas');c.width=360;c.height=300;HonroCatalogRenderer.draw(c,row,{pixels,motion,phase,facing,x:180,y:260});return c.toDataURL()}'''
def draw(p,id,size,motion='idle',phase=.2,face=1):
    url=p.evaluate(DRAW,[id,size,motion,phase,face]);return Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGBA')
def digest(im):return hashlib.sha256(im.tobytes()).hexdigest()
result={'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'referencePixels':'BLOCKED: Library supported materialize download failed','checks':[],'errors':[],'samples':[]}
def check(name,value):
    result['checks'].append({'name':name,'passed':bool(value)});print('PASS' if value else 'FAIL',name,flush=True)
base=story_base_url()
with sync_playwright() as p:
    browser=launch(p);pages=[]
    for name in ['original','rejected','candidate']:
        page=browser.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto(base+'/_local/reports/animal-preview/'+name+'.html');page.wait_for_function('window.HonroCatalogRenderer');pages.append(page)
    for id in ['hound','boar','legacy_hound','legacy_boar']:
        sheet=Image.new('RGB',(1080,1010),'#111b1c');d=ImageDraw.Draw(sheet)
        d.text((18,10),id+' | Same current Scene, background, pose and size. Artwork only.',fill='#e9dfc7')
        for col,name in enumerate(['3899a2f ORIGINAL','6a8638c REJECTED','ANATOMY CANDIDATE']):d.text((col*360+18,36),name,fill='#e9dfc7')
        for row,size in enumerate([180,90,35]):
            for col,page in enumerate(pages):
                im=draw(page,id,size);sheet.paste(im,(col*360,60+row*310),im);d.text((col*360+18,65+row*310),str(size)+'px',fill='#b7ad96')
                result['samples'].append({'id':id,'size':size,'revision':col,'sha256':digest(im)})
        sheet.save(OUT/(id+'-comparison.png'))
        motion_sheet=Image.new('RGB',(1800,1260),'#111b1c');d=ImageDraw.Draw(motion_sheet)
        for row,(face,phase) in enumerate([(1,.15),(1,.65),(-1,.15),(-1,.65)]):
            for col,motion in enumerate(['idle','move','attack','hit','jump_fall']):
                im=draw(pages[2],id,180,motion,phase,face);box=im.getbbox();check(f'{id}/{motion}/{phase}/{face} bounded',box and box[0]>0 and box[1]>0 and box[2]<360 and box[3]<300)
                motion_sheet.paste(im,(col*360,row*315),im);d.text((col*360+10,row*315+292),f'{motion} face {face} phase {phase}',fill='#e9dfc7')
        motion_sheet.save(OUT/(id+'-motions.png'))
    for hero in pages[2].evaluate('HONRO_CATALOG.rows.filter(r=>r.excluded).map(r=>r.id)'):
        check('unchanged hero '+hero,all(digest(draw(pages[1],hero,180,m,.65))==digest(draw(pages[2],hero,180,m,.65)) for m in ['idle','move','attack','hit','jump_fall']))
    for id in ['hound','boar']:
        check(id+' legacy same asset',pages[2].evaluate("id=>{const r=HONRO_CATALOG.rows.find(r=>r.id==='legacy_'+id);return HonroLegacyVisual.kind(r.unit)===id}",id))
    for host in ['HONRO','HONRO_WORKSHOP']:
        page=browser.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto(base+'/'+host+'.html');page.wait_for_function('window.HonroScene && window.HonroMonsterVisual');check(host+' candidate assets',page.evaluate('JSON.stringify(HonroMonsterVisual.assets.hound)')==pages[2].evaluate('JSON.stringify(HonroMonsterVisual.assets.hound)'));page.close()
    check('no browser errors',not result['errors']);browser.close()
(OUT/'results.json').write_text(json.dumps(result,indent=2)+'\n')
assert all(c['passed'] for c in result['checks'])
