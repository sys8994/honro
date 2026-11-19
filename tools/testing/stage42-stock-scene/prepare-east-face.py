"""One bounded original painted rock-plane restoration. No optimization or terrain redesign."""
from pathlib import Path
import json,copy,hashlib,runpy,sys,re
here=Path(__file__).parent;runpy.run_path(str(here/'prepare-palette.py'),run_name='__main__');out=Path(sys.argv[2]);enc=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':')).encode();sha=lambda x:hashlib.sha256(enc(x)).hexdigest()
base=json.loads((out/'baseline-package.json').read_text());old=json.loads((out/'palette-candidate.json').read_text());assert sha(old)=='80445731d8333c11cd8d601cf1afa125391d2a0401158143243f11efbf2d0139'
def paths(n):
 if n.get('tag')=='path':yield n
 for c in n.get('children',[]):yield from paths(c)
a=list(paths(base['assets'][0]['vector']['root']));p=a[13];d=' '.join(p.get('dParts',[]))or p['d'];ring=re.findall('[Mm][^Mm]*',d)[2];assert ring.startswith('M')and ring.rstrip().lower().endswith('z')
mod=copy.deepcopy(old);v=mod['assets'][0]['vector'];v['clips']['source-east-single-face']=[ring]
v['root']['children'].append({'tag':'g','clipPath':'source-east-single-face','children':[copy.deepcopy(base['assets'][0]['vector']['root'])]})
check=copy.deepcopy(mod);check['assets'][0]['vector']['clips'].pop('source-east-single-face');check['assets'][0]['vector']['root']['children'].pop();assert check==old
(out/'east-face-candidate.json').write_bytes(enc(mod));(out/'east-face-proof.json').write_text(json.dumps({'sourcePathIndex':13,'sourceRingIndex':2,'ringSha256':hashlib.sha256(ring.encode()).hexdigest(),'bounds':[1851.5,353.4,1992.3,477.5],'beforeSha256':sha(old),'candidateSha256':sha(mod),'scope':'One original-color/contour rock face restored over new decorative BODY; canonical source geometry unchanged. No camera, alpha coverage, collision, surface, optimization or other geometry change. Diagnostic overlay cost must be measured.'},indent=2))
