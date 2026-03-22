#!/usr/bin/env python3
"""
Fast Track WebSocket Server - ButterflyFX Integration
Run this alongside the main server for multiplayer support

Usage: python run_fasttrack_server.py [--port 8765]
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

try:
    import websockets
    WEBSOCKETS_AVAILABLE = True
except ImportError:
    WEBSOCKETS_AVAILABLE = False
    print("Please install websockets: pip install websockets")

# Import the new beta session server
try:
    from games.fasttrack.beta_server import beta_manager, BetaWebSocketServer
    BETA_SERVER_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import beta_server: {e}")
    BETA_SERVER_AVAILABLE = False

# Try Helix integration
try:
    from helix import HelixKernel
    HELIX_AVAILABLE = True
except ImportError:
    HELIX_AVAILABLE = False


async def main(host: str, port: int):
    """Start the WebSocket server."""
    if not WEBSOCKETS_AVAILABLE:
        print("Error: websockets library required")
        return
    
    if BETA_SERVER_AVAILABLE:
        # Use the new beta session server
        server = BetaWebSocketServer(beta_manager, host, port)
        
        print(f"""
╔══════════════════════════════════════════════════════════════════╗
║           FASTTRACK BETA SESSION SERVER                          ║
║                    ButterflyFX Integration                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   🔌 WebSocket:    ws://{host}:{port}                               ║
║   🌐 Game URL:     https://butterflyfx.us/fasttrack              ║
║   📂 Local:        http://localhost:8080/                        ║
║                                                                  ║
║   Features:                                                      ║
║     • No login required - username + avatar only                 ║
║     • Session codes for easy sharing                             ║
║     • Host can boot players                                      ║
║     • 2-6 players with AI support                                ║
║     • Real-time WebSocket multiplayer                            ║
║                                                                  ║
║   Helix Kernel: {'✓ Connected' if HELIX_AVAILABLE else 'Not available'}                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
        """)
        
        await server.start()
    else:
        # Fallback to old server
        from games.fasttrack.server import fasttrack_server, handle_fasttrack_ws
        
        print(f"🎮 Fast Track WebSocket Server starting on ws://{host}:{port}")
        print(f"   Connect with: ws://{host}:{port}/ws/fasttrack/{{room_code}}")
        
        async def handler(websocket, path):
            parts = path.strip('/').split('/')
            if len(parts) >= 3 and parts[0] == 'ws' and parts[1] == 'fasttrack':
                room_code = parts[2]
            else:
                room_code = fasttrack_server.generate_room_code()
            await fasttrack_server.handle_websocket(websocket, room_code)
        
        async with websockets.serve(handler, host, port):
            await asyncio.Future()


if __name__ == "__main__":
    if not WEBSOCKETS_AVAILABLE:
        print("Error: websockets library required")
        print("Install with: pip install websockets")
        sys.exit(1)
    
    parser = argparse.ArgumentParser(description="Fast Track WebSocket Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8765, help="Port to listen on")
    args = parser.parse_args()
    
    try:
        asyncio.run(main(args.host, args.port))
    except KeyboardInterrupt:
        print("\nServer stopped")
