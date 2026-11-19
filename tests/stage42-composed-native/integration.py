"""Import call in the one reviewed composed workflow only. Never writes receipt bytes."""
from pathlib import Path
import json
import re
import subprocess
from walk_probe import initial_only

def run_after_exact_composed_reopen(browser, raw, detail_bytes, rb, output, candidate_module_dir, workshop_url):
    """Call only when native pointer/reopen and prior visual/guard assertions have passed."""
    m=re.fullmatch(r'(http://(?:127\.0\.0\.1|localhost):[0-9]+)/HONRO_WORKSHOP\.html',workshop_url)
    if not m: raise ValueError('Disposable built localhost only')
    here=Path(__file__).parent
    modules=Path(candidate_module_dir).resolve(strict=True)
    bundle=subprocess.check_output(['node',str(here/'build-composed-visual.mjs'),str(modules)],text=True)
    out=Path(output)
    first=out/'live-first-walk.json'
    try:
        initial_only(browser,raw.decode('utf-8'),detail_bytes.decode('utf-8'),rb.decode('utf-8'),bundle,
                     m.group(1)+'/HONRO.html',first,out/'08-stock-composed-first-walk.png')
    except Exception as e:
        if not first.is_file():
            # No URLs/values or raw receipts printed.
            first.write_text(json.dumps({'pass':False,'error_type':type(e).__name__,
                          'scope':'Player load or initial movement failed before live capture'}))
        raise
