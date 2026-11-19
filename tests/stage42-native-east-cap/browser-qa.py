"""Actual native end-cap pointer, drag, draft reopen and stock render parity."""
import base64,hashlib,io,json,math,os,sys,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
D=Path(__file__).parent
assert os.environ['HONRO_EAST_CAP_QA']=='1'
views=json.loads((D/'pinned-views.json').read_text())
plan=json.loads((D/'technical-fixture.json').read_text())
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
S=3.2146389713155292
r={'pass':False,'page_errors':[],'engine':'unmodified stock HonroScene and vector painter, read-only per-route call count'}
def checkpoint(step):
 r['step']=step
 (out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
def read(page):
 return page.evaluate("""async()=>{
  const p=HonroWorkshopAPI.getProject(),a=p.library.find(x=>x.id==='act5:near:42'),e=a.edgeWall,cap=e.params.authoredEastCapV1??null;
  const sha=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const full=sha(p),old=sha([cap?e.vector.root.children[1]:e.vector.root,e.vector.clips['native-source-alpha']]),clip=sha(e.vector.clips);
  delete a.edgeWall;
  return {full:await full,protected:await sha(p),old:await old,clip:await clip,cap};
 }""")
def source(browser, author=False):
 page=browser.new_context(viewport={'width':1920 if author else 1440,'height':1080 if author else 900},device_scale_factor=1).new_page()
 page.on('pageerror',lambda e:r['page_errors'].append(str(e)))
 page.goto('http://127.0.0.1:8870/HONRO_WORKSHOP.html',wait_until='domcontentloaded')
 page.wait_for_function("window.HonroWorkshopAPI?.getEditorState() && document.querySelector('#qaEastCapHost')",timeout=90000)
 page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
 return page
def click_button(page,name):page.get_by_role('button',name=name,exact=True).click()
def layout(page,points):
 q=page.evaluate("""pts=>{
  const a=HonroWorkshopAPI,c=document.querySelector('#stageCanvas'),b=c.getBoundingClientRect();
  for(const v of [{x:7380,y:2400,zoom:1.6},{x:7470,y:2450,zoom:1.25},{x:7410,y:2440,zoom:.95},{x:7390,y:2430,zoom:.85},{x:7390,y:2430,zoom:.64}]){
   a.setCamera(v);const q=a.getEditorState().stageView;
   const layout=pts.map(([x,y])=>({x:b.width/2+(3.2146389713155292*x-q.x)*q.zoom,y:b.height/2+(3.2146389713155292*y-q.y)*q.zoom}));
   if(layout.every(p=>p.x>=10&&p.x<=b.width-10&&p.y>=10&&p.y<=b.height-10&&document.elementFromPoint(b.left+p.x,b.top+p.y)===c))return {layout,left:b.left,top:b.top,view:q};
  }throw Error('Authoring rail clipped or obscured');
 }""",points)
 return q
def click_points(page,pts):
 for pos in layout(page,pts)['layout']:page.locator('#stageCanvas').click(position=pos)
def capture(page,state,tag):
 # Stock audit 44441937287: identical group order, four-shot Scene boundaries,
 # requested values/clamps and history. Only return/upload the two target shots.
 itinerary=(
  ('minimum-overview',[(3250,1430.5)],.16),
  ('landscape-pan',[(x,1850) for x in [-1000,-400,150,850,1550,2250,2950,3650,4350,5050,5750,6350,6950,7600]],.5),
  ('vertical-pan',[(3250,y) for y in [-1000,0,500,1000,1500,2000,2500,3000,3500,4400]],.35),
  ('corners',[(x,y) for y in (1050,3125) for x in (-550,7050)],.30))
 pins={v['label']:v for v in views}
 frames={};invariants=None
 for band,xy,z in itinerary:
  for start in range(0,len(xy),4):
   group=[{'label':f'{band}-{j:02d}','x':x,'y':y,'zoom':z} for j,(x,y) in enumerate(xy[start:start+4],start)]
   x=page.evaluate((D/'scene-proof.js').read_text(),{'views':group,'targets':[v for v in views if v['label'] in [q['label'] for q in group]],'expected':state['full'],'seed':3910})
   raw=x.pop('results')
   if invariants is None:invariants=x
   else:assert x==invariants,('candidate camera group changed fixed simulation data',band,start)
   for shot in raw:
    img=base64.b64decode(shot.pop('png').split(',',1)[1],validate=True)
    oldmask=base64.b64decode(shot.pop('oldBodyMask').split(',',1)[1],validate=True)
    (out/f"{tag}-{shot['label']}.png").write_bytes(img)
    observed=hashlib.sha256(img).hexdigest()
    r.setdefault('observed_png_sha256',{}).setdefault(tag,{})[shot['label']]=observed
    checkpoint(tag+'-'+shot['label']+'-captured')
    if tag=='baseline':
     assert observed==pins[shot['label']]['png_sha256'],('Original audited frame drift',shot['label'],observed)
    frames[shot['label']]=(Image.open(io.BytesIO(img)).convert('RGBA'),Image.open(io.BytesIO(oldmask)).convert('RGBA'),shot)
 assert set(frames)==set(pins)
 r[tag]={**invariants,'views':[f[-1] for f in frames.values()]};checkpoint(tag+'-rendered')
 return invariants,frames
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ['HONRO_CHROME'])
 page=fresh=base=None
 try:
  base=source(b);original=read(base)
  assert original['full']=='135e9a633d311d3b8b03ab2c676a7e94a46601629e0a91d7835988ed96438ddf'
  old_evidence,olds=capture(base,original,'baseline')
  base.context.close()
  page=source(b,author=True);assert read(page)==original
  click_button(page,'동쪽 끝마감 도구')
  rim=plan['rim'][:-2]
  click_points(page,rim[:-1]);click_button(page,'외곽 끝점');click_points(page,[rim[-1]])
  for chain in (plan['transition'],plan['shadowBreak']):
   click_points(page,chain[:-1]);click_button(page,'절리 끝점');click_points(page,[chain[-1]])
  assert page.locator('html').get_attribute('data-qa-east-mode')=='edit'
  page.screenshot(path=str(out/'01-native-outline-clicked.png'))
  pre=page.evaluate("HonroEastCapQA.state")
  assert [len(pre['outline']),len(pre['seams'])]==[len(rim),2]
  origin=pre['outline'][10]['at'];dest=[origin[0]+.8,origin[1]]
  details=layout(page,[origin,dest])
  p,q=details['layout']
  mouse=page.mouse
  mouse.move(details['left']+p['x'],details['top']+p['y']);mouse.down()
  mouse.move(details['left']+q['x'],details['top']+q['y'],steps=7);mouse.up()
  post=page.evaluate("HonroEastCapQA.state")
  assert len(post['outline'])==len(pre['outline']) and post['seams']==pre['seams']
  assert post['outline'][10]['at'][0]>origin[0]+.1 and post['outline'][10]['id']==pre['outline'][10]['id']
  assert all(p==q for i,(p,q) in enumerate(zip(pre['outline'],post['outline'])) if i!=10)
  r['drag']={'before':origin,'after':post['outline'][10]['at']}
  page.screenshot(path=str(out/'02-native-vertex-dragged.png'))
  click_button(page,'끝마감 미리보기');assert read(page)==original
  page.screenshot(path=str(out/'03-native-preview.png'))
  click_button(page,'끝마감 저장');r['save_toast']=page.locator('#toast').text_content()
  edited=read(page);assert edited['cap']['design']==post
  assert all(edited[k]==original[k] for k in ('old','clip','protected'))
  with page.expect_download(timeout=30000) as a:click_button(page,'끝마감 내보내기')
  with tempfile.TemporaryDirectory() as t:
   draft=Path(t)/'temporary-east-cap.json';a.value.save_as(draft)
   r['draft_bytes']=draft.stat().st_size;assert 0<r['draft_bytes']<=4096
   fresh=source(b);assert read(fresh)==original
   with fresh.expect_file_chooser() as picker:click_button(fresh,'끝마감 초안 열기')
   picker.value.set_files(str(draft))
   fresh.wait_for_function("['opened','error'].includes(document.documentElement.dataset.qaEastImport)",timeout=45000)
   r['fresh_import_error']=fresh.locator('html').get_attribute('data-qa-east-error')
   r['fresh_toast']=fresh.locator('#toast').text_content()
   assert fresh.locator('html').get_attribute('data-qa-east-import')=='opened',r['fresh_import_error']
   assert read(fresh)==edited
   checkpoint('fresh-draft-exact')
   fresh.screenshot(path=str(out/'04-native-reopened.png'))
   new_evidence,news=capture(fresh,edited,'candidate')
  assert all(old_evidence[k]==new_evidence[k] for k in ('physics','units'))
  r['scope']={}
  for name,(base,owner_alpha,meta) in olds.items():
   cand,_,result=news[name]
   assert meta['actual']==result['actual']
   assert meta['cached_group_draws']>0 and result['cached_group_draws']>0
   assert (meta['counts']['cached']>0 or meta['cache_hit_delta']>0) and (result['counts']['cached']>0 or result['cache_hit_delta']>0)
   if name=='corners-03':assert meta['counts']['exterior']>0 and result['counts']['exterior']>0
   x,y,z=meta['actual'];xmin=(2298.5*S-x)*z+640-3;xmax=(2324.2701*S-x)*z+640+3;ymin=(685*S-y)*z+400-3;ymax=(825*S-y)*z+400+3
   mm=Image.new('1',(1280,800))
   contour=[((v['at'][0]*S-x)*z+640,(v['at'][1]*S-y)*z+400) for v in post['outline']]
   pen=ImageDraw.Draw(mm);pen.polygon(contour,fill=1);pen.line(contour+[contour[0]],fill=1,width=7,joint='curve')
   changed=outside=opaques=0
   for idx,(p,q,k,m) in enumerate(zip(base.getdata(),cand.getdata(),owner_alpha.getdata(),mm.getdata())):
    if p==q:continue
    changed+=1
    xx=idx%1280;yy=idx//1280
    if not m or not (xmin<=xx<=xmax and ymin<=yy<=ymax):outside+=1
    if k[3]==255:opaques+=1
   r['scope'][name]={'changed':changed,'outside':outside,'old_opaque':opaques,'same_camera':True,'cache_mode':result['counts'],'clip_band_output_pixels':3}
   checkpoint('scene-pixel-gate-'+name)
   assert changed>0 and outside==0 and opaques==0,r['scope'][name]
  assert not r['page_errors']
  r['pass']=True;r['art_approval']=False;checkpoint('mechanics-passed')
 except Exception as e:
  r['error']=str(e);checkpoint('failed')
  failure=fresh or page or base
  if failure and not failure.is_closed():failure.screenshot(path=str(out/'failure-workshop.png'))
  raise
 finally:b.close()
