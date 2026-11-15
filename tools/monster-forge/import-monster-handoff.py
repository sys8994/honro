"""Import the checked handoff paths and transform clips into the Monster Forge format."""
import argparse
from dataclasses import dataclass, field
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET

from svgpathtools import CubicBezier, Line, QuadraticBezier, parse_path
from svgpathtools.parser import parse_transform

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'tools/monster-forge/monster-rework-art.json'
OLDEST = ('idle', 'move', 'attack', 'hit')
CHANNELS = ('x', 'y', 'rotate', 'scaleX', 'scaleY')
NAMES = {
    'geuseundae': '그슨대', 'dokkaebibul': '도깨비불', 'eoduksini': '어둑시니',
    'sonmalmyeong': '손말명', 'gaekgwi': '객귀', 'dueoksini': '두억시니',
    'yagwanggwi': '야광귀', 'mulgwishin': '물귀신', 'geuseunsae': '그슨새', 'muyeo': '점복무녀',
    'vanguard': '봉쇄 전위', 'marksman': '지휘 사수', 'device': '강화 사물', 'pursuer': '추격체',
}
HALLMARKS = {
    'geuseundae': ('삿갓 아래 흰눈', '짚 도롱이', '부풀며 치켜드는 손'),
    'dokkaebibul': ('뼈 가면', '청록 불꽃', '아래 매달린 부적'),
    'eoduksini': ('빈 초승달 얼굴', '세 높이의 등마루', '길게 뻗는 팔'),
    'sonmalmyeong': ('겹친 흰 두건', '늘어진 회보라 수의', '황동빛 매듭'),
    'gaekgwi': ('여행 갓', '단안의 검은 얼굴', '짧은 황토 외투와 쥐는 손'),
    'dueoksini': ('넓은 갈색 등', '큰 팔 두 개', '바닥으로 내려치는 강타'),
    'yagwanggwi': ('푸른 두건', '들고 있는 약병', '굽힌 다리'),
    'mulgwishin': ('젖은 수의', '긴 두 손', '낮고 넓은 수면 파문'),
    'geuseunsae': ('부리형 두건', '날개 소매', '손에 붙든 봉인 원판'),
    'muyeo': ('부채', '번들거리는 검은 머리', '지목하는 손'),
    'vanguard': ('넓은 방책 방패', '붉은 결박', '공격 뒤 기운 방패'),
    'marksman': ('당기는 활시위', '등의 화살통', '가느다란 목제 몸'),
    'device': ('외부 회전륜', '석등의 불빛', '돌 받침'),
    'pursuer': ('낮게 접힌 다리', '긴 팔', '목덜미 띠'),
}


def xy(v):
    return [round(v.real, 2), round(v.imag, 2)]


def number(n):
    return f'{n:.2f}'.rstrip('0').rstrip('.') if abs(n) >= .005 else '0'


def coords(v):
    return ' '.join(map(number, (v.real, v.imag)))


def position(matrix, p):
    return complex(
        matrix[0, 0] * p.real + matrix[0, 1] * p.imag + matrix[0, 2],
        matrix[1, 0] * p.real + matrix[1, 1] * p.imag + matrix[1, 2],
    )


def segment_points(segment):
    if isinstance(segment, Line):
        return (), 'L'
    if isinstance(segment, QuadraticBezier):
        return (segment.control,), 'Q'
    if isinstance(segment, CubicBezier):
        return (segment.control1, segment.control2), 'C'
    raise ValueError(f'Unexpected source {type(segment)}')


def simplify(points, tolerance):
    start, end = points[0], points[-1]
    edge = end-start
    edge_length = abs(edge)**2
    def distance(v):
        t = ((v-start)*edge.conjugate()).real/edge_length if edge_length else 0
        return abs(v-start-edge*min(1, max(0, t)))
    if len(points) <= 2:
        return points
    pivot, error = max(enumerate(map(distance, points[1:-1]), 1), key=lambda p:p[1])
    if error <= tolerance:
        return [start, end]
    return simplify(points[:pivot+1], tolerance)[:-1]+simplify(points[pivot:], tolerance)


def visible_contour(sub, subpath, epsilon, size):
    segments = list(sub)
    closed = sub.isclosed()
    if epsilon:
        p = [subpath(segments[0].start)]
        for segment in segments:
            if isinstance(segment, Line):
                p.append(subpath(segment.end))
            else:
                p.extend(subpath(segment.point(i/6)) for i in range(1,7))
        if closed:
            area = abs(sum((a.conjugate()*b).imag for a,b in zip(p,p[1:])))*.5
            if max(abs(v-p[0]) for v in p) < size or area < size*size*.24:
                return '',0
        out = simplify(p,epsilon)
        if not closed or len(out) >= 4:
            end = out[1:-1] if closed else out[1:]
            path = 'M'+coords(out[0])+' L'+' '.join(map(coords,end))
            return path+('Z' if closed else ''), len(out)-int(closed)
    out = ['M'+coords(subpath(segments[0].start))]
    count = 1
    for s in segments:
        if s is segments[-1] and closed and isinstance(s, Line):
            break
        points, letter = segment_points(s)
        out.append(letter+' '.join(coords(subpath(p)) for p in (*points, s.end)))
        count += 1
    if closed:
        out.append('Z')
    return ' '.join(out), count


@dataclass
class Handoff:
    root: Path
    references: dict = field(default_factory=dict)

    def __post_init__(self):
        manifest = json.loads((self.root / 'MANIFEST.json').read_text(encoding='utf-8'))
        self.manifest = {entry['path']:entry['sha256'] for entry in manifest}

    def read(self, path):
        data = (self.root / path).read_bytes()
        checksum = hashlib.sha256(data).hexdigest()
        if checksum != self.manifest.get(path):
            raise ValueError(f'Handoff SHA mismatch for {path}')
        self.references[path] = checksum
        return data

    def json(self, path):
        return json.loads(self.read(path))


@dataclass
class Asset:
    id: str
    key: str
    palette: dict = field(default_factory=dict)
    parts: list = field(default_factory=list)
    clips: dict = field(default_factory=dict)
    anchors: int = 0
    origin: complex = 0j
    factor: float = 1
    base_height: int = 160

    def normalize(self, p):
        return (p-self.origin)*self.factor

    def part(self, id, pivot, parent='root'):
        row = {'id':id, 'parent':parent, 'pivot':xy(self.normalize(complex(*pivot))), 'paths':[]}
        self.parts.append(row)
        return row

    def color(self, value):
        if not value or value=='none':
            return None
        if not re.fullmatch('#[0-9a-fA-F]{6}', value):
            raise ValueError(f'{self.id}: unsupported color {value}')
        self.palette[value[1:]] = value
        return value[1:]

    def path(self, target, d, fill, stroke=None, width=1, matrix=None, epsilon=0, size=0, lod=0):
        if not d or fill in (None,'none') and (stroke in (None,'none') or not width):
            return
        def to_world(p):
            return self.normalize(position(matrix,p) if matrix is not None else p)
        contours = [visible_contour(sub,to_world,epsilon,size) for sub in parse_path(d).continuous_subpaths()]
        if not any(n for _, n in contours):
            return
        self.anchors += sum(n for _,n in contours)
        target['paths'].append({
            'd':' '.join(path for path,_ in contours if path),
            'fill':self.color(fill), 'stroke':self.color(stroke) if width else None,
            'width':round(self.factor*width,2), 'lod':lod,
        })

    def add_clip(self, name, duration, tracks):
        self.clips[name] = {'duration':duration,'loop':name in ('idle','move'),'tracks':[]}
        for part, channel, frames in tracks:
            if max(value for _,value in frames)==min(value for _,value in frames)==(1 if channel.startswith('scale') else 0):
                continue
            values = [[round(t,4),round(v*self.factor if channel in ('x','y') else v,4)] for t,v in frames]
            self.clips[name]['tracks'].append({'part':part,'channel':channel,'keys':values})

    def export(self):
        assert set(OLDEST)<=self.clips.keys()
        assert all(self.clips[n]['tracks'] for n in OLDEST)
        return {
            'id':self.id, 'name':NAMES[self.key], 'version':1, 'baseHeight':self.base_height,
            'viewBox':[-180, -255, 360, 280], 'palette':self.palette, 'parts':self.parts,'clips':self.clips,
            'brief':{'silhouette':HALLMARKS[self.key][0],'identity':HALLMARKS[self.key],
                     'materials':[],'reference':'혼로 신규 몬스터 10종 인계 벡터'},
            'budget':'monster-handoff', 'sourceAnchors':self.anchors,
        }


def svg_parts(handoff, filename, asset, pivots, parent_map=None, epsilon=0, size=0, semantic=(), bind_offsets=None):
    svg = ET.fromstring(handoff.read(filename))
    svg_ns = '{http://www.w3.org/2000/svg}'
    asset.part('root', xy(asset.origin), parent=None)
    rows = [node for node in svg if node.tag == svg_ns+'g']
    matrix = parse_transform('')
    if len(rows)==1 and not rows[0].get('id'):
        matrix = parse_transform(rows[0].get('transform',''))
        rows = list(rows[0])
    def paths(node, part, transform):
        if node.get('id') in semantic:
            group(node,transform)
            return
        transform = transform @ parse_transform(node.get('transform',''))
        if node.tag == svg_ns+'path':
            style = dict(c.split(':',1) for c in node.get('style','').split(';') if ':' in c)
            fill = node.get('fill',style.get('fill'))
            stroke = node.get('stroke',style.get('stroke'))
            width = float(node.get('stroke-width','1'))
            toe = asset.id=='muyeo' and part['id'] in ('left_foot','right_foot') and fill=='#e2d7c7'
            asset.path(part,node.get('d'),fill,stroke,width,matrix=transform,
                       epsilon=min(epsilon,1.2) if toe else epsilon,size=min(size,2.7) if toe else size)
        for child in node:
            paths(child,part,transform)
    def group(part, transform):
        identifier = part.get('id')
        pivot = pivots.get(identifier,xy(asset.origin))
        name = 'head' if identifier=='hood' else identifier
        target = asset.part(name,pivot,(parent_map or {}).get(identifier,'root'))
        offset = (bind_offsets or {}).get(identifier,'')
        internal = transform @ parse_transform(offset) @ parse_transform(part.get('transform',''))
        for child in part:
            paths(child,target,internal)
        return target
    target = asset.parts[0]
    for part in rows:
        if part.tag == svg_ns+'g':
            target = group(part,matrix)
        elif part.tag == svg_ns+'path':
            paths(part,target,matrix)
    return asset


def animated_parts(asset, name, duration, samples):
    tracks = []
    for part in asset.parts:
        key = part['id']
        for i,c in enumerate(CHANNELS):
            default = 1 if c.startswith('scale') else 0
            frames = [(t,values.get(key,(0,0,0,1,1))[i]) for t,values in samples]
            condensed = [frames[0]]+[frames[i] for i in range(1,len(frames)-1)
                         if len({frames[j][1] for j in (i-1,i,i+1)})>1]+[frames[-1]]
            if any(abs(v-default)>.0001 for _,v in condensed):
                tracks.append((key,c,condensed))
    asset.add_clip(name,duration,tracks)


def transforms(text, pivot):
    matrix = parse_transform(text)
    x,y = pivot
    sx = math.hypot(matrix[0,0],matrix[1,0])
    sy = math.hypot(matrix[0,1],matrix[1,1])
    theta = math.degrees(math.atan2(matrix[1,0],matrix[0,0]))
    result = position(matrix,complex(x,y))-complex(x,y)
    return result.real,result.imag,theta,sx,sy


def simple_clip(asset, clip, duration, keyed):
    tracks = [(part,c,frames) for part, channels in keyed.items() for c,frames in channels.items()]
    asset.add_clip(clip,duration,tracks)


def rotation(keys):
    return {'rotate':keys}


def keyframes(*pairs):
    return [(0,0),*pairs,(1,0)]


def geuseundae(source, epsilon, cutoff):
    base = 'monsters/geuseundae/geuseundae.'
    rig = source.json(base+'rig.json')
    asset = Asset('geuseundae','geuseundae',base_height=rig['baseHeight'])
    for part in rig['parts']:
        row = asset.part(part['id'],part['pivot'],part['parent'])
        for path in part['paths']:
            eye = part['id']=='head' and path['fill']=='#fdfdfd'
            asset.path(row,path['d'],path['fill'],epsilon=min(epsilon,0.8) if eye else epsilon,
                       size=min(cutoff,1.4) if eye else cutoff)
    for name, clip in source.json(base+'animation.json').items():
        tracks = [(t['part'],t['channel'],t['keys']) for t in clip['tracks']]
        asset.add_clip(name,clip['duration'],tracks)
    return asset


def muyeo(source, epsilon, cutoff):
    base = 'monsters/muyeo/'
    rig = source.json(base+'rig.json')
    pivots = {name:spec['pivot'] for name,spec in rig['parts'].items()}
    asset = svg_parts(source,base+'parts-optimized.svg',
        Asset('muyeo','muyeo',origin=complex(606,1251),factor=160/1245),pivots,
        epsilon=epsilon,size=cutoff)
    for name, clip in source.json(base+'clips.json').items():
        asset.add_clip(name,clip['duration'],[(part,'rotate',keys) for part,keys in clip['keys'].items()])
    return asset


def eoduksini(source):
    rig = source.json('monsters/eoduksini/rig-motion.json')
    for number, height in enumerate((.70,.84,1),1):
        spec = rig['stages'][str(number)]
        asset = Asset('eoduksini' if number==1 else f'eoduksini{number}','eoduksini',factor=160/623,
            origin=complex(*rig['coordinateContract']['normalizedOrigin']))
        compress = lambda point:(point[0],642+(point[1]-642)*height)
        asset.part('root',(270,642),parent=None)
        matrix = parse_transform(f'translate(0 {642*(1-height)}) scale(1 {height})')
        last = None
        for path in spec:
            joint = path['parent']
            if joint != last:
                if any(p['id']==joint for p in asset.parts):
                    raise ValueError('Non-contiguous eoduksini joint '+joint)
                row = asset.part(joint,compress(rig['parts'][joint]['pivot']))
                last = joint
            asset.path(row,path['path'],path['fill'],matrix=matrix)
        for name, clip in rig['clips'].items():
            asset.add_clip(name,clip['duration'],[(part,'rotate',keys) for part,keys in clip['tracks'].items()
                if any(p['id']==part for p in asset.parts)])
        yield asset


def act3(source, name, origin, height):
    folder = 'monsters/act3/'
    rig = source.json(folder+name+'-rig.json')['pivots']
    asset = svg_parts(source,folder+name+'.svg',
        Asset(name,name,origin=origin,factor=160/height),rig)
    data = source.json(folder+name+'-animation.json')['clips']
    for clip, spec in data.items():
        frames = spec['frames']
        samples = []
        for framespec in frames:
            tree = ET.fromstring('<root>'+framespec['svgGroups']+'</root>')
            vals = {}
            for group in tree.iter('g'):
                alias = group.get('id')
                key = 'head' if alias=='hood' else alias or 'root'
                if not alias or alias in rig:
                    pivot = rig.get(alias,xy(origin))
                    vals[key] = transforms(group.get('transform',''),pivot)
            samples.append((framespec['time']/spec['duration'], vals))
        last = samples[0][1] if clip in ('idle','move') else samples[-1][1]
        if samples[-1][0]<1:
            samples.append((1,last))
        animated_parts(asset,clip,spec['duration'],samples)
    if name=='yagwanggwi':
        # Keep the bottle and grip locked to the far arm. The other hand
        # reaches on the strike and coils back into the escape pose.
        far = rotation(keyframes((.35,-8),(.55,-9),(.82,6)))
        simple_clip(asset,'attack',.8,{
            'fararm':far,'vial':far,'grip':far,
            'neararm':rotation(keyframes((.35,10),(.55,-28),(.82,13))),
            'head':rotation(keyframes((.35,6),(.57,-7),(.82,9))),
        })
    return asset


def act4(source, name, ground, height):
    folder = 'monsters/act4/'
    parts = source.json(folder+name+'.rig.json')['parts']
    pivots = {p['id']:p['pivot'] for p in parts}
    asset = svg_parts(source,folder+name+'.svg',
        Asset(name,name,origin=complex(110,ground),factor=160/height),pivots)
    for clip, spec in source.json(folder+name+'.animation.json')['clips'].items():
        samples = []
        for row in spec['samples']:
            vals = {k:transforms(v,(pivots[k][0]-5,pivots[k][1]+310)) for k,v in row['partTransforms'].items()}
            samples.append((row['t'],vals))
        animated_parts(asset,clip,spec['durationSeconds'],samples)
    return asset


def lanterns(source, name, origin):
    folder = 'monsters/dokkaebibul-sonmalmyeong/'
    parts = source.json(folder+'preview-rig.json')[name]['parts']
    pivots = {key:(row['pivot'][0],row['pivot'][1]-310) for key,row in parts.items()}
    if name=='sonmalmyeong':
        # The knot needs its own shape and amber stitching distinguishable from Sodam's red ward.
        special = {'near-arm':rotation(keyframes((.35,-12),(.53,9))),
                   'knot':{'rotate':keyframes((.34,12),(.6,-5)),'x':keyframes((.34,13),(.62,4)),'y':keyframes((.34,-9))}}
        idle = {'root':{'y':keyframes((.25,3),(.75,-3))},'head':rotation(keyframes((.25,1.5),(.75,-1.5)))}
        move = {'root':{'y':keyframes((.25,-8),(.75,2))},'knot':rotation(keyframes((.22,-9),(.75,7)))}
        hit = {'root':{'x':keyframes((.22,-9))},'head':rotation(keyframes((.22,-12)))}
        attack = special
        special_name = 'transfer'
    else:
        idle = {'root':{'y':keyframes((.25,5),(.75,-5))},'ember':rotation(keyframes((.25,4),(.75,-4)))}
        move = {'root':{'y':keyframes((.25,-10),(.75,5))},'seal':rotation(keyframes((.22,-9),(.75,11)))}
        hit = {'root':{'x':keyframes((.22,-9))},'seal':rotation(keyframes((.22,-18)))}
        attack = {'root':{'rotate':keyframes((.34,-4),(.56,9)),'x':keyframes((.34,-5),(.56,11))},
                  'seal':rotation(keyframes((.34,19),(.61,-8)))}
        special = {'ember':rotation(keyframes((.35,-16),(.57,12))),
                   'seal':{'x':keyframes((.40,-18),(.60,8)),'rotate':keyframes((.4,26),(.6,-12))}}
        special_name = 'fusion'
    parent_map = {key:row['parent'] or 'root' for key,row in parts.items()}
    if name=='sonmalmyeong':
        parent_map['hood']='cloth'
    asset = svg_parts(source,folder+name+'.svg',Asset(name,name,origin=origin,factor=160/290),
                      pivots,parent_map,semantic=set(pivots))
    if name=='sonmalmyeong':
        for path in next(p for p in asset.parts if p['id']=='knot')['paths']:
            color = path['fill']
            if color and asset.palette[color].startswith(('#9', '#a', '#b', '#c')):
                path['fill'] = asset.color('#af905e')
    for name, span, keys in [('idle',1.8,idle),('move',.8,move),('hit',.35,hit),('attack',1,attack),
                             (special_name,1.3,special)]:
        simple_clip(asset,name,span,keys)
    return asset


MIDBOSS = {
    'vanguard':(complex(92, -12),208,{'body':(92,-19),'back-binding':(90,-129),'shield':(110,-90),'front-arm':(110,-90)}),
    'marksman':(complex(95, -12),225,{'head':(96,-188),'legs':(97,-86),'quiver':(89,-94),'bow-arm':(105,-159),
                                         'bow':(168,-116),'draw-arm':(85,-161),'cord':(100,-117)}),
    'device':(complex(120, -12),219,{'wheel':(182,-86),'spindle':(128,-118),'cap':(114,-204)}),
    'pursuer':(complex(118, -10),153,{'head':(130,-146),'hind-leg':(95,-69),'far-arm':(140,-107),
                                       'near-arm':(129,-112),'cloak':(125,-50),'seal':(126,-119)}),
}


def midboss(source, name):
    ground, height, pivots = MIDBOSS[name]
    asset = svg_parts(source,'midboss-archetypes/'+name+'.svg',
        Asset(name,name,origin=ground,factor=160/height),pivots,
        parent_map={'bow':'bow-arm'} if name=='marksman' else None,
        bind_offsets={'bow':'translate(-25 0)'} if name=='marksman' else None)
    if name=='marksman':
        bow = next(p for p in asset.parts if p['id']=='bow')
        previous_string = bow['paths'].pop()
        asset.anchors -= 3
        asset.path(bow,'M151 -233 L128 -125 142 -75',None, asset.palette[previous_string['stroke']],1.3)
    unit = {
        'vanguard':('shield','front-arm','back-binding'),
        'marksman':('draw-arm','bow-arm','cord'),
        'device':('wheel','spindle','cap'),
        'pursuer':('near-arm','hind-leg','seal'),
    }[name]
    aim, active, trim = unit
    simple_clip(asset,'idle',2.4,{trim:rotation(keyframes((.23,2.2),(.75,-1.6)))})
    simple_clip(asset,'hit',.4,{aim:rotation(keyframes((.24,-11))),trim:rotation(keyframes((.33,8)))})
    if name=='device':
        simple_clip(asset,'move',.9,{'wheel':rotation([(0,0),(.5,90),(1,180)])})
        simple_clip(asset,'attack',1.2,{'wheel':rotation(keyframes((.36,60),(.55,86),(.83,156))),
            'spindle':{'x':keyframes((.30,-7),(.56,15))},'cap':rotation(keyframes((.35,-7),(.6,9)))})
    elif name=='marksman':
        simple_clip(asset,'move',.85,{'legs':rotation(keyframes((.25,-8),(.75,8))),'quiver':rotation(keyframes((.25,5),(.75,-4)))})
        simple_clip(asset,'attack',1.05,{'draw-arm':rotation(keyframes((.32,-14),(.49,-20),(.61,5))),
            'bow':rotation(keyframes((.38,-4),(.63,8))),'cord':{'x':keyframes((.38,-9),(.61,5))}})
    elif name=='pursuer':
        simple_clip(asset,'move',.7,{'hind-leg':rotation(keyframes((.25,12),(.75,-11))),
            'near-arm':rotation(keyframes((.25,-7),(.75,9)))})
        simple_clip(asset,'attack',.92,{'near-arm':rotation(keyframes((.33,-28),(.56,11),(.79,18))),
            'hind-leg':rotation(keyframes((.33,19),(.58,-17))), 'head':rotation(keyframes((.35,-10),(.63,12)))})
    else:
        simple_clip(asset,'move',.97,{'shield':rotation(keyframes((.24,-5),(.76,5))),
            'back-binding':rotation(keyframes((.24,4),(.76,-6)))})
        simple_clip(asset,'attack',1.15,{aim:rotation(keyframes((.37,-15),(.56,-17),(.83,24))),
            active:rotation(keyframes((.37,-9),(.57,-8),(.83,21))),
            'back-binding':rotation(keyframes((.33,9),(.8,-9)))})
    return asset


def setup():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('handoff',type=Path,help='The unpacked HONRO_NEW_MONSTERS_10_HANDOFF directory')
    args = parser.parse_args()
    source = Handoff(args.handoff)
    def optimized(importer, steps):
        original = importer(source,0,0)
        for tolerance, cutoff in steps:
            result = importer(source,tolerance,cutoff)
            if result.anchors<=350:
                break
        return result, original.anchors
    geu, raw_geu = optimized(geuseundae,[(3,12),(3.8,14),(4.2,18)])
    seer, raw_seer = optimized(muyeo,[(2,9),(3,12),(3.8,14),(4.2,17)])
    queue = [
        geu,seer,*eoduksini(source),lanterns(source,'dokkaebibul',complex(104,-35)),
        lanterns(source,'sonmalmyeong',complex(112,-14)),
        act3(source,'gaekgwi',complex(111,231),174),
        act3(source,'dueoksini',complex(134,242),222),
        act3(source,'yagwanggwi',complex(103,250),204),
        act4(source,'mulgwishin',-10,277),
        act4(source,'geuseunsae',-11,285),
        *(midboss(source,name) for name in MIDBOSS),
    ]
    scales = {'geuseundae':raw_geu,'muyeo':raw_seer}
    assets = []
    for asset in queue:
        row = asset.export()
        if asset.id in scales:
            row['sourceAnchors'] = scales[asset.id]
        row['optimization'] = {'anchors':asset.anchors}
        assets.append(row)
    OUT.write_text(json.dumps({'version':1,'sourceFiles':source.references,'assets':assets},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
    for asset in assets:
        print(asset['id'],asset['optimization']['anchors'],asset['sourceAnchors'],len(asset['parts']))


if __name__=='__main__':
    setup()
