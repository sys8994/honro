#!/usr/bin/env python3
"""Conservative SVG -> HONRO vector v1 compiler. No artwork generation."""
import argparse
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path as File
from svgpathtools import parse_path, CONVERSIONS, Line
from svgpathtools.parser import parse_transform

LIMIT = 60000
NUMBER = r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
INHERITED = {'fill', 'stroke', 'fill-rule', 'fill-opacity', 'stroke-opacity', 'stroke-width', 'stroke-linejoin', 'stroke-linecap', 'stroke-miterlimit', 'visibility', 'color'}
SUPPORTED = INHERITED | {'opacity', 'display'}

def fail(message):
    raise ValueError(message)

def number(value):
    value = float(value)
    if not math.isfinite(value): fail('Non-finite number')
    return value

def compact(d):
    # Lossless syntax minification after numeric normalization: omit repeated
    # commands (never moveto/close), commas and redundant leading zeros/spaces.
    point=None; start=None; pieces=[]
    for match in re.finditer(r'([MLCSQTAZ])([^MLCSQTAZ]*)',d):
        command,args=match.groups(); values=re.findall(NUMBER,args)
        if command=='Z': point=start; pieces.append('Z'); continue
        end=(float(values[-2]),float(values[-1])) if len(values)>=2 else None
        if command=='L' and point is not None:
            if end[1]==point[1]: command='H';args=values[-2]
            elif end[0]==point[0]: command='V';args=values[-1]
        if command=='M': start=end
        point=end;pieces.append(command+args)
    d=' '.join(pieces)
    tokens=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+NUMBER,d)
    out=[]; previous_command=None; previous_number=False
    for token in tokens:
        if len(token)==1 and token.isalpha():
            if token not in 'MmZz' and token==previous_command: continue
            out.append(token); previous_command=token; previous_number=False
        else:
            token=format(float(token),'.15g')
            token=re.sub(r'^(-?)0\.',r'\1.',token)
            if previous_number and not token.startswith(('-', '+')): out.append(' ')
            out.append(token); previous_number=True
    return ''.join(out)

def contours(d):
    """Parse each moveto with previous current position, retaining explicit close."""
    pos = 0j
    for part in re.findall(r'[Mm][^Mm]*', d):
        p = parse_path(part, current_pos=pos)
        if not p: continue
        closed = bool(re.search(r'[zZ]\s*$', part))
        pos = p[-1].end
        implicit_close = closed and isinstance(p[-1],Line)
        text = compact(p.d(useSandT=True,use_closed_attrib=implicit_close))
        if closed and not implicit_close: text += 'Z'
        yield text, p.bbox()

def split_path(d, label, can_split=True):
    if d.strip() and (not re.match(r'^\s*[Mm]',d) or re.search(r'[^mMzZlLhHvVcCsSqQtTaA0-9.eE+\-,\s]',d)): fail(f'{label}: invalid SVG path syntax')
    parts = list(contours(d))
    normalized = ' '.join(p[0] for p in parts)
    if len(normalized) <= LIMIT: return [normalized] if normalized else []
    if not can_split: fail(f'{label}: normalized path is {len(normalized)} characters; splitting stroked/translucent paths is disabled. Simplify in Inkscape or author separate objects.')
    # Bounding-box connectivity is deliberately conservative: nested holes and
    # all potentially overlapping contours remain in the same draw operation.
    parents = list(range(len(parts)))
    def root(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]; i = parents[i]
        return i
    active = []
    for i in sorted(range(len(parts)), key=lambda j: parts[j][1][0]):
        a = parts[i][1]
        active = [j for j in active if parts[j][1][1] >= a[0]]
        for j in active:
            b = parts[j][1]
            if a[2] <= b[3] and b[2] <= a[3]: parents[root(i)] = root(j)
        active.append(i)
    groups = {}
    for i, (text, _) in enumerate(parts): groups.setdefault(root(i), []).append(text)
    chunks, current = [], ''
    for group in groups.values():
        text = ' '.join(group)
        if len(text) > LIMIT:
            fail(f'{label}: inseparable contour/hole component is {len(text)} characters ({len(group)} contours), limit {LIMIT}. In Inkscape simplify this component with silhouette/hole protection or divide into separately authored non-overlapping objects; do not blindly break apart holes.')
        if current and len(current) + 1 + len(text) > LIMIT: chunks.append(current); current = ''
        current += (' ' if current else '') + text
    if current: chunks.append(current)
    return chunks

def paint(value, alpha):
    if not 0 <= alpha <= 1: fail('Paint opacity out of range')
    value = value.strip().lower()
    if value == 'none': return value
    colors = {'black':'#000000', 'white':'#ffffff', 'red':'#ff0000', 'green':'#008000', 'blue':'#0000ff', 'transparent':'#00000000'}
    value = colors.get(value, value)
    if re.fullmatch(r'#[0-9a-f]{3,4}', value): value = '#' + ''.join(c*2 for c in value[1:])
    if not re.fullmatch(r'#[0-9a-f]{6}(?:[0-9a-f]{2})?', value): fail(f'Unsupported paint {value!r}; flatten gradients/patterns to authored solid paths in Inkscape')
    a = (int(value[7:], 16)/255 if len(value)==9 else 1)*alpha
    return value[:7] + (f'{round(a*255):02x}' if a < 1 else '')

def matrix(text):
    # svgpathtools parses SVG transform order, including rotation pivots/skew.
    rest = re.sub(r'(?:matrix|translate|scale|rotate|skewX|skewY)\s*\([^()]*\)', '', text)
    if rest.strip(' ,\t\r\n'): fail(f'Unsupported transform {text!r}')
    m = parse_transform(text)
    values = [float(m[0,0]),float(m[1,0]),float(m[0,1]),float(m[1,1]),float(m[0,2]),float(m[1,2])]
    if not all(math.isfinite(v) for v in values): fail('Invalid transform')
    return values

def compile_svg(source, config, remove_images=False):
    svg = ET.fromstring(source)
    if svg.tag.split('}')[-1] != 'svg': fail('Expected SVG root')
    vb = [number(x) for x in re.split(r'[ ,]+', svg.get('viewBox','').strip()) if x]
    if len(vb)!=4 or vb[2]<=0 or vb[3]<=0: fail('Explicit valid source viewBox required')
    for field in ['id','bounds','anchor','foot','semanticLayer']:
        if field not in config: fail(f'Config requires explicit {field}')
    for field, keys in [('bounds',('x','y','w','h')),('anchor',('x','y')),('foot',('x','y'))]:
        if any(k not in config[field] or not math.isfinite(config[field][k]) for k in keys): fail(f'Invalid {field}')
    if config['bounds']['w']<=0 or config['bounds']['h']<=0: fail('Invalid positive bounds')
    for field in ('scaleRange','backgroundRange'):
        value=config.get(field,[1,1])
        if not isinstance(value,list) or len(value)!=2 or not all(isinstance(v,(int,float)) and math.isfinite(v) for v in value) or not 0<value[0]<=value[1]: fail(f'Invalid {field}')
    physical=config.get('scaleRange',[1,1]);background=config.get('backgroundRange',[1,1])
    if background[0]<physical[0] or background[1]>physical[1]: fail('backgroundRange must lie within scaleRange')
    removed = [el.get('id','image') for el in svg.iter() if el.tag.split('}')[-1]=='image']
    if removed and not remove_images: fail(f'{removed[0]}: raster image forbidden; use --remove-reference-images explicitly')
    def walk(el, inherited, is_root=False):
        tag = el.tag.split('}')[-1]; label = el.get('id',tag)
        if tag in ('metadata','title','desc','namedview'): return []
        if tag == 'image':
            if not remove_images: fail(f'{label}: raster image forbidden; use --remove-reference-images explicitly')
            return []
        if tag == 'defs':
            if len(el): fail('Non-empty defs unsupported; resolve clips/use/gradients in Inkscape before import')
            return []
        if tag not in {'svg','g',*CONVERSIONS}: fail(f'{label}: unsupported element {tag}')
        if tag == 'svg' and not is_root: fail('Nested SVG viewport unsupported; ungroup/normalize in Inkscape')
        local = {k:v for k,v in el.attrib.items() if k in SUPPORTED}
        for entry in el.get('style','').split(';'):
            if not entry.strip(): continue
            key, value = entry.split(':',1); key=key.strip(); value=value.strip()
            if key not in SUPPORTED:
                # Inkscape emits these non-rendering editor hints.
                if key in ('paint-order','vector-effect') and value=='normal': continue
                fail(f'{label}: unsupported style {key}={value}')
            local[key]=value
        for attr in ('clip-path','mask','filter','stroke-dasharray','stroke-dashoffset','vector-effect','href','marker-start','marker-mid','marker-end','mix-blend-mode'):
            if attr in el.attrib: fail(f'{label}: unsupported {attr}; normalize in Inkscape')
        style = {**inherited, **local}
        if style.get('display')=='none': return []
        opacity = number(local.get('opacity',1))
        if not 0 <= opacity <= 1: fail(f'{label}: opacity out of range')
        trans = {'transform':matrix(el.get('transform'))} if el.get('transform') else {}
        if tag in ('svg','g'):
            if opacity != 1: fail(f'{label}: group opacity requires isolated compositing; flatten in Inkscape')
            child_style={k:v for k,v in style.items() if k in INHERITED}
            children=[n for child in el for n in walk(child,child_style)]
            return [{'tag':'g', **trans, 'children':children}] if children else []
        if style.get('visibility') in ('hidden','collapse'): return []
        fill=paint(style.get('fill','#000000'),number(style.get('fill-opacity',1)))
        stroke=paint(style.get('stroke','none'),number(style.get('stroke-opacity',1)))
        if style.get('fill-rule','nonzero') not in ('nonzero','evenodd'): fail(f'{label}: invalid fill rule')
        width=number(style.get('stroke-width',1))
        if width < 0 or width > 100: fail(f'{label}: stroke width exceeds runtime budget')
        if stroke!='none' and number(style.get('stroke-miterlimit',4))!=4: fail(f'{label}: runtime miter limit fixed at 4; stroke-to-path in Inkscape')
        if style.get('stroke-linejoin','miter') not in ('miter','round','bevel') or style.get('stroke-linecap','butt') not in ('butt','round','square'): fail(f'{label}: unsupported stroke join/cap')
        attrs=dict(el.attrib)
        if tag=='rect':
            w=number(attrs.get('width',0)); h=number(attrs.get('height',0))
            if w<=0 or h<=0: return []
            if 'rx' in attrs or 'ry' in attrs:
                rx=number(attrs.get('rx',attrs.get('ry',0))); ry=number(attrs.get('ry',attrs.get('rx',0)))
                if rx<0 or ry<0: fail(f'{label}: negative corner radius')
                if not rx or not ry: attrs.pop('rx',None); attrs.pop('ry',None)
                else: attrs['rx']=str(min(rx,w/2)); attrs['ry']=str(min(ry,h/2))
        d=CONVERSIONS[tag](attrs)
        paths=split_path(d,label,stroke=='none' and opacity==1 and len(fill)!=9)
        return [{'tag':'path','d':d,**trans,'fill':fill,'stroke':stroke,'opacity':opacity,'fillRule':style.get('fill-rule','nonzero'),'lineWidth':width,'lineJoin':style.get('stroke-linejoin','miter'),'lineCap':style.get('stroke-linecap','butt')} for d in paths]
    nodes=walk(svg,{},True)
    root={'tag':'g','children':nodes}
    if 'transform' in config:
        if len(config['transform'])!=6 or not all(math.isfinite(v) for v in config['transform']): fail('Config transform must be six finite SVG affine values')
        root['transform']=config['transform']
    clips={}
    if 'bodyClip' in config:
        if config['semanticLayer']!='BODY': fail('bodyClip permitted only for a separate BODY asset, never REAR/SURFACE/FORE')
        clip=config['bodyClip']
        if not isinstance(clip,list) or not 1<=len(clip)<=32: fail('bodyClip must contain 1..32 authored collision paths in output coordinates')
        clips['authoredBody']=[d for raw in clip for d in split_path(raw,'bodyClip',False)]
        if len(clips['authoredBody'])>32: fail('Clip path count exceeds 32')
        root={'tag':'g','clipPath':'authoredBody','children':[root]}
    def count(n): return 1+sum(count(c) for c in n.get('children',[]))
    total=count(root)
    if total>512: fail(f'Normalized tree has {total} nodes; limit 512. Author smaller semantic assets; do not raise runtime budget.')
    b=config['bounds']
    vector={'version':1,'viewBox':[b['x'],b['y'],b['w'],b['h']],'root':root}
    if clips: vector['clips']=clips
    asset={'id':config['id'],'name':config.get('name',config['id']),'category':config.get('category','prop'),'visual':[],'collision':[],'sockets':config.get('sockets',[]),'anchor':config['anchor'],'bounds':b,'reference':{'bounds':b,'foot':config['foot'],'heightM':b['h']/60,'scaleRange':physical,'backgroundRange':background},'params':{'semanticLayer':config['semanticLayer'],'sourceViewBox':vb,'removedReferenceImages':removed,'nodeCount':total,**config.get('params',{})},'vector':vector}
    return asset

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('svg'); p.add_argument('--config',required=True); p.add_argument('--output',required=True); p.add_argument('--remove-reference-images',action='store_true')
    args=p.parse_args()
    try:
        asset=compile_svg(File(args.svg).read_text(),json.loads(File(args.config).read_text()),args.remove_reference_images)
        File(args.output).write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':'))+'\n')
        print(json.dumps({'output':args.output,'nodes':asset['params']['nodeCount'],'removedImages':asset['params']['removedReferenceImages']}))
    except (ValueError,KeyError,AssertionError) as exc:
        print(f'Import rejected: {exc}',file=sys.stderr); return 2
    return 0

if __name__=='__main__': sys.exit(main())
