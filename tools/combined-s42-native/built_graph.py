"""Prove newly built source→served DAG before going to Chromium. No wild-card exemptions."""
from pathlib import Path
from argparse import ArgumentParser
from prepare import require,blob
import hashlib,json,posixpath,re
HERE=Path(__file__).resolve().parent
ADDR=re.compile(r'^(web/[A-Za-z0-9_.\-/]+)\.([a-f0-9]{16})\.([A-Za-z0-9]+)$')
TOKENS=re.compile(r'["\x27]((?:web/|\.\./runtime/|\./)[A-Za-z0-9_.\-/]+\.[a-f0-9]{16}\.[A-Za-z0-9]+)["\x27]')
KINDS={'entry':r'web/entries/game\.[0-9a-f]{16}\.js','manifest':r'web/data/campaign\.[0-9a-f]{16}\.json','loader':r'web/runtime/campaign\.[0-9a-f]{16}\.js','packet':r'web/data/chapter-42-assets\.[0-9a-f]{16}\.json'}
HUNK=json.loads((HERE/'STAGE42-BOUNDS-HUNK.json').read_text())
PINS=json.loads((HERE/'PINS.json').read_text())
S42=(HERE/'original-stage42-config.json').read_bytes()
sha=lambda b:hashlib.sha256(b).hexdigest()
require(sha(S42)=='91428c9b5061ad5ec8c9ff730bd3a502fc5ffeb500d3c41d5d273a0ce24457d3','frozen Stage42 config')
S42=json.loads(S42)
def one(seq,*why):
    seq=list(seq);require(len(seq)==1,*why,seq[:10]);return seq[0]
def json_exact(raw):
    def unique(pairs):
        d={}
        for k,v in pairs:require(k not in d,'duplicate JSON key',k);d[k]=v
        return d
    return json.loads(raw,object_pairs_hook=unique)
# Only the three actual missing response paths, independently approved in 44742313752.
# Neither a web/fonts/ wildcard nor a manifest-only entry is an authority.
FONT_SHEET='web/styles/game-src-fonts.43855b81e6a81ba4.css'
FONT_STYLE={'sha256':'43855b81e6a81ba459f0455482a6e5e017202d7605d89cd94f0c22e7506b857d','bytes':111673}
FONT_REFS=re.compile(r'\burl\("(\.\./fonts/[a-z0-9-]+\.[a-f0-9]{16}\.woff2)"\)')
FONT_ASSETS={
  'web/fonts/kr-0000.727adcd3562716eb.woff2':{'sha256':'727adcd3562716eb09bcdd09a54f4e2293ea38a5671964a0b6f11cb62431b81c','bytes':80444},
  'web/fonts/hangul-common.f5cbeca6796a2f88.woff2':{'sha256':'f5cbeca6796a2f886e73f49951955619445e7554b062bd25308253d841de82c8','bytes':549740},
  'web/fonts/kr-0020.1a9188e575bacb1f.woff2':{'sha256':'1a9188e575bacb1fe946e71bcf3434d8baa94e4d133f10c78c96496e986db41a','bytes':9060}}
def font_refs(sheet,css):
    uncommented=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    refs=FONT_REFS.findall(uncommented)
    require(len(refs)==len(re.findall(r'\burl\s*\(',uncommented,flags=re.I))==len(set(refs))==206,'unexpected generated font CSS grammar or coverage')
    return {posixpath.normpath(posixpath.join(posixpath.dirname(sheet),r)) for r in refs}
def add_font_authority(seen,data,audit,mode):
    require(seen.get(FONT_SHEET)==FONT_STYLE,mode,'known font stylesheet must be in the active bootstrap graph')
    css=data(FONT_SHEET);require({'sha256':sha(css),'bytes':len(css)}==FONT_STYLE,mode,'active font CSS bytes')
    refs=font_refs(FONT_SHEET,css.decode('utf8'))
    require(set(FONT_ASSETS)<=refs,mode,'missing actual font CSS URLs')
    m=json_exact(data('web/manifest.json'))
    require(m['styles'].count(FONT_SHEET)==1,mode,'not a current production style')
    checked={}
    for p,want in {FONT_SHEET:FONT_STYLE,**FONT_ASSETS}.items():
        row=one((x for x in m['files'] if x['path']==p),mode,'production file identity',p)
        require(row=={'path':p,**want},mode,'generated manifest font/stylesheet digest',p)
        audit(p)
        require(seen[p]==want,mode,'actual served font file hash',p)
        if p!=FONT_SHEET:checked[p]={'ownerCSS':FONT_SHEET,**want}
    return checked

def inspect(root,mode,pins,compiled):
    root=root.resolve();seen={}
    def data(path):
        f=(root/path).resolve()
        require(f.is_relative_to(root),mode,path,'outside graph root')
        return f.read_bytes()
    def audit(path):
        if path.startswith(('./','../runtime/')):path='web/runtime/'+path.rsplit('/',1)[-1]
        if path in seen:return
        m=ADDR.fullmatch(path);require(m,mode,path,'unaddressed graph entry')
        b=data(path);h=sha(b)
        require(h[:16]==m[2],mode,path,h,'unverified address')
        seen[path]={'sha256':h,'bytes':len(b)}
        def walk(obj):
            if isinstance(obj,str) and ADDR.fullmatch(obj):audit(obj)
            elif isinstance(obj,list):
                for x in obj:walk(x)
            elif isinstance(obj,dict):
                for x in obj.values():walk(x)
        if path.endswith('.js'):
            text=b.decode()
            for x in TOKENS.findall(text):audit(x)
        if path.endswith('.json'):
            obj=json_exact(b);walk(obj)
            if isinstance(obj,dict) and '$honroJsonParts' in obj:
                parts=[]
                for x in obj['parts']:
                    a=seen[x['path']];require((a['bytes'],a['sha256'])==(x['bytes'],x['sha256']),mode,x['path'])
                    parts.append(data(x['path']))
                j=b''.join(parts);require((len(j),sha(j))==(obj['bytes'],obj['sha256']),mode,path)
                walk(json_exact(j))
    html=data('HONRO.html')
    entry=one(re.findall(KINDS['entry'],html.decode()),mode,'true game entry');audit(entry)
    font_authority=add_font_authority(seen,data,audit,mode)
    roles={kind:one([p for p in seen if re.fullmatch(regex,p)],mode,kind) for kind,regex in KINDS.items()}
    require(roles['entry']==entry,mode,'incorrect entry')
    M=json_exact(data(roles['manifest']))
    for key in ('stageLibraries','stages','catalog'):require(len(M[key])==50,mode,key)
    require(M['stageLibraries'][41]==roles['packet'] and M['stageLibraries'].count(roles['packet'])==1,mode,'stage42 packet not unique')
    require([(x['id'],x['metadata']['stageId']) for x in M['catalog']]==[(f'stage-{i}',i) for i in range(1,51)],mode,'actual catalog order')
    require(len(re.findall(rb'\bloadCampaign\("'+re.escape(roles['manifest'].encode())+rb'",',data(roles['loader'])))==1,mode,'manifest provider reference')
    ordered=compiled['sourceModules']
    renderer='shared/runtime/renderer.js';edge='shared/runtime/act5-edge-art.js'
    require(compiled['entry']==entry,mode,'compiled proof entry')
    require(set(ordered)=={renderer,edge} and ordered[renderer]==compiled['chunks'][0]['path'] and ordered[edge]==compiled['chunks'][3]['path'],mode,'compiled role map')
    require([x['number'] for x in compiled['chunks']]==[15,16,17,18],mode,'ordered chunk proof')
    for c in compiled['chunks']:
        require(c['path'] in seen and seen[c['path']]=={'bytes':c['bytes'],'sha256':c['sha256']},mode,'compiled proof bytes not reachable',c['path'])
    for name,id in ((renderer,pins['renderer']),(edge,HUNK['master'] if mode=='A' else HUNK['expectedDerived'])):
        b=data(name)
        require(blob(b)==id and compiled['source'][name]=={'blob':id,'sha256':sha(b)},mode,'source proof pin',name)
    if mode != 'A':
        h=S42['digest']['stock' if mode=='B' else 'target'];p=roles['packet']
        require(seen[p]=={'sha256':h['packetSHA256'],'bytes':h['packetB']},mode,
                'archived Stage42 entire asset packet does not match; do not borrow unrelated review dependencies',seen[p])
    return {'htmlSHA256':sha(html),'roles':roles,'sourceModules':ordered,'fontAuthority':font_authority,'leaves':{str(i+1):{'stage':p,'assets':M['stageLibraries'][i]} for i,p in enumerate(M['stages'])},'all':seen},data
def replace(raw,old,new,label,count=1):
    old,new=old.encode(),new.encode()
    require(raw.count(old)==count,label,'expected reference multiplicity',count,raw.count(old))
    return raw.replace(old,new)
def compare(label,u,v):
    x,dx=u;y,dy=v
    xrole=x['roles'];yrole=y['roles']
    require(xrole['packet']!=yrole['packet'],label,'missing expected asset change')
    edge='shared/runtime/act5-edge-art.js'
    edge1=x['sourceModules'][edge];edge2=y['sourceModules'][edge]
    dropx=set(xrole.values());dropy=set(yrole.values())
    entry=dx(xrole['entry'])
    if label=='AB':
        require(edge1!=edge2,label,'source did not propagate')
        dropx.add(edge1);dropy.add(edge2)
        entry=replace(entry,edge1.rsplit('/',1)[-1],edge2.rsplit('/',1)[-1],'entry edge module')
    else:require(edge1==edge2,label,'common runtime changed with only optimization')
    require({k:v for k,v in x['all'].items() if k not in dropx}=={k:v for k,v in y['all'].items() if k not in dropy},label,'unrelated reachable bytes changed')
    require(replace(dx('HONRO.html'),xrole['entry'],yrole['entry'],'HTML→entry')==dy('HONRO.html'),label,'unexpected HTML bytes')
    entry=replace(entry,xrole['loader'].rsplit('/',1)[-1],yrole['loader'].rsplit('/',1)[-1],'entry campaign loader')
    require(replace(entry,xrole['manifest'],yrole['manifest'],'entry→manifest')==dy(yrole['entry']),label,'unexpected entry bytes')
    require(replace(dx(xrole['loader']),xrole['manifest'],yrole['manifest'],'loader→manifest')==dy(yrole['loader']),label,'unexpected loader bytes')
    require(replace(dx(xrole['manifest']),xrole['packet'],yrole['packet'],'manifest→stageLibrary[41]')==dy(yrole['manifest']),label,'unexpected manifest bytes')
    return {'changedBefore':sorted(dropx),'changedAfter':sorted(dropy),'unrelatedBytesExact':True}
def main():
    p=ArgumentParser();p.add_argument('A',type=Path);p.add_argument('B',type=Path);p.add_argument('C',type=Path);p.add_argument('out',type=Path);p.add_argument('--baseline-pins',type=Path);p.add_argument('--compiled-proof',required=True,type=Path);a=p.parse_args()
    pins=dict(PINS)
    if a.baseline_pins:
        q=json.loads(a.baseline_pins.read_text());require(set(q)=={'base','tree','parent','renderer'},'replace only exact base')
        pins.update(q)
    proof=json_exact(a.compiled_proof.read_bytes())
    require(all(proof[k]==pins[k] for k in ('base','tree','renderer')) and proof['lockedBuilders']==pins['compiler']['builders'], 'wrong compiler proof pins')
    require(proof['exactOneStage42SourceHunk'] is True and set(proof['arms'])==set('ABC'),'exact one-source hunk proof required')
    sides={k:inspect(getattr(a,k),k,pins,proof['arms'][k]) for k in 'ABC'}
    ans={'base':pins['base'],'tree':pins['tree'],'renderer':pins['renderer'],'compiledProofSHA256':sha(a.compiled_proof.read_bytes()),'sides':{k:v[0] for k,v in sides.items()}}
    ans['AB']=compare('AB',sides['A'],sides['B']);ans['BC']=compare('BC',sides['B'],sides['C'])
    a.out.write_text(json.dumps(ans,indent=2)+'\n')
if __name__=='__main__':main()
