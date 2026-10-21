from pathlib import Path
import os
import shutil

ROOT = Path(__file__).resolve().parents[1]
(ROOT / '_local/reports').mkdir(parents=True, exist_ok=True)
(ROOT / '_local/game-reports').mkdir(parents=True, exist_ok=True)

def browser_path():
    candidates = [os.environ.get('HONRO_BROWSER'), shutil.which('chromium'), shutil.which('google-chrome'),
                  r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                  r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe']
    return next((p for p in candidates if p and Path(p).exists()), None)

def launch(playwright):
    return playwright.chromium.launch(executable_path=browser_path(), headless=True,
        args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-precise-memory-info'])

# Focused UI audits serve the same built modules as production, on an ephemeral port.
from contextlib import contextmanager
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial

@contextmanager
def serve_game():
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}'
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
