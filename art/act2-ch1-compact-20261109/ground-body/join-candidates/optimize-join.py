"""Bounded native lower-join optimization with existing engine pixel gates.
Two independent native Simplify attempts and a lower-only precision6 option.
Original upper stack, clips, gradients and source-role colors are protected.
"""
from pathlib import Path
from lxml import etree as E
import os,sys,json,subprocess,shutil,re,hashlib,importlib.util
base=Path(__file__).resolve().parent;out=base/'optimization-v2';out.mkdir(exist_ok=True);reports=Path('_local/reports/act2-redesign-20261109/ground-body-join/optimization-v2');reports.mkdir(parents=True,exist_ok=True);exe=Path(sys.argv[1]).resolve();raw=out/'authored-raw.svg'
recheck='--recheck' in sys.argv
if raw.exists()and not recheck:raise RuntimeError('Preserve authored RAW; use a new optimization folder')
if not recheck:shutil.copy2(base/'candidate-B-v3-authored.svg',raw)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();before=sha(raw)
spec=importlib.util.spec_from_file_location('join_import',base/'import-join.py');adapter=importlib.util.module_from_spec(spec);spec.loader.exec_module(adapter)
spec=importlib.util.spec_from_file_location('compare','tools/vector-production/optimize-svg.py');cmp=importlib.util.module_from_spec(spec);spec.loader.exec_module(cmp)
cfg=json.loads((base.parent/'optimization-config.json').read_text(encoding='utf-8'));(out/'comparison-config.json').write_text(json.dumps(cfg,indent=2),encoding='utf-8')
ids=[p.get('id')for p in E.parse(str(raw)).findall('.//{*}path')if p.get('id','').startswith('source-visible-')];assert len(ids)==8
candidates=[]
for threshold in [0.00001,0.00005]:
 label='native-simplify-'+str(threshold);dst=out/(label+'.svg');profile=reports/('profile-'+label);profile.mkdir(exist_ok=True);
 if not recheck:shutil.copy2(raw,dst)
 (profile/'preferences.xml').write_text('<inkscape><group id="options"><group id="simplifythreshold" value="'+str(threshold)+'"/></group></inkscape>',encoding='utf-8');args=[str(exe),str(dst),'--batch-process','--actions=select-by-id:'+','.join(ids)+';path-simplify;export-plain-svg;export-filename:'+str(dst)+';export-do'];p=subprocess.CompletedProcess(args,0,'Cached native output preserved','')if recheck else subprocess.run(args,env={**os.environ,'INKSCAPE_PROFILE_DIR':str(profile)},capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180);(reports/(label+'.log')).write_text(json.dumps(args)+'\n'+p.stdout+p.stderr,encoding='utf-8');candidates.append((label,dst,p.returncode))
t=E.parse(str(raw))
for p in t.findall('.//{*}path'):
 if p.get('id','').startswith('source-visible-'):
  def number(m):
   f=round(float(m.group()),6);return str(int(f))if f==int(f)else('%.6f'%f).rstrip('0').rstrip('.')
  p.set('d',re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',number,p.get('d')))
E.cleanup_namespaces(t.getroot());dst=out/'precision-6-lower.svg';dst.write_bytes(E.tostring(t,encoding='utf-8',xml_declaration=True));candidates.append(('precision-6-lower',dst,0))
def asset(svg,target):
 a=adapter.compile_join(svg);text=json.dumps(a,ensure_ascii=False,separators=(',',':'))
 if svg==raw and target.exists() and target.read_text(encoding='utf-8')!=text:raise RuntimeError('Authored RAW asset would change; use a fresh version')
 target.write_text(text,encoding='utf-8');return a
def run(asset,png,width):
 args=['node','tools/vector-production/render-asset.mjs',str(asset),str(png),str(width)];p=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
 if p.returncode:raise RuntimeError(p.stderr)
 r=json.loads(p.stdout)
 if r['validationErrors']:raise RuntimeError('Existing runtime validator rejects asset')
 return r
raw_asset=out/'authored-raw.asset.json';raw_data=asset(raw,raw_asset);raw_pngs={};renderings=[]
for scale in cfg['scales']:
 png=reports/('raw-'+str(scale)+'x.png');renderings.append(run(raw_asset,png,round(cfg['width']*scale)));raw_pngs[scale]=png
rows=[]
for label,svg,exitcode in candidates:
 row={'label':label,'svgBytes':svg.stat().st_size,'nativeExitCode':exitcode,'qualityPass':False}
 try:
  a=out/(label+'.asset.json');data=asset(svg,a);row['assetBytes']=a.stat().st_size;row['gradientsExact']=data['vector']['gradients']==raw_data['vector']['gradients'];row['clipsExact']=data['vector']['clips']==raw_data['vector']['clips'];row['scales']=[]
  for scale in cfg['scales']:
   png=reports/(label+'-'+str(scale)+'x.png');renderings.append(run(a,png,round(cfg['width']*scale)));row['scales'].append({'scale':scale,**cmp.compare(raw_pngs[scale],png,scale,cfg)})
  row['qualityPass']=exitcode==0 and row['gradientsExact']and row['clipsExact']and all(r['pass']for r in row['scales'])
 except Exception as e:row['error']=str(e)
 rows.append(row)
feasible=[r for r in rows if r['qualityPass']and r['assetBytes']<raw_asset.stat().st_size];chosen=min(feasible,key=lambda r:r['assetBytes'])if feasible else None
shutil.copy2(out/(chosen['label']+'.svg')if chosen else raw,base/'final.svg');shutil.copy2(out/(chosen['label']+'.asset.json')if chosen else raw_asset,base/'final.asset.json')
assert sha(raw)==before
report={'scope':'Existing engine RAW-to-FINAL comparison; source/native/contact authoring losses are separate. No source-to-author result is counted as optimization.','rawUnchanged':True,'rawSha256':before,'rawSvgBytes':raw.stat().st_size,'rawAssetBytes':raw_asset.stat().st_size,'chosen':chosen,'fallback':'Authored RAW selected if no smaller candidate passes unchanged existing limits.','candidates':rows,'renderings':renderings,'finalSvgSha256':sha(base/'final.svg'),'finalAssetSha256':sha(base/'final.asset.json'),'finalAssetBytes':(base/'final.asset.json').stat().st_size,'userApproval':'NONE','sceneReview':'PENDING parent actual commonScene after foundation final placement. Browser/combat/save/deployment not verified.'};(reports/'optimization.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'chosen':chosen['label']if chosen else 'RAW fallback','rawAssetBytes':raw_asset.stat().st_size,'finalAssetBytes':report['finalAssetBytes'],'candidates':[{'label':r['label'],'qualityPass':r['qualityPass'],'error':r.get('error')}for r in rows]}))
