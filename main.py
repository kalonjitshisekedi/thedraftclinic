import subprocess
import os
import sys
import socket
import time
import atexit

from flask import Flask, Response, request
import urllib.request
import urllib.error

NODE_PORT = 5001
_node_process = None
_startup_complete = False

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex(('127.0.0.1', port)) == 0

def ensure_node_server():
    global _node_process, _startup_complete
    
    if _startup_complete:
        return
    
    _startup_complete = True
    
    if is_port_in_use(NODE_PORT):
        print(f"[main.py] Node.js already running on port {NODE_PORT}", flush=True)
        return
    
    print(f"[main.py] Starting Node.js server on port {NODE_PORT}...", flush=True)
    
    env = os.environ.copy()
    env['NODE_ENV'] = 'development'
    env['PORT'] = str(NODE_PORT)
    
    _node_process = subprocess.Popen(
        ['npm', 'run', 'dev'],
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr,
        start_new_session=True
    )
    
    for _ in range(60):
        if is_port_in_use(NODE_PORT):
            print(f"[main.py] Node.js server ready!", flush=True)
            return
        time.sleep(0.5)
    
    print(f"[main.py] Warning: Node.js may not have started", flush=True)

def cleanup():
    global _node_process
    if _node_process:
        try:
            _node_process.terminate()
            _node_process.wait(timeout=5)
        except:
            pass

atexit.register(cleanup)

app = Flask(__name__)

@app.before_request
def before_request():
    ensure_node_server()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
def proxy(path):
    url = f'http://127.0.0.1:{NODE_PORT}/{path}'
    if request.query_string:
        url += '?' + request.query_string.decode()
    
    try:
        headers_dict = {}
        for key, value in request.headers:
            if key.lower() not in ['host', 'content-length']:
                headers_dict[key] = value
        
        req = urllib.request.Request(
            url,
            data=request.get_data() if request.method in ['POST', 'PUT', 'PATCH'] else None,
            headers=headers_dict,
            method=request.method
        )
        
        with urllib.request.urlopen(req, timeout=120) as response:
            resp_data = response.read()
            resp_headers = dict(response.getheaders())
            
            excluded = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
            headers = [(k, v) for k, v in resp_headers.items() if k.lower() not in excluded]
            
            return Response(resp_data, status=response.status, headers=headers)
            
    except urllib.error.HTTPError as e:
        return Response(e.read(), status=e.code)
    except urllib.error.URLError as e:
        return Response(f"Backend connection error: {e.reason}", status=502)
    except Exception as e:
        return Response(f"Proxy error: {str(e)}", status=500)

if __name__ == "__main__":
    ensure_node_server()
    app.run(host='0.0.0.0', port=5000, debug=True)
