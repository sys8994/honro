"""Independent, clean-stock Stage42 one-asset build check; no UI bridge or render hook."""
import argparse,base64,hashlib,io,json,os,shutil,traceback
from pathlib import Path
from urllib.parse import urlparse
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
from gameplay import play
D=Path(__file__).resolve().parent
p=argparse.ArgumentParser()
for f in ('a','b'):p.add_argument('--'+f,required=True)
p.add_argument('--receipt',required=True,type=Path);p.add_argument('--candidate-asset',required=True,type=Path);p.add_argument('--out',required=True,type=Path)
args=p.parse_args()
assert all(urlparse(x).hostname=='127.0.0.1' and urlparse(x).scheme=='http' for x in (args.a,args.b)) and args.a!=args.b
out=args.out;out.mkdir(parents=True,exist_ok=True)
rece_bytes=args.receipt.read_bytes();receipt=json.loads(rece_bytes)
assert hashlib.sha256(rece_bytes).hexdigest()=='789365e94591057ab9b3a0131da0f23c6c903b59e62bf2608c642dbe39333252', 'exact actual receipt required'
assert receipt['provenance']['run']=='44450156012' and receipt['schema']=='honro.stage42.observed-east-cap'
asset_bytes=args.candidate_asset.read_bytes()
assert hashlib.sha256(asset_bytes).hexdigest()=='13e7067247c92fcd2e8bd724e44d2aebcc76852e16fc6e7159ea159a6911bdd2','expected exact sole derived asset'
cap_group=json.loads(asset_bytes)['vector']['root']['children'][0]
cap_sha=hashlib.sha256(json.dumps(cap_group,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
stock_hash='135e9a633d311d3b8b03ab2c676a7e94a46601629e0a91d7835988ed96438ddf'
pinned=json.loads((D/'east-views.json').read_text())
cases=[*pinned,{'label':'east-support-only','requested':[5500,1490,.5],'size':[1280,800]}]
S=receipt['target']['scale']
R={'full_exact_scene_coverage':False,'bounded_technical_pass':False,'art_review_required':True,'source_receipt_sha256':hashlib.sha256(rece_bytes).hexdigest(),'play':{},'shots':{},'gates':{},'notes':['A/A classification is per view with exact RGBA, independently launched originals, no tolerance or borrowing another camera class. Actual movement is entry smoke only.']}

def save():
 (out/'result.json').write_text(json.dumps(R,indent=2,ensure_ascii=False))
def png(x,f):
 data=base64.b64decode(x.split(',',1)[1],validate=True)
 assert data.startswith(b'\x89PNG\x0d\x0a\x1a\x0a')
 (out/f).write_bytes(data)
 return hashlib.sha256(data).hexdigest(),Image.open(io.BytesIO(data)).convert('RGBA')
def scenes(browser,base,kind,shots):
 c=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,timezone_id='UTC',locale='en-US',reduced_motion='reduce')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(base+'/HONRO_WORKSHOP.html',wait_until='domcontentloaded')
  page.wait_for_function('window.HonroWorkshopAPI?.getEditorState()',timeout=90000)
  page.evaluate("HonroWorkshopAPI.selectStage('stage-42')")
  seq=[{'label':x['label'],'x':x['requested'][0],'y':x['requested'][1],'zoom':x['requested'][2]} for x in cases]
  got=page.evaluate((D/'stock-scenes.js').read_text(),{'views':seq,'w':1280,'h':800,'seed':3910,'projectSha':stock_hash,'capSha':cap_sha,'hasCap':kind=='B'})
  R['shots'][kind]={'physics':got['physics'],'units':got['units'],'frames':[]}
  for result in got['frames']:
   lab=result['label']
   exact=next((x for x in pinned if x['label']==lab),None)
   if exact:assert result['actual']==exact['actual'] and result['worldViewport']==exact['worldViewport'],(lab,result)
   sha,img=png(result.pop('png'),f'{kind}-{lab}.png')
   result['png_sha256']=sha
   body=clip=None
   if 'owner' in result:
    body_sha,body=png(result.pop('owner'),f'{kind}-{lab}-native-body.png');result['body_png_sha256']=body_sha
   if 'clip' in result:
    clip_sha,clip=png(result.pop('clip'),f'{kind}-{lab}-native-clip.png');result['clip_png_sha256']=clip_sha
   R['shots'][kind]['frames'].append(result)
   shots[(kind,lab)]=(img,result,body,clip)
  assert not errors,errors
 finally:c.close()

def diff(a,b,mask=None):
 d={'changed':0,'outside':0,'max_rgb':0,'changed_alpha':0}
 check=mask.getdata() if mask is not None else [1]*int(a.width*a.height)
 for x,y,m in zip(a.getdata(),b.getdata(),check):
  if x==y:continue
  d['changed']+=1;d['outside']+=not bool(m)
  d['max_rgb']=max(d['max_rgb'],*(abs(x[i]-y[i]) for i in range(3)))
  d['changed_alpha']+=x[3]!=y[3]
 return d
try:
 chrome=os.environ.get('HONRO_CHROME') or shutil.which('google-chrome') or shutil.which('chromium')
 assert chrome
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=chrome,args=['--force-color-profile=srgb'])
  R['chrome']=browser.version
  try:
   for label,base in (('A',args.a),('B',args.b)):
    R['play'][label]={'pass':False}
    try:play(browser,base,out,R['play'][label],label,cap_sha if label=='B' else None)
    except Exception:R['play'][label]['failure']=traceback.format_exc()
    save()
   # Independent baseline contexts first, then candidate; identical stock settings each.
   shots={}
   for label,base in (('A1',args.a),('A2',args.a),('B',args.b)):
    scenes(browser,base,label,shots);save()
   assert len({(s['physics'],s['units']) for s in R['shots'].values()})==1
   for spec in cases:
    label=spec['label'];a,am,oa,ca=shots['A1',label];a2,a2m,oa2,ca2=shots['A2',label];b,bm,ob,_=shots['B',label]
    assert am['actual']==a2m['actual']==bm['actual']
    rep=diff(a,a2); stable=rep['changed']==0
    g=R['gates'][label]={'stock_a1_vs_a2':rep,'aa_exact':stable,'release_eligible_view':stable}
    if label=='east-support-only':
     ab=diff(a,b); g.update(a_vs_b=ab,pass_exact_scene=(stable and ab['changed']==0));save();continue
    x,y,z=am['actual'];midw,midh=a.width/2,a.height/2
    contour=[(v['at'][0]*S*z-x*z+midw,v['at'][1]*S*z-y*z+midh) for v in receipt['outline']]
    m=Image.new('1',a.size);pen=ImageDraw.Draw(m)
    pen.polygon(contour,fill=1);pen.line([*contour,contour[0]],fill=1,width=7,joint='curve')
    ab=diff(a,b,m); g['a_vs_b']=ab
    ore=diff(oa,oa2); gt={'stock_a1_vs_a2':ore,'clip_equal':ca.tobytes()==ca2.tobytes(),'positive_new_alpha':0,'lost_alpha':0,'old_opaque_changes':0,'outside_owner_scope':0}
    raw=zip(oa.getdata(),ob.getdata(),ca.getdata(),m.getdata())
    for p,q,k,mv in raw:
     if p==q:continue
     gt['positive_new_alpha']+=(p[3]==0 and q[3]>0)
     gt['lost_alpha']+=q[3]<p[3]
     gt['old_opaque_changes']+=p[3]==255
     gt['outside_owner_scope']+=not bool(k[3] and mv)
    gt['pass']=ore['changed']==0 and gt['clip_equal'] and gt['positive_new_alpha']>0 and all(gt[k]==0 for k in ('lost_alpha','old_opaque_changes','outside_owner_scope'))
    g['native_body']=gt
    if stable:
     g['pass_exact_scene']=(ab['changed']>0 and ab['outside']==0 and ab['changed_alpha']==0)
    else:
     g['candidate_screenshot_class']='DIAGNOSTIC ONLY; stock A/A unstable; not an exact full-scene pass'
     local={'A_A_outside':0,'A_B_outside':0,'outside_beyond_exact_AA_support':0,'B_RGB_matches_neither_original_outside':0,'new_inside_delta':0}
     for px,px2,q,mv in zip(a.getdata(),a2.getdata(),b.getdata(),m.getdata()):
      if mv:
       local['new_inside_delta']+=q!=px and q!=px2
       continue
      local['A_A_outside']+=px!=px2
      local['A_B_outside']+=px!=q
      local['outside_beyond_exact_AA_support']+=px==px2 and q!=px
      local['B_RGB_matches_neither_original_outside']+=q!=px and q!=px2
     g['baseline_noise_localization_only']=local
     g['pass_exact_scene']=False
    save()
   proper=all(v.get('pass') for v in R['play'].values())
   assert len(R['gates'])==len(cases)
   R['physical_support_exact']=proper and R['play']['A']['support']==R['play']['B']['support']
   if proper:
    fields=('id','x','y','hp','grounded','support','round')
    assert all(R['play']['A']['entry'][x]==R['play']['B']['entry'][x] for x in fields)
   g=R['gates']; corn=g['corners-03']
   R['full_exact_scene_coverage']=all(v.get('pass_exact_scene') for v in g.values())
   local=corn.get('baseline_noise_localization_only',{})
   diag_localized=(local.get('outside_beyond_exact_AA_support')==0 and local.get('B_RGB_matches_neither_original_outside')==0 and local.get('new_inside_delta',0)>0)
   R['bounded_technical_pass']=bool(R['physical_support_exact'] and g['east-support-only'].get('pass_exact_scene') and
     g['landscape-pan-12'].get('pass_exact_scene') and g['landscape-pan-12']['native_body']['pass'] and corn['native_body']['pass'] and
     (corn.get('pass_exact_scene') or (not corn['aa_exact'] and diag_localized)))
   R['visual_release_decision']='NOT AUTOMATED; independent same-view art and protected seams review required'
   R['no_full_route_claim']=True
  finally:browser.close()
except Exception:R['failure']=traceback.format_exc()
finally:save()
raise SystemExit(0 if R['bounded_technical_pass'] else 1)
