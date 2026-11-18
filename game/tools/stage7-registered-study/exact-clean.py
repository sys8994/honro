from pathlib import Path
from PIL import Image
import hashlib,json,sys
P=Path(sys.argv[1]);gold=json.loads((Path(__file__).with_name('approved-clean.json')).read_text());rows=[];failed=False
for r in gold['rows']:
 stem='joined-'+r['view'];im=Image.open(P/(stem+'.png')).convert('RGBA');actual=json.loads((P/(stem+'.json')).read_text());digest=hashlib.sha256(im.tobytes()).hexdigest();errors=[]
 if digest!=r['rgbaSha256']or im.size!=(r['width'],r['height']):errors.append('RGBA differs from approved clean candidate')
 for k,v in r['contracts'].items():
  if actual[k]!=v:errors.append(k)
 if actual['movement']['trajectorySha256']!=r['movementSha256']:errors.append('movement')
 if not actual['registered']['candidateUninjected']:errors.append('candidate injected')
 rows.append({'view':r['view'],'errors':errors,'rgbaSha256':digest,'expectedSha256':r['rgbaSha256'],'browser':actual['browser'],'approvedBrowser':r['browser']});failed|=bool(errors)
(P/'registered-vs-approved-clean.json').write_text(json.dumps({'passed':not failed,'approvedRun':gold['sourceRun'],'rows':rows},indent=2));print(json.dumps(rows,indent=2))
if failed:raise SystemExit(1)
