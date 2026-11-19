"""Local-only, genuine pointer/chooser plus Stage42 owner-cached renderer proof."""
import base64
import hashlib
import statistics
import json
import os
import sys
import tempfile
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
from playwright.sync_api import sync_playwright

HERE=Path(__file__).resolve().parent
assert os.environ.get("HONRO_STAGE42_OWNER_QA_SMOKE") == "1"
plan=json.loads((HERE/'workpad.json').read_text())
oracle_bytes=(HERE/'visual-oracle.json').read_bytes()
assert hashlib.sha256(oracle_bytes).hexdigest()=='d1ab79d227021c016da539be8ed8a75906e8a3334de56ed3c2f8e287f1785fdb'
oracle=json.loads(oracle_bytes)
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url='http://127.0.0.1:8870/HONRO_WORKSHOP.html'
local=lambda pt:[(2*pt[0]-1130)/plan['placementScale'],(2*pt[1]+1050)/plan['placementScale']]
r={'pass':False,'page_errors':[],'console_warning_count':0,'console_warnings':[]}
def chk(phase):
 r['phase']=phase
 (out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
def read_state(page):
 return page.evaluate("""async()=>{
  const p=HonroWorkshopAPI.getProject(),a=p.library.find(a=>a.id==='act5:near:42'),e=a.edgeWall,s=e.params.workshopVisibleJoint42??null;
  const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const full=hash(p),source=hash([s?s.originalRoot:e.vector.root,e.vector.clips['native-source-alpha']]);delete a.edgeWall;
  return {full:await full,source:await source,nonOwner:await hash(p),rim:s?.rim??null,materials:s?.materials??null};
 }""")
def boot(browser):
 page=browser.new_context(viewport={'width':1500,'height':1000},device_scale_factor=1).new_page()
 page.on('pageerror',lambda e:r['page_errors'].append(str(e)))
 def console(msg):
  if msg.type in ('warning','error'):
   r['console_warning_count']+=1
   if len(r['console_warnings'])<50:r['console_warnings'].append({'type':msg.type,'text':msg.text})
 page.on('console',console)
 page.goto(url)
 page.wait_for_function('window.HonroWorkshopAPI?.getEditorState()',timeout=90000)
 page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
 return page
def hit(page,points):
 screen=page.evaluate("""pts=>{
  const api=HonroWorkshopAPI,s=api.queryScene().stage,e=s.elements.find(e=>e.assetId==='act5:near:42'),c=document.querySelector('#stageCanvas'),box=c.getBoundingClientRect();
  if(e.scale!==3.2146389713155292||e.x!==0||e.y!==0)throw Error('Unexpected Stage42 placement transform');
  for(const camera of [{x:158,y:1600,zoom:.88},{x:400,y:1370,zoom:.88},{x:600,y:1270,zoom:.78},{x:500,y:1340,zoom:.7},{x:350,y:1290,zoom:.55}]){
   api.setCamera(camera);const v=api.getEditorState().stageView;
   const q=pts.map(([x,y])=>({x:c.clientWidth/2+(e.x+x*e.scale-v.x)*v.zoom,y:c.clientHeight/2+(e.y+y*e.scale-v.y)*v.zoom}));
   if(q.every(p=>p.x>10&&p.y>10&&p.x<c.clientWidth-10&&p.y<c.clientHeight-10&&document.elementFromPoint(box.left+p.x,box.top+p.y)===c))return q;
  }
  throw Error('Workpad inputs occluded');
 }""",[local(x) for x in points])
 for xy in screen:page.locator('#stageCanvas').click(position=xy)
def click(page,action):page.locator(f'[data-joint-action="{action}"]').click()
def render(page,mode,st,tag):
 z=page.evaluate((HERE/'scene-bench.js').read_text(),{'on':mode,'projectSHA':st['full'],'expectedRim':st['rim']})
 (out/(tag+'.png')).write_bytes(base64.b64decode(z.pop('png').split(',',1)[1],validate=True))
 r[tag]=z
 chk(tag+'-ready')
 return z
def equal_region(a,b,xy):
 x,y=xy
 return a.crop((x-1,y-1,x+2,y+2)).tobytes()==b.crop((x-1,y-1,x+2,y+2)).tobytes()
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ['HONRO_CHROME'])
 source=fresh=None
 try:
  source=boot(b);before=read_state(source)
  assert before['source']=='4a413feb79ba5cabb75a8a3e204bce816548db1c80857e11a9538391625756a8'
  assert before['nonOwner']=='4b1779fe40e1c4f87eabd1913546fa045056d30a80adf448db9611574e58b625'
  source.locator('[data-tool="nativeJoint"]').click()
  hit(source,plan['rim'][:plan['end']+1]);click(source,'rim-end');hit(source,plan['rim'][plan['end']+1:]);click(source,'rim-close')
  hit(source,plan['chain']);click(source,'preview');assert read_state(source)==before
  source.screenshot(path=str(out/'01-native-pre-save.png'));click(source,'apply')
  r['save_toast']=source.locator('#toast').text_content()
  authored=read_state(source)
  assert len(authored['rim'])==len(plan['rim']) and authored['materials']==plan['palette']
  assert all(authored[k]==before[k] for k in ('source','nonOwner')) and authored['full']!=before['full']
  with source.expect_download(timeout=60000) as export:click(source,'download')
  with tempfile.TemporaryDirectory() as td:
   file=Path(td)/'temporary-workshop-draft.json';export.value.save_as(file)
   r['draft_bytes']=file.stat().st_size;assert 0<r['draft_bytes']<=8192
   fresh=boot(b);assert read_state(fresh)==before
   baseline=render(fresh,False,before,'02-same-camera-original')
   fresh.locator('[data-tool="nativeJoint"]').click()
   with fresh.expect_file_chooser() as picker:click(fresh,'open')
   picker.value.set_files(str(file))
   fresh.wait_for_function("['opened','failed'].includes(document.documentElement.dataset.jointDraft)",timeout=70000)
   r['fresh_import']=fresh.locator('html').get_attribute('data-joint-draft')
   r['fresh_import_error']=fresh.locator('html').get_attribute('data-joint-draft-error')
   r['fresh_toast']=fresh.locator('#toast').text_content()
   assert r['fresh_import']=='opened',r['fresh_import_error']
   assert read_state(fresh)==authored
   fresh.screenshot(path=str(out/'03-native-reopened.png'))
   disabled=render(fresh,False,authored,'04-disabled-fallback')
   candidate=render(fresh,True,authored,'05-same-camera-replacement')
  assert all(x['farReady'] for x in (baseline,disabled,candidate))
  assert len({x['physics'] for x in (baseline,disabled,candidate)})==1
  assert len({x['units'] for x in (baseline,disabled,candidate)})==1
  assert [x['camera'] for x in baseline['samples'].values()]==[x['camera'] for x in candidate['samples'].values()]
  s=candidate['samples']
  assert s['initial']['owner']['used']>candidate['start']['used'], 'Candidate never used owned backing'
  assert s['initial']['owner'].get('oldInkChanged',0)>candidate['start'].get('oldInkChanged',0),'No actual new-only opaque BODY pixels'
  assert s['warm']['owner']['attempts']==s['initial']['owner']['attempts'], 'Warm render recomposed'
  assert s['zoom']['owner']['attempts']>s['warm']['owner']['attempts'], 'Zoom did not invalidate owner work'
  assert s['afterZoomWarm']['owner']['attempts']==s['zoom']['owner']['attempts'], 'Warm draw after LOD invalidation recomposed'
  def image(name):return Image.open(out/(name+'.png')).convert('RGBA')
  A=image('02-same-camera-original');F=image('04-disabled-fallback');C=image('05-same-camera-replacement')
  actual_png_sha=hashlib.sha256((out/'02-same-camera-original.png').read_bytes()).hexdigest()
  r['baseline_png_sha']=actual_png_sha
  r['baseline_png_encoded_match']=actual_png_sha==oracle['baseline']['pngSHA256']
  assert A.tobytes()==F.tobytes(),'Disable QA did not fall back to original exactly'
  masks=Image.new('1',A.size);m=ImageDraw.Draw(masks)
  shifted=[(x*.5*plan['placementScale']+(1280/2-150*.5),y*.5*plan['placementScale']+(800/2-1850*.5)) for x,y in authored['rim']]
  m.polygon(shifted,fill=1);m.line(shifted+[shifted[0]],fill=1,width=7,joint='curve')
  changed=inside=outside=maximum=0
  for a,c,mask in zip(A.getdata(),C.getdata(),masks.getdata()):
   d=max(abs(i-j) for i,j in zip(a,c))
   if d:
    changed+=1
    if mask:inside+=1
    else:outside+=1;maximum=max(maximum,d)
  r['pixel_gate']={'inside_changed':inside,'outside_changed':outside,'outside_max_rgba_delta':maximum,'outside_influence_definition':'rounded owned polygon +/-3 specified output pixels','protected_shelf_exact':all(equal_region(A,C,pt) for pt in plan['shelf']),'control_exact':all(equal_region(A,C,pt) for pt in plan['outside'])}
  bands={}
  for band, spec in oracle['pixelOracle']['bands'].items():
   outputs=[]
   for probe in spec['probes']:
    x,y=probe['center']
    a=A.crop((x-1,y-1,x+2,y+2)).convert('RGB');c=C.crop((x-1,y-1,x+2,y+2)).convert('RGB')
    ma=[int(statistics.median(p[i] for p in a.getdata())) for i in range(3)]
    mc=[int(statistics.median(p[i] for p in c.getdata())) for i in range(3)]
    delta=max(abs(u-v) for u,v in zip(ma,mc))
    ok=(a.tobytes()==c.tobytes() if spec.get('pixelsMustMatchExactly') else
        (delta<=spec.get('maxChannelDeltaFromBaseline',255) and mc[0]-mc[2]<=spec.get('maxRedMinusBlue',255) and mc[0]<=spec.get('maxRed',255)))
    outputs.append({'xy':[x,y],'pinned_baseline_patch_exact':hashlib.sha256(a.tobytes()).hexdigest()==probe['baselinePatchRGBsha256'],
                    'before':ma,'after':mc,'delta':delta,'pass':ok})
   bands[band]=outputs
  assert all(v['pinned_baseline_patch_exact'] for band in bands.values() for v in band), 'Official source pixel probe mismatch'
  assert not any(n>candidate['start'].get('fallbacks',{}).get(k,0) for k,n in candidate['samples']['initial']['owner'].get('fallbacks',{}).items() if k!='disabled'), 'Local owner refused coverage; no fallback acceptance'
  r['art_oracle']={'mechanical_and_color_checks_are_separate':True,'visual_approval':False,'passed_all_color_probes':all(v['pass'] for band in bands.values() for v in band),'bands':bands}
  chk('pixel-gate')
  assert inside>0 and outside==0 and r['pixel_gate']['protected_shelf_exact'] and r['pixel_gate']['control_exact'],r['pixel_gate']
  assert candidate['samples']['zoom']['owner']['underBudgetPixels']<=44000,'V6 unexpectedly exceeds the bounded preflight'
  assert not r['page_errors']
  r['cache_timing_summary_ms']={label:{phase:{'median':statistics.median(data['elapsedMs']),'max':max(data['elapsedMs'])} for phase,data in proof['samples'].items()} for label,proof in [('original',baseline),('disabled',disabled),('replacement',candidate)]}
  r['pass']=True;chk('complete')
 except Exception as e:
  r['error']=str(e);chk('failed')
  if fresh and not fresh.is_closed():
   try:
    r['fresh_import']=fresh.locator('html').get_attribute('data-joint-draft',timeout=5000)
    r['fresh_import_error']=fresh.locator('html').get_attribute('data-joint-draft-error',timeout=5000)
    r['fresh_toast']=fresh.locator('#toast').text_content(timeout=5000)
    chk('failed')
   except Exception as d:r['diagnostic_error']=str(d);chk('failed')
   fresh.screenshot(path=str(out/'failure-fresh.png'))
  raise
 finally:b.close()
