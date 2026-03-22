#!/usr/bin/env python3
"""
Fast Track Server Launcher
Starts the lobby server and optionally a web server for the game files.
"""

import argparse
import asyncio
import http.server
import os
import posixpath
import sys
import threading
import urllib.parse
from pathlib import Path


# Add server directory to path
SERVER_DIR = Path(__file__).parent / "server"
sys.path.insert(0, str(SERVER_DIR))

# ============================================================
# Paths
# ============================================================
GAME_DIR = Path(__file__).parent                       # volume/games/fasttrack/
WORKSPACE_ROOT = GAME_DIR.parent.parent.parent         # C:\dev\butterfly_platform
LIB_DIR = WORKSPACE_ROOT / "width" / "lib"            # width/lib/ (Three.js, Bootstrap…)


class FastTrackHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP handler that serves game files from GAME_DIR and maps
    /lib/  →  width/lib/  so that Three.js and Bootstrap resolve correctly
    without requiring directory-traversal paths.
    """

    def translate_path(self, path):
        # Strip query string / fragment
        path = path.split('?', 1)[0]
        path = path.split('#', 1)[0]
        # URL-decode
        path = urllib.parse.unquote(path, errors='surrogatepass')
        # Normalise (collapse // and .)
        path = posixpath.normpath(path)

        # --- Route /lib/ → width/lib/ ---
        parts = [p for p in path.split('/') if p]
        if parts and parts[0] == 'lib':
            rel = os.path.join(*parts[1:]) if len(parts) > 1 else ''
            return str(LIB_DIR / rel)

        # --- Everything else → GAME_DIR ---
        result = GAME_DIR
        for word in parts:
            # Reject any remaining traversal attempts
            if word in (os.curdir, os.pardir) or os.path.dirname(word):
                continue
            result = result / word
        return str(result)

    # Force UTF-8 charset so browsers don't fall back to Windows-1252
    _CHARSET_TYPES = {
        '.html': 'text/html; charset=utf-8',
        '.js':   'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.css':  'text/css; charset=utf-8',
    }

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return self._CHARSET_TYPES.get(ext, super().guess_type(path))

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        if self.path.endswith(('.html', '.json')):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Suppress routine GET logs to keep output clean; errors still print
        if args and str(args[1]) not in ('200', '304'):
            print(f'[Web] {fmt % args}')


def main():
    parser = argparse.ArgumentParser(description="Fast Track Game Server")
    parser.add_argument("--lobby-port", type=int, default=8765, 
                        help="WebSocket lobby server port (default: 8765)")
    parser.add_argument("--web-port", type=int, default=8080,
                        help="HTTP web server port (default: 8080)")
    parser.add_argument("--host", default="0.0.0.0",
                        help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--no-web", action="store_true",
                        help="Don't start the web server")
    parser.add_argument("--lobby-only", action="store_true",
                        help="Only start the lobby server")
    
    args = parser.parse_args()
    
    print("""
╔═══════════════════════════════════════════════════════════╗
║                    🎯 FAST TRACK 🎯                       ║
║                   Game Server Launcher                     ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Start web server (in-process thread so custom handler is used)
    web_server = None
    if not args.no_web and not args.lobby_only:
        print(f"[Web] Starting HTTP server on port {args.web_port}...")
        print(f"[Web]   Game root : {GAME_DIR}")
        print(f"[Web]   /lib/ maps: {LIB_DIR}")

        web_server = http.server.ThreadingHTTPServer(
            (args.host, args.web_port), FastTrackHTTPHandler
        )
        web_thread = threading.Thread(target=web_server.serve_forever, daemon=True)
        web_thread.start()

        print(f"[Web] ✓ Serving game files at http://{args.host}:{args.web_port}/")
        print(f"[Web] ✓ Game URL: http://localhost:{args.web_port}/lobby.html")

    # Start lobby server
    print(f"[Lobby] Starting WebSocket server on port {args.lobby_port}...")

    try:
        from lobby_server import LobbyServer

        server = LobbyServer(host=args.host, port=args.lobby_port)

        print(f"[Lobby] ✓ WebSocket server ready at ws://{args.host}:{args.lobby_port}/")
        print()
        print("═" * 60)
        print("Server is running! Press Ctrl+C to stop.")
        print("═" * 60)
        print()

        asyncio.run(server.start())

    except KeyboardInterrupt:
        print("\n[Server] Shutting down...")
    except Exception as e:
        print(f"[Error] {e}")
    finally:
        if web_server:
            web_server.shutdown()
            print("[Web] Stopped")
        print("[Server] Goodbye!")


if __name__ == "__main__":
    main()
