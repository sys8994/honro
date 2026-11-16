"""Export existing native vector art and its contact registration as references."""
from pathlib import Path
import sys,json,base64
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-sideview-p1-20261116'
sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
with serve_game() as url,sync_playwright() as pw:
 b=launch(pw);c=b.new_context();p=c.new_page();p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroVectorArt')
 for n in [33,40]:
  asset=json.loads((OUT/f'original{n}.json').read_text());stage=json.loads((OUT/f'stage{n}-canonical.json').read_text(encoding='utf-8'))
  for guide in [False,True]:
   png=p.evaluate('''({asset,stage,guide})=>{const cv=document.createElement('canvas');cv.width=1536;cv.height=1024;const c=cv.getContext('2d'),z=1536/stage.width;c.scale(z,z);HonroVectorArt.draw(c,asset,{});if(guide){c.lineWidth=3/z;c.strokeStyle='#ff2848';for(const t of stage.terrains){if(!t.oneWay)continue;for(const i of t.properties?.honroWalkEdges||[]){const a=t.points[i],b=t.points[(i+1)%t.points.length];c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}}}return cv.toDataURL('image/png').split(',')[1];}''',{'asset':asset,'stage':stage,'guide':guide})
   (OUT/f'stage{n}-original{"-contact" if guide else ""}.png').write_bytes(base64.b64decode(png))
 c.close();b.close()
