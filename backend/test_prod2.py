import urllib.request, json

BASE = 'https://airbnb-cleaning-management-backend-production.up.railway.app'
ORIGIN = 'https://airbnb-cleaning-management-frontend-production.up.railway.app'

# Teste de preflight CORS
req = urllib.request.Request(BASE + '/api/auth/login', method='OPTIONS')
req.add_header('Origin', ORIGIN)
req.add_header('Access-Control-Request-Method', 'POST')
req.add_header('Access-Control-Request-Headers', 'content-type')
try:
    r = urllib.request.urlopen(req, timeout=30)
    print('PREFILIGHT:', r.status, '| Allow-Origin:', r.headers.get('Access-Control-Allow-Origin'))
except Exception as e:
    print('PREFILIGHT FALHOU:', e)

# Login com Origin do frontend
def call(method, path, token=None, body=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Origin', ORIGIN)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    data = json.dumps(body).encode() if body else None
    with urllib.request.urlopen(req, data, timeout=30) as r:
        return r.status, json.loads(r.read().decode())

s, login = call('POST', '/api/auth/login', body={'username': 'maria', 'password': 'maria123'})
print('LOGIN maria:', s, '->', login.get('access_token', '')[:15] + '...')
tok = login['access_token']

s, tasks = call('GET', '/api/schedules/tasks/all', tok)
print('TAREFAS maria:', s, len(tasks))