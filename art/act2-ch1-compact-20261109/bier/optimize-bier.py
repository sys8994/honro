"""Independent native simplification/precision candidates from authored raw.
Existing pixel comparator and fixed contact limits; no art approval.
"""
from pathlib import Path
from lxml import etree as E
import subprocess,sys,os,shutil,json,re,hashlib
source,out,exe=[Path(x).resolve() for x in sys.argv[1:4]];out.mkdir(parents=True,exist_ok=True)
raw=out/'raw-authored.svg'
if raw.exists():raise RuntimeError('Refuse to overwrite immutable authored reference')
shutil.copy2(source,raw)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
root=E.parse(str(raw));ids=[p.get('id') for p in root.findall('.//{*}path') if not any(E.QName(a).localname=='clipPath' for a in p.iterancestors()) and p.get('id') not in ['low-contact-surface','contact-band']]
rows=[];candidates=[]
for threshold in ([] if '--precision-only' in sys.argv else [0.00001,0.00005]):
 label='simplify-'+str(threshold);target=out/(label+'.svg');shutil.copy2(raw,target);profile=out/('profile-'+label);profile.mkdir()
 (profile/'preferences.xml').write_text('<inkscape><group id="options"><group id="simplifythreshold" value="'+str(threshold)+'"/></group></inkscape>',encoding='utf-8')
 args=[str(exe),str(target),'--batch-process','--actions=select-by-id:'+','.join(ids)+';path-simplify;export-plain-svg;export-filename:'+str(target)+';export-do']
 p=subprocess.run(args,env={**os.environ,'INKSCAPE_PROFILE_DIR':str(profile)},capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180)
 (out/(label+'.log')).write_text(json.dumps(args)+'\n'+p.stdout+p.stderr,encoding='utf-8')
 if p.returncode:raise RuntimeError('Native simplify failed')
 candidates.append((label,target))
for decimals in [6]:
 t=E.parse(str(raw));r=t.getroot()
 for node in list(r.iter()):
  if not isinstance(node.tag,str):continue
  if E.QName(node).localname in ['metadata','namedview'] and node.getparent() is not None:node.getparent().remove(node);continue
  if E.QName(node).localname=='path':
   def num(m):
    f=round(float(m.group()),decimals);return str(int(f)) if f==int(f) else ('%.*f'%(decimals,f)).rstrip('0').rstrip('.')
   node.set('d',re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',num,node.get('d','')))
 E.cleanup_namespaces(r);label='precision-'+str(decimals);target=out/(label+'.svg');target.write_bytes(E.tostring(t,encoding='utf-8',xml_declaration=True));candidates.append((label,target))
config=source.parents[1]/'optimization-config.json'
for label,target in candidates:
 comparison=out/('compare-'+label);args=[sys.executable,'tools/vector-production/compare-svg.py',str(raw),str(target),'--config',str(config),'--output-dir',str(comparison)]
 p=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=180);(out/(label+'-comparison.log')).write_text(p.stdout+p.stderr,encoding='utf-8')
 result=json.loads((comparison/'comparison.json').read_text(encoding='utf-8'));rows.append({'label':label,'file':str(target),'bytes':target.stat().st_size,'qualityPass':result['qualityPass'],'errors':result['errors'],'exitCode':p.returncode})
feasible=[r for r in rows if r['qualityPass']]
chosen=min(feasible,key=lambda r:r['bytes']) if feasible else None
shutil.copy2(chosen['file'] if chosen else raw,out/'final.svg')
report={'rawSha256':sha(raw),'rawUnchanged':sha(raw)==sha(source),'rawBytes':raw.stat().st_size,'chosen':chosen,'candidates':rows,'finalSha256':sha(out/'final.svg'),'finalBytes':(out/'final.svg').stat().st_size,'visualApproval':'NOT APPROVED; inspect actual sizes and 200% contact areas','scope':'RAW here is the explicitly palette/contact-authored source; native source trace and intentional source edits have separate loss reports. Native alpha and contact clips excluded from simplify.'}
(out/'optimization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({'chosen':chosen['label'] if chosen else None,'rawBytes':report['rawBytes'],'finalBytes':report['finalBytes']}));sys.exit(0 if chosen else 2)
