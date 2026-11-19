"""Actual native end-cap pointer, drag, draft reopen and stock render parity."""
import base64,hashlib,io,json,math,os,sys,tempfile
from pathlib import Path
from PIL import Image,ImageDraw
from playwright.sync_api import sync_playwright
from driver_binding import build_driver
from pixel_gate import exact_stock,exact_protected
from split_gates import transparent_body,full_scene_exact,sha
from trace_binding import bind_route_trace,require_same_tile_route
D=Path(__file__).parent
DRIVER=bind_route_trace(build_driver())
CACHE_JS=(D/'cached_owner_driver.js').read_text()
SYNC_FLAGS=["--force-device-scale-factor=1","--force-color-profile=srgb"]
assert os.environ['HONRO_EAST_CAP_QA']=='1'
BODY_JS=(D/'body_driver.js').read_text()
OBSERVED_JS=(D/'observed_driver.js').read_text()
views=json.loads((D/'pinned-views.json').read_text())
plan=json.loads((D/'technical-fixture.json').read_text())
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
S=3.2146389713155292
r={'pass':False,'ui_pass':False,'determinism_pass':False,'candidate_render_pass':False,'art_approval':False,'page_errors':[],
   'engine':'stock archived diagnostic draw sequence; A/A raw RGBA hard gate in one fresh-loaded project context; no archived frame comparisons',
   'archive_provenance':{v['label']:v['png_sha256'] for v in views}}
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
 page=browser.new_context(viewport={'width':1920 if author else 1440,'height':1080 if author else 900},device_scale_factor=1,locale='en-US',timezone_id='UTC').new_page()
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
def capture(page,state,tag,kind,eligible=None):
 itinerary=(
  ('minimum-overview',[(3250,1430.5)],.16),
  ('landscape-pan',[(x,1850) for x in [-1000,-400,150,850,1550,2250,2950,3650,4350,5050,5750,6350,6950,7600]],.5),
  ('vertical-pan',[(3250,y) for y in [-1000,0,500,1000,1500,2000,2500,3000,3500,4400]],.35),
  ('corners',[(x,y) for y in (1050,3125) for x in (-550,7050)],.30))
 pins={v["label"]:v for v in views if eligible is None or v["label"] in eligible}
 frames={};invariants=None
 for band,xy,z in itinerary:
  for start in range(0,len(xy),4):
   group=[{'label':f'{band}-{j:02d}','x':x,'y':y,'zoom':z} for j,(x,y) in enumerate(xy[start:start+4],start)]
   x=page.evaluate(DRIVER,{'views':group,'w':1280,'h':800,'targets':list(pins),'expected':state['full'],'seed':3910,'kind':kind})
   actual=x.pop('frames')
   if invariants is None:invariants=x
   else:assert x==invariants,('camera group changed fixed simulation data',band,start)
   for shot in actual:
    img=base64.b64decode(shot.pop('png').split(',',1)[1],validate=True)
    (out/f"{tag}-{shot['label']}.png").write_bytes(img)
    decoded=Image.open(io.BytesIO(img)).convert('RGBA')
    assert shot['actual']==pins[shot['label']]['actual'] and shot['requested']==pins[shot['label']]['requested']
    shot['raw_rgba_sha256']=hashlib.sha256(decoded.tobytes()).hexdigest()
    frames[shot['label']]=(decoded,shot)
    r[tag]={**invariants,'views':[v[1] for v in frames.values()]}
    checkpoint(tag+'-'+shot['label']+'-captured')
 assert set(frames)==set(pins)
 return invariants,frames

# Generate the stock owner's opaque reference only AFTER all complete A/A/B
# captures. Do not inject new paint or mask draws into the archived itinerary.
def opaque(page,view):
 mask=page.evaluate("""({actual})=>{
  const p=window.__eastStockBeforeOpen,s=p.stages.find(s=>s.id==='stage-42'),a=p.library.find(a=>a.id==='act5:near:42'),place=s.elements.find(e=>e.assetId===a.id);
  const [x,y,z]=actual,cv=document.createElement('canvas');cv.width=1280;cv.height=800;
  const ctx=cv.getContext('2d');ctx.setTransform(z,0,0,z,640-x*z,400-y*z);
  HonroVectorArt.draw(HonroVisualStyle.context(ctx,'L1'),a.edgeWall,{x:place.x,y:place.y,scale:place.scale});
  return cv.toDataURL();
 }""",view)
 return Image.open(io.BytesIO(base64.b64decode(mask.split(',',1)[1],validate=True))).convert('RGBA').getchannel('A').tobytes()

def common_meta(a,b):
 # Cache hit counts are diagnostics, not deterministic invariants. Requested
 # position, final camera, raster LOD, far-ready, domain are strict.
 for k in ('requested','actual','actualLOD','terrainBounds','size','worldViewport','pinnedFar'):
  assert a.get(k)==b.get(k),('fixed camera/LOD/terrain drift',k,a.get(k),b.get(k))
 assert a['pinnedFar'] and a['actualLOD'] is not None
 assert a['groupCache']>0 and b['groupCache']>0
 if a['label']=='corners-03':assert a['routes']['exterior']>0 and b['routes']['exterior']>0

def approved_area(meta,outline):
 x,y,z=meta['actual'];xmin=(2298.5*S-x)*z+640-3;xmax=(2324.2701*S-x)*z+640+3;ymin=(685*S-y)*z+400-3;ymax=(825*S-y)*z+400+3
 mm=Image.new('1',(1280,800))
 contour=[((v['at'][0]*S-x)*z+640,(v['at'][1]*S-y)*z+400) for v in outline]
 pen=ImageDraw.Draw(mm);pen.polygon(contour,fill=1);pen.line(contour+[contour[0]],fill=1,width=7,joint='curve')
 return bytes(bool(v) and xmin<=i%1280<=xmax and ymin<=i//1280<=ymax for i,v in enumerate(mm.getdata()))

def native_body(page,meta,kind,label):
 png=base64.b64decode(page.evaluate(BODY_JS,{'actual':meta['actual'],'kind':kind}).split(',',1)[1],validate=True)
 (out/f'corner-body-{label}.png').write_bytes(png)
 return Image.open(io.BytesIO(png)).convert('RGBA')

def cached_native_body(page,meta,state,kind,name):
 routes=page.evaluate(CACHE_JS,{'actual':meta['actual'],'w':1280,'h':800,'kind':kind,'expected':state['full']})
 require_same_tile_route(meta['tileRoute'],routes)
 raw=base64.b64decode(routes.pop('png').split(',',1)[1],validate=True)
 im=Image.open(io.BytesIO(raw)).convert('RGBA')
 assert len(set(im.getchannel('A').getdata()))>2,'Unexpected opaque/empty binary retained owner shadow'
 (out/f'landscape-body-tile-{name}.png').write_bytes(raw)
 return im,routes

with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ['HONRO_CHROME'],args=SYNC_FLAGS)
 try:
  cdp=b.new_browser_cdp_session()
  flags=cdp.send('Browser.getBrowserCommandLine').get('arguments',[])
  r['chrome']={'version':cdp.send('Browser.getVersion'),'explicit_qa_flags':SYNC_FLAGS,
               'observed_flags':[f for f in flags if f in SYNC_FLAGS or f in ('--disable-gpu','--headless','--headless=new','--disable-lcd-text','--disable-background-timer-throttling')],
               'effective_gpu_status':cdp.send('SystemInfo.getInfo').get('gpu',{}).get('featureStatus',{}),
               'virtual_time':False,'approved_flags_observed':all(flag in flags for flag in SYNC_FLAGS)}
 except Exception as env_error:r['chrome']={'inspection_error':str(env_error),'approved_flags_observed':False}
 checkpoint('browser-details')
 page=fresh=None
 try:
  page=source(b,author=True);original=read(page)
  assert original['full']=='135e9a633d311d3b8b03ab2c676a7e94a46601629e0a91d7835988ed96438ddf'
  checkpoint('ui-stock-source-pinned')
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
  previous_status=page.locator('html').get_attribute('data-qa-east-status')
  click_button(page,'끝마감 저장')
  page.wait_for_function("old=>document.documentElement.dataset.qaEastStatus!=null&&document.documentElement.dataset.qaEastStatus!==old",arg=previous_status,timeout=30000)
  r['save_toast']=page.locator('#toast').text_content()
  r['save_status']=page.locator('html').get_attribute('data-qa-east-status')
  assert r['save_status']=='끝마감 초안을 저장했습니다.', ('Editor Save rejected',r['save_status'],r['save_toast'])
  edited=read(page);assert edited['cap'] is not None and edited['cap']['design']==post
  assert all(edited[k]==original[k] for k in ('old','clip','protected'))
  checkpoint('ui-draft-committed')
  with page.expect_download(timeout=30000) as a:click_button(page,'끝마감 내보내기')
  with tempfile.TemporaryDirectory() as t:
   draft=Path(t)/'temporary-east-cap.json';a.value.save_as(draft)
   r['draft_bytes']=draft.stat().st_size;assert 0<r['draft_bytes']<=4096
   fresh=source(b);assert read(fresh)==original
   fresh.evaluate("Object.defineProperty(window,'__eastStockBeforeOpen',{value:HonroWorkshopAPI.getProject(),configurable:false,writable:false})")
   with fresh.expect_file_chooser() as picker:click_button(fresh,'끝마감 초안 열기')
   picker.value.set_files(str(draft))
   fresh.wait_for_function("['opened','error'].includes(document.documentElement.dataset.qaEastImport)",timeout=45000)
   r['fresh_import_error']=fresh.locator('html').get_attribute('data-qa-east-error')
   r['fresh_toast']=fresh.locator('#toast').text_content()
   assert fresh.locator('html').get_attribute('data-qa-east-import')=='opened',r['fresh_import_error']
   assert read(fresh)==edited
   r['ui_pass']=True
   r['comparison_environment']=fresh.evaluate("()=>({dpr:devicePixelRatio,width:innerWidth,height:innerHeight,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,locale:navigator.language,srgb:matchMedia('(color-gamut: srgb)').matches})")
   r['reopened_project_sha256']=edited['full']
   r['scoped_record_sha256']=hashlib.sha256(draft.read_bytes()).hexdigest()
   checkpoint('ui-fresh-draft-exact')
   fresh.screenshot(path=str(out/'04-native-reopened.png'))
  page.context.close()
  assert r['chrome']['approved_flags_observed'], 'Browser flags were not independently confirmed; renderer blocked, not authoring'
  assert r['comparison_environment']['dpr']==1 and [r['comparison_environment'][k] for k in ('width','height')]==[1440,900]
  # All scenes below use this fresh chooser context in one actual Chrome and
  # reconstruct fresh battle/Scene objects. Cap input is from UI, never file-
  # fixture insertion or API geometry authoring.
  A1,olds=capture(fresh,original,'stock-a1','stock')
  A2,control=capture(fresh,original,'stock-a2','stock')
  assert A1==A2
  r['stock_aa']={}
  for name,(base,meta) in olds.items():
   check,checkmeta=control[name];common_meta(meta,checkmeta)
   r['stock_aa'][name]=exact_stock(base.tobytes(),check.tobytes())
  r['determinism_pass']=all(v['pass'] for v in r['stock_aa'].values())
  checkpoint('stock-controls-per-camera')
  assert read(fresh)==edited,'Reopened native candidate drift before Scene check'
  r['scope']={};r['scene_diagnostics']={}
  for name,(base,meta) in olds.items():
   valid=r['stock_aa'][name]['pass']
   assert read(fresh)==edited and edited['cap']['design']==post
   assert all(edited[k]==original[k] for k in ('old','clip','protected'))
   B,news=capture(fresh,edited,'candidate-exact' if valid else 'candidate-diagnostic-only','candidate',{name})
   assert A1==B
   cand,result=news[name];common_meta(meta,result)
   assert read(fresh)==edited
   area=approved_area(meta,post['outline'])
   summary=exact_protected(base.tobytes(),cand.tobytes(),area,opaque(fresh,meta))
   if valid:
    if name=='landscape-pan-12':
     stock2,meta2=control[name]
     aa,trace1=cached_native_body(fresh,meta,original,'stock','stock-a1')
     aa2,trace2=cached_native_body(fresh,meta2,original,'stock','stock-a2')
     bb,traceb=cached_native_body(fresh,result,edited,'candidate','candidate-b')
     shadow_aa=exact_stock(aa.tobytes(),aa2.tobytes())
     assert shadow_aa['pass'],('Landscape owner shadow nondeterministic',shadow_aa)
     alpha=aa.getchannel('A').tobytes()
     gate=exact_protected(base.tobytes(),cand.tobytes(),area,alpha)
     owner_gate=exact_protected(aa.tobytes(),bb.tobytes(),area,alpha)
     direct=opaque(fresh,meta)
     ra,rb=base.tobytes(),cand.tobytes()
     pixels=[i for i,old in enumerate(direct) if old==255 and ra[i*4:i*4+4]!=rb[i*4:i*4+4]]
     r['landscape_retained_shadow']={'stock_aa':shadow_aa,'owner_ab':owner_gate,'dpr':trace1['dpr'],'world_raster_scale':trace1['rs'],
                                     'exact_live_blits_matched':True,'body_shadow_digests':[sha(q.tobytes()) for q in (aa,aa2,bb)],
                                     'direct_mask_diagnostic':summary}
     from collections import Counter
     r['landscape_retained_shadow']['direct_opaque_changed_alpha_in_retained']=dict(Counter(str(alpha[i]) for i in pixels))
     summary={**gate,'pass':gate['pass'] and owner_gate['pass'],'opaque_basis':'native cached BODY shadow, exact native Scene tile blits'}
    r['scope'][name]={**summary,'same_camera_and_lod':True,'clip_band_output_pixels':3}
   else:
    r['scene_diagnostics'][name]={'classification':'unverified full Scene: stock A/A unstable; visuals only','exact_pass':False,'unqualified_deltas':summary,'same_camera_and_lod':True}
    base.save(out/f'stock-diagnostic-only-{name}.png')
   checkpoint(('candidate-pixel-gate-' if valid else 'candidate-diagnostic-not-qualified-')+name)
  corner=olds['corners-03'][1]
  ca=native_body(fresh,corner,'stock','stock-a1')
  ca2=native_body(fresh,corner,'stock','stock-a2')
  cb=native_body(fresh,corner,'candidate','candidate-b')
  clip=native_body(fresh,corner,'clip','clip-alpha-stock').getchannel('A')
  r['corner_native_body']=transparent_body(ca.tobytes(),ca2.tobytes(),cb.tobytes(),approved_area(corner,post['outline']),clip.tobytes())
  r['corner_native_body']['raw_rgba_sha256']=[sha(i.tobytes()) for i in (ca,ca2,cb)]
  r['candidate_render_pass']=full_scene_exact(r['stock_aa'],r['scope'],set(olds))
  r['partial_technical_pass']=bool(r['scope'].get('landscape-pan-12',{}).get('pass') and r['corner_native_body']['pass'])
  assert read(fresh)==edited
  assert not r['page_errors']
  if r['ui_pass'] and r['partial_technical_pass']:
   receipt=fresh.evaluate(OBSERVED_JS,{'draftDigest':r['scoped_record_sha256'],'reopenedDigest':edited['full'],'sha':os.environ['GITHUB_SHA'],'run':os.environ['GITHUB_RUN_ID']})
   semantic=receipt['text'].encode('utf-8');assert 0<len(semantic)<=4096 and sha(semantic)==receipt['sha256']
   (out/'observed-east-cap.json').write_bytes(semantic)
   r['observed_cap']={'sha256':receipt['sha256'],'bytes':len(semantic),'source':'fresh reopened genuine UI'}
  r['pass']=r['candidate_render_pass'];r['art_approval']=False
  checkpoint('all-exact-technical' if r['pass'] else 'partial-only' if r['partial_technical_pass'] else 'insufficient-technical-proof')
  if not r['partial_technical_pass']:raise AssertionError('Landscape exact or native corner BODY gate failed')
  if not r['pass']:raise AssertionError('Partial technical evidence retained; full Scene exact is not qualified')
 except Exception as e:
  r['error']=str(e);checkpoint('failed')
  failure=fresh or page
  if failure and not failure.is_closed():failure.screenshot(path=str(out/'failure-workshop.png'))
  raise
 finally:b.close()
