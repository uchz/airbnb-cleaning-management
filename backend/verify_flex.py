import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = 'https://airbnb-cleaning-management-backend-production.up.railway.app'

def req(path, method='GET', body=None, token=None):
    r = urllib.request.Request(BASE + path, method=method)
    r.add_header('Content-Type', 'application/json')
    r.add_header('User-Agent', 'Mozilla/5.0')
    if token:
        r.add_header('Authorization', 'Bearer ' + token)
    data = json.dumps(body).encode() if body else None
    try:
        with urllib.request.urlopen(r, data, timeout=30) as resp:
            raw = resp.read()
            try:
                return resp.status, json.loads(raw.decode('utf-8'))
            except Exception:
                return resp.status, raw.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw.decode('utf-8'))
        except Exception:
            return e.code, raw.decode('utf-8', 'replace')

# Login
s, d = req('/api/auth/login', 'POST', {'username': 'admin', 'password': 'admin123'})
at = d['access_token']
s, d = req('/api/auth/login', 'POST', {'username': 'maria', 'password': 'maria123'})
mt = d['access_token']

# 1. Listar escalas
s, d = req('/api/schedules/', token=at)
print('Schedules:', s, '| count:', len(d))
for sc in d:
    print(f'  - id:{sc["id"]} type:{sc["schedule_type"]} start:{sc["start_date"]} end:{sc["end_date"]}')

# 2. Criar tarefa avulsa
s, apts = req('/api/apartments/', token=at)
apt = apts[0]
s, d = req('/api/schedules/tasks', 'POST', {
    'employee_id': 2,
    'apartment_id': apt['id'],
    'scheduled_date': '2026-08-25',
    'scheduled_time': '10:00:00',
    'task_type': 'full_day',
}, at)
print('Tarefa avulsa (sem schedule):', s, '| id:', d.get('id'), '| schedule_id:', d.get('schedule_id'))

# 3. Criar escala DATE_RANGE
s, d = req('/api/schedules/', 'POST', {
    'schedule_type': 'date_range',
    'start_date': '2026-09-01',
    'end_date': '2026-09-15',
    'notes': 'Projeto especial set/2026'
}, at)
print('Schedule DATE_RANGE:', s, '| resposta:', d)

# 4. Criar tarefa dentro da DATE_RANGE
if s == 200 and isinstance(d, dict) and 'id' in d:
    s, d = req('/api/schedules/tasks', 'POST', {
        'schedule_id': d['id'],
        'employee_id': 2,
        'apartment_id': apt['id'],
        'scheduled_date': '2026-09-05',
        'scheduled_time': '09:00:00',
        'task_type': 'half_day',
    }, at)
    print('Tarefa dentro DATE_RANGE:', s, '| id:', d.get('id'))

# 5. Verificar notificações maria
s, d = req('/api/notifications/', token=mt)
print('Notificações maria:', s, '| count:', len(d))

print('\n=== TUDO OK ===')