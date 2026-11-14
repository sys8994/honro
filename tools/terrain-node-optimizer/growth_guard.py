"""Fail-closed non-growth checks. Subpaths are a face proxy, not tessellated faces."""
import json,re
import xml.etree.ElementTree as ET
from svgpathtools import parse_path

def path_metrics(paths):
    paths=list(paths)
    return {'segments':sum(len(parse_path(d)) for d in paths),
            'subpaths':sum(len(re.findall('[Mm]',d)) for d in paths),
            'paths':len(paths)}

def svg_metrics(raw):
    root=ET.fromstring(raw)
    result=path_metrics(e.get('d') for e in root.iter() if e.tag.split('}')[-1]=='path' and e.get('d'))
    result['shape_elements']=sum(e.tag.split('}')[-1] in {'path','rect','circle','ellipse','polygon','polyline','line','use'} for e in root.iter())
    return result

def package_metrics(raw):
    obj=json.loads(raw);paths=[]
    def walk(v):
        if isinstance(v,dict):
            if v.get('tag')=='path':
                d=' '.join(v['dParts']) if v.get('dParts') else v.get('d','')
                if d:paths.append(d)
            for key,value in v.items():
                if key=='clips' and isinstance(value,dict):
                    for ds in value.values():paths.extend(ds)
                else:walk(value)
        elif isinstance(v,list):
            for item in v:walk(item)
    for asset in obj.get('assets',[]):walk(asset.get('vector',{}))
    return path_metrics(paths)

def non_growth(original,candidate,measure):
    """Reject any increased metric or unmeasurable geometry. No partial success."""
    report={'original_bytes':len(original),'candidate_bytes':len(candidate),'reasons':[]}
    if len(candidate)>len(original):report['reasons'].append('bytes increased')
    try:
        a,b=measure(original),measure(candidate)
        report.update(before=a,candidate=b)
        for key in a:
            if b.get(key)!=None and b[key]>a[key]:report['reasons'].append(key+' increased')
    except Exception as exc:
        report['reasons'].append('metrics unavailable: '+type(exc).__name__)
    report['accepted']=not report['reasons']
    return report

def guarded_output(original,candidate,measure):
    report=non_growth(original,candidate,measure)
    result=candidate if report['accepted'] else original
    report['output_bytes']=len(result)
    report['output']=report.get('candidate' if report['accepted'] else 'before')
    return result,report
