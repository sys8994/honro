"""Serve the checked-out HTML for story browser checks, or use explicit Pages."""
import atexit
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from threading import Thread
from browser_support import ROOT


def story_base_url():
    deployed = os.environ.get('HONRO_BASE_URL')
    if deployed:
        return deployed.rstrip('/')

    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def handle(self):
            try:
                super().handle()
            except (BrokenPipeError, ConnectionResetError):
                # Browser navigation may cancel an in-flight media response.
                pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()

    def close():
        server.shutdown()
        server.server_close()

    atexit.register(close)
    return f'http://127.0.0.1:{server.server_port}'
