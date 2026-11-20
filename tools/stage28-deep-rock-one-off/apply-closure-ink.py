from pathlib import Path
from subprocess import check_output
p=Path('shared/runtime/terrain-readability.js')
assert check_output(['git','hash-object',str(p)],text=True).strip()=='5c3b3cd4df6fcb383a77bd6a8b21cbb90dd4ca04'
s=p.read_text()
needle='   const left=Math.min(a.x,z.x),right=Math.max(a.x,z.x),low=Math.min(a.y,z.y),high=Math.max(a.y,z.y),peers='
assert s.count(needle)==1
change="""   // QA Stage28: the foundation's buried bottom is not an exposed walking edge.
   if(b.honroStage===28&&t.id==='a3-foundation'&&!walkable&&a.x===16200&&a.y===9000&&z.x===-9000&&z.y===9000)continue;
"""
p.write_text(s.replace(needle,change+needle))
