"""Explicit 35-row visual revision, with untouched cast checked at pixel level."""
import io,base64,json,hashlib,subprocess
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/graphics-revision';OUT.mkdir(parents=True,exist_ok=True)
changed='hound boar bat legacy_hound legacy_boar legacy_bat ghost legacy_ghost shade legacy_shade warden legacy_warden summon_warden lantern legacy_lantern summon_charger summon_eater resonance echo bellCluster keeper legacy_knight legacy_occultist human possessedGuard possessedArcher gateMaster archerMaster archiveFiend kilnFiend summon_stalker summon_echo legacy_summon bier_boss minecart'.split()
# Boar was approved and intentionally stays pixel-identical to the first candidate.
preserved='legacy_mourner legacy_stag legacy_crow legacy_archer legacy_mage picks waterwheel stoneLantern hoist target_bier-knot target_upper-chain'.split()
DRAW='''([id,pixels,motion,phase,facing])=>{const c=document.createElement('canvas');c.width=360;c.height=340;HonroCatalogRenderer.draw(c,HONRO_CATALOG.rows.find(r=>r.id===id),{pixels,motion,phase,facing,x:180,y:300});return c.toDataURL()}'''
def pic(p,id,px=180,m='idle',ph=.2,f=1):return Image.open(io.BytesIO(base64.b64decode(p.evaluate(DRAW,[id,px,m,ph,f]).split(',')[1]))).convert('RGBA')
def h(im):return hashlib.sha256(im.tobytes()).hexdigest()
r={'checks':[],'errors':[],'rows':[],'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'approval':'implementation pixel review; not a claim of historical reference download success'}
def check(n,v):r['checks'].append({'name':n,'passed':bool(v)});print('PASS' if v else 'FAIL',n,flush=True)
with sync_playwright() as p:
 b=launch(p);pages=[];base=story_base_url()
 for url in ['_local/reports/graphics-revision/before.html','tools/character-catalog.html']:
  page=b.new_page();page.on('pageerror',lambda e:r['errors'].append(str(e)));page.goto(base+'/'+url);page.wait_for_function('window.HonroCatalogRenderer');pages.append(page)
 check('same catalog unit/context identities',pages[0].evaluate('JSON.stringify(HONRO_CATALOG.rows.map(r=>[r.id,r.unit,r.context]))')==pages[1].evaluate('JSON.stringify(HONRO_CATALOG.rows.map(r=>[r.id,r.unit,r.context]))'))
 atlas=Image.new('RGB',(1800,2380),'#111b1c');ad=ImageDraw.Draw(atlas)
 for i,id in enumerate(changed):
  sheet=Image.new('RGB',(720,1080),'#111b1c');d=ImageDraw.Draw(sheet)
  for j,px in enumerate([180,90,35]):
   for col,page in enumerate(pages):
    im=pic(page,id,px);sheet.paste(im,(col*360,40+j*345),im);d.text((col*360+10,10+j*345),f'{id} {px}px '+('BEFORE' if col==0 else 'AFTER'),fill='white')
  sheet.save(OUT/(id+'-comparison.png'))
  im=pic(pages[1],id);atlas.paste(im,(i%5*360,i//5*340),im);ad.text((i%5*360+10,i//5*340+8),id,fill='white')
  different=h(im)!=h(pic(pages[0],id));check(id+' correct change boundary',different if id not in ['boar','legacy_boar'] else not different)
  motion=Image.new('RGB',(1800,1360),'#111b1c');md=ImageDraw.Draw(motion);bounded=True
  for row,(face,ph) in enumerate([(1,.15),(1,.65),(-1,.15),(-1,.65)]):
   for col,m in enumerate(['idle','move','attack','hit','jump_fall']):
    im=pic(pages[1],id,180,m,ph,face);box=im.getbbox();bounded&=bool(box and box[0]>0 and box[1]>0 and box[2]<360 and box[3]<340);motion.paste(im,(col*360,row*340),im);md.text((col*360+8,row*340+8),f'{m} {ph} facing {face}',fill='white')
  check(id+' motion bounds',bounded);motion.save(OUT/(id+'-motions.png'));r['rows'].append({'id':id,'changed':different})
 atlas.save(OUT/'after-atlas.png')
 heroes=pages[1].evaluate('HONRO_CATALOG.rows.filter(r=>r.excluded).map(r=>r.id)')
 for id in preserved+heroes:
  check(id+' unchanged pixels in five motions',all(h(pic(pages[0],id,180,m,.65))==h(pic(pages[1],id,180,m,.65)) for m in ['idle','move','attack','hit','jump_fall']))
 check('no browser exceptions',not r['errors']);b.close()
(OUT/'results.json').write_text(json.dumps(r,indent=2)+'\n');assert all(c['passed'] for c in r['checks'])
