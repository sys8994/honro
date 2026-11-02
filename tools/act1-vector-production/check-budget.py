"""Artifact size/format gate only. Never certifies contact or gameplay acceptance."""
import argparse,hashlib,json,xml.etree.ElementTree as E
from pathlib import Path

def check(budgets,plan,stage,svg):
 b=next((x for x in budgets['stages'] if x['stage']==stage),None)
 s=next((x for x in plan['stages'] if x['stage']==stage),None)
 if b is None or s is None:return {'gate':'artifact-budget-only','pass':False,'reason':'Immutable baseline or source geometry missing'}
 raw=svg.read_bytes();r=E.fromstring(raw);vb=[float(v) for v in r.get('viewBox','').replace(',',' ').split()]
 checks={'additional30Percent':len(raw)<=b['maxFinalBytes'],'worldFrame':vb==[0,0,s['width'],s['height']],'noEmbeddedImage':not any(e.tag.split('}')[-1]=='image' for e in r.iter())}
 return {'gate':'artifact-budget-only','stage':stage,'baselineSha256':b['sha256'],'baselineBytes':b['baselineBytes'],'candidateSha256':hashlib.sha256(raw).hexdigest(),'candidateBytes':len(raw),'reductionFraction':1-len(raw)/b['baselineBytes'],'checks':checks,'pass':all(checks.values()),'contactRegistration':'REQUIRES_SEPARATE_EVIDENCE','deploymentAccepted':False}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',type=int);p.add_argument('svg',type=Path);p.add_argument('--out',type=Path,required=True);a=p.parse_args();h=Path(__file__).parent
 result=check(json.loads((h/'budgets.json').read_text()),json.loads((h/'plan.json').read_text()),a.stage,a.svg);a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result));raise SystemExit(0 if result['pass'] else 1)
