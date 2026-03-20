#!/usr/bin/env python3
"""
Ken's Games Platform - Development Server

Serves the entire gaming platform:
- Landing page: http://localhost:8000/
- BrickBreaker3D: http://localhost:8000/games/breakout3d.html
- FastTrack: http://localhost:8000/games/fasttrack.html
- Arcade: http://localhost:8000/games/arcade/

Usage: python serve.py [--port 8000]
"""

import http.server
import socketserver
import argparse
import os
import sys
from pathlib import Path

# Change to repository root
ROOT = Path(__file__).parent
os.chdir(ROOT)

class KensGamesHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with routing for Ken's Games platform."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        # Route root to platform landing page
        if self.path == '/' or self.path == '/index.html':
            self.path = '/platform/index.html'

        # Route /login to platform login
        elif self.path == '/login' or self.path == '/login.html':
            self.path = '/platform/login.html'

        # Route /admin to platform admin
        elif self.path == '/admin' or self.path == '/admin.html':
            self.path = '/platform/admin.html'

        # Route /brickbreaker3d to the new game
        elif self.path == '/brickbreaker3d' or self.path == '/brickbreaker':
            self.path = '/games/brickbreaker3d/index.html'

        # Route old breakout3d to new location
        elif self.path == '/games/breakout3d.html':
            self.path = '/games/brickbreaker3d/index.html'

        # Route /fasttrack to landing page, /fasttrack/play to game
        elif self.path == '/fasttrack':
            self.path = '/games/fasttrack/index.html'
        elif self.path == '/fasttrack/play' or self.path == '/fasttrack/game':
            self.path = '/games/fasttrack/play.html'

        # Route /arcade
        elif self.path == '/arcade':
            self.path = '/games/arcade/index.html'

        # Route platform assets (CSS, JS) that are referenced without /platform/
        elif self.path == '/substrate.css':
            self.path = '/platform/substrate.css'
        elif self.path == '/behavior.js':
            self.path = '/platform/behavior.js'

        # Route fasttrack assets
        elif self.path.startswith('/fasttrack/'):
            self.path = '/games' + self.path

        return super().do_GET()

    def log_message(self, format, *args):
        # Safe logging
        try:
            if args and isinstance(args[0], str) and ' ' in args[0]:
                path = args[0].split()[1]
            else:
                path = str(args[0]) if args else ''

            if '/games/' in path:
                prefix = '\033[92m[GAME]\033[0m'
            elif '/platform/' in path:
                prefix = '\033[94m[PLATFORM]\033[0m'
            elif '/api/' in path:
                prefix = '\033[93m[API]\033[0m'
            else:
                prefix = '\033[90m[STATIC]\033[0m'

            print(f"{prefix} {path}")
        except:
            print(f"[LOG] {args}")


def main():
    parser = argparse.ArgumentParser(description="Ken's Games Development Server")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    args = parser.parse_args()
    
    with socketserver.TCPServer((args.host, args.port), KensGamesHandler) as httpd:
        print(f"""
╔══════════════════════════════════════════════════════════════════╗
║               KEN'S GAMES - Development Server                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   🏠 Landing Page:    http://{args.host}:{args.port}/                    ║
║   🎮 BrickBreaker3D:  http://{args.host}:{args.port}/brickbreaker3d      ║
║   🏎️  FastTrack:       http://{args.host}:{args.port}/fasttrack           ║
║   🕹️  Arcade:          http://{args.host}:{args.port}/arcade              ║
║                                                                  ║
║   🔐 Login:           http://{args.host}:{args.port}/login               ║
║   ⚙️  Admin:           http://{args.host}:{args.port}/admin               ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║   Press Ctrl+C to stop                                           ║
╚══════════════════════════════════════════════════════════════════╝
        """)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\033[93mServer stopped.\033[0m")
            sys.exit(0)


if __name__ == "__main__":
    main()

