#!/usr/bin/env python3
"""Measured, non-cumulative Inkscape simplification search. Fail closed on quality/budget."""
import argparse, copy, hashlib, importlib.util, json, math, os, re, subprocess, time
import xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_erosion, distance_transform_edt
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('honro_import',HERE/'import-svg.py'); importer=importlib.util.module_from_spec(spec);spec.loader.exec_module(importer)
SVG='http://www.w3.org/2000/svg';ET.register_namespace('',SVG)

def safe_json(value,**kwargs):
    def clean(v):
        if isinstance(v,float) and not math.isfinite(v): return 'Infinity' if v>0 else '-Infinity'
        if isinstance(v,dict): return {k:clean(x) for k,x in v.items()}
        if isinstance(v,(list,tuple)): return [clean(x) for x in v]
        return v
    return json.dumps(clean(value),allow_nan=False,**kwargs)

def run(cmd,env=None):
    result=subprocess.run(cmd,capture_output=True,text=True,env=env)
    if result.returncode: raise RuntimeError(f'{cmd[0]} failed: {result.stderr[-1500:]}')
    return result.stdout

def stats(path):
    root=ET.parse(path).getroot();ds=[e.get('d','') for e in root.iter() if e.tag.split('}')[-1]=='path']
    segments=sum(len(importer.parse_path(d)) for d in ds)
    subpaths=sum(len(re.findall('[Mm]',d)) for d in ds)
    return {'sourceBytes':path.stat().st_size,'paths':len(ds),'commands':segments+subpaths,'segments':segments,'endpointNodesUpperBound':segments+subpaths,'explicitCommandLetters':sum(len(re.findall('[MmZzLlHhVvCcSsQqTtAa]',d)) for d in ds),'subpaths':subpaths,'pathChars':sum(map(len,ds)),'maxPathChars':max(map(len,ds),default=0)}

def edge(mask): return mask ^ binary_erosion(mask)
def distance(a,b,region=None):
    ea,eb=edge(a),edge(b)
    if not ea.any() and not eb.any(): return 0.
    if not ea.any() or not eb.any(): return float('inf')
    da,db=distance_transform_edt(~ea),distance_transform_edt(~eb)
    if region is not None: ea=ea & region; eb=eb & region
    return max(float(db[ea].max(initial=0)),float(da[eb].max(initial=0)))

def compare(raw,candidate,scale,config):
    a=np.asarray(Image.open(raw).convert('RGBA'),dtype=np.float32)/255
    b=np.asarray(Image.open(candidate).convert('RGBA'),dtype=np.float32)/255
    # Premultiplied RGB on both black and white catches alpha and color drift.
    ap=a[:,:,:3]*a[:,:,3:];bp=b[:,:,:3]*b[:,:,3:]
    delta=np.maximum(abs(ap-bp),abs((ap+1-a[:,:,3:])-(bp+1-b[:,:,3:])))*255
    alpha=abs(a[:,:,3]-b[:,:,3])*255
    region=np.zeros(a.shape[:2],dtype=bool)
    for x,y,w,h in config.get('protectedRects',[]):
        region[max(0,round(y*scale)):round((y+h)*scale),max(0,round(x*scale)):round((x+w)*scale)]=True
    if config.get('protectedPolylines'):
        mask=Image.new('L',(a.shape[1],a.shape[0]));draw=ImageDraw.Draw(mask)
        for line in config['protectedPolylines']:
            draw.line([(round(x*scale),round(y*scale)) for x,y in line['points']],fill=255,width=max(1,round(line.get('width',10)*scale)))
        region |= np.asarray(mask)>127
    if config.get('protectedMask'):
        m=Image.open(config['protectedMask']).convert('L').resize((a.shape[1],a.shape[0]),Image.Resampling.NEAREST)
        region |= np.asarray(m)>127
    result={'rgbMAE255':float(delta.mean()),'rgbP99_255':float(np.percentile(delta,99)),'alphaMAE255':float(alpha.mean()),'changedPixelFraction':float((delta.max(axis=2)>16).mean()),'silhouetteMaxOffsetPx':distance(a[:,:,3]>=.5,b[:,:,3]>=.5)}
    if region.any():
        result.update(protectedChangedPixelFraction=float((delta.max(axis=2)[region]>16).mean()),protectedRgbMAE255=float(delta[region].mean()),protectedSilhouetteMaxOffsetPx=distance(a[:,:,3]>=.5,b[:,:,3]>=.5,region))
        if config.get('protectionMode','feature')=='feature':
            # Internal color contour protection via per-palette masks, not alpha alone.
            colors=np.array(config.get('sourcePalette',[[0,0,0],[255,255,255]]),dtype=np.float32)
            maximum=0.
            for color in colors:
                ma=(np.max(abs(a[:,:,:3]*255-color),axis=2)<4)&(a[:,:,3]>=.5)
                mb=(np.max(abs(b[:,:,:3]*255-color),axis=2)<4)&(b[:,:,3]>=.5)
                if (edge(ma)&region).any() or (edge(mb)&region).any(): maximum=max(maximum,distance(ma,mb,region))
            result['protectedColorEdgeMaxOffsetPx']=maximum
    limits=config.get('limits',{})
    passed=result['rgbMAE255']<=limits.get('rgbMAE255',2) and result['silhouetteMaxOffsetPx']<=limits.get('silhouettePx',1.5)*scale
    if region.any(): passed &= result['protectedRgbMAE255']<=limits.get('protectedRgbMAE255',1) and result['protectedSilhouetteMaxOffsetPx']<=limits.get('protectedPx',.5)*scale and result['protectedChangedPixelFraction']<=limits.get('protectedChangedPixelFraction',.05)
    if region.any() and config.get('protectionMode','feature')=='feature': passed &= result['protectedColorEdgeMaxOffsetPx']<=limits.get('protectedPx',.5)*scale
    result['pass']=bool(passed)
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('--output-dir',required=True);p.add_argument('--config');p.add_argument('--width',type=int,default=1000);p.add_argument('--thresholds',default='.00001,.00005,.0001,.0003,.0006,.001,.002');p.add_argument('--precision',default='5,4,3');p.add_argument('--remove-reference-images',action='store_true');p.add_argument('--existing-candidate-dir');args=p.parse_args()
    config=json.loads(Path(args.config).read_text()) if args.config else {};out=Path(args.output_dir).resolve();out.mkdir(parents=True,exist_ok=True)
    source=Path(args.source);original=source.read_bytes();root=ET.fromstring(original);removed=[]
    for parent in root.iter():
        for child in list(parent):
            if child.tag.split('}')[-1]=='image':
                if not args.remove_reference_images: raise ValueError('Reference images require explicit --remove-reference-images')
                removed.append(child.get('id','image'));parent.remove(child)
    raw=out/'raw.svg';ET.ElementTree(root).write(raw,encoding='utf-8',xml_declaration=True)
    rawhash=hashlib.sha256(raw.read_bytes()).hexdigest();vb=list(map(float,re.split('[ ,]+',root.get('viewBox'))))
    asset_config=config.get('asset',{'id':'optimization:trial','semanticLayer':'BODY','bounds':dict(zip(['x','y','w','h'],vb)),'anchor':{'x':0,'y':0},'foot':{'x':vb[0],'y':vb[1]+vb[3]}})
    source_colors=set()
    for e in root.iter():
        fill=e.get('fill','');match=re.search(r'(?:^|;)\s*fill\s*:\s*(#[0-9a-fA-F]{6})',e.get('style',''))
        if match: fill=match[1]
        if re.fullmatch(r'#[0-9a-fA-F]{6}',fill): source_colors.add(tuple(int(fill[i:i+2],16) for i in (1,3,5)))
    config['sourcePalette']=sorted(source_colors)
    scales=config.get('scales',[1,2]);width=config.get('width',args.width)
    report={'source':str(source),'originalSha256':hashlib.sha256(original).hexdigest(),'rawSha256':rawhash,'removedReferenceImages':removed,'width':width,'scales':scales,'limits':{'rgbMAE255':2,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05,**config.get('limits',{})},'protectedRects':config.get('protectedRects',[]),'protectedMask':config.get('protectedMask'),'provisional':True,'visualApproval':'NOT REVIEWED — candidate only; human inspection mandatory','protectionMode':config.get('protectionMode','feature'),'protectedPolylines':config.get('protectedPolylines',[]),'baseline':stats(raw),'candidates':[]}
    report['sourcePalette']=config['sourcePalette']
    raw_render={}
    def render(path,scale):
        png=path.with_name(path.stem+f'-{scale}x.png');timing=json.loads(run(['node',str(HERE/'render-svg-target.mjs'),str(path),str(png),str(round(width*scale))]));return png,timing
    for scale in scales: raw_render[scale]=render(raw,scale)
    report['baseline']['render']={str(k):v[1] for k,v in raw_render.items()}
    def evaluate(path,label):
        row={'candidate':label,**stats(path),'errors':{},'render':{}};start=time.monotonic()
        try:
            asset=importer.compile_svg(path.read_text(),asset_config)
            row['budgetPass']=True;row['nodes']=asset['params']['nodeCount']
            ds=[]
            def walk(n):
                if n['tag']=='path': ds.append(n['d'])
                for c in n.get('children',[]):walk(c)
            walk(asset['vector']['root']);row['normalizedMaxPathChars']=max(map(len,ds),default=0);row['normalizedPaths']=len(ds)
            path.with_suffix('.json').write_text(json.dumps(asset,separators=(',',':')))
        except Exception as exc: row['budgetPass']=False;row['diagnostic']=str(exc)
        row['importSeconds']=time.monotonic()-start
        for scale in scales:
            png,timing=render(path,scale);row['render'][str(scale)]=timing;row['errors'][str(scale)]=compare(raw_render[scale][0],png,scale,config)
        row['qualityPass']=all(e['pass'] for e in row['errors'].values());row['feasible']=row['budgetPass'] and row['qualityPass'];report['candidates'].append(row)
        (out/'report.json').write_text(safe_json(report,indent=2)+'\n')
        print(safe_json(row),flush=True)
        return row
    evaluate(raw,'raw')
    for threshold in args.thresholds.split(','):
        threshold=float(threshold);label=f'simplify-{threshold:g}';candidate=out/(label+'.svg');candidate.write_bytes(raw.read_bytes());profile=out/('profile-'+label);profile.mkdir(exist_ok=True)
        (profile/'preferences.xml').write_text(f'<inkscape><group id="options"><group id="simplifythreshold" value="{threshold}"/></group></inkscape>')
        env={**os.environ,'INKSCAPE_PROFILE_DIR':str(profile),'XDG_CACHE_HOME':str(out/'cache')}
        start=time.monotonic()
        cached=Path(args.existing_candidate_dir)/(label+'.svg') if args.existing_candidate_dir else None
        if cached and cached.exists():
            if hashlib.sha256((cached.parent/'raw.svg').read_bytes()).hexdigest()!=rawhash: raise ValueError('Candidate reuse raw SHA mismatch')
            candidate.write_bytes(cached.read_bytes())
        else: run(['inkscape',str(candidate),'--batch-process',f'--actions=select-all:all;path-simplify;export-filename:{candidate};export-text-to-path;export-plain-svg;export-do'],env)
        row=evaluate(candidate,label);row['simplifySeconds']=time.monotonic()-start
    # Independent numeric-precision candidates always start from immutable raw.
    for digits in filter(None,args.precision.split(',')):
        digits=int(digits);r=copy.deepcopy(root)
        for e in r.iter():
            if 'd' in e.attrib: e.set('d',re.sub(importer.NUMBER,lambda m:format(float(m[0]),f'.{digits}g'),e.get('d')))
        label=f'precision-{digits}';path=out/(label+'.svg');ET.ElementTree(r).write(path,encoding='utf-8',xml_declaration=True);evaluate(path,label)
    feasible=[r for r in report['candidates'] if r['feasible']]
    report['chosen']=min(feasible,key=lambda r:(r['commands'],r['subpaths'],r['sourceBytes']))['candidate'] if feasible else None
    # Review sheets are evidence for a human, never automatic visual approval.
    review=report['chosen'] or min(report['candidates'],key=lambda r: (not r['budgetPass'],r['errors'][str(scales[0])]['rgbMAE255']))['candidate']
    report['reviewCandidate']=review
    for scale in scales:
        a=Image.open(raw_render[scale][0]).convert('RGB');b=Image.open(out/(review+f'-{scale}x.png')).convert('RGB');sheet=Image.new('RGB',(a.width*2,a.height+32),'white');sheet.paste(a,(0,32));sheet.paste(b,(a.width,32));d=ImageDraw.Draw(sheet);d.text((8,8),'RAW - immutable reference',fill='black');d.text((a.width+8,8),review+' - NOT VISUALLY APPROVED',fill='black');sheet.save(out/f'comparison-{scale}x.png')
    for i,rect in enumerate(config.get('reviewRects',config.get('protectedRects',[]))):
        x,y,w,h=rect;scale=scales[-1];box=tuple(round(v*scale) for v in (x,y,x+w,y+h));a=Image.open(raw_render[scale][0]).convert('RGB').crop(box);b=Image.open(out/(review+f'-{scale}x.png')).convert('RGB').crop(box);sheet=Image.new('RGB',(a.width*2,a.height),'white');sheet.paste(a,(0,0));sheet.paste(b,(a.width,0));sheet.resize((sheet.width*2,sheet.height*2)).save(out/f'protected-comparison-{i}.png')
    report['rawUnchanged']=hashlib.sha256(raw.read_bytes()).hexdigest()==rawhash and source.read_bytes()==original
    (out/'report.json').write_text(safe_json(report,indent=2)+'\n');print(json.dumps({'chosen':report['chosen'],'rawUnchanged':report['rawUnchanged'],'report':str(out/'report.json')}),flush=True)
    return 0 if report['chosen'] else 2
if __name__=='__main__': raise SystemExit(main())
