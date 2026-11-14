#!/usr/bin/env python3
"""HONRO vector-package adapter. Changes only assets[].vector path d/dParts.
Clips, transforms, collision, source, IDs, metadata remain byte-equivalent as values.
Outputs candidate only; never changes game source. Per-asset SVG raster gate is NOT
an in-game Canvas performance or collision test.
"""
import argparse,copy,json,re,hashlib,tempfile,math
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
from optimize_svg import simplify,count,render,image_diff

def svg(vector):
    root=ET.Element('svg',xmlns='http://www.w3.org/2000/svg',viewBox=' '.join(map(str,vector['viewBox'])))
    defs=ET.SubElement(root,'defs')
    def node(n,parent):
        tag=n.get('tag','g');e=ET.SubElement(parent,tag)
        for k,v in n.items():
            if k in ['children','tag','dParts','symbol','pixelSnapClip']:continue
            if k=='transform':v='matrix('+','.join(map(str,v))+')'
            if k=='clipPath':k='clip-path';v='url(#'+v+')'
            k={'fillRule':'fill-rule','lineWidth':'stroke-width','lineJoin':'stroke-linejoin','lineCap':'stroke-linecap'}.get(k,k)
            if isinstance(v,(str,int,float)):e.set(k,str(v))
        if n.get('dParts'):e.set('d',' '.join(n['dParts']))
        if tag=='use':e.set('href','#'+n['symbol'])
        for c in n.get('children',[]):node(c,e)
        return e
    for id,paths in vector.get('clips',{}).items():
        cp=ET.SubElement(defs,'clipPath',id=id,clipPathUnits='userSpaceOnUse')
        for d in paths:ET.SubElement(cp,'path',d=d)
    for id,n in vector.get('symbols',{}).items():node(n,defs).set('id',id)
    for id,g in vector.get('gradients',{}).items():
        e=ET.SubElement(defs,'radialGradient' if g['type']=='radial' else 'linearGradient',id=id,gradientUnits='userSpaceOnUse')
        for k in ['x1','y1','x2','y2','cx','cy','r','fx','fy']:
            if k in g:e.set(k,str(g[k]))
        for s in g['stops']:ET.SubElement(e,'stop',offset=str(s['offset']),attrib={'stop-color':s['color'],'stop-opacity':str(s.get('opacity',1))})
    node(vector['root'],root)
    return ET.tostring(root,encoding='utf-8',xml_declaration=True)

def nodes(v, inherited_stroke=None, protected=False):
    if isinstance(v,dict):
        stroke=v.get('stroke',inherited_stroke)
        protected=protected or bool(re.search(r'(?i)(collision|contact|surface|walk|socket|support|interact|protected)',str(v.get('id','')))) or v.get('data-preserve') is True
        if v.get('tag')=='path':yield v,stroke,protected
        for x in v.values():yield from nodes(x,stroke,protected)
    elif isinstance(v,list):
        for x in v:yield from nodes(x,inherited_stroke,protected)

def unsafe_symbols(vector):
    """Conservatively quarantine a symbol if ANY use inherits stroke/protection.
    A definition may be reused under different ancestors; definition-only walks
    cannot infer safe inherited presentation. Missing/cyclic uses fail closed.
    """
    symbols=vector.get('symbols',{});blocked=set();visited=set()
    def walk(n,stroke=None,protected=False,chain=()):
        if not isinstance(n,dict):return
        stroke=n.get('stroke',stroke)
        protected=protected or bool(re.search(r'(?i)(collision|contact|surface|walk|socket|support|interact|protected)',str(n.get('id','')))) or n.get('data-preserve') is True
        if n.get('tag')=='use':
            name=n.get('symbol')
            if name not in symbols:
                blocked.update(symbols);return
            if name in chain:
                blocked.update(chain);blocked.add(name);return
            if protected or stroke not in (None,'none'):blocked.add(name)
            state=(name,str(stroke),protected)
            if state not in visited:
                visited.add(state);walk(symbols[name],stroke,protected,chain+(name,))
        for c in n.get('children',[]):walk(c,stroke,protected,chain)
    walk(vector['root'])
    return blocked

def editable_nodes(vector):
    yield from nodes(vector['root'])
    blocked=unsafe_symbols(vector)
    for name,definition in vector.get('symbols',{}).items():
        yield from nodes(definition,protected=name in blocked)

def scale_bound(v):
    # Deliberately conservative: product over all matrix norms, also covers
    # symbol reuse paths. Identity/shrink-only transforms do not reduce safety.
    result=1.
    def walk(x):
        nonlocal result
        if isinstance(x,dict):
            m=x.get('transform')
            if isinstance(m,list) and len(m)==6:
                result*=max(1.,float(np.linalg.norm([[m[0],m[2]],[m[1],m[3]]],2)))
            for y in x.values():walk(y)
        elif isinstance(x,list):
            for y in x:walk(y)
    walk(v)
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('input',type=Path);p.add_argument('output',type=Path)
    p.add_argument('--epsilon',type=float,default=1,help='error in vector viewBox units; divide desired screen px by maximum camera scale')
    p.add_argument('--asset-id',default='traced-(west|east)',help='regex selection, default traced west/east')
    p.add_argument('--widths',default='1280,2560');p.add_argument('--max-mean-error',type=float,default=.8/255);p.add_argument('--max-changed-fraction',type=float,default=.01)
    p.add_argument('--max-area-error',type=float,default=.02,help='relative signed area change allowed per subpath (default 2%%)')
    a=p.parse_args()
    if not 0 <= a.max_area_error <= .5:p.error('max-area-error must be 0..0.5')
    if a.output.exists() or a.input.resolve()==a.output.resolve():p.error('refusing overwrite')
    if not math.isfinite(a.epsilon) or a.epsilon<.0001:p.error('epsilon must be finite >=.0001')
    raw=a.input.read_bytes();x=json.loads(raw);report={'input':str(a.input),'input_sha256':hashlib.sha256(raw).hexdigest(),'epsilon':a.epsilon,'max_area_error':a.max_area_error,'max_mean_error':a.max_mean_error,'max_changed_fraction':a.max_changed_fraction,'assets':[]}
    for asset in x['assets']:
        if not re.search(a.asset_id,asset['id']):continue
        v=asset['vector'];original=copy.deepcopy(v);r={'id':asset['id'],'changed_paths':0,'segments_before':0,'segments_after':0,'skips':{}}
        epsilon=a.epsilon/scale_bound(v)
        r['quarantined_symbols']=sorted(unsafe_symbols(v))
        for n,stroke,protected in editable_nodes(v):
            key='dParts' if n.get('dParts') else 'd';parts=n.get(key,[] if key=='dParts' else '')
            parts=parts if isinstance(parts,list) else [parts]
            changed=[]
            for d in parts:
                before=count(d);r['segments_before']+=before;r['segments_after']+=before
                if stroke not in (None,'none') or protected or epsilon<.0001:
                    changed.append(d);r['skips']['stroke preserved']=r['skips'].get('stroke preserved',0)+1;continue
                try:
                    s,b,c=simplify(d,epsilon,max_area_error=a.max_area_error);changed.append(s);r['changed_paths']+=1;r['segments_after']+=c-b
                except (ValueError,AssertionError) as e:
                    changed.append(d);r['skips'][str(e)]=r['skips'].get(str(e),0)+1
            if key=='dParts':n[key]=changed
            else:n[key]=changed[0]
        r['render_checks']=[];ok=True
        with tempfile.TemporaryDirectory() as t:
            t=Path(t);o=t/'o.svg';c=t/'c.svg';o.write_bytes(svg(original));c.write_bytes(svg(v))
            for width in map(int,a.widths.split(',')):
                op=t/'o.png';cp=t/'c.png';render(o,op,width);render(c,cp,width)
                diff=image_diff(op,cp);diff['width']=width;diff['accepted']=diff['mean_channel_error']<=a.max_mean_error and diff['changed_pixel_fraction']<=a.max_changed_fraction
                ok &= diff['accepted'];r['render_checks'].append(diff)
        r['accepted']=bool(ok);r['local_epsilon']=epsilon
        if not ok:asset['vector']=original
        report['assets'].append(r)
    # Assert all non-vector gameplay data unchanged structurally.
    def stripped(obj):
        y=copy.deepcopy(obj)
        for asset in y['assets']:asset.pop('vector',None)
        return y
    report['non_vector_data_unchanged']=stripped(x)==stripped(json.loads(raw))
    assert report['non_vector_data_unchanged']
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(x,separators=(',',':'),ensure_ascii=False))
    report['original_bytes']=len(raw);report['output_bytes']=a.output.stat().st_size
    report['original_minified_bytes']=len(json.dumps(json.loads(raw),separators=(',',':'),ensure_ascii=False).encode())
    report['input_unchanged']=hashlib.sha256(a.input.read_bytes()).hexdigest()==report['input_sha256']
    a.output.with_suffix('.report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':main()
