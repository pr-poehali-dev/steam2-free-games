"""
Авторизация пользователей: регистрация и вход.
POST body: {"action": "register", "username": "...", "email": "...", "password": "..."}
POST body: {"action": "login", "email": "...", "password": "..."}
GET  ?action=me&user_id=123
"""

import json
import os
import hashlib
import secrets
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ok(data: dict, status: int = 200):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False)}

def err(msg: str, status: int = 400):
    return {'statusCode': status, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p22678071_steam2_free_games')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event['body']) if event.get('body') else {}
    qs = event.get('queryStringParameters') or {}
    action = body.get('action') or qs.get('action', '')

    conn = get_db()
    cur = conn.cursor()

    # REGISTER
    if action == 'register' and method == 'POST':
        username = (body.get('username') or '').strip()
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        if not username or not email or not password:
            return err('Заполните все поля')
        if len(password) < 6:
            return err('Пароль должен быть не менее 6 символов')

        pw_hash = hash_password(password)
        session_id = secrets.token_hex(32)

        try:
            cur.execute(
                f"INSERT INTO {schema}.users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, coins",
                (username, email, pw_hash)
            )
            user = cur.fetchone()
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return err('Пользователь с таким email или никнеймом уже существует')

        return ok({
            'session_id': session_id,
            'user': {'id': user[0], 'username': user[1], 'email': user[2], 'coins': user[3]}
        })

    # LOGIN
    if action == 'login' and method == 'POST':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        if not email or not password:
            return err('Введите email и пароль')

        pw_hash = hash_password(password)
        cur.execute(
            f"SELECT id, username, email, coins FROM {schema}.users WHERE email = %s AND password_hash = %s",
            (email, pw_hash)
        )
        user = cur.fetchone()

        if not user:
            return err('Неверный email или пароль', 401)

        session_id = secrets.token_hex(32)
        return ok({
            'session_id': session_id,
            'user': {'id': user[0], 'username': user[1], 'email': user[2], 'coins': user[3]}
        })

    # ME
    if action == 'me' and method == 'GET':
        user_id = qs.get('user_id')
        if not user_id:
            return err('user_id обязателен', 400)
        cur.execute(f"SELECT id, username, email, coins FROM {schema}.users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return err('Пользователь не найден', 404)
        return ok({'user': {'id': user[0], 'username': user[1], 'email': user[2], 'coins': user[3]}})

    return err('Неизвестное действие', 404)
