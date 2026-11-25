"""Check the real 53 touch support and a copied insufficient-focus boundary."""
import argparse
import json
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

import browser as base
from cold_resume import saved_context, seeded_context, storage_hash
from legacy54_live import resume
from mobile_seams import move
from native_b import wall_trace
from relay_live_chain import ready

SLOT = '[data-act6-sodan-spirit]'
LOW = """
const fs=require('node:fs'),crypto=require('node:crypto');
const {profile,body}=JSON.parse(fs.readFileSync(process.argv[1]))['53'];
const cast=body.terminal.actors.find(u=>u.id==='p-occultist');
const copy=body.custody.full.occultist;
const before=JSON.stringify(cast.loadout);
cast.focus=0;copy.focus=0;
if(before!==JSON.stringify(copy.loadout))throw Error('Loadout differs');
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
body.terminalSHA=sha(body.terminal);body.custodySHA=sha(body.custody);
console.log(JSON.stringify({'honro-first-act-profile-1':JSON.stringify(profile),
  [body.slot]:JSON.stringify({...profile,honroAct6ChapterBoundary:{body,sha:sha(body)}})}));
"""
READ = """() => {
 const a=HonroApp,e=a.engine,u=e.active,s=e.unit('p-occultist');
 return {shot:e.b.shot,round:e.b.round,focus:s.focus,disabled:document.querySelector('[data-act6-sodan-spirit]').disabled,
  active:u.id,grounded:e.grounded(u),near:e.b.units.filter(v=>v.side===1&&!v.dead&&Math.hypot(v.x-u.x,v.y-u.y)<940).map(v=>v.id),
  spiritLoadout:s.loadout,activeLoadout:u.loadout};
}"""


def run(browser, out, low):
    name = 'low-focus-copy' if low else 'actual-use-and-retap'
    if low:
        source = base.ROOT / 'shared/act6-debug-stages/fixtures.json'
        records = json.loads(subprocess.check_output(['node', '-e', LOW, str(source)], text=True))
        context = saved_context(browser, records, mobile=True)
    else:
        context = seeded_context(browser, 53, mobile=True)
    with context:
        page = context.new_page()
        resume(page, 53, True, mobile=True)
        original = storage_hash(base.saved_bytes(page))
        move(context, page, 1, 'HonroApp.engine.active.x>=1135')
        ready(page)
        start = page.evaluate(READ)
        assert start['grounded'] and start['near'] and start['active'] == 'p-mage', start
        wall_trace(page)
        button = page.locator(SLOT)
        used = None
        if low:
            assert start['focus'] == 0 and start['disabled'], start
        else:
            assert not start['disabled'], start
            button.tap(timeout=5000)
            page.wait_for_function("nativeWall.some(r=>r.event==='impact'&&r.actor==='p-occultist'&&r.skill==='O06'&&r.after<r.before)", timeout=15000)
            ready(page, 36000)
            used = page.evaluate(READ)
            assert used['shot'] > start['shot'] and used['disabled'], used
        rect = button.bounding_box()
        page.touchscreen.tap(rect['x'] + rect['width']/2, rect['y'] + rect['height']/2)
        page.wait_for_timeout(400)
        after = page.evaluate(READ)
        prior = used or start
        assert after == prior, (prior, after)
        trace = page.evaluate("nativeWall.filter(r=>r.actor==='p-occultist')")
        hit_shots={r['shot'] for r in trace if r['event']=='impact' and r['skill']=='O06'}
        assert len(hit_shots) == (0 if low else 1), trace
        assert original == storage_hash(base.saved_bytes(page))
        page.screenshot(path=out / f'{name}.png')
        return {'case':name,'before':start,'afterFirst':used,'afterDeniedTap':after,'trace':trace,'saveSHA256':original}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    base.ROOT = args.build.resolve()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        with pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage']) as browser:
            report = [run(browser,args.out,low) for low in (False,True)]
    assert report[0]['before']['activeLoadout']==report[1]['before']['activeLoadout']
    (args.out/'sodan-acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
