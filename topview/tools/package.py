"""Create an independent static root using the pinned Honro runtime and Act I."""
import argparse,json,re,shutil
from pathlib import Path
from urllib.parse import unquote,urlsplit

root=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('out',type=Path)
args=parser.parse_args()
out=args.out.resolve()
if any(p in (root,root/'topview',root/'web') for p in [out]) or (out.exists() and any(out.iterdir())):
    raise SystemExit('Choose a new empty output directory')
out.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'web/manifest.json').read_text())
runtime=json.loads((root/'topview/generated/native.json').read_text())
project=manifest['project']
files={r['path'] for r in manifest['files']}
pending=set(runtime['modules']+runtime['styles']+['index.html','HONRO.html','topview/index.html','topview/motions.html','topview/style.css','topview/generated/native.json','topview/data/yeonmok.json'])
for folder in ['data','src','assets/actors','assets/props','assets/terrain']:
    pending.update(str(p.relative_to(root)) for p in (root/'topview'/folder).rglob('*') if p.is_file())
# Act I menus can show learned and locked techniques
# and equipment, including their native icon, portrait and SFX catalogues.
for file in files:
    if file.startswith(('web/fonts/','web/graphics/skill-icon-','web/graphics/honro_equipment_icons-','web/graphics/honro_skill_audio-','web/graphics/portrait-','web/graphics/npc-portrait-')):
        pending.add(file)
scores=json.loads((root/'shared/data/bgm-stages.json').read_text());musicIds={'01'}
for id in range(1,11):
    score=scores[str(id)];musicIds.update([score['start'],*score['loop']])
catalog=json.loads((root/'shared/data/bgm.json').read_text())
for row in catalog:
    if row['id'] in musicIds:pending.add('assets/bgm/'+row['file'])
registered=re.compile(r'web/(?:data|graphics|fonts|runtime|styles)/[^"\'<>\\\s?#]+')
relative=re.compile(r'(?:from\s*|import\s*(?:\(\s*)?)["\'](\.{1,2}/[^"\']+)["\']')
copied=set()
while pending:
    name=pending.pop()
    if name in copied:continue
    src=root/name;dst=out/name
    if not src.is_file() or not src.resolve().is_relative_to(root):raise ValueError(name)
    dst.parent.mkdir(parents=True,exist_ok=True)
    if name==project:
        data=json.loads(src.read_text());pending.update([data['base'],data['shared']])
        for i,chapter in enumerate(data['catalog']):
            if 1<=chapter['metadata']['stageId']<=10:pending.update([data['stages'][i],data['stageLibraries'][i]])
        shutil.copyfile(src,dst);copied.add(name);continue
    shutil.copyfile(src,dst);copied.add(name)
    if src.suffix not in {'.mjs','.js','.json','.css','.html'}:continue
    contents=src.read_text()
    for path in registered.findall(contents):
        if path in files:pending.add(path)
    for ref in relative.findall(contents):
        local=(src.parent/unquote(urlsplit(ref).path)).resolve()
        if local.is_file() and local.is_relative_to(root):pending.add(str(local.relative_to(root)))
print(f'{len(copied)} files, {sum(p.stat().st_size for p in out.rglob("*") if p.is_file())/1048576:.1f} MiB')
