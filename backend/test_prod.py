import urllib.request, json

BASE = 'https://airbnb-cleaning-management-backend-production.up.railway.app'

def call(method, path, token=None, body=None):
    req = urllib.request.Request(BASE + path, method=method)
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    data = json.dumps(body).encode() if body else None
    with urllib.request.urlopen(req, data, timeout=30) as r:
        return r.status, json.loads(r.read().decode())

try:
    s, login = call('POST', '/api/auth/login', body={'username': 'admin', 'password': 'admin123'})
    print('LOGIN admin:', s, '-> token:', login.get('access_token', '')[:20] + '...')
    tok = login['access_token']
except Exception as e:
    print('LOGIN FALHOU:', e)
    raise SystemExit

s, user = call('GET', '/api/users/me', tok)
print('ME:', s, user.get('username'), user.get('role'))

s, apts = call('GET', '/api/apartments/', tok)
print('APARTAMENTOS:', s, len(apts), [a['name'] for a in apts][:3])

s, tasks = call('GET', '/api/schedules/tasks/all', tok)
print('TAREFAS:', s, len(tasks))