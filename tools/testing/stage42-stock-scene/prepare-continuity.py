"""Diagnostic only. Reproduce unoptimized native trace composition; production files untouched."""
from pathlib import Path
import copy,json,hashlib,sys,importlib.util,xml.etree.ElementTree as E
root,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
def encode(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def sha(v):return hashlib.sha256(v).hexdigest()
base={'assets':[json.loads((root/'shared/assets/environment/act5'/n).read_text())for n in ['stage42-registered-body.json','stage42-surface.json']]}
assert sha(encode(base))=='ec3172af1360b8b55aeda442f4ed57a5f4a5bf85fce94287a0ed86f54c16ce8b'
imp=root/'tools/vector-production/import-svg.py'
if not imp.exists():imp=Path(__file__).parent/'import-svg.py'
spec=importlib.util.spec_from_file_location('honro_svg_import',imp);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
raw=(Path(__file__).parent/'continuity-native-split.svg').read_bytes()
assert sha(raw)=='f6501f53373b8a1cdf66af49329071961ec201702dd7ffd22fb2a880a07da63f'
mod=copy.deepcopy(base);v=mod['assets'][0]['vector']
def paths(n):
 if n.get('tag')=='path':yield n
 for c in n.get('children',[]):yield from paths(c)
a=list(paths(v['root']));west=a[0]['d'].replace('-338.11','-1200').replace('1169.33','3600');east=a[1]['d'].replace('2300','3300').replace('1169.33','3600')
v['clips']['continuity-contact']=[west,east]
r=E.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'}
v['clips']['continuity-native-alpha']=[p.attrib['d']for p in r.findall('./s:defs/s:clipPath/s:path',ns)]
assert len(v['clips']['continuity-native-alpha'])==1
colors=[]
for p in r.findall('./s:g/s:g/s:path',ns):
 assert set(p.attrib)=={'d','style','id'} and p.attrib['style'].startswith('fill:#')
 colors.append({'tag':'path',**m.preserve_compound(p.attrib['d']),'fill':p.attrib['style'][5:],'fillRule':'nonzero','stroke':'none'})
assert len(colors)==14
addition={'tag':'g','clipPath':'continuity-contact','children':[{'tag':'g','transform':[4500/1403,0,0,3600/1121,-1200,0],'clipPath':'continuity-native-alpha','children':colors}]}
v['root']={'tag':'g','children':[v['root'],addition]}
assert mod['assets'][1]==base['assets'][1]
(out/'baseline-package.json').write_bytes(encode(base));(out/'continuity-candidate.json').write_bytes(encode(mod))
(out/'continuity-reconstruction.json').write_text(json.dumps({'sourceCommit':'1e043b09d4ce107e1d2dcf70fe2274dff7098476','candidateSha256':sha(encode(mod)),'baselineSha256':sha(encode(base)),'surfaceUnchanged':True,'oldBodyUnderlayUnchanged':True,'scope':'DIAGNOSTIC: vector-only composition, no optimizer, unchanged world/contact vertices and asset metadata. Native boolean flatten/import validation pending. Extent artwork[-1200,0,4500,3600] is a study; actual cameras unmodified.'},indent=2))
