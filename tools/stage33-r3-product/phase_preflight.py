"""Exact add-only current Stage33 input runner; no remote writes."""
import os,sys
from pathlib import Path
from guard import facts,txt,git,save,BASE,TREE,CANON,P
HERE='tools/stage33-r3-product'
PARENT='336501839c7c51388dfe68e251eb98c251f384ea'
PTREE='1f727bee4e5aa79875ca9acacb41fc460004fd09'
BRANCH='refs/heads/qa/stage33-r3-2c4-live-input'
EXPECTED={'.github/workflows/stage33-r3-2c4-live-input.yml',f'{HERE}/live_input.py',f'{HERE}/phase_preflight.py'}
PINNED={
 '.github/workflows/stage33-r3-2c4-normal.yml':'afcad899ffb8fe8d502dc067531e5b8b219ccae3',
 f'{HERE}/PINS.json':'c4b2896e1ea6aff8e45bd41e590bfa69f2262e15',
 f'{HERE}/POSES.json':'1e071a49a50763371da742bdecc8fa23c940a716',
 f'{HERE}/RECIPE.json':'81d0f96d1292ed3e5fe0c95b591ec65a0703ed3b',
 f'{HERE}/capture.py':'80b2d60988ddcb0b9e0fa6d8f2036e38f3cc5dd9',
 f'{HERE}/guard.py':'36360f6266643983c48ec66cbf6e2a602fa15de2',
 f'{HERE}/metrics.py':'996a2acc6a74d967b53518cef703978896950b42',
 f'{HERE}/park.js':'7dc0e1c3778051edce33d273603a0364aa0b4047',
 f'{HERE}/preflight.py':'ec084de06191a0b3c9e014b1a619e8bb2f8e9a21',
 f'{HERE}/prepare.mjs':'732c351f9d4a752332eb20ddcb9349a4eda6a796',
 f'{HERE}/review.py':'c659d2dd8a7a6ef6d2c4977517d3d1e2cdfa1df8',
}
def pre(w):
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',BRANCH)
 assert txt(root,'rev-parse','HEAD')==head and not git(root,'status','--porcelain=v1','-z')
 assert txt(root,'rev-list','--parents','-1',head).split()==[head,PARENT]
 assert txt(root,'rev-list','--parents','-1',PARENT).split()==[PARENT,BASE]
 assert txt(root,'rev-parse',PARENT+'^{tree}')==PTREE and txt(root,'rev-parse',BASE+'^{tree}')==TREE
 assert set(txt(root,'diff','--name-status','--no-renames',PARENT,head).splitlines())=={'A\t'+f for f in EXPECTED}
 assert set(txt(root,'diff','--name-status','--no-renames',BASE,PARENT).splitlines())=={'A\t'+f for f in PINNED}
 assert all(txt(root,'ls-tree',head,'--',f).split()[:2]==['100644','blob']for f in EXPECTED)
 for path,sha in PINNED.items():
  assert txt(root,'ls-tree',head,'--',path).split()[:3]==['100644','blob',sha]
 assert facts(git(root,'show',BASE+':'+CANON))==P['manifest']
 for arm in ('A','B'):git(root,'worktree','add','--detach',str(w/arm),BASE)
 save(w/'out'/'GATE.json',{'base':BASE,'tree':TREE,'warpedByVisualQA':False,'parent':PARENT,'parentTree':PTREE,
  'head':head,'onlyAdded':sorted(EXPECTED),'source':'stage33 one exact authored candidate in detached B only; no release'})
if __name__=='__main__':
 w=Path(sys.argv[1]).resolve();rr=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w!=rr and w.is_relative_to(rr) and (w/'out').is_dir()
 pre(w)
