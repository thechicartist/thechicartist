# Local test server for thechicartist.com — mimics the live site's clean URLs.
# The live site serves /paintings from paintings.html; VS Code Live Server
# does not, which is why clean links 404 locally ("Cannot GET /paintings").
#
# Usage (no install needed — macOS ships Python 3):
#   1. Put this file in your site folder (the same folder as index.html).
#   2. In a terminal in that folder, run:  python3 test-server.py
#   3. Open http://127.0.0.1:3000/ and click through the nav like the live site.
#   4. Stop it with Ctrl+C when you're done. Do NOT deploy this file.

import os
import mimetypes
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, unquote

PORT = 3000
ROOT = os.path.dirname(os.path.abspath(__file__))

MIME_OVERRIDES = {
    ".js": "text/javascript; charset=utf-8",
    ".webmanifest": "application/manifest+json",
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep the terminal quiet

    def resolve_file(self, url_path):
        p = unquote(url_path)
        safe = os.path.normpath(os.path.join(ROOT, p.lstrip("/")))
        if not safe.startswith(ROOT):
            return None
        for candidate in (safe, safe + ".html", os.path.join(safe, "index.html")):
            if os.path.isfile(candidate):
                return candidate
        return None

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            path = "/index.html"
        file = self.resolve_file(path)
        if not file:
            body = f"Cannot GET {path}\n(no matching file in {ROOT})".encode()
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        ext = os.path.splitext(file)[1].lower()
        ctype = MIME_OVERRIDES.get(ext) or mimetypes.guess_type(file)[0] or "application/octet-stream"
        if ctype.startswith("text/") and "charset" not in ctype:
            ctype += "; charset=utf-8"
        size = os.path.getsize(file)
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.end_headers()
        with open(file, "rb") as f:
            self.wfile.write(f.read())


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"The Chic Artist test server running at http://127.0.0.1:{PORT}/")
    print(f"Serving files from: {ROOT}")
    print("Stop with Ctrl+C. Do not deploy this file.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
